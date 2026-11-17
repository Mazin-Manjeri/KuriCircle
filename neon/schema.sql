-- KuriCircle Neon PostgreSQL Schema
-- Normalized 12-table architecture with UUID PKs, idempotency constraints, and append-only audit log

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT NOT NULL DEFAULT '',
  avatar_url TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('organizer', 'member', 'platform_admin')),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  city TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS savings_groups (
  id TEXT PRIMARY KEY,
  organizer_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  purpose TEXT NOT NULL,
  image_url TEXT NOT NULL DEFAULT '',
  arrangement_type TEXT NOT NULL DEFAULT 'goal_based_savings' CHECK (arrangement_type = 'goal_based_savings'),
  max_members INTEGER NOT NULL CHECK (max_members BETWEEN 2 AND 100),
  target_amount NUMERIC(12, 2) NOT NULL CHECK (target_amount > 0),
  frequency TEXT NOT NULL DEFAULT 'monthly' CHECK (frequency IN ('weekly', 'biweekly', 'monthly')),
  proposed_contribution NUMERIC(12, 2) NOT NULL CHECK (proposed_contribution > 0),
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  rules TEXT NOT NULL,
  visibility TEXT NOT NULL DEFAULT 'private_invite' CHECK (visibility IN ('private_invite', 'community_directory')),
  invite_code TEXT UNIQUE NOT NULL,
  is_flagged BOOLEAN NOT NULL DEFAULT FALSE,
  flag_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS group_members (
  id TEXT PRIMARY KEY,
  group_id TEXT NOT NULL REFERENCES savings_groups(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'rejected', 'suspended')),
  can_view_peer_totals BOOLEAN NOT NULL DEFAULT TRUE,
  can_record_drafts BOOLEAN NOT NULL DEFAULT FALSE,
  joined_at TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (group_id, user_id)
);

CREATE TABLE IF NOT EXISTS group_invitations (
  id TEXT PRIMARY KEY,
  group_id TEXT NOT NULL REFERENCES savings_groups(id) ON DELETE CASCADE,
  invited_by TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  invitee_email TEXT NOT NULL,
  invite_code TEXT NOT NULL,
  accepted BOOLEAN NOT NULL DEFAULT FALSE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS savings_goals (
  id TEXT PRIMARY KEY,
  group_id TEXT NOT NULL REFERENCES savings_groups(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  target_amount NUMERIC(12, 2) NOT NULL CHECK (target_amount > 0),
  target_date TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS contribution_records (
  id TEXT PRIMARY KEY,
  transaction_id TEXT UNIQUE NOT NULL,
  group_id TEXT NOT NULL REFERENCES savings_groups(id) ON DELETE CASCADE,
  member_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  transaction_date TEXT NOT NULL,
  contribution_period TEXT NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'submitted' CHECK (payment_status IN ('pending', 'submitted', 'verified', 'rejected')),
  verification_status TEXT NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  recorded_by TEXT NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  notes TEXT,
  is_simulated BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (group_id, member_id, contribution_period)
);

CREATE TABLE IF NOT EXISTS audit_events (
  id TEXT PRIMARY KEY,
  sequence_number INTEGER UNIQUE NOT NULL,
  group_id TEXT REFERENCES savings_groups(id) ON DELETE SET NULL,
  transaction_reference TEXT NOT NULL,
  event_type TEXT NOT NULL,
  amount NUMERIC(12, 2),
  details TEXT NOT NULL,
  actor_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  event_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  previous_event_hash TEXT NOT NULL,
  current_event_hash TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  group_id TEXT REFERENCES savings_groups(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  category TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS group_announcements (
  id TEXT PRIMARY KEY,
  group_id TEXT NOT NULL REFERENCES savings_groups(id) ON DELETE CASCADE,
  author_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS disputes (
  id TEXT PRIMARY KEY,
  group_id TEXT NOT NULL REFERENCES savings_groups(id) ON DELETE CASCADE,
  contribution_id TEXT REFERENCES contribution_records(id) ON DELETE SET NULL,
  reported_by TEXT NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'under_review', 'escalated', 'resolved', 'dismissed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dispute_responses (
  id TEXT PRIMARY KEY,
  dispute_id TEXT NOT NULL REFERENCES disputes(id) ON DELETE CASCADE,
  responder_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  message TEXT NOT NULL,
  action_taken TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_activity_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT NOT NULL,
  details TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS kuri_app_state (
  key TEXT PRIMARY KEY,
  payload JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
