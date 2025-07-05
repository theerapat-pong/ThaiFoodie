import { sql } from '@vercel/postgres';
import { Clerk } from '@clerk/clerk-sdk-node';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const clerk = Clerk({ secretKey: process.env.CLERK_SECRET_KEY });

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
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

        // รับ messageId และ videos จาก body
        const { messageId, videos } = req.body;

        if (!messageId || !videos) {
            return res.status(400).json({ error: 'Missing messageId or videos data' });
        }

        // อัปเดตข้อมูลวิดีโอในฐานข้อมูล
        await sql`
            UPDATE chat_messages
            SET videos_data = ${JSON.stringify(videos)}
            WHERE id = ${messageId} AND user_id = ${userId};
        `;

        res.status(200).json({ success: true });
    } catch (error) {
        console.error("Update chat error:", error);
        res.status(500).json({ error: 'Failed to update chat message' });
    }
}
