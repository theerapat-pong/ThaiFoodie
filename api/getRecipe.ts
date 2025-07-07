// api/getRecipe.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { pipeline, cos_sim } from '@xenova/transformers';
import type { Recipe, SearchResult } from '../types';
import { GoogleGenerativeAI } from '@google/generative-ai';

// --- DATABASE LOADING ---
// Use require to load JSON files in Vercel environment
const recipes: Recipe[] = require('../db.json');
const embeddings: number[][] = require('../embeddings.json');

// --- INITIALIZATION ---
// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// Caching the model pipeline for better performance
let extractor: any = null;
const getExtractor = async () => {
  if (extractor === null) {
    extractor = await pipeline('feature-extraction', 'Xenova/thai-food-mpnet-new-v10');
  }
  return extractor;
};

// --- CORE FUNCTIONS ---
async function search(query: string): Promise<SearchResult | null> {
  const model = await getExtractor();
  
  // Generate embedding for the user's query
  const queryEmbedding = await model(query, { pooling: 'mean', normalize: true });
  
  // Compare query embedding with all recipe embeddings
  let bestMatch: SearchResult = { recipe: recipes[0], score: -1 };

  for (let i = 0; i < embeddings.length; i++) {
    const score = cos_sim(queryEmbedding.data, embeddings[i]);
    if (score > bestMatch.score) {
      bestMatch = { recipe: recipes[i], score };
    }
  }

  // Return the best match if the similarity score is reasonably high
  return bestMatch.score > 0.5 ? bestMatch : null;
}

async function translateRecipe(recipe: Recipe): Promise<Recipe> {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `
      Translate the following Thai recipe to English.
      Do not add any extra information, just translate the text.
      Return the result as a JSON object with the keys "dishName", "ingredients", and "instructions".

      Thai Recipe:
      {
        "dishName": "${recipe.dishName}",
        "ingredients": ["${recipe.ingredients.join('", "')}"],
        "instructions": ["${recipe.instructions.join('", "')}"]
      }
    `;

    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text().replace('```json', '').replace('```', '').trim();
      const translated = JSON.parse(text);
      
      return {
        ...recipe, // Keep original id and calories
        dishName: translated.dishName,
        ingredients: translated.ingredients,
        instructions: translated.instructions,
      };
    } catch (error) {
      console.error('Translation failed:', error);
      return recipe; // Return original recipe if translation fails
    }
}


// --- API HANDLER ---
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Only POST requests are allowed' });
  }

  const { prompt, lang } = req.body;

  if (!prompt) {
    return res.status(400).json({ message: 'Prompt is required' });
  }

  try {
    const searchResult = await search(prompt);

    if (!searchResult) {
      return res.status(404).json({ message: 'Recipe not found in our database.' });
    }

    let finalRecipe = searchResult.recipe;
    
    // If user requests English, translate the found recipe
    if (lang === 'en') {
      finalRecipe = await translateRecipe(finalRecipe);
    }
    
    return res.status(200).json(finalRecipe);

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ message: 'An internal server error occurred.' });
  }
}