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

## Embed on WPR (WordPress Custom HTML block)

Main tracker — auto-resizing, no inner scrollbar:

```html
<iframe id="wpr-badgers" title="Wisconsin Badgers tracker"
  src="https://rowanflynnpilot.github.io/wpr-badgers-tracker/"
  style="width:100%;border:0;" height="900" loading="lazy"></iframe>
<script>
  window.addEventListener('message', function (e) {
    if (e.data && e.data.type === 'wpr-badgers-height') {
      document.getElementById('wpr-badgers').style.height = e.data.height + 'px';
    }
  });
</script>
```

Mini game card (sidebar / in-article):

```html
<iframe title="Badgers scoreboard"
  src="https://rowanflynnpilot.github.io/wpr-badgers-tracker/mini.html"
  style="width:100%;max-width:340px;border:0;" height="210" loading="lazy"></iframe>
```

Mini Big Ten standings:

```html
<iframe title="Big Ten standings"
  src="https://rowanflynnpilot.github.io/wpr-badgers-tracker/mini-standings.html"
  style="width:100%;max-width:340px;border:0;" height="330" loading="lazy"></iframe>
```

Add `?to=https://…` to either mini's `src` to change where a tap lands
(defaults to the canonical WPR Badgers page in `src/config.js`).

## Configure

Everything lives in `src/config.js`: season, sponsor lines, canonical URL,
the WPR newsroom category id (lights up a "From the newsroom" section), and
the opt-in Plausible domain (no external analytics script loads unless set).

## A note on trademarks

Team names and marks are referenced from ESPN's CDN for identification, as
on any sports page; the widget footer carries a non-affiliation note. Before
attaching a paid sponsor, confirm comfort level or set
`USE_TEAM_LOGO: false` in `src/config.js` for a colors-only header.
