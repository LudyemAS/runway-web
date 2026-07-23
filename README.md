# runway-web

The standalone marketing + support site for **Runway**, served at **runwayfire.com**
(GitHub Pages, plain static HTML, no build step, deploys from `main`).

Split out of `LudyemAS/ludyem-web` (where it lived under `/runway`) on 2026-07-23 so Runway
has its own domain instead of being a subfolder of `ludyem.dev`. Tend and Workouts stay on
`ludyem.dev`; `ludyem.dev/runway/*` now 301-redirects here.

## Layout
- `index.html`, `privacy.html`, `terms.html`, `support.html`, `press.html` — core pages
- `calculators/` — free FIRE calculators (SEO + funnel)
- `blog/` — FIRE blog posts
- `no/` — Norwegian (Bokmål) mirror, hreflang-paired
- `assets/` — shared base (`ludyem.css`) + Runway theme (`runway-site.css`), icons, spot art, screenshots
- `CNAME` — `runwayfire.com`

## Deploy
Pushing to `main` auto-deploys the LIVE site (App Store privacy/terms/support URLs point here).
Verify locally first: `python3 -m http.server` at the repo root (so absolute `/assets/...` paths resolve).

## Related
- Email signup posts to the shared `ludyem-waitlist` Cloudflare Worker (source in `ludyem-web/worker/`);
  its origin allowlist must include `https://runwayfire.com`.
- Analytics: Cloudflare Web Analytics (add `runwayfire.com` as a hostname in the CF property).
