export interface Ingredient {
  name: string;
  amount: string;
}

export interface Recipe {
  dishName: string;
  ingredients: Ingredient[];
  instructions: string[];
  calories: string;
}

export interface RecipeError {
    error: string;
}

export interface ConversationResponse {
    conversation: string;
}

export type GeminiResponse = Recipe | RecipeError | ConversationResponse;

// เพิ่ม interface สำหรับ Video
export interface Video {
  id: string;
  title: string;
  thumbnail: string;
  channelTitle: string;
}

export interface ChatMessage {
  id:string;
  role: 'user' | 'model';
  text: string;
  image?: string; // base64 string
  recipe?: Recipe;
  videos?: Video[]; // เพิ่ม property สำหรับเก็บวิดีโอ
  error?: string;
  isLoading?: boolean;
}