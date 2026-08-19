import React from 'react'
import { CONFIG } from '../config.js'

export default function Masthead() {
  return (
    <header className="masthead">
      <div className="masthead__title">
        <a href="https://wausaupilotandreview.com" target="_top">
          <img
            className="masthead__badge"
            src={CONFIG.WPR_BADGE}
            alt=""
            onError={(e) => {
              e.currentTarget.style.display = 'none'
            }}
          />
          Wausau Pilot &amp; Review
        </a>
      </div>
      <div className="masthead__tag">Independent. Local. Nonprofit news.</div>
    </header>
  )
}
