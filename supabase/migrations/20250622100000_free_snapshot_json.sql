-- Preserve free snapshot JSON when upgrading to paid (EC1 safety net)
ALTER TABLE levelstack_reports
  ADD COLUMN IF NOT EXISTS free_snapshot_json jsonb;

-- Track payment-received email sent (E1 dedupe)
ALTER TABLE levelstack_reports
  ADD COLUMN IF NOT EXISTS upgrade_notify_sent_at timestamptz;
