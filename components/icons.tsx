import React from 'react';

export const SendIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m22 2-7 20-4-9-9-4Z" />
    <path d="M22 2 11 13" />
  </svg>
);

export const PaperclipIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.59a2 2 0 0 1-2.83-2.83l8.49-8.48" />
  </svg>
);

export const XIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

export const UserIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
);
  
export const BotIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M12 2C6.477 2 2 6.477 2 12C2 17.523 6.477 22 12 22C17.523 22 22 17.523 22 12C22 6.477 17.523 2 12 2Z" fill="#E5E7EB"/>
        <path d="M12 2C6.477 2 2 6.477 2 12C2 17.523 6.477 22 12 22C17.523 22 22 17.523 22 12C22 6.477 17.523 2 12 2Z" stroke="black" strokeOpacity="0.1" strokeWidth="1"/>
        <circle cx="9" cy="12" r="1.5" fill="black"/>
        <circle cx="15" cy="12" r="1.5" fill="black"/>
        <path d="M9 16C9.82843 17.1046 10.8284 17.5 12 17.5C13.1716 17.5 14.1716 17.1046 15 16" stroke="black" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
);

export const LogoIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32" fill="none">
    <defs>
       <linearGradient id="b-gradient-light" x1="16" y1="9" x2="16" y2="23">
        <stop offset="0%" stopColor="#27272a" />
        <stop offset="100%" stopColor="black" />
      </linearGradient>
    </defs>
    <circle cx="16" cy="16" r="15" fill="white" />
    <path d="M13.5 9H18.5C20.9853 9 23 11.0147 23 13.5V13.5C23 15.9853 20.9853 18 18.5 18H13.5V9Z" fill="url(#b-gradient-light)" />
    <path d="M13.5 16H19C21.2091 16 23 17.7909 23 20V20C23 22.2091 21.2091 24 19 24H13.5V16Z" fill="url(#b-gradient-light)" />
    <circle cx="16" cy="16" r="15" stroke="black" strokeOpacity="0.1" strokeWidth="1"/>
  </svg>
);