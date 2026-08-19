// The ONLY place that talks to ESPN. Functions fail fast (throw on non-200);
// the calling component renders its own error/empty state. No fallbacks.
import { CONFIG } from './config.js'

const SITE = 'https://site.api.espn.com/apis/site/v2/sports/football/college-football'
const SITE_V2 = 'https://site.api.espn.com/apis/v2/sports/football/college-football'
const CORE = 'https://sports.core.api.espn.com/v2/sports/football/leagues/college-football'

async function getJSON(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`ESPN ${res.status} — ${url}`)
  return res.json()
}

// Short-TTL promise memoization so tab flips are instant, not refetches.
const store = new Map()
function cached(key, ttlMs, fn) {
  const hit = store.get(key)
  if (hit && Date.now() - hit.at < ttlMs) return hit.promise
  const promise = fn().catch((err) => {
    store.delete(key)
    throw err
  })
  store.set(key, { at: Date.now(), promise })
  return promise
}

// ---------------------------------------------------------------- schedule

// CRITICAL: `seasontype=2` (regular season) must be passed explicitly —
// without it ESPN serves the empty preseason bucket. `seasontype=3`
// (postseason: conference title berths land as bowls/CFP here) returns a
// clean empty list until earned, so both are fetched and merged.
function fetchSeasonSchedule(key, season, ttlMs) {
  return cached(key, ttlMs, async () => {
    const url = (type) =>
      `${SITE}/teams/${CONFIG.TEAM_ID}/schedule?season=${season}&seasontype=${type}`
    const [regular, post] = await Promise.all([getJSON(url(2)), getJSON(url(3))])
    return [...regular.events, ...post.events]
      .map(normalizeEvent)
      .sort((a, b) => a.date - b.date)
  })
}

export function fetchSchedule() {
  return fetchSeasonSchedule('schedule', CONFIG.SEASON, 30_000)
}

// Last season's results power the "Last season" and Axe-holder storylines;
// ESPN serves prior seasons year-round. Long TTL — history doesn't move.
export function fetchPriorSchedule() {
  return fetchSeasonSchedule('prior-schedule', CONFIG.SEASON - 1, 3_600_000)
}

function normalizeEvent(event) {
  const comp = event.competitions[0]
  const us = comp.competitors.find((c) => c.team.id === CONFIG.TEAM_ID)
  const them = comp.competitors.find((c) => c.team.id !== CONFIG.TEAM_ID)
  const status = comp.status
  const rank = (c) =>
    c.curatedRank && c.curatedRank.current !== 99 ? c.curatedRank.current : null
  return {
    id: event.id,
    date: new Date(comp.date),
    // false = kickoff time unannounced; ESPN stamps these midnight Eastern
    // on the true game date. src/format.js owns the display rules.
    timeValid: comp.timeValid !== false,
    week: event.week ? event.week.text : '',
    // Postseason games carry their name here ("… Playoff Quarterfinal at
    // the Rose Bowl …"); empty for regular-season games.
    note:
      comp.notes && comp.notes.length && comp.notes[0].headline
        ? comp.notes[0].headline
        : '',
    name: event.name,
    homeAway: us.homeAway, // 'home' | 'away'
    neutralSite: Boolean(comp.neutralSite),
    venue: comp.venue
      ? {
          name: comp.venue.fullName,
          city: comp.venue.address ? comp.venue.address.city : '',
          state: comp.venue.address ? comp.venue.address.state : '',
        }
      : null,
    tv: (comp.broadcasts || [])
      .map((b) => b.media && b.media.shortName)
      .filter(Boolean)
      .join(' / '),
    state: status.type.state, // 'pre' | 'in' | 'post'
    completed: status.type.completed,
    statusDetail: status.type.shortDetail,
    period: status.period,
    displayClock: status.displayClock,
    halftime: status.type.name === 'STATUS_HALFTIME',
    us: side(us, rank(us)),
    them: side(them, rank(them)),
    won: us.winner === true,
  }
}

function side(competitor, rank) {
  return {
    id: competitor.team.id,
    name: competitor.team.displayName,
    short: competitor.team.shortDisplayName,
    abbrev: competitor.team.abbreviation,
    logo: competitor.team.logos ? competitor.team.logos[0].href : null,
    score: competitor.score ? Number(competitor.score.value) : null,
    rank,
  }
}

// --------------------------------------------------------------- standings

// Standings stat names collide (e.g. `wins` appears per split); look stats
// up by their `type`, which is unique.
export function fetchStandings() {
  return cached('standings', 60_000, async () => {
    const data = await getJSON(
      `${SITE_V2}/standings?group=${CONFIG.CONFERENCE_GROUP}&season=${CONFIG.SEASON}`,
    )
    const block = data.children && data.children.length ? data.children[0] : data
    const entries = block.standings.entries.map((entry) => {
      const byType = {}
      for (const s of entry.stats) byType[s.type] = s
      const num = (t) => (byType[t] ? Number(byType[t].value) : 0)
      const disp = (t) => (byType[t] ? byType[t].displayValue : '')
      return {
        teamId: entry.team.id,
        name: entry.team.displayName,
        short: entry.team.shortDisplayName,
        logo: entry.team.logos ? entry.team.logos[0].href : null,
        overall: disp('total'),
        conf: disp('vsconf'),
        confWinPct: num('leaguewinpercent'),
        pointsFor: num('pointsfor'),
        pointsAgainst: num('pointsagainst'),
        streak: disp('streak'),
        seed: num('playoffseed'),
      }
    })
    const pointDiff = (t) => t.pointsFor - t.pointsAgainst
    entries.sort(
      (a, b) => b.confWinPct - a.confWinPct || pointDiff(b) - pointDiff(a),
    )
    return entries
  })
}

// ---------------------------------------------------------------- rankings

// Returns the AP poll ONLY if it belongs to CONFIG.SEASON — during the
// offseason ESPN serves last season's final poll, which we never show.
export function fetchAPPoll() {
  return cached('rankings', 300_000, async () => {
    const data = await getJSON(`${SITE}/rankings`)
    const ap = (data.rankings || []).find(
      // shortName is 'AP Poll' (not 'AP') — match the stable full name.
      (r) => r.name === 'AP Top 25' && r.season && r.season.year === CONFIG.SEASON,
    )
    if (!ap) throw new Error(`No ${CONFIG.SEASON} AP poll published yet`)
    return {
      headline: ap.shortHeadline || ap.name,
      ranks: ap.ranks.map((r) => ({
        current: r.current,
        teamId: r.team.id,
        name: r.team.nickname || r.team.location,
        logo: r.team.logos ? r.team.logos[0].href : null,
        record: r.recordSummary || '',
      })),
    }
  })
}

// ----------------------------------------------------------------- leaders

const LEADER_CATEGORIES = {
  offense: [
    ['passingYards', 'Passing yards'],
    ['rushingYards', 'Rushing yards'],
    ['receivingYards', 'Receiving yards'],
  ],
  defense: [
    ['totalTackles', 'Tackles'],
    ['sacks', 'Sacks'],
    ['interceptions', 'Interceptions'],
  ],
}

// One fetch of the leaders document serves both groups — offense and
// defense are slices of the same payload.
function fetchLeadersDoc() {
  return cached('leaders-doc', 300_000, () =>
    getJSON(`${CORE}/seasons/${CONFIG.SEASON}/types/2/teams/${CONFIG.TEAM_ID}/leaders`),
  )
}

// Core-API leaders reference athletes by $ref; resolve the top leader per
// category in parallel. 404s until the season's first stats exist — callers
// fail soft.
export function fetchLeaders(group) {
  return cached(`leaders:${group}`, 300_000, async () => {
    const data = await fetchLeadersDoc()
    const wanted = LEADER_CATEGORIES[group]
    const rows = wanted
      .map(([key, label]) => {
        const cat = data.categories.find((c) => c.name === key)
        if (!cat || !cat.leaders || !cat.leaders.length) return null
        return { label, leader: cat.leaders[0] }
      })
      .filter(Boolean)
    const athletes = await Promise.all(
      rows.map((r) => getJSON(r.leader.athlete.$ref.replace(/^http:/, 'https:'))),
    )
    return rows.map((row, i) => ({
      label: row.label,
      value: row.leader.displayValue,
      athlete: {
        id: athletes[i].id,
        name: athletes[i].displayName,
        jersey: athletes[i].jersey || '',
        headshot: athletes[i].headshot ? athletes[i].headshot.href : null,
      },
    }))
  })
}

// ------------------------------------------------------------ game summary

export function fetchGameSummary(eventId) {
  return cached(`summary:${eventId}`, 60_000, () =>
    getJSON(`${SITE}/summary?event=${eventId}`),
  )
}

// ------------------------------------------------------------------ roster

export function fetchRoster() {
  return cached('roster', 3_600_000, async () => {
    const data = await getJSON(`${SITE}/teams/${CONFIG.TEAM_ID}/roster`)
    const groups = data.athletes
      .filter((g) => ['offense', 'defense', 'specialTeam'].includes(g.position))
      .map((g) => ({
        side:
          g.position === 'specialTeam'
            ? 'Special teams'
            : g.position[0].toUpperCase() + g.position.slice(1),
        players: g.items
          .map((a) => ({
            id: a.id,
            name: a.displayName,
            jersey: a.jersey || '—',
            position: a.position ? a.position.abbreviation : '',
            classYear: a.experience ? a.experience.abbreviation : '',
            height: a.displayHeight || '',
            weight: a.displayWeight || '',
            hometown:
              a.birthPlace && a.birthPlace.city
                ? `${a.birthPlace.city}${a.birthPlace.state ? ', ' + a.birthPlace.state : ''}`
                : '',
            headshot: a.headshot ? a.headshot.href : null,
          }))
          .sort((a, b) => a.name.localeCompare(b.name)),
      }))
    return groups
  })
}

// ------------------------------------------------------------ WPR newsroom

// WordPress serves titles/excerpts as HTML (entities, tags) — render to
// plain text once, here, so components never touch markup.
function wpText(html) {
  return new DOMParser().parseFromString(html || '', 'text/html').body.textContent.trim()
}

// Live read of WPR's own CMS (WordPress REST), NOT a scraper. Keyless,
// CORS-open. `_embed=wp:featuredmedia` rides along so each card gets the
// article's photo without a second request; WPR is a Newspack site, so the
// pre-cropped `medium` rendition keeps thumbnails light. Hidden entirely
// when CATEGORY_ID is null.
export function fetchWprCoverage() {
  const { endpoint, CATEGORY_ID, count } = CONFIG.WPR_NEWS
  if (!CATEGORY_ID) return Promise.reject(new Error('WPR_NEWS.CATEGORY_ID not set'))
  return cached('wpr-news', 300_000, async () => {
    const posts = await getJSON(
      `${endpoint}?categories=${CATEGORY_ID}&per_page=${count}&_embed=wp:featuredmedia&_fields=id,link,title,date,excerpt,_links,_embedded`,
    )
    return posts.map((post) => {
      const media =
        post._embedded && post._embedded['wp:featuredmedia']
          ? post._embedded['wp:featuredmedia'][0]
          : null
      const sizes = media && media.media_details ? media.media_details.sizes : null
      return {
        id: post.id,
        link: post.link,
        date: new Date(post.date),
        title: wpText(post.title ? post.title.rendered : ''),
        // WP closes auto-excerpts with a literal "[…]" — swap it for a
        // plain ellipsis so short excerpts don't end in bracket noise.
        excerpt: wpText(post.excerpt ? post.excerpt.rendered : '').replace(
          /\s*\[(?:…|\.{3})\]\s*$/,
          '…',
        ),
        image:
          sizes && sizes.medium && sizes.medium.source_url
            ? sizes.medium.source_url
            : media && media.source_url
              ? media.source_url
              : null,
        imageAlt: media && media.alt_text ? media.alt_text : '',
      }
    })
  })
}
