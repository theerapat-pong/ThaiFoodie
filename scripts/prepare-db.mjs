// scripts/prepare-db.mjs
import { pipeline } from '@xenova/transformers';
import fetch from 'node-fetch';
import fs from 'fs/promises';

// 1. Load the Sentence Transformer model
console.log('Loading sentence transformer model...');
const extractor = await pipeline('feature-extraction', 'Xenova/thai-food-mpnet-new-v10');
console.log('Model loaded.');

// 2. Fetch the dataset from Hugging Face
console.log('Downloading dataset from Hugging Face...');
const response = await fetch('https://huggingface.co/datasets/pythainlp/thai_food_v1.0/resolve/main/data.jsonl');
if (!response.ok) {
  throw new Error(`Failed to download dataset: ${response.statusText}`);
}
const data = await response.text();
console.log('Dataset downloaded.');

// 3. Process the dataset
const recipes = data.trim().split('\n').map(line => JSON.parse(line));

const processedRecipes = recipes.map((recipe, index) => ({
  id: index,
  dishName: recipe.title,
  // Split ingredients by newline and remove empty lines/whitespace
  ingredients: recipe.ingredients.split('\n').map(i => i.trim()).filter(Boolean),
  // Split instructions similarly
  instructions: recipe.instructions.split('\n').map(i => i.trim()).filter(Boolean),
  calories: Math.floor(Math.random() * (800 - 250 + 1)) + 250, // Assign random calories for now
}));

// 4. Generate embeddings for all dish names
console.log('Generating embeddings for dish names...');
const dishNames = processedRecipes.map(r => r.dishName);
const embeddings = await extractor(dishNames, { pooling: 'mean', normalize: true });
console.log('Embeddings generated.');

// 5. Save the processed data and embeddings to files
await fs.writeFile('./db.json', JSON.stringify(processedRecipes, null, 2));
await fs.writeFile('./embeddings.json', JSON.stringify(embeddings.tolist(), null, 2));

console.log('✅ Successfully created db.json and embeddings.json!');