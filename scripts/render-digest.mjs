// Renders the digest mini widget to a PNG for the email newsletter.
//
// WHY THIS EXISTS (and why it is NOT the forbidden scraper): email clients
// strip <iframe> and can't run JavaScript, so the live widget can't be
// embedded in a newsletter. The only way to put fresh Badgers content in
// email is to pre-render it to an image. This script snapshots the
// already-built mini-digest.html in headless Chromium and writes
// dist/digest.png. It produces an IMAGE for email — it does NOT cache the
// widget's data or feed the widget. The tracker itself still fetches ESPN
// live in the browser, exactly as before.
//
// Run in CI after `npm run build`, against a local `vite preview` server:
//   node scripts/render-digest.mjs <url> <outPath>
import { chromium } from 'playwright'

// `image=1` tells MiniDigest this is the email screenshot, so it drops the
// "Full Badgers tracker →" affordance (dead pixels in an image — the email
// adds a real text link below it instead).
const base = process.argv[2] || 'http://127.0.0.1:4173/wpr-badgers-tracker/mini-digest.html'
const url = base + (base.includes('?') ? '&' : '?') + 'image=1'
const out = process.argv[3] || 'dist/digest.png'

const browser = await chromium.launch()
try {
  // 2x scale → a crisp PNG that still looks sharp on retina/HiDPI email
  // clients. Pin the locale + timezone to Central: the widget formats game
  // dates/times with toLocale*, and CI runners are UTC — without this a
  // 6:30 PM Central kickoff would render as "11:30 PM" (and night games
  // could roll to the next day). Readers see their own local time; for a
  // Wisconsin newsletter that's Central, so the baked image matches.
  const page = await browser.newPage({
    deviceScaleFactor: 2,
    viewport: { width: 480, height: 1000 },
    locale: 'en-US',
    timezoneId: 'America/Chicago',
  })
  await page.goto(url, { waitUntil: 'load', timeout: 60000 })

  // Wait for real data. The featured-game section exists whenever ESPN has
  // a schedule (all year); LAST GAME and BIG TEN appear once the season
  // starts. Best-effort on the full set so the offseason never fails the
  // whole render.
  await page.waitForSelector('.digest', { timeout: 60000 })
  await page
    .waitForFunction(
      () => /NEXT UP|LIVE|LAST GAME/.test(document.querySelector('.digest')?.innerText || ''),
      { timeout: 30000 },
    )
    .catch(() => console.warn('Proceeding without a game section (schedule feed slow?).'))

  // Ensure web fonts and the team logos have painted so nothing renders in
  // a fallback font or half-loaded.
  await page.waitForLoadState('networkidle')
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(800)

  await page.locator('.digest').screenshot({ path: out })
  console.log(`Wrote ${out}`)
} finally {
  await browser.close()
}
