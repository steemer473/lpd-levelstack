-- Plunk email event log (delivery, opens, clicks, unsubscribes)
CREATE TABLE IF NOT EXISTS email_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_email TEXT NOT NULL,
  event_type TEXT NOT NULL,
  campaign_step TEXT,
  plunk_event_id TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_events_contact_email ON email_events(contact_email);
CREATE INDEX IF NOT EXISTS idx_email_events_event_type ON email_events(event_type);
CREATE INDEX IF NOT EXISTS idx_email_events_occurred_at ON email_events(occurred_at DESC);

ALTER TABLE email_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role only access" ON email_events;
CREATE POLICY "Service role only access"
  ON email_events
  FOR ALL
  USING (false)
  WITH CHECK (false);

COMMENT ON TABLE email_events IS 'Plunk webhook events for nurture email analytics';
