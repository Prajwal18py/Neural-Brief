// api/get-live-feed.js
// Fetches top 3 latest AI headlines from RSS
// Filters only AI/ML/DS/Robotics/Company relevant stories
// Caches for 3 hours in Supabase

import { createClient } from '@supabase/supabase-js'
import Parser from 'rss-parser'

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)
const parser   = new Parser({ timeout: 8000 })

const RSS_FEEDS = [
  { name: 'TechCrunch AI',         url: 'https://techcrunch.com/category/artificial-intelligence/feed/' },
  { name: 'The Verge AI',          url: 'https://www.theverge.com/rss/ai-artificial-intelligence/index.xml' },
  { name: 'VentureBeat AI',        url: 'https://venturebeat.com/category/ai/feed/' },
  { name: 'HackerNews AI',         url: 'https://hnrss.org/frontpage?q=artificial+intelligence+OR+LLM+OR+GPT+OR+machine+learning&points=50' },
  { name: 'MIT Technology Review', url: 'https://www.technologyreview.com/feed/' },
  { name: 'Anthropic Blog',        url: 'https://www.anthropic.com/rss.xml' },
  { name: 'Google AI Blog',        url: 'https://blog.google/technology/ai/rss/' },
  { name: 'Hugging Face',          url: 'https://huggingface.co/blog/feed.xml' },
  { name: 'The Batch',             url: 'https://www.deeplearning.ai/the-batch/feed/' },
  { name: 'Wired AI',              url: 'https://www.wired.com/feed/tag/ai/latest/rss' },
  { name: 'Google DeepMind',       url: 'https://deepmind.google/blog/rss.xml' },
]

// AI / ML / DS / Robotics / Company keywords
const AI_KEYWORDS = [
  // Core AI/ML
  'ai', 'artificial intelligence', 'machine learning', 'deep learning',
  'neural network', 'llm', 'large language model', 'generative ai',
  'foundation model', 'transformer', 'diffusion', 'reinforcement learning',

  // Models and products
  'gpt', 'chatgpt', 'gemini', 'claude', 'llama', 'mistral', 'grok',
  'copilot', 'midjourney', 'stable diffusion', 'dall-e', 'sora',
  'whisper', 'runway', 'perplexity', 'cursor', 'windsurf',

  // Companies
  'openai', 'anthropic', 'deepmind', 'google ai', 'meta ai',
  'microsoft ai', 'nvidia', 'hugging face', 'cohere', 'mistral ai',
  'stability ai', 'inflection', 'xai', 'groq', 'together ai',
  'replicate', 'scale ai', 'databricks',

  // Data Science
  'data science', 'dataset', 'benchmark', 'training data',
  'fine-tuning', 'fine tuning', 'rag', 'retrieval', 'embedding',
  'vector database', 'inference', 'token', 'context window',

  // Robotics and hardware
  'robotics', 'robot', 'autonomous', 'self-driving',
  'gpu', 'tpu', 'semiconductor', 'compute', 'inference chip',

  // Applications
  'ai agent', 'agentic', 'chatbot', 'voice ai',
  'computer vision', 'image generation', 'text to image',
  'multimodal', 'reasoning model', 'coding ai', 'ai safety',
  'alignment', 'hallucination', 'prompt', 'ai regulation',
  'ai policy', 'ai funding', 'ai startup', 'ai tool',
]

// Check if title is AI relevant
function isAIRelevant(title) {
  const t = ' ' + title.toLowerCase() + ' '
  return AI_KEYWORDS.some(kw => t.includes(' ' + kw + ' ') || t.includes(' ' + kw + ',') || t.includes(' ' + kw + ':'))
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
          title:     (item.title || 'Untitled').trim(),
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

  // Filter: AI relevant + recent (last 48h)
  const aiRecent = all.filter(s => isAIRelevant(s.title) && isRecent(s.published))

  // Fallback: AI relevant only if not enough recent
  const aiOnly = all.filter(s => isAIRelevant(s.title))

  // Pick best pool
  const pool = aiRecent.length >= 3 ? aiRecent : aiOnly.length >= 3 ? aiOnly : all

  // Deduplicate by similar title
  const seen = new Set()
  const unique = []
  for (const s of pool) {
    const key = s.title.toLowerCase().slice(0, 50)
    if (!seen.has(key)) {
      seen.add(key)
      unique.push(s)
    }
    if (unique.length >= 3) break
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

    if (stories.length > 0) {
      // Clear old cache + insert fresh
      await supabase.from('live_feed_cache').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      await supabase.from('live_feed_cache').insert({ stories })
    }

    return res.status(200).json({ stories, cached: false })

  } catch (err) {
    console.error('Live feed error:', err)
    return res.status(500).json({ error: err.message })
  }
}