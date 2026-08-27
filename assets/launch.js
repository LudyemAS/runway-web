/* Runway site state toggles.
   Loaded synchronously in <head>, before first paint, so the correct state is on
   <html> before anything renders. Two INDEPENDENT toggles live here, because the two
   things they track happen on different events.

   1. Launch state, driven by a HAND-SET FLAG plus a date (the storefront going live):

     class="js-prelaunch"  shows only BEFORE launch (beta / waitlist CTAs)
     class="js-live"       shows only AFTER launch (App Store CTAs)

   2. Home-country availability, driven by a HAND-SET FLAG (a shipped build):

     class="js-preglobal"  shows only while Norway is the only home country
     class="js-global"     shows only once you can plan from other countries too

   Markup ships with <html class="is-prelaunch">, so with JavaScript off the beta
   CTAs still show and nothing looks broken. (The pre-global branch is likewise the
   no-JS default, since is-global is only ever added by this script.)

   Preview either state right now, without waiting:
     localStorage.setItem('runwayLive', '1')     // force live      ('0' = force pre-launch)
     localStorage.setItem('runwayGlobal', '1')   // force global    ('0' = force Norway-only)
     localStorage.removeItem('runwayLive')       // back to automatic
     localStorage.removeItem('runwayGlobal')
*/
(function () {
  // Two launch dates, because availability rolls out in two steps: Runway ships to the
  // NORWAY storefront only on 2026-08-25, and to every other storefront on 2026-09-15.
  // Show the App Store button to a reader who cannot actually download yet and the link
  // lands on "not available in your country or region", so each page flips on the date
  // its own readers can install. Move a date HERE, not in the pages.
  var NORWAY_LAUNCH = '2026-08-25T00:00:00+02:00';
  var WORLDWIDE_LAUNCH = '2026-09-15T00:00:00Z';

  // The Bokmal mirror under /no/ is read by people in Norway, so it flips on the Norway
  // date. English pages are read worldwide and wait for the worldwide date. The English
  // landing page is the deliberate exception (a Norway-first pitch): it sets
  // window.RUNWAY_LAUNCH before this script loads, and an explicit page override wins.
  var isNorwegian = /^\/no(\/|$)/.test(location.pathname);
  var iso = (typeof window !== 'undefined' && window.RUNWAY_LAUNCH) ||
            (isNorwegian ? NORWAY_LAUNCH : WORLDWIDE_LAUNCH);
  var LAUNCH = Date.parse(iso);

  // A date cannot know whether App Review approved the build. It only knows what day it
  // is, and on 2026-08-25 it would have flipped all 73 pages to their App Store CTAs
  // while apps.apple.com/app/id6784426559 still answered 404, sending the /no/ mirror's
  // readers (the only audience who could buy) to a dead link. So the dates above are
  // NECESSARY BUT NOT SUFFICIENT: this master gate is flipped BY HAND on the day the
  // storefront actually serves the app, exactly like GLOBAL_HOME below. Each page still
  // waits for its own storefront's date after this is true.
  //
  // Flipped 2026-08-27, verified against the storefront rather than the calendar:
  // apps.apple.com/no/app/id6784426559 resolves 200 (free, Finance), while the us, gb
  // and se storefronts still answer 404. That is exactly the two-step rollout, so /no/
  // goes live now and the English pages keep waiting for WORLDWIDE_LAUNCH.
  var LAUNCHED = true;

  var override = null;
  try { override = localStorage.getItem('runwayLive'); } catch (e) {}

  var live = override === '1' || (override !== '0' && LAUNCHED && Date.now() >= LAUNCH);

  // ── Home-country availability ────────────────────────────────────────────────────
  // Runway ships Norway-first: Norway is the only country you can PLAN FROM, even though
  // the engine already carries native (home) packs for Italy, the US, the UK, Germany,
  // France, Sweden, Canada, Australia and the Netherlands. Those stay dormant until the
  // multi-country home experience ships in an App Store build (RunwayFeatures
  // .globalCountriesEnabled, hard-off in release today).
  //
  // That is a BUILD, not a date: it has to clear App Review, so this is flipped BY HAND
  // and never by a calendar. Claiming it early would advertise a home country nobody can
  // actually pick. On the day that build is live, set this to true and push, and every
  // .js-preglobal / .js-global pair on the site flips with it.
  var GLOBAL_HOME = false;

  var globalOverride = null;
  try { globalOverride = localStorage.getItem('runwayGlobal'); } catch (e) {}

  var globalHome = globalOverride === '1' || (globalOverride !== '0' && GLOBAL_HOME);

  var root = document.documentElement;
  root.classList.remove('is-prelaunch', 'is-live');
  root.classList.add(live ? 'is-live' : 'is-prelaunch');
  root.classList.remove('is-preglobal', 'is-global');
  root.classList.add(globalHome ? 'is-global' : 'is-preglobal');
})();
