# runwayfire.com go-live runbook

Everything in code is done and committed (see "Already done" below). What remains is the
account-level cutover, which needs your registrar / GitHub / Cloudflare logins. Do the steps
**in order** — the one hard rule is: **runwayfire.com must be live and serving before you push
the ludyem.dev redirects or submit the app**, or those point at a dead site.

Cloudflare account for the worker/analytics: Apple-SSO login, account id `d151ea2f999ea12422270f34ae26f915`.

---

## Already done (committed, not yet pushed/deployed)
- **`runway-web` (this repo):** the standalone site — `/runway/*` moved to root, all URLs/paths
  rewritten to runwayfire.com, `CNAME`, runway-only `sitemap.xml`, `robots.txt`, support email →
  `support@runwayfire.com`. **Not pushed anywhere yet** (no GitHub repo exists).
- **`ludyem-web`:** every `/runway/*` page replaced with a canonical + meta-refresh redirect to
  runwayfire.com; 35 runway entries dropped from the family sitemap; `runwayfire.com` +
  `www.runwayfire.com` added to the waitlist worker's origin allowlist. **Committed, not pushed.**
- **Runway app repo:** in-app Privacy/Terms (About + paywall) → runwayfire.com, support mailto →
  `support@runwayfire.com`, and all App Store metadata/scripts. **Committed to `main`.**

---

## Step 1 — Publish runwayfire.com (do this first)
1. Create the GitHub repo (empty) and push:
   ```bash
   cd ~/Developer/runway-web
   gh repo create LudyemAS/runway-web --public --source=. --remote=origin --push
   ```
   (or make an empty `LudyemAS/runway-web` on github.com, then `git remote add origin
   git@github.com:LudyemAS/runway-web.git && git push -u origin main`)
2. Repo **Settings → Pages** → Source: **Deploy from a branch**, branch `main`, folder `/ (root)`.
   The `CNAME` file already sets the custom domain to `runwayfire.com`.
3. Point DNS for `runwayfire.com` at GitHub Pages (at your registrar, **or** move the domain to
   Cloudflare — see Step 2, which is the cleaner option since you already use CF):
   - **Apex `@`** — four A records:
     `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
     (optional IPv6 AAAA: `2606:50c0:8000::153`, `…8001::153`, `…8002::153`, `…8003::153`)
   - **`www`** — CNAME → `LudyemAS.github.io`
   - If DNS is on Cloudflare, set these records **DNS-only (grey cloud)**, not proxied.
4. Back in Settings → Pages, wait for the cert, then tick **Enforce HTTPS**.

## Step 2 — Email routing for support@runwayfire.com
The app and site now send support mail to `support@runwayfire.com`; forward it to the same inbox
`support@ludyem.dev` uses (`app.ludyem@gmail.com`).
- **Porkbun (where the DNS already lives):** Porkbun dashboard → the domain → **Email Forwarding** →
  forward `support@runwayfire.com` → `app.ludyem@gmail.com`. Porkbun adds the MX records for you; no
  nameserver change.
- Then add `support@runwayfire.com` as a Gmail **Send mail as** alias so replies go out from the
  Runway address (the verification link arrives via the forward). Same setup as support@ludyem.dev.
- (Cloudflare Email Routing is only simpler if you move the domain's nameservers to Cloudflare — not
  worth it just for email when DNS is on Porkbun.)

## Step 3 — Deploy the waitlist worker (picks up the new origin)
```bash
cd ~/Developer/ludyem-web/worker
wrangler deploy      # logged into the CF account above
```

## Step 4 — Push the ludyem.dev redirects (only after Step 1 is live)
```bash
cd ~/Developer/ludyem-web
git push
```
Now `ludyem.dev/runway/*` 301-style redirects to the live `runwayfire.com/*`.

## Step 5 — Cloudflare Web Analytics
Add `runwayfire.com` as a hostname in the existing CF Web Analytics property (the beacon token
`77f2f7a9…` is already in the pages), or create a new site entry for it.

## Step 6 — App Store URLs
The app repo already points at runwayfire.com. Push the store metadata (or set the three URL
fields in App Store Connect by hand) so the product page matches — do this once the site is live:
```bash
cd ~/Developer/Runway/Scripts/asc && python3 push_localizations.py    # per its README
```
This is a metadata edit, not a new build/review. It does **not** affect ASO ranking, keywords,
or reviews — and the app is pre-launch anyway, so nothing resets.

---

## Verify after DNS propagates
- [ ] `https://runwayfire.com/` loads and renders (CSS + mascots + screenshots)
- [ ] `/privacy` `/terms` `/support` `/press` `/no/` `/calculators/` `/blog/` all 200
- [ ] `https://ludyem.dev/runway/privacy` redirects to `https://runwayfire.com/privacy`
- [ ] Waitlist signup on runwayfire.com succeeds (network POST returns `{ok:true}`)
- [ ] Test email to `support@runwayfire.com` lands in your inbox
- [ ] In the app: About → Privacy/Terms and the paywall footer open runwayfire.com
