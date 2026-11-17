import 'dotenv/config';
import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { createServer as createViteServer } from 'vite';
import { verifyAuditChain } from './src/lib/crypto.ts';
import {
  isNeonConfigured,
  loadDatabaseState,
  resetDatabaseState,
  saveDatabaseState,
} from './src/db/neon.ts';
import type { KuriDatabaseState } from './src/types/kuri.ts';

const PORT = Number(process.env.PORT || 3000);
const isProduction = process.env.NODE_ENV === 'production';

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '5mb' }));

  app.get('/api/health', async (_req, res) => {
    res.json({
      ok: true,
      neonConfigured: isNeonConfigured(),
    });
  });

  app.get('/api/state', async (_req, res) => {
    try {
      const { state, backend } = await loadDatabaseState();
      res.json({ state, backend });
    } catch (err) {
      console.error('GET /api/state failed:', err);
      res.status(500).json({ error: 'Failed to load workspace state' });
    }
  });

  app.put('/api/state', async (req, res) => {
    try {
      const payload = req.body?.state as KuriDatabaseState | undefined;
      if (!payload || !Array.isArray(payload.profiles)) {
        res.status(400).json({ error: 'Invalid workspace payload' });
        return;
      }
      const result = await saveDatabaseState(payload);
      res.json(result);
    } catch (err) {
      console.error('PUT /api/state failed:', err);
      res.status(500).json({ error: 'Failed to save workspace state' });
    }
  });

  app.post('/api/reset', async (_req, res) => {
    try {
      const result = await resetDatabaseState();
      res.json(result);
    } catch (err) {
      console.error('POST /api/reset failed:', err);
      res.status(500).json({ error: 'Failed to reset database state' });
    }
  });

  app.get('/api/audit/verify', async (_req, res) => {
    try {
      const { state } = await loadDatabaseState();
      const report = await verifyAuditChain(state.auditEvents);
      res.json(report);
    } catch (err) {
      console.error('GET /api/audit/verify failed:', err);
      res.status(500).json({ error: 'Audit verification failed' });
    }
  });

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      const indexFile = path.join(distDir, 'index.html');
      if (fs.existsSync(indexFile)) {
        res.sendFile(indexFile);
      } else {
        res.status(404).send('Build output not found');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`KuriCircle server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
