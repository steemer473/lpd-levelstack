-- LevelStack product tables (lpd-levelstack repo)
-- Shared Supabase project with hub; hub owns auth.users, user_profiles, orders.

-- =============================================================================
-- ENUMS
-- =============================================================================

CREATE TYPE levelstack_intake_status AS ENUM ('draft', 'submitted');

CREATE TYPE levelstack_job_status AS ENUM (
  'pending',
  'running',
  'completed',
  'failed'
);

CREATE TYPE levelstack_report_status AS ENUM (
  'pending',
  'generating',
  'ready',
  'failed'
);

-- =============================================================================
-- INTAKES
-- =============================================================================

CREATE TABLE IF NOT EXISTS levelstack_intakes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status levelstack_intake_status NOT NULL DEFAULT 'draft',
  form_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_levelstack_intakes_user_id ON levelstack_intakes(user_id);
CREATE INDEX idx_levelstack_intakes_status ON levelstack_intakes(status);

-- =============================================================================
-- RESEARCH JOBS
-- =============================================================================

CREATE TABLE IF NOT EXISTS levelstack_research_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  intake_id UUID NOT NULL REFERENCES levelstack_intakes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status levelstack_job_status NOT NULL DEFAULT 'pending',
  error_message TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_levelstack_research_jobs_intake_id ON levelstack_research_jobs(intake_id);
CREATE INDEX idx_levelstack_research_jobs_user_id ON levelstack_research_jobs(user_id);
CREATE INDEX idx_levelstack_research_jobs_status ON levelstack_research_jobs(status);

-- =============================================================================
-- REPORTS
-- =============================================================================

CREATE TABLE IF NOT EXISTS levelstack_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  intake_id UUID NOT NULL REFERENCES levelstack_intakes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id UUID REFERENCES levelstack_research_jobs(id) ON DELETE SET NULL,
  status levelstack_report_status NOT NULL DEFAULT 'pending',
  plan_id TEXT,
  report_json JSONB,
  pdf_storage_path TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_levelstack_reports_user_id ON levelstack_reports(user_id);
CREATE INDEX idx_levelstack_reports_intake_id ON levelstack_reports(intake_id);
CREATE INDEX idx_levelstack_reports_status ON levelstack_reports(status);

-- =============================================================================
-- UPDATED_AT TRIGGERS
-- =============================================================================

CREATE OR REPLACE FUNCTION levelstack_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER levelstack_intakes_updated_at
  BEFORE UPDATE ON levelstack_intakes
  FOR EACH ROW EXECUTE FUNCTION levelstack_set_updated_at();

CREATE TRIGGER levelstack_research_jobs_updated_at
  BEFORE UPDATE ON levelstack_research_jobs
  FOR EACH ROW EXECUTE FUNCTION levelstack_set_updated_at();

CREATE TRIGGER levelstack_reports_updated_at
  BEFORE UPDATE ON levelstack_reports
  FOR EACH ROW EXECUTE FUNCTION levelstack_set_updated_at();

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE levelstack_intakes ENABLE ROW LEVEL SECURITY;
ALTER TABLE levelstack_research_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE levelstack_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY levelstack_intakes_select_own ON levelstack_intakes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY levelstack_intakes_insert_own ON levelstack_intakes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY levelstack_intakes_update_own ON levelstack_intakes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY levelstack_research_jobs_select_own ON levelstack_research_jobs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY levelstack_reports_select_own ON levelstack_reports
  FOR SELECT USING (auth.uid() = user_id);

-- Service role bypasses RLS for background jobs (server-only admin client).
