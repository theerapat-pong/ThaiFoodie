import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChatMessage as ChatMessageType, Recipe } from './types';
import { getRecipeForDish } from './services/geminiService';
import ChatInput from './components/ChatInput';
import ChatMessage from './components/ChatMessage';
import { LogoIcon } from './components/icons';
import { Analytics } from '@vercel/analytics/react'; // 1. เพิ่มบรรทัดนี้

const App: React.FC = () => {
  const [chatHistory, setChatHistory] = useState<ChatMessageType[]>(() => {
    try {
      const savedHistory = localStorage.getItem('chatHistory');
      return savedHistory ? JSON.parse(savedHistory) : [];
    } catch (error) {
      console.error("Failed to parse chat history", error);
      return [];
    }
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory]);

  useEffect(() => {
    const historyToSave = chatHistory.map(msg => {
      const { image, ...rest } = msg;
      return rest;
    });
    localStorage.setItem('chatHistory', JSON.stringify(historyToSave));
  }, [chatHistory]);
  
  const handleSendMessage = useCallback(async (inputText: string, imageBase64: string | null) => {
    if (!inputText.trim() && !imageBase64) return;
    setIsLoading(true);

    const userMessageId = Date.now().toString();
    const userMessage: ChatMessageType = {
      id: userMessageId,
      role: 'user',
      text: inputText,
      image: imageBase64 || undefined,
    };
    
    setChatHistory(prev => [...prev, userMessage]);

    const modelLoadingMessageId = (Date.now() + 1).toString();
    const modelLoadingMessage: ChatMessageType = {
      id: modelLoadingMessageId,
      role: 'model',
      text: '',
      isLoading: true
    };
    setChatHistory(prev => [...prev, modelLoadingMessage]);

    const prompt = inputText;
    
    const result = await getRecipeForDish(prompt, imageBase64);

    let finalModelMessage: ChatMessageType;

    if ('error' in result) {
       finalModelMessage = {
          id: modelLoadingMessageId,
          role: 'model',
          text: result.error,
          error: result.error
       };
    } else if ('conversation' in result) {
        finalModelMessage = {
            id: modelLoadingMessageId,
            role: 'model',
            text: result.conversation
        };
    }
    else {
      finalModelMessage = {
          id: modelLoadingMessageId,
          role: 'model',
          text: `นี่คือสูตรสำหรับ ${result.dishName} ค่ะ`,
          recipe: result as Recipe
      };
    }

    setChatHistory(prev => prev.map(msg => msg.id === modelLoadingMessageId ? finalModelMessage : msg));
    setIsLoading(false);
  }, []);

  const handleClearHistory = () => {
    setChatHistory([]);
    localStorage.removeItem('chatHistory');
  };

  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-200 text-black min-h-screen flex flex-col font-sans">
      <Analytics /> {/* 2. เพิ่มบรรทัดนี้ */}
      <header className="fixed top-0 left-0 right-0 bg-white/70 backdrop-blur-lg z-10 border-b border-black/10">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <LogoIcon className="w-8 h-8" />
              <h1 className="text-2xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-br from-black to-gray-700">
                ThaiFoodie
              </h1>
            </div>
            {chatHistory.length > 0 && (
              <button 
                onClick={handleClearHistory}
                className="text-xs text-gray-500 hover:text-red-600 transition-colors px-3 py-1 rounded-md bg-gray-200/50 hover:bg-red-100/80"
                title="ล้างประวัติ"
              >
                ล้างประวัติ
              </button>
            )}
          </div>
        </div>
      </header>
      
      <main className="flex-1 flex flex-col pt-24 pb-32 md:pb-36">
        <div className="max-w-3xl w-full mx-auto px-4 flex-1 overflow-y-auto">
           {chatHistory.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center text-gray-600 animate-fadeInUp">
                <p className="text-lg">ยินดีต้อนรับสู่ ThaiFoodie!</p>
                <p className="mt-2 text-sm max-w-sm">พิมพ์ชื่ออาหารไทย (เช่น "ต้มยำกุ้ง" หรือ "ผัดไทย") หรือจะทักทายพูดคุยกับฉันก็ได้นะ</p>
            </div>
           )}
          <div className="space-y-6">
            {chatHistory.map((msg) => (
              <ChatMessage key={msg.id} message={msg} />
            ))}
            <div ref={chatEndRef} />
          </div>
        </div>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 bg-white/70 backdrop-blur-lg border-t border-black/10">
        <div className="max-w-3xl mx-auto p-4">
          <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
        </div>
      </footer>
    </div>
  );
};

export default App;