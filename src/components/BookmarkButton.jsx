import React, { useState } from 'react'
import { CONFIG } from '../config.js'
import { track } from '../analytics.js'

// No browser exposes a programmatic add-bookmark API, so this shows the
// OS-correct shortcut (which, in the iframe, bookmarks the host WPR page)
// plus a phone-friendly copy-link to the canonical WPR Badgers page.
export default function BookmarkButton() {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const isMac =
    typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)

  const toggle = () => {
    const next = !open
    setOpen(next)
    if (next) track('Bookmark')
  }

  const copy = async () => {
    await navigator.clipboard.writeText(CONFIG.CANONICAL_URL)
    setCopied(true)
    track('Bookmark', { action: 'copy' })
    setTimeout(() => setCopied(false), 1600)
  }

  return (
    <div className="bookmark">
      <button className="bookmark__btn" onClick={toggle} aria-expanded={open}>
        ☆ Bookmark
      </button>
      {open && (
        <div className="bookmark__pop">
          <div>
            Press <kbd>{isMac ? '⌘' : 'Ctrl'}</kbd> + <kbd>D</kbd> to bookmark
            this page, or grab the link:
          </div>
          <button className="bookmark__copy" onClick={copy}>
            {copied ? 'Copied ✓' : 'Copy link'}
          </button>
        </div>
      )}
    </div>
  )
}
