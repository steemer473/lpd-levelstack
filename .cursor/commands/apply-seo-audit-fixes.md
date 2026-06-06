# Name: Apply SEO Audit Fixes
# Description: Read the latest SEO audit report from docs/seo-audit/, map Critical and Warning issues to files and lines, then apply fixes (show diffs before applying). Run after the SEO & Performance Audit command.

**Instructions for the Agent:**

1. **Find the latest report.** In the current workspace, look in **`docs/seo-audit/`** for the most recent audit report (e.g. `seo-audit-YYYY-MM-DD.md`). If no report exists, tell the user to run the **SEO & Performance Audit** command first and stop.

2. **Map issues to code.** For every **Critical** and **Warning** in the report, identify the exact **files and line numbers** in this repo (`app/`, `components/`, and other relevant dirs). List them as: **Issue → File:Line → suggested change.**

3. **Propose fixes.** For each mapped item, determine the concrete edit (meta tags, `next/image` alt/loading, heading hierarchy, accessibility labels, etc.). Follow the project's conventions: design tokens, `next/image`, metadata patterns, WCAG 2.1 AA, and `docs/design-system.md`.

4. **Show diffs before applying.** For each fix, show the diff (or a clear before/after). Do not modify files until the user confirms, or apply in small batches and confirm as you go if the command context says to apply.

5. **Apply the fixes.** Edit the identified files. Prefer Technical SEO and Accessibility fixes: meta tags, image alt and loading, heading order, form labels, focus management, and semantic HTML.

6. **Suggest verification.** After applying, suggest re-running the **SEO & Performance Audit** command on the same URL to confirm scores improved and Critical/Warning counts decreased.
