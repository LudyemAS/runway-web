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
- `WORLDWIDE_LAUNCH` **2026-08-30**, every other storefront. Moved earlier from 2026-09-15: the
  date existed to buy roughly three weeks of Norway-only bake time, and the bake was empty (five
  days in: 8 downloads, 0 ratings), so waiting bought nothing it was meant to buy. Territories
  went 1 -> 175 that morning and this date now follows the store rather than the plan.

Which one a page uses is decided by **path**: anything under `/no/` is read by people in Norway
and flips on the Norway date; English pages are read worldwide and wait for the worldwide date,
so the App Store link never lands a reader on "not available in your country or region". The
English landing page (`index.html`) is the deliberate exception, and sets `window.RUNWAY_LAUNCH`
itself; an explicit page override always wins.

> **BOTH trees have now retired from this mechanism. It is dead, and the classes are gone.**
>
> - **`/no/`, 2026-08-27.** Norway launched, so those 26 pages had no second state left. 75
>   `js-prelaunch` elements deleted, `js-live` markers stripped, pages ship `<html class="is-live">`.
> - **English, 2026-08-30.** The storefronts opened in all 175 territories that morning, so the
>   same treatment applied to all 47 pages: 136 `js-prelaunch` elements deleted, 136 `js-live`
>   markers stripped, `is-live` shipped in the markup. This also removed the 41 sentences reading
>   "lands worldwide on 15 September 2026", which had become both stale and Norway-first.
>
> The point of shipping the state in the markup rather than deriving it is the no-JS reader: while
> the English pages shipped `is-prelaunch` as their default, a reader with JavaScript off was
> offered a TestFlight beta for an app already selling in their own storefront.
>
> **The transformation was not hand-written.** It was scripted, then replayed against the `/no/`
> commit (`60f8eb2`) and diffed until it reproduced that commit byte for byte, and only then run on
> the English tree. That replay is what caught the one dangerous bug in it: a stray whitespace
> tidy-up (`\s+>` -> `>`) that also rewrote `w > 0` to `w> 0` inside the calculators' inline
> JavaScript. **If this kind of sweep is ever needed again, validate it against a known-good commit
> before running it on anything live.**

**A new page needs** `<html class="is-live">` and no branch markup, in either tree. Do not hardcode
a launch date in a page, and do not reintroduce `js-prelaunch` / `js-live`.

**What is left to remove, when someone wants the tidy-up:** `launch.js` is now inert for both
toggles (it recomputes `is-live` / `is-global`, which the markup already states) and its only live
behaviour is the storefront unpin safety net described below. The `html.is-prelaunch .js-live` and
`html.is-preglobal .js-global` rules in `ludyem.css` now match nothing. Both were left in place on
2026-08-30 rather than swept out of 73 pages in the same pass as a copy rewrite; neither costs a
reader anything.

**`LAUNCHED` is a third gate, and it is the one that is true today.** A date cannot know whether
App Review approved the build, so `LAUNCHED` in `assets/launch.js` is flipped by hand once the
storefront actually serves. It was set `true` on 2026-08-27, verified by fetching the listing
rather than by trusting the calendar: `apps.apple.com/no/app/id6784426559` answered 200 while the
`us`, `gb` and `se` storefronts answered 404.

### The App Store links are pinned to Norway, and unpin themselves

> **Superseded 2026-08-30, kept because the reasoning still explains the code.** The storefronts
> are open in all 175 territories, so the pin inverted: all 146 markup hrefs are now the neutral
> `https://apps.apple.com/app/id6784426559`, and the unpin loop in `launch.js` is a deliberate no-op
> kept as a safety net. What follows describes the state up to that date.

Every App Store href in the markup was `https://apps.apple.com/**no**/app/id6784426559`, not the
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
   **Its Norway positioning was left in place on 2026-08-29, deliberately.** The tagline ("The FIRE
   planner built for Norway"), the one-line and the ~50-word description all still say Norway, while
   `index.html` and `about.html` now say "built to cross a border". That inconsistency is temporary
   and chosen: the Norwegian press push is the campaign that is actually running, and "the first FIRE
   planner built for Norway" is its hook. Re-cut those three copy blocks on the worldwide date, when
   the pitch changes audience. Only the factual `Languages` row was corrected (it said English and
   Norwegian Bokmål; the app ships en, nb, it, de and fr), because a journalist would print it.

### Home-country availability, driven by a HAND-SET FLAG

> **Also retired, 2026-08-30.** The 13 `js-preglobal` / `js-global` twins lived in
> `countries/index.html` only. They were collapsed to the global side the same way the launch pair
> was: pre-global elements deleted, `js-global` markers stripped, the global wording now simply the
> wording. `GLOBAL_HOME` in `assets/launch.js` stays `true` and is now inert.

| Class | Shows |
|---|---|
| `js-preglobal` | while Norway is the only country you can plan FROM |
| `js-global` | once other home countries are selectable |

`GLOBAL_HOME` in `assets/launch.js`, **`true` since 2026-08-29**, inert since 2026-08-30.

This one was **not** on a calendar on purpose: turning the home packs on took a build that had to
clear App Review, so a date would have advertised a home country nobody could pick yet. Runway
v1.0.3 (build 191) went `READY_FOR_SALE` on 2026-08-29 with `globalCountriesEnabled = true`, so
onboarding now asks where you live and ten native packs are selectable. Verified against the App
Store Connect API rather than the calendar, exactly as `LAUNCHED` was.

**It is independent of the storefront gates above, and stays that way.** Until `WORLDWIDE_LAUNCH`
the English pages still render pre-launch CTAs, so a US reader sees "Runway models the United
States" beside a waitlist button. That pairing is intended: the modelling claim is true today and
the CTA stays honest about where you can buy.

> **The flip alone was NOT enough, and that is the lesson to carry.** This section used to imply
> `GLOBAL_HOME` switched the site. It does not: the `js-preglobal` / `js-global` twins exist in
> **`countries/index.html` only** (13 pairs). Every other home-country claim on the site is
> ungated, so flipping the flag left four surfaces asserting Norway-only:
>
> - `countries/index.html` **`meta description` and `og:description`** ("Norway as the home
>   country, and 17 retirement destinations"). Same stateless class as the JSON-LD below, and the
>   one people actually see, in search results and link previews.
> - `countries/index.html` FAQ answer *"What does a destination pack actually include?"*, which
>   said "**Norway's** exit tax". The page subtitle got a global twin for that exact phrase; the
>   FAQ answer did not. It now reads "where your home country charges one", true in both states.
> - `index.html` roadmap card **"More home countries / Next"**, which advertised as upcoming the
>   thing that had just shipped.
> - `support.html` FAQ, in **both** the visible copy and its JSON-LD, and **`llms.txt`**, which is
>   what AI crawlers read and has no state at all.
>
> **When adding any new home-country claim, either give it a twin or write it state-free.** Prefer
> state-free: a sentence true before and after the flip cannot rot.

**Done on 2026-08-29, kept as the checklist if this ever needs redoing:**
1. `GLOBAL_HOME = true` in `assets/launch.js`.
2. The FAQ **JSON-LD** in `countries/index.html`, to the `js-global` wording. CSS hides the
   pre-global paragraph but structured data has no state, and Google wants `FAQPage` markup to
   match what a reader can see. Two answers there have twins: "Which countries does Runway model?"
   and "Will Runway add more home countries?".
3. The four ungated surfaces in the callout above.
4. The destination counts in §2, which were phrased from a Norwegian's point of view.

Preview either state without waiting, from the browser console:

```js
localStorage.setItem('runwayLive', '1')     // '0' forces pre-launch
localStorage.setItem('runwayGlobal', '1')   // '0' forces Norway-only
localStorage.removeItem('runwayLive')       // back to automatic
localStorage.removeItem('runwayGlobal')
```

---

## 1b. Positioning: what the English tree claims (2026-08-30)

The flags went global on 2026-08-29 and 08-30. The **sentences did not**, and that gap is the
thing to watch, because nothing here is enforced by tooling.

**The English tree leads with the reader's own country, not with Norway.** The frame is: most
retirement calculators assume American rules, and Runway is built the other way around, on the
rules that move your date where you live. Norway appears as one of ten home countries and as the
worked example of what "modelled natively" means. It is not the audience.

- `index.html`: hero badge "Ten home countries", the `#borders` section "Built for how money
  actually works", and no "Built for Norway" anywhere.
- Nav, all 47 pages: the item at `#borders` is **"Why Runway"**. It used to read "Norway".
- `countries/*`: titles, H1s, meta, the exit-tax table row and FAQ are written from **whichever**
  country the reader is leaving. The nine native-capable pages say "Home country and destination".
- `press.html`: tagline, one-line and long copy re-cut for a global audience. The Norwegian press
  hook that §1 deliberately preserved on 2026-08-29 is **spent**; that note is now history.
- Blog: the seven Norway posts KEEP their Norwegian depth (the slug promises it and it is what they
  rank on) and each carries a multi-country section beside it. Index cards tagged "Country rules".

**When you write a new home-country claim, write it state-free.** A sentence true for every reader
cannot rot. The four surfaces that were missed on 2026-08-29 were all missed the same way: they
stated a fact about Norway that a CSS branch could not correct.

**Facts that live in the app, not here, and have now bitten three times:**

| Fact | Source of truth | Was wrong here |
|---|---|---|
| Monte Carlo runs (500) | `RunwayFeatures.snapshotMonteCarloRuns` | said 1,000 for a month |
| Shipping languages (en, nb, it, de, fr) | `Runway/Localization/table-languages.json` `$ALL` | `llms.txt` and index JSON-LD said two |
| Native home countries (10) | `Runway/Features/Shared/CountryCatalog.swift` | UK/France/Sweden pages said destination-only |

Same shape every time: a number or a list the app owns, copied into a repo that cannot see it
change. **Re-read the source, do not trust the copy here**, including this table.

### Tax figures in blog posts

`§3` already says pack figures are probed, never hand-typed. That applies to **prose too**. The
multi-country sections added on 2026-08-30 are read off the engine packs and their manifests
(`*Pack.swift` `exitTax`, `*Pack+Manifest.swift` `wealth.*` / `caps.*` / `shielding.*`) and off
`CountryContent.statePensionClaimRange`. It matters: the manifests carry the exclusions and
elections (Canada's RRSP/RRIF/TFSA carve-out, Australia's s 104-165 election, Germany's
concentrated-holding trigger) that a summary written from memory flattens into something false.

### Two things the automated checks cannot see

1. **`.cmp .no` is `var(--faint)`, about 2.6:1 on the dark ground.** Fine as a one-word "No" marker
   beside a word that carries the meaning, NOT fine on a cell a reader has to read. 18 such cells
   were introduced and removed again on 2026-08-30. Every check in this repo was green the whole
   time; only asking the browser for the computed colour found it. **`.yes` is 11.4:1 and fine.**
   The 39 pre-existing `.no` uses are markers and were left alone.
2. **12 pages have `FAQPage` JSON-LD whose questions do not match the visible `<summary>`** (5 EN
   calculators, 5 NO calculators, 2 NO posts). The split is systematic and one-directional,
   keyword-rich in JSON and terser on the page, so it reads as deliberate and was left alone. Be
   aware Google can drop a rich result over it. Sweep for it with:

```bash
python3 - <<'EOF'
import json, re, glob
for p in sorted(glob.glob('**/*.html', recursive=True)):
    s = open(p, encoding='utf-8').read()
    qs = next((["".join(x['name']) for x in json.loads(m.group(1))['mainEntity']]
               for m in re.finditer(r'<script[^>]*ld\+json[^>]*>(.*?)</script>', s, re.S)
               if '"FAQPage"' in m.group(1)), None)
    if qs and qs != re.findall(r'<summary>(.*?)<span', s):
        print("MISMATCH", p)
EOF
```

## 2. Live counts (hand-maintained, they drift silently)

### Destination count, **reader-relative since 2026-08-29**

18 country packs ship. "17 destinations" was only ever true from a Norwegian's chair (everything
except home), and once `GLOBAL_HOME` flipped, the reader's home stopped being knowable. **The
English tree no longer states a destination count**: those places now say eighteen countries are
modelled and all of them work as destinations, which is true for every reader and cannot rot.

Two places keep 17 on purpose: the **`/no/` tree**, where the reader IS Norwegian, and the FIRE
Index study (see below). Country pages themselves are evergreen. The old sweep:

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

### Monte Carlo runs, currently **500**

> Corrected 2026-08-29. The app dropped 1,000 to 500 on 2026-07-31 (an owner call: the batch cost
> ~1.75x on every edit to steady a displayed percentage by under a point) and the landing page kept
> claiming 1,000 for a month. The iOS repo gates this number against the constant with
> `Scripts/scan-marketing-run-count.py`, but that scan cannot see this repo, so the site is the half
> nothing checks. The source of truth is `RunwayFeatures.snapshotMonteCarloRuns`.

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
