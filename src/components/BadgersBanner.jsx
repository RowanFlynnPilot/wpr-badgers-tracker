import React from 'react'
import { CONFIG } from '../config.js'
import Sponsor from './Sponsor.jsx'

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
      <Sponsor
        slot={CONFIG.TITLE_SPONSOR}
        placement="banner"
        className="banner__sponsor"
      />
    </div>
  )
}
