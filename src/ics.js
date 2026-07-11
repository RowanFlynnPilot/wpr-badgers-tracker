// Build an iCalendar (.ics) file of the remaining Badgers games — client-
// side, from the already-fetched schedule. Importable into Apple/Google/
// Outlook. TBD kickoffs (timeValid false) become all-day entries on the
// correct calendar date (the midnight-Eastern stamp rule — see format.js)
// instead of timed events at a fictional midnight.
import { CONFIG } from './config.js'

const pad = (n) => String(n).padStart(2, '0')
const utcStamp = (d) =>
  `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(
    d.getUTCHours(),
  )}${pad(d.getUTCMinutes())}00Z`
// Calendar date of a TBD game = its stamp rendered in Eastern (en-CA gives
// YYYY-MM-DD, which .ics wants without the dashes).
const easternDate = (d) =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
    .format(d)
    .replace(/-/g, '')
const esc = (s) => String(s || '').replace(/([,;\\])/g, '\\$1').replace(/\n/g, '\\n')

export function buildICS(games) {
  const stamp = utcStamp(new Date())
  // The description rides along into the reader's calendar for the season —
  // including the title sponsor, when one is set.
  const description = `Live Badgers tracker from Wausau Pilot & Review${
    CONFIG.TITLE_SPONSOR && CONFIG.TITLE_SPONSOR.text ? ` — ${CONFIG.TITLE_SPONSOR.text}` : ''
  }: ${CONFIG.CANONICAL_URL}`

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Wausau Pilot & Review//Badgers Tracker//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:Wisconsin Badgers football ${CONFIG.SEASON}`,
  ]
  for (const g of games) {
    const summary = `Badgers ${g.homeAway === 'home' || g.neutralSite ? 'vs' : 'at'} ${
      g.them.short
    }${g.note ? ` — ${g.note}` : ''}${g.timeValid ? '' : ' (time TBA)'}`
    lines.push('BEGIN:VEVENT', `UID:${g.id}@wpr-badgers-tracker`, `DTSTAMP:${stamp}`)
    if (g.timeValid) {
      lines.push(
        `DTSTART:${utcStamp(g.date)}`,
        `DTEND:${utcStamp(new Date(g.date.getTime() + 3.5 * 3_600_000))}`,
      )
    } else {
      lines.push(
        `DTSTART;VALUE=DATE:${easternDate(g.date)}`,
        `DTEND;VALUE=DATE:${easternDate(new Date(g.date.getTime() + 24 * 3_600_000))}`,
      )
    }
    lines.push(
      `SUMMARY:${esc(summary)}`,
      `LOCATION:${esc(g.venue ? [g.venue.name, g.venue.city].filter(Boolean).join(', ') : '')}`,
      `DESCRIPTION:${esc(description)}`,
    )
    if (g.timeValid)
      lines.push(
        'BEGIN:VALARM',
        'ACTION:DISPLAY',
        'DESCRIPTION:Kickoff in 30 minutes',
        'TRIGGER:-PT30M',
        'END:VALARM',
      )
    lines.push('END:VEVENT')
  }
  lines.push('END:VCALENDAR')
  return lines.join('\r\n')
}
