const E = { ppio: 'PPIO_API_KEY', apimart: 'APIMART_API_KEY', grsai: 'GRSAI_API_KEY', geeknow: 'GEEKNOW_API_KEY' };
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
