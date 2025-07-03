import React, { useState, useRef } from 'react';
import { SendIcon, PaperclipIcon, XIcon } from './icons';

interface ChatInputProps {
  onSendMessage: (text: string, imageBase64: string | null) => void;
  isLoading: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isLoading }) => {
  const [text, setText] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  return (
    <div className="bg-white/80 border border-gray-300/80 rounded-2xl p-2 flex items-end shadow-lg backdrop-blur-md">
      {image && (
        <div className="relative mr-2 mb-1 self-center">
            <img src={image} alt="Preview" className="w-12 h-12 object-cover rounded-lg border border-gray-300" />
            <button 
                onClick={removeImage} 
                className="absolute -top-1.5 -right-1.5 bg-gray-200 rounded-full p-0.5 text-gray-700 hover:bg-red-500 hover:text-white transition-all duration-200 hover:scale-110"
            >
                <XIcon className="w-4 h-4"/>
            </button>
        </div>
      )}
      <button 
        onClick={() => fileInputRef.current?.click()} 
        className="p-2 text-gray-500 hover:text-black transition-colors self-center mb-1 disabled:opacity-50"
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
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ask for a recipe..."
        className="flex-1 bg-transparent resize-none outline-none p-2 text-black placeholder-gray-500 max-h-32 text-base"
        rows={1}
        disabled={isLoading}
      />
      <button 
        onClick={handleSend} 
        disabled={isLoading || (!text.trim() && !image)}
        className="ml-2 bg-gradient-to-br from-gray-900 to-black text-white rounded-full p-2.5 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 ease-in-out hover:scale-110 hover:shadow-lg hover:shadow-black/20 active:scale-100 self-center mb-0.5"
        aria-label="Send message"
      >
        {isLoading ? (
            <div className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin"></div>
        ) : (
            <SendIcon className="w-5 h-5" />
        )}
      </button>
    </div>
  );
};

export default ChatInput;