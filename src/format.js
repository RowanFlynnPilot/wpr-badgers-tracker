// Single owner of game date/time display rules.
//
// ESPN convention for unannounced kickoffs: the event is stamped midnight
// EASTERN on the true game date (e.g. 2026-09-26T04:00Z) with
// `timeValid: false`. Formatting that timestamp in Central shifts the game
// to the previous day — so TBD games format their DATE in Eastern (which
// recovers the intended calendar date) and show no time at all.
import { CONFIG } from './config.js'

const EASTERN = 'America/New_York'

export function gameDate(game, options) {
  return game.date.toLocaleDateString('en-US', {
    ...options,
    timeZone: game.timeValid ? CONFIG.TIMEZONE : EASTERN,
  })
}

// Returns e.g. "6:30 PM" — or null when the kickoff time isn't announced.
export function gameTime(game) {
  if (!game.timeValid) return null
  return game.date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: CONFIG.TIMEZONE,
  })
}

// Football period label: 1–4 → Q1–Q4, 5 → OT, 6 → 2OT…
export function periodLabel(period) {
  if (period <= 4) return `Q${period}`
  return period === 5 ? 'OT' : `${period - 4}OT`
}
