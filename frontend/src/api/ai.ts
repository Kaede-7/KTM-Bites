import API from './axios';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  items?: RecommendedItem[];
}

export interface RecommendedItem {
  id: number;
  name: string;
  price: number;
  image: string;
  reason?: string;
}

export interface RecommendationsResponse {
  recommendations: RecommendedItem[];
}

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

export async function getAIRecommendations(): Promise<RecommendationsResponse> {
  const { data } = await API.get('/ai/recommendations/');
  return data;
}
