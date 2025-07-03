import React from 'react';
import { ChatMessage as ChatMessageType } from '../types';
import RecipeCard from './RecipeCard';
import { UserIcon, BotIcon, SpeakerIcon } from './icons';
import { speak } from '../services/speechService';

interface ChatMessageProps {
  message: ChatMessageType;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === 'user';

  const handleSpeak = (e: React.MouseEvent) => {
    e.stopPropagation();
    // ตรรกะการพูดเหมือนเดิม ถูกต้องแล้ว
    const textToSpeak = message.text || (message.recipe ? `สูตรสำหรับ ${message.recipe.dishName}` : '');
    if (textToSpeak) {
      speak(textToSpeak);
    }
  };

  return (
    <div className={`flex items-start gap-3 md:gap-4 animate-fadeInUp ${isUser ? 'justify-end' : ''}`}>
      {!isUser && (
        <div className={`flex-shrink-0 w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center bg-gray-200 border border-gray-300/50 shadow-sm transition-transform duration-500 ${message.isLoading ? 'animate-subtle-pulse' : ''}`}>
          <BotIcon className="w-5 h-5 md:w-6 md:h-6 text-black" />
        </div>
      )}
      <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} w-full max-w-lg`}>
        <div className={`px-4 py-3 rounded-2xl shadow-md transition-all ${isUser ? 'bg-gray-800 text-white rounded-br-none' : 'bg-white text-gray-800 rounded-bl-none border border-gray-200'}`}>
          {message.isLoading && (
              <p className="italic text-gray-500">ThaiFoodie กำลังคิด...</p>
          )}
          {message.image && (
            <img src={message.image} alt="User upload" className="rounded-lg mb-2 max-w-xs max-h-64 object-cover" />
          )}
          
          {/* --- จุดแก้ไขสำคัญ --- */}
          <div className="flex items-start justify-between gap-3">
            {/* ส่วนของข้อความจะแสดงผลถ้ามี text เท่านั้น */}
            {message.text && <p className="whitespace-pre-wrap flex-1">{message.text}</p>}

            {/* ปุ่มจะแสดงผลเสมอถ้าเป็นข้อความจากบอทและไม่กำลังโหลด */}
            {!isUser && !message.isLoading && (
              <button
                onClick={handleSpeak}
                className="p-1 text-gray-400 hover:text-gray-700 transition-colors self-start"
                aria-label="Listen to this message"
                title="ฟังเสียง"
              >
                <SpeakerIcon className="w-4 h-4 flex-shrink-0" />
              </button>
            )}
          </div>
        </div>
        
        {message.recipe && (
          <div className="mt-4 w-full">
            <RecipeCard recipe={message.recipe} />
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