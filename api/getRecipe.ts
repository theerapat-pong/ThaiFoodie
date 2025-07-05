import { GoogleGenAI, GenerateContentResponse, Content } from "@google/genai";

// This is a Vercel Edge Function
export const config = {
  runtime: 'edge',
};

const API_KEY = process.env.API_KEY;

const systemInstruction = `You are "ThaiFoodie AI", a friendly and knowledgeable chef specializing in Thai cuisine. Your primary goal is to provide Thai recipes, but you can also engage in friendly, general conversation.

**CRITICAL ANALYSIS & RESPONSE RULES:**

1.  **ANALYZE USER INTENT:** First, determine the user's primary intent. Is it:
    a) A request for a **Thai recipe** (by name, description, or image)?
    b) A **general conversation** (greeting, question about you, small talk, any non-recipe topic)?
    c) An **unidentifiable food request** or gibberish?

2.  **CHOOSE RESPONSE SCHEMA:** Based on the intent, you MUST respond with ONLY ONE of the following JSON schemas. Your entire response must be a single, raw, perfectly-formed JSON object starting with \`{\` and ending with \`}\`. Do not add any text before or after the JSON.

    * **SCHEMA A: For Recipe Requests**
        If the user wants a Thai recipe, use this schema. All *values* must be in the user's detected language (Thai or English). All *keys* must remain in English.
        \`\`\`json
        {
          "dishName": "The name of the dish",
          "ingredients": [
            { "name": "Ingredient Name", "amount": "Quantity" }
          ],
          "instructions": [
            "Step-by-step instruction 1.",
            "Step-by-step instruction 2."
          ],
          "calories": "Estimated total calorie count (e.g., '550 kcal')"
        }
        \`\`\`

    * **SCHEMA B: For General Conversation**
        If the user is not asking for a recipe, use this schema for friendly conversation. The response value must be in the user's language.
        \`\`\`json
        {
          "conversation": "Your friendly, conversational response here. For example: 'สวัสดีค่ะ มีอะไรให้ช่วยไหมคะ' or 'I'm doing well, thank you for asking!'"
        }
        \`\`\`

    * **SCHEMA C: For Errors / Unidentified Dishes**
        If you cannot identify the food as a Thai dish, or the request is unclear, use this schema.
        The error message must be a polite sentence in the user's language, explaining that the request was not understood.
        \`\`\`json
        {
          "error": "A polite message in the user's language explaining that the dish was not found or the query was not understood."
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
    
    // จัดการกรณีที่ Gemini อาจจะส่ง JSON มาในรูปแบบ Markdown code block
    const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
    const match = jsonStr.match(fenceRegex);
    if (match && match[2]) {
      jsonStr = match[2].trim();
    }
    
    // ---- START: โค้ดที่แก้ไข ----
    // เพิ่มขั้นตอน "ทำความสะอาด" JSON ก่อนการ Parse
    // ลบ trailing commas ที่อาจทำให้เกิด SyntaxError
    let sanitizedJsonStr = jsonStr
      .replace(/,\s*\]/g, ']')  // ลบ comma ก่อน ]
      .replace(/,\s*\}/g, '}'); // ลบ comma ก่อน }

    const parsedData = JSON.parse(sanitizedJsonStr);
    // ---- END: โค้ดที่แก้ไข ----
    
    return new Response(JSON.stringify(parsedData), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
    });

  } catch (e) {
    console.error("Vercel Function Error:", e);
    // เพิ่มการตรวจสอบประเภทของ Error เพื่อให้ได้ข้อมูลที่ละเอียดขึ้น
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