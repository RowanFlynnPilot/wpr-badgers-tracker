import React, { useEffect, useRef, useState } from 'react'
import { CONFIG } from '../config.js'
import { fetchStandings } from '../api.js'
import { destination } from '../embed.js'
import { track } from '../analytics.js'
import Sponsor from './Sponsor.jsx'

const SHOW = 8

// Compact Big Ten table: top 8, with Wisconsin pinned if outside the cut.
// Preseason (all 0–0) shows a single invitation line instead of a dead table.
export default function MiniStandings() {
  const [entries, setEntries] = useState(null)
  const [failed, setFailed] = useState(false)
  const hasData = useRef(false)

  useEffect(() => {
    // Poll like the game card: records shift as Saturday finals land, and
    // this widget sits on long-lived article pages. A failed refresh keeps
    // the last good table.
    const load = () =>
      fetchStandings()
        .then((rows) => {
          hasData.current = true
          setEntries(rows)
        })
        .catch(() => {
          if (!hasData.current) setFailed(true)
        })
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

  if (failed) return null
  if (!entries) return <div className="mini">Loading…</div>

  const href = destination(CONFIG.CANONICAL_URL)

  const preseason = entries.every((e) => e.overall === '0-0')
  let rows = entries.slice(0, SHOW)
  const usIndex = entries.findIndex((e) => e.teamId === CONFIG.TEAM_ID)
  if (usIndex >= SHOW) rows = [...entries.slice(0, SHOW - 1), entries[usIndex]]

  return (
    <a
      className="mini"
      href={href}
      target="_top"
      onClick={() => track('Mini Click', { widget: 'standings' })}
    >
      <div className="mini__kicker">Big Ten standings</div>
      {preseason ? (
        <div className="mini__meta">
          Standings return with Week 1. See the full {CONFIG.SEASON} Badgers
          slate on the tracker.
        </div>
      ) : (
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
      )}
      <div className="mini__cta">Full Badgers tracker →</div>
      <Sponsor
        slot={CONFIG.MINI_SPONSOR}
        placement="mini-standings"
        className="mini__sponsor"
        linkless
      />
    </a>
  )
}
