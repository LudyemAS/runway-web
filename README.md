# runway-web

The standalone marketing + support site for **Runway**, served at **runwayfire.com**
(GitHub Pages, plain static HTML, no build step, deploys from `main`).

Split out of `LudyemAS/ludyem-web` (where it lived under `/runway`) on 2026-07-23 so Runway
has its own domain instead of being a subfolder of `ludyem.dev`. Tend and Workouts stay on
`ludyem.dev`; `ludyem.dev/runway/*` now forwards here.

That forward is **not a 301** — ludyem.dev is GitHub Pages, which cannot issue server-side
redirects, so each old path is a stub page with `<meta http-equiv="refresh">`, a JS
`location.replace`, and a `rel="canonical"` pointing at its runwayfire.com twin. Google treats
that as a soft redirect and can, for a while, keep indexing the ludyem.dev URL instead — it did
exactly that to `/blog/` in August 2026. So: never link to `ludyem.dev/runway/*` from anywhere,
and keep the stubs' canonicals correct. A true 301 needs ludyem.dev's DNS moved to Cloudflare
(it is on Porkbun nameservers today) plus a redirect rule.

## Layout
- `index.html`, `privacy.html`, `terms.html`, `support.html`, `press.html`, `about.html` — core pages
- `calculators/` — free FIRE calculators (SEO + funnel)
- `blog/` — FIRE blog posts
- `countries/` — hub + one page per modelled country, figures probed from the engine
- `no/` — Norwegian (Bokmål) mirror, hreflang-paired
- `assets/` — shared base (`ludyem.css`) + Runway theme (`runway-site.css`), icons, spot art, screenshots
- `CNAME` — `runwayfire.com`

## Maintenance
**[`MAINTENANCE.md`](MAINTENANCE.md) before you edit content.** It holds the two site-state toggles
(pre-launch to live, Norway-only to multi-country home), the hand-maintained counts that drift
silently, and the add-a-country checklist.

## Deploy
Pushing to `main` auto-deploys the LIVE site (App Store privacy/terms/support URLs point here).
Verify locally first: `python3 -m http.server` at the repo root (so absolute `/assets/...` paths resolve).

## Related
- Email signup posts to the shared `ludyem-waitlist` Cloudflare Worker (source in `ludyem-web/worker/`);
  its origin allowlist must include `https://runwayfire.com`.
- Analytics: Cloudflare Web Analytics (add `runwayfire.com` as a hostname in the CF property).
