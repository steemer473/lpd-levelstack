/**
 * Maps LevelStack field labels to GHL custom field keys (aligned with hub mapping).
 */
const ghlFieldKeyMapping: Record<string, string> = {
  "Website URL": "website_url",
  "Intake Source": "intake_source",
  "Geo Focus": "geo_focus",
  "LevelStack Report URL": "levelstack_report_url",
  "Primary Service": "primary_service",
  "Purchase Motivation": "purchase_motivation",
  "Market City": "market_city",
  "Top Competitor": "top_competitor",
  "Top Finding": "top_finding",
  "Report Tier": "report_tier",
  "Ninety Day Goal": "ninety_day_goal",
  "Contract Value Tier": "contract_value_tier",
  "LevelStack SAP Credit Eligible": "levelstack_sap_credit_eligible",
  "LevelStack Paid Amount": "levelstack_paid_amount",
}

export function getGHLFieldKey(fieldName: string): string {
  const mapped = ghlFieldKeyMapping[fieldName]
  if (mapped) return mapped

  return fieldName
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "")
}
