export const config = {
  runtime: 'edge',
};

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

interface YouTubeVideo {
  id: string;
  title: string;
  thumbnail: string;
  channelTitle: string;
}

export default async function handler(req: Request) {
  if (!YOUTUBE_API_KEY) {
    return new Response(JSON.stringify({ error: 'YouTube API Key is not configured on the server.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { dishName, lang } = await req.json();
    if (!dishName) {
        return new Response(JSON.stringify({ error: 'dishName is required' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    // --- START: โค้ดที่แก้ไข ---
    // ปรับปรุง query ให้รองรับภาษาอังกฤษได้ดีขึ้น
    const query = lang === 'th' ? `วิธีทำ ${dishName}` : `how to cook ${dishName}`;
    const youtubeApiUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(
      query
    )}&key=${YOUTUBE_API_KEY}&type=video&maxResults=6&videoEmbeddable=true&relevanceLanguage=${lang}`;
    // --- END: โค้ดที่แก้ไข ---

    const youtubeResponse = await fetch(youtubeApiUrl);
    
    // --- START: โค้ดที่แก้ไข ---
    // เพิ่มการจัดการ Error ให้รัดกุมขึ้น
    if (!youtubeResponse.ok) {
      const errorBody = await youtubeResponse.text(); // อ่านเป็น text ก่อน
      let errorMessage = `Failed to fetch from YouTube API. Status: ${youtubeResponse.status}`;
      try {
          const errorJson = JSON.parse(errorBody);
          errorMessage = errorJson.error?.message || errorMessage;
      } catch (parseError) {
          // ถ้า body ไม่ใช่ JSON ให้ใช้ข้อความจาก errorBody
          errorMessage = `${errorMessage}. Response: ${errorBody}`;
      }
      console.error('YouTube API Error:', errorMessage);
      return new Response(JSON.stringify({ error: errorMessage }), {
          status: youtubeResponse.status,
          headers: { 'Content-Type': 'application/json' },
      });
    }
    // --- END: โค้ดที่แก้ไข ---

    const youtubeData = await youtubeResponse.json();

    const videos: YouTubeVideo[] = youtubeData.items.map((item: any) => ({
      id: item.id.videoId,
      title: item.snippet.title,
      thumbnail: item.snippet.thumbnails.high.url,
      channelTitle: item.snippet.channelTitle,
    }));

    return new Response(JSON.stringify(videos), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
    });

  } catch (e) {
    console.error('getVideos Error:', e);
    return new Response(JSON.stringify({ error: 'An internal server error occurred.' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
    });
  }
}