import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { initAnalytics } from './analytics.js'
import { initAutosize } from './autosize.js'
import './styles.css'

initAnalytics()
initAutosize()
createRoot(document.getElementById('root')).render(<App />)

// Register the service worker (PWA: installable, faster repeat loads,
// offline shell). Main app only — the minis stay service-worker-free.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {})
  })
}
