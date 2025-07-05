import type { NextApiRequest, NextApiResponse } from 'next';

// This is a Vercel Edge Function
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
    const { dishName } = await req.json();
    if (!dishName) {
        return new Response(JSON.stringify({ error: 'dishName is required' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    const query = `วิธีทำ ${dishName}`;
    const youtubeApiUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(
      query
    )}&key=${YOUTUBE_API_KEY}&type=video&maxResults=5&videoEmbeddable=true`;

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