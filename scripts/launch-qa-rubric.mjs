#!/usr/bin/env node
/**
 * Prints the $497 launch QA rubric — see docs/launch-qa-panel.md
 */
console.log(`
LevelStack Launch QA — 5-report panel
=====================================

Score each completed report 1–5 on criteria A–F (see docs/launch-qa-panel.md).

Industries: RE, coach, contractor, consultant, healthcare-adjacent.

Ship when median score ≥ 4/5 for each criterion across all 5 reports.

Check job metadata: quality_warnings should be empty on ship candidates.
`)
