import React, { useState, useRef } from 'react';
// แก้ไข: เปลี่ยนจาก PaperAirplaneTilt เป็น Send
import { Send, Image as ImageIcon } from 'lucide-react';

interface ChatInputProps {
    onSendMessage: (message: string, imageBase64: string | null) => void;
    isLoading: boolean;
    t: (key: string, options?: any) => string;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isLoading, t }) => {
    const [inputText, setInputText] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        setInputText(event.target.value);
        // Auto-resize textarea
        event.target.style.height = 'auto';
        event.target.style.height = `${event.target.scrollHeight}px`;
    };

    const handleSendMessage = () => {
        if (!isLoading && (inputText.trim() || imagePreview)) {
            onSendMessage(inputText.trim(), imagePreview);
            setInputText('');
            setImageFile(null);
            setImagePreview(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            handleSendMessage();
        }
    };

    const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveImage = () => {
        setImageFile(null);
        setImagePreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className="glass-effect-input relative flex items-start space-x-2 rounded-2xl border border-white/20 p-2 transition-all duration-300 focus-within:border-white/40 focus-within:shadow-2xl">
            {imagePreview && (
                <div className="relative flex-shrink-0">
                    <img src={imagePreview} alt="Preview" className="h-10 w-10 rounded-lg object-cover" />
                    <button onClick={handleRemoveImage} className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-black/70 text-white transition-transform hover:scale-110">
                        &times;
                    </button>
                </div>
            )}
            <div className="relative flex-grow">
                <textarea
                    value={inputText}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    rows={1}
                    className="w-full resize-none overflow-y-auto bg-transparent pr-20 text-white placeholder-gray-400 focus:outline-none"
                    style={{ maxHeight: '120px' }}
                    placeholder={t('ask_something')}
                    disabled={isLoading}
                />
                 <div className="absolute bottom-0 right-0 top-0 flex items-center space-x-1">
                    <button onClick={() => fileInputRef.current?.click()} className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-white/20 hover:text-white" aria-label="Upload image" disabled={isLoading}>
                         <ImageIcon className="h-5 w-5" />
                    </button>
                    <input type="file" id="image-upload" accept="image/*" className="sr-only" onChange={handleImageChange} ref={fileInputRef} />
                    
                    <button
                        onClick={handleSendMessage}
                        className={`flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200 ${
                            (!inputText.trim() && !imagePreview) || isLoading
                                ? 'bg-gray-600/50 text-gray-400'
                                : 'bg-indigo-600 text-white shadow-md hover:bg-indigo-500'
                        }`}
                        disabled={!inputText.trim() && !imagePreview || isLoading}
                        aria-label={t('send')}
                    >
                         {/* แก้ไข: เปลี่ยนจาก PaperAirplaneTilt เป็น Send */}
                        <Send className="h-5 w-5" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChatInput;