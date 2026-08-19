# The Badgers, by the numbers

Live Wisconsin Badgers football tracker for
[Wausau Pilot & Review](https://wausaupilotandreview.com): kickoff countdown,
schedule with results, Big Ten standings, AP poll, team leaders, roster and
last-game win probability. Sibling of `wpr-brewers-tracker` — same
architecture, cardinal instead of navy.

Data comes straight from ESPN's public APIs **in the reader's browser** —
no scraper, no cron, no keys, nothing stored. Sections that have no data yet
(preseason) render nothing and light up on their own as the season starts.

## Develop

```powershell
npm install
npm run dev
```

## Deploy

Push to `main`. The included GitHub Actions workflow builds and publishes to
GitHub Pages. One-time setup: repo **Settings → Pages → Source: GitHub
Actions**. If the `.github` folder didn't survive an unzip on Windows,
recreate it from `docs/deploy.yml.txt`.

Live URLs once deployed:

- Main: `https://rowanflynnpilot.github.io/wpr-badgers-tracker/`
- Game card: `…/wpr-badgers-tracker/mini.html`
- Standings card: `…/wpr-badgers-tracker/mini-standings.html`
- Newsletter digest page: `…/wpr-badgers-tracker/mini-digest.html`
- Newsletter image: `…/wpr-badgers-tracker/digest.png`
- Sponsorship media kit: `…/wpr-badgers-tracker/sponsors.html` — the URL to
  hand the sales desk. Inventory status reads live from `src/config.js`
  (sold slots flip to "Sold" on their own); append `?demo` to the tracker
  or any mini to preview open placements with a placeholder lockup.

## Embed on WPR (WordPress Custom HTML block)

All three embeds auto-resize (no inner scrollbar). Every listener checks
`e.origin` and `e.source`, so multiple widgets on one page can't resize each
other and no other frame can spoof a height message. The `height` attribute
is just the placeholder before the first message arrives.

Main tracker (`allow="clipboard-write"` lets the ☆ Bookmark → Copy link
button work inside the cross-origin iframe):

```html
<iframe id="wpr-badgers" title="Wisconsin Badgers tracker"
  src="https://rowanflynnpilot.github.io/wpr-badgers-tracker/"
  style="width:100%;border:0;" height="900" loading="lazy"
  allow="clipboard-write"></iframe>
<script>
  window.addEventListener('message', function (e) {
    if (e.origin !== 'https://rowanflynnpilot.github.io') return;
    var f = document.getElementById('wpr-badgers');
    if (f && e.source === f.contentWindow && e.data && e.data.type === 'wpr-badgers-height') {
      f.style.height = e.data.height + 'px';
    }
  });
</script>
```

Mini game card (sidebar / in-article):

```html
<iframe id="wpr-badgers-mini" title="Badgers scoreboard"
  src="https://rowanflynnpilot.github.io/wpr-badgers-tracker/mini.html"
  style="width:100%;max-width:340px;border:0;" height="210" loading="lazy"></iframe>
<script>
  window.addEventListener('message', function (e) {
    if (e.origin !== 'https://rowanflynnpilot.github.io') return;
    var f = document.getElementById('wpr-badgers-mini');
    if (f && e.source === f.contentWindow && e.data && e.data.type === 'wpr-badgers-height') {
      f.style.height = e.data.height + 'px';
    }
  });
</script>
```

Mini Big Ten standings:

```html
<iframe id="wpr-badgers-standings" title="Big Ten standings"
  src="https://rowanflynnpilot.github.io/wpr-badgers-tracker/mini-standings.html"
  style="width:100%;max-width:340px;border:0;" height="330" loading="lazy"></iframe>
<script>
  window.addEventListener('message', function (e) {
    if (e.origin !== 'https://rowanflynnpilot.github.io') return;
    var f = document.getElementById('wpr-badgers-standings');
    if (f && e.source === f.contentWindow && e.data && e.data.type === 'wpr-badgers-height') {
      f.style.height = e.data.height + 'px';
    }
  });
</script>
```

Add `?to=https://…` to any mini page's `src` (game card, standings,
digest) to change where a tap lands (defaults to the canonical WPR Badgers
page in `src/config.js`).

## Newsletter image (digest.png)

Email can't run the live widget, so CI screenshots `mini-digest.html` to
`digest.png` on every deploy **and** Friday (preview) + Sunday (recap)
mornings during the season (Aug–Jan). Drop it into the newsletter as a
linked image — the image has no CTA of its own, so keep the text link:

```html
<a href="https://wausaupilotandreview.com/wisconsin-badgers/">
  <img src="https://rowanflynnpilot.github.io/wpr-badgers-tracker/digest.png"
    width="420" alt="Badgers digest: next game, last result, Big Ten standings"
    style="width:100%;max-width:420px;border:0;">
</a>
<p><a href="https://wausaupilotandreview.com/wisconsin-badgers/">Full Badgers tracker →</a></p>
```

Note the image URL is stable but email clients cache aggressively; if a
send needs a guaranteed-fresh image, append a date query
(`digest.png?d=2026-09-04`).

## Configure

Everything lives in `src/config.js`: season, sponsor slots, canonical URL,
the WPR newsroom category id (lights the "From the newsroom" section), and
the opt-in Plausible domain (no external analytics script loads unless set —
set `ANALYTICS.domain` once a Plausible account exists and tab/bookmark/
sponsor/mini-click events start counting immediately).

Sponsor slots take an object, not a string:

```js
TITLE_SPONSOR: { text: 'Presented by …', href: 'https://…', logo: 'https://…/mark.png' }
```

`text` is required; `href` makes the slot tappable (new tab,
`rel="sponsored"`, click tracked per placement); `logo` adds a small mark.
`null` hides a slot. The minis render text/logo only — the whole card is
already one link. The social share card is `public/og.png`; regenerate it
after a branding change with `node scripts/og-card.mjs`.

## A note on trademarks

Team names and marks are referenced from ESPN's CDN for identification, as
on any sports page; the widget footer carries a non-affiliation note. Before
attaching a paid sponsor, confirm comfort level or set
`USE_TEAM_LOGO: false` in `src/config.js` for a colors-only header.
