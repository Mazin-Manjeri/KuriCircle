import { loadDatabaseState } from '../../src/db/neon.ts';
import { verifyAuditChain } from '../../src/lib/crypto.ts';

export default async function handler(_req: any, res: any) {
  try {
    const { state } = await loadDatabaseState();
    const report = await verifyAuditChain(state.auditEvents);
    res.status(200).json(report);
  } catch (err) {
    console.error('GET /api/audit/verify failed:', err);
    res.status(500).json({ error: 'Audit verification failed' });
  }
}
