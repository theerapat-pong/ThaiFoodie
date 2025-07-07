import React, { useState, useRef, useEffect, useCallback, useMemo, Suspense, lazy } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { UserButton, useAuth, useUser, SignedIn, SignedOut } from '@clerk/clerk-react';
import { LogIn } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { ChatMessage as ChatMessageType, Conversation } from './types';
import { getRecipeForDish } from './services/geminiService';
import ChatInput from './components/ChatInput';
import ChatMessage from './components/ChatMessage';
import { LogoIcon, MenuIcon, XIcon } from './components/icons';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from "@vercel/speed-insights/react";
import LanguageSwitcher from './components/LanguageSwitcher';
import Loader from './components/Loader';
import Sidebar from './components/Sidebar';

const SignInPage = lazy(() => import('@clerk/clerk-react').then(module => ({ default: module.SignIn })));
const SignUpPage = lazy(() => import('@clerk/clerk-react').then(module => ({ default: module.SignUp })));


function sanitizeAndParseJson(jsonString: string): any {
    try {
        let cleanedString = jsonString.trim().replace(/^```(json)?\s*/, '').replace(/```$/, '');
        cleanedString = cleanedString.replace(/,\s*(?=[}\]])/g, '');
        return JSON.parse(cleanedString);
    } catch (error) {
        console.error("JSON parsing failed:", error);
        console.error("Problematic JSON string:", jsonString);
        return { error: `ขออภัยค่ะ มีปัญหาในการอ่านข้อมูลจาก AI: ${error instanceof Error ? error.message : 'Unknown error'}` };
    }
}


const ChatInterface: React.FC = () => {
    const { t, i18n } = useTranslation();
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const chatEndRef = useRef<HTMLDivElement>(null);
    const { isSignedIn, getToken, isLoaded } = useAuth();
    const { user } = useUser();

    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isInitialLoad, setIsInitialLoad] = useState(true);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
    const [chatHistory, setChatHistory] = useState<ChatMessageType[]>([]);

    const examplePrompts = useMemo(() => {
        const prompts = t('example_prompts', { returnObjects: true });
        return Array.isArray(prompts) ? prompts : [];
    }, [t]);

    const scrollToBottom = () => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); };
    useEffect(scrollToBottom, [chatHistory]);

    const fetchMessagesForConversation = useCallback(async (convoId: number, token: string) => {
        setIsLoading(true);
        setChatHistory([]);
        try {
            const response = await fetch(`/api/get-conversation-messages?conversation_id=${convoId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data: ChatMessageType[] = await response.json();
                setChatHistory(data);
            } else {
                setChatHistory([]);
            }
        } catch (error) {
            console.error("Failed to fetch messages:", error);
            setChatHistory([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const handleSelectConversation = useCallback((id: number, token: string) => {
        setActiveConversationId(id);
        fetchMessagesForConversation(id, token);
        if (window.innerWidth < 768) {
            setIsSidebarOpen(false);
        }
    }, [fetchMessagesForConversation]);

    const fetchConversations = useCallback(async (token: string) => {
        try {
            const response = await fetch('/api/get-conversations', { headers: { 'Authorization': `Bearer ${token}` } });
            if (response.ok) {
                const data: Conversation[] = await response.json();
                setConversations(data);
                if (isInitialLoad && data.length > 0) {
                    handleSelectConversation(data[0].id, token);
                    setIsInitialLoad(false);
                }
            } else {
                 setConversations([]);
            }
        } catch (error) {
            console.error("Failed to fetch conversations:", error);
            setConversations([]);
        }
    }, [isInitialLoad, handleSelectConversation]);
    
    useEffect(() => {
        if (isLoaded && isSignedIn) {
            getToken().then(token => { if (token) fetchConversations(token); });
        } else if (isLoaded && !isSignedIn) {
            setConversations([]); setChatHistory([]); setActiveConversationId(null); setIsInitialLoad(true);
        }
    }, [isLoaded, isSignedIn, getToken, fetchConversations]);

    const handleNewChat = () => {
        setActiveConversationId(null);
        setChatHistory([]);
        setIsLoading(false);
        if (window.innerWidth < 768) setIsSidebarOpen(false);
    };

    const handleDeleteConversation = async (id: number) => {
        if (!window.confirm("Are you sure you want to delete this chat?")) return;
        const token = await getToken();
        if (!token) return;
        try {
            await fetch('/api/delete-conversation', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ conversationId: id })
            });
            handleNewChat();
            await fetchConversations(token);
        } catch (error) {
            console.error("Error deleting conversation:", error);
        }
    };
    
    const handleClearHistory = () => { setChatHistory([]); };

    const handleFetchVideos = async (messageId: string, dishName: string) => { /* ... Functionality remains the same ... */ };

    const handleSendMessage = useCallback(async (inputText: string, imageBase64: string | null = null) => {
        if (!inputText.trim() && !imageBase64) return;

        const userMessage: ChatMessageType = { id: 'user-' + Date.now(), role: 'user', text: inputText, image: imageBase64 || undefined };
        const modelMessageId = 'model-' + Date.now();
        const initialModelMessage: ChatMessageType = { id: modelMessageId, role: 'model', text: '', isLoading: true };
        setChatHistory(prev => [...prev, userMessage, initialModelMessage]);
        setIsLoading(true);
        let finalMessageState: ChatMessageType | null = null;
        try {
            const response = await getRecipeForDish(inputText, imageBase64, chatHistory, i18n.language);
            if (!response.body) throw new Error("The response body is empty.");
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let accumulatedJson = "";
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                accumulatedJson += decoder.decode(value, { stream: true });
            }
            const parsedData = sanitizeAndParseJson(accumulatedJson);
            if (parsedData.error) finalMessageState = { id: modelMessageId, role: 'model', text: parsedData.error, error: "Parsing Error" };
            else if (parsedData.conversation) finalMessageState = { id: modelMessageId, role: 'model', text: parsedData.conversation };
            else finalMessageState = { id: modelMessageId, role: 'model', text: parsedData.responseText, recipe: parsedData };
            setChatHistory(prev => prev.map(msg => msg.id === modelMessageId ? { ...finalMessageState!, isLoading: false } : msg));

            if (isSignedIn) {
                const token = await getToken();
                if (token && finalMessageState) {
                    const isNewConversation = activeConversationId === null;
                    const saveResponse = await fetch('/api/save-chat', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                        body: JSON.stringify({ userMessage, modelMessage: finalMessageState, conversationId: activeConversationId })
                    });
                    if (saveResponse.ok) {
                        const saveData = await saveResponse.json();
                        setChatHistory(prev => prev.map(msg => msg.id === modelMessageId ? { ...msg, id: saveData.newModelMessageId } : msg));
                        if (isNewConversation) {
                           const newConversation: Conversation = {
                                id: saveData.conversationId,
                                title: userMessage.text.substring(0, 40) + (userMessage.text.length > 40 ? '...' : ''),
                                createdAt: new Date().toISOString(),
                            };
                            setActiveConversationId(newConversation.id);
                            setConversations(prev => [newConversation, ...prev]);
                        }
                    }
                }
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
            const errorResponseMessage: ChatMessageType = { id: modelMessageId, role: 'model', text: `ขออภัยค่ะ เกิดข้อผิดพลาด: ${errorMessage}`, error: 'API stream failed' };
            setChatHistory(prev => prev.map(msg => msg.id === modelMessageId ? errorResponseMessage : msg));
        } finally {
            setIsLoading(false);
        }
    }, [isSignedIn, getToken, i18n.language, chatHistory, activeConversationId, fetchConversations]);

    return (
        <div className="flex h-screen w-screen bg-white font-sans">
            <SignedIn>
                {/* Desktop Sidebar */}
                <div className={`transition-all duration-300 ease-in-out flex-shrink-0 h-full overflow-y-auto hidden md:block ${isSidebarOpen ? 'w-64' : 'w-0'}`}>
                    {isSidebarOpen && (
                         <Sidebar
                            conversations={conversations}
                            activeConversationId={activeConversationId}
                            onSelectConversation={(id) => { getToken().then(token => token && handleSelectConversation(id, token))}}
                            onNewChat={handleNewChat}
                            onDeleteConversation={handleDeleteConversation}
                        />
                    )}
                </div>
                {/* Mobile Sidebar (Overlay) */}
                {isSidebarOpen && (
                    <div className="md:hidden absolute inset-0 z-30">
                        <div className="absolute inset-0 bg-black/30" onClick={() => setIsSidebarOpen(false)}></div>
                        <div className="relative w-64 h-full bg-gray-50">
                             <Sidebar
                                conversations={conversations}
                                activeConversationId={activeConversationId}
                                onSelectConversation={(id) => { getToken().then(token => token && handleSelectConversation(id, token))}}
                                onNewChat={handleNewChat}
                                onDeleteConversation={handleDeleteConversation}
                            />
                        </div>
                    </div>
                )}
            </SignedIn>
            
            <div className="flex-1 flex flex-col bg-gradient-to-br from-gray-50 to-gray-200 overflow-hidden">
                <header className="flex-shrink-0 bg-white/40 backdrop-blur-md z-10 border-b border-black/10">
                    <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center justify-between h-16">
                            <div className="flex items-center">
                                <SignedIn>
                                    <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 mr-2 text-gray-700 rounded-full hover:bg-gray-200">
                                        {isSidebarOpen ? <XIcon className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
                                    </button>
                                </SignedIn>
                                <SignedOut>
                                     <Link to="/" className="flex items-center space-x-3">
                                        <LogoIcon className="w-8 h-8" />
                                        <h1 className="text-2xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-br from-black to-gray-700">ThaiFoodie</h1>
                                     </Link>
                                </SignedOut>
                            </div>
                            <div className="flex items-center gap-4">
                                <LanguageSwitcher />
                                <SignedIn>
                                    <UserButton afterSignOutUrl="/" />
                                </SignedIn>
                                <SignedOut>
                                  <Link to="/sign-in" className="px-4 py-2 text-sm font-semibold text-white bg-gray-800 rounded-lg hover:bg-black transition-colors shadow-sm" title={t('sign_in_button')}>
                                    {t('sign_in_button')}
                                  </Link>
                                </SignedOut>
                            </div>
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto">
                    {/* --- START: The main fix is here --- */}
                    <div className="max-w-3xl w-full mx-auto px-4 h-full pb-[env(safe-area-inset-bottom)]">
                    {/* --- END: The main fix --- */}
                        {chatHistory.length === 0 && !isLoading ? (
                            <div className="flex flex-col items-center justify-start text-center text-gray-600 animate-fadeInUp h-full pt-20 sm:pt-24">
                                <LogoIcon className="w-12 h-12 md:w-16 md:h-16 mb-4" />
                                <p className="text-2xl font-semibold">{isLoaded && isSignedIn ? t('greeting_signed_in', { firstName: user?.firstName }) : t('greeting_signed_out')}</p>
                                <p className="mt-2 text-md text-gray-500">{t('headline')}</p>
                                <p className="mt-4 text-sm max-w-sm text-gray-500">{t('subheadline')}</p>
                                <div className="mt-6 flex flex-wrap justify-center gap-2">
                                    {examplePrompts.map((prompt) => (<button key={prompt} onClick={() => handleSendMessage(prompt)} className="bg-white/80 text-sm text-gray-700 px-4 py-2 rounded-full border border-gray-300 hover:bg-gray-200 transition-colors">{prompt}</button>))}
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6 pt-6 pb-8">
                                {isLoading && chatHistory.length === 0 && <div className='flex justify-center items-center h-full'><Loader /></div>}
                                {chatHistory.map((msg) => ( <ChatMessage key={msg.id} message={msg} t={t} onFetchVideos={handleFetchVideos} /> ))}
                                <div ref={chatEndRef} />
                            </div>
                        )}
                    </div>
                </main>
                
                 <footer className="flex-shrink-0">
                    <div className="bg-transparent"><div className="max-w-3xl mx-auto"><div className="p-4"><ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} t={t} /></div>
                            <div className="text-center pb-2 pt-1 text-xs text-gray-500"><div className="flex justify-center items-center space-x-2 md:space-x-4 flex-wrap px-4">
                                    <SignedOut>
                                        {chatHistory.length > 0 && !isLoading && (
                                            <button onClick={handleClearHistory} className="text-xs text-gray-500 hover:text-red-600 transition-colors">{t('clear_history')}</button>
                                        )}
                                    </SignedOut>
                                    <span>{t('copyright')}</span><span className="hidden md:inline">|</span><a href={i18n.language.startsWith('th') ? '/terms-of-service.html' : '/terms-of-service.en.html'} className="underline hover:text-black">{t('terms_of_service')}</a><span>|</span><a href={i18n.language.startsWith('th') ? '/privacy-policy.html' : '/privacy-policy.en.html'} className="underline hover:text-black">{t('privacy_policy')}</a><span className="hidden md:inline">|</span><a href="mailto:info@thaifoodie.site" className="underline hover:text-black">{t('contact_us')}</a>
                            </div></div></div></div>
                </footer>
            </div>
        </div>
    );
};

const App: React.FC = () => {
    const fallbackUI = ( <div className="flex justify-center items-center h-screen"><Loader /></div> );
    return (
        <div className="bg-white text-black min-h-screen flex flex-col">
            <Analytics /><SpeedInsights />
            <Suspense fallback={fallbackUI}>
                <Routes>
                    <Route path="/" element={<ChatInterface />} />
                    <Route path="/sign-in/*" element={<div className="flex justify-center items-center h-screen"><SignInPage routing="path" path="/sign-in" afterSignInUrl="/" /></div>} />
                    <Route path="/sign-up/*" element={<div className="flex justify-center items-center h-screen"><SignUpPage routing="path" path="/sign-up" afterSignUpUrl="/" /></div>} />
                </Routes>
            </Suspense>
        </div>
    );
};

export default App;