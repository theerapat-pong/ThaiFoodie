// src/App.tsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { SignIn, SignUp, UserButton, useAuth, SignedIn, SignedOut } from '@clerk/clerk-react';

import { ChatMessage as ChatMessageType, Recipe } from './types';
import { getRecipeForDish } from './services/geminiService';
import ChatInput from './components/ChatInput';
import ChatMessage from './components/ChatMessage';
import { LogoIcon } from './components/icons';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from "@vercel/speed-insights/react";

const ChatInterface: React.FC = () => {
    const [chatHistory, setChatHistory] = useState<ChatMessageType[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const chatEndRef = useRef<HTMLDivElement>(null);
    const { isSignedIn, getToken } = useAuth();

    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };
    useEffect(scrollToBottom, [chatHistory]);

    useEffect(() => {
        if (isSignedIn) {
            const fetchHistory = async () => {
                const token = await getToken();
                if (!token) return;
                const response = await fetch('/api/get-chat-history', { headers: { 'Authorization': `Bearer ${token}` } });
                if (response.ok) {
                    const data: ChatMessageType[] = await response.json();
                    setChatHistory(data);
                } else {
                    setChatHistory([]);
                }
            };
            fetchHistory();
        } else {
            setChatHistory([]);
        }
    }, [isSignedIn, getToken]);
    
    const handleClearHistory = async () => {
        // TODO: ในอนาคตสามารถสร้าง API สำหรับลบประวัติใน DB ของผู้ใช้ที่ล็อกอินได้
        setChatHistory([]);
    };

    const handleSendMessage = useCallback(async (inputText: string, imageBase64: string | null = null) => {
        if (!inputText.trim() && !imageBase64) return;

        const userMessage: ChatMessageType = { id: 'user-' + Date.now(), role: 'user', text: inputText, image: imageBase64 || undefined };
        const modelLoadingMessage: ChatMessageType = { id: 'model-loading-' + Date.now(), role: 'model', text: '', isLoading: true };

        setChatHistory(prev => [...prev, userMessage, modelLoadingMessage]);
        setIsLoading(true);

        try {
            const result = await getRecipeForDish(inputText, imageBase64);
            let finalModelMessage: ChatMessageType;

            if ('error' in result) {
                finalModelMessage = { id: 'model-' + Date.now(), role: 'model', text: result.error, error: result.error };
            } else if ('conversation' in result) {
                finalModelMessage = { id: 'model-' + Date.now(), role: 'model', text: result.conversation };
            } else {
                finalModelMessage = { id: 'model-' + Date.now(), role: 'model', text: `นี่คือสูตรสำหรับ ${result.dishName} ค่ะ`, recipe: result as Recipe };
            }

            setChatHistory(prev => prev.map(msg => msg.id === modelLoadingMessage.id ? finalModelMessage : msg));
            
            if (isSignedIn) {
                const token = await getToken();
                if (token) {
                    await fetch('/api/save-chat', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                        body: JSON.stringify({ userMessage, modelMessage: finalModelMessage })
                    });
                }
            }

        } catch (error) {
            console.error("Error during API call:", error);
            const errorResponseMessage: ChatMessageType = { id: 'model-error-' + Date.now(), role: 'model', text: 'ขออภัยค่ะ มีข้อผิดพลาดเกิดขึ้น', error: 'API call failed' };
            setChatHistory(prev => prev.map(msg => msg.id === modelLoadingMessage.id ? errorResponseMessage : msg));
        } finally {
            setIsLoading(false);
        }
    }, [isSignedIn, getToken]);

    const examplePrompts = ["วิธีทำต้มยำกุ้ง", "ขอสูตรผัดไทยหน่อย", "แกงเขียวหวานใส่อะไรบ้าง"];

    return (
        <>
            <header className="fixed top-0 left-0 right-0 bg-white/70 backdrop-blur-lg z-10 border-b border-black/10">
                <div className="max-w-3xl mx-auto px-4 py-3">
                    <div className="flex items-center justify-between">
                        <Link to="/" className="flex items-center space-x-3">
                            <LogoIcon className="w-8 h-8" />
                            <h1 className="text-2xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-br from-black to-gray-700">ThaiFoodie</h1>
                        </Link>
                        <div className="flex items-center gap-4">
                            {chatHistory.length > 0 && (
                              <button onClick={handleClearHistory} className="text-xs text-gray-500 hover:text-red-600 transition-colors px-3 py-1 rounded-md bg-gray-200/50 hover:bg-red-100/80" title="ล้างประวัติ">ล้างประวัติ</button>
                            )}
                            <SignedIn> <UserButton afterSignOutUrl="/" /> </SignedIn>
                            <SignedOut> <Link to="/sign-in" className="text-sm font-semibold hover:text-gray-700">Sign In to Save History</Link> </SignedOut>
                        </div>
                    </div>
                </div>
            </header>

            <main className="flex-1 flex flex-col pt-24 pb-44 md:pb-48">
                <div className="max-w-3xl w-full mx-auto px-4 flex-1 overflow-y-auto">
                    {chatHistory.length === 0 && !isLoading && (
                        <div className="flex flex-col items-center justify-center h-full text-center text-gray-600 animate-fadeInUp">
                            <LogoIcon className="w-16 h-16 mb-4" />
                            <p className="text-lg">สวัสดีครับ! ให้ ThaiFoodie ช่วยคุณค้นหาสูตรอาหารไทยวันนี้</p>
                            <p className="mt-2 text-sm max-w-sm text-gray-500">พิมพ์ชื่ออาหาร, อัปโหลดรูป, หรือลองใช้ตัวอย่างด้านล่างได้เลย</p>
                            <div className="mt-6 flex flex-wrap justify-center gap-2">
                                {examplePrompts.map((prompt) => (
                                    <button key={prompt} onClick={() => handleSendMessage(prompt)} className="bg-white/80 text-sm text-gray-700 px-4 py-2 rounded-full border border-gray-300 hover:bg-gray-200 transition-colors">{prompt}</button>
                                ))}
                            </div>
                        </div>
                    )}
                    <div className="space-y-6">
                        {chatHistory.map((msg) => ( <ChatMessage key={msg.id} message={msg} /> ))}
                        <div ref={chatEndRef} />
                    </div>
                </div>
            </main>

            <footer className="fixed bottom-0 left-0 right-0">
                <div className="bg-white/70 backdrop-blur-lg border-t border-black/10">
                    <div className="max-w-3xl mx-auto p-4">
                        <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
                    </div>
                </div>
                <div className="text-center pb-2 pt-1 text-xs text-gray-400 bg-gray-100/50">
                    <p>สงวนลิขสิทธิ์ © 2025 ThaiFoodie. สร้างโดย ThaiFoodie Developer. <a href="mailto:info@thaifoodie.site" className="underline hover:text-black">ติดต่อเรา</a></p>
                </div>
            </footer>
        </>
    );
};

const App: React.FC = () => {
    return (
        <div className="bg-gradient-to-br from-gray-50 to-gray-200 text-black min-h-screen flex flex-col font-sans">
            <Analytics />
            <SpeedInsights />
            <Routes>
                <Route path="/" element={<ChatInterface />} />
                <Route path="/sign-in/*" element={<div className="flex justify-center items-center h-screen"><SignIn routing="path" path="/sign-in" afterSignInUrl="/" /></div>} />
                <Route path="/sign-up/*" element={<div className="flex justify-center items-center h-screen"><SignUp routing="path" path="/sign-up" afterSignUpUrl="/" /></div>} />
            </Routes>
        </div>
    );
};

export default App;