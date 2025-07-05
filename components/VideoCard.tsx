import React from 'react';
import { Video } from '../types';

interface VideoCardProps {
  video: Video;
  style?: React.CSSProperties; // เพิ่ม prop สำหรับรับ inline style
}

const VideoCard: React.FC<VideoCardProps> = ({ video, style }) => {
  const videoUrl = `https://www.youtube.com/watch?v=${video.id}`;

  return (
    // เพิ่ม class animate-fadeInUp และรับค่า style เข้ามา
    <a
      href={videoUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="block bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden group animate-fadeInUp"
      style={style}
    >
      <div className="relative">
        <img src={video.thumbnail} alt={video.title} className="w-full h-32 object-cover" loading="lazy"/>
        <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd"></path></svg>
        </div>
      </div>
      <div className="p-3">
        <h4
          className="font-semibold text-gray-800 text-sm leading-tight truncate-2-lines h-10" // h-10 เพื่อจองพื้นที่ 2 บรรทัด
          title={video.title}
        >
          {video.title}
        </h4>
        <p className="text-xs text-gray-500 mt-1 truncate">{video.channelTitle}</p>
      </div>
    </a>
  );
};

export default VideoCard;