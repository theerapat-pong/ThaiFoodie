// src/services/geminiService.ts (เวอร์ชันแก้ไข)

import { ChatMessage, GeminiResponse } from '../types';

// เพิ่ม chatHistory เข้ามาใน function
export async function getRecipeForDish(prompt: string, imageBase64: string | null, chatHistory: ChatMessage[]): Promise<GeminiResponse> {
  try {
    const response = await fetch('/api/getRecipe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      // ส่ง history ไปพร้อมกับ body
      body: JSON.stringify({ prompt, imageBase64, history: chatHistory }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("API Error:", errorData);
      return { error: errorData.error || `Request failed with status: ${response.status}` };
    }

    const data: GeminiResponse = await response.json();
    return data;

  } catch (e) {
    console.error("Failed to fetch from API route:", e);
    return { error: "Sorry, I couldn't connect to the server. Please check your connection and try again." };
  }
}