export interface Personality {
  id: string;
  name: string;
  prompt: string;
  enabled: boolean;
}

export interface AIReview {
  personalityId: string;
  personalityName: string;
  content: string;
  createdAt: string;
}

export interface DiaryEntry {
  date: string;
  content: string;
  aiReviews: AIReview[];
  reviewRequested: boolean;
  reviewRequestedAt: string | null;
  updatedAt: string;
}

export interface ElectronAPI {
  readJournal: (year: number, month: number, day: number) => Promise<DiaryEntry | null>;
  writeJournal: (entry: DiaryEntry) => Promise<{ success: boolean; error?: string }>;
  listMonth: (year: number, month: number) => Promise<DiaryEntry[]>;
  readConfig: () => Promise<{ deepseekApiKey: string; personalities?: Personality[]; theme?: string }>;
  writeConfig: (config: { deepseekApiKey?: string; personalities?: Personality[]; theme?: string }) => Promise<{ success: boolean; error?: string }>;
  requestAIReview: (apiKey: string, personalityPrompt: string, content: string) => Promise<{ success: boolean; reply?: string; error?: string }>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export {};
