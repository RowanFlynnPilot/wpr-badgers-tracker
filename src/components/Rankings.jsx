import React from 'react'
import { CONFIG } from '../config.js'
import Section from './Section.jsx'

// Renders nothing until the CONFIG.SEASON AP poll exists (api.js refuses to
// serve a stale prior-season poll).
export default function Rankings({ poll, schedule }) {
  if (!poll) return null

  const opponentIds = new Set(schedule.map((g) => g.them.id))

  return (
    <Section
      title="AP Top 25"
      sub="Badgers in cardinal; teams on the Wisconsin schedule tagged."
    >
      <table className="table">
        <tbody>
          {poll.ranks.map((team) => (
            <tr
              key={team.teamId}
              className={team.teamId === CONFIG.TEAM_ID ? 'row--us' : undefined}
            >
              <td className="num" style={{ width: 40, textAlign: 'left' }}>
                {team.current}
              </td>
              <td>
                <span className="table__team">
                  {team.logo && <img src={team.logo} alt="" loading="lazy" />}
                  {team.name}
                  {opponentIds.has(team.teamId) && (
                    <span className="tag">on the slate</span>
                  )}
                </span>
              </td>
              <td className="num">{team.record}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Section>
  )
}
