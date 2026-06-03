-- ============================================================
-- Atlas AI Coach — Migration 003: Cross-Device API Key Support
-- Run in Supabase SQL Editor AFTER schema.sql, rls.sql, 002_audit_gdpr.sql
-- ============================================================

-- Add device_secret column to profiles table.
-- This stores the PBKDF2 password used to derive the AES key that encrypts
-- AI provider API keys. Storing it here (protected by RLS) allows the same
-- key to be decrypted on any authenticated device/browser.
-- Protected by existing RLS: only the owning user can read/write their row.
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS device_secret TEXT;
