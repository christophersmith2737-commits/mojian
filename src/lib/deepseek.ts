import { requestAIReview as apiReview } from './api';

export async function requestAIReview(
  apiKey: string,
  personalityPrompt: string,
  content: string
): Promise<{ success: boolean; reply?: string; error?: string }> {
  return apiReview(apiKey, personalityPrompt, content);
}
