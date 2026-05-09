// ============================================================
// ai.ts — Frontend API for the AI features
// ============================================================
// This file contains two functions:
// 1. sendChatMessage()  → Sends a message to the AI chatbot
// 2. getAIRecommendations() → Fetches AI food suggestions
//
// Both functions call the backend which then talks to the
// Groq AI (Llama 3.3 model) to generate responses.
// ============================================================

import API from './axios';

// --- Type Definitions (what the data looks like) ---

// A single message in the chat conversation
export interface ChatMessage {
  role: 'user' | 'assistant';  // Who sent it: the user or the AI?
  content: string;              // The actual message text
  items?: RecommendedItem[];    // Optional: food items the AI recommended
}

// A food item that the AI recommends
export interface RecommendedItem {
  id: number;       // Database ID of the menu item
  name: string;     // e.g. "Chicken Momo"
  price: number;    // e.g. 250
  image: string;    // URL to the food image
  reason?: string;  // e.g. "Perfect for a rainy evening"
}

// What the recommendations API returns
export interface RecommendationsResponse {
  recommendations: RecommendedItem[];
}

// --- API Functions ---

/**
 * Send a chat message to the AI concierge.
 * 
 * @param message - The user's message (e.g. "What's good for lunch?")
 * @param history - Previous messages in the conversation (for context)
 * @returns The AI's reply text + any recommended food items
 */
export async function sendChatMessage(
  message: string,
  history: ChatMessage[]
): Promise<{ reply: string; items: RecommendedItem[] }> {
  const { data } = await API.post('/ai/chat/', {
    message,
    history: history.map(m => ({ role: m.role, content: m.content })),
  });
  return data;
}

/**
 * Get AI-powered food recommendations for the dashboard.
 * The backend considers: time of day, weather, and user's order history.
 * 
 * @returns A list of 3 recommended food items with reasons
 */
export async function getAIRecommendations(): Promise<RecommendationsResponse> {
  const { data } = await API.get('/ai/recommendations/');
  return data;
}
