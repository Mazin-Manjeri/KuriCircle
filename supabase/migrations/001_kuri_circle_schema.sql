-- KuriCircle PostgreSQL / Supabase Migration Schema
-- Demonstration & Educational Community Savings Coordination Architecture
-- Enforces UUID PKs, strict foreign keys, append-only audit logs, and Row Level Security.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Custom ENUM types
CREATE TYPE user_role AS ENUM ('organizer', 'member', 'platform_admin');
CREATE TYPE group_visibility AS ENUM ('private_invite', 'community_directory');
CREATE TYPE contribution_frequency AS ENUM ('weekly', 'biweekly', 'monthly');
CREATE TYPE membership_status AS ENUM ('pending', 'active', 'rejected', 'suspended');
CREATE TYPE contribution_status AS ENUM ('pending', 'submitted', 'verified', 'rejected');
CREATE TYPE dispute_status AS ENUM ('open', 'under_review', 'escalated', 'resolved', 'dismissed');

-- 1. Profiles
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  role user_role NOT NULL DEFAULT 'member',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Savings Groups
CREATE TABLE savings_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  purpose TEXT NOT NULL,
  image_url TEXT,
  arrangement_type TEXT NOT NULL DEFAULT 'goal_based_savings'
    CHECK (arrangement_type = 'goal_based_savings'),
  max_members INTEGER NOT NULL CHECK (max_members BETWEEN 2 AND 100),
  target_amount NUMERIC(12, 2) NOT NULL CHECK (target_amount > 0),
  frequency contribution_frequency NOT NULL DEFAULT 'monthly',
  proposed_contribution NUMERIC(12, 2) NOT NULL CHECK (proposed_contribution > 0),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL CHECK (end_date > start_date),
  rules TEXT NOT NULL,
  visibility group_visibility NOT NULL DEFAULT 'private_invite',
  invite_code TEXT UNIQUE NOT NULL,
  is_flagged BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Group Members
CREATE TABLE group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES savings_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status membership_status NOT NULL DEFAULT 'pending',
  can_view_peer_totals BOOLEAN NOT NULL DEFAULT TRUE,
  can_record_drafts BOOLEAN NOT NULL DEFAULT FALSE,
  joined_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (group_id, user_id)
);

-- 4. Group Invitations
CREATE TABLE group_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES savings_groups(id) ON DELETE CASCADE,
  invited_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  invitee_email TEXT NOT NULL,
  invite_code TEXT NOT NULL,
  accepted BOOLEAN NOT NULL DEFAULT FALSE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Savings Goals
CREATE TABLE savings_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES savings_groups(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  target_amount NUMERIC(12, 2) NOT NULL CHECK (target_amount > 0),
  target_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Contribution Records (Simulated Demonstration Records)
CREATE TABLE contribution_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_ref TEXT UNIQUE NOT NULL,
  group_id UUID NOT NULL REFERENCES savings_groups(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  transaction_date DATE NOT NULL,
  contribution_period TEXT NOT NULL,
  payment_status contribution_status NOT NULL DEFAULT 'submitted',
  verification_status TEXT NOT NULL DEFAULT 'pending',
  recorded_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  notes TEXT,
  is_simulated BOOLEAN NOT NULL DEFAULT TRUE CHECK (is_simulated = TRUE),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Idempotency constraint preventing duplicate period contributions per member/group
  UNIQUE (group_id, member_id, contribution_period)
);

-- 7. Audit Events (Append-Only SHA-256 Hash-Linked Ledger)
CREATE TABLE audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_number BIGSERIAL UNIQUE NOT NULL,
  group_id UUID REFERENCES savings_groups(id) ON DELETE SET NULL,
  transaction_reference TEXT NOT NULL,
  event_type TEXT NOT NULL,
  amount NUMERIC(12, 2),
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  actor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  previous_event_hash TEXT NOT NULL,
  current_event_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enforce strict append-only immutability on audit_events
CREATE OR REPLACE FUNCTION prevent_audit_mutation()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'audit_events is append-only; updates and deletes are prohibited';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_audit_no_update
  BEFORE UPDATE OR DELETE ON audit_events
  FOR EACH ROW EXECUTE FUNCTION prevent_audit_mutation();

-- 8. Notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  group_id UUID REFERENCES savings_groups(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  category TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Group Announcements
CREATE TABLE group_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES savings_groups(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. Disputes
CREATE TABLE disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES savings_groups(id) ON DELETE CASCADE,
  contribution_id UUID REFERENCES contribution_records(id) ON DELETE SET NULL,
  reported_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  status dispute_status NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. Dispute Responses
CREATE TABLE dispute_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dispute_id UUID NOT NULL REFERENCES disputes(id) ON DELETE CASCADE,
  responder_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  message TEXT NOT NULL,
  action_taken TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. User Activity Logs
CREATE TABLE user_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Performance Indexes
CREATE INDEX idx_group_members_group_user ON group_members(group_id, user_id);
CREATE INDEX idx_contributions_group_period ON contribution_records(group_id, contribution_period);
CREATE INDEX idx_contributions_member ON contribution_records(member_id);
CREATE INDEX idx_audit_events_group_seq ON audit_events(group_id, sequence_number);
CREATE INDEX idx_notifications_user_read ON notifications(user_id, is_read);
CREATE INDEX idx_disputes_group_status ON disputes(group_id, status);

-- Enable Row Level Security across all 12 tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE savings_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE savings_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE contribution_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE dispute_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity_logs ENABLE ROW LEVEL SECURITY;

-- Example RLS Policies (Group isolation & role enforcement)
CREATE POLICY "Users can read own profile or shared group peers"
  ON profiles FOR SELECT USING (
    auth.uid() = id
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'platform_admin')
    OR EXISTS (
      SELECT 1 FROM group_members gm1
      JOIN group_members gm2 ON gm1.group_id = gm2.group_id
      WHERE gm1.user_id = auth.uid() AND gm2.user_id = profiles.id AND gm1.status = 'active'
    )
  );

CREATE POLICY "Members view groups they belong to or organized"
  ON savings_groups FOR SELECT USING (
    organizer_id = auth.uid()
    OR visibility = 'community_directory'
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'platform_admin')
    OR EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = savings_groups.id AND gm.user_id = auth.uid() AND gm.status = 'active'
    )
  );

CREATE POLICY "Only organizers can create groups"
  ON savings_groups FOR INSERT WITH CHECK (
    organizer_id = auth.uid()
    AND EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('organizer', 'platform_admin'))
  );

CREATE POLICY "Members view permitted group contributions"
  ON contribution_records FOR SELECT USING (
    member_id = auth.uid()
    OR EXISTS (SELECT 1 FROM savings_groups sg WHERE sg.id = contribution_records.group_id AND sg.organizer_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'platform_admin')
    OR EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = contribution_records.group_id AND gm.user_id = auth.uid() AND gm.status = 'active' AND gm.can_view_peer_totals = TRUE
    )
  );

CREATE POLICY "Audit events readable by group participants and admins, append-only via Edge Function"
  ON audit_events FOR SELECT USING (
    actor_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'platform_admin')
    OR EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = audit_events.group_id AND gm.user_id = auth.uid() AND gm.status = 'active'
    )
  );
