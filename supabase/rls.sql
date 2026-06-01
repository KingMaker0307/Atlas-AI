-- ============================================================
-- Atlas AI Coach — Row Level Security Policies
-- Run AFTER schema.sql in the Supabase SQL Editor
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE nutrition_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE water_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE body_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE recovery_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage_logs ENABLE ROW LEVEL SECURITY;

-- ─── Profiles ──────────────────────────────────────────────────
CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_insert_own" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "profiles_delete_own" ON profiles
  FOR DELETE USING (auth.uid() = id);

-- ─── Workouts ──────────────────────────────────────────────────
CREATE POLICY "workouts_own" ON workouts
  FOR ALL USING (auth.uid() = user_id);

-- ─── Workout Plans ─────────────────────────────────────────────
CREATE POLICY "workout_plans_own" ON workout_plans
  FOR ALL USING (auth.uid() = user_id);

-- ─── Nutrition Entries ─────────────────────────────────────────
CREATE POLICY "nutrition_own" ON nutrition_entries
  FOR ALL USING (auth.uid() = user_id);

-- ─── Water Logs ────────────────────────────────────────────────
CREATE POLICY "water_own" ON water_logs
  FOR ALL USING (auth.uid() = user_id);

-- ─── Body Metrics ──────────────────────────────────────────────
CREATE POLICY "body_metrics_own" ON body_metrics
  FOR ALL USING (auth.uid() = user_id);

-- ─── Recovery Logs ─────────────────────────────────────────────
CREATE POLICY "recovery_own" ON recovery_logs
  FOR ALL USING (auth.uid() = user_id);

-- ─── AI Providers ──────────────────────────────────────────────
CREATE POLICY "ai_providers_own" ON ai_providers
  FOR ALL USING (auth.uid() = user_id);

-- ─── Subscriptions ─────────────────────────────────────────────
-- Users can only READ their own subscription — writes go through server-side API only
CREATE POLICY "subscriptions_read_own" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- ─── AI Usage Logs ──────────────────────────────────────────────
-- Users can INSERT their own usage but not read/delete (managed server-side)
CREATE POLICY "ai_usage_insert_own" ON ai_usage_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "ai_usage_read_own" ON ai_usage_logs
  FOR SELECT USING (auth.uid() = user_id);
