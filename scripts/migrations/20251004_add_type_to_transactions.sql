-- Migration: Add type column to transactions for settlement/adjustment support
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'expense';
-- Constrain allowed values (add only if constraint not present)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.constraint_column_usage 
        WHERE table_name='transactions' AND constraint_name='transactions_type_check') THEN
        ALTER TABLE transactions
            ADD CONSTRAINT transactions_type_check
            CHECK (type IN ('expense','settlement','adjustment'));
    END IF;
END$$;

CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
-- Backfill any NULL just in case
UPDATE transactions SET type='expense' WHERE type IS NULL;
