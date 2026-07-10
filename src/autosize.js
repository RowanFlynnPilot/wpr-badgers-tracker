// When embedded, post document height to the host on every layout change so
// the iframe always fits the active tab (no fixed height / inner scroll).
// The host listens for { type: 'wpr-badgers-height' } — snippet in README.
// No-op when standalone.
export function initAutosize() {
  if (window.parent === window) return
  const post = () =>
    window.parent.postMessage(
      { type: 'wpr-badgers-height', height: document.documentElement.scrollHeight },
      '*',
    )
  new ResizeObserver(post).observe(document.documentElement)
  window.addEventListener('load', post)
}
