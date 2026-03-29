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
  { name: 'Google DeepMind',       url: 'https://deepmind.google/blog/rss.xml' },
  { name: 'Anthropic News',        url: 'https://www.anthropic.com/news/rss.xml' },
  { name: 'OpenAI Blog',           url: 'https://openai.com/blog/rss.xml' },
  { name: 'Google AI Blog',        url: 'https://blog.google/technology/ai/rss/' },
  { name: 'Hugging Face',          url: 'https://huggingface.co/blog/feed.xml' },
  { name: 'The Batch',             url: 'https://www.deeplearning.ai/the-batch/tag/the-batch/feed/' },
  { name: 'Wired AI',              url: 'https://www.wired.com/feed/category/artificial-intelligence/latest/rss/' },
  { name: 'Import AI',             url: 'https://jack-clark.net/feed/' },
  { name: 'Analytics India',       url: 'https://analyticsindiamag.com/feed/' },
  { name: 'Reuters Tech',          url: 'https://feeds.reuters.com/reuters/technologyNews' },
  { name: 'Ars Technica AI',       url: 'https://arstechnica.com/tag/ai/feed/' },
  { name: 'ZDNet AI',              url: 'https://www.zdnet.com/topic/artificial-intelligence/rss.xml' },
  { name: 'Mashable Tech',         url: 'https://mashable.com/feeds/rss/tech' },
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
          description: (item.contentSnippet || item.summary || '').slice(0, 150), // ✅ trimmed from 800 → 150
          link:        item.link || '',
        })
      }
    } catch (e) { console.log(`⚠️ ${feed.name}: ${e.message}`) }
  }
  return all
}

// ── Fetch GitHub Trending AI/ML repos ────────────────────
async function fetchGithubTrending() {
  try {
    const res  = await fetch('https://github.com/trending/python?since=weekly&spoken_language_code=en', {
      headers: { 'Accept': 'text/html', 'User-Agent': 'Mozilla/5.0' }
    })
    const html = await res.text()

    // Extract repo names + descriptions + stars
    const repos = []
    const repoRegex = /href="\/([^"]+\/[^"]+)"[^>]*>\s*<\/a>\s*<\/h2>/g
    const descRegex = /<p class="col-9[^"]*"[^>]*>\s*([\s\S]*?)\s*<\/p>/g
    const starsRegex = /trending-repo-stars-gained[^>]*>\s*([\d,]+)\s*stars this week/g

    // Simpler: just scrape article tags
    const articleMatches = [...html.matchAll(/<article[^>]*>([\s\S]*?)<\/article>/g)]
    for (const match of articleMatches.slice(0, 25)) {
      const block = match[1]
      const nameMatch  = block.match(/href="\/([^"\/]+\/[^"\/]+)"/)
      const descMatch  = block.match(/<p[^>]*col-9[^>]*>\s*([\s\S]*?)\s*<\/p>/)
      const starsMatch = block.match(/([\d,]+)\s*stars this week/)
      const langMatch  = block.match(/itemprop="programmingLanguage"[^>]*>\s*([^<]+)\s*</)

      if (!nameMatch) continue
      const name  = nameMatch[1].trim()
      const desc  = descMatch  ? descMatch[1].replace(/\s+/g, ' ').trim() : ''
      const stars = starsMatch ? starsMatch[1].trim() : '0'
      const lang  = langMatch  ? langMatch[1].trim()  : ''

      // Filter for AI/ML relevant repos
      const combined = (name + ' ' + desc).toLowerCase()
      const aiTerms  = ['ai', 'ml', 'llm', 'gpt', 'model', 'neural', 'deep', 'learn',
                        'transformer', 'diffusion', 'agent', 'rag', 'embed', 'vector',
                        'claude', 'openai', 'gemini', 'llama', 'vision', 'nlp', 'data']
      if (aiTerms.some(t => combined.includes(t))) {
        repos.push({ name, desc, stars, lang })
      }
      if (repos.length >= 5) break
    }

    if (repos.length === 0) return null

    // Pick the top one
    const top = repos[0]
    return {
      name:  top.name,
      desc:  top.desc || 'Trending AI/ML repository',
      stars: top.stars,
      lang:  top.lang,
      link:  `https://github.com/${top.name}`,
    }
  } catch (e) {
    console.log('⚠️ GitHub trending fetch failed:', e.message)
    return null
  }
}

async function summarise(stories) {
  // ✅ Cap at 60 stories to keep prompt size manageable
  const text = stories.slice(0, 60).map((s, i) =>
    `[${i+1}] SOURCE: ${s.source}\nTITLE: ${s.title}\nDESC: ${s.description}\nLINK: ${s.link}`
  ).join('\n\n')

  const prompt = `You are the editor of Neural Brief, a weekly AI news digest for Indian college students.

Here are ${Math.min(stories.length, 60)} recent AI stories:
${text}

Pick EXACTLY 15 most important, interesting, and varied stories. Cover different categories. Do NOT return more than 15 stories.

Also pick ONE "biggest_move" — the single most important AI story of the week.

Also pick ONE "jargon_of_week" — one AI/ML term from this week's stories explained in plain English for students.

Also pick ONE "tool_of_week" — one specific AI tool, product, or platform mentioned or implied in this week's stories that students or developers can actually use. Write:
- name: tool name
- what: one sentence — what it does
- pricing: one of [Free, Freemium, Paid, Open Source]
- best_for: one of [Students, Developers, Founders, Everyone]
- why: one sharp sentence — why it matters this week specifically
- link: official URL if known, otherwise leave empty string

For each of the 15 stories write:
- tag: one of [New Model, Research, Industry, Tool Drop, Policy, Opinion]
- title: clean headline, max 12 words
- summary: 2 sentences, plain English, zero jargon
- tldr: one punchy sentence starting with "-> TL;DR:"
- why_student: one sharp, specific sentence — concrete impact on an Indian CS/AI student. NO generic phrases like "you should care because" or "this affects you". Give the actual reason. Example: "If you use Wikipedia for research assignments, AI-generated content bans mean your sources just got harder to fake."
- why_developer: one sharp, specific sentence — concrete impact on an Indian developer or engineer building with AI tools.
- why_founder: one sharp, specific sentence — concrete business or market impact for an Indian startup founder.
- signal_score: number 1-10 rating importance. 9-10=major, 7-8=significant, 5-6=interesting, below 5=minor
- signal_label: one of ["Major", "Important", "Interesting", "Minor"]
- tweet: ready-to-post Twitter post, punchy, end with 2-3 hashtags. Max 280 chars.
- linkedin: polished 3-sentence thought-leader LinkedIn post. Professional tone. End with 2-3 hashtags.
- eli15: explain in 1-2 sentences like reader is 15. Simple analogies, zero jargon.
- hype: one sentence — what media/company claims (exaggerated/marketing spin)
- reality: one sentence — what it actually means in plain honest truth
- source: source name
- link: original link exactly

Return ONLY valid JSON, no backticks:
{
  "biggest_move": {"title":"...","reason":"...","link":"..."},
  "jargon_of_week": {"term":"...","explanation":"..."},
  "tool_of_week": {"name":"...","what":"...","pricing":"Freemium","best_for":"Students","why":"...","link":"..."},
  "stories": [{"tag":"...","title":"...","summary":"...","tldr":"...","why_student":"...","why_developer":"...","why_founder":"...","signal_score":8.5,"signal_label":"Important","tweet":"...","linkedin":"...","eli15":"...","hype":"...","reality":"...","source":"...","link":"..."}]
}`

  const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.GROQ_API_KEY}` },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.35,
      max_tokens: 12000,
    }),
  })

  const data = await resp.json()
  const raw  = data.choices[0].message.content.trim().replace(/```json|```/g, '').trim()

  // Safe JSON parse with helpful error
  let parsed
  try {
    parsed = JSON.parse(raw)
  } catch (e) {
    console.error('❌ JSON parse failed — likely truncated. Tail:', raw.slice(-200))
    throw new Error('Groq response was truncated. Reduce input size or increase max_tokens.')
  }

  return parsed
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
    const [raw, github_trending] = await Promise.all([
      fetchStories(),
      fetchGithubTrending(),
    ])
    const result = await summarise(raw)

    // Attach GitHub trending repo
    if (github_trending) result.github_trending = github_trending

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