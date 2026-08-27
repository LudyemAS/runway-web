# runway-web maintenance

What on this site goes stale, and what to edit when it does. The site is plain static HTML with
no build step, so nothing here is enforced by tooling: this file **is** the mechanism.

Pushing `main` deploys the LIVE site. Verify locally first:

```bash
cd ~/Developer/runway-web && python3 -m http.server 8000
```

(Serve from the repo root so absolute `/assets/...` paths resolve.)

---

## 1. The two state toggles

Both live in `assets/launch.js`, are read before first paint, and put a class on `<html>`.
Pages ship in the "before" state, so with JavaScript off nothing looks broken.

### Launch state, driven by a DATE

| Class | Shows |
|---|---|
| `js-prelaunch` | before launch (TestFlight beta + waitlist CTAs) |
| `js-live` | after launch (App Store CTAs) |

Two dates, because availability rolls out in two steps:

- `NORWAY_LAUNCH` **2026-08-25**, the Norway storefront only.
- `WORLDWIDE_LAUNCH` **2026-09-15**, every other storefront.

Which one a page uses is decided by **path**: anything under `/no/` is read by people in Norway
and flips on the Norway date; English pages are read worldwide and wait for the worldwide date,
so the App Store link never lands a reader on "not available in your country or region". The
English landing page (`index.html`) is the deliberate exception, and sets `window.RUNWAY_LAUNCH`
itself; an explicit page override always wins.

**A new page needs nothing** beyond `<html class="is-prelaunch">` and the `launch.js` tag, which
every page already has. Do not hardcode a launch date in a page.

**`LAUNCHED` is a third gate, and it is the one that is true today.** A date cannot know whether
App Review approved the build, so `LAUNCHED` in `assets/launch.js` is flipped by hand once the
storefront actually serves. It was set `true` on 2026-08-27, verified by fetching the listing
rather than by trusting the calendar: `apps.apple.com/no/app/id6784426559` answered 200 while the
`us`, `gb` and `se` storefronts answered 404.

### The App Store links are pinned to Norway, and unpin themselves

Every App Store href in the markup is `https://apps.apple.com/**no**/app/id6784426559`, not the
storefront-neutral `https://apps.apple.com/app/id6784426559`.

That is deliberate. While the app is Norway-only the neutral link is **broken**: Apple geolocates
the visitor and serves a storefront error page rather than the listing, verified 2026-08-27 by
loading both. The `/no/` prefix always resolves.

**You do not have to undo this by hand.** On `WORLDWIDE_LAUNCH`, `/no/` would start forcing an
American reader onto the Norwegian store, so `launch.js` drops the prefix at render time once that
date has passed and `LAUNCHED` is true. This one is derived rather than hand-set on purpose: the
`LAUNCHED` flip above is a hand-edit and it was missed by two days, and a second hand-edit with a
calendar trigger is exactly the kind that gets forgotten. The markup keeps the `/no/` form as the
no-JS fallback, which is the safer of the two to be stuck on.

Preview either side without waiting: `localStorage.setItem('runwayLive','1')` forces the unpinned
form, `'0'` forces the pinned one.

**Two things on that date are still yours by eye:**

1. The 41 English pre-launch sentences reading "is on the App Store in Norway now, and lands
   worldwide on 15 September 2026". After the worldwide date they sit inside `js-prelaunch` and
   stop rendering, so they are harmless, but they are wrong if the date ever moves.
2. `press.html` bypasses the toggle entirely. Its badge and App Store row are hand-edited.

### Home-country availability, driven by a HAND-SET FLAG

| Class | Shows |
|---|---|
| `js-preglobal` | while Norway is the only country you can plan FROM |
| `js-global` | once other home countries are selectable |

`GLOBAL_HOME` in `assets/launch.js`, currently `false`.

This one is **not** on a calendar on purpose. The engine already carries full home (native) packs
for Italy, France, Germany, the Netherlands, Sweden, the United Kingdom, the United States, Canada
and Australia, but they are dormant behind `RunwayFeatures.globalCountriesEnabled` in the app,
which is hard-off in release. Turning them on takes a build that must clear App Review, so a date
would advertise a home country nobody can pick yet.

**When that build is live on the App Store:**
1. Set `GLOBAL_HOME = true` in `assets/launch.js`.
2. Hand-edit the FAQ **JSON-LD** in `countries/index.html` to the `js-global` wording. CSS hides
   the pre-global paragraph but structured data has no state, and Google wants `FAQPage` markup to
   match what a reader can see. Two answers there have twins: "Which countries does Runway model?"
   and "Will Runway add more home countries?".
3. Re-check the destination counts in §2, which are phrased from a Norwegian's point of view.

Preview either state without waiting, from the browser console:

```js
localStorage.setItem('runwayLive', '1')     // '0' forces pre-launch
localStorage.setItem('runwayGlobal', '1')   // '0' forces Norway-only
localStorage.removeItem('runwayLive')       // back to automatic
localStorage.removeItem('runwayGlobal')
```

---

## 2. Live counts (hand-maintained, they drift silently)

### Destination count, currently **17**

18 country packs ship; a Norwegian reader sees 17 of them as destinations (everything except
home). Country pages themselves are evergreen, but the count is spelled out in prose here:

```bash
grep -rn "17 destination\|17 retirement\|17 destinasjon\|17 land\|17 pensjonsdestinasjoner" --include="*.html" --include="*.txt" .
```

- `countries/index.html`: meta description, `og:description`, the intro, and the FAQ in **both**
  visible HTML and JSON-LD
- `llms.txt`: the summary line and the FIRE Index entry
- `blog/fire-calculator-retire-abroad/` and its Norwegian twin `no/blog/fire-kalkulator-utlandet/`:
  a comparison-table cell, a body sentence, a bullet, and an FAQ in both HTML and JSON-LD

**Leave the FIRE Index study alone.** `blog/norway-fire-index-2026/` (and `no/blog/norge-fire-indeksen-2026/`,
and the teaser on `blog/index.html`) says 17 because that is how many destinations were *in the
study run*. It is a dated result, not a live count. Re-running the study is what changes it.

### Monte Carlo runs, currently **1,000**

Matches `RunwayFeatures.snapshotMonteCarloRuns` in the app (1000 since 2026-07-23; it read 400
here until 2026-07-25). The app interpolates the constant, the site does not:

```bash
grep -rn "1,000\|1 000" --include="*.html" . | grep -i "futures\|fremtider\|market\|marked"
```

Hits `index.html` (a stat tile), `support.html` (FAQ, HTML + JSON-LD), `blog/four-percent-rule/`,
`calculators/index.html`, and the Norwegian twins.

---

## 3. Adding a country pack

When a new pack ships in the app:

1. Add `countries/<slug>/index.html`. Copy the nearest existing page for structure. **Every tax
   figure is probed from the engine**, never hand-typed: the 2026-07-25 pass used a scratchpad
   SwiftPM harness (`SiteFacts`) depending on `RunwayEngine` by path and reading
   `drawdownHeadline()`. Do that again rather than transcribing from the pack source.
2. Add a row to the table in `countries/index.html`, in the same order as the `ItemList` JSON-LD,
   and add the matching `ListItem` (renumbering `position`). Give the row a two-state Role cell if
   the pack is home-capable, matching its neighbours.
3. Bump the destination counts in §2.
4. Add the URL to `sitemap.xml`.
5. If it is home-capable, add it to the country lists in the two `countries/index.html` FAQ answers
   (visible **and** JSON-LD) and to the native-pack list in §1 above.

The app-side source of truth for what a pack can do is `Runway/Features/Shared/CountryCatalog.swift`
(`hasNativePack` / `hasDestinationPack`) in the `Runway` repo. Read it, do not infer from the engine
registry alone.

---

## 4. Don't touch without a reason

- **Cloudflare Web Analytics** beacon token `49d37aff…`, one `<script>` at the foot of every page,
  scoped to this site only. Analytics started 2026-07-22; there is no data before then.
- **Waitlist worker.** The signup form posts to the shared `ludyem-waitlist` Cloudflare Worker
  (source in the `ludyem-web` repo, `worker/`). Its origin allowlist must keep `https://runwayfire.com`
  and `https://www.runwayfire.com`.
- **`fb75fecb…txt`** is the IndexNow key, and `robots.txt` names it. Renaming either breaks
  Bing/Yandex crawl notifications.

---

## 5. Owner tasks (no CLI path)

- **Bing Webmaster Tools**: import from Google Search Console. ChatGPT search rides the Bing index,
  so this is the ChatGPT-visibility unlock. Nothing in this repo depends on it.
- **Google Search Console**: URL-inspection requests for the top pages after a big content push.
- **A real 1200x630 OG image.** `og:image` is currently the app icon, which crops badly in social
  previews. The app repo's PIL screenshot pipeline (`composite_screenshots.py`) could produce one.
- **Social proof.** Beta-tester quotes (real ones only, never invented), press logos once earned.
