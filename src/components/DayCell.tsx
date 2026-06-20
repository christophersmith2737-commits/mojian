import { motion } from 'framer-motion';
import { BookOpen } from 'lucide-react';
import type { CalendarDay } from '../types';

interface DayCellProps {
  day: CalendarDay;
  onClick: (day: CalendarDay) => void;
}

export default function DayCell({ day, onClick }: DayCellProps) {
  const { entry, isToday, isPast, isFuture, isCurrentMonth, day: dayNum } = day;
  const hasContent = entry && entry.content.trim().length > 0;
  const reviewCount = entry?.aiReviews?.length || 0;
  const hasReview = reviewCount > 0;
  const reviewUnlocked = hasReview && entry?.reviewRequestedAt
    ? new Date(entry.reviewRequestedAt).toDateString() !== new Date().toDateString()
    : false;

  if (isFuture || !isCurrentMonth) {
    return (
      <div className={`day-cell glass rounded-2xl p-3 min-h-[90px] flex flex-col ${!isCurrentMonth ? 'opacity-20' : 'future'}`}>
        <span className="text-sm font-medium" style={{ color: 'var(--text-muted)', opacity: 0.2 }}>{dayNum}</span>
      </div>
    );
  }

  return (
    <motion.div
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      onClick={() => onClick(day)}
      className="day-cell glass rounded-2xl p-3 min-h-[90px] flex flex-col cursor-pointer relative overflow-hidden"
    >
      {/* Date number */}
      <div className="flex items-center justify-between mb-1">
        <span
          className="text-sm font-semibold px-2 py-0.5 rounded-full"
          style={{
            background: isToday ? 'rgba(212, 165, 116, 0.15)' : 'transparent',
            color: isToday ? 'var(--accent-gold)' : 'var(--text-muted)',
          }}
        >
          {dayNum}
        </span>

        {/* Indicators */}
        <div className="flex gap-1 items-center">
          {hasContent && <BookOpen size={12} style={{ color: 'var(--text-muted)', opacity: 0.4 }} />}
          {/* Glowing blue dot for AI-replied entries */}
          {hasReview && (
            <span
              className={`ai-glow-dot ${reviewUnlocked ? 'ai-glow-dot--active' : 'ai-glow-dot--locked'}`}
            />
          )}
          {hasReview && reviewUnlocked && (
            <span className="text-[9px] font-medium" style={{ color: 'var(--accent-lavender)' }}>{reviewCount}</span>
          )}
          {hasReview && !reviewUnlocked && (
            <span className="text-[9px] font-medium" style={{ color: 'var(--text-muted)', opacity: 0.3 }}>{reviewCount}</span>
          )}
        </div>
      </div>

      {/* Content preview */}
      {hasContent ? (
        <p className="text-xs leading-relaxed line-clamp-3 font-serif flex-1" style={{ color: 'var(--text-secondary)' }}>
          {entry!.content.slice(0, 80)}{entry!.content.length > 80 ? '...' : ''}
        </p>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <span className="text-xs font-serif" style={{ color: 'var(--text-muted)', opacity: 0.15 }}>
            {isToday ? '写下今天的故事...' : isPast ? '空白的一页' : ''}
          </span>
        </div>
      )}

      {/* AI review badge */}
      {hasReview && (
        <div
          className="mt-1 text-[10px] px-1.5 py-0.5 rounded-full w-fit"
          style={{
            background: reviewUnlocked ? 'rgba(184, 169, 232, 0.12)' : 'rgba(255, 255, 255, 0.04)',
            color: reviewUnlocked ? 'var(--accent-lavender)' : 'var(--text-muted)',
          }}
        >
          {reviewUnlocked ? `✨ ${reviewCount}条回复` : `🔒 ${reviewCount}条待解锁`}
        </div>
      )}

      {/* Today glow effect */}
      {isToday && (
        <div className="absolute inset-0 rounded-2xl pointer-events-none"
          style={{ background: 'linear-gradient(135deg, rgba(212, 165, 116, 0.04), transparent)' }} />
      )}
    </motion.div>
  );
}
