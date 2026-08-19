# CLAUDE.md — wpr-badgers-tracker

## What this is

A live **Wisconsin Badgers football tracker** for Wausau Pilot & Review
(WPR), the sibling of `wpr-brewers-tracker`. React/Vite single-page widget
deployed to GitHub Pages and embedded on WPR via iframe. Three tabs
(**Season / Schedule / Team**), two compact single-purpose embeds
(`mini.html` featured-game card, `mini-standings.html` Big Ten table), and
a newsletter render target (`mini-digest.html`, screenshotted to
`digest.png` in CI for the email — an image bake, NOT a data cron).

## This repo deliberately breaks the standard WPR pattern

The standard WPR stack is *Python fetcher → static JSON → GitHub Actions
cron → React*. This repo — like the Brewers tracker — has **no fetcher, no
committed JSON, no cron**. The browser fetches ESPN's public APIs directly
because they are keyless, CORS-open (`access-control-allow-origin: *`), and
fast. A scraper/cache layer here would be pure overhead and would make live
game states stale. Do not "fix" this by adding one.

## Architecture

```
src/api.js        ← the ONLY file that talks to ESPN + WPR's WP REST
                    (fail-fast, memoized; wpText() renders WP HTML to text)
src/config.js     ← the ONLY place season/team/sponsor/analytics/rivalry live
src/App.jsx       ← shared fetches (schedule/standings/AP poll), tabs, chrome
src/ics.js        ← .ics builder for the "+ Calendar" download (TBD games
                    become all-day entries on the Eastern-recovered date)
src/components/   ← one component per section; fail-soft sections own
                    their empty state and render nothing on error
                    (Sponsor.jsx renders every sponsor slot — see config.js;
                    Storylines.jsx auto-writes cards from the live feeds —
                    preseason set vs season-so-far set, first 4 that resolve;
                    SeasonStrip.jsx is the 12-logo result ribbon;
                    Coverage.jsx renders WPR posts as photo cards)
mini.html         ← featured-game card (whole card = one link)
mini-standings.html ← Big Ten top 8, Wisconsin pinned if outside the cut
mini-digest.html  ← newsletter card (next / last / Big Ten); ?image=1 drops
                    the CTA for the email screenshot
scripts/          ← render-digest.mjs (CI → dist/digest.png) and
                    og-card.mjs (one-time public/og.png social card)
public/og.png     ← committed og:image; regenerate via scripts/og-card.mjs
```

Vite builds four entries (see `vite.config.js`). `base` is
`/wpr-badgers-tracker/` — change it if the repo is renamed. Sponsor slots
are objects (`{ text, href, logo }`, `null` hides) rendered only through
`Sponsor.jsx`; minis get `linkless` because each mini is already one `<a>`.

## ESPN data notes (hard-won, do not rediscover)

- **`seasontype=2` is mandatory** on the team schedule endpoint:
  `…/teams/275/schedule?season=2026&seasontype=2`. Without it ESPN serves
  the *preseason* bucket, which is empty, and the widget looks broken.
  **`seasontype=3` is the postseason** (bowls/CFP) — returns a clean empty
  list until earned; `fetchSchedule()` merges both.
- **The Big Ten Championship lives in seasontype 2** (Week 15), not 3.
  Special games — championship, bowls, CFP — carry their name in
  `competitions[0].notes[0].headline`; regular games have empty notes.
  Rule used everywhere: `note` present ⇒ special game ⇒ excluded from the
  conference record and the B1G tag, and the note is displayed as the
  game's context line.
- **`timeValid: false` means the kickoff time is unannounced** and the
  event is stamped *midnight Eastern* on the true game date (`04:00Z`).
  Formatting that in Central shifts the game to the previous day —
  `src/format.js` owns the rule (TBD dates format in Eastern, no time
  shown). ESPN's own `statusDetail` strings are Eastern too; never display
  them.
- **Standings stat names collide** (`wins` appears once per split: home,
  away, vsconf…). Look stats up by `type` (`total`, `vsconf`,
  `leaguewinpercent`, `pointsfor`, `pointsagainst`, `streak`), never by
  `name`.
- **`curatedRank.current === 99` means unranked**, not "ranked 99th".
- **The AP poll's `shortName` is `'AP Poll'`, not `'AP'`** — match on
  `name === 'AP Top 25'`. The rankings endpoint serves last season's final
  polls all offseason; `fetchAPPoll()` refuses any poll whose
  `season.year !== CONFIG.SEASON`, so the Rankings section is simply absent
  until the preseason AP poll drops (mid-August).
- **Leaders/statistics 404 until the season's first stats exist**
  (`sports.core.api.espn.com …/seasons/{yr}/types/2/teams/275/leaders`).
  Leader entries reference athletes by `$ref`; resolve in parallel and
  upgrade `http:` refs to `https:`.
- **`conferenceCompetition` is NOT present** in the team-schedule feed.
  Conference games are identified by membership: opponent id ∈ the Big Ten
  team-id set taken from the standings feed. One source of truth.
- **`neutralSite: true` exists and matters** — the 2026 opener vs Notre
  Dame is at Lambeau Field, Green Bay.
- Game summaries (`/summary?event={id}`) carry `boxscore`, `drives`,
  `scoringPlays` (team has singular `logo`), and `winprobability`
  (~150 points of `homeWinPercentage`) — the LastGame section uses the
  latter two.
- Roster items include their own `headshot.href`; don't reconstruct CDN
  URLs.
- **ESPN 403s headless browsers** (since Aug 2026): any request whose
  User-Agent *or* `sec-ch-ua` client hint says "HeadlessChrome" gets 403
  with no CORS headers. Only the digest bake is affected (readers' real
  browsers are fine) — `render-digest.mjs` masks both headers. If the bake
  ever blanks again, check this first.

## Live behavior

The app and all three mini cards (game, standings, digest) **poll every
60s** (schedule memoized 30s in `api.js`) — that's what makes live scores
and Saturday standings move without a refresh. Hidden tabs skip the poll
and refresh immediately on return (visibilitychange). A failed poll keeps
the last good data; the error screen appears only if the *first* load
fails. Don't "optimize" the polling away. The digest render fails loudly rather than
bake an empty card (it shipped one once, 2026-08-16); on render failure the
workflow re-publishes the last good digest.png.

All embeds autosize by posting `{ type: 'wpr-badgers-height' }` upward.
The height posted is `documentElement.offsetHeight`, NOT `scrollHeight` —
the root's scrollHeight floors at the viewport, so a scrollHeight-based
iframe could grow but never shrink back (Team tab → Season tab would leave
a screen of dead space). The README host snippets check `e.origin` and
`e.source` so multiple widgets on one page can't resize each other.

## Offseason behavior (launching in July is the point)

Sections self-heal as data appears; nothing needs redeploying in September:

| Section         | Preseason                         | In season          |
| --------------- | --------------------------------- | ------------------ |
| Hero            | Kickoff countdown (live minutes)  | Live score / next  |
| Season strip    | 12 logos on neutral rules         | W green / L red / live cardinal |
| Storylines      | opener · last season · homegrown · slate (+ranked tests once the poll drops) | bowl watch · the race · the Axe · road ahead (+postseason when earned) |
| Season pulse    | absent                            | record, PF/PA, streak |
| Big Ten table   | absent (all-0–0 table says nothing) | full table       |
| AP Top 25       | absent (stale-poll refusal)       | poll + "on the slate" tags |
| Schedule        | full 12-game slate (already live) | results fill in    |
| Latest game     | absent                            | scoring plays + win-prob chart |
| Leaders         | absent (endpoint 404s)            | six leader cards   |
| Roster          | **always present** — Team tab anchor | same           |
| Newsroom        | **always present** — WPR photo cards (category 567084996) | same |
| Digest image    | next-game card                    | + last game, Big Ten table |

Storylines never needs editorial upkeep: every card is computed from live
feeds (schedule, prior-season schedule, standings, poll, roster). The Axe
card even knows who holds it (last Minnesota result). Trophy games are the
one editorial constant — `CONFIG.RIVALRIES`, facts that don't go stale.

## Design

WPR widget system: Fraunces display / Public Sans body / JetBrains Mono
data, cream `#F6F2E9` page, ink borders — with **Badger cardinal `#C5050C`**
in place of Brewers navy. Signature motif: the Camp Randall bleacher
**stripe** band under the banner; home games carry a cardinal left edge in
the slate. Reduced motion respected; no fixed heights (autosize posts
`{ type: 'wpr-badgers-height' }` to the host).

## Engineering rules (same as every WPR repo)

One correct path, no fallbacks. Fail fast and loud (`api.js` throws on
non-200; fail-soft *sections* catch and render nothing — that's content
logic, not a fallback mechanism). Surgical single-responsibility changes.
No overengineering. Fix root causes.

## Dev / deploy (Windows, PowerShell 5.1)

```powershell
cd C:\Users\rpfly\Projects\wpr-badgers-tracker
npm install; npm run dev        # localhost:5173
npm run build                   # sanity check before pushing
```

Push to `main` → `.github/workflows/deploy.yml` builds and deploys Pages
(Settings → Pages → Source: **GitHub Actions**, first time only). If Windows
unzipping dropped the dotfolder, restore it from `docs/deploy.yml.txt`.

## Trademarks

Team names/marks referenced from ESPN's CDN for identification, like any
sports page. The footer carries a non-affiliation note. Before attaching a
paid sponsor to this widget, confirm comfort level (or set
`USE_TEAM_LOGO: false` for a colors-only header).

## Possible next features (deliberately not built)

- Reader pick'em (Supabase) — natural sponsor product, real build.
- Recruiting/transfer tracker — no clean public API; would need a scraper,
  which changes the architecture. Decide deliberately.
- Plausible analytics: the instrumentation (tabs, bookmark, calendar,
  coverage + mini + sponsor clicks) is already wired; it goes live the
  moment `ANALYTICS.domain` is set in config — needs a Plausible account
  first (WPR's call).

(The weekly digest PNG was on this list and is now built — ported July 2026
from `wpr-brewers-tracker`: Fri preview + Sun recap crons, Aug–Jan only.)
