const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Journal operations
  readJournal: (year, month, day) =>
    ipcRenderer.invoke('journal:read', { year, month, day }),

  writeJournal: (entry) =>
    ipcRenderer.invoke('journal:write', entry),

  listMonth: (year, month) =>
    ipcRenderer.invoke('journal:list-month', { year, month }),

  // Config operations
  readConfig: () =>
    ipcRenderer.invoke('config:read'),

  writeConfig: (config) =>
    ipcRenderer.invoke('config:write', config),

  // Deepseek AI
  requestAIReview: (apiKey, prompt, content, history) =>
    ipcRenderer.invoke('deepseek:chat', { apiKey, prompt, content, history }),
});
