import React, { useEffect, useState } from 'react'
import { CONFIG } from '../config.js'
import { gameDate, gameTime, liveLabel } from '../format.js'

const HOUR = 3_600_000
const DAY = 24 * HOUR

function countdown(game) {
  const ms = game.date - Date.now()
  // Hours-mode only when the kickoff time is real; TBD stamps are
  // midnight Eastern placeholders, only day-accurate.
  if (game.timeValid && ms < HOUR) return 'Kickoff within the hour'
  if (game.timeValid && ms < DAY) {
    const hours = Math.round(ms / HOUR)
    return `Kickoff in ${hours} hour${hours === 1 ? '' : 's'}`
  }
  const days = Math.max(1, Math.ceil(ms / DAY))
  return `Kickoff in ${days} day${days === 1 ? '' : 's'}`
}

function venueLine(game) {
  if (!game.venue) return ''
  const place = [game.venue.name, game.venue.city].filter(Boolean).join(' · ')
  return game.neutralSite ? `${place} (neutral site)` : place
}

function TeamChip({ team }) {
  return (
    <span className="hero__team">
      {team.logo && <img src={team.logo} alt="" />}
      {team.rank && <span className="rankchip">#{team.rank}</span>}
      {team.name}
    </span>
  )
}

export default function Hero({ schedule, ourRank }) {
  // Re-render every minute so the countdown stays honest.
  const [, setTick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 60_000)
    return () => clearInterval(id)
  }, [])

  const live = schedule.find((g) => g.state === 'in')
  const next = schedule.find((g) => g.state === 'pre')
  const last = [...schedule].reverse().find((g) => g.completed)

  if (live) {
    return (
      <div className="hero">
        <div className="hero__kicker">
          <span className="hero__live">Live</span> {live.week} · {liveLabel(live)}
        </div>
        <div className="hero__matchup">
          <TeamChip team={{ ...live.us, rank: ourRank || live.us.rank }} />
          <span className="hero__score">
            {live.us.score}–{live.them.score}
          </span>
          <TeamChip team={live.them} />
        </div>
        <div className="hero__meta">
          {venueLine(live)}
          {live.tv && ` · ${live.tv}`}
        </div>
      </div>
    )
  }

  if (next) {
    const time = gameTime(next)
    const dateLine = gameDate(next, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    })
    return (
      <div className="hero">
        <div className="hero__kicker">
          {next.note ||
            `${next.week} · ${
              next.homeAway === 'home' ? 'Camp Randall' : venueLine(next)
            }`}
        </div>
        <div className="hero__count">{countdown(next)}</div>
        <div className="hero__matchup">
          <TeamChip team={{ ...next.us, rank: ourRank || next.us.rank }} />
          {/* Neutral sites read VS: "AT Notre Dame" is wrong-footed when the
              game is at Lambeau Field — the kicker line names the venue. */}
          <span className="hero__vs">
            {next.homeAway === 'home' || next.neutralSite ? 'VS' : 'AT'}
          </span>
          <TeamChip team={next.them} />
        </div>
        <div className="hero__meta">
          {dateLine}
          {time ? `, ${time} ${CONFIG.TIMEZONE_LABEL}` : ' · kickoff time TBA'}
          {next.tv && ` · ${next.tv}`}
        </div>
        {last && (
          <div className="hero__meta" style={{ marginTop: 10 }}>
            Last time out: {last.won ? 'W' : 'L'} {last.us.score}–{last.them.score}{' '}
            {last.homeAway === 'home' || last.neutralSite ? 'vs' : 'at'}{' '}
            {last.them.short}
          </div>
        )}
      </div>
    )
  }

  if (last) {
    const record = schedule.filter((g) => g.completed)
    const wins = record.filter((g) => g.won).length
    return (
      <div className="hero">
        <div className="hero__kicker">Season complete</div>
        <div className="hero__count">
          {wins}–{record.length - wins}
        </div>
        <div className="hero__meta">
          Final game: {last.won ? 'W' : 'L'} {last.us.score}–{last.them.score}{' '}
          {last.homeAway === 'home' || last.neutralSite ? 'vs' : 'at'}{' '}
          {last.them.short}
          {last.note && ` · ${last.note}`}
        </div>
      </div>
    )
  }

  return null
}
