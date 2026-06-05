-- ============================================================
-- Atlas AI Coach — Supabase PostgreSQL Schema
-- Run this in the Supabase SQL Editor
-- ============================================================

-- ─── Profiles ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  goal TEXT,
  experience TEXT,
  training_style TEXT,
  gender TEXT,
  age INT,
  height FLOAT,
  weight FLOAT,
  weight_unit TEXT DEFAULT 'lbs',
  height_unit TEXT DEFAULT 'in',
  activity_level TEXT,
  dietary_preferences TEXT,
  equipment TEXT,
  target_physique TEXT,
  injuries TEXT,
  workout_duration INT,
  days_per_week INT,
  body_type TEXT,
  custom_goal TEXT,
  theme TEXT DEFAULT 'system',
  guided_mode BOOLEAN DEFAULT TRUE,
  has_onboarded BOOLEAN DEFAULT FALSE,
  ai_setup_dismissed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Workouts ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS workouts (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_minutes INT,
  fatigue_rating INT,
  notes TEXT,
  plan_id TEXT,
  exercises JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS workouts_user_started ON workouts(user_id, started_at DESC);

-- ─── Workout Plans ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS workout_plans (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  goal TEXT,
  target_date DATE,
  routines JSONB NOT NULL DEFAULT '[]',
  creator_type TEXT DEFAULT 'manual',
  start_day TEXT DEFAULT 'Monday',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS workout_plans_user ON workout_plans(user_id);

-- ─── Nutrition Entries ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS nutrition_entries (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  calories FLOAT DEFAULT 0,
  protein FLOAT DEFAULT 0,
  carbs FLOAT DEFAULT 0,
  fat FLOAT DEFAULT 0,
  fiber FLOAT DEFAULT 0,
  sugar FLOAT DEFAULT 0,
  sodium FLOAT DEFAULT 0,
  potassium FLOAT DEFAULT 0,
  vitamin_c FLOAT DEFAULT 0,
  calcium FLOAT DEFAULT 0,
  iron FLOAT DEFAULT 0,
  meal TEXT DEFAULT 'snack',
  serving_size FLOAT DEFAULT 1,
  serving_unit TEXT DEFAULT 'serving',
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS nutrition_user_timestamp ON nutrition_entries(user_id, timestamp DESC);

-- ─── Water Logs ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS water_logs (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount FLOAT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS water_user_timestamp ON water_logs(user_id, timestamp DESC);

-- ─── Body Metrics ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS body_metrics (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  bodyweight FLOAT,
  body_fat FLOAT,
  waist FLOAT,
  chest FLOAT,
  hips FLOAT,
  arm FLOAT,
  thigh FLOAT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS body_metrics_user_date ON body_metrics(user_id, date DESC);

-- ─── Recovery Logs ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS recovery_logs (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  sleep_hours FLOAT,
  soreness INT,
  stress INT,
  readiness INT,
  energy INT,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS recovery_user_date ON recovery_logs(user_id, date DESC);

-- ─── AI Providers ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_providers (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  label TEXT,
  base_url TEXT,
  model TEXT,
  encrypted_api_key TEXT,
  temperature FLOAT DEFAULT 0.7,
  context_length INT DEFAULT 4096,
  streaming BOOLEAN DEFAULT TRUE,
  enabled BOOLEAN DEFAULT TRUE,
  is_active BOOLEAN DEFAULT FALSE,
  last_tested_at TIMESTAMPTZ,
  last_status TEXT,
  last_error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ai_providers_user ON ai_providers(user_id);

-- ─── Subscriptions ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan TEXT NOT NULL DEFAULT 'byok',
  status TEXT NOT NULL DEFAULT 'active',
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS subscriptions_user ON subscriptions(user_id);

-- ─── AI Usage Logs (for rate limiting) ────────────────────────
CREATE TABLE IF NOT EXISTS ai_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ai_usage_user_time ON ai_usage_logs(user_id, created_at DESC);

-- Auto-cleanup: delete usage logs older than 24 hours (keep table small)
-- Run this as a cron job in Supabase Dashboard → Database → Cron Jobs:
-- DELETE FROM ai_usage_logs WHERE created_at < NOW() - INTERVAL '24 hours';

-- ─── Chat Messages (Day-Based) ─────────────────────────────────
CREATE TABLE IF NOT EXISTS chat_messages (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS chat_messages_user_date ON chat_messages(user_id, date, created_at ASC);

-- ─── Recent Food Searches ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS recent_food_searches (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  brand TEXT,
  calories FLOAT DEFAULT 0,
  protein FLOAT DEFAULT 0,
  carbs FLOAT DEFAULT 0,
  fat FLOAT DEFAULT 0,
  fiber FLOAT DEFAULT 0,
  sugar FLOAT DEFAULT 0,
  sodium FLOAT DEFAULT 0,
  potassium FLOAT DEFAULT 0,
  vitamin_c FLOAT DEFAULT 0,
  calcium FLOAT DEFAULT 0,
  iron FLOAT DEFAULT 0,
  serving_unit TEXT DEFAULT 'serving',
  serving_weight FLOAT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS recent_food_searches_user ON recent_food_searches(user_id, created_at DESC);

-- ─── AI Response Cache ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_response_cache (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('workout_plan', 'nutrition_estimation', 'daily_insight', 'coach_response')),
  query_key TEXT NOT NULL,
  response_payload JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ai_response_cache_user_query ON ai_response_cache(user_id, category, query_key);

-- ─── Grants ────────────────────────────────────────────────────
GRANT ALL ON TABLE chat_messages TO authenticated;
GRANT ALL ON TABLE chat_messages TO service_role;

GRANT ALL ON TABLE recent_food_searches TO authenticated;
GRANT ALL ON TABLE recent_food_searches TO service_role;

GRANT ALL ON TABLE ai_response_cache TO authenticated;
GRANT ALL ON TABLE ai_response_cache TO service_role;

