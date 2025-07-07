import { sql } from '@vercel/postgres';
import { Clerk } from '@clerk/clerk-sdk-node';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const clerk = Clerk({ secretKey: process.env.CLERK_SECRET_KEY });

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'DELETE') {
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

        const { conversationId } = req.body;

        if (!conversationId) {
            return res.status(400).json({ error: 'Conversation ID is required' });
        }

        // Use a transaction to ensure both deletes succeed or fail together
        const client = await sql.connect();
        try {
            await client.query('BEGIN');
            // First, delete messages associated with the conversation
            await client.query(`DELETE FROM chat_messages WHERE conversation_id = $1 AND user_id = $2;`, [conversationId, userId]);
            // Then, delete the conversation itself
            const result = await client.query(`DELETE FROM conversations WHERE id = $1 AND user_id = $2;`, [conversationId, userId]);
            await client.query('COMMIT');

            if (result.rowCount === 0) {
                // This means the conversation didn't exist or didn't belong to the user
                return res.status(404).json({ error: 'Conversation not found or not owned by user' });
            }
            
            res.status(200).json({ success: true, message: 'Conversation deleted.' });
        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error("Delete conversation error:", error);
        res.status(500).json({ error: 'Failed to delete conversation' });
    }
}