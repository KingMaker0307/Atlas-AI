-- ============================================================
-- Atlas AI Coach — Migration 005: Custom Exercises in Workout Plans
-- Run in Supabase SQL Editor AFTER 004_ai_setup_dismissed.sql
-- ============================================================

ALTER TABLE workout_plans
  ADD COLUMN IF NOT EXISTS custom_exercises JSONB NOT NULL DEFAULT '[]'::jsonb;
