import React, { useEffect, useState } from 'react'
import { fetchLeaders } from '../api.js'
import Section from './Section.jsx'

// Fail-soft: the leaders endpoint 404s until the season's first stats
// exist, so this renders nothing during the offseason and self-heals with
// Week 1.
export default function Leaders({ group, title }) {
  const [rows, setRows] = useState(null)

  useEffect(() => {
    fetchLeaders(group).then(setRows).catch(() => setRows(null))
  }, [group])

  if (!rows || !rows.length) return null

  return (
    <Section title={title}>
      <div className="leaders">
        {rows.map((row) => (
          <div className="leader" key={row.label}>
            {row.athlete.headshot && (
              <img src={row.athlete.headshot} alt="" loading="lazy" />
            )}
            <div>
              <div className="leader__cat">{row.label}</div>
              <div className="leader__name">
                {row.athlete.name}
                {row.athlete.jersey && ` · #${row.athlete.jersey}`}
              </div>
              <div className="leader__val">{row.value}</div>
            </div>
          </div>
        ))}
      </div>
    </Section>
  )
}
