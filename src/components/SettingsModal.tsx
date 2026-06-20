import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Key, Eye, EyeOff, Check, ExternalLink, Plus, Trash2, ToggleLeft, ToggleRight, Users, Sparkles } from 'lucide-react';
import type { AppConfig, Personality } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  config: AppConfig;
  onClose: () => void;
  onSaveConfig: (cfg: { deepseekApiKey?: string; sharedPrompt?: string }) => Promise<boolean>;
  onUpdatePersonalities: (personalities: Personality[]) => Promise<boolean>;
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export default function SettingsModal({ isOpen, config, onClose, onSaveConfig, onUpdatePersonalities }: SettingsModalProps) {
  const [tab, setTab] = useState<'api' | 'personalities'>('api');
  const [apiKey, setApiKey] = useState(config.deepseekApiKey);
  const [showKey, setShowKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Personality editor state
  const [editingPersonality, setEditingPersonality] = useState<Personality | null>(null);
  const [editName, setEditName] = useState('');
  const [editPrompt, setEditPrompt] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // Shared prompt state
  const [sharedPromptDraft, setSharedPromptDraft] = useState(config.sharedPrompt || '');
  const [sharedPromptSaved, setSharedPromptSaved] = useState(false);

  // Delete confirmation state
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const deleteTarget = deleteConfirmId
    ? config.personalities.find(p => p.id === deleteConfirmId)
    : null;

  // Sync local state when config loads async (fixes settings not persisting on reopen)
  useEffect(() => {
    setApiKey(config.deepseekApiKey);
  }, [config.deepseekApiKey]);

  useEffect(() => {
    setSharedPromptDraft(config.sharedPrompt || '');
  }, [config.sharedPrompt]);

  // Save shared prompt when modal closes (not just onBlur)
  useEffect(() => {
    if (!isOpen && sharedPromptDraft !== config.sharedPrompt) {
      saveSharedPrompt();
    }
  }, [isOpen]);

  const saveSharedPrompt = async () => {
    if (sharedPromptDraft === config.sharedPrompt) return;
    setIsSaving(true);
    const ok = await onSaveConfig({ sharedPrompt: sharedPromptDraft.trim() });
    setIsSaving(false);
    if (ok) { setSharedPromptSaved(true); setTimeout(() => setSharedPromptSaved(false), 2000); }
  };

  const handleSaveApiKey = async () => {
    setIsSaving(true);
    const ok = await onSaveConfig({ deepseekApiKey: apiKey.trim() });
    setIsSaving(false);
    if (ok) { setSaved(true); setTimeout(() => setSaved(false), 2000); }
  };

  const startAdd = () => {
    setIsAdding(true);
    setEditingPersonality(null);
    setEditName('');
    setEditPrompt('');
  };

  const startEdit = (p: Personality) => {
    setIsAdding(false);
    setEditingPersonality(p);
    setEditName(p.name);
    setEditPrompt(p.prompt);
  };

  const cancelEdit = () => {
    setIsAdding(false);
    setEditingPersonality(null);
    setEditName('');
    setEditPrompt('');
  };

  const savePersonality = async () => {
    if (!editName.trim() || !editPrompt.trim()) return;
    let updated: Personality[];

    if (isAdding) {
      const newP: Personality = { id: generateId(), name: editName.trim(), prompt: editPrompt.trim(), enabled: true };
      updated = [...config.personalities, newP];
    } else if (editingPersonality) {
      updated = config.personalities.map(p =>
        p.id === editingPersonality.id ? { ...p, name: editName.trim(), prompt: editPrompt.trim() } : p
      );
    } else {
      return;
    }
    await onUpdatePersonalities(updated);
    cancelEdit();
  };

  const deletePersonality = (id: string) => {
    setDeleteConfirmId(id);
  };

  const confirmDelete = async () => {
    if (!deleteConfirmId) return;
    const updated = config.personalities.filter(p => p.id !== deleteConfirmId);
    await onUpdatePersonalities(updated);
    setDeleteConfirmId(null);
  };

  const cancelDelete = () => {
    setDeleteConfirmId(null);
  };

  const togglePersonality = async (id: string) => {
    const updated = config.personalities.map(p =>
      p.id === id ? { ...p, enabled: !p.enabled } : p
    );
    await onUpdatePersonalities(updated);
  };

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
            className="w-full max-w-lg mx-4 max-h-[80vh] overflow-hidden flex flex-col glass-strong relative"
            style={{ boxShadow: '0 25px 60px rgba(0,0,0,0.3)' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-accent-sky/10">
                  <Key size={16} style={{ color: 'var(--accent-sky)' }} />
                </div>
                <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>设置</h3>
              </div>
              <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={onClose}
                className="p-2 rounded-xl glass hover:bg-white/10">
                <X size={16} style={{ color: 'var(--text-secondary)' }} />
              </motion.button>
            </div>

            {/* Tabs */}
            <div className="flex border-b" style={{ borderColor: 'var(--border-subtle)' }}>
              <button
                onClick={() => setTab('api')}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${
                  tab === 'api'
                    ? 'border-b-2'
                    : 'opacity-50 hover:opacity-80'
                }`}
                style={{
                  borderColor: tab === 'api' ? 'var(--accent-gold)' : 'transparent',
                  color: tab === 'api' ? 'var(--text-primary)' : 'var(--text-muted)',
                }}
              >
                <Key size={14} className="inline mr-1.5" />
                API Key
              </button>
              <button
                onClick={() => setTab('personalities')}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${
                  tab === 'personalities'
                    ? 'border-b-2'
                    : 'opacity-50 hover:opacity-80'
                }`}
                style={{
                  borderColor: tab === 'personalities' ? 'var(--accent-gold)' : 'transparent',
                  color: tab === 'personalities' ? 'var(--text-primary)' : 'var(--text-muted)',
                }}
              >
                <Users size={14} className="inline mr-1.5" />
                人格管理
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5">
              {tab === 'api' ? (
                /* === API Key Tab === */
                <div>
                  <label className="block text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
                    Deepseek API Key
                  </label>
                  <div className="relative">
                    <input
                      type={showKey ? 'text' : 'password'}
                      value={apiKey}
                      onChange={e => setApiKey(e.target.value)}
                      placeholder="sk-..."
                      className="w-full px-4 py-3 pr-12 rounded-xl glass border text-sm transition-colors"
                      style={{
                        borderColor: 'var(--border-medium)',
                        color: 'var(--text-primary)',
                        background: 'var(--input-bg)',
                      }}
                    />
                    <button
                      onClick={() => setShowKey(!showKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <div className="flex items-center gap-1 mt-2">
                    <a href="https://platform.deepseek.com/api_keys" target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs transition-colors"
                      style={{ color: 'var(--accent-sky)' }}>
                      <ExternalLink size={10} /> 获取 API Key
                    </a>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={handleSaveApiKey} disabled={isSaving}
                    className={`w-full mt-5 py-3 rounded-xl text-sm font-medium transition-all ${
                      saved ? 'bg-accent-mint/20 text-accent-mint' : 'bg-accent-sky/15 text-accent-sky hover:bg-accent-sky/25'
                    } disabled:opacity-50`}
                  >
                    {saved ? <span className="flex items-center justify-center gap-2"><Check size={15} />已保存</span>
                      : isSaving ? '保存中...' : '保存设置'}
                  </motion.button>
                </div>
              ) : (
                /* === Personalities Tab === */
                <div>
                  {/* Shared Prompt Section */}
                  <div className="mb-5 p-4 rounded-xl" style={{ background: 'var(--bg-hover)', border: '1px solid var(--accent-gold)', borderColor: 'rgba(184, 134, 11, 0.2)' }}>
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles size={14} style={{ color: 'var(--accent-gold)' }} />
                      <h4 className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>公共提示词</h4>
                      <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(184, 134, 11, 0.1)', color: 'var(--accent-gold)' }}>全局生效</span>
                    </div>
                    <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
                      所有 AI 人格回复时都会自动追加此提示词，例如"回复不超过 100 字"
                    </p>
                    <textarea
                      value={sharedPromptDraft}
                      onChange={e => setSharedPromptDraft(e.target.value)}
                      onBlur={() => saveSharedPrompt()}
                      placeholder="输入公共提示词，例如：回复不超过 100 字、请使用温柔的语气..."
                      rows={2}
                      className="w-full px-3 py-2 rounded-lg text-sm resize-none"
                      style={{ background: 'var(--input-bg)', color: 'var(--text-primary)', border: '1px solid var(--border-medium)' }}
                    />
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                        修改后自动保存
                      </span>
                      {sharedPromptSaved && (
                        <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--accent-mint)' }}>
                          <Check size={12} /> 已保存
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-4">
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      设置 AI 回复人格，每种人格会以不同视角回复你的日记
                    </p>
                    <motion.button
                      whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                      onClick={startAdd}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                      style={{ background: 'var(--accent-gold)', color: '#fff' }}
                    >
                      <Plus size={13} /> 添加人格
                    </motion.button>
                  </div>

                  {/* Personality list */}
                  <div className="space-y-2">
                    {config.personalities.length === 0 && !isAdding && (
                      <p className="text-center py-8 text-sm" style={{ color: 'var(--text-muted)' }}>
                        还没有添加人格，点击上方按钮创建
                      </p>
                    )}

                    {config.personalities.map(p => (
                      <div key={p.id}
                        className="p-3 rounded-xl glass transition-all"
                        style={{ borderColor: p.enabled ? 'var(--border-medium)' : 'var(--border-subtle)', opacity: p.enabled ? 1 : 0.5 }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{p.name}</h4>
                            <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>{p.prompt.slice(0, 60)}...</p>
                          </div>
                          <div className="flex items-center gap-1 ml-2">
                            <button onClick={() => togglePersonality(p.id)}
                              className="p-1 rounded-lg transition-colors hover:bg-white/5">
                              {p.enabled
                                ? <ToggleRight size={20} style={{ color: 'var(--accent-mint)' }} />
                                : <ToggleLeft size={20} style={{ color: 'var(--text-muted)' }} />
                              }
                            </button>
                            <button onClick={() => startEdit(p)}
                              className="p-1.5 rounded-lg transition-colors hover:bg-white/10"
                              style={{ color: 'var(--text-muted)' }}>
                              <span style={{ fontSize: '11px' }}>编辑</span>
                            </button>
                            <button onClick={() => deletePersonality(p.id)}
                              className="p-1.5 rounded-lg transition-colors hover:bg-red-500/10"
                              style={{ color: 'var(--accent-rose)' }}>
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add/Edit form */}
                  <AnimatePresence>
                    {(isAdding || editingPersonality) && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-4 p-4 rounded-xl" style={{ background: 'var(--bg-hover)', border: '1px solid var(--border-medium)' }}>
                          <h4 className="text-sm font-medium mb-3" style={{ color: 'var(--text-primary)' }}>
                            {isAdding ? '添加人格' : '编辑人格'}
                          </h4>
                          <label className="block text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>人格名称</label>
                          <input
                            type="text" value={editName} onChange={e => setEditName(e.target.value)}
                            placeholder="例如：温柔的朋友、严厉的导师..."
                            className="w-full px-3 py-2 rounded-lg text-sm mb-3"
                            style={{ background: 'var(--input-bg)', color: 'var(--text-primary)', border: '1px solid var(--border-medium)' }}
                          />
                          <label className="block text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>提示词 (System Prompt)</label>
                          <textarea
                            value={editPrompt} onChange={e => setEditPrompt(e.target.value)}
                            placeholder="描述这个人格的特点、语气、回复风格..."
                            rows={3}
                            className="w-full px-3 py-2 rounded-lg text-sm resize-none"
                            style={{ background: 'var(--input-bg)', color: 'var(--text-primary)', border: '1px solid var(--border-medium)' }}
                          />
                          <div className="flex gap-2 mt-3">
                            <motion.button
                              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                              onClick={savePersonality}
                              className="px-4 py-2 rounded-lg text-sm font-medium text-white"
                              style={{ background: 'var(--accent-gold)' }}
                            >
                              保存
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                              onClick={cancelEdit}
                              className="px-4 py-2 rounded-lg text-sm"
                              style={{ color: 'var(--text-muted)', background: 'var(--bg-card)' }}
                            >
                              取消
                            </motion.button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* Delete confirmation overlay */}
            <AnimatePresence>
              {deleteConfirmId && deleteTarget && (
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="absolute inset-0 z-10 flex items-center justify-center"
                  style={{ background: 'var(--overlay-bg)', backdropFilter: 'blur(2px)' }}
                  onClick={cancelDelete}
                >
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                    onClick={e => e.stopPropagation()}
                    className="w-[320px] p-6 rounded-2xl"
                    style={{
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-medium)',
                      boxShadow: '0 20px 50px rgba(0,0,0,0.4)',
                    }}
                  >
                    <div className="text-center mb-6">
                      <div
                        className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-3"
                        style={{ background: 'rgba(196, 112, 138, 0.12)' }}
                      >
                        <Trash2 size={22} style={{ color: 'var(--accent-rose)' }} />
                      </div>
                      <h4 className="text-base font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                        确定删除？
                      </h4>
                      <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                        人格 <span style={{ color: 'var(--accent-rose)', fontWeight: 600 }}>「{deleteTarget.name}」</span> 将被永久删除，此操作不可撤销。
                      </p>
                    </div>

                    <div className="flex gap-3">
                      <motion.button
                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                        onClick={cancelDelete}
                        className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors"
                        style={{ background: 'var(--bg-card)', color: 'var(--text-secondary)' }}
                      >
                        取消
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                        onClick={confirmDelete}
                        className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white transition-colors"
                        style={{ background: 'var(--accent-rose)' }}
                      >
                        确定
                      </motion.button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Footer */}
            <div className="p-3 border-t text-center" style={{ borderColor: 'var(--border-subtle)' }}>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                API Key 安全存储在你的电脑本地
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
