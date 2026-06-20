import { motion } from 'framer-motion';
import { Sparkles, Lock, MessageCircle, User } from 'lucide-react';
import type { DiaryEntry } from '../types';

interface AIReviewPanelProps {
  entry: DiaryEntry;
  isToday: boolean;
}

export default function AIReviewPanel({ entry, isToday }: AIReviewPanelProps) {
  const hasReviews = entry.aiReviews && entry.aiReviews.length > 0;
  const isLocked = isToday && entry.reviewRequestedAt
    ? new Date(entry.reviewRequestedAt).toDateString() === new Date().toDateString()
    : false;

  if (!entry.reviewRequested && !hasReviews) {
    return null;
  }

  if (isLocked) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="mt-6 p-5 rounded-2xl glass-strong"
        style={{ borderColor: 'rgba(212, 165, 116, 0.2)' }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Lock size={16} style={{ color: 'var(--accent-gold)' }} />
          <span className="text-sm font-medium" style={{ color: 'var(--accent-gold)' }}>
            共 {entry.aiReviews?.length || 0} 条 AI 回复已生成，明日解锁查看
          </span>
        </div>
        <p className="text-sm leading-relaxed font-serif" style={{ color: 'var(--text-muted)' }}>
          等待是一种美好的仪式，明天再来看看 AI 们对这篇日记的回应吧...
        </p>
      </motion.div>
    );
  }

  if (!hasReviews) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="mt-6"
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="p-1.5 rounded-lg" style={{ background: 'rgba(184, 169, 232, 0.1)' }}>
          <Sparkles size={16} style={{ color: 'var(--accent-lavender)' }} />
        </div>
        <span className="text-sm font-medium" style={{ color: 'var(--accent-lavender)' }}>
          AI 回复 ({entry.aiReviews.length})
        </span>
        <span className="text-[10px] ml-auto" style={{ color: 'var(--text-muted)' }}>
          {entry.reviewRequestedAt ? new Date(entry.reviewRequestedAt).toLocaleDateString('zh-CN') : ''}
        </span>
      </div>

      {/* Each personality review */}
      <div className="space-y-3">
        {entry.aiReviews.map((review, idx) => (
          <motion.div
            key={review.personalityId || idx}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="p-5 rounded-2xl glass-strong relative overflow-hidden"
          >
            {/* Personality header */}
            <div className="flex items-center gap-2 mb-3 pb-3 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
              <div className="w-6 h-6 rounded-full flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, var(--accent-lavender), var(--accent-rose))' }}>
                <User size={12} color="#fff" />
              </div>
              <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                {review.personalityName || 'AI'}
              </span>
              <span className="text-[10px] ml-auto" style={{ color: 'var(--text-muted)' }}>
                {review.createdAt ? new Date(review.createdAt).toLocaleString('zh-CN', { hour: '2-digit', minute: '2-digit' }) : ''}
              </span>
            </div>

            {/* Review content */}
            <div className="relative">
              <MessageCircle size={16} className="mb-3 opacity-30" style={{ color: 'var(--accent-lavender)' }} />
              <p className="text-sm leading-relaxed font-serif whitespace-pre-wrap" style={{ color: 'var(--text-secondary)' }}>
                {review.content}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-3 flex items-center justify-end gap-2">
        <div className="w-4 h-4 rounded-full flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, var(--accent-lavender), var(--accent-rose))' }}>
          <span className="text-[7px]" style={{ color: '#fff' }}>AI</span>
        </div>
        <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Deepseek 生成</span>
      </div>
    </motion.div>
  );
}
