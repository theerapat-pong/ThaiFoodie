// src/services/speechService.ts

/**
 * ตรวจสอบภาษาของข้อความว่าเป็นภาษาไทยหรือไม่
 * @param text ข้อความที่ต้องการตรวจสอบ
 * @returns 'th-TH' ถ้ามีตัวอักษรไทย, มิฉะนั้นคืนค่า 'en-US'
 */
const detectLanguage = (text: string): 'th-TH' | 'en-US' => {
  // ใช้ Regular Expression เพื่อค้นหาตัวอักษรใน Unicode Range ของภาษาไทย
  const thaiRegex = /[\u0E00-\u0E7F]/;
  
  if (thaiRegex.test(text)) {
    return 'th-TH'; // ถ้าเจอตัวอักษรไทย ให้ใช้เสียงภาษาไทย
  } else {
    return 'en-US'; // ถ้าไม่เจอ ให้ใช้เสียงภาษาอังกฤษ
  }
};

/**
 * ฟังก์ชันสำหรับสั่งให้เว็บบราวเซอร์พูดข้อความที่กำหนด
 * โดยจะตรวจสอบภาษา (ไทย/อังกฤษ) โดยอัตโนมัติ
 * @param text ข้อความที่ต้องการให้พูด
 */
export const speak = (text: string) => {
  // ตรวจสอบว่าบราวเซอร์รองรับ Speech Synthesis API หรือไม่
  if ('speechSynthesis' in window) {
    const lang = detectLanguage(text); // 1. ตรวจสอบภาษาจากข้อความ
    
    // หยุดการพูดที่อาจกำลังเล่นอยู่ก่อนหน้า
    window.speechSynthesis.cancel();

    // สร้างอ็อบเจกต์เสียงพูดจากข้อความ
    const utterance = new SpeechSynthesisUtterance(text);
    
    // 2. ตั้งค่าภาษาและอัตราความเร็วในการพูดตามที่ตรวจพบ
    utterance.lang = lang;
    utterance.rate = 1;
    
    // สั่งให้บราวเซอร์พูด
    window.speechSynthesis.speak(utterance);
  } else {
    // แจ้งเตือนในกรณีที่บราวเซอร์ไม่รองรับ
    console.error('ขออภัย, เว็บบราวเซอร์ของคุณไม่รองรับฟังก์ชันแปลงข้อความเป็นเสียงพูด');
    alert('ขออภัย, เว็บบราวเซอร์ของคุณไม่รองรับฟังก์ชันแปลงข้อความเป็นเสียงพูด');
  }
};