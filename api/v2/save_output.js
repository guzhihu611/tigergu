const ok = { success: true, url: '' };
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type,Authorization' };

export default function handler(req, res) {
  Object.entries(cors).forEach(([k, v]) => res.setHeader(k, v));
  if (req.method === 'OPTIONS') return res.status(204).end();
  res.status(200).json(ok);
}
