// types.ts

// --- โครงสร้างสำหรับ Recipe ที่มาจาก db.json ---
// ปรับแก้ให้ตรงกับฐานข้อมูลใหม่ที่เราสร้างขึ้น
export interface Recipe {
  id: number;
  dishName: string;
  // ส่วนผสมและวิธีทำ ตอนนี้เป็น array ของ string ตรงๆ จาก db.json
  ingredients: string[];
  instructions: string[];
  calories: number;
}

// --- โครงสร้างสำหรับข้อมูลที่แสดงผลในหน้าแชท ---
// นำโครงสร้างเดิมของคุณกลับมา เพื่อให้หน้าแอปทำงานได้เหมือนเดิม

export interface Ingredient {
  name: string;
  amount: string;
}

// Interface นี้อาจจะไม่ได้ใช้โดยตรงจาก API แล้ว
// แต่สามารถเก็บไว้เผื่อการแปลงข้อมูลในอนาคต
export interface OriginalRecipeFormat {
  dishName: string;
  ingredients: Ingredient[];
  instructions: string[];
  calories: string;
}

export interface Video {
  id: string;
  title: string;
  thumbnail: string;
  channelTitle: string;
}

export interface Conversation {
  id: number;
  title: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  image?: string; // base64 string
  // recipe ตอนนี้จะใช้ Type ใหม่ที่เรากำหนด
  recipe?: Recipe;
  videos?: Video[]; // เพิ่ม property สำหรับเก็บวิดีโอ
  error?: string;
  isLoading?: boolean;
}

// Type ที่อาจไม่จำเป็นสำหรับ API ใหม่แล้ว แต่เก็บไว้เผื่อส่วนอื่น
export interface RecipeError {
    error: string;
}

export interface ConversationResponse {
    conversation: string;
}