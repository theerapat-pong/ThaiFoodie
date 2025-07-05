import { GoogleGenAI, GenerateContentResponse, Content } from "@google/genai";

// This is a Vercel Edge Function
export const config = {
  runtime: 'edge',
};

const API_KEY = process.env.API_KEY;

const systemInstruction = `You are "ThaiFoodie AI", a friendly and knowledgeable chef specializing in Thai cuisine. Your primary goal is to provide Thai recipes.

**CRITICAL ANALYSIS & RESPONSE RULES:**

1.  **ANALYZE USER INTENT:** Determine if the user is asking for a Thai recipe.
2.  **CHOOSE RESPONSE SCHEMA:** Based on the intent, you MUST respond with ONLY ONE of the following JSON schemas. Your entire response must be a single, raw, perfectly-formed JSON object. **Crucially, there must be no trailing commas in any JSON arrays or objects.**

    * **SCHEMA A: For Thai Recipe Requests**
        If the user wants a Thai recipe, use this schema.
        -   **All JSON *keys* MUST remain in English.**
        -   **All JSON *values* must be ONLY in the user's detected language (Thai or English). Do NOT add English translations in parentheses.** For example, for "dishName", if the user's language is Thai, the value should be "แกงไตปลา", NOT "แกงไตปลา (Gaeng Tai Pla)". For "amount", it should be "1 ถ้วย", NOT "1 ถ้วย (1 cup)".

        \`\`\`json
        {
          "dishName": "The name of the dish in the user's language.",
          "ingredients": [
            { "name": "Ingredient name in user's language", "amount": "Quantity in user's language" }
          ],
          "instructions": [
            "Step 1 in user's language.",
            "Step 2 in user's language."
          ],
          "calories": "Estimated total calorie count as a string, e.g., 'ประมาณ 350-450 kcal'"
        }
        \`\`\`

    * **SCHEMA B: For Other Conversations**
        If the user is not asking for a recipe (e.g., greetings, general questions), use this schema.
        \`\`\`json
        {
          "conversation": "Your friendly, conversational response in the user's language."
        }
        \`\`\`

    * **SCHEMA C: For Errors / Unidentified Dishes**
        If you cannot identify the food as a Thai dish, or the request is unclear, use this schema.
        \`\`\`json
        {
          "error": "A polite message in the user's language explaining the issue."
        }
        \`\`\`
`;


function base64ToGenerativePart(base64: string, mimeType: string) {
  return {
    inlineData: {
      data: base64,
      mimeType,
    },
  };
}

export default async function handler(request: Request) {
  if (!API_KEY) {
     return new Response(JSON.stringify({ error: "API_KEY ไม่ได้ถูกตั้งค่าบนเซิร์ฟเวอร์" }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  
  const ai = new GoogleGenAI({ apiKey: API_KEY });

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { prompt, imageBase64, history } = await request.json();

    const contents: Content[] = (history || [])
      .filter((msg: any) => (msg.role === 'user' || msg.role === 'model') && !msg.isLoading && msg.text)
      .map((msg: any) => ({
        role: msg.role,
        parts: [{ text: msg.text }]
      }));

    if (imageBase64) {
      const imagePart = base64ToGenerativePart(imageBase64.split(',')[1], imageBase64.split(';')[0].split(':')[1]);
      const textPart = { text: prompt };
      contents.push({ role: 'user', parts: [imagePart, textPart] });
    } else {
      contents.push({ role: 'user', parts: [{ text: prompt }] });
    }
    
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: contents,
        config: {
          systemInstruction: systemInstruction,
          responseMimeType: "application/json",
        },
    });

    const responseText = response.text;
    if (!responseText) {
      console.error("Gemini API returned an empty or invalid response.");
      return new Response(JSON.stringify({ error: "ขออภัยค่ะ AI ไม่มีการตอบกลับ ลองอีกครั้งนะคะ" }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
      });
    }

    let jsonStr = responseText.trim();
    
    const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
    const match = jsonStr.match(fenceRegex);
    if (match && match[2]) {
      jsonStr = match[2].trim();
    }
    
    let sanitizedJsonStr = jsonStr
      .replace(/,\s*\]/g, ']')
      .replace(/,\s*\}/g, '}');

    const parsedData = JSON.parse(sanitizedJsonStr);
    
    return new Response(JSON.stringify(parsedData), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
    });

  } catch (e) {
    console.error("Vercel Function Error:", e);
    if (e instanceof SyntaxError) {
        return new Response(JSON.stringify({ error: `ขออภัยค่ะ เกิดข้อผิดพลาดในการอ่านข้อมูลจาก AI (JSON Syntax Error): ${e.message}` }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
    return new Response(JSON.stringify({ error: "ขออภัยค่ะ เกิดข้อผิดพลาดบนเซิร์ฟเวอร์ กรุณาลองใหม่อีกครั้ง" }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
    });
  }
}