# Report mobile QA checklist

Use DevTools device mode or a physical phone. Open a free snapshot report at `/dev/report-preview` (dev) or a live report link.

Test at **320, 375, 390, and 414px** width on all seven sidebar tabs.

## Checklist

- [ ] Sidebar tabs scroll horizontally; active tab stays visible
- [ ] Executive summary: headline wraps; score card does not overlap headline
- [ ] KPI strip shows 2×2 grid on mobile
- [ ] Locked tab → unlock modal fits viewport; scrolls if needed; both CTAs tappable (44px min height)
- [ ] Upgrade banner and FAQ have equal vertical spacing
- [ ] Section finding cards readable; no horizontal page scroll
- [ ] Action plan locked preview and SAP bridge block render cleanly
- [ ] Scroll-to-top button does not cover primary CTA

## Automated coverage

Run Playwright mobile tests:

```bash
pnpm test:e2e:mobile
```

Covers exec tab overflow, unlock modal layout, locked-tab modal open, upgrade banner stacking, FAQ spacing, competitive grid scroll, and all sidebar tabs at 320/375/390/414px.
