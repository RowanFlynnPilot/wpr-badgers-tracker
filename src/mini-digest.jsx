import React from 'react'
import { createRoot } from 'react-dom/client'
import MiniDigest from './components/MiniDigest.jsx'
import { initAnalytics } from './analytics.js'
import './styles.css'
import './mini.css'

initAnalytics()
createRoot(document.getElementById('root')).render(<MiniDigest />)
