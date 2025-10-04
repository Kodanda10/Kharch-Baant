
import { GoogleGenAI } from "@google/genai";
import { TAGS, Tag } from '../types';

// Resolve API key from Vite-exposed env (client) or Node fallback (tests / tooling)
const viteEnv = (import.meta as any)?.env ?? {};
const GEMINI_KEY: string | undefined =
  viteEnv.VITE_GEMINI_API_KEY ||
  viteEnv.GEMINI_API_KEY ||
  (typeof process !== 'undefined' && (process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || process.env.API_KEY));

// Only instantiate client if we actually have a key; otherwise we'll no-op.
const ai = GEMINI_KEY ? new GoogleGenAI({ apiKey: GEMINI_KEY }) : null;

export const suggestTagForDescription = async (description: string): Promise<Tag | ''> => {
  if (!ai || !GEMINI_KEY) {
    // No key configured; silently skip suggestions
    return '';
  }
    
    // This detailed prompt provides the "exhaustive logic" requested by the user.
    // It gives the model clear definitions and examples for each category,
    // leading to much more accurate and consistent tag suggestions.
    const prompt = `You are an expert expense categorization assistant. Your task is to categorize a user's expense description into one of the following predefined categories. Respond with ONLY the category name.

Here are the categories and what they include:

- **Food**: Meals at restaurants, cafes, fast food, delivery services, bars, pubs.
  - Examples: "Lunch with coworkers", "Starbucks coffee", "Dinner at The Italian Place", "Late night pizza delivery".

- **Groceries**: Items purchased from a supermarket or grocery store for cooking at home.
  - Examples: "Weekly grocery shopping", "Milk and eggs", "Vegetables from the market".

- **Transport**: Daily commuting and local travel like cabs, ride-sharing, metro, bus.
  - Examples: "Uber to office", "Metro card recharge", "Bus ticket", "Taxi fare home".

- **Travel**: Expenses related to long-distance trips or vacations.
  - Examples: "Flight to New York", "Train tickets to Paris", "Vacation hotel booking", "Cross-country road trip gas".

- **Housing**: Rent, mortgage, and other home-related living expenses.
  - Examples: "Monthly rent", "Mortgage payment", "Home insurance", "Furniture for apartment".

- **Utilities**: Essential services for your home.
  - Examples: "Electricity bill", "Internet subscription", "Water bill", "Gas bill", "Phone bill".

- **Entertainment**: Activities for fun and leisure.
  - Examples: "Movie tickets", "Concert tickets", "Netflix subscription", "Bowling with friends", "Museum entry fee", "Spotify premium".

- **Shopping**: Personal items, clothing, electronics, gifts, home goods.
  - Examples: "New shoes from Nike", "Amazon purchase for a book", "Birthday gift for Mom", "New laptop".

- **Health**: Medical expenses, pharmacy, gym, wellness.
  - Examples: "Doctor's visit co-pay", "Prescription medicine", "Gym membership", "Vitamins and supplements".

- **Other**: For expenses that do not fit into any of the above categories.

Based on these definitions, categorize the following expense description:
"${description}"`;

    try {
    const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                // Disable thinking for low latency and deterministic output
                thinkingConfig: { thinkingBudget: 0 },
                temperature: 0,
            }
        });
        
    const suggestedTag = (response as any).text?.trim?.() || '';
        
        // Validate if the response is one of the allowed tags
        if (TAGS.includes(suggestedTag as Tag)) {
            return suggestedTag as Tag;
        }
        
        // If the model returns something unexpected, fall back to 'Other'
        return 'Other';

    } catch (error) {
        console.error("Error suggesting tag from Gemini:", error);
        return ''; // Return empty string on error to not block user
    }
};
