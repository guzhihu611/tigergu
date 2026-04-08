const P = {
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
