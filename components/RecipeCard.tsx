import React from 'react';
import { Recipe } from '../types';

interface RecipeCardProps {
  recipe: Recipe;
}

const RecipeCard: React.FC<RecipeCardProps> = ({ recipe }) => {
  return (
    <div className="bg-white/60 backdrop-blur-md border border-gray-200/80 rounded-2xl shadow-xl shadow-gray-300/50 overflow-hidden">
      
      <div className="relative p-5">
        <div className="flex justify-between items-baseline">
            <h3 className="text-xl font-bold text-black tracking-wide">{recipe.dishName}</h3>
            <span className="text-sm font-medium bg-gray-100 text-gray-700 px-3 py-1 rounded-full border border-gray-200">{recipe.calories}</span>
        </div>
      </div>

      <div className="relative px-5 pb-5 space-y-5">
        <div>
          <h4 className="font-semibold text-lg text-gray-800 mb-3 border-b border-gray-300 pb-2">ส่วนผสม</h4>
          <ul className="space-y-1.5 text-gray-700">
            {recipe.ingredients.map((ing, index) => (
              <li key={index} className="flex justify-between items-center text-sm">
                <span>{ing.name}</span>
                <span className="font-mono text-gray-600 bg-gray-200 px-2 py-0.5 rounded-md border border-gray-300">{ing.amount}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="font-semibold text-lg text-gray-800 mb-3 border-b border-gray-300 pb-2">วิธีทำ</h4>
          <ol className="list-decimal list-inside space-y-3 text-gray-700 text-sm leading-relaxed">
            {recipe.instructions.map((step, index) => (
              <li key={index}>{step}</li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
};

export default RecipeCard;