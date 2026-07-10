import React from 'react'

export default function TabBar({ tabs, active, onSelect }) {
  return (
    <nav className="tabbar" role="tablist" aria-label="Tracker sections">
      {tabs.map((tab) => (
        <button
          key={tab}
          role="tab"
          aria-selected={active === tab}
          className="tab"
          onClick={() => onSelect(tab)}
        >
          {tab}
        </button>
      ))}
    </nav>
  )
}
