// api/ping.ts — simple health check
export default async function handler(_req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (_req.method === 'OPTIONS') return res.status(200).end();
  if (_req.method !== 'GET') return res.status(405).json({ error: 'GET only' });

  return res.status(200).json({ ok: true, time: new Date().toISOString() });
}
