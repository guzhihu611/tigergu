const ENV_MAP = {
  ppio: 'PPIO_API_KEY',
  apimart: 'APIMART_API_KEY',
  grsai: 'GRSAI_API_KEY',
  geeknow: 'GEEKNOW_API_KEY'
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { apiUrl, apiKey, provider, body } = req.body;

    let finalKey = apiKey || '';
    if (!finalKey && provider && ENV_MAP[provider]) {
      finalKey = process.env[ENV_MAP[provider]] || '';
    }

    if (!finalKey || !apiUrl) {
      return res.status(401).json({ error: 'API key or URL not configured' });
    }

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${finalKey}`
      },
      body: JSON.stringify(body || {})
    });

    const data = await response.text();
    res.status(response.status).setHeader('Content-Type', 'application/json').send(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
