const ok = { success: true };
const empty = { success: true, data: {} };
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type,Authorization' };

export default function handler(req, res) {
  Object.entries(cors).forEach(([k, v]) => res.setHeader(k, v));
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method === 'GET') return res.status(200).json(empty);
  if (req.method === 'POST') return res.status(200).json(ok);
  if (req.method === 'PATCH') return res.status(200).json(ok);
  if (req.method === 'DELETE') return res.status(200).json(ok);
  res.status(405).json({ error: 'Method not allowed' });
}
