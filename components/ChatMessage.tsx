import React, { useState, useEffect } from 'react';
import { ChatMessage as ChatMessageType } from '../types';
import RecipeCard from './RecipeCard';
import { UserIcon, BotIcon } from './icons';
import Loader from './Loader';
import VideoCard from './VideoCard';

interface ChatMessageProps {
  message: ChatMessageType;
  t: (key: string) => string;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, t }) => {
  const isUser = message.role === 'user';
  
  const [showVideos, setShowVideos] = useState(false);

  useEffect(() => {
    if (message.videos && message.videos.length > 0 && !showVideos) {
      const timer = setTimeout(() => {
        setShowVideos(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [message.videos, showVideos]);

  return (
    <div className={`flex items-start gap-3 md:gap-4 animate-fadeInUp w-full ${isUser ? 'justify-end' : 'items-start'}`}>
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center bg-gray-200 border border-gray-300/50 shadow-sm">
          <BotIcon className="w-5 h-5 md:w-6 md:h-6 text-black" />
        </div>
      )}

      <div className={`flex flex-col w-full ${isUser ? 'items-end' : 'items-start'}`}>
        
        {/* ส่วนที่ 1: กล่องข้อความ และ สูตรอาหาร (จำกัดความกว้าง) */}
        <div className="w-full max-w-lg">
          <div className={`px-4 py-3 rounded-2xl shadow-md ${isUser ? 'bg-gray-800 text-white rounded-br-none' : 'bg-white text-gray-800 rounded-bl-none border border-gray-200'}`}>
            {message.isLoading ? (
              <div className="w-48">
                <p className="italic text-gray-500 mb-2">{t('thinking')}</p>
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
            <div className="mt-4 w-full animate-fadeInUp">
              <RecipeCard recipe={message.recipe} t={t} />
            </div>
          )}
        </div>

        {/* ส่วนที่ 2: วิดีโอ Carousel (ไม่จำกัดความกว้าง) */}
        {showVideos && message.videos && message.videos.length > 0 && (
            <div className="mt-4 w-full">
                <h3 className="text-lg font-semibold text-gray-800 mb-3 text-left animate-fadeInUp max-w-lg">วิดีโอสอนทำอาหารที่เกี่ยวข้อง</h3>
                <div className="flex overflow-x-auto space-x-4 pb-4 custom-scrollbar">
                    {message.videos.map((video: any, index: number) => (
                        <div key={video.id} className="flex-shrink-0 w-56">
                          <VideoCard 
                            video={video}
                            style={{ animationDelay: `${index * 100}ms` }}
                          />
                        </div>
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