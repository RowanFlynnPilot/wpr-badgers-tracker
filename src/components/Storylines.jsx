import React, { useEffect, useState } from 'react'
import { CONFIG } from '../config.js'
import { fetchPriorSchedule, fetchRoster } from '../api.js'
import { gameDate, gameTime } from '../format.js'
import Section from './Section.jsx'

const MINNESOTA = '135' // the Axe game

// Auto-written story cards, assembled from the same live feeds as the rest
// of the widget — never hand-maintained, so never stale. Before Week 1 the
// cards preview the year; once games are played the set flips to the season
// so far. Every candidate computes fail-soft (null skips it); the first
// four that resolve render.
export default function Storylines({ schedule, standings, apPoll }) {
  const [prior, setPrior] = useState(null)
  const [roster, setRoster] = useState(null)

  useEffect(() => {
    fetchPriorSchedule().then(setPrior).catch(() => {})
    fetchRoster().then(setRoster).catch(() => {})
  }, [])

  const played = schedule.filter((g) => g.completed)
  const bigTenIds = new Set((standings || []).map((s) => s.teamId))
  const ctx = { schedule, played, standings: standings || [], bigTenIds, apPoll, prior, roster }

  const cards = (played.length ? seasonSoFar(ctx) : preseason(ctx))
    .filter(Boolean)
    .slice(0, 4)
  if (!cards.length) return null

  return (
    <Section
      title="Storylines"
      sub={played.length ? 'The season so far.' : `Going into ${CONFIG.SEASON}.`}
    >
      <div className="stories">
        {cards.map((card) => (
          <div className="story" key={card.tag}>
            <div className="story__tag">{card.tag}</div>
            <p className="story__text">{card.text}</p>
          </div>
        ))}
      </div>
    </Section>
  )
}

const shortDate = (g) => gameDate(g, { month: 'short', day: 'numeric' })
const vsAt = (g) => (g.homeAway === 'home' || g.neutralSite ? 'vs' : 'at')

function preseason(ctx) {
  return [opener(ctx), lastSeason(ctx), rankedTests(ctx), homegrown(ctx), slate(ctx)]
}

function seasonSoFar(ctx) {
  return [postseason(ctx), bowlWatch(ctx), theRace(ctx), axeWatch(ctx), roadAhead(ctx)]
}

// ------------------------------------------------------- preseason cards

function opener({ schedule }) {
  const first = schedule[0]
  if (!first || first.state !== 'pre') return null
  const time = gameTime(first)
  const where = first.neutralSite && first.venue
    ? `at ${first.venue.name} in ${first.venue.city}`
    : first.homeAway === 'home'
      ? 'at Camp Randall'
      : first.venue
        ? `at ${first.venue.name}`
        : 'on the road'
  const when = gameDate(first, { weekday: 'long', month: 'long', day: 'numeric' })
  return {
    tag: 'The opener',
    text: `Wisconsin opens against ${first.them.name} ${where} — ${when}${
      time ? `, ${time} ${CONFIG.TIMEZONE_LABEL}` : ''
    }${first.tv ? ` on ${first.tv}` : ''}.`,
  }
}

function lastSeason({ prior, bigTenIds }) {
  if (!prior) return null
  const done = prior.filter((g) => g.completed)
  if (!done.length) return null
  const wins = done.filter((g) => g.won).length
  const conf = done.filter((g) => bigTenIds.has(g.them.id) && !g.note)
  const confWins = conf.filter((g) => g.won).length
  const finale = done[done.length - 1]
  return {
    tag: 'Last season',
    text: `The ${CONFIG.SEASON - 1} Badgers went ${wins}–${done.length - wins}${
      conf.length ? ` (${confWins}–${conf.length - confWins} Big Ten)` : ''
    }, closing with ${finale.won ? 'a win' : 'a loss'} ${vsAt(finale)} ${
      finale.them.short
    }, ${finale.us.score}–${finale.them.score}${finale.note ? ` — ${finale.note}` : ''}.`,
  }
}

function rankedTests({ schedule, apPoll }) {
  if (!apPoll) return null
  const rankOf = new Map(apPoll.ranks.map((r) => [r.teamId, r.current]))
  const ranked = schedule.filter((g) => !g.completed && rankOf.has(g.them.id))
  if (!ranked.length) return null
  const list = ranked
    .slice(0, 3)
    .map((g) => `#${rankOf.get(g.them.id)} ${g.them.short} (${shortDate(g)})`)
    .join(', ')
  return {
    tag: 'Ranked tests',
    text: `${ranked.length} ranked opponent${ranked.length === 1 ? '' : 's'} ahead: ${list}${
      ranked.length > 3 ? '…' : ''
    }.`,
  }
}

function homegrown({ roster }) {
  if (!roster || !roster.length) return null
  const players = roster.flatMap((g) => g.players)
  const wi = players.filter((p) => p.hometown.endsWith(', WI')).length
  if (!wi) return null
  return {
    tag: 'Homegrown',
    text: `${wi} of the ${players.length} players on the roster grew up in Wisconsin — hometowns are lit in cardinal on the Team tab.`,
  }
}

function slate({ schedule, bigTenIds }) {
  if (!schedule.length) return null
  const home = schedule.filter((g) => g.homeAway === 'home' && !g.neutralSite).length
  const conf = schedule.filter((g) => bigTenIds.has(g.them.id) && !g.note).length
  const axe = schedule.find((g) => g.them.id === MINNESOTA && !g.completed)
  return {
    tag: 'The slate',
    text: `${home} dates at Camp Randall${conf ? `, ${conf} Big Ten games` : ''}${
      axe
        ? `, and ${CONFIG.RIVALRIES[MINNESOTA]} on the line ${shortDate(axe)} ${vsAt(axe)} ${axe.them.short}`
        : ''
    }.`,
  }
}

// ------------------------------------------------------- in-season cards

// A bowl/CFP/championship berth shows up as a scheduled note game — the
// best possible card whenever it exists.
function postseason({ schedule }) {
  const game = schedule.find((g) => g.note && !g.completed)
  if (!game) return null
  const time = gameTime(game)
  return {
    tag: 'The postseason',
    text: `${game.note}: ${vsAt(game)} ${game.them.name}, ${shortDate(game)}${
      time ? `, ${time} ${CONFIG.TIMEZONE_LABEL}` : ''
    }.`,
  }
}

function bowlWatch({ schedule, played }) {
  const regPlayed = played.filter((g) => !g.note)
  const wins = regPlayed.filter((g) => g.won).length
  const losses = regPlayed.length - wins
  const remaining = schedule.filter((g) => !g.completed && !g.note).length
  if (wins >= 6)
    return {
      tag: 'Bowl watch',
      text: `Bowl eligible: ${wins} wins banked${
        remaining ? ` with ${remaining} regular-season game${remaining === 1 ? '' : 's'} still to play` : ''
      }.`,
    }
  if (wins + remaining < 6)
    return {
      tag: 'Bowl watch',
      text: `The bowl math closed at ${wins}–${losses} — six wins was the bar.`,
    }
  const need = 6 - wins
  return {
    tag: 'Bowl watch',
    text: `At ${wins}–${losses}, Wisconsin needs ${need} more win${need === 1 ? '' : 's'} in its last ${remaining} for bowl eligibility.`,
  }
}

function theRace({ standings }) {
  if (!standings.length) return null
  const index = standings.findIndex((e) => e.teamId === CONFIG.TEAM_ID)
  if (index < 0) return null
  const us = standings[index]
  if (!us.conf || us.conf === '0-0') return null
  if (index === 0)
    return { tag: 'The race', text: `Wisconsin sits atop the Big Ten at ${us.conf} in conference play.` }
  const leader = standings[0]
  return {
    tag: 'The race',
    text: `${ordinal(index + 1)} in the Big Ten at ${us.conf}; ${leader.short} leads at ${leader.conf}.`,
  }
}

function axeWatch({ schedule, prior }) {
  const game = schedule.find((g) => g.them.id === MINNESOTA)
  if (!game) return null
  if (game.completed)
    return {
      tag: 'The Axe',
      text: game.won
        ? `${CONFIG.RIVALRIES[MINNESOTA]} belongs to Wisconsin — W ${game.us.score}–${game.them.score} ${vsAt(game)} Minnesota.`
        : `Minnesota kept a grip on ${CONFIG.RIVALRIES[MINNESOTA]} — L ${game.us.score}–${game.them.score}.`,
    }
  const priorAxe = prior
    ? [...prior].reverse().find((g) => g.them.id === MINNESOTA && g.completed)
    : null
  const holder = priorAxe
    ? priorAxe.won
      ? `Wisconsin holds ${CONFIG.RIVALRIES[MINNESOTA]}`
      : `Minnesota holds ${CONFIG.RIVALRIES[MINNESOTA]}`
    : `${CONFIG.RIVALRIES[MINNESOTA]} is on the line`
  return {
    tag: 'The Axe',
    text: `${holder} — the rivalry game lands ${shortDate(game)} ${
      game.homeAway === 'home' ? 'at Camp Randall' : 'in Minneapolis'
    }.`,
  }
}

function roadAhead({ schedule }) {
  const upcoming = schedule.filter((g) => g.state === 'pre')
  if (upcoming.length < 2) return null
  const then = upcoming
    .slice(1, 3)
    .map((g) => `${vsAt(g)} ${g.them.short} (${shortDate(g)})`)
    .join(', then ')
  return { tag: 'The road ahead', text: `After ${upcoming[0].them.short}: ${then}.` }
}

function ordinal(n) {
  const rem = n % 100
  if (rem >= 11 && rem <= 13) return `${n}th`
  return `${n}${['th', 'st', 'nd', 'rd'][Math.min(n % 10, 4) % 4] || 'th'}`
}
