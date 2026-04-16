// api/get-live-feed.js
// Fetches top 3 latest AI headlines from RSS
// Filters only AI/ML/DS/Robotics/Company relevant stories
// Caches for 3 hours in Supabase

import { createClient } from '@supabase/supabase-js'
import Parser from 'rss-parser'

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)
const parser   = new Parser({ timeout: 8000 })

const RSS_FEEDS = [
  { name: 'TechCrunch AI',          url: 'https://techcrunch.com/category/artificial-intelligence/feed/' },
  { name: 'HackerNews AI',          url: 'https://hnrss.org/frontpage?q=artificial+intelligence+OR+LLM+OR+GPT+OR+Claude+OR+Anthropic&points=50' },
  { name: 'MIT Technology Review',  url: 'https://www.technologyreview.com/feed/' },
  { name: 'Anthropic News',         url: 'https://www.anthropic.com/news/rss.xml' },
  { name: 'OpenAI Blog',            url: 'https://openai.com/blog/rss.xml' },
  { name: 'Google AI Blog',         url: 'https://blog.google/technology/ai/rss/' },
  { name: 'Hugging Face',           url: 'https://huggingface.co/blog/feed.xml' },
  { name: 'Wired AI',               url: 'https://www.wired.com/feed/category/artificial-intelligence/latest/rss/' },
  { name: 'Google DeepMind',        url: 'https://deepmind.google/blog/rss.xml' },
  { name: 'Import AI',              url: 'https://jack-clark.net/feed/' },
  { name: 'Analytics India',        url: 'https://analyticsindiamag.com/feed/' },
  { name: 'Reuters Tech',           url: 'https://feeds.reuters.com/reuters/technologyNews' },
  { name: 'Ars Technica AI',        url: 'https://arstechnica.com/tag/ai/feed/' },
  { name: 'ZDNet AI',               url: 'https://www.zdnet.com/topic/artificial-intelligence/rss.xml' },
]

// ✅ Decode HTML entities in RSS titles
function decodeEntities(str) {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#8217;/g, "'")
    .replace(/&#8216;/g, "'")
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/&#8211;/g, '–')
    .replace(/&#8212;/g, '—')
    .replace(/&apos;/g, "'")
}

// AI / ML / DS / Robotics / Company keywords
const AI_KEYWORDS = [
  'artificial intelligence', 'machine learning', 'deep learning',
  'neural network', 'llm', 'large language model', 'generative ai',
  'foundation model', 'transformer', 'diffusion', 'reinforcement learning',
  'gpt', 'chatgpt', 'gemini', 'claude', 'llama', 'mistral', 'grok',
  'copilot', 'midjourney', 'stable diffusion', 'dall-e', 'sora',
  'whisper', 'runway', 'perplexity', 'cursor', 'windsurf',
  'openai', 'anthropic', 'deepmind', 'google ai', 'meta ai',
  'microsoft ai', 'nvidia', 'hugging face', 'cohere', 'mistral ai',
  'stability ai', 'inflection', 'xai', 'groq', 'together ai',
  'replicate', 'scale ai', 'databricks',
  'data science', 'dataset', 'benchmark', 'training data',
  'fine-tuning', 'fine tuning', 'rag', 'retrieval', 'embedding',
  'vector database', 'inference', 'token', 'context window',
  'robotics', 'autonomous', 'self-driving',
  'gpu', 'tpu', 'semiconductor', 'compute',
  'ai agent', 'agentic', 'chatbot', 'voice ai',
  'computer vision', 'image generation', 'text to image',
  'multimodal', 'reasoning model', 'coding ai', 'ai safety',
  'alignment', 'hallucination', 'ai regulation',
  'ai policy', 'ai funding', 'ai startup', 'ai tool',
]

// Check if title is AI relevant
function isAIRelevant(title) {
  const t = title.toLowerCase()
  return AI_KEYWORDS.some(kw => t.includes(kw))
}

// Only stories from last 48 hours
function isRecent(pubDate) {
  if (!pubDate) return true
  return Date.now() - new Date(pubDate).getTime() < 48 * 60 * 60 * 1000
}

// Cache freshness — 3 hours
function isFresh(cachedAt) {
  return Date.now() - new Date(cachedAt).getTime() < 3 * 60 * 60 * 1000
}

async function fetchLatest() {
  const all = []

  for (const feed of RSS_FEEDS) {
    try {
      const parsed = await parser.parseURL(feed.url)
      for (const item of parsed.items.slice(0, 6)) {
        all.push({
          title:     decodeEntities((item.title || 'Untitled').trim()), // ✅ decode entities
          link:      item.link || '#',
          source:    feed.name,
          published: item.pubDate ? new Date(item.pubDate) : new Date(),
        })
      }
    } catch (e) {
      console.log(`skipped ${feed.name}: ${e.message}`)
    }
  }

  // Sort by newest first
  all.sort((a, b) => b.published - a.published)

  // Filter: AI relevant + recent
  const aiRecent = all.filter(s => isAIRelevant(s.title) && isRecent(s.published))
  const aiOnly   = all.filter(s => isAIRelevant(s.title))
  const pool = aiRecent.length >= 5 ? aiRecent : aiOnly.length >= 5 ? aiOnly : all

  console.log(`Total stories: ${all.length}, AI+recent: ${aiRecent.length}, AI only: ${aiOnly.length}`)

  // Helper: pick unique stories with optional per-source cap
  function pickStories(pool, cap = Infinity) {
    const seen         = new Set()
    const sourceCounts = {}
    const result       = []
    for (const s of pool) {
      // Dedup by first 4 words — catches same story from multiple sources
      const key         = s.title.toLowerCase().split(/\s+/).slice(0, 4).join(' ')
      const sourceCount = sourceCounts[s.source] || 0
      if (!seen.has(key) && sourceCount < cap) {
        seen.add(key)
        sourceCounts[s.source] = sourceCount + 1
        result.push(s)
      }
      if (result.length >= 5) break
    }
    return result
  }

  // First try: max 2 per source (diversity)
  // If not enough, fall back to no cap
  let unique = pickStories(pool, 2)
  if (unique.length < 5) {
    console.log(`Only ${unique.length} with cap=2, relaxing cap...`)
    unique = pickStories(pool)
  }

  console.log('Selected:', unique.map(s => s.title).join(' | '))

  // Enrich with AI-generated why + tag via Groq
  try {
    const storiesText = unique.map((s, i) =>
      `[${i+1}] TITLE: ${s.title}\nSOURCE: ${s.source}`
    ).join('\n\n')

    const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.GROQ_API_KEY}` },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: `For each of these ${unique.length} AI news headlines, write:
- why: one sharp, specific sentence (max 12 words) — concrete reason an Indian CS student should care. No generic phrases.
- tag: one of [Model, Research, Industry, Security, Policy, Tool]

Return ONLY valid JSON array, no backticks:
[{"why":"...","tag":"..."}]

Stories:
${storiesText}` }],
        temperature: 0.3,
        max_tokens: 800,
      }),
    })
    const data = await resp.json()
    const raw  = data.choices[0].message.content.trim().replace(/```json|```/g, '').trim()
    const enriched = JSON.parse(raw)
    return unique.map((s, i) => ({
      title:     s.title,
      link:      s.link,
      source:    s.source,
      published: s.published.toISOString(),
      why:       enriched[i]?.why || '',
      tag:       enriched[i]?.tag || '',
    }))
  } catch (e) {
    console.log('⚠️ Groq enrichment failed, returning without why/tag:', e.message)
  }

  return unique.map(s => ({
    title:     s.title,
    link:      s.link,
    source:    s.source,
    published: s.published.toISOString(),
  }))
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate')
  res.setHeader('Pragma', 'no-cache')

  try {
    const { data: cache } = await supabase
      .from('live_feed_cache')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)

    const cacheAge = cache && cache.length > 0
      ? (Date.now() - new Date(cache[0].created_at).getTime()) / 60000
      : null

    console.log(`Cache age: ${cacheAge !== null ? cacheAge.toFixed(1) + ' min' : 'empty'}`)

    if (cache && cache.length > 0 && isFresh(cache[0].created_at)) {
      console.log('Serving from Supabase cache')
      return res.status(200).json({ stories: cache[0].stories, cached: true })
    }

    console.log('Fetching fresh from RSS...')
    const stories = await fetchLatest()

    if (stories.length > 0) {
      await supabase.from('live_feed_cache').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      await supabase.from('live_feed_cache').insert({ stories })
      console.log('Saved to Supabase cache')
    } else {
      console.log('No AI stories found!')
    }

    return res.status(200).json({ stories, cached: false })

  } catch (err) {
    console.error('Live feed error:', err)
    return res.status(500).json({ error: err.message })
  }
}