import { ChatMessage } from '../types';

// ถูกต้องแล้วที่โค้ดสั้นลง:
// หน้าที่ของฟังก์ชันนี้คือการส่งคำขอและคืนค่า Response object ทันที
// เพื่อให้ App.tsx สามารถเข้าถึง stream ของข้อมูลที่ทยอยส่งมาได้
export async function getRecipeForDish(prompt: string, imageBase64: string | null, chatHistory: ChatMessage[]): Promise<Response> {
  const response = await fetch('/api/getRecipe', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ prompt, imageBase64, history: chatHistory }),
  });

  return response;
}