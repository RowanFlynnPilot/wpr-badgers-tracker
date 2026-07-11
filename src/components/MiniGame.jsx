import React, { useEffect, useRef, useState } from 'react'
import { CONFIG } from '../config.js'
import { fetchSchedule } from '../api.js'
import { destination } from '../embed.js'
import { track } from '../analytics.js'
import { gameDate, gameTime, periodLabel } from '../format.js'
import Sponsor from './Sponsor.jsx'

// Compact featured-game card. The whole card is a real link (target="_top")
// into the full tracker or wherever `?to=` points — middle-click,
// copy-link and new-tab all behave.
export default function MiniGame() {
  const [schedule, setSchedule] = useState(null)
  const [failed, setFailed] = useState(false)
  const hasData = useRef(false)

  useEffect(() => {
    const load = () =>
      fetchSchedule()
        .then((games) => {
          hasData.current = true
          setSchedule(games)
        })
        .catch(() => {
          if (!hasData.current) setFailed(true)
        })
    load()
    const id = setInterval(load, 60_000) // live scores move
    return () => clearInterval(id)
  }, [])

  if (failed) return null
  if (!schedule) return <div className="mini">Loading…</div>

  const game =
    schedule.find((g) => g.state === 'in') ||
    schedule.find((g) => g.state === 'pre') ||
    [...schedule].reverse().find((g) => g.completed)
  if (!game) return null

  const showScore = game.completed || game.state === 'in'
  const time = gameTime(game)
  const kicker =
    game.state === 'in'
      ? `LIVE · ${periodLabel(game.period)} ${game.displayClock}`
      : game.completed
        ? `Final · ${game.week}`
        : `${game.week} · ${gameDate(game, { month: 'numeric', day: 'numeric' })}${
            time ? `, ${time} ${CONFIG.TIMEZONE_LABEL}` : ' · time TBA'
          }`

  return (
    <a
      className="mini"
      href={destination(CONFIG.CANONICAL_URL)}
      target="_top"
      onClick={() => track('Mini Click', { widget: 'scoreboard' })}
    >
      <div className="mini__kicker">Badgers football · {kicker}</div>
      <div className="mini__row">
        {game.us.logo && <img src={game.us.logo} alt="" />}
        <span className="mini__name">{CONFIG.TEAM_SHORT}</span>
        <span className="mini__score">{showScore ? game.us.score : ''}</span>
      </div>
      <div className="mini__row">
        {game.them.logo && <img src={game.them.logo} alt="" />}
        <span className="mini__name">
          {game.them.rank ? `#${game.them.rank} ` : ''}
          {game.them.short}
        </span>
        <span className="mini__score">{showScore ? game.them.score : ''}</span>
      </div>
      <div className="mini__meta">
        {game.note ||
          (game.venue &&
            [game.venue.name, game.venue.city].filter(Boolean).join(' · '))}
        {game.tv && ` · ${game.tv}`}
      </div>
      <div className="mini__cta">Full Badgers tracker →</div>
      <Sponsor
        slot={CONFIG.MINI_SPONSOR}
        placement="mini-scoreboard"
        className="mini__sponsor"
        linkless
      />
    </a>
  )
}
