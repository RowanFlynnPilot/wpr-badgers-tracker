import React from 'react'
import { track } from '../analytics.js'

// One renderer for every sponsor slot ({ text, href, logo } from config.js).
// null/textless slots render nothing. `placement` keys the analytics event
// so each surface (banner / schedule / mini) reports its own clicks.
// `linkless` forces a non-link even when href is set — the minis need it
// because the whole mini card is already an <a>.
export default function Sponsor({ slot, placement, className, linkless }) {
  if (!slot || !slot.text) return null
  const inner = (
    <>
      {slot.logo && <img src={slot.logo} alt="" loading="lazy" />}
      <span>{slot.text}</span>
    </>
  )
  if (slot.href && !linkless) {
    return (
      <a
        className={className}
        href={slot.href}
        target="_blank"
        rel="noopener sponsored"
        onClick={() => track('Sponsor Click', { placement })}
      >
        {inner}
      </a>
    )
  }
  return <span className={className}>{inner}</span>
}
