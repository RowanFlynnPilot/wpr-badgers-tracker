// Single source of truth. Change the team/season HERE and nowhere else.
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

  // Where the bookmark/copy-link and the minis send readers.
  CANONICAL_URL: 'https://wausaupilotandreview.com/wisconsin-badgers/',

  // Sponsorship slots. null hides a slot entirely. Each slot is an object:
  //   { text: 'Presented by …',        required — the visible line
  //     href: 'https://sponsor.com',   optional — makes the slot tappable
  //                                    (new tab, rel=sponsored, click tracked)
  //     logo: 'https://…/mark.png' }   optional — small mark beside the text
  // The minis show text/logo only (never a link): the whole mini card is
  // already one <a>, and nested links are invalid HTML.
  TITLE_SPONSOR: null, // banner slot, visible on every tab (wraps below the
  // title on phones — never hidden on mobile; sponsors pay for those eyes)
  SCHEDULE_SPONSOR: null, // band under the Schedule tab's slate
  MINI_SPONSOR: null, // one quiet line at the foot of both mini cards

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
