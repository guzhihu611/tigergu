const fs = require('fs');
const path = require('path');

function replaceInDir(dir, replacements, extensions) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir)) {
    const fullPath = path.join(dir, entry);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      replaceInDir(fullPath, replacements, extensions);
    } else if (extensions.some(ext => entry.endsWith(ext))) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let modified = false;
      for (const [from, to] of replacements) {
        if (content.includes(from)) {
          content = content.replaceAll(from, to);
          modified = true;
        }
      }
      if (modified) fs.writeFileSync(fullPath, content);
    }
  }
}

function rmDir(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir)) {
    const fullPath = path.join(dir, entry);
    fs.statSync(fullPath).isDirectory() ? rmDir(fullPath) : fs.unlinkSync(fullPath);
  }
  fs.rmdirSync(dir);
}

console.log('Building for Vercel...');

if (fs.existsSync('api')) {
  fs.renameSync('api', 'apic');
}

replaceInDir('.', [
  ["from '../api/", "from '../apic/"],
  ['from "../api/', 'from "../apic/'],
  ["from './api/", "from './apic/"],
  ['from "./api/', 'from "./apic/'],
], ['.js', '.html', '.mjs']);

fs.mkdirSync('api/v2/proxy', { recursive: true });

fs.writeFileSync('api/index.js', `export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(204).end();
  res.status(200).json({ status: 'ok', name: 'AI Tiger', version: 'V0.1.0' });
}
`);

fs.writeFileSync('api/v2/proxy/completions.js', `const P = {
  apimart: { e: 'APIMART_API_KEY', u: 'https://api.apimart.ai/v1/chat/completions' },
  grsai: { e: 'GRSAI_API_KEY', u: 'https://api.grsai.com/v1/chat/completions' },
  ppio: { e: 'PPIO_API_KEY', u: 'https://api.ppio.com/v1/chat/completions' },
  geeknow: { e: 'GEEKNOW_API_KEY', u: 'https://www.geeknow.top/v1/chat/completions' }
};
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { provider, apiKey, apiUrl, model, messages } = req.body;
    let key = apiKey || '', url = apiUrl || '';
    if (!key && P[provider]) { key = process.env[P[provider].e] || ''; if (!url) url = P[provider].u; }
    if (provider === 'openai') { key = key || process.env.CUSTOM_AI_KEY || ''; url = url || process.env.CUSTOM_AI_URL || 'https://api.openai.com/v1/chat/completions'; }
    if (!key) return res.status(401).json({ error: 'API key not configured' });
    if (!url) return res.status(400).json({ error: 'API URL not configured' });
    const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + key }, body: JSON.stringify({ model, messages, stream: false }) });
    res.status(r.status).setHeader('Content-Type', 'application/json').send(await r.text());
  } catch (e) { res.status(500).json({ error: e.message }); }
}
`);

fs.writeFileSync('api/v2/proxy/image.js', `const E = { ppio: 'PPIO_API_KEY', apimart: 'APIMART_API_KEY', grsai: 'GRSAI_API_KEY', geeknow: 'GEEKNOW_API_KEY' };
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { apiUrl, apiKey, provider, body } = req.body;
    let key = apiKey || (provider && E[provider] ? process.env[E[provider]] : '') || '';
    if (!key || !apiUrl) return res.status(401).json({ error: 'API key or URL not configured' });
    const r = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + key }, body: JSON.stringify(body || {}) });
    res.status(r.status).setHeader('Content-Type', 'application/json').send(await r.text());
  } catch (e) { res.status(500).json({ error: e.message }); }
}
`);

fs.writeFileSync('api/v2/proxy/video.js', `const E = { ppio: 'PPIO_API_KEY', geeknow: 'GEEKNOW_API_KEY' };
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { apiUrl, apiKey, provider, body } = req.body;
    let key = apiKey || (provider && E[provider] ? process.env[E[provider]] : '') || '';
    if (!key || !apiUrl) return res.status(401).json({ error: 'API key or URL not configured' });
    const r = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + key }, body: JSON.stringify(body || {}) });
    res.status(r.status).setHeader('Content-Type', 'application/json').send(await r.text());
  } catch (e) { res.status(500).json({ error: e.message }); }
}
`);

rmDir('vercel-api');

console.log('Vercel build complete!');
