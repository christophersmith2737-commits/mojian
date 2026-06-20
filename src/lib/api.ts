import type { DiaryEntry, Personality } from '../types';
import {
  readJournal as localRead,
  writeJournal as localWrite,
  listMonth as localList,
  readConfig as localReadConfig,
  writeConfig as localWriteConfig,
  requestAIReview as localAIReview,
} from './local-storage';

const BASE = 'http://localhost:5174/api';
const isElectron = typeof window !== 'undefined' && !!(window as any).electronAPI;
// Capacitor or standalone browser mode — no server needed
const isCapacitor = typeof window !== 'undefined' && !!(window as any).Capacitor;
// Also use local storage if the Python server isn't available (standalone HTML)
const useLocal = isCapacitor || (typeof window !== 'undefined' && window.location.protocol === 'file:');

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
  if (useLocal) return localRead(year, month, day);
  return fetchJSON(`${BASE}/journal/read?year=${year}&month=${month}&day=${day}`);
}

export async function writeJournal(entry: DiaryEntry): Promise<{ success: boolean; error?: string }> {
  if (isElectron) return (window as any).electronAPI.writeJournal(entry);
  if (useLocal) return localWrite(entry) ? { success: true } : { success: false, error: '写入失败' };
  return fetchJSON(`${BASE}/journal/write`, { method: 'POST', body: JSON.stringify(entry) });
}

export async function listMonth(year: number, month: number): Promise<DiaryEntry[]> {
  if (isElectron) return (window as any).electronAPI.listMonth(year, month);
  if (useLocal) return localList(year, month);
  return fetchJSON(`${BASE}/journal/list?year=${year}&month=${month}`);
}

// ---- Config APIs ----

export async function readConfig(): Promise<{ deepseekApiKey: string; personalities: Personality[]; sharedPrompt: string; theme: string }> {
  if (isElectron) return (window as any).electronAPI.readConfig() as any;
  if (useLocal) return localReadConfig();
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
  if (useLocal) return localWriteConfig(config) ? { success: true } : { success: false, error: '写入失败' };
  return fetchJSON(`${BASE}/config/write`, { method: 'POST', body: JSON.stringify(config) });
}

// ---- Deepseek AI ----

export async function requestAIReview(
  apiKey: string,
  personalityPrompt: string,
  content: string
): Promise<{ success: boolean; reply?: string; error?: string }> {
  if (isElectron) return (window as any).electronAPI.requestAIReview(apiKey, personalityPrompt, content);
  if (useLocal) return localAIReview(apiKey, personalityPrompt, content);
  return fetchJSON(`${BASE}/deepseek/chat`, {
    method: 'POST',
    body: JSON.stringify({ apiKey, personalityPrompt, content }),
  });
}
