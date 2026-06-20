const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const https = require('https');

const isDev = process.env.NODE_ENV === 'development';

let mainWindow = null;

function createWindow() {
  const iconPath = path.join(__dirname, '..', 'public', 'tubiao.png');
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 650,
    frame: true,
    titleBarStyle: 'default',
    backgroundColor: '#0a0a1a',
    icon: iconPath,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// ---- File I/O Handlers ----

const userDataPath = app.getPath('userData');
const journalsPath = path.join(userDataPath, 'journals');
const appDir = isDev ? path.join(__dirname, '..') : path.join(process.resourcesPath, 'app');
const presetsDir = path.join(appDir, 'presets');

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function loadPresetPersonalities() {
  const personalities = [];
  if (!fs.existsSync(presetsDir)) return personalities;
  const files = fs.readdirSync(presetsDir).filter(f => f.endsWith('.txt')).sort();
  for (const f of files) {
    const name = path.basename(f, '.txt');
    const prompt = fs.readFileSync(path.join(presetsDir, f), 'utf-8').trim();
    if (prompt) {
      personalities.push({
        id: 'preset_' + name,
        name: name,
        prompt: prompt,
        enabled: false,
      });
    }
  }
  return personalities;
}

function seedPresetsIfNeeded(config) {
  const presets = loadPresetPersonalities();
  if (presets.length === 0) return config;
  const existing = config.personalities || [];
  const existingNames = new Set(existing.map(p => p.name));
  const newPresets = presets.filter(p => !existingNames.has(p.name));
  if (newPresets.length > 0) {
    config.personalities = [...existing, ...newPresets];
    // Persist immediately
    const configPath = getConfigPath();
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
  }
  return config;
}

function getEntryPath(year, month, day) {
  const dir = path.join(journalsPath, String(year), String(month).padStart(2, '0'));
  ensureDir(dir);
  return path.join(dir, `${String(day).padStart(2, '0')}.json`);
}

function getConfigPath() {
  const configDir = path.join(userDataPath, 'config');
  ensureDir(configDir);
  return path.join(configDir, 'settings.json');
}

// Read journal entry
ipcMain.handle('journal:read', (event, { year, month, day }) => {
  try {
    const filePath = getEntryPath(year, month, day);
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(data);
    }
    return null;
  } catch (err) {
    console.error('Error reading journal:', err);
    return null;
  }
});

// Write journal entry
ipcMain.handle('journal:write', (event, entry) => {
  try {
    const date = new Date(entry.date);
    const filePath = getEntryPath(date.getFullYear(), date.getMonth() + 1, date.getDate());
    fs.writeFileSync(filePath, JSON.stringify(entry, null, 2), 'utf-8');
    return { success: true };
  } catch (err) {
    console.error('Error writing journal:', err);
    return { success: false, error: err.message };
  }
});

// List all entries for a month
ipcMain.handle('journal:list-month', (event, { year, month }) => {
  try {
    const dir = path.join(journalsPath, String(year), String(month).padStart(2, '0'));
    ensureDir(dir);
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));
    const entries = files.map(f => {
      const data = fs.readFileSync(path.join(dir, f), 'utf-8');
      return JSON.parse(data);
    });
    return entries;
  } catch (err) {
    console.error('Error listing month:', err);
    return [];
  }
});

// ---- Config Handlers ----

ipcMain.handle('config:read', () => {
  try {
    const configPath = getConfigPath();
    let data;
    if (fs.existsSync(configPath)) {
      data = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    } else {
      data = { deepseekApiKey: '', personalities: [], sharedPrompt: '', theme: 'light' };
    }
    data.deepseekApiKey = data.deepseekApiKey || '';
    data.personalities = data.personalities || [];
    data.sharedPrompt = data.sharedPrompt || '';
    data.theme = data.theme || 'light';
    // Seed presets on first run
    data = seedPresetsIfNeeded(data);
    return data;
  } catch (err) {
    return { deepseekApiKey: '', personalities: [], theme: 'light', sharedPrompt: '' };
  }
});

ipcMain.handle('config:write', (event, newConfig) => {
  try {
    const configPath = getConfigPath();
    let existing = {};
    if (fs.existsSync(configPath)) {
      existing = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    }
    const merged = { ...existing, ...newConfig };
    fs.writeFileSync(configPath, JSON.stringify(merged, null, 2), 'utf-8');
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});


// ---- Deepseek API Call ----

ipcMain.handle('deepseek:chat', (event, { apiKey, prompt, content, history }) => {
  return new Promise((resolve, reject) => {
    const systemPrompt = prompt || '你是一位温暖、富有洞察力的朋友，善于倾听和回应。请用中文回复。';
    let userMessage = `请根据你的人设，以你的风格回复这篇日记：\n\n${content}`;
    if (history) {
      userMessage = `以下是这位用户过去的日记记录，请了解他的经历和心情变化：\n\n${history}\n\n---\n\n以上是历史日记。现在，请根据你的人设，以你的风格回复他今天写的这篇日记：\n\n${content}`;
    }
    const data = JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      temperature: 0.8,
      max_tokens: 800,
    });

    const options = {
      hostname: 'api.deepseek.com',
      path: '/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'Content-Length': Buffer.byteLength(data),
      },
      timeout: 30000,
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        try {
          const result = JSON.parse(body);
          if (result.choices && result.choices[0]) {
            resolve({ success: true, reply: result.choices[0].message.content });
          } else if (result.error) {
            resolve({ success: false, error: result.error.message });
          } else {
            resolve({ success: false, error: '未知响应格式' });
          }
        } catch (e) {
          resolve({ success: false, error: '解析响应失败' });
        }
      });
    });

    req.on('error', (err) => {
      resolve({ success: false, error: err.message });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({ success: false, error: '请求超时' });
    });

    req.write(data);
    req.end();
  });
});

// ---- App Lifecycle ----

app.whenReady().then(() => {
  ensureDir(journalsPath);
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
