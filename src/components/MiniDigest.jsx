import React, { useEffect, useState } from 'react'
import { CONFIG } from '../config.js'
import { fetchSchedule, fetchStandings } from '../api.js'
import { destination } from '../embed.js'
import { track } from '../analytics.js'
import { gameDate, gameTime, liveLabel } from '../format.js'
import Sponsor from './Sponsor.jsx'

const SHOW = 8

// Newsletter digest card: the featured game (live > next > last final), the
// latest result, and the Big Ten table — one at-a-glance column. CI
// screenshots this page to digest.png for the email newsletter (see
// scripts/render-digest.mjs). `?image=1` marks that screenshot run: the
// "Full tracker →" line would be dead pixels in an image, so it's dropped —
// the email carries a real text link below the image instead.
export default function MiniDigest() {
  const [schedule, setSchedule] = useState(null)
  const [standings, setStandings] = useState(null)

  useEffect(() => {
    // Poll like the other minis: recovers a slow/failed first fetch (the CI
    // screenshot run waits through one retry — see render-digest.mjs) and
    // keeps a long-lived embed current. Failures keep the last good data.
    const load = () => {
      fetchSchedule().then(setSchedule).catch(() => {})
      fetchStandings().then(setStandings).catch(() => {})
    }
    load()
    const tick = () => {
      if (!document.hidden) load()
    }
    const id = setInterval(tick, 60_000)
    document.addEventListener('visibilitychange', tick)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', tick)
    }
  }, [])

  const imageMode = new URLSearchParams(window.location.search).has('image')

  const linkProps = {
    href: destination(CONFIG.CANONICAL_URL),
    target: '_top',
    onClick: () => track('Mini Click', { widget: 'digest' }),
  }

  // Nothing yet: a branded doorway rather than an empty box.
  if (!schedule) {
    return (
      <a className="mini mini--digest digest" {...linkProps}>
        <div className="mini__kicker">Badgers digest</div>
        <div className="digest__doorway">The Badgers, by the numbers</div>
        {!imageMode && <div className="mini__cta">Full Badgers tracker →</div>}
      </a>
    )
  }

  const live = schedule.find((g) => g.state === 'in')
  const next = schedule.find((g) => g.state === 'pre')
  const last = [...schedule].reverse().find((g) => g.completed)
  const vsAt = (g, lower) =>
    g.homeAway === 'home' || g.neutralSite ? (lower ? 'vs' : 'VS') : lower ? 'at' : 'AT'

  // Baked into the email image — shows readers the card is fresh.
  const stamp = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone: CONFIG.TIMEZONE,
  })

  let featured = null
  if (live) {
    featured = (
      <div className="digest__section">
        <div className="digest__heading">Live · {liveLabel(live)}</div>
        <div className="digest__matchup">
          {live.us.logo && <img src={live.us.logo} alt="" />}
          <span>{CONFIG.TEAM_SHORT}</span>
          <span className="digest__score">
            {live.us.score}–{live.them.score}
          </span>
          <span>{live.them.short}</span>
          {live.them.logo && <img src={live.them.logo} alt="" />}
        </div>
        <div className="mini__meta">{live.tv && `Watch on ${live.tv}`}</div>
      </div>
    )
  } else if (next) {
    const time = gameTime(next)
    featured = (
      <div className="digest__section">
        <div className="digest__heading">
          Next up · {gameDate(next, { weekday: 'short', month: 'short', day: 'numeric' })}
          {time ? ` · ${time} ${CONFIG.TIMEZONE_LABEL}` : ' · time TBA'}
        </div>
        <div className="digest__matchup">
          {next.us.logo && <img src={next.us.logo} alt="" />}
          <span>{CONFIG.TEAM_SHORT}</span>
          <span className="digest__vs">{vsAt(next)}</span>
          <span>
            {next.them.rank ? `#${next.them.rank} ` : ''}
            {next.them.short}
          </span>
          {next.them.logo && <img src={next.them.logo} alt="" />}
        </div>
        <div className="mini__meta">
          {next.note ||
            (next.venue &&
              [next.venue.name, next.venue.city].filter(Boolean).join(' · '))}
          {next.tv && ` · ${next.tv}`}
        </div>
      </div>
    )
  }

  // The latest final — skipped when it's the same story as a live game day.
  const lastBlock = last && (
    <div className="digest__section">
      <div className="digest__heading">
        Last game · {gameDate(last, { weekday: 'short', month: 'short', day: 'numeric' })}
      </div>
      <div className="digest__matchup">
        <span className={`game__result game__result--${last.won ? 'w' : 'l'}`}>
          {last.won ? 'W' : 'L'} {last.us.score}–{last.them.score}
        </span>
        <span>
          {vsAt(last, true)} {last.them.short}
        </span>
      </div>
      {last.note && <div className="mini__meta">{last.note}</div>}
    </div>
  )

  // Big Ten table: top 8 with Wisconsin pinned (same cut as the standings
  // mini). Preseason all-0–0 says nothing — omit.
  let standingsBlock = null
  if (standings && standings.length && !standings.every((e) => e.overall === '0-0')) {
    let rows = standings.slice(0, SHOW)
    const usIndex = standings.findIndex((e) => e.teamId === CONFIG.TEAM_ID)
    if (usIndex >= SHOW) rows = [...standings.slice(0, SHOW - 1), standings[usIndex]]
    standingsBlock = (
      <div className="digest__section">
        <div className="digest__heading">Big Ten</div>
        <table>
          <tbody>
            {rows.map((team, i) => (
              <tr
                key={team.teamId}
                className={team.teamId === CONFIG.TEAM_ID ? 'row--us' : undefined}
              >
                <td className="num" style={{ width: 22, textAlign: 'left' }}>
                  {usIndex >= SHOW && i === rows.length - 1 ? usIndex + 1 : i + 1}
                </td>
                <td>
                  <span className="teamcell">
                    {team.logo && <img src={team.logo} alt="" loading="lazy" />}
                    {team.short}
                  </span>
                </td>
                <td className="num">{team.conf}</td>
                <td className="num">{team.overall}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <a className="mini mini--digest digest" {...linkProps}>
      <div className="mini__kicker">Badgers digest · {stamp}</div>
      {featured}
      {lastBlock}
      {standingsBlock}
      <Sponsor
        slot={CONFIG.MINI_SPONSOR}
        placement="mini-digest"
        className="mini__sponsor"
        linkless
      />
      {!imageMode && <div className="mini__cta">Full Badgers tracker →</div>}
    </a>
  )
}
