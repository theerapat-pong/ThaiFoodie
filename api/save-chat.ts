// api/save-chat.ts
import { sql } from '@vercel/postgres';
import { Clerk } from '@clerk/clerk-sdk-node';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ChatMessage } from '../types';

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

        const { userMessage, modelMessage }: { userMessage: ChatMessage, modelMessage: ChatMessage } = req.body;
        const userEmailResult = await clerk.users.getUser(userId);
        const userEmail = userEmailResult.emailAddresses[0]?.emailAddress;

        // บันทึก user ลงตาราง users ถ้ายังไม่มี
        await sql`INSERT INTO users (id, email) VALUES (${userId}, ${userEmail}) ON CONFLICT (id) DO NOTHING;`;

        // บันทึกข้อความจาก user
        await sql`
            INSERT INTO chat_messages (user_id, role, text_content)
            VALUES (${userId}, 'user', ${userMessage.text});
        `;

        // บันทึกข้อความจาก AI
        await sql`
            INSERT INTO chat_messages (user_id, role, text_content, recipe_data)
            VALUES (${userId}, 'model', ${modelMessage.text}, ${modelMessage.recipe ? JSON.stringify(modelMessage.recipe) : null});
        `;

        res.status(200).json({ success: true });
    } catch (error) {
        console.error("Save chat error:", error);
        res.status(500).json({ error: 'Failed to save chat message' });
    }
}