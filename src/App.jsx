import React, { useEffect, useRef, useState } from 'react'
import { CONFIG } from './config.js'
import { fetchSchedule, fetchStandings, fetchAPPoll } from './api.js'
import { track } from './analytics.js'
import Masthead from './components/Masthead.jsx'
import BadgersBanner from './components/BadgersBanner.jsx'
import TabBar from './components/TabBar.jsx'
import BookmarkButton from './components/BookmarkButton.jsx'
import Hero from './components/Hero.jsx'
import Pulse from './components/Pulse.jsx'
import Standings from './components/Standings.jsx'
import Rankings from './components/Rankings.jsx'
import Schedule from './components/Schedule.jsx'
import LastGame from './components/LastGame.jsx'
import Leaders from './components/Leaders.jsx'
import Roster from './components/Roster.jsx'
import Coverage from './components/Coverage.jsx'
import { Loading, ErrorState } from './components/Status.jsx'

const TABS = ['Season', 'Schedule', 'Team']

export default function App() {
  const [tab, setTab] = useState(TABS[0])
  const [schedule, setSchedule] = useState(null)
  const [standings, setStandings] = useState(null) // null = pending, [] = unavailable
  const [apPoll, setApPoll] = useState(null)
  const [error, setError] = useState(null)
  const [updatedAt, setUpdatedAt] = useState(null)
  const hasData = useRef(false)

  useEffect(() => {
    // Poll every 60s — this is what makes live scores move without a
    // refresh. api.js memoization (30s schedule TTL) keeps it cheap.
    // A failed poll keeps the last good data; the error screen only
    // appears if the FIRST load fails (stale beats blank mid-game).
    const load = () => {
      fetchSchedule()
        .then((games) => {
          hasData.current = true
          setSchedule(games)
          setUpdatedAt(new Date())
          setError(null)
        })
        .catch((err) => {
          if (!hasData.current) setError(err)
        })
      fetchStandings()
        .then(setStandings)
        .catch(() => setStandings((prev) => prev || []))
      fetchAPPoll()
        .then(setApPoll)
        .catch(() => {})
    }
    load()
    const id = setInterval(load, 60_000)
    return () => clearInterval(id)
  }, [])

  const selectTab = (next) => {
    setTab(next)
    track('Tab', { tab: next })
  }

  if (error) return <Shell><ErrorState message={error.message} /></Shell>
  if (!schedule) return <Shell><Loading /></Shell>

  const gamesPlayed = schedule.filter((g) => g.completed)
  const bigTenIds = new Set((standings || []).map((s) => s.teamId))
  const ourRank = apPoll
    ? (apPoll.ranks.find((r) => r.teamId === CONFIG.TEAM_ID) || {}).current || null
    : null

  return (
    <Shell updatedAt={updatedAt}>
      <TabBar tabs={TABS} active={tab} onSelect={selectTab} />

      {tab === 'Season' && (
        <>
          <Hero schedule={schedule} ourRank={ourRank} />
          <Pulse games={gamesPlayed} bigTenIds={bigTenIds} />
          <Standings entries={standings} />
          <Rankings poll={apPoll} schedule={schedule} />
        </>
      )}

      {tab === 'Schedule' && (
        <>
          <Schedule games={schedule} bigTenIds={bigTenIds} />
          <LastGame games={gamesPlayed} />
        </>
      )}

      {tab === 'Team' && (
        <>
          <Leaders group="offense" title="Offensive leaders" />
          <Leaders group="defense" title="Defensive leaders" />
          <Roster />
        </>
      )}

      <Coverage />
    </Shell>
  )
}

function Shell({ updatedAt, children }) {
  return (
    <>
      <div className="wrap">
        <Masthead />
        <BadgersBanner />
      </div>
      <div className="stripe" role="presentation" />
      <div className="wrap">
        <div className="topbar">
          <span className="updated">
            {updatedAt
              ? `Live from ESPN · updated ${updatedAt.toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                  timeZone: CONFIG.TIMEZONE,
                })} ${CONFIG.TIMEZONE_LABEL}`
              : 'Live from ESPN'}
          </span>
          <BookmarkButton />
        </div>
        {children}
        <footer className="footer">
          <p>
            Data: ESPN public APIs, fetched live in your browser. Team marks are
            referenced from ESPN's CDN. Wausau Pilot &amp; Review is not
            affiliated with or endorsed by the University of Wisconsin, the Big
            Ten Conference or ESPN.
          </p>
        </footer>
      </div>
    </>
  )
}
