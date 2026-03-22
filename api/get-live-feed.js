// api/get-live-feed.js
// Fetches top 3 latest AI headlines from RSS
// No Groq needed — just raw headlines
// Caches for 6 hours in Supabase

import { createClient } from '@supabase/supabase-js'
import Parser from 'rss-parser'

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)
const parser   = new Parser()

const RSS_FEEDS = [
  { name: 'TechCrunch AI',         url: 'https://techcrunch.com/category/artificial-intelligence/feed/' },
  { name: 'HackerNews AI',         url: 'https://hnrss.org/frontpage?q=AI+OR+LLM+OR+machine+learning' },
  { name: 'The Verge AI',          url: 'https://www.theverge.com/rss/ai-artificial-intelligence/index.xml' },
  { name: 'VentureBeat AI',        url: 'https://venturebeat.com/category/ai/feed/' },
  { name: 'MIT Technology Review', url: 'https://www.technologyreview.com/feed/' },
]

function isFresh(cachedAt) {
  return Date.now() - new Date(cachedAt).getTime() < 6 * 60 * 60 * 1000 // 6 hours
}

async function fetchLatest() {
  const all = []
  for (const feed of RSS_FEEDS) {
    try {
      const parsed = await parser.parseURL(feed.url)
      for (const item of parsed.items.slice(0, 3)) {
        all.push({
          title:     item.title || 'Untitled',
          link:      item.link  || '#',
          source:    feed.name,
          published: item.pubDate ? new Date(item.pubDate) : new Date(),
        })
      }
    } catch (e) { console.log(`⚠️ ${feed.name}: ${e.message}`) }
  }

  // Sort by newest first
  all.sort((a, b) => b.published - a.published)

  // Pick top 3 unique stories
  return all.slice(0, 3).map(s => ({
    title:     s.title,
    link:      s.link,
    source:    s.source,
    published: s.published.toISOString(),
  }))
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')

  try {
    // Check cache
    const { data: cache } = await supabase
      .from('live_feed_cache')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)

    if (cache && cache.length > 0 && isFresh(cache[0].created_at)) {
      return res.status(200).json({ stories: cache[0].stories, cached: true })
    }

    // Fetch fresh
    const stories = await fetchLatest()

    // Save to cache
    await supabase.from('live_feed_cache').insert({
      stories,
      created_at: new Date().toISOString(),
    })

    return res.status(200).json({ stories, cached: false })

  } catch (err) {
    console.error('Live feed error:', err)
    return res.status(500).json({ error: err.message })
  }
}