import React from 'react'
import { gameDate } from '../format.js'

// The season at a glance: one logo per game, result-tinted as the year
// unfolds. Details live in the tooltip; the Schedule tab has the full rows.
export default function SeasonStrip({ schedule }) {
  if (!schedule || schedule.length < 2) return null
  const played = schedule.filter((g) => g.completed)
  const wins = played.filter((g) => g.won).length

  return (
    <div
      className="seasonstrip"
      role="img"
      aria-label={
        // Colors carry the results for sighted readers; the label carries
        // the same game-by-game story for screen readers.
        played.length
          ? `Season at a glance: ${wins} wins, ${played.length - wins} losses, ${
              schedule.length - played.length
            } games to play. ${played
              .map(
                (g) =>
                  `${g.won ? 'W' : 'L'} ${
                    g.homeAway === 'home' || g.neutralSite ? 'vs' : 'at'
                  } ${g.them.short}`,
              )
              .join(', ')}.`
          : `Season at a glance: all ${schedule.length} games ahead`
      }
    >
      {schedule.map((game) => (
        <span
          key={game.id}
          className={`seasonstrip__game${
            game.completed ? (game.won ? ' seasonstrip__game--w' : ' seasonstrip__game--l') : ''
          }${game.state === 'in' ? ' seasonstrip__game--live' : ''}`}
          title={`${gameDate(game, { month: 'short', day: 'numeric' })} · ${
            game.homeAway === 'home' || game.neutralSite ? 'vs' : 'at'
          } ${game.them.short}${
            game.completed ? ` — ${game.won ? 'W' : 'L'} ${game.us.score}–${game.them.score}` : ''
          }`}
        >
          {game.them.logo ? (
            <img src={game.them.logo} alt="" loading="lazy" />
          ) : (
            <span className="seasonstrip__abbr">{game.them.abbrev}</span>
          )}
        </span>
      ))}
    </div>
  )
}
