// src/components/ChatMessage.tsx (ฉบับแก้ไข)

import React from 'react';
import { ChatMessage as ChatMessageType } from '../types';
import RecipeCard from './RecipeCard';
import { UserIcon, BotIcon } from './icons';
import Loader from './Loader'; // Import Loader ที่เราแก้ไขแล้ว

interface ChatMessageProps {
  message: ChatMessageType;
  t: (key: string) => string;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, t }) => {
  const isUser = message.role === 'user';

  return (
    <div className={`flex items-start gap-3 md:gap-4 animate-fadeInUp ${isUser ? 'justify-end' : ''}`}>
      {!isUser && (
        <div className={`flex-shrink-0 w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center bg-gray-200 border border-gray-300/50 shadow-sm`}>
          <BotIcon className="w-5 h-5 md:w-6 md:h-6 text-black" />
        </div>
      )}
      <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} w-full max-w-lg`}>
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
          <div className="mt-4 w-full">
            <RecipeCard recipe={message.recipe} t={t} />
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