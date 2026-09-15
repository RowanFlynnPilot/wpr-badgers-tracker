// Single source of truth. Change the team/season HERE and nowhere else.

// Ho-Chunk Gaming Wittenberg — title sponsor of WPR's Badgers football
// tracker, as on the Packers and Brewers trackers: same logo, tagline,
// directions and disclaimer; the UTM campaign names this tool.
const HO_CHUNK = {
  name: 'Ho-Chunk Gaming Wittenberg',
  text: 'Presented by Ho-Chunk Gaming Wittenberg',
  // Self-hosted — see the brand-art note on WPR_LOGO.
  // Source: cdn.wausaupilotandreview.com/wp-content/uploads/2025/07/HCG-W-Logo-1-336x115.jpg
  logo: `${import.meta.env.BASE_URL}hcg-wittenberg-logo.jpg`,
  href: 'https://www.ho-chunkgaming.com/wittenberg/?utm_source=wausaupilotandreview&utm_medium=widget&utm_campaign=badgers_tracker',
  tagline: '800+ slots · Hotel · Dining — Wittenberg, WI',
  address: 'N7198 US-45, Wittenberg, WI 54499',
  disclaimer:
    'Must be 21+. If you or someone you know has a gambling problem, call 1-800-GAMBLER.',
}

export const CONFIG = {
  SEASON: 2026,

  // ESPN identifiers
  TEAM_ID: '275', // Wisconsin Badgers
  CONFERENCE_GROUP: '5', // Big Ten
  CONFERENCE_NAME: 'Big Ten',

  TEAM_NAME: 'Wisconsin Badgers',
  TEAM_SHORT: 'Wisconsin',
  TEAM_ABBREV: 'WIS',

  // Display the ESPN-hosted team mark in the banner. A team mark on a
  // sponsored surface can imply endorsement — confirm with WPR/UW before
  // going paid, or flip to false for a colors-only header.
  USE_TEAM_LOGO: true,
  TEAM_LOGO: 'https://a.espncdn.com/i/teamlogos/ncaa/500/275.png',

  // Kickoff times shown in the newsroom's timezone.
  TIMEZONE: 'America/Chicago',
  TIMEZONE_LABEL: 'CT',

  // Trophy games, keyed by ESPN opponent id. Editorial constants — facts
  // about the rivalry, not data that can go stale. Tagged in the schedule
  // and used by the Storylines section (Minnesota is the Axe game).
  RIVALRIES: {
    135: "Paul Bunyan's Axe", // Minnesota
    2294: 'Heartland Trophy', // Iowa
    158: 'Freedom Trophy', // Nebraska
  },

  // WPR's typewriter press seal (served from public/), shown in the
  // masthead and footers — the same badge as the paper's other tools.
  WPR_BADGE: `${import.meta.env.BASE_URL}wpr-typewriter-badge.png`,

  // The paper's wordmark, home link, and tagline — the masthead set.
  // Brand and sponsor art is SELF-HOSTED from public/: WPR moved its media
  // library to cdn.wausaupilotandreview.com in Sept 2026 and old wp-content
  // URLs began 404ing (it broke the Brewers tracker's sponsor logo live).
  // Never hot-link WordPress uploads — copy the file into public/.
  // Wordmark source: wausaupilotandreview.com/wp-content/uploads/2024/04/WausauPilotandReviewLogo.png
  WPR_LOGO: `${import.meta.env.BASE_URL}wpr-wordmark.png`,
  WPR_URL: 'https://wausaupilotandreview.com',
  // WPR's tagline, verbatim across every tool — don't rewrite it.
  WPR_TAGLINE: 'Where Locals Look First For News',

  // Where the bookmark/copy-link, the minis, the digest CTA and the
  // calendar entries send readers. The dedicated tracker page doesn't exist
  // yet; until WPR publishes one, land on the live Badgers-coverage archive.
  // (The bare /wisconsin-badgers/ slug guess-redirects to a 2017 image
  // attachment — never link it.)
  CANONICAL_URL:
    'https://wausaupilotandreview.com/category/sports/wisconsin-badgers-football/',

  // Sponsorship slots. null hides a slot entirely. Each slot is an object:
  //   { text     required — the visible line ("Presented by …"); the title
  //              slot's also rides inside the "+ Calendar" entries
  //     name     sponsor name: the logo's alt text, and the stand-in if the
  //              logo ever fails (a paid slot never shows a broken image)
  //     logo     optional — self-hosted in public/ (see WPR_LOGO)
  //     href     optional — makes the slot tappable (new tab, rel=sponsored,
  //              click tracked per placement)
  //     tagline  optional — 'offer — place'; the banner lockup splits it at
  //              the em-dash, the offer large and the place small
  //     address  optional — powers the banner lockup's Directions chip
  //     disclaimer optional — footer line that travels with the sponsor }
  // The minis never link the slot: the whole mini card is already one <a>,
  // and nested links are invalid HTML.
  TITLE_SPONSOR: HO_CHUNK, // banner lockup, visible on every tab
  SCHEDULE_SPONSOR: null, // band under the Schedule tab's slate
  MINI_SPONSOR: HO_CHUNK, // "Presented by" credit on all three mini cards (+ digest.png)

  // Where sponsorship inquiries land (the WPR sales desk — Chris).
  // Used by the hosted media kit (sponsors.html) and its inquiry CTAs.
  SPONSOR_INQUIRY: 'weber.chris@wausaupilotandreview.com',

  // WPR newsroom feed (WordPress REST). CATEGORY_ID is WPR's
  // "Wisconsin Badgers Football" category (verified July 2026 via
  // /wp-json/wp/v2/categories?search=badgers); null hides the section.
  WPR_NEWS: {
    endpoint: 'https://wausaupilotandreview.com/wp-json/wp/v2/posts',
    CATEGORY_ID: 567084996,
    count: 4,
  },

  // Plausible (opt-in, cookieless). null = no external script loads at all.
  ANALYTICS: {
    domain: null, // e.g. 'rowanflynnpilot.github.io'
    src: 'https://plausible.io/js/script.js',
  },
}

// SALES DEMO MODE — append ?demo to any page (tracker or minis) and every
// OPEN sponsor slot renders a placeholder lockup, so a prospect can see the
// placement in situ before buying. Sold slots are never overridden, and
// ordinary readers (no ?demo) never see placeholders. The media kit
// (sponsors.html) links here.
if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('demo')) {
  // `demo: true` lets surfaces with lasting output opt out — ics.js skips
  // the placeholder so a prospect's "+ Calendar" download stays clean.
  const demo = { text: 'Presented by Your Business Here', demo: true }
  CONFIG.TITLE_SPONSOR = CONFIG.TITLE_SPONSOR || demo
  CONFIG.SCHEDULE_SPONSOR = CONFIG.SCHEDULE_SPONSOR || demo
  CONFIG.MINI_SPONSOR = CONFIG.MINI_SPONSOR || demo
}
