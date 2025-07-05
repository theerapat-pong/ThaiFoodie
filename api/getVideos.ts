import type { VercelRequest, VercelResponse } from '@vercel/node';

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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // ตรวจสอบว่ามี API Key หรือไม่
  if (!YOUTUBE_API_KEY) {
    return res.status(500).json({ error: 'YouTube API Key is not configured on the server.' });
  }

  // อนุญาตเฉพาะเมธอด POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // ดึงชื่ออาหารที่ต้องการค้นหาจาก request body
    const { dishName } = await req.body;
    if (!dishName) {
      return res.status(400).json({ error: 'dishName is required' });
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
      return res.status(youtubeResponse.status).json({ error: 'Failed to fetch from YouTube API.' });
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
    return res.status(200).json(videos);

  } catch (e) {
    console.error('getVideos Error:', e);
    return res.status(500).json({ error: 'An internal server error occurred.' });
  }
}