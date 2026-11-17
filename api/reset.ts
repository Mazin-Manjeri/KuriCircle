import { resetDatabaseState } from '../src/db/neon.ts';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  try {
    const result = await resetDatabaseState();
    res.status(200).json(result);
  } catch (err) {
    console.error('POST /api/reset failed:', err);
    res.status(500).json({ error: 'Failed to reset database state' });
  }
}
