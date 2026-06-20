import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, CalendarDays, Users, Palette, Lock, PenLine } from 'lucide-react';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FEATURES = [
  { icon: PenLine, label: '日记写作', desc: '优雅的编辑器，支持当天编辑、过往只读，自动保存' },
  { icon: CalendarDays, label: '日历视图', desc: '按月浏览，有内容的日期显示书签标记，AI 回复日期高亮发光蓝点' },
  { icon: Users, label: '多人格 AI 回复', desc: '自定义多种 AI 人格，每种人格以不同视角和语气回复你的日记' },
  { icon: Sparkles, label: 'AI 回复解锁', desc: '当天请求的 AI 回复隔天解锁，保留期待感' },
  { icon: Palette, label: '双主题切换', desc: '支持浅色/深色主题，一键切换，适配昼夜使用场景' },
  { icon: Lock, label: '本地存储', desc: '所有数据（日记、配置、API Key）仅保存在你的电脑本地，不上传任何服务器' },
];

export default function AboutModal({ isOpen, onClose }: AboutModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'var(--overlay-bg)', backdropFilter: 'blur(4px)' }}
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
            onClick={e => e.stopPropagation()}
            className="w-full max-w-md mx-4 max-h-[80vh] overflow-hidden flex flex-col glass-strong"
            style={{ boxShadow: '0 25px 60px rgba(0,0,0,0.3)' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
              <div className="flex items-center gap-2">
                <img src="/tubiao.png" alt="墨笺" className="w-8 h-8 rounded-lg object-cover" />
                <h3 className="text-lg font-serif font-semibold" style={{ color: 'var(--text-primary)' }}>关于 墨笺</h3>
              </div>
              <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={onClose}
                className="p-2 rounded-xl glass hover:bg-white/10">
                <X size={16} style={{ color: 'var(--text-secondary)' }} />
              </motion.button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5">
              {/* Intro */}
              <div className="text-center mb-6">
                <h2 className="text-2xl font-serif font-bold mb-1" style={{ color: 'var(--text-primary)' }}>墨笺</h2>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>每日一页，记录时光</p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)', opacity: 0.6 }}>
                  AI 驱动的智能日记本
                </p>
              </div>

              {/* Features */}
              <div className="space-y-3">
                {FEATURES.map((f) => (
                  <div
                    key={f.label}
                    className="flex items-start gap-3 p-3 rounded-xl"
                    style={{ background: 'var(--bg-hover)' }}
                  >
                    <div className="p-1.5 rounded-lg flex-shrink-0" style={{ background: 'var(--bg-card)' }}>
                      <f.icon size={16} style={{ color: 'var(--accent-gold)' }} />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{f.label}</h4>
                      <p className="text-xs mt-0.5 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Author */}
              <div
                className="mt-6 p-4 rounded-xl text-center"
                style={{ background: 'linear-gradient(135deg, rgba(184, 169, 232, 0.08), rgba(196, 112, 138, 0.08))' }}
              >
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>作者</p>
                <p
                  className="text-lg font-serif font-bold mt-0.5 tracking-wide"
                  style={{
                    background: 'linear-gradient(135deg, var(--accent-lavender), var(--accent-rose))',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  Harlemonica
                </p>
                <p className="text-[10px] mt-1" style={{ color: 'var(--text-muted)', opacity: 0.5 }}>
                  Made with love & AI
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="p-3 border-t text-center" style={{ borderColor: 'var(--border-subtle)' }}>
              <p className="text-[10px]" style={{ color: 'var(--text-muted)', opacity: 0.5 }}>
                墨笺 v1.0 · 数据安全存储于本地
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
