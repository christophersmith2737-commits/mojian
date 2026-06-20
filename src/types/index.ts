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
  date: string;           // "2026-06-19"
  content: string;        // 日记正文
  aiReviews: AIReview[];  // 多条 AI 回复 (一人格一条)
  reviewRequested: boolean;
  reviewRequestedAt: string | null;
  updatedAt: string;
}

export interface AppConfig {
  deepseekApiKey: string;
  personalities: Personality[];
  sharedPrompt: string;
  theme: 'light' | 'dark';
}

export interface CalendarDay {
  year: number;
  month: number;
  day: number;
  dateStr: string;
  isToday: boolean;
  isPast: boolean;
  isFuture: boolean;
  isCurrentMonth: boolean;
  entry: DiaryEntry | null;
}
