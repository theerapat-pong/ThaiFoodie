import React from 'react';

// ... (โค้ดไอคอนอื่นๆ ที่มีอยู่แล้ว) ...
export const UserIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
    </svg>
);

export const BotIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M12 2C6.477 2 2 6.477 2 12C2 17.523 6.477 22 12 22C17.523 22 22 17.523 22 12C22 6.477 17.523 2 12 2Z" fill="#E5E7EB"/>
        <path d="M12 2C6.477 2 2 6.477 2 12C2 17.523 6.477 22 12 22C17.523 22 22 17.523 22 12C22 6.477 17.523 2 12 2Z" stroke="black" strokeOpacity="0.1" strokeWidth="1"/>
        <circle cx="9" cy="12" r="1.5" fill="black"/><circle cx="15" cy="12" r="1.5" fill="black"/>
        <path d="M9 16C9.82843 17.1046 10.8284 17.5 12 17.5C13.1716 17.5 14.1716 17.1046 15 16" stroke="black" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
);

// ---- START: โค้ดที่เพิ่ม ----
export const VideoIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m22 8-6 4 6 4V8Z" />
    <rect width="14" height="12" x="2" y="6" rx="2" ry="2" />
  </svg>
);
// ---- END: โค้ดที่เพิ่ม ----

export const LogoIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <img src="/favicon.svg" alt="ThaiFoodie Logo" {...props} />
);
