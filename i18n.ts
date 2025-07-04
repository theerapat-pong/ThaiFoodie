// src/i18n.ts

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import HttpApi from 'i18next-http-backend';

i18n
  .use(HttpApi) // โหลดไฟล์แปลจาก server
  .use(LanguageDetector) // ตรวจจับภาษาจาก browser
  .use(initReactI18next) // เชื่อมต่อกับ react
  .init({
    supportedLngs: ['th', 'en'],
    fallbackLng: 'th', // ภาษาเริ่มต้นหากไม่เจอภาษาที่รองรับ
    detection: {
      order: ['cookie', 'localStorage', 'htmlTag', 'path', 'subdomain'],
      caches: ['cookie'],
    },
    backend: {
      loadPath: '/locales/{{lng}}/translation.json', // ตำแหน่งของไฟล์แปล
    },
    react: {
      useSuspense: false,
    },
  });

export default i18n;