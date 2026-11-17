import { loadDatabaseState, saveDatabaseState } from '../src/db/neon.ts';
import type { KuriDatabaseState } from '../src/types/kuri.ts';

export default async function handler(req: any, res: any) {
  if (req.method === 'GET') {
    try {
      const result = await loadDatabaseState();
      res.status(200).json(result);
    } catch (err) {
      console.error('GET /api/state failed:', err);
      res.status(500).json({ error: 'Failed to load workspace state' });
    }
    return;
  }

  if (req.method === 'PUT') {
    try {
      const payload = req.body?.state as KuriDatabaseState | undefined;
      if (!payload || !Array.isArray(payload.profiles)) {
        res.status(400).json({ error: 'Invalid workspace payload' });
        return;
      }
      const result = await saveDatabaseState(payload);
      res.status(200).json(result);
    } catch (err) {
      console.error('PUT /api/state failed:', err);
      res.status(500).json({ error: 'Failed to save workspace state' });
    }
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
}
