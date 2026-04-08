export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(204).end();
  res.status(200).json({ status: 'ok', name: 'AI Tiger', version: 'V0.1.0' });
}
