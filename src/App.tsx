import { useCallback, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Settings, Sun, Moon, Info } from 'lucide-react';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { useJournal } from './hooks/useJournal';
import Calendar from './components/Calendar';
import Editor from './components/Editor';
import SettingsModal from './components/SettingsModal';
import AboutModal from './components/AboutModal';
import type { CalendarDay, DiaryEntry, Personality } from './types';

function AppInner() {
  const { theme, toggleTheme, isDark } = useTheme();
  const [showAbout, setShowAbout] = useState(false);
  const {
    currentYear,
    currentMonth,
    today,
    selectedDay,
    config,
    showSettings,
    setShowSettings,
    setSelectedDay,
    buildCalendarDays,
    saveEntry,
    requestReviews,
    saveConfig,
    updatePersonalities,
    navigateMonth,
    goToToday,
    enabledPersonalities,
  } = useJournal();

  const days = useMemo(() => buildCalendarDays(), [buildCalendarDays]);

  const handleDayClick = useCallback((day: CalendarDay) => {
    if (day.isFuture || !day.isCurrentMonth) return;
    setSelectedDay(day);
  }, [setSelectedDay]);

  const handleSave = useCallback(async (entry: DiaryEntry) => saveEntry(entry), [saveEntry]);

  const handleRequestReviews = useCallback(async (entry: DiaryEntry, personalities: Personality[]) => {
    return requestReviews(entry, personalities);
  }, [requestReviews]);

  const handleSaveConfig = useCallback(async (cfg: { deepseekApiKey?: string; sharedPrompt?: string }) => {
    return saveConfig(cfg);
  }, [saveConfig]);

  return (
    <div className="h-screen flex flex-col relative overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
      {/* Ambient background orbs */}
      <div className="bg-ambient">
        <motion.div className="bg-orb bg-orb-1"
          animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }} />
        <motion.div className="bg-orb bg-orb-2"
          animate={{ x: [0, -20, 0], y: [0, 15, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }} />
        <motion.div className="bg-orb bg-orb-3"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }} />
      </div>

      {/* Top bar */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3">
          <img src="/tubiao.png" alt="墨笺" className="w-9 h-9 rounded-xl object-cover" />
          <div>
            <h1 className="text-xl font-serif font-bold tracking-wide" style={{ color: 'var(--text-primary)' }}>墨笺</h1>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>每日一页，记录时光</p>
          </div>
        </motion.div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
            {today.dateStr}
          </span>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className={`theme-toggle ${isDark ? 'dark' : 'light'}`}
            title={isDark ? '切换白天模式' : '切换黑夜模式'}
            style={{
              background: 'var(--toggle-bg)',
            }}
          >
            <span style={{
              position: 'absolute',
              top: '3px',
              left: isDark ? '31px' : '5px',
              transition: 'left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '22px',
              height: '22px',
            }}>
              {isDark ? <Moon size={13} color="#7c6db8" /> : <Sun size={13} color="#b8860b" />}
            </span>
          </button>

          <motion.button
            whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
            onClick={() => setShowAbout(true)}
            className="p-2.5 rounded-xl glass hover:bg-white/10 transition-colors" title="关于"
          >
            <Info size={18} style={{ color: 'var(--text-secondary)' }} />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
            onClick={() => setShowSettings(true)}
            className="p-2.5 rounded-xl glass hover:bg-white/10 transition-colors" title="设置"
          >
            <Settings size={18} style={{ color: 'var(--text-secondary)' }} />
          </motion.button>
        </div>
      </header>

      {/* Main content */}
      <main className="relative z-10 flex-1 overflow-y-auto py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Calendar
            year={currentYear} month={currentMonth} days={days}
            onNavigate={navigateMonth} onDayClick={handleDayClick} onTodayClick={goToToday}
          />
        </motion.div>
      </main>

      {/* Editor modal */}
      <Editor
        day={selectedDay}
        config={config}
        enabledPersonalities={enabledPersonalities}
        onClose={() => setSelectedDay(null)}
        onSave={handleSave}
        onRequestReviews={handleRequestReviews}
      />

      {/* Settings modal */}
      <SettingsModal
        isOpen={showSettings}
        config={config}
        onClose={() => setShowSettings(false)}
        onSaveConfig={handleSaveConfig}
        onUpdatePersonalities={updatePersonalities}
      />

      {/* About modal */}
      <AboutModal
        isOpen={showAbout}
        onClose={() => setShowAbout(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppInner />
    </ThemeProvider>
  );
}
