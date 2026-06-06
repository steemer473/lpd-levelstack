# Name: SEO & Performance Audit
# Description: Run Lighthouse and Firecrawl on a URL, then produce a markdown audit report (Critical / Warning / Info) with stack-specific fixes. Requires Lighthouse and Firecrawl MCP servers.

**Instructions for the Agent:**

1. **Get the URL.** Ask the user for the URL to audit, or use the URL they provided in the prompt (e.g. production site or `http://localhost:3001`).

2. **Run Lighthouse.** Use the **Lighthouse MCP** to run a full audit on that URL (SEO, performance, accessibility, best practices). Capture scores and all reported issues.

3. **Map the page with Firecrawl.** Use the **Firecrawl MCP** to crawl the URL and get the page structure and content as markdown so you can reason about structure, headings, and content.

4. **Optional:** If **SEO Toolkit MCP** is enabled, use it for meta tag or keyword checks. If not available, skip.

5. **Produce a markdown report** with:
   - **Critical:** Blocking SEO, accessibility, or performance issues. For each: what, why it matters, how to fix (specific to Next.js 16 App Router, `next/image`, metadata, design tokens per project rules).
   - **Warning:** Important but non-blocking. Same format.
   - **Info:** Recommendations.
   - **Summary:** Lighthouse scores (LCP, FID/INP, CLS, SEO, accessibility, best practices) and one-line takeaways.

6. **Save the report** to **`docs/seo-audit/seo-audit-YYYY-MM-DD.md`** in the current workspace (use today's date). If auditing multiple pages, use a slug: `docs/seo-audit/seo-audit-YYYY-MM-DD-home.md`, etc. Create the `docs/seo-audit/` folder if it does not exist.

7. **Align "how to fix"** with the project design system: use design tokens from `tokens/design-tokens.json` / `styles/generated/semantic-root.css` (no hardcoded colors), `next/image` with proper alt and loading, metadata export, WCAG 2.1 AA, and conventions in `docs/design-system.md`.

After saving, give a brief summary in chat: URL audited, report path, and top 3 critical issues. Tell the user they can follow up with: "Map these issues to files and lines" then "Apply the fixes; show diffs before applying," or run the **Apply SEO audit fixes** command.
