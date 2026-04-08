export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.write('data: ping\n\n');
  const iv = setInterval(() => res.write('data: ping\n\n'), 3000);
  req.on('close', () => clearInterval(iv));
  setTimeout(() => { clearInterval(iv); res.end(); }, 25000);
}
