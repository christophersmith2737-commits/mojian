import { useState, useEffect, useCallback, useMemo } from 'react';
import type { DiaryEntry, CalendarDay, AppConfig, Personality, AIReview } from '../types';
import * as storage from '../lib/storage';
import { requestAIReview } from '../lib/deepseek';

function getToday() {
  const now = new Date();
  return {
    year: now.getFullYear(),
    month: now.getMonth() + 1,
    day: now.getDate(),
    dateStr: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`,
  };
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number): number {
  return new Date(year, month - 1, 1).getDay();
}

export function useJournal() {
  const today = getToday();
  const [currentYear, setCurrentYear] = useState(today.year);
  const [currentMonth, setCurrentMonth] = useState(today.month);
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(null);
  const [config, setConfig] = useState<AppConfig>({ deepseekApiKey: '', personalities: [], sharedPrompt: '', theme: 'light' });
  const [isLoading, setIsLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    storage.readConfig().then(c => setConfig({
      deepseekApiKey: c.deepseekApiKey,
      personalities: c.personalities,
      sharedPrompt: c.sharedPrompt || '',
      theme: (c.theme as 'light' | 'dark') || 'light',
    }));
  }, []);

  useEffect(() => {
    setIsLoading(true);
    storage.listMonthEntries(currentYear, currentMonth).then(data => {
      setEntries(data);
      setIsLoading(false);
    });
  }, [currentYear, currentMonth]);

  const saveConfig = useCallback(async (updates: Partial<AppConfig>) => {
    const ok = await storage.writeConfig(updates);
    if (ok) setConfig(prev => ({ ...prev, ...updates }));
    return ok;
  }, []);

  const updatePersonalities = useCallback(async (personalities: Personality[]) => {
    return saveConfig({ personalities });
  }, [saveConfig]);

  const updateTheme = useCallback(async (theme: 'light' | 'dark') => {
    return saveConfig({ theme });
  }, [saveConfig]);

  const buildCalendarDays = useCallback((): CalendarDay[] => {
    const days: CalendarDay[] = [];
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDay = getFirstDayOfWeek(currentYear, currentMonth);
    const prevMonthDays = getDaysInMonth(currentYear, currentMonth - 1 || 12);

    for (let i = firstDay - 1; i >= 0; i--) {
      const day = prevMonthDays - i;
      const m = currentMonth === 1 ? 12 : currentMonth - 1;
      const y = currentMonth === 1 ? currentYear - 1 : currentYear;
      days.push({
        year: y, month: m, day,
        dateStr: `${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
        isToday: false, isPast: true, isFuture: false, isCurrentMonth: false, entry: null,
      });
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const isToday = dateStr === today.dateStr;
      const isPast = dateStr < today.dateStr;
      const isFuture = dateStr > today.dateStr;
      const entry = entries.find(e => e.date === dateStr) || null;
      days.push({
        year: currentYear, month: currentMonth, day,
        dateStr, isToday, isPast, isFuture, isCurrentMonth: true, entry,
      });
    }

    const remaining = 42 - days.length;
    const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
    const nextYear = currentMonth === 12 ? currentYear + 1 : currentYear;
    for (let day = 1; day <= remaining; day++) {
      days.push({
        year: nextYear, month: nextMonth, day,
        dateStr: `${nextYear}-${String(nextMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
        isToday: false, isPast: false, isFuture: true, isCurrentMonth: false, entry: null,
      });
    }

    return days;
  }, [currentYear, currentMonth, entries, today.dateStr]);

  const saveEntry = useCallback(async (entry: DiaryEntry): Promise<boolean> => {
    const ok = await storage.writeJournal(entry);
    if (ok) {
      setEntries(prev => {
        const idx = prev.findIndex(e => e.date === entry.date);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = entry;
          return updated;
        }
        return [...prev, entry];
      });
    }
    return ok;
  }, []);

  // Fetch recent diary entries from past dates (for AI context)
  const fetchDiaryHistory = useCallback(async (beforeDate: string, maxEntries = 10): Promise<string> => {
    const parts = beforeDate.split('-');
    let year = parseInt(parts[0]);
    let month = parseInt(parts[1]);
    const historyEntries: DiaryEntry[] = [];

    // Search backwards through months until we have enough entries
    while (historyEntries.length < maxEntries && (year > today.year - 2)) {
      const monthEntries = await storage.listMonthEntries(year, month);
      for (const e of monthEntries) {
        if (e.date < beforeDate && e.content.trim().length > 0) {
          historyEntries.push(e);
        }
      }
      // Go to previous month
      month--;
      if (month < 1) { month = 12; year--; }
    }

    // Sort by date ascending and take the most recent N
    historyEntries.sort((a, b) => a.date.localeCompare(b.date));
    const recent = historyEntries.slice(-maxEntries);

    if (recent.length === 0) return '';

    return recent.map(e => `【${e.date}】\n${e.content}`).join('\n\n');
  }, [today.year]);

  // Request AI reviews from multiple personalities
  const requestReviews = useCallback(async (
    entry: DiaryEntry,
    selectedPersonalities: Personality[]
  ): Promise<DiaryEntry | null> => {
    if (!config.deepseekApiKey || selectedPersonalities.length === 0) return null;

    // Fetch diary history for context
    const history = await fetchDiaryHistory(entry.date);

    const reviews: AIReview[] = [];

    for (const p of selectedPersonalities) {
      const combinedPrompt = config.sharedPrompt
        ? `${p.prompt}\n\n${config.sharedPrompt}`
        : p.prompt;
      const result = await requestAIReview(config.deepseekApiKey, combinedPrompt, entry.content, history || undefined);
      if (result.success && result.reply) {
        reviews.push({
          personalityId: p.id,
          personalityName: p.name,
          content: result.reply,
          createdAt: new Date().toISOString(),
        });
      }
    }

    if (reviews.length > 0) {
      const updated: DiaryEntry = {
        ...entry,
        aiReviews: [...(entry.aiReviews || []), ...reviews],
        reviewRequested: true,
        reviewRequestedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await saveEntry(updated);
      return updated;
    }
    return null;
  }, [config.deepseekApiKey, saveEntry, fetchDiaryHistory]);

  const navigateMonth = useCallback((delta: number) => {
    setCurrentMonth(prev => {
      if (prev + delta > 12) { setCurrentYear(y => y + 1); return 1; }
      if (prev + delta < 1) { setCurrentYear(y => y - 1); return 12; }
      return prev + delta;
    });
    setSelectedDay(null);
  }, []);

  const goToToday = useCallback(() => {
    setCurrentYear(today.year);
    setCurrentMonth(today.month);
    setSelectedDay(null);
  }, [today.year, today.month]);

  const enabledPersonalities = useMemo(
    () => config.personalities.filter(p => p.enabled),
    [config.personalities]
  );

  return {
    currentYear, currentMonth, today, entries, selectedDay, config,
    isLoading, showSettings, setShowSettings, setSelectedDay,
    buildCalendarDays, saveEntry, requestReviews, saveConfig,
    updatePersonalities, updateTheme,
    navigateMonth, goToToday,
    enabledPersonalities,
  };
}
