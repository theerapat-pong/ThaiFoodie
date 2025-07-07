import React from 'react';
import { Conversation } from '../types';
import { PlusIcon, MessageSquareIcon } from './icons';
import { LogoIcon } from './icons';
import { useTranslation } from 'react-i18next';


interface SidebarProps {
  conversations: Conversation[];
  activeConversationId: number | null;
  onSelectConversation: (id: number) => void;
  onNewChat: () => void;
  isOpen: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewChat,
  isOpen,
}) => {
  const { t } = useTranslation();

  return (
    <div className={`
      absolute top-0 left-0 h-full bg-gray-50 text-gray-800 
      flex flex-col transition-transform duration-300 ease-in-out
      w-64
      ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      md:relative md:translate-x-0 z-30 border-r border-gray-200
    `}>
      <div className="p-4 flex justify-between items-center border-b border-gray-200 h-16">
          <div className="flex items-center space-x-3">
              <LogoIcon className="w-8 h-8" />
              <h2 className="text-xl font-bold">ThaiFoodie</h2>
          </div>
        <button
          onClick={onNewChat}
          className="flex items-center gap-2 bg-gray-800 text-white hover:bg-black px-3 py-2 rounded-lg text-sm transition-colors"
          title={t('new_chat')}
        >
          <PlusIcon className="w-5 h-5" />
        </button>
      </div>
      <div className='p-2 border-b border-gray-200'>
        <span className='text-sm font-semibold text-gray-500 px-2'>{t('chat_history_title')}</span>
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
    </div>
  );
};

export default Sidebar;