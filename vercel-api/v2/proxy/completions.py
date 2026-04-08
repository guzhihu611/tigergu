from http.server import BaseHTTPRequestHandler
import json
import urllib.request
import urllib.error
import os
import ssl

PROVIDER_MAP = {
    'apimart': {
        'key_env': 'APIMART_API_KEY',
        'url': 'https://api.apimart.ai/v1/chat/completions'
    },
    'grsai': {
        'key_env': 'GRSAI_API_KEY',
        'url': 'https://api.grsai.com/v1/chat/completions'
    },
    'ppio': {
        'key_env': 'PPIO_API_KEY',
        'url': 'https://api.ppio.com/v1/chat/completions'
    },
    'geeknow': {
        'key_env': 'GEEKNOW_API_KEY',
        'url': 'https://www.geeknow.top/v1/chat/completions'
    },
}

def get_cors_headers():
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length)
            data = json.loads(body)

            provider = data.get('provider', '')
            api_key = data.get('apiKey', '')
            api_url = data.get('apiUrl', '')
            model = data.get('model', '')
            messages = data.get('messages', [])
            stream = data.get('stream', False)

            if not api_key and provider in PROVIDER_MAP:
                cfg = PROVIDER_MAP[provider]
                api_key = os.environ.get(cfg['key_env'], '')
                if not api_url:
                    api_url = cfg['url']

            if provider == 'openai':
                api_key = api_key or os.environ.get('CUSTOM_AI_KEY', '')
                api_url = api_url or os.environ.get('CUSTOM_AI_URL', 'https://api.openai.com/v1/chat/completions')

            if not api_key:
                self._send_json(401, {"error": "API key not configured"})
                return

            if not api_url:
                self._send_json(400, {"error": "API URL not configured"})
                return

            proxy_body = json.dumps({
                "model": model,
                "messages": messages,
                "stream": stream,
            }).encode()

            req = urllib.request.Request(api_url, data=proxy_body, method='POST')
            req.add_header('Content-Type', 'application/json')
            req.add_header('Authorization', f'Bearer {api_key}')

            ctx = ssl.create_default_context()
            with urllib.request.urlopen(req, timeout=60, context=ctx) as resp:
                result = resp.read()
                self.send_response(200)
                for k, v in get_cors_headers().items():
                    self.send_header(k, v)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(result)

        except urllib.error.HTTPError as e:
            body = e.read().decode('utf-8', errors='replace')
            self._send_json(e.code, {"error": body})
        except Exception as e:
            self._send_json(500, {"error": str(e)})

    def do_OPTIONS(self):
        self.send_response(204)
        for k, v in get_cors_headers().items():
            self.send_header(k, v)
        self.end_headers()

    def _send_json(self, code, obj):
        self.send_response(code)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(obj).encode())
