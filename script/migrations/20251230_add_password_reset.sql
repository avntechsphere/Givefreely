-- Migration: add password reset fields to users
-- Run this with your DB migration tool or psql.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS password_reset_token text;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS password_reset_expires timestamp;
