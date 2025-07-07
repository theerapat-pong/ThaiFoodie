// api/get-conversation-messages.ts
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

        const { conversation_id } = req.query;

        if (!conversation_id) {
            return res.status(400).json({ error: 'Conversation ID is required' });
        }

        const { rows } = await sql`
            SELECT m.id, m.role, m.text_content, m.image, m.recipe_data, m.videos_data 
            FROM chat_messages m
            JOIN conversations c ON m.conversation_id = c.id
            WHERE m.conversation_id = ${conversation_id as string} AND c.user_id = ${userId}
            ORDER BY m.created_at ASC;
        `;

        const chatHistory = rows.map(row => ({
            id: String(row.id),
            role: row.role,
            text: row.text_content || '',
            image: row.image,
            // Directly use the object from the database. Vercel/Postgres already parsed it.
            recipe: row.recipe_data, 
            videos: row.videos_data || [], // Use the parsed object or default to an empty array
            isLoading: false,
        }));
    
        res.status(200).json(chatHistory);
    } catch (error) {
        console.error("Error fetching conversation messages:", error);
        res.status(500).json({ error: 'An internal server error occurred while fetching messages.' });
    }
}