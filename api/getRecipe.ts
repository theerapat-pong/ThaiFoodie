import { GoogleGenAI, GenerateContentResponse, Content } from "@google/genai";

export const config = {
  runtime: 'edge',
};

const API_KEY = process.env.API_KEY;

const systemInstruction = `You are "ThaiFoodie AI", a friendly and knowledgeable chef specializing in Thai cuisine. Your primary goal is to provide Thai recipes.

**CRITICAL ANALYSIS & RESPONSE RULES:**

1.  **DETECT USER'S LANGUAGE:** First, you MUST detect the language from the user's most recent message. Your entire response must be in that detected language (Thai or English).
2.  **ANALYZE USER INTENT:** Determine if the user is asking for a Thai recipe.
3.  **CHOOSE RESPONSE SCHEMA:** Based on the intent, you MUST respond with ONLY ONE of the following JSON schemas. Your entire response must be a single, raw, perfectly-formed JSON object. **Crucially, there must be no trailing commas in any JSON arrays or objects.**

    * **SCHEMA A: For Thai Recipe Requests**
        If the user wants a Thai recipe, use this schema.
        -   **All JSON *keys* MUST remain in English.**
        -   **All JSON *values* must be ONLY in the language you detected in step 1. Do NOT add translations in parentheses.**

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
  return { inlineData: { data: base64, mimeType } };
}

function createStreamingResponse(data: any): Response {
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      if (data.text) {
        controller.enqueue(encoder.encode(data.text));
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));

      const dataPayload = {
        recipe: data.recipe,
        videos: data.videos,
      };
      controller.enqueue(encoder.encode('---DATA---' + JSON.stringify(dataPayload)));
      
      controller.close();
    },
  });

  return new Response(stream, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}

async function fetchVideos(dishName: string): Promise<any[]> {
    if (!process.env.YOUTUBE_API_KEY) {
        console.error("YouTube API Key is not configured.");
        return [];
    }
    try {
        const query = `วิธีทำ ${dishName}`;
        const youtubeApiUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&key=${process.env.YOUTUBE_API_KEY}&type=video&maxResults=5&videoEmbeddable=true`;
        const youtubeResponse = await fetch(youtubeApiUrl);
        if (youtubeResponse.ok) {
            const youtubeData = await youtubeResponse.json();
            return youtubeData.items.map((item: any) => ({
                id: item.id.videoId,
                title: item.snippet.title,
                thumbnail: item.snippet.thumbnails.high.url,
                channelTitle: item.snippet.channelTitle,
            }));
        }
        return [];
    } catch (error) {
        console.error("Failed to fetch videos:", error);
        return [];
    }
}


export default async function handler(request: Request) {
  let responseText = ""; 
  try {
    if (!API_KEY) {
      throw new Error("API_KEY ไม่ได้ถูกตั้งค่าบนเซิร์ฟเวอร์");
    }

    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405, headers: { 'Content-Type': 'application/json' } });
    }

    // ---- START: โค้ดที่แก้ไข ----
    // อ่าน request body ทั้งหมดเพียงครั้งเดียว
    const body = await request.json();
    const { prompt, imageBase64, history, lang } = body;
    // ---- END: โค้ดที่แก้ไข ----

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
    
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: contents,
        config: {
          systemInstruction: systemInstruction,
          responseMimeType: "application/json",
        },
    });

    responseText = response.text; 
    if (!responseText) {
      throw new Error("AI returned an empty response.");
    }

    let jsonStr = responseText
      .trim()
      .replace(/^```(json)?\s*/, '')
      .replace(/```$/, '');

    const sanitizedJsonStr = jsonStr.replace(/,\s*(?=[}\]])/g, '');
    
    const parsedData = JSON.parse(sanitizedJsonStr);

    let streamData: any = {};
    
    if (parsedData.error) {
        streamData.text = parsedData.error;
    } else if (parsedData.conversation) {
        streamData.text = parsedData.conversation;
    } else {
        // ---- START: โค้ดที่แก้ไข ----
        // ตรวจสอบภาษา (lang) ที่ส่งมาจาก Frontend ก่อนสร้างข้อความ
        streamData.text = (lang === 'th' || !lang) // ถ้าไม่มี lang ให้ใช้ภาษาไทยเป็นค่าเริ่มต้น
            ? `นี่คือสูตรสำหรับ ${parsedData.dishName} ค่ะ` 
            : `Here is the recipe for ${parsedData.dishName}`;
        // ---- END: โค้ดที่แก้ไข ----

        streamData.recipe = parsedData;
        streamData.videos = await fetchVideos(parsedData.dishName);
    }
    
    return createStreamingResponse(streamData);

  } catch (e) {
    console.error("Vercel Function Error:", e);
    console.error("Problematic AI response text:", responseText);
    const errorMessage = e instanceof Error ? e.message : "An unknown error occurred.";
    return new Response(JSON.stringify({ error: `ขออภัยค่ะ เกิดข้อผิดพลาดบนเซิร์ฟเวอร์: ${errorMessage}` }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
