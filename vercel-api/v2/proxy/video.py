from http.server import BaseHTTPRequestHandler
import json
import urllib.request
import urllib.error
import os
import ssl

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

            api_url = data.get('apiUrl', '')
            api_key = data.get('apiKey', '')

            if not api_key:
                provider = data.get('provider', '')
                env_map = {
                    'ppio': 'PPIO_API_KEY',
                    'geeknow': 'GEEKNOW_API_KEY',
                }
                if provider in env_map:
                    api_key = os.environ.get(env_map[provider], '')

            if not api_key or not api_url:
                self._send_json(401, {"error": "API key or URL not configured"})
                return

            proxy_body = json.dumps(data.get('body', {})).encode()

            req = urllib.request.Request(api_url, data=proxy_body, method='POST')
            req.add_header('Content-Type', 'application/json')
            req.add_header('Authorization', f'Bearer {api_key}')

            ctx = ssl.create_default_context()
            with urllib.request.urlopen(req, timeout=120, context=ctx) as resp:
                result = resp.read()
                self.send_response(200)
                for k, v in get_cors_headers().items():
                    self.send_header(k, v)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(result)

        except urllib.error.HTTPError as e:
            err_body = e.read().decode('utf-8', errors='replace')
            self._send_json(e.code, {"error": err_body})
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
