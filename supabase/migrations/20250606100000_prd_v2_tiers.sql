-- PRD v2: report tiers + product-owned free entitlements

CREATE TYPE levelstack_report_tier AS ENUM (
  'free_snapshot',
  'full_report',
  'strategy_call'
);

ALTER TABLE levelstack_reports
  ADD COLUMN IF NOT EXISTS report_tier levelstack_report_tier;

-- Backfill from plan_id where possible
UPDATE levelstack_reports
SET report_tier = CASE
  WHEN plan_id IN ('levelstack-full-report', 'levelstack-standard') THEN 'full_report'::levelstack_report_tier
  WHEN plan_id IN ('levelstack-strategy-call', 'levelstack-review-call') THEN 'strategy_call'::levelstack_report_tier
  WHEN plan_id = 'levelstack-free-snapshot' THEN 'free_snapshot'::levelstack_report_tier
  ELSE 'full_report'::levelstack_report_tier
END
WHERE report_tier IS NULL;

CREATE TABLE IF NOT EXISTS levelstack_free_entitlements (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  business_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_levelstack_free_entitlements_email
  ON levelstack_free_entitlements(email);

ALTER TABLE levelstack_free_entitlements ENABLE ROW LEVEL SECURITY;

CREATE POLICY levelstack_free_entitlements_select_own ON levelstack_free_entitlements
  FOR SELECT USING (auth.uid() = user_id);

-- Partner white-label config (PRD §7)
CREATE TABLE IF NOT EXISTS levelstack_partner_branding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_slug TEXT NOT NULL UNIQUE,
  company_name TEXT NOT NULL,
  logo_url TEXT,
  accent_color_hex TEXT NOT NULL DEFAULT '#FF6633',
  custom_domain TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER levelstack_partner_branding_updated_at
  BEFORE UPDATE ON levelstack_partner_branding
  FOR EACH ROW EXECUTE FUNCTION levelstack_set_updated_at();

-- Server-only until partner dashboard ships; service role bypasses RLS.
ALTER TABLE levelstack_partner_branding ENABLE ROW LEVEL SECURITY;
