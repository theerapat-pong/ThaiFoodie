// This is a Vercel Edge Function
export const config = {
  runtime: 'edge',
};

// ดึง API Key จาก Environment Variables
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

// สร้าง Type สำหรับข้อมูลวิดีโอที่เราต้องการ
interface YouTubeVideo {
  id: string;
  title: string;
  thumbnail: string;
  channelTitle: string;
}

export default async function handler(req: Request) {
  // ตรวจสอบว่ามี API Key หรือไม่
  if (!YOUTUBE_API_KEY) {
    return new Response(JSON.stringify({ error: 'YouTube API Key is not configured on the server.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // อนุญาตเฉพาะเมธอด POST
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // ดึงชื่ออาหารที่ต้องการค้นหาจาก request body
    const { dishName } = await req.json();
    if (!dishName) {
        return new Response(JSON.stringify({ error: 'dishName is required' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    // สร้าง URL สำหรับเรียก YouTube API
    const query = `วิธีทำ ${dishName}`; // เพิ่ม "วิธีทำ" เพื่อผลลัพธ์ที่ดีขึ้น
    const youtubeApiUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(
      query
    )}&key=${YOUTUBE_API_KEY}&type=video&maxResults=5&videoEmbeddable=true`;

    // เรียก API
    const youtubeResponse = await fetch(youtubeApiUrl);
    if (!youtubeResponse.ok) {
      const errorData = await youtubeResponse.json();
      console.error('YouTube API Error:', errorData);
      return new Response(JSON.stringify({ error: 'Failed to fetch from YouTube API.' }), {
          status: youtubeResponse.status,
          headers: { 'Content-Type': 'application/json' },
      });
    }

    const youtubeData = await youtubeResponse.json();

    // จัดรูปแบบข้อมูลวิดีโอให้อยู่ในรูปแบบที่เราต้องการ
    const videos: YouTubeVideo[] = youtubeData.items.map((item: any) => ({
      id: item.id.videoId,
      title: item.snippet.title,
      thumbnail: item.snippet.thumbnails.high.url, // เลือกภาพขนาดใหญ่
      channelTitle: item.snippet.channelTitle,
    }));

    // ส่งข้อมูลวิดีโอกลับไปให้หน้าบ้าน
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