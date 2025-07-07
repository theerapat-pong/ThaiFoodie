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

        const { userMessage, modelMessage, conversationId }: { userMessage: ChatMessage, modelMessage: ChatMessage, conversationId: number | null } = req.body;
        
        let currentConversationId = conversationId;

        // 1. If conversationId does not exist, create a new conversation
        if (!currentConversationId) {
            // Use the user's first message as the title
            const title = userMessage.text.substring(0, 50) + (userMessage.text.length > 50 ? '...' : '');
            const newConversationResult = await sql`
                INSERT INTO conversations (user_id, title)
                VALUES (${userId}, ${title})
                RETURNING id;
            `;
            currentConversationId = newConversationResult.rows[0].id;
        }

        // 2. Save the User's message with the conversation_id
        await sql`
            INSERT INTO chat_messages (user_id, role, text_content, image, conversation_id)
            VALUES (${userId}, 'user', ${userMessage.text}, ${userMessage.image || null}, ${currentConversationId});
        `;
        
        // 3. Save the Model's message with the conversation_id and return the new ID
        const result = await sql`
            INSERT INTO chat_messages (user_id, role, text_content, recipe_data, videos_data, conversation_id)
            VALUES (${userId}, 'model', ${modelMessage.text}, ${modelMessage.recipe ? JSON.stringify(modelMessage.recipe) : null}, ${modelMessage.videos ? JSON.stringify(modelMessage.videos) : null}, ${currentConversationId})
            RETURNING id;
        `;

        const newModelMessageId = result.rows[0].id;

        // 4. Send back the new message ID and the conversation ID
        res.status(200).json({ 
            success: true, 
            newModelMessageId: newModelMessageId,
            conversationId: currentConversationId 
        });

    } catch (error) {
        console.error("Save chat error:", error);
        res.status(500).json({ error: 'Failed to save chat message' });
    }
}