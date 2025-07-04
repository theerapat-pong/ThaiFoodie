import { sql } from '@vercel/postgres';
import { Clerk } from '@clerk/clerk-sdk-node';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const clerk = Clerk({ secretKey: process.env.CLERK_SECRET_KEY });

export default async function handler(req: VercelRequest, res: VercelResponse) {
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
        SELECT id, role, text_content, recipe_data FROM chat_messages
        WHERE user_id = ${userId}
        ORDER BY created_at ASC;
    `;

    const chatHistory = rows.map(row => ({
        id: String(row.id),
        role: row.role,
        text: row.text_content || '',
        recipe: row.recipe_data,
        isLoading: false,
    }));
    
    res.status(200).json(chatHistory);
  } catch (error) {
    console.error(error);
    res.status(401).json({ error: 'Unauthorized or failed to fetch history' });
  }
}