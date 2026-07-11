// When embedded, post document height to the host on every layout change so
// the iframe always fits the active tab (no fixed height / inner scroll).
// The host listens for { type: 'wpr-badgers-height' } — snippet in README.
// No-op when standalone.
//
// offsetHeight, NOT scrollHeight: the root's scrollHeight floors at the
// viewport (= current iframe height), so the frame could grow but never
// shrink back when switching from a tall tab to a short one.
export function initAutosize() {
  if (window.parent === window) return
  const post = () =>
    window.parent.postMessage(
      { type: 'wpr-badgers-height', height: document.documentElement.offsetHeight },
      '*',
    )
  new ResizeObserver(post).observe(document.documentElement)
  window.addEventListener('load', post)
}
