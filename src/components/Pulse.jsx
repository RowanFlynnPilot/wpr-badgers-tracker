import React from 'react'
import Section from './Section.jsx'

// Renders nothing until a game has been played.
export default function Pulse({ games, bigTenIds }) {
  if (!games.length) return null

  const wins = games.filter((g) => g.won).length
  // Conference record: Big Ten opponent AND not a special game — the B1G
  // Championship and bowls carry a `note` and don't count toward it.
  const conf = games.filter((g) => bigTenIds.has(g.them.id) && !g.note)
  const confWins = conf.filter((g) => g.won).length
  const pf = games.reduce((sum, g) => sum + g.us.score, 0)
  const pa = games.reduce((sum, g) => sum + g.them.score, 0)

  let streak = 0
  const latestWon = games[games.length - 1].won
  for (let i = games.length - 1; i >= 0 && games[i].won === latestWon; i--) streak++

  const cells = [[`${wins}–${games.length - wins}`, 'Overall']]
  // Conference record needs the Big Ten membership set (from standings);
  // if that feed hasn't resolved, skip the cell rather than show 0–0.
  if (bigTenIds.size) cells.push([`${confWins}–${conf.length - confWins}`, 'Big Ten'])
  cells.push(
    [(pf / games.length).toFixed(1), 'Points for / game'],
    [(pa / games.length).toFixed(1), 'Points against / game'],
    [`${latestWon ? 'W' : 'L'}${streak}`, 'Streak'],
  )

  return (
    <Section title="Season pulse">
      <div className="pulse">
        {cells.map(([num, label]) => (
          <div className="pulse__cell" key={label}>
            <div className="pulse__num">{num}</div>
            <div className="pulse__label">{label}</div>
          </div>
        ))}
      </div>
    </Section>
  )
}
