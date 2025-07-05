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
        
        // เราไม่จำเป็นต้องดึง email ทุกครั้งที่บันทึก สามารถลบส่วนนี้ออกเพื่อประสิทธิภาพที่ดีขึ้นได้
        // const userEmailResult = await clerk.users.getUser(userId);
        // const userEmail = userEmailResult.emailAddresses...

        // บันทึกข้อความจาก User
        await sql`
            INSERT INTO chat_messages (user_id, role, text_content, image)
            VALUES (${userId}, 'user', ${userMessage.text}, ${userMessage.image || null});
        `;
        
        // ---- START: โค้ดที่แก้ไข ----
        // บันทึกข้อความจาก Model และสั่งให้คืนค่า ID ที่สร้างใหม่
        const result = await sql`
            INSERT INTO chat_messages (user_id, role, text_content, recipe_data, videos_data)
            VALUES (${userId}, 'model', ${modelMessage.text}, ${modelMessage.recipe ? JSON.stringify(modelMessage.recipe) : null}, ${modelMessage.videos ? JSON.stringify(modelMessage.videos) : null})
            RETURNING id;
        `;

        const newId = result.rows[0].id;

        // ส่ง ID ใหม่ที่ได้จากฐานข้อมูลกลับไป
        res.status(200).json({ success: true, newId: newId });
        // ---- END: โค้ดที่แก้ไข ----

    } catch (error) {
        console.error("Save chat error:", error);
        res.status(500).json({ error: 'Failed to save chat message' });
    }
}
