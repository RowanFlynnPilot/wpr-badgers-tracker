import React, { useEffect, useRef, useState } from 'react'
import { CONFIG } from '../config.js'
import { fetchSchedule, fetchTeamInfo, fetchGameSummary } from '../api.js'
import { fetchKickoffForecast } from '../weather.js'
import { destination } from '../embed.js'
import { track } from '../analytics.js'
import { gameDate, gameTime, liveLabel } from '../format.js'
import Sponsor from './Sponsor.jsx'

const HOUR = 3_600_000
const DAY = 24 * HOUR

// Compact featured-game card for sidebars and articles, in the same family
// as the Packers and Brewers minis: split top edge (cardinal meets the
// opponent's color), a state band, countdown pill, matchup with records,
// venue + kickoff forecast, sponsor credit. The whole card is one real link
// (target="_top") into the full tracker or wherever `?to=` points. With no
// data it still renders a branded doorway rather than an empty box.
export default function MiniGame() {
  const [schedule, setSchedule] = useState(null)
  const [teams, setTeams] = useState(null) // { us, them }: record + color
  const [forecast, setForecast] = useState(null)
  const [summary, setSummary] = useState(null) // live win prob / final top performer
  const [now, setNow] = useState(Date.now()) // keeps the countdown pill honest
  const [pop, setPop] = useState(false) // score-change animation
  const prevScore = useRef(null)

  // Same cadence as every surface: 60s, skipped while hidden, refreshed on
  // return. A failed poll keeps the last good schedule.
  useEffect(() => {
    const load = () => fetchSchedule().then(setSchedule).catch(() => {})
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

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000)
    return () => clearInterval(id)
  }, [])

  const game = schedule ? featured(schedule) : null
  const gameId = game ? game.id : null
  const themId = game ? game.them.id : null
  const state = game ? game.state : null
  const live = state === 'in'
  const final = Boolean(game && game.completed)
  const timeValid = Boolean(game && game.timeValid)

  // Both teams' records (shown before kickoff) and the opponent's color for
  // the split edge — one memoized team request each.
  useEffect(() => {
    setTeams(null)
    if (!gameId) return
    let alive = true
    Promise.all([
      fetchTeamInfo(CONFIG.TEAM_ID).catch(() => null),
      fetchTeamInfo(themId).catch(() => null),
    ]).then(([us, them]) => {
      if (alive) setTeams({ us, them })
    })
    return () => {
      alive = false
    }
  }, [gameId, themId])

  // Kickoff forecast, only for a real kickoff time — a TBA game's midnight
  // placeholder would get a confident forecast for the wrong hour.
  useEffect(() => {
    setForecast(null)
    if (!gameId || state !== 'pre' || !timeValid) return
    let alive = true
    fetchKickoffForecast(game)
      .then((f) => {
        if (alive) setForecast(f)
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [gameId, state, timeValid])

  // The game summary: refetched on every poll while live (win probability
  // and down & distance move), once for a final (the top performer).
  const pollStamp = live ? schedule : null
  useEffect(() => {
    setSummary(null)
  }, [gameId, state])
  useEffect(() => {
    if (!gameId || state === 'pre') return
    let alive = true
    fetchGameSummary(gameId)
      .then((s) => {
        if (alive) setSummary(s)
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [gameId, state, pollStamp])

  // Pop the score once whenever it changes during play (never on first paint).
  const scoreKey = game && state !== 'pre' ? `${game.us.score}-${game.them.score}` : null
  useEffect(() => {
    if (scoreKey == null) {
      prevScore.current = null
      return
    }
    if (prevScore.current != null && prevScore.current !== scoreKey) {
      prevScore.current = scoreKey
      setPop(true)
      const t = setTimeout(() => setPop(false), 600)
      return () => clearTimeout(t)
    }
    prevScore.current = scoreKey
  }, [scoreKey])

  const linkProps = {
    href: destination(CONFIG.CANONICAL_URL),
    target: '_top',
    onClick: () => track('Mini Click', { widget: 'scoreboard', state: state || 'none' }),
  }
  const themColor = teams && teams.them ? teams.them.color : null
  const edge = (
    <div className="minigame__edge" aria-hidden="true">
      <span />
      <span style={themColor ? { background: themColor } : undefined} />
    </div>
  )
  const footer = (
    <div className="minigame__footer">
      <Sponsor
        slot={CONFIG.MINI_SPONSOR}
        placement="mini-scoreboard"
        className="minigame__sponsor"
        variant="credit"
        linkless
      />
      <span className="minigame__cta">Full tracker →</span>
    </div>
  )

  if (!game) {
    return (
      <a {...linkProps} className="minigame">
        {edge}
        <div className="minigame__band">Badgers tracker</div>
        <div className="minigame__body">
          <div className="minigame__doorway">The Badgers, by the numbers</div>
          <div className="minigame__line">Live scores, Big Ten standings and the AP poll</div>
          {footer}
        </div>
      </a>
    )
  }

  const { us, them } = game
  const won = final && game.won
  const pill = state === 'pre' ? countdown(game, now) : null
  // Records ride under the names before kickoff; a 0-0 opener shows none.
  const record = (info) =>
    state === 'pre' && info && info.record && info.record !== '0-0' ? info.record : null
  const pct = live ? winPct(summary, game.homeAway === 'home') : null
  const downDistance = live ? situation(summary) : null
  const star = final ? topPerformer(summary) : null
  const venue = state === 'pre' ? venueLine(game) : ''

  return (
    <a {...linkProps} className={`minigame${live ? ' is-live' : ''}`}>
      {edge}
      <div className="minigame__band">
        {live && <span className="minigame__dot" />}
        {live ? 'Current game' : final ? 'Final score' : 'Upcoming game'}
      </div>
      <div className="minigame__body">
        <div className="minigame__kicker">{kicker(game)}</div>
        {pill && <div className="minigame__pill">Kickoff in {pill}</div>}
        {won && (
          <div className="minigame__win">
            <b>W</b>Badgers win
          </div>
        )}

        <div className="minigame__matchup">
          <TeamCol
            side={us}
            name={CONFIG.TEAM_SHORT}
            record={record(teams && teams.us)}
            winner={won}
          />
          {live || final ? (
            <span className={`minigame__score${pop ? ' is-pop' : ''}`}>
              <span className={won ? 'is-winner' : undefined}>{us.score}</span>
              <span className="minigame__dash"> – </span>
              {them.score}
            </span>
          ) : (
            <span className="minigame__vs">
              {/* Neutral sites read "vs" — the venue line names the place. */}
              {game.homeAway === 'home' || game.neutralSite ? 'vs' : 'at'}
            </span>
          )}
          <TeamCol side={them} name={them.short} record={record(teams && teams.them)} />
        </div>

        {downDistance && <div className="minigame__situation">{downDistance}</div>}
        {pct != null && (
          <div className="minigame__wp">
            <div className="minigame__wpbar">
              <span style={{ width: `${pct}%` }} />
            </div>
            <div className="minigame__wplabels">
              <span className="is-us">
                {CONFIG.TEAM_ABBREV} {pct}%
              </span>
              <span>
                {them.abbrev} {100 - pct}%
              </span>
            </div>
          </div>
        )}

        {venue && <div className="minigame__line">{venue}</div>}
        {forecast && (
          <div className="minigame__line">
            Kickoff: {forecast.tempF}°F, {forecast.label} · {forecast.precipPct}% precip
          </div>
        )}

        {star && (
          <div className="minigame__star">
            <div className="minigame__eyebrow">{won ? 'Player of the game' : 'Top performer'}</div>
            <div className="minigame__starline">
              {star.headshot && (
                <img
                  src={star.headshot}
                  alt=""
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
              )}
              <span>
                <strong>{star.name}</strong> · {star.line}
              </span>
            </div>
          </div>
        )}

        {footer}
      </div>
    </a>
  )
}

function TeamCol({ side, name, record, winner }) {
  return (
    <span className="minigame__team">
      {side.logo && <img src={side.logo} alt="" />}
      <span className={`minigame__name${winner ? ' is-winner' : ''}`}>
        {side.rank && <span className="minigame__rank">#{side.rank} </span>}
        {name}
      </span>
      {record && <span className="minigame__record">{record}</span>}
    </span>
  )
}

// The featured game: live now; else a final from the last 36 hours (a
// Sunday reader still sees Saturday's result); else the next kickoff; else
// the last final. Same order as the Packers and Brewers minis.
function featured(schedule) {
  const live = schedule.find((g) => g.state === 'in')
  if (live) return live
  const last = [...schedule].reverse().find((g) => g.completed)
  if (last && Date.now() - last.date < 36 * HOUR) return last
  return schedule.find((g) => g.state === 'pre') || last || null
}

// "Sat, Sep 19 · 11:30 AM CT · Peacock · Wk 3" (uppercased in CSS), "Today"
// on game day. Dates and times go through format.js, which formats TBA
// kickoffs in Eastern and gives them no time. Spaces inside a segment are
// non-breaking, so a narrow card wraps after a "·" — never "WK" / "3".
function kicker(game) {
  if (game.state === 'in') return liveLabel(game)
  const opts = { weekday: 'short', month: 'short', day: 'numeric' }
  const day = gameDate(game, opts)
  if (game.completed) return day
  const today = new Date().toLocaleDateString('en-US', { ...opts, timeZone: CONFIG.TIMEZONE })
  const time = gameTime(game)
  return [
    day === today ? 'Today' : day,
    time ? `${time} ${CONFIG.TIMEZONE_LABEL}` : 'Time TBA',
    game.tv,
    game.note ? '' : game.week.replace(/^Week /, 'Wk '),
  ]
    .filter(Boolean)
    .map((part) => part.replace(/ /g, ' '))
    .join(' · ')
}

// "4 days" until the last 12 hours, then "3h 31m" — the hours countdown only
// for a real kickoff time. Days round up, matching the full tracker's hero.
function countdown(game, now) {
  const ms = game.date - now
  if (ms <= 0) return null
  if (ms < 12 * HOUR) {
    if (!game.timeValid) return null
    const h = Math.floor(ms / HOUR)
    const m = Math.floor((ms % HOUR) / 60_000)
    return h ? `${h}h ${m}m` : `${m}m`
  }
  const days = Math.ceil(ms / DAY)
  return `${days} day${days === 1 ? '' : 's'}`
}

function venueLine(game) {
  if (game.note) return game.note
  return game.venue ? [game.venue.name, game.venue.city].filter(Boolean).join(' · ') : ''
}

// Wisconsin's win probability (0–100) from the latest summary point.
// `homeWinPercentage` belongs to ESPN's designated home side, neutral site
// or not.
function winPct(summary, home) {
  const points = (summary && summary.winprobability) || []
  const last = points[points.length - 1]
  if (!last) return null
  const pct = Math.round(last.homeWinPercentage * 100)
  return home ? pct : 100 - pct
}

// Down & distance after the latest play ("2nd & 7 at WIS 35"). A play that
// ends without one (a score, a kickoff) shows nothing rather than a stale
// situation from an earlier play.
function situation(summary) {
  const drives = (summary && summary.drives) || {}
  const plays = [...(drives.previous || []), ...(drives.current ? [drives.current] : [])].flatMap(
    (d) => d.plays || [],
  )
  const end = (plays[plays.length - 1] || {}).end || {}
  return end.downDistanceText || end.possessionText || null
}

// Wisconsin's first listed passing, rushing or receiving leader in a final.
function topPerformer(summary) {
  const side = ((summary && summary.leaders) || []).find(
    (t) => t.team && t.team.id === CONFIG.TEAM_ID,
  )
  if (!side) return null
  for (const name of ['passingYards', 'rushingYards', 'receivingYards']) {
    const cat = (side.leaders || []).find((c) => c.name === name)
    const top = cat && cat.leaders && cat.leaders[0]
    if (top && top.athlete) {
      return {
        name: top.athlete.displayName,
        line: top.displayValue,
        headshot: top.athlete.headshot ? top.athlete.headshot.href : null,
      }
    }
  }
  return null
}
