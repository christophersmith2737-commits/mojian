import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import type { CalendarDay } from '../types';
import DayCell from './DayCell';

interface CalendarProps {
  year: number;
  month: number;
  days: CalendarDay[];
  onNavigate: (delta: number) => void;
  onDayClick: (day: CalendarDay) => void;
  onTodayClick: () => void;
}

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];
const MONTH_NAMES = [
  '一月', '二月', '三月', '四月', '五月', '六月',
  '七月', '八月', '九月', '十月', '十一月', '十二月'
];

export default function Calendar({ year, month, days, onNavigate, onDayClick, onTodayClick }: CalendarProps) {
  return (
    <div className="w-full max-w-4xl mx-auto px-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onNavigate(-1)}
            className="p-2 rounded-xl glass hover:bg-white/10 transition-colors"
          >
            <ChevronLeft size={20} style={{ color: 'var(--text-muted)' }} />
          </motion.button>

          <motion.h2
            key={`${year}-${month}`}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl font-serif font-bold tracking-wide min-w-[180px] text-center"
            style={{ color: 'var(--text-primary)' }}
          >
            {year}年 {MONTH_NAMES[month - 1]}
          </motion.h2>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onNavigate(1)}
            className="p-2 rounded-xl glass hover:bg-white/10 transition-colors"
          >
            <ChevronRight size={20} style={{ color: 'var(--text-muted)' }} />
          </motion.button>
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onTodayClick}
          className="flex items-center gap-2 px-4 py-2 rounded-xl glass hover:bg-white/10 transition-colors text-sm"
          style={{ color: 'var(--text-secondary)' }}
        >
          <CalendarDays size={16} />
          <span>今天</span>
        </motion.button>
      </div>

      {/* Weekday headers */}
      <div className="calendar-grid mb-3">
        {WEEKDAYS.map((d, i) => (
          <div
            key={d}
            className="text-center text-xs font-medium py-2 tracking-wider"
            style={{ color: i === 0 || i === 6 ? 'var(--accent-rose)' : 'var(--text-muted)', opacity: i === 0 || i === 6 ? 0.6 : 0.4 }}
          >
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${year}-${month}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="calendar-grid"
        >
          {days.map((day) => (
            <DayCell
              key={day.dateStr}
              day={day}
              onClick={onDayClick}
            />
          ))}
        </motion.div>
      </AnimatePresence>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-6 text-xs" style={{ color: 'var(--text-muted)', opacity: 0.4 }}>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-accent-gold/50" />
          <span>今天</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-accent-lavender/50" />
          <span>AI已回复</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-white/10" />
          <span>有内容</span>
        </div>
      </div>
    </div>
  );
}
