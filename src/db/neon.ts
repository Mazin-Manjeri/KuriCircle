import fs from 'node:fs';
import path from 'node:path';
import { neon } from '@neondatabase/serverless';
import { buildInitialSeedData } from '../lib/seedData.ts';
import type { KuriDatabaseState } from '../types/kuri.ts';

const LOCAL_STORE_FILE = path.resolve(process.cwd(), '.kuricircle-data.json');
const STATE_ROW_KEY = 'primary_workspace';

let neonSchemaInitialized = false;

export function isNeonConfigured(): boolean {
  const url = process.env.DATABASE_URL?.trim();
  return Boolean(url && url.startsWith('postgres'));
}

export function getSql() {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    throw new Error('DATABASE_URL is not configured.');
  }
  return neon(url);
}

export async function ensureNeonSchema() {
  if (neonSchemaInitialized) return;
  const sql = getSql();

  await sql`
    CREATE TABLE IF NOT EXISTS profiles (
      id TEXT PRIMARY KEY,
      full_name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT NOT NULL DEFAULT '',
      avatar_url TEXT NOT NULL DEFAULT '',
      role TEXT NOT NULL DEFAULT 'member',
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      city TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS savings_groups (
      id TEXT PRIMARY KEY,
      organizer_id TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      purpose TEXT NOT NULL,
      image_url TEXT NOT NULL DEFAULT '',
      arrangement_type TEXT NOT NULL DEFAULT 'goal_based_savings',
      max_members INTEGER NOT NULL,
      target_amount NUMERIC(12, 2) NOT NULL,
      frequency TEXT NOT NULL DEFAULT 'monthly',
      proposed_contribution NUMERIC(12, 2) NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      rules TEXT NOT NULL,
      visibility TEXT NOT NULL DEFAULT 'private_invite',
      invite_code TEXT UNIQUE NOT NULL,
      is_flagged BOOLEAN NOT NULL DEFAULT FALSE,
      flag_reason TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS group_members (
      id TEXT PRIMARY KEY,
      group_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      can_view_peer_totals BOOLEAN NOT NULL DEFAULT TRUE,
      can_record_drafts BOOLEAN NOT NULL DEFAULT FALSE,
      joined_at TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (group_id, user_id)
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS savings_goals (
      id TEXT PRIMARY KEY,
      group_id TEXT NOT NULL,
      title TEXT NOT NULL,
      target_amount NUMERIC(12, 2) NOT NULL,
      target_date TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS contribution_records (
      id TEXT PRIMARY KEY,
      transaction_id TEXT UNIQUE NOT NULL,
      group_id TEXT NOT NULL,
      member_id TEXT NOT NULL,
      amount NUMERIC(12, 2) NOT NULL,
      transaction_date TEXT NOT NULL,
      contribution_period TEXT NOT NULL,
      payment_status TEXT NOT NULL DEFAULT 'submitted',
      verification_status TEXT NOT NULL DEFAULT 'pending',
      recorded_by TEXT NOT NULL,
      notes TEXT,
      is_simulated BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS audit_events (
      id TEXT PRIMARY KEY,
      sequence_number INTEGER UNIQUE NOT NULL,
      group_id TEXT,
      transaction_reference TEXT NOT NULL,
      event_type TEXT NOT NULL,
      amount NUMERIC(12, 2),
      details TEXT NOT NULL,
      actor_id TEXT NOT NULL,
      event_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      previous_event_hash TEXT NOT NULL,
      current_event_hash TEXT NOT NULL
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      group_id TEXT,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      category TEXT NOT NULL,
      is_read BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS group_announcements (
      id TEXT PRIMARY KEY,
      group_id TEXT NOT NULL,
      author_id TEXT NOT NULL,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS disputes (
      id TEXT PRIMARY KEY,
      group_id TEXT NOT NULL,
      contribution_id TEXT,
      reported_by TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'open',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS dispute_responses (
      id TEXT PRIMARY KEY,
      dispute_id TEXT NOT NULL,
      responder_id TEXT NOT NULL,
      message TEXT NOT NULL,
      action_taken TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS user_activity_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      action TEXT NOT NULL,
      resource_type TEXT NOT NULL,
      resource_id TEXT NOT NULL,
      details TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS kuri_app_state (
      key TEXT PRIMARY KEY,
      payload JSONB NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;

  neonSchemaInitialized = true;
}

async function syncAllStateToNeonTransaction(state: KuriDatabaseState) {
  const sql = getSql();

  await sql.transaction((txn) => {
    const queries = [
      txn`
        INSERT INTO kuri_app_state (key, payload, updated_at)
        VALUES (${STATE_ROW_KEY}, ${JSON.stringify(state)}::jsonb, NOW())
        ON CONFLICT (key) DO UPDATE
        SET payload = EXCLUDED.payload, updated_at = NOW()
      `,
      txn`TRUNCATE TABLE dispute_responses, disputes, group_announcements, notifications, audit_events, contribution_records, savings_goals, group_members, savings_groups, user_activity_logs, profiles RESTART IDENTITY CASCADE`,
    ];

    for (const p of state.profiles) {
      queries.push(
        txn`
          INSERT INTO profiles (id, full_name, email, phone, avatar_url, role, is_active, city)
          VALUES (${p.id}, ${p.fullName}, ${p.email}, ${p.phone}, ${p.avatarUrl}, ${p.role}, ${p.isActive}, ${p.city})
        `
      );
    }

    for (const g of state.groups) {
      queries.push(
        txn`
          INSERT INTO savings_groups (
            id, organizer_id, name, description, purpose, image_url, arrangement_type,
            max_members, target_amount, frequency, proposed_contribution,
            start_date, end_date, rules, visibility, invite_code, is_flagged, flag_reason
          )
          VALUES (
            ${g.id}, ${g.organizerId}, ${g.name}, ${g.description}, ${g.purpose}, ${g.imageUrl},
            ${g.arrangementType}, ${g.maxMembers}, ${g.targetAmount}, ${g.frequency},
            ${g.proposedContribution}, ${g.startDate}, ${g.endDate}, ${g.rules},
            ${g.visibility}, ${g.inviteCode}, ${g.isFlagged}, ${g.flagReason ?? null}
          )
        `
      );
    }

    for (const gm of state.groupMembers) {
      queries.push(
        txn`
          INSERT INTO group_members (
            id, group_id, user_id, status, can_view_peer_totals, can_record_drafts, joined_at
          )
          VALUES (
            ${gm.id}, ${gm.groupId}, ${gm.userId}, ${gm.status},
            ${gm.canViewPeerTotals}, ${gm.canRecordDrafts}, ${gm.joinedAt}
          )
        `
      );
    }

    for (const goal of state.goals) {
      queries.push(
        txn`
          INSERT INTO savings_goals (id, group_id, title, target_amount, target_date)
          VALUES (${goal.id}, ${goal.groupId}, ${goal.title}, ${goal.targetAmount}, ${goal.targetDate})
        `
      );
    }

    for (const c of state.contributions) {
      queries.push(
        txn`
          INSERT INTO contribution_records (
            id, transaction_id, group_id, member_id, amount, transaction_date,
            contribution_period, payment_status, verification_status, recorded_by, notes, is_simulated
          )
          VALUES (
            ${c.id}, ${c.transactionId}, ${c.groupId}, ${c.memberId}, ${c.amount},
            ${c.transactionDate}, ${c.contributionPeriod}, ${c.paymentStatus},
            ${c.verificationStatus}, ${c.recordedBy}, ${c.notes ?? null}, ${c.isSimulated}
          )
        `
      );
    }

    for (const ev of state.auditEvents) {
      queries.push(
        txn`
          INSERT INTO audit_events (
            id, sequence_number, group_id, transaction_reference, event_type,
            amount, details, actor_id, event_timestamp, previous_event_hash, current_event_hash
          )
          VALUES (
            ${ev.id}, ${ev.sequenceNumber}, ${ev.groupId}, ${ev.transactionReference},
            ${ev.eventType}, ${ev.amount}, ${ev.details}, ${ev.actorId},
            ${ev.timestamp}, ${ev.previousEventHash}, ${ev.currentEventHash}
          )
        `
      );
    }

    for (const n of state.notifications) {
      queries.push(
        txn`
          INSERT INTO notifications (id, user_id, group_id, title, message, category, is_read)
          VALUES (${n.id}, ${n.userId}, ${n.groupId ?? null}, ${n.title}, ${n.message}, ${n.category}, ${n.isRead})
        `
      );
    }

    for (const a of state.announcements) {
      queries.push(
        txn`
          INSERT INTO group_announcements (id, group_id, author_id, title, body)
          VALUES (${a.id}, ${a.groupId}, ${a.authorId}, ${a.title}, ${a.body})
        `
      );
    }

    for (const d of state.disputes) {
      queries.push(
        txn`
          INSERT INTO disputes (id, group_id, contribution_id, reported_by, category, description, status)
          VALUES (${d.id}, ${d.groupId}, ${d.contributionId ?? null}, ${d.reportedBy}, ${d.category}, ${d.description}, ${d.status})
        `
      );
    }

    for (const r of state.disputeResponses) {
      queries.push(
        txn`
          INSERT INTO dispute_responses (id, dispute_id, responder_id, message, action_taken)
          VALUES (${r.id}, ${r.disputeId}, ${r.responderId}, ${r.message}, ${r.actionTaken ?? null})
        `
      );
    }

    for (const log of state.activityLogs) {
      queries.push(
        txn`
          INSERT INTO user_activity_logs (id, user_id, action, resource_type, resource_id, details)
          VALUES (${log.id}, ${log.userId}, ${log.action}, ${log.resourceType}, ${log.resourceId}, ${log.details})
        `
      );
    }

    return queries;
  });
}

export async function loadDatabaseState(): Promise<{
  state: KuriDatabaseState;
  backend: 'neon' | 'local_file';
}> {
  if (isNeonConfigured()) {
    try {
      await ensureNeonSchema();
      const sql = getSql();
      const rows = await sql`
        SELECT payload FROM kuri_app_state WHERE key = ${STATE_ROW_KEY} LIMIT 1
      `;
      if (rows.length > 0 && rows[0]?.payload) {
        return {
          state: rows[0].payload as KuriDatabaseState,
          backend: 'neon',
        };
      }
      const initial = await buildInitialSeedData();
      await saveDatabaseState(initial);
      return { state: initial, backend: 'neon' };
    } catch (err) {
      console.error('Neon load fallback:', err);
    }
  }

  if (fs.existsSync(LOCAL_STORE_FILE)) {
    try {
      const raw = fs.readFileSync(LOCAL_STORE_FILE, 'utf-8');
      return { state: JSON.parse(raw) as KuriDatabaseState, backend: 'local_file' };
    } catch {
      // recreate clean baseline
    }
  }

  const fresh = await buildInitialSeedData();
  fs.writeFileSync(LOCAL_STORE_FILE, JSON.stringify(fresh, null, 2));
  return { state: fresh, backend: 'local_file' };
}

export async function saveDatabaseState(
  state: KuriDatabaseState
): Promise<{ ok: boolean; backend: 'neon' | 'local_file' }> {
  if (isNeonConfigured()) {
    try {
      await ensureNeonSchema();
      await syncAllStateToNeonTransaction(state);
      return { ok: true, backend: 'neon' };
    } catch (err) {
      console.error('Neon save fallback:', err);
    }
  }

  fs.writeFileSync(LOCAL_STORE_FILE, JSON.stringify(state, null, 2));
  return { ok: true, backend: 'local_file' };
}

export async function resetDatabaseState(): Promise<{
  state: KuriDatabaseState;
  backend: 'neon' | 'local_file';
}> {
  const fresh = await buildInitialSeedData();
  const res = await saveDatabaseState(fresh);
  return { state: fresh, backend: res.backend };
}
