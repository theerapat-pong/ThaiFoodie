import React, { useState, useRef } from 'react';
import { PaperAirplaneTilt } from 'lucide-react';

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
    };

    const handleSendMessage = () => {
        if (inputText.trim() || imagePreview) {
            onSendMessage(inputText.trim(), imagePreview);
            setInputText('');
            setImageFile(null);
            setImagePreview(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = ''; // Reset file input
            }
        }
    };

    const handleKeyDown = (event: React.KeyboardEvent) => {
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
        } else {
            setImageFile(null);
            setImagePreview(null);
        }
    };

    const handleRemoveImage = () => {
        setImageFile(null);
        setImagePreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = ''; // Reset file input
        }
    };

    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    const isInputEmpty = !inputText.trim() && !imagePreview;

    return (
        <div className="relative rounded-md shadow-lg overflow-hidden">
            {imagePreview && (
                <div className="absolute top-2 left-2 bg-black/50 rounded-md p-1 z-10">
                    <button onClick={handleRemoveImage} className="text-white text-xs">
                        {t('remove')}
                    </button>
                </div>
            )}
            <textarea
                value={inputText}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                rows={1}
                className={`w-full pr-12 p-3 rounded-md border-0 bg-black/40 text-white shadow-sm focus:ring-2 focus:ring-inset focus:ring-indigo-600 transition-colors resize-none appearance-none ${imagePreview ? 'pl-10' : 'pl-3'} ${isLoading ? 'opacity-50 cursor-not-allowed' : ''} glass-effect-input`}
                placeholder={t('ask_something')}
                disabled={isLoading}
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                {isLoading && <Loader size="sm" color="white" />}
            </div>
            <div className="absolute inset-y-0 right-0 pr-1 flex items-center">
                <label htmlFor="image-upload" className="cursor-pointer p-2 rounded-full hover:bg-black/30 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-300">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 3.182L8.25 17.25m6-12.75l4.72-4.72a2.25 2.25 0 013.182 3.182L13.5 11.25m-6 6l5.159 5.159a2.25 2.25 0 013.182-3.182L15.75 12.75" />
                    </svg>
                    <input type="file" id="image-upload" accept="image/*" className="sr-only" onChange={handleImageChange} ref={fileInputRef} />
                </label>
                <button
                    onClick={handleSendMessage}
                    className={`p-2 rounded-full hover:bg-indigo-700 transition-colors ${isInputEmpty || isLoading ? 'text-gray-500 cursor-not-allowed' : 'text-indigo-500'}`}
                    disabled={isInputEmpty || isLoading}
                    aria-label={t('send')}
                >
                    <PaperAirplaneTilt className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
};

export default ChatInput;

// CSS เพิ่มเติม (สามารถใส่ในไฟล์ CSS หลักของคุณ หรือใน <style> tag ใน index.html ก็ได้)
const glassEffectInputStyle = `
    .glass-effect-input {
        -webkit-backdrop-filter: blur(10px);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08), inset 0 1px 1px rgba(255, 255, 255, 0.1);
    }
    .glass-effect-input:focus {
        border-color: rgba(255, 255, 255, 0.3);
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08), inset 0 1px 1px rgba(255, 255, 255, 0.1), 0 0 0 2px rgba(255, 255, 255, 0.2);
    }
`;

// คุณสามารถนำ CSS ด้านบนนี้ไปใส่ใน <style> tag ในไฟล์ index.html หรือในไฟล์ CSS หลักของคุณก็ได้
// โดยเพิ่ม <style> ที่มี id="glass-effect-style" ใน <head> ของ index.html แล้วใส่ CSS ด้านบน
// หรือจะนำไปใส่ในไฟล์ index.css หรือ App.css ก็ได้เช่นกัน

// ตัวอย่างการเพิ่ม <style> tag ใน index.html:
/*
<!DOCTYPE html>
<html lang="th">
<head>
    ...
    <style>
        ... (CSS อื่นๆ ของคุณ) ...
    </style>
    <style id="glass-effect-style">
        ${glassEffectInputStyle}
    </style>
</head>
<body>
    ...
</body>
</html>
*/