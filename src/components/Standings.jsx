import React from 'react'
import { CONFIG } from '../config.js'
import Section from './Section.jsx'

// Renders nothing until at least one Big Ten team has played (the API
// serves an all-0–0 table during the preseason, which says nothing).
export default function Standings({ entries }) {
  if (!entries || !entries.length) return null
  if (entries.every((e) => e.overall === '0-0')) return null

  return (
    <Section
      title="Big Ten standings"
      sub="Sorted by conference winning percentage."
    >
      <table className="table">
        <thead>
          <tr>
            <th>Team</th>
            <th className="num">Conf</th>
            <th className="num">Overall</th>
            <th className="num">PF</th>
            <th className="num">PA</th>
            <th className="num">Streak</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((team) => (
            <tr
              key={team.teamId}
              className={team.teamId === CONFIG.TEAM_ID ? 'row--us' : undefined}
            >
              <td>
                <span className="table__team">
                  {team.logo && <img src={team.logo} alt="" loading="lazy" />}
                  {team.name}
                </span>
              </td>
              <td className="num">{team.conf}</td>
              <td className="num">{team.overall}</td>
              <td className="num">{team.pointsFor}</td>
              <td className="num">{team.pointsAgainst}</td>
              <td className="num">{team.streak}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Section>
  )
}
