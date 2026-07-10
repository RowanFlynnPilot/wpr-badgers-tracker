import React, { useEffect, useState } from 'react'
import { fetchWprCoverage } from '../api.js'
import Section from './Section.jsx'

// Live read of WPR's WordPress REST API. Renders nothing until
// CONFIG.WPR_NEWS.CATEGORY_ID is set, and nothing on error.
export default function Coverage() {
  const [posts, setPosts] = useState(null)

  useEffect(() => {
    fetchWprCoverage().then(setPosts).catch(() => setPosts(null))
  }, [])

  if (!posts || !posts.length) return null

  return (
    <Section title="From the newsroom" sub="Recent Badgers coverage on Wausau Pilot & Review.">
      <div className="newslist">
        {posts.map((post) => (
          <a key={post.id} href={post.link} target="_top">
            <span dangerouslySetInnerHTML={{ __html: post.title.rendered }} />
          </a>
        ))}
      </div>
    </Section>
  )
}
