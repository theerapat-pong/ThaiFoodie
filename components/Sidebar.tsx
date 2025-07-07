import React from 'react';
import { Conversation } from '../types';
import { PlusIcon, MessageSquareIcon, LogoIcon, Trash2Icon } from './icons';
import { useTranslation } from 'react-i18next';

interface SidebarProps {
  conversations: Conversation[];
  activeConversationId: number | null;
  onSelectConversation: (id: number) => void;
  onNewChat: () => void;
  onDeleteConversation: (id: number) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewChat,
  onDeleteConversation,
}) => {
  const { t } = useTranslation();

  return (
    <div className="flex h-full flex-col bg-gray-50 text-gray-800 border-r border-gray-200">
      {/* Header */}
      <div className="p-4 flex justify-between items-center border-b border-gray-200 h-16 flex-shrink-0">
        <div className="flex items-center space-x-3">
          <LogoIcon className="w-8 h-8" />
          <h2 className="text-xl font-bold">ThaiFoodie</h2>
        </div>
      </div>

      {/* New Chat Button */}
      <div className="p-2 border-b border-gray-200 flex-shrink-0">
        <button
          onClick={onNewChat}
          className="w-full flex items-center justify-between gap-2 bg-white hover:bg-gray-100 border border-gray-300 px-3 py-2 rounded-lg text-sm transition-colors"
        >
          <span>{t('new_chat')}</span>
          <PlusIcon className="w-5 h-5" />
        </button>
      </div>

      {/* History */}
      <div className='p-2 flex-shrink-0'>
        <span className='text-xs font-semibold text-gray-500 px-2 uppercase'>{t('chat_history_title')}</span>
      </div>
      <nav className="flex-1 overflow-y-auto p-2 space-y-1">
        {conversations.map((convo) => (
          <div key={convo.id} className="group flex items-center">
            <a
              onClick={() => onSelectConversation(convo.id)}
              className={`
                flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors
                w-full text-left truncate text-sm flex-1
                ${activeConversationId === convo.id ? 'bg-gray-200 font-semibold' : 'hover:bg-gray-100'}
              `}
            >
              <MessageSquareIcon className="w-4 h-4 flex-shrink-0 text-gray-500" />
              <span className="truncate flex-1">{convo.title}</span>
            </a>
            {activeConversationId === convo.id && (
                 <button 
                    onClick={() => onDeleteConversation(convo.id)}
                    className="p-1 text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity ml-2"
                    title="Delete Chat"
                >
                    <Trash2Icon className="w-4 h-4" />
                </button>
            )}
          </div>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;