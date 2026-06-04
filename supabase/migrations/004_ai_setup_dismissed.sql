-- ============================================================
-- Atlas AI Coach — Migration 004: AI Setup Popup Dismissal
-- Run in Supabase SQL Editor AFTER 003_device_secret.sql
-- ============================================================

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS ai_setup_dismissed BOOLEAN DEFAULT FALSE;
