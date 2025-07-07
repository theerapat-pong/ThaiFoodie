import { sql } from '@vercel/postgres';
import { Clerk } from '@clerk/clerk-sdk-node';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const clerk = Clerk({ secretKey: process.env.CLERK_SECRET_KEY });

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ error: "Authorization header is missing" });
        }
        const token = authHeader.split(' ')[1];
        
        const claims = await clerk.verifyToken(token);
        if (!claims.sub) {
            return res.status(401).json({ error: "Invalid token or user ID" });
        }
        const userId = claims.sub;

        const { rows } = await sql`
            SELECT id, title, created_at FROM conversations
            WHERE user_id = ${userId}
            ORDER BY created_at DESC;
        `;

        const conversations = rows.map(row => ({
            id: row.id,
            title: row.title,
            createdAt: row.created_at,
        }));
        
        res.status(200).json(conversations);
    } catch (error) {
        console.error(error);
        res.status(401).json({ error: 'Unauthorized or failed to fetch conversations' });
    }
}