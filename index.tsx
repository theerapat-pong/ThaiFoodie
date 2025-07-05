// src/index.tsx (ฉบับแก้ไข)
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import { ClerkProvider } from '@clerk/clerk-react';
import { useTranslation } from 'react-i18next';

// ---- START: โค้ดที่แก้ไขและเพิ่มเติม ----
// 1. Import ภาษาต่างๆ ที่เราต้องการจาก Clerk และ i18next
import { thTH, enUS } from "@clerk/localizations"; 
import './i18n'; 
// ---- END: โค้ดที่แก้ไขและเพิ่มเติม ----

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Clerk Publishable Key");
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// ---- START: โค้ดที่แก้ไขและเพิ่มเติม ----
// 2. สร้าง Component ใหม่ขึ้นมาเพื่อจัดการการเลือกภาษาโดยเฉพาะ
const AppWithClerkProvider = () => {
  const { i18n } = useTranslation();

  // ตรวจสอบภาษาที่ i18next ใช้งานอยู่ แล้วเลือกชุดคำแปลของ Clerk ให้ตรงกัน
  const clerkLocalization = i18n.language.startsWith('th') ? thTH : enUS;

  return (
    <ClerkProvider 
      publishableKey={PUBLISHABLE_KEY}
      localization={clerkLocalization} // ส่งค่าภาษาที่เลือกไปให้ Clerk
    >
      <App />
    </ClerkProvider>
  );
}
// ---- END: โค้ดที่แก้ไขและเพิ่มเติม ----

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <BrowserRouter>
      {/* 3. เรียกใช้งาน Component ที่เราสร้างขึ้นมาใหม่ */}
      <AppWithClerkProvider />
    </BrowserRouter>
  </React.StrictMode>
);