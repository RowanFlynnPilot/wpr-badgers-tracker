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

  // Sponsorship strings. Empty string hides the slot.
  TITLE_SPONSOR: '', // e.g. 'Presented by …'
  SCHEDULE_SPONSOR: '', // band inside the Schedule tab

  // WPR newsroom feed (WordPress REST). Set CATEGORY_ID to the WP category
  // id for Badgers coverage to light the section up; null hides it.
  WPR_NEWS: {
    endpoint: 'https://wausaupilotandreview.com/wp-json/wp/v2/posts',
    CATEGORY_ID: null,
    count: 4,
  },

  // Plausible (opt-in, cookieless). null = no external script loads at all.
  ANALYTICS: {
    domain: null, // e.g. 'rowanflynnpilot.github.io'
    src: 'https://plausible.io/js/script.js',
  },
}
