import React, { useEffect, useState } from 'react'
import { CONFIG } from '../config.js'
import { fetchGameSummary } from '../api.js'
import { THEME } from '../theme.js'
import Section from './Section.jsx'

// Fail-soft: renders nothing before the first completed game or on error.
export default function LastGame({ games }) {
  const last = games.length ? games[games.length - 1] : null
  const [summary, setSummary] = useState(null)

  useEffect(() => {
    if (!last) return
    fetchGameSummary(last.id).then(setSummary).catch(() => setSummary(null))
  }, [last && last.id])

  if (!last || !summary) return null

  const plays = summary.scoringPlays || []
  const weWereHome = last.homeAway === 'home'

  return (
    <Section
      title="Latest game"
      sub={`${last.won ? 'W' : 'L'} ${last.us.score}–${last.them.score} ${
        weWereHome || last.neutralSite ? 'vs' : 'at'
      } ${last.them.name}`}
    >
      {plays.length > 0 && (
        <div className="scoring">
          {plays.map((play) => (
            <div className="play" key={play.id}>
              {play.team && play.team.logo ? (
                <img src={play.team.logo} alt="" loading="lazy" />
              ) : (
                <span />
              )}
              <span className="play__clock">
                Q{play.period.number} {play.clock.displayValue}
              </span>
              <span>{play.text}</span>
              <span className="play__score">
                {weWereHome
                  ? `${play.homeScore}–${play.awayScore}`
                  : `${play.awayScore}–${play.homeScore}`}
              </span>
            </div>
          ))}
        </div>
      )}
      <WinProbability
        points={summary.winprobability || []}
        weWereHome={weWereHome}
      />
    </Section>
  )
}

function WinProbability({ points, weWereHome }) {
  if (points.length < 2) return null
  const width = 800
  const height = 220
  const pad = { top: 16, right: 12, bottom: 22, left: 40 }
  const plotW = width - pad.left - pad.right
  const plotH = height - pad.top - pad.bottom
  const x = (i) => pad.left + (i / (points.length - 1)) * plotW
  const y = (p) => pad.top + (1 - p) * plotH
  const ourProb = (pt) =>
    weWereHome ? pt.homeWinPercentage : 1 - pt.homeWinPercentage
  const path = points
    .map((pt, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(ourProb(pt)).toFixed(1)}`)
    .join(' ')

  return (
    <div className="chart">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={`${CONFIG.TEAM_SHORT} win probability across the game`}
        style={{ width: '100%', height: 'auto', display: 'block' }}
      >
        {[1, 0.5, 0].map((tick) => (
          <g key={tick}>
            <line
              x1={pad.left}
              x2={width - pad.right}
              y1={y(tick)}
              y2={y(tick)}
              stroke={THEME.LINE}
              strokeDasharray={tick === 0.5 ? '4 4' : undefined}
            />
            <text
              x={pad.left - 8}
              y={y(tick) + 4}
              textAnchor="end"
              fontSize="11"
              fontFamily="JetBrains Mono, monospace"
              fill={THEME.INK_SOFT}
            >
              {Math.round(tick * 100)}%
            </text>
          </g>
        ))}
        <path d={path} fill="none" stroke={THEME.CARDINAL} strokeWidth="2.5" />
        <text
          x={pad.left}
          y={height - 6}
          fontSize="11"
          fontFamily="JetBrains Mono, monospace"
          fill={THEME.INK_SOFT}
        >
          {CONFIG.TEAM_SHORT} win probability, kickoff → final
        </text>
      </svg>
    </div>
  )
}
