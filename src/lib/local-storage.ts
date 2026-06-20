/**
 * Browser-native storage using localStorage.
 * Used when running in Capacitor (Android) or standalone browser mode —
 * no Python server or Electron required.
 */
import type { DiaryEntry, Personality } from '../types';
import { PRESET_PERSONALITIES } from './presets';

const CONFIG_KEY = 'mojian_config';
const JOURNAL_PREFIX = 'mojian_journal_';

// ---- Journal CRUD ----

export function readJournal(year: number, month: number, day: number): DiaryEntry | null {
  const key = JOURNAL_PREFIX + `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const raw = localStorage.getItem(key);
  return raw ? JSON.parse(raw) : null;
}

export function writeJournal(entry: DiaryEntry): boolean {
  const key = JOURNAL_PREFIX + entry.date;
  entry.updatedAt = new Date().toISOString();
  localStorage.setItem(key, JSON.stringify(entry));
  return true;
}

export function listMonth(year: number, month: number): DiaryEntry[] {
  const prefix = JOURNAL_PREFIX + `${year}-${String(month).padStart(2, '0')}-`;
  const entries: DiaryEntry[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(prefix)) {
      try {
        entries.push(JSON.parse(localStorage.getItem(key)!));
      } catch { /* skip corrupted */ }
    }
  }
  return entries.sort((a, b) => a.date.localeCompare(b.date));
}

// ---- Config ----

function seedPresets(config: { personalities: Personality[] }) {
  // Merge presets — add any preset not already present by name
  const existingNames = new Set((config.personalities || []).map(p => p.name));
  const newPresets = PRESET_PERSONALITIES.filter(p => !existingNames.has(p.name));
  if (newPresets.length > 0) {
    config.personalities = [...(config.personalities || []), ...newPresets];
  }
}

export function readConfig(): {
  deepseekApiKey: string;
  personalities: Personality[];
  sharedPrompt: string;
  theme: string;
} {
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      const config = {
        deepseekApiKey: data.deepseekApiKey || '',
        personalities: data.personalities || [],
        sharedPrompt: data.sharedPrompt || '',
        theme: data.theme || 'light',
      };
      seedPresets(config);
      return config;
    }
  } catch { /* fall through */ }
  // First run — seed presets into default config
  const config = { deepseekApiKey: '', personalities: [] as Personality[], sharedPrompt: '', theme: 'light' };
  seedPresets(config);
  return config;
}

export function writeConfig(config: {
  deepseekApiKey?: string;
  personalities?: Personality[];
  sharedPrompt?: string;
  theme?: string;
}): boolean {
  try {
    const existing = readConfig();
    const merged = { ...existing, ...config };
    localStorage.setItem(CONFIG_KEY, JSON.stringify(merged));
    return true;
  } catch {
    return false;
  }
}

// ---- DeepSeek AI (direct call, no proxy) ----

export async function requestAIReview(
  apiKey: string,
  personalityPrompt: string,
  content: string
): Promise<{ success: boolean; reply?: string; error?: string }> {
  try {
    const systemPrompt = personalityPrompt || '你是一位温暖、富有洞察力的朋友，善于倾听和回应。请用中文回复。';
    const res = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `请根据你的人设，以你的风格回复这篇日记：\n\n${content}` },
        ],
        temperature: 0.8,
        max_tokens: 800,
      }),
    });
    const result = await res.json();
    if (result.choices && result.choices[0]) {
      return { success: true, reply: result.choices[0].message.content };
    }
    return { success: false, error: result.error?.message || '未知响应格式' };
  } catch (e: any) {
    return { success: false, error: e.message || '请求失败' };
  }
}
