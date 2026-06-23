import type { DiaryEntry, Personality } from '../types';

const BASE = 'http://localhost:5174/api';
const isElectron = typeof window !== 'undefined' && !!(window as any).electronAPI;

async function fetchJSON(url: string, options?: RequestInit): Promise<any> {
  const res = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  });
  return res.json();
}

// ---- Journal APIs ----

export async function readJournal(year: number, month: number, day: number): Promise<DiaryEntry | null> {
  if (isElectron) return (window as any).electronAPI.readJournal(year, month, day);
  return fetchJSON(`${BASE}/journal/read?year=${year}&month=${month}&day=${day}`);
}

export async function writeJournal(entry: DiaryEntry): Promise<{ success: boolean; error?: string }> {
  if (isElectron) return (window as any).electronAPI.writeJournal(entry);
  return fetchJSON(`${BASE}/journal/write`, { method: 'POST', body: JSON.stringify(entry) });
}

export async function listMonth(year: number, month: number): Promise<DiaryEntry[]> {
  if (isElectron) return (window as any).electronAPI.listMonth(year, month);
  return fetchJSON(`${BASE}/journal/list?year=${year}&month=${month}`);
}

// ---- Config APIs ----

export async function readConfig(): Promise<{ deepseekApiKey: string; personalities: Personality[]; sharedPrompt: string; theme: string }> {
  if (isElectron) return (window as any).electronAPI.readConfig() as any;
  const config = await fetchJSON(`${BASE}/config/read`);
  return {
    deepseekApiKey: config.deepseekApiKey || '',
    personalities: config.personalities || [],
    sharedPrompt: config.sharedPrompt || '',
    theme: config.theme || 'light',
  };
}

export async function writeConfig(config: {
  deepseekApiKey?: string;
  personalities?: Personality[];
  sharedPrompt?: string;
  theme?: string;
}): Promise<{ success: boolean; error?: string }> {
  if (isElectron) return (window as any).electronAPI.writeConfig(config);
  return fetchJSON(`${BASE}/config/write`, { method: 'POST', body: JSON.stringify(config) });
}

// ---- Deepseek AI ----

/** Strip parenthetical action descriptions like （叹气）（微笑）from AI replies */
function stripActionBrackets(text: string): string {
  return text
    .replace(/（[^）]*）/g, '')   // Chinese fullwidth brackets
    .replace(/\([^)]*\)/g, '')    // ASCII brackets (fallback)
    .replace(/\s{2,}/g, ' ')      // collapse double spaces
    .trim();
}

export async function requestAIReview(
  apiKey: string,
  personalityPrompt: string,
  content: string,
  history?: string,
  priorReply?: string
): Promise<{ success: boolean; reply?: string; error?: string }> {
  if (isElectron) return (window as any).electronAPI.requestAIReview(apiKey, personalityPrompt, content, history, priorReply);
  const result = await fetchJSON(`${BASE}/deepseek/chat`, {
    method: 'POST',
    body: JSON.stringify({ apiKey, personalityPrompt, content, history, priorReply }),
  });
  if (result.success && result.reply) {
    result.reply = stripActionBrackets(result.reply);
  }
  return result;
}
