// api/get-digest.js
// Returns this week's digest for display on the website
// Caches in Supabase — Groq only runs once per 24 hours

import { createClient } from '@supabase/supabase-js'
import Parser from 'rss-parser'

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)
const parser   = new Parser()

const RSS_FEEDS = [
  { name: 'TechCrunch AI',         url: 'https://techcrunch.com/category/artificial-intelligence/feed/' },
  { name: 'HackerNews AI',         url: 'https://hnrss.org/frontpage?q=AI+OR+LLM+OR+machine+learning' },
  { name: 'MIT Technology Review', url: 'https://www.technologyreview.com/feed/' },
  { name: 'VentureBeat AI',        url: 'https://venturebeat.com/category/ai/feed/' },
  { name: 'The Verge AI',          url: 'https://www.theverge.com/rss/ai-artificial-intelligence/index.xml' },
  { name: 'Google DeepMind',       url: 'https://deepmind.google/blog/rss.xml' },
  { name: 'Wired AI',              url: 'https://www.wired.com/feed/tag/artificial-intelligence/latest/rss' },
]

function isFresh(cachedAt) {
  return Date.now() - new Date(cachedAt).getTime() < 24 * 60 * 60 * 1000
}

async function fetchStories() {
  const all = []
  for (const feed of RSS_FEEDS) {
    try {
      const parsed = await parser.parseURL(feed.url)
      for (const item of parsed.items.slice(0, 10)) {
        all.push({
          source:      feed.name,
          title:       item.title || 'Untitled',
          description: (item.contentSnippet || item.summary || '').slice(0, 800),
          link:        item.link || '',
        })
      }
    } catch (e) { console.log(`⚠️ ${feed.name}: ${e.message}`) }
  }
  return all
}

async function summarise(stories) {
  const text = stories.map((s, i) =>
    `[${i+1}] SOURCE: ${s.source}\nTITLE: ${s.title}\nDESC: ${s.description.slice(0, 300)}\nLINK: ${s.link}`
  ).join('\n\n')

  const prompt = `You are the editor of Neural Brief, a weekly AI news digest for Indian college students.

Here are ${stories.length} recent AI stories:
${text}

Pick the 15 most important, interesting, and varied stories. Cover different categories.

Also pick ONE "biggest_move" — the single most important AI story of the week.

Also pick ONE "jargon_of_week" — one AI/ML term from this week's stories explained in plain English for students.

For each of the 15 stories write:
- tag: one of [New Model, Research, Industry, Tool Drop, Policy, Opinion]
- title: clean headline, max 12 words
- summary: 2 sentences, plain English, zero jargon
- tldr: one punchy sentence starting with "-> TL;DR:"
- why_it_matters: one sentence — why should an Indian student/developer care?
- tweet: ready-to-post Twitter/LinkedIn post, punchy, end with 2-3 hashtags. Max 280 chars.
- source: source name
- link: original link exactly

Return ONLY valid JSON, no backticks:
{
  "biggest_move": {"title":"...","reason":"...","link":"..."},
  "jargon_of_week": {"term":"...","explanation":"..."},
  "stories": [{"tag":"...","title":"...","summary":"...","tldr":"...","why_it_matters":"...","tweet":"...","source":"...","link":"..."}]
}`

  const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.GROQ_API_KEY}` },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.35,
      max_tokens: 6000,
    }),
  })

  const data   = await resp.json()
  const raw    = data.choices[0].message.content.trim().replace(/```json|```/g, '').trim()
  return JSON.parse(raw)
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')

  try {
    // Check cache
    const { data: cache } = await supabase
      .from('digest_cache')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)

    if (cache && cache.length > 0 && isFresh(cache[0].created_at)) {
      console.log('📦 Serving from cache')
      return res.status(200).json({ ...cache[0].data, cached: true })
    }

    // Fetch fresh
    console.log('🔄 Fetching fresh stories...')
    const raw    = await fetchStories()
    const result = await summarise(raw)

    // Save to cache
    await supabase.from('digest_cache').insert({
      data:       result,
      created_at: new Date().toISOString(),
    })

    return res.status(200).json({ ...result, cached: false })

  } catch (err) {
    console.error('❌ get-digest error:', err)
    return res.status(500).json({ error: err.message })
  }
}