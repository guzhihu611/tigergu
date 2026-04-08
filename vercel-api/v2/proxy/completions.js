const PROVIDER_MAP = {
  apimart: {
    keyEnv: 'APIMART_API_KEY',
    url: 'https://api.apimart.ai/v1/chat/completions'
  },
  grsai: {
    keyEnv: 'GRSAI_API_KEY',
    url: 'https://api.grsai.com/v1/chat/completions'
  },
  ppio: {
    keyEnv: 'PPIO_API_KEY',
    url: 'https://api.ppio.com/v1/chat/completions'
  },
  geeknow: {
    keyEnv: 'GEEKNOW_API_KEY',
    url: 'https://www.geeknow.top/v1/chat/completions'
  }
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
    const { provider, apiKey, apiUrl, model, messages, stream } = req.body;

    let finalKey = apiKey || '';
    let finalUrl = apiUrl || '';

    if (!finalKey && provider && PROVIDER_MAP[provider]) {
      finalKey = process.env[PROVIDER_MAP[provider].keyEnv] || '';
      if (!finalUrl) finalUrl = PROVIDER_MAP[provider].url;
    }

    if (provider === 'openai') {
      finalKey = finalKey || process.env.CUSTOM_AI_KEY || '';
      finalUrl = finalUrl || process.env.CUSTOM_AI_URL || 'https://api.openai.com/v1/chat/completions';
    }

    if (!finalKey) {
      return res.status(401).json({ error: 'API key not configured' });
    }

    if (!finalUrl) {
      return res.status(400).json({ error: 'API URL not configured' });
    }

    const response = await fetch(finalUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${finalKey}`
      },
      body: JSON.stringify({ model, messages, stream: false })
    });

    const data = await response.text();
    res.status(response.status).setHeader('Content-Type', 'application/json').send(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
