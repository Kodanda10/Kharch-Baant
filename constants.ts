// Single shared logical current user identifier. All domain data now lives in Supabase.
// The historical mock seed arrays (PEOPLE, GROUPS, TRANSACTIONS, PAYMENT_SOURCES) have been removed
// after migration to Supabase-only mode. See supabase-schema.sql for seeding examples.
export const CURRENT_USER_ID = '00000000-0000-0000-0000-000000000001';
