-- Migration: Add is_active column to payment_sources for soft archive support
ALTER TABLE payment_sources ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
CREATE INDEX IF NOT EXISTS idx_payment_sources_is_active ON payment_sources(is_active);
-- Backfill nulls to TRUE just in case
UPDATE payment_sources SET is_active = TRUE WHERE is_active IS NULL;
