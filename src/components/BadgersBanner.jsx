import React from 'react'
import { CONFIG } from '../config.js'

export default function BadgersBanner() {
  return (
    <div className="banner">
      {CONFIG.USE_TEAM_LOGO && (
        <img className="banner__logo" src={CONFIG.TEAM_LOGO} alt="" />
      )}
      <div>
        <div className="banner__kicker">
          {CONFIG.SEASON} · {CONFIG.CONFERENCE_NAME} football
        </div>
        <h1 className="banner__title">The Badgers, by the numbers</h1>
      </div>
      {CONFIG.TITLE_SPONSOR && (
        <div className="banner__sponsor">{CONFIG.TITLE_SPONSOR}</div>
      )}
    </div>
  )
}
