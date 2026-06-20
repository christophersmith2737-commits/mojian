import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Sparkles, Loader2, Check, AlertCircle, CheckCircle } from 'lucide-react';
import type { CalendarDay, DiaryEntry, Personality } from '../types';
import AIReviewPanel from './AIReviewPanel';

interface EditorProps {
  day: CalendarDay | null;
  config: { deepseekApiKey: string; personalities: Personality[] };
  enabledPersonalities: Personality[];
  onClose: () => void;
  onSave: (entry: DiaryEntry) => Promise<boolean>;
  onRequestReviews: (entry: DiaryEntry, personalities: Personality[]) => Promise<DiaryEntry | null>;
}

export default function Editor({ day, config, enabledPersonalities, onClose, onSave, onRequestReviews }: EditorProps) {
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isRequestingReview, setIsRequestingReview] = useState(false);
  const [showReviewPrompt, setShowReviewPrompt] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [localEntry, setLocalEntry] = useState<DiaryEntry | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Selected personality IDs for review
  const [selectedPIds, setSelectedPIds] = useState<Set<string>>(new Set());
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isToday = day?.isToday ?? false;
  const canEdit = isToday;

  // Reset editor state when switching to a different day
  useEffect(() => {
    if (day) {
      setContent(day.entry?.content || '');
      setLocalEntry(day.entry);
      setShowReviewPrompt(false);
      setSavedSuccess(false);
      setError(null);
      if (isToday && textareaRef.current) {
        setTimeout(() => textareaRef.current?.focus(), 100);
      }
    }
  }, [day, isToday]);

  // Keep selected personalities in sync when personality config changes
  useEffect(() => {
    setSelectedPIds(new Set(enabledPersonalities.map(p => p.id)));
  }, [enabledPersonalities]);

  const handleSave = async () => {
    if (!day || !content.trim()) return;
    setIsSaving(true);
    setError(null);

    const entry: DiaryEntry = {
      date: day.dateStr,
      content: content.trim(),
      aiReviews: localEntry?.aiReviews || [],
      reviewRequested: localEntry?.reviewRequested || false,
      reviewRequestedAt: localEntry?.reviewRequestedAt || null,
      updatedAt: new Date().toISOString(),
    };

    const ok = await onSave(entry);
    setIsSaving(false);

    if (ok) {
      setLocalEntry(entry);
      setSavedSuccess(true);
      setShowReviewPrompt(true);
      setTimeout(() => setSavedSuccess(false), 2000);
    } else {
      setError('保存失败，请重试');
    }
  };

  const handleRequestReviews = async () => {
    if (!localEntry || !config.deepseekApiKey) {
      setError('请先在设置中配置 Deepseek API Key');
      return;
    }

    const selectedPersonalities = enabledPersonalities.filter(p => selectedPIds.has(p.id));
    if (selectedPersonalities.length === 0) {
      setError('请至少选择一种人格进行回复');
      return;
    }

    setIsRequestingReview(true);
    setError(null);

    const updated = await onRequestReviews(localEntry, selectedPersonalities);
    setIsRequestingReview(false);

    if (updated) {
      setLocalEntry(updated);
      setShowReviewPrompt(false);
    } else {
      setError('AI 回复失败，请检查 API Key 后重试');
    }
  };

  const handleDeclineReview = () => {
    setShowReviewPrompt(false);
  };

  const togglePersonality = (id: string) => {
    setSelectedPIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  if (!day) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center"
        style={{ background: 'var(--overlay-bg)', backdropFilter: 'blur(4px)' }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          onClick={e => e.stopPropagation()}
          className="w-full max-w-2xl max-h-[85vh] mx-4 glass-strong shadow-2xl overflow-hidden flex flex-col"
          style={{ boxShadow: '0 25px 60px rgba(0,0,0,0.3)' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
            <div>
              <h3 className="text-lg font-serif font-semibold" style={{ color: 'var(--text-primary)' }}>{day.dateStr}</h3>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                {isToday ? '今天' : '过去的日记'} · {canEdit ? '可编辑' : '只读'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {canEdit && (
                <motion.button
                  whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  onClick={handleSave} disabled={isSaving || !content.trim()}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-40"
                  style={{ background: 'var(--accent-gold)', color: '#fff' }}
                >
                  {isSaving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                  {isSaving ? '保存中...' : '保存'}
                </motion.button>
              )}
              <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={onClose}
                className="p-2 rounded-xl glass">
                <X size={18} style={{ color: 'var(--text-secondary)' }} />
              </motion.button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-5">
            {/* Success toast */}
            <AnimatePresence>
              {savedSuccess && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="flex items-center gap-2 px-3 py-2 mb-4 rounded-xl text-sm"
                  style={{ background: 'rgba(126, 200, 160, 0.1)', border: '1px solid rgba(126, 200, 160, 0.2)', color: 'var(--accent-mint)' }}>
                  <Check size={14} /> 保存成功
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error toast */}
            <AnimatePresence>
              {error && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="flex items-center gap-2 px-3 py-2 mb-4 rounded-xl text-sm"
                  style={{ background: 'rgba(220, 80, 80, 0.1)', border: '1px solid rgba(220, 80, 80, 0.2)', color: '#e06060' }}>
                  <AlertCircle size={14} /> {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Textarea */}
            <textarea
              ref={textareaRef}
              value={content} onChange={e => setContent(e.target.value)} readOnly={!canEdit}
              placeholder={isToday ? '今天发生了什么？写下你的想法、感受、故事...' : '这篇日记还没有内容'}
              className="editor-textarea w-full min-h-[200px]" rows={10}
            />

            {/* Multi-Personality Review Prompt */}
            <AnimatePresence>
              {showReviewPrompt && enabledPersonalities.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                  className="mt-6 p-5 rounded-2xl glass-strong"
                  style={{ borderColor: 'var(--accent-gold)', border: '1px solid rgba(212, 165, 116, 0.2)' }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles size={18} style={{ color: 'var(--accent-gold)' }} />
                    <span className="text-sm font-medium" style={{ color: 'var(--accent-gold)' }}>
                      选择 AI 人格进行回复
                    </span>
                  </div>
                  <p className="text-xs mb-4 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                    勾选的人格将分别以不同视角回复你的日记，回复将在明天解锁查看。
                  </p>

                  {/* Personality checklist */}
                  <div className="space-y-2 mb-4">
                    {enabledPersonalities.map(p => (
                      <label
                        key={p.id}
                        className="flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-colors"
                        style={{ background: 'var(--bg-hover)' }}
                      >
                        <input
                          type="checkbox"
                          checked={selectedPIds.has(p.id)}
                          onChange={() => togglePersonality(p.id)}
                          className="mt-0.5"
                          style={{ accentColor: 'var(--accent-gold)' }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <CheckCircle size={14} style={{ color: 'var(--accent-mint)' }} />
                            <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{p.name}</span>
                          </div>
                          <p className="text-xs mt-0.5 line-clamp-1" style={{ color: 'var(--text-muted)' }}>{p.prompt}</p>
                        </div>
                      </label>
                    ))}
                  </div>

                  <div className="flex gap-3">
                    <motion.button
                      whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                      onClick={handleRequestReviews}
                      disabled={isRequestingReview || selectedPIds.size === 0}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white transition-colors disabled:opacity-50"
                      style={{ background: 'var(--accent-gold)' }}
                    >
                      {isRequestingReview ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                      {isRequestingReview ? 'AI 回复中...' : `让 ${selectedPIds.size} 种人格回复`}
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                      onClick={handleDeclineReview}
                      className="px-5 py-2.5 rounded-xl text-sm transition-colors"
                      style={{ color: 'var(--text-secondary)', background: 'var(--bg-card)' }}
                    >
                      暂不需要
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* No personalities enabled */}
            <AnimatePresence>
              {showReviewPrompt && enabledPersonalities.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className="mt-6 p-5 rounded-2xl glass-strong text-center"
                >
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    还没有启用的人格。在设置中添加并启用人格后，AI 才能回复你的日记。
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* AI Reviews display */}
            {localEntry && (
              <AIReviewPanel entry={localEntry} isToday={isToday} />
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
