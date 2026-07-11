import React, { useState } from 'react'
import { CONFIG } from '../config.js'
import { fetchSchedule } from '../api.js'
import { buildICS } from '../ics.js'
import { track } from '../analytics.js'

// Downloads the remaining schedule as an .ics the reader can import — their
// calendar then reminds them on game day (and carries the tracker link, a
// stickiness hook). Fail-soft: on any error, nothing downloads.
export default function CalendarButton() {
  const [busy, setBusy] = useState(false)

  const onClick = async () => {
    if (busy) return
    setBusy(true)
    track('Calendar')
    try {
      const schedule = await fetchSchedule()
      const upcoming = schedule.filter((g) => !g.completed)
      if (upcoming.length) {
        const url = URL.createObjectURL(
          new Blob([buildICS(upcoming)], { type: 'text/calendar;charset=utf-8' }),
        )
        const a = document.createElement('a')
        a.href = url
        a.download = `badgers-${CONFIG.SEASON}.ics`
        document.body.appendChild(a)
        a.click()
        a.remove()
        URL.revokeObjectURL(url)
      }
    } catch {
      /* fail-soft */
    }
    setBusy(false)
  }

  return (
    <button className="bookmark__btn" onClick={onClick} disabled={busy}>
      {busy ? 'Preparing…' : '+ Calendar'}
    </button>
  )
}
