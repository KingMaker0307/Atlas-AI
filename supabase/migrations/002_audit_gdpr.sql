-- ============================================================
-- Atlas AI Coach — Migration 002: Audit Log + GDPR
-- Run in Supabase SQL Editor AFTER schema.sql and rls.sql
-- ============================================================

-- ─── Audit Log Table ──────────────────────────────────────────
-- Stores immutable records of sensitive user actions.
-- Required for GDPR compliance and security forensics.
-- user_id is nullable so deleted accounts' logs are preserved.
CREATE TABLE IF NOT EXISTS audit_logs (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID,                                    -- nullable: kept after deletion
  action      TEXT        NOT NULL,                    -- 'account_deleted', 'data_exported', 'password_changed'
  metadata    JSONB       DEFAULT '{}',                -- e.g. { "email": "...", "ip": "..." }
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Users can read their own audit logs; no write/delete from client
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_logs_read_own" ON audit_logs
  FOR SELECT USING (auth.uid() = user_id);

-- Index for fast user-specific lookups
CREATE INDEX IF NOT EXISTS audit_logs_user_time ON audit_logs(user_id, created_at DESC);

-- ─── GDPR: Hard delete helper function ────────────────────────
-- Called server-side only via service role key.
-- Cascades through all user data via ON DELETE CASCADE on every table.
-- The audit log row is written BEFORE the delete so it's preserved.
CREATE OR REPLACE FUNCTION delete_user_account(target_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- ON DELETE CASCADE handles: profiles, workouts, workout_plans,
  -- nutrition_entries, water_logs, body_metrics, recovery_logs,
  -- ai_providers, subscriptions, ai_usage_logs
  DELETE FROM auth.users WHERE id = target_user_id;
END;
$$;

-- ─── Cleanup: Remove old api routes no longer needed ──────────────
-- (apple auth callback and send-otp are unused — delete manually)
-- These are listed here as documentation only; SQL cannot delete files.
