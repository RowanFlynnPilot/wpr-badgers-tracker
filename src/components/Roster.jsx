import React, { useEffect, useState } from 'react'
import { fetchRoster } from '../api.js'
import Section from './Section.jsx'

// Always available (offseason included) — the Team tab's anchor before
// stats exist.
const isWisconsin = (player) => player.hometown.endsWith(', WI')

export default function Roster() {
  const [groups, setGroups] = useState(null)

  useEffect(() => {
    fetchRoster().then(setGroups).catch(() => setGroups(null))
  }, [])

  if (!groups || !groups.length) return null

  // The local-paper angle: how much of this roster is homegrown.
  const wisconsinCount = groups
    .flatMap((g) => g.players)
    .filter(isWisconsin).length

  return (
    <Section
      title="The roster"
      sub={`Tap a group to expand.${
        wisconsinCount
          ? ` ${wisconsinCount} players on the roster call Wisconsin home — hometowns in cardinal.`
          : ''
      }`}
    >
      <div className="roster">
        {groups.map((group) => (
          <details key={group.side}>
            <summary>
              {group.side}
              <span className="count">{group.players.length} players</span>
            </summary>
            <div className="tablewrap">
              <table className="table">
                <thead>
                  <tr>
                    <th className="num">#</th>
                    <th>Player</th>
                    <th>Pos</th>
                    <th>Class</th>
                    <th>Ht / Wt</th>
                    <th>Hometown</th>
                  </tr>
                </thead>
                <tbody>
                  {group.players.map((player) => (
                    <tr key={player.id}>
                      <td className="num">{player.jersey}</td>
                      <td style={{ fontWeight: 600 }}>{player.name}</td>
                      <td>{player.position}</td>
                      <td>{player.classYear}</td>
                      <td>
                        {player.height}
                        {player.weight && ` / ${player.weight}`}
                      </td>
                      <td className={isWisconsin(player) ? 'hometown--wi' : undefined}>
                        {player.hometown}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        ))}
      </div>
    </Section>
  )
}
