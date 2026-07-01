/** Plunk event names — must match workflow trigger `eventName` in Plunk. */
export const PLUNK_EVENTS = {
  reportReady: "levelstack_report_ready",
  purchased: "levelstack_purchased",
  waitlistJoined: "sap_waitlist_joined",
  unsubscribed: "contact.unsubscribed",
} as const

export type PlunkEventName = (typeof PLUNK_EVENTS)[keyof typeof PLUNK_EVENTS]

export const PLUNK_WORKFLOW_KEYS = {
  workflowA: "levelstack_nurture_a",
  workflowB: "levelstack_waitlist_b",
} as const
