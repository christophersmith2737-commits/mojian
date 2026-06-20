"""
墨笺 - Diary App Backend Server
Serves the React frontend and provides API endpoints for journal management and AI reviews.
"""
import json
import os
import sys
import urllib.request
import urllib.error
from http.server import HTTPServer, SimpleHTTPRequestHandler
from pathlib import Path

# ---- Configuration ----
PORT = 5174
APP_DIR = Path(os.path.dirname(os.path.abspath(__file__)))
USER_DATA = Path(os.environ.get('APPDATA', Path.home() / '.config')) / 'mojian'
JOURNALS_DIR = USER_DATA / 'journals'
CONFIG_DIR = USER_DATA / 'config'
SETTINGS_FILE = CONFIG_DIR / 'settings.json'
PRESETS_DIR = APP_DIR / 'presets'

# Ensure directories exist
JOURNALS_DIR.mkdir(parents=True, exist_ok=True)
CONFIG_DIR.mkdir(parents=True, exist_ok=True)


def load_preset_personalities():
    """Load preset personalities from presets/ folder. Returns list of Personality dicts."""
    personalities = []
    if not PRESETS_DIR.exists():
        return personalities
    for f in sorted(PRESETS_DIR.glob('*.txt')):
        name = f.stem  # filename without extension = personality name
        prompt = f.read_text('utf-8').strip()
        if prompt:
            pid = 'preset_' + name  # stable id based on name
            personalities.append({
                'id': pid,
                'name': name,
                'prompt': prompt,
                'enabled': False,  # disabled by default, user can enable
            })
    return personalities


def seed_presets_if_needed(existing_config):
    """Merge presets into config — add any preset not already present (matched by name)."""
    presets = load_preset_personalities()
    if not presets:
        return existing_config
    existing_personalities = existing_config.get('personalities', [])
    existing_names = {p['name'] for p in existing_personalities}
    new_presets = [p for p in presets if p['name'] not in existing_names]
    if new_presets:
        existing_config['personalities'] = existing_personalities + new_presets
        # Persist immediately so presets are saved
        CONFIG_DIR.mkdir(parents=True, exist_ok=True)
        SETTINGS_FILE.write_text(json.dumps(existing_config, ensure_ascii=False, indent=2), 'utf-8')
    return existing_config

def get_entry_path(year, month, day):
    """Get the file path for a journal entry."""
    dir_path = JOURNALS_DIR / str(year) / f"{month:02d}"
    dir_path.mkdir(parents=True, exist_ok=True)
    return dir_path / f"{day:02d}.json"

def json_response(handler, data, status=200):
    """Send a JSON response."""
    handler.send_response(status)
    handler.send_header('Content-Type', 'application/json; charset=utf-8')
    handler.send_header('Access-Control-Allow-Origin', '*')
    handler.end_headers()
    handler.wfile.write(json.dumps(data, ensure_ascii=False).encode('utf-8'))


class APIHandler(SimpleHTTPRequestHandler):
    """HTTP request handler with API endpoints."""

    def __init__(self, *args, **kwargs):
        dist_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'dist')
        super().__init__(*args, directory=dist_dir, **kwargs)

    def do_OPTIONS(self):
        """Handle CORS preflight."""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_GET(self):
        """Handle GET requests - API or static files."""
        if self.path.startswith('/api/'):
            self.handle_api('GET')
        else:
            # Serve static files from dist/ directory
            path = self.path.split('?')[0]
            fs_path = self.translate_path(path)

            if path == '/' or not os.path.exists(fs_path):
                # SPA fallback: serve index.html
                self.send_response(200)
                self.send_header('Content-Type', 'text/html; charset=utf-8')
                self.end_headers()
                index_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'dist', 'index.html')
                if os.path.exists(index_path):
                    with open(index_path, 'rb') as f:
                        self.wfile.write(f.read())
                return

            super().do_GET()

    def do_POST(self):
        """Handle POST requests."""
        if self.path.startswith('/api/'):
            self.handle_api('POST')
        else:
            self.send_response(404)
            self.end_headers()

    def handle_api(self, method):
        """Route API requests."""
        content_length = int(self.headers.get('Content-Length', 0))
        body = {}
        if content_length > 0:
            body = json.loads(self.rfile.read(content_length))

        # Strip query string from path for routing
        import urllib.parse
        path = urllib.parse.urlparse(self.path).path

        # ---- Journal endpoints ----
        if path == '/api/journal/read':
            year = int(self.query('year'))
            month = int(self.query('month'))
            day = int(self.query('day'))
            file_path = get_entry_path(year, month, day)
            if file_path.exists():
                data = json.loads(file_path.read_text('utf-8'))
                json_response(self, data)
            else:
                json_response(self, None)

        elif path == '/api/journal/write':
            entry = body
            date_parts = entry['date'].split('-')
            year, month, day = int(date_parts[0]), int(date_parts[1]), int(date_parts[2])
            file_path = get_entry_path(year, month, day)
            file_path.write_text(json.dumps(entry, ensure_ascii=False, indent=2), 'utf-8')
            json_response(self, {'success': True})

        elif path == '/api/journal/list':
            year = int(self.query('year'))
            month = int(self.query('month'))
            dir_path = JOURNALS_DIR / str(year) / f"{month:02d}"
            entries = []
            if dir_path.exists():
                for f in sorted(dir_path.glob('*.json')):
                    entries.append(json.loads(f.read_text('utf-8')))
            json_response(self, entries)

        # ---- Config endpoints ----
        elif path == '/api/config/read':
            if SETTINGS_FILE.exists():
                data = json.loads(SETTINGS_FILE.read_text('utf-8'))
                # Ensure defaults exist
                data.setdefault('deepseekApiKey', '')
                data.setdefault('personalities', [])
                data.setdefault('sharedPrompt', '')
                data.setdefault('theme', 'light')
                # Seed presets on first run
                data = seed_presets_if_needed(data)
                json_response(self, data)
            else:
                # First run ever — create config with presets
                default_config = {
                    'deepseekApiKey': '',
                    'personalities': [],
                    'sharedPrompt': '',
                    'theme': 'light',
                }
                default_config = seed_presets_if_needed(default_config)
                json_response(self, default_config)

        elif path == '/api/config/write':
            # Merge with existing config
            existing = {}
            if SETTINGS_FILE.exists():
                existing = json.loads(SETTINGS_FILE.read_text('utf-8'))
            existing.update(body)
            SETTINGS_FILE.write_text(json.dumps(existing, ensure_ascii=False, indent=2), 'utf-8')
            json_response(self, {'success': True})

        # ---- Deepseek AI ----
        elif path == '/api/deepseek/chat':
            self.handle_deepseek(body)

        else:
            json_response(self, {'error': 'Not found'}, 404)

    def handle_deepseek(self, body):
        """Proxy request to Deepseek API with personality prompt and optional diary history."""
        api_key = body.get('apiKey', '')
        content = body.get('content', '')
        personality_prompt = body.get('personalityPrompt', '')
        history = body.get('history', '')

        if not api_key:
            json_response(self, {'success': False, 'error': 'API Key 未配置'})
            return

        system_prompt = personality_prompt or '你是一位温暖、富有洞察力的朋友，善于倾听和回应。请用中文回复。'

        if history:
            user_message = f'以下是这位用户过去的日记记录，请了解他的经历和心情变化：\n\n{history}\n\n---\n\n以上是历史日记。现在，请根据你的人设，以你的风格回复他今天写的这篇日记：\n\n{content}'
        else:
            user_message = f'请根据你的人设，以你的风格回复这篇日记：\n\n{content}'

        payload = json.dumps({
            'model': 'deepseek-chat',
            'messages': [
                {'role': 'system', 'content': system_prompt},
                {'role': 'user', 'content': user_message}
            ],
            'temperature': 0.8,
            'max_tokens': 800,
        }).encode('utf-8')

        req = urllib.request.Request(
            'https://api.deepseek.com/v1/chat/completions',
            data=payload,
            headers={
                'Content-Type': 'application/json',
                'Authorization': f'Bearer {api_key}',
            }
        )

        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                result = json.loads(resp.read().decode('utf-8'))
                if 'choices' in result and result['choices']:
                    reply = result['choices'][0]['message']['content']
                    json_response(self, {'success': True, 'reply': reply})
                elif 'error' in result:
                    json_response(self, {'success': False, 'error': result['error'].get('message', 'API 错误')})
                else:
                    json_response(self, {'success': False, 'error': '未知响应格式'})
        except urllib.error.HTTPError as e:
            json_response(self, {'success': False, 'error': f'API 请求失败 ({e.code})'})
        except Exception as e:
            json_response(self, {'success': False, 'error': str(e)})

    def query(self, key):
        """Extract query parameter from path."""
        import urllib.parse
        parsed = urllib.parse.urlparse(self.path)
        params = urllib.parse.parse_qs(parsed.query)
        return params.get(key, [None])[0]

    def log_message(self, format, *args):
        """Custom log format."""
        if '/api/' in str(args[0]):
            print(f"[API] {args[0]}")
        else:
            super().log_message(format, *args)


if __name__ == '__main__':
    print(f"""
  ========================================
     MoJian Diary v1.0
     墨笺 - 日记本
  ========================================
  Data dir:   {JOURNALS_DIR}
  API server: http://localhost:{PORT}
  ========================================
    """.encode('utf-8').decode('utf-8', errors='replace'))

    handler = APIHandler
    server = HTTPServer(('127.0.0.1', PORT), handler)
    print(f"  Server started at http://localhost:{PORT}\n")

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n  Bye!")
        server.shutdown()
