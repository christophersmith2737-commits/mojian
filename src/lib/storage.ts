import type { DiaryEntry, Personality } from '../types';
import {
  readJournal as apiRead,
  writeJournal as apiWrite,
  listMonth as apiList,
  readConfig as apiReadConfig,
  writeConfig as apiWriteConfig,
} from './api';

export async function readJournal(year: number, month: number, day: number): Promise<DiaryEntry | null> {
  return apiRead(year, month, day);
}

export async function writeJournal(entry: DiaryEntry): Promise<boolean> {
  const result = await apiWrite(entry);
  return result.success;
}

export async function listMonthEntries(year: number, month: number): Promise<DiaryEntry[]> {
  return apiList(year, month);
}

export async function readConfig(): Promise<{
  deepseekApiKey: string;
  personalities: Personality[];
  sharedPrompt: string;
  theme: string;
}> {
  return apiReadConfig();
}

export async function writeConfig(config: {
  deepseekApiKey?: string;
  personalities?: Personality[];
  sharedPrompt?: string;
  theme?: string;
}): Promise<boolean> {
  const result = await apiWriteConfig(config);
  return result.success;
}
