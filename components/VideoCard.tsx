import React from 'react';

// สร้าง Type สำหรับ Props ที่จะรับเข้ามา
interface Video {
  id: string;
  title: string;
  thumbnail: string;
  channelTitle: string;
}

interface VideoCardProps {
  video: Video;
}

const VideoCard: React.FC<VideoCardProps> = ({ video }) => {
  // สร้าง URL สำหรับเปิดวิดีโอบน YouTube
  const videoUrl = `https://www.youtube.com/watch?v=${video.id}`;

  return (
    <a
      href={videoUrl}
      target="_blank" // เปิดในแท็บใหม่
      rel="noopener noreferrer"
      className="block bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden group"
    >
      <div className="relative">
        <img src={video.thumbnail} alt={video.title} className="w-full h-40 object-cover" loading="lazy"/>
        <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd"></path></svg>
        </div>
      </div>
      <div className="p-4">
        <h4
          className="font-semibold text-gray-800 text-sm leading-tight truncate-2-lines"
          title={video.title} // แสดง title เต็มๆ ตอนเอาเมาส์ไปชี้
        >
          {video.title}
        </h4>
        <p className="text-xs text-gray-500 mt-2">{video.channelTitle}</p>
      </div>
    </a>
  );
};

// CSS สำหรับตัดข้อความ 2 บรรทัด (เพิ่มใน index.html หรือไฟล์ CSS หลัก)
// .truncate-2-lines {
//   display: -webkit-box;
//   -webkit-line-clamp: 2;
//   -webkit-box-orient: vertical;
//   overflow: hidden;
// }

export default VideoCard;