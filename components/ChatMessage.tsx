import React, { useState } from 'react'; // เพิ่ม useState
import { ChatMessage as ChatMessageType } from '../types';
import RecipeCard from './RecipeCard';
import { UserIcon, BotIcon, VideoIcon } from './icons'; // เพิ่ม VideoIcon
import Loader from './Loader';
import VideoCard from './VideoCard';

interface ChatMessageProps {
  message: ChatMessageType;
  t: (key: string) => string;
  // เพิ่ม Prop สำหรับเรียกฟังก์ชันจาก App.tsx
  onFetchVideos: (messageId: string, dishName: string) => void;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, t, onFetchVideos }) => {
  const isUser = message.role === 'user';
  
  // State สำหรับจัดการการโหลดวิดีโอของข้อความนี้โดยเฉพาะ
  const [isFetchingVideos, setIsFetchingVideos] = useState(false);

  const handleFetchClick = async () => {
    if (!message.recipe?.dishName) return;
    setIsFetchingVideos(true);
    await onFetchVideos(message.id, message.recipe.dishName);
    setIsFetchingVideos(false);
  };

  return (
    <div className={`flex items-start gap-3 md:gap-4 w-full ${isUser ? 'justify-end animate-fadeInUp' : 'items-start animate-popUp'}`}>
      {!isUser && (
        <div className={`flex-shrink-0 w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center bg-gray-200 border border-gray-300/50 shadow-sm`}>
          <BotIcon className="w-5 h-5 md:w-6 md:h-6 text-black" />
        </div>
      )}
      <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} w-full max-w-lg`}>
        <div className={`px-4 py-3 rounded-2xl shadow-md ${isUser ? 'bg-gray-800 text-white rounded-br-none' : 'bg-white text-gray-800 rounded-bl-none border border-gray-200'}`}>
          
          {message.isLoading && !message.text ? (
            <div className="flex items-center space-x-2">
              <p className="italic text-gray-500">{t('thinking')}</p>
              <Loader />
            </div>
          ) : (
            <>
              {message.image && <img src={message.image} alt="User upload" className="rounded-lg mb-2 max-w-xs max-h-64 object-cover" loading="lazy" />}
              {message.text && <p className="whitespace-pre-wrap">{message.text}</p>}
            </>
          )}

        </div>
        
        {message.recipe && (
          <div className="mt-4 w-full">
            <RecipeCard recipe={message.recipe} t={t} />

            {/* ---- START: โค้ดที่เพิ่มสำหรับปุ่มขอวิดีโอ ---- */}
            {/* ถ้ายังไม่มีวิดีโอ ให้แสดงปุ่มนี้ */}
            {!message.videos && (
              <div className="mt-4">
                <button
                  onClick={handleFetchClick}
                  disabled={isFetchingVideos}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg shadow-md hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-wait transition-colors"
                >
                  {isFetchingVideos ? (
                    <>
                      <Loader />
                      <span>กำลังค้นหาวิดีโอ...</span>
                    </>
                  ) : (
                    <>
                      <VideoIcon className="w-5 h-5" />
                      <span>แสดงวิดีโอแนะนำ</span>
                    </>
                  )}
                </button>
              </div>
            )}
            {/* ---- END: โค้ดที่เพิ่มสำหรับปุ่มขอวิดีโอ ---- */}
          </div>
        )}
        
        {message.videos && message.videos.length > 0 && (
            <div className="mt-4 w-full">
                <h3 className="text-lg font-semibold text-gray-800 mb-3 text-left">{t('related_videos_title')}</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {message.videos.map((video: any) => (
                        <VideoCard key={video.id} video={video} />
                    ))}
                </div>
            </div>
        )}

      </div>
      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 md:w-10 md:h-10 rounded-full bg-gray-800 flex items-center justify-center border border-gray-900 shadow-md">
          <UserIcon className="w-5 h-5 md:w-6 md:h-6 text-white" />
        </div>
      )}
    </div>
  );
};

export default ChatMessage;
