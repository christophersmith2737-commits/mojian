import { requestAIReview as apiReview } from './api';

export async function requestAIReview(
  apiKey: string,
  personalityPrompt: string,
  content: string,
  history?: string
): Promise<{ success: boolean; reply?: string; error?: string }> {
  return apiReview(apiKey, personalityPrompt, content, history);
}
