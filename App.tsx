import React, { useState, useRef, useEffect, useCallback, useMemo, Suspense, lazy } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { UserButton, useAuth, useUser, SignedIn, SignedOut } from '@clerk/clerk-react';
import { LogIn } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { ChatMessage as ChatMessageType, Recipe, Video } from './types';
import { getRecipeForDish } from './services/geminiService';
import ChatInput from './components/ChatInput';
import ChatMessage from './components/ChatMessage';
import { LogoIcon } from './components/icons';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from "@vercel/speed-insights/react";
import LanguageSwitcher from './components/LanguageSwitcher';
import Loader from './components/Loader';

const SignInPage = lazy(() => import('@clerk/clerk-react').then(module => ({ default: module.SignIn })));
const SignUpPage = lazy(() => import('@clerk/clerk-react').then(module => ({ default: module.SignUp })));

const ChatInterface: React.FC = () => {
    const { t, i18n } = useTranslation();
    const [chatHistory, setChatHistory] = useState<ChatMessageType[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const chatEndRef = useRef<HTMLDivElement>(null);
    const { isSignedIn, getToken } = useAuth();
    const { user } = useUser();

    const examplePrompts = useMemo(() => {
        const prompts = t('example_prompts', { returnObjects: true });
        return Array.isArray(prompts) ? prompts : [];
    }, [t]);

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
        setChatHistory([]);
        if (isSignedIn) {
            const token = await getToken();
            if (!token) return;
            try {
                await fetch('/api/clear-chat-history', {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
            } catch (error) {
                console.error("Error calling clear-chat-history API:", error);
            }
        }
    };

    const fetchVideos = async (dishName: string): Promise<Video[]> => {
        try {
            const response = await fetch('/api/getVideos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ dishName }),
            });
            if (response.ok) {
                return await response.json();
            }
            return [];
        } catch (error) {
            console.error("Failed to fetch videos:", error);
            return [];
        }
    };

    const handleSendMessage = useCallback(async (inputText: string, imageBase64: string | null = null) => {
        if (!inputText.trim() && !imageBase64) return;

        const userMessage: ChatMessageType = { id: 'user-' + Date.now(), role: 'user', text: inputText, image: imageBase64 || undefined };
        const modelLoadingMessage: ChatMessageType = { id: 'model-loading-' + Date.now(), role: 'model', text: '', isLoading: true };
        const historyForApi = [...chatHistory];

        setChatHistory(prev => [...prev, userMessage, modelLoadingMessage]);
        setIsLoading(true);

        try {
            const result = await getRecipeForDish(inputText, imageBase64, historyForApi);
            let finalModelMessage: ChatMessageType;

            if ('error' in result) {
                finalModelMessage = { id: 'model-' + Date.now(), role: 'model', text: result.error, error: result.error };
            } else if ('conversation' in result) {
                finalModelMessage = { id: 'model-' + Date.now(), role: 'model', text: result.conversation };
            } else {
                const recipeResult = result as Recipe;
                const fetchedVideos = await fetchVideos(recipeResult.dishName);
                
                finalModelMessage = { 
                    id: 'model-' + Date.now(), 
                    role: 'model', 
                    text: t('recipe_for', { dishName: recipeResult.dishName }), 
                    recipe: recipeResult,
                    videos: fetchedVideos 
                };
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
            const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
            const errorResponseMessage: ChatMessageType = { 
                id: 'model-error-' + Date.now(), 
                role: 'model', 
                text: `Sorry, ${errorMessage}`,
                error: 'API call failed' 
            };
            setChatHistory(prev => prev.map(msg => msg.id === modelLoadingMessage.id ? errorResponseMessage : msg));
        } finally {
            setIsLoading(false);
        }
    }, [isSignedIn, getToken, t, chatHistory]);

    return (
        <>
            <header className="fixed top-0 left-0 right-0 bg-white/40 backdrop-blur-[24px] z-10 border-b border-black/10">
                <div className="max-w-3xl mx-auto px-4 py-3">
                    <div className="flex items-center justify-between">
                        <Link to="/" className="flex items-center space-x-3">
                            <LogoIcon className="w-8 h-8" />
                            <h1 className="text-2xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-br from-black to-gray-700">ThaiFoodie</h1>
                        </Link>
                        <div className="flex items-center gap-4">
                            <LanguageSwitcher />
                            {chatHistory.length > 0 && (
                              <button onClick={handleClearHistory} className="text-xs text-gray-500 hover:text-red-600 transition-colors px-3 py-1 rounded-md bg-gray-200/50 hover:bg-red-100/80" title={t('clear_history')}>
                                {t('clear_history')}
                              </button>
                            )}
                            <SignedIn> <UserButton afterSignOutUrl="/" /> </SignedIn>
                            <SignedOut>
                              <Link 
                                to="/sign-in" 
                                className="flex items-center gap-2 text-sm font-semibold text-white bg-gray-800 rounded-lg px-4 py-2 hover:bg-black transition-colors shadow-sm"
                              >
                                <LogIn className="w-4 h-4" />
                                <span>Sign In</span>
                              </Link>
                            </SignedOut>
                        </div>
                    </div>
                </div>
            </header>

            <main className="flex-1 flex flex-col pt-24 pb-44 md:pb-48">
                <div className="max-w-3xl w-full mx-auto px-4 flex-1 overflow-y-auto">
                    {chatHistory.length === 0 && !isLoading && (
                        <div className="flex flex-col items-center justify-center h-full text-center text-gray-600 animate-fadeInUp">
                            <LogoIcon className="w-12 h-12 md:w-16 md:h-16 mb-4" />
                            <p className="text-2xl font-semibold">
                                {isSignedIn && user?.firstName ? t('greeting_signed_in', { firstName: user.firstName }) : t('greeting_signed_out')}
                            </p>
                            <p className="mt-2 text-md text-gray-500">{t('headline')}</p>
                            <p className="mt-4 text-sm max-w-sm text-gray-500">{t('subheadline')}</p>
                            <div className="mt-6 flex flex-wrap justify-center gap-2">
                                {examplePrompts.map((prompt) => (
                                    <button key={prompt} onClick={() => handleSendMessage(prompt)} className="bg-white/80 text-sm text-gray-700 px-4 py-2 rounded-full border border-gray-300 hover:bg-gray-200 transition-colors">{prompt}</button>
                                ))}
                            </div>
                        </div>
                    )}
                    <div className="space-y-6">
                        {chatHistory.map((msg) => ( <ChatMessage key={msg.id} message={msg} t={t} /> ))}
                        <div ref={chatEndRef} />
                    </div>
                </div>
            </main>
            
             <footer className="fixed bottom-0 left-0 right-0">
                <div className="bg-white/40 backdrop-blur-[24px] border-t border-black/10">
                    <div className="max-w-3xl mx-auto">
                        <div className="p-4">
                            <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} t={t} />
                        </div>
                        <div className="text-center pb-2 pt-1 text-xs text-gray-500">
                             <div className="flex justify-center items-center space-x-2 md:space-x-4 flex-wrap px-4">
                                <span>{t('copyright')}</span>
                                <span className="hidden md:inline">|</span>
                                <a href={i18n.language.startsWith('th') ? '/terms-of-service.html' : '/terms-of-service.en.html'} className="underline hover:text-black">
                                    {t('terms_of_service')}
                                </a>
                                <span>|</span>
                                <a href={i18n.language.startsWith('th') ? '/privacy-policy.html' : '/privacy-policy.en.html'} className="underline hover:text-black">
                                    {t('privacy_policy')}
                                </a>
                                 <span className="hidden md:inline">|</span>
                                <a href="mailto:info@thaifoodie.site" className="underline hover:text-black">
                                    {t('contact_us')}
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </footer>
        </>
    );
};

const App: React.FC = () => {
    const fallbackUI = (
      <div className="flex justify-center items-center h-screen">
        <Loader />
      </div>
    );

    return (
        <div className="bg-gradient-to-br from-gray-50 to-gray-200 text-black min-h-screen flex flex-col font-sans">
            <Analytics />
            <SpeedInsights />
            <Suspense fallback={fallbackUI}>
                <Routes>
                    <Route path="/" element={<ChatInterface />} />
                    <Route 
                        path="/sign-in/*" 
                        element={<div className="flex justify-center items-center h-screen"><SignInPage routing="path" path="/sign-in" afterSignInUrl="/" /></div>} 
                    />
                    <Route 
                        path="/sign-up/*" 
                        element={<div className="flex justify-center items-center h-screen"><SignUpPage routing="path" path="/sign-up" afterSignUpUrl="/" /></div>} 
                    />
                </Routes>
            </Suspense>
        </div>
    );
};

export default App;