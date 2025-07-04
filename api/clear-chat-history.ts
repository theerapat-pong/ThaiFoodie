// api/clear-chat-history.ts

import { sql } from '@vercel/postgres';
import { Clerk } from '@clerk/clerk-sdk-node';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const clerk = Clerk({ secretKey: process.env.CLERK_SECRET_KEY });

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // เราจะใช้เมธอด DELETE สำหรับการลบข้อมูล
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

        // สั่งลบข้อความทั้งหมดที่ user_id ตรงกัน
        await sql`DELETE FROM chat_messages WHERE user_id = ${userId};`;

        res.status(200).json({ success: true, message: 'Chat history cleared.' });
    } catch (error) {
        console.error("Clear chat history error:", error);
        res.status(500).json({ error: 'Failed to clear chat history' });
    }
}