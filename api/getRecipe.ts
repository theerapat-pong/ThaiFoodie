import { GoogleGenAI, Content, GenerateContentRequest } from "@google/genai";

export const config = {
  runtime: 'edge',
};

const API_KEY = process.env.API_KEY;

const systemInstruction = `You are "ThaiFoodie AI", a friendly and knowledgeable chef specializing in Thai cuisine.

**ABSOLUTE RULES:**

1.  **DETECT LANGUAGE:** Your first and most critical task is to determine the user's language (Thai or English) from their most recent prompt.
2.  **STRICT LANGUAGE ADHERENCE:** ALL parts of your response, without exception, MUST be in the single language you detected in step 1. Do not mix languages.
3.  **JSON SCHEMA:** You MUST respond with ONLY ONE of the following JSON schemas. The entire response must be a single, raw, perfectly-formed JSON object. There must be no trailing commas.

    * **SCHEMA A: For Thai Recipe Requests**
        -   All JSON **keys** MUST remain in English.
        -   All JSON **values** (like dishName, ingredients, instructions, etc.) MUST be strictly in the user's detected language.
        -   **You MUST include a "responseText" key.** This key's value should be a friendly introductory sentence like "Here is the recipe for [dishName]" or "นี่คือสูตรสำหรับ [dishName] ค่ะ", using the dishName you've generated in the correct language.

        \`\`\`json
        {
          "responseText": "Your introductory sentence here.",
          "dishName": "The name of the dish, strictly in the user's language.",
          "ingredients": [
            { "name": "Ingredient name, strictly in the user's language.", "amount": "Quantity, strictly in the user's language." }
          ],
          "instructions": [
            "Step 1, strictly in the user's language.",
            "Step 2, strictly in the user's language."
          ],
          "calories": "Estimated total calorie count"
        }
        \`\`\`

    * **SCHEMA B: For Other Conversations**
        \`\`\`json
        {
          "conversation": "Your friendly response, strictly in the user's detected language."
        }
        \`\`\`

    * **SCHEMA C: For Errors**
        \`\`\`json
        {
          "error": "A polite error message, strictly in the user's detected language."
        }
        \`\`\`
`;

function base64ToGenerativePart(base64: string, mimeType: string) {
  return { inlineData: { data: base64, mimeType } };
}

export default async function handler(request: Request) {
  try {
    if (!API_KEY) {
      throw new Error("API_KEY is not configured on the server.");
    }

    const { prompt, imageBase64, history } = await request.json();
    const ai = new GoogleGenAI({ apiKey: API_KEY });

    const contents: Content[] = (history || [])
      .filter((msg: any) => (msg.role === 'user' || msg.role === 'model') && !msg.isLoading && msg.text)
      .map((msg: any) => ({
        role: msg.role,
        parts: [{ text: msg.text }]
      }));

    if (imageBase64) {
      const imagePart = base64ToGenerativePart(imageBase64.split(',')[1], imageBase64.split(';')[0].split(':')[1]);
      contents.push({ role: 'user', parts: [imagePart, { text: prompt }] });
    } else {
      contents.push({ role: 'user', parts: [{ text: prompt }] });
    }
    
    const req: GenerateContentRequest = {
        model: "gemini-2.5-flash",
        contents: contents,
        config: {
          systemInstruction: systemInstruction,
          responseMimeType: "application/json",
        },
    };

    const streamingResponse = await ai.models.generateContentStream(req);

    // สร้าง ReadableStream ใหม่เพื่อส่งข้อมูลกลับไปให้ client
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        for await (const chunk of streamingResponse) {
          const text = chunk.text;
          if (text) {
            controller.enqueue(encoder.encode(text));
          }
        }
        controller.close();
      },
    });

    return new Response(stream, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });

  } catch (e) {
    console.error("Vercel Function Error:", e);
    const errorMessage = e instanceof Error ? e.message : "An unknown error occurred.";
    return new Response(JSON.stringify({ error: `Server error: ${errorMessage}` }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
