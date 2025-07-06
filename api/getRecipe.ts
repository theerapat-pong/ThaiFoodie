import { GoogleGenAI, Content, GenerateContentRequest, SystemInstruction } from "@google/genai";

export const config = {
  runtime: 'edge',
};

const API_KEY = process.env.API_KEY;

// --- START: โค้ดที่แก้ไข ---
// ปรับปรุง System Instruction ให้กระชับและชัดเจนขึ้น
const systemInstruction: SystemInstruction = {
  role: "model",
  parts: [{
    text: `You are "ThaiFoodie AI", a friendly and knowledgeable chef specializing in Thai cuisine.

**Core Directives:**
1.  **Language First:** Always detect the user's language (Thai or English) from their latest prompt. Your entire response MUST be in that single language.
2.  **Strict JSON Output:** You MUST ONLY respond with a single, raw, perfectly-formed JSON object. No markdown, no extra text. Keys must be in English.

**Response Schemas (Choose ONE):**

* **A) Recipe Found:** If the user asks for a Thai recipe, use this schema. All string values must be in the detected user language.
    \`\`\`json
    {
      "responseText": "A friendly intro, e.g., 'Here is the recipe for [Dish Name].' or 'นี่คือสูตรสำหรับ [ชื่ออาหาร] ค่ะ'",
      "dishName": "Dish name",
      "ingredients": [ { "name": "Ingredient name", "amount": "Quantity" } ],
      "instructions": [ "Step 1", "Step 2" ],
      "calories": "Estimated total calories (e.g., '550 kcal')"
    }
    \`\`\`

* **B) No Recipe / Conversation:** For greetings, non-recipe questions, or if you can't find a recipe.
    \`\`\`json
    {
      "conversation": "Your conversational response in the user's language."
    }
    \`\`\`

* **C) Error:** If the request is unclear or invalid.
    \`\`\`json
    {
       "error": "A polite error message in the user's language."
    }
    \`\`\`
`
  }]
};
// --- END: โค้ดที่แก้ไข ---

function base64ToGenerativePart(base64: string, mimeType: string) {
  return { inlineData: { data: base64, mimeType } };
}

export default async function handler(request: Request) {
  try {
    if (!API_KEY) {
      throw new Error("API_KEY is not configured on the server.");
    }

    const { prompt, imageBase64, history } = await request.json();
    const genAI = new GoogleGenAI(API_KEY);

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

    const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        systemInstruction,
        generationConfig: {
            responseMimeType: "application/json",
        }
    });

    const result = await model.generateContentStream(contents);

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        for await (const chunk of result.stream) {
          const text = chunk.text();
          if (text) {
            controller.enqueue(encoder.encode(text));
          }
        }
        controller.close();
      },
    });

    return new Response(stream, {
      headers: { "Content-Type": "application/json; charset=utf-8" },
    });

  } catch (e) {
    console.error("Vercel Function Error:", e);
    const errorMessage = e instanceof Error ? e.message : "An unknown error occurred.";
    return new Response(JSON.stringify({ error: `Server error: ${errorMessage}` }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}