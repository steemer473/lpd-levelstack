import { describe, expect, it } from "vitest"

import {
  decideFreeSnapshotGuardrail,
  FREE_SNAPSHOT_READY_COOLDOWN_MS,
} from "./free-snapshot-guardrails"

describe("decideFreeSnapshotGuardrail", () => {
  const now = Date.parse("2026-07-30T12:00:00.000Z")

  it("proceeds when there is no prior free report", () => {
    expect(
      decideFreeSnapshotGuardrail({
        latestFreeReport: null,
        forceRefresh: false,
        nowMs: now,
      }),
    ).toEqual({ action: "proceed" })
  })

  it("reuses in-progress reports without creating a new job", () => {
    const result = decideFreeSnapshotGuardrail({
      latestFreeReport: {
        id: "r-gen",
        status: "generating",
        intake_id: "i-1",
        created_at: "2026-07-30T11:55:00.000Z",
      },
      forceRefresh: false,
      nowMs: now,
    })
    expect(result.action).toBe("reuse_in_progress")
    if (result.action === "reuse_in_progress") {
      expect(result.reportId).toBe("r-gen")
    }
  })

  it("soft-reuses a ready report within cooldown", () => {
    const result = decideFreeSnapshotGuardrail({
      latestFreeReport: {
        id: "r-ready",
        status: "ready",
        intake_id: "i-1",
        created_at: "2026-07-30T10:00:00.000Z",
      },
      forceRefresh: false,
      nowMs: now,
      cooldownMs: FREE_SNAPSHOT_READY_COOLDOWN_MS,
    })
    expect(result.action).toBe("reuse_ready")
    if (result.action === "reuse_ready") {
      expect(result.reportId).toBe("r-ready")
    }
  })

  it("proceeds when ready report is past cooldown", () => {
    expect(
      decideFreeSnapshotGuardrail({
        latestFreeReport: {
          id: "r-old",
          status: "ready",
          created_at: "2026-07-28T10:00:00.000Z",
        },
        forceRefresh: false,
        nowMs: now,
      }),
    ).toEqual({ action: "proceed" })
  })

  it("proceeds on force refresh even when ready within cooldown", () => {
    expect(
      decideFreeSnapshotGuardrail({
        latestFreeReport: {
          id: "r-ready",
          status: "ready",
          created_at: "2026-07-30T10:00:00.000Z",
        },
        forceRefresh: true,
        nowMs: now,
      }),
    ).toEqual({ action: "proceed" })
  })

  it("proceeds after a failed prior report", () => {
    expect(
      decideFreeSnapshotGuardrail({
        latestFreeReport: {
          id: "r-fail",
          status: "failed",
          created_at: "2026-07-30T11:00:00.000Z",
        },
        forceRefresh: false,
        nowMs: now,
      }),
    ).toEqual({ action: "proceed" })
  })
})
