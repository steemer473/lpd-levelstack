-- Run in Supabase SQL Editor after applying 20250603000000_levelstack_product_tables.sql

SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name LIKE 'levelstack_%'
ORDER BY table_name;

SELECT tablename, rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename LIKE 'levelstack_%';

SELECT tablename, policyname, cmd
FROM pg_policies
WHERE tablename LIKE 'levelstack_%'
ORDER BY tablename, policyname;

-- Hub entitlement (should exist from lpd-redesign)
SELECT policyname
FROM pg_policies
WHERE tablename = 'orders' AND schemaname = 'public';
