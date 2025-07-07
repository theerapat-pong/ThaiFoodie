import React from 'react';
import { Conversation } from '../types';
import { PlusIcon, MessageSquareIcon, LogoIcon } from './icons';
import { useTranslation } from 'react-i18next';
import { UserButton } from '@clerk/clerk-react';

interface SidebarProps {
  conversations: Conversation[];
  activeConversationId: number | null;
  onSelectConversation: (id: number) => void;
  onNewChat: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewChat,
}) => {
  const { t } = useTranslation();

  return (
    <div className="flex h-full flex-col bg-gray-50 text-gray-800 border-r border-gray-200">
      {/* Header */}
      <div className="p-4 flex justify-between items-center border-b border-gray-200 h-16">
        <div className="flex items-center space-x-3">
          <LogoIcon className="w-8 h-8" />
          <h2 className="text-xl font-bold">ThaiFoodie</h2>
        </div>
      </div>

      {/* New Chat Button */}
      <div className="p-2 border-b border-gray-200">
        <button
          onClick={onNewChat}
          className="w-full flex items-center justify-between gap-2 bg-white hover:bg-gray-100 border border-gray-300 px-3 py-2 rounded-lg text-sm transition-colors"
        >
          <span>{t('new_chat')}</span>
          <PlusIcon className="w-5 h-5" />
        </button>
      </div>

      {/* History */}
      <div className='p-2'>
        <span className='text-xs font-semibold text-gray-500 px-2 uppercase'>{t('chat_history_title')}</span>
      </div>
      <nav className="flex-1 overflow-y-auto p-2 space-y-1">
        {conversations.map((convo) => (
          <a
            key={convo.id}
            onClick={() => onSelectConversation(convo.id)}
            className={`
              flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors
              w-full text-left truncate text-sm
              ${activeConversationId === convo.id ? 'bg-gray-200 font-semibold' : 'hover:bg-gray-100'}
            `}
          >
            <MessageSquareIcon className="w-4 h-4 flex-shrink-0 text-gray-500" />
            <span className="truncate flex-1">{convo.title}</span>
          </a>
        ))}
      </nav>

      {/* Footer / User Profile */}
      <div className="p-2 border-t border-gray-200">
        <div className="p-2 rounded-lg hover:bg-gray-100">
          <UserButton afterSignOutUrl="/" />
        </div>
      </div>
    </div>
  );
};

export default Sidebar;