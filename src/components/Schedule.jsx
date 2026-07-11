import React from 'react'
import { CONFIG } from '../config.js'
import { gameDate, gameTime, periodLabel } from '../format.js'
import Section from './Section.jsx'
import Sponsor from './Sponsor.jsx'

function when(game) {
  const date = gameDate(game, { month: 'short', day: 'numeric' })
  if (game.completed || game.state === 'in') return date
  const time = gameTime(game)
  return time ? `${date}\n${time}` : `${date}\nTBA`
}

export default function Schedule({ games, bigTenIds }) {
  return (
    <Section
      title={`The ${CONFIG.SEASON} slate`}
      sub="Home games carry the cardinal edge. All times Central."
    >
      <div className="slate">
        {games.map((game) => (
          <div
            key={game.id}
            className={`game${game.homeAway === 'home' ? ' game--home' : ''}`}
          >
            <div className="game__when" style={{ whiteSpace: 'pre-line' }}>
              {when(game)}
            </div>
            <div className="game__opp">
              {game.them.logo && <img src={game.them.logo} alt="" loading="lazy" />}
              <div>
                <div className="game__name">
                  {game.homeAway === 'home' ? 'vs' : 'at'}{' '}
                  {game.them.rank && (
                    <span className="rankchip">#{game.them.rank} </span>
                  )}
                  {game.them.name}
                  {bigTenIds.has(game.them.id) && !game.note && (
                    <span className="tag">B1G</span>
                  )}
                  {game.neutralSite && <span className="tag">Neutral</span>}
                </div>
                <div className="game__venue">
                  {game.note ||
                    (game.venue &&
                      [game.venue.name, game.venue.city].filter(Boolean).join(' · '))}
                </div>
              </div>
            </div>
            <div className="game__right">
              {game.completed ? (
                <span
                  className={`game__result game__result--${game.won ? 'w' : 'l'}`}
                >
                  {game.won ? 'W' : 'L'} {game.us.score}–{game.them.score}
                </span>
              ) : game.state === 'in' ? (
                <span className="game__result">
                  {game.us.score}–{game.them.score} · {periodLabel(game.period)}
                </span>
              ) : (
                game.tv
              )}
            </div>
          </div>
        ))}
      </div>
      <Sponsor
        slot={CONFIG.SCHEDULE_SPONSOR}
        placement="schedule"
        className="sponsorband"
      />
    </Section>
  )
}
