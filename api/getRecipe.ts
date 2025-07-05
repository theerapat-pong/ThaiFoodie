import { GoogleGenAI, GenerateContentResponse, Content } from "@google/genai";

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
        -   **All JSON *values* must be ONLY in the user's detected language (Thai or English). Do NOT add English translations in parentheses.**

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

// ฟังก์ชันสำหรับสร้าง Streaming Response
function createStreamingResponse(data: any): Response {
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      // ส่งข้อมูลส่วนที่เป็นข้อความ (text) ก่อน
      if (data.text) {
        controller.enqueue(encoder.encode(data.text));
      }
      
      // ---- START: โค้ดที่แก้ไข ----
      // เพิ่มระยะเวลาหน่วงเป็น 700 มิลลิวินาที
      await new Promise(resolve => setTimeout(resolve, 700));
      // ---- END: โค้ดที่แก้ไข ----

      // ส่งข้อมูลส่วนที่เป็น object (recipe, videos) เป็นก้อนสุดท้าย
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

// ฟังก์ชันสำหรับค้นหาวิดีโอ
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
  if (!API_KEY) {
    return new Response(JSON.stringify({ error: "API_KEY ไม่ได้ถูกตั้งค่าบนเซิร์ฟเวอร์" }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405, headers: { 'Content-Type': 'application/json' } });
  }

  try {
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
    
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: contents,
        config: {
          systemInstruction: systemInstruction,
          responseMimeType: "application/json",
        },
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error("AI returned an empty response.");
    }

    let jsonStr = responseText.trim().replace(/^```(\w*\s)?/, '').replace(/```$/, '');
    let sanitizedJsonStr = jsonStr.replace(/,\s*([}\]])/g, "$1");
    const parsedData = JSON.parse(sanitizedJsonStr);

    let streamData: any = {};

    if (parsedData.error) {
        streamData.text = parsedData.error;
    } else if (parsedData.conversation) {
        streamData.text = parsedData.conversation;
    } else {
        streamData.text = `นี่คือสูตรสำหรับ ${parsedData.dishName} ค่ะ`;
        streamData.recipe = parsedData;
        streamData.videos = await fetchVideos(parsedData.dishName);
    }
    
    return createStreamingResponse(streamData);

  } catch (e) {
    console.error("Vercel Function Error:", e);
    const errorMessage = e instanceof Error ? e.message : "An unknown error occurred.";
    return new Response(JSON.stringify({ error: `ขออภัยค่ะ เกิดข้อผิดพลาดบนเซิร์ฟเวอร์: ${errorMessage}` }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}