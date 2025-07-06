import React, { useState, useRef, useEffect } from 'react';
import { SendIcon, PaperclipIcon, XIcon } from './icons'; // ใช้ icons เดิมจากโปรเจกต์ของคุณ

interface ChatInputProps {
  onSendMessage: (text: string, imageBase64: string | null) => void;
  isLoading: boolean;
  t: (key: string) => string;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isLoading, t }) => {
  const [text, setText] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // --- START: ฟังก์ชันปรับความสูง Textarea อัตโนมัติ ---
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'; // รีเซ็ตความสูง
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${scrollHeight}px`; // ตั้งค่าความสูงใหม่
    }
  }, [text]);
  // --- END: ฟังก์ชันปรับความสูง Textarea อัตโนมัติ ---

  const handleSend = () => {
    if ((!text.trim() && !image) || isLoading) return;
    onSendMessage(text, image);
    setText('');
    setImage(null);
    if(fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImage(null);
    if(fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };
  
  const isSendDisabled = isLoading || (!text.trim() && !image);

  return (
    // --- START: โค้ดที่ออกแบบใหม่สำหรับ "กล่องแก้ว" ---
    <div className="bg-black/20 backdrop-blur-lg rounded-2xl border border-white/20 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] transition-all duration-300 focus-within:border-white/40">
      <div className="p-3 flex flex-col">
        
        {/* ส่วนแสดงรูปภาพที่เลือก */}
        {image && (
          <div className="relative mb-3 w-20">
            <img src={image} alt="Preview" className="h-20 w-20 rounded-lg object-cover border-2 border-white/10" loading="lazy" />
            <button 
                onClick={removeImage} 
                className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-white transition-transform hover:scale-110"
                aria-label="Remove image"
            >
                <XIcon className="w-4 h-4"/>
            </button>
          </div>
        )}

        {/* ส่วน Textarea และปุ่ม */}
        <div className="flex items-end space-x-3">
          <button 
            onClick={() => fileInputRef.current?.click()} 
            className="flex-shrink-0 p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-full transition-colors disabled:opacity-50"
            aria-label="Attach file"
            disabled={isLoading}
          >
            <PaperclipIcon className="w-6 h-6" />
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            className="hidden" 
            accept="image/*"
          />
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('search_placeholder')}
            className="flex-1 bg-transparent resize-none outline-none text-base text-gray-200 placeholder-gray-400 max-h-36"
            rows={1}
            disabled={isLoading}
          />
          <button 
            onClick={handleSend} 
            disabled={isSendDisabled}
            className={`flex-shrink-0 w-11 h-11 flex items-center justify-center bg-indigo-600 text-white rounded-full transition-all duration-300 ease-in-out hover:bg-indigo-500 disabled:bg-white/10 disabled:text-gray-400 disabled:scale-100 ${!isSendDisabled ? 'hover:scale-110 shadow-lg shadow-indigo-500/30' : ''} active:scale-100`}
            aria-label="Send message"
          >
            {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin"></div>
            ) : (
                <SendIcon className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </div>
    // --- END: โค้ดที่ออกแบบใหม่ ---
  );
};

export default ChatInput;