import type { DiaryEntry, Personality } from './index';

export interface ElectronAPI {
  readJournal: (year: number, month: number, day: number) => Promise<DiaryEntry | null>;
  writeJournal: (entry: DiaryEntry) => Promise<{ success: boolean; error?: string }>;
  listMonth: (year: number, month: number) => Promise<DiaryEntry[]>;
  readConfig: () => Promise<{ deepseekApiKey: string; personalities?: Personality[]; sharedPrompt?: string; theme?: string }>;
  writeConfig: (config: { deepseekApiKey?: string; personalities?: Personality[]; sharedPrompt?: string; theme?: string }) => Promise<{ success: boolean; error?: string }>;
  requestAIReview: (apiKey: string, personalityPrompt: string, content: string, history?: string) => Promise<{ success: boolean; reply?: string; error?: string }>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export {};
