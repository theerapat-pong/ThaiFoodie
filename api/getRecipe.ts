import { GoogleGenAI, GenerateContentResponse, Content } from "@google/genai";

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
        -   All JSON **values** (like dishName, ingredients, instructions, etc.) MUST be strictly in the user's detected language. For example, if the user asks in English for "Pad Krapow", the dishName MUST be "Pad Krapow", NOT "ผัดกระเพรา". If they ask in Thai, it MUST be "ผัดกระเพรา".
        -   **You MUST include a "responseText" key. This key's value should be a friendly introductory sentence like "Here is the recipe for [dishName]" or "นี่คือสูตรสำหรับ [dishName] ค่ะ", using the dishName you've generated in the correct language.**

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
          "calories": "Estimated total calorie count, e.g., 'ประมาณ 350-450 kcal' or 'Approx. 350-450 kcal'"
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

async function fetchVideos(dishName: string, lang: string): Promise<any[]> {
    if (!process.env.YOUTUBE_API_KEY) {
        console.error("YouTube API Key is not configured.");
        return [];
    }
    try {
        const queryPrefix = (lang === 'th' || !lang) ? 'วิธีทำ' : 'How to make';
        const query = `${queryPrefix} ${dishName}`;

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

    const body = await request.json();
    const { prompt, imageBase64, history, lang } = body;

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
        // ใช้ responseText จาก AI โดยตรง
        streamData.text = parsedData.responseText;
        // ---- END: โค้ดที่แก้ไข ----
        
        streamData.recipe = parsedData;
        streamData.videos = await fetchVideos(parsedData.dishName, lang);
    }
    
    return createStreamingResponse(streamData);

  } catch (e) {
    console.error("Vercel Function Error:", e);
    console.error("Problematic AI response text:", responseText);
    const errorMessage = e instanceof Error ? e.message : "An unknown error occurred.";
    return new Response(JSON.stringify({ error: `ขออภัยค่ะ เกิดข้อผิดพลาดบนเซิร์ฟเวอร์: ${errorMessage}` }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
