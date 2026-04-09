// api/get-digest.js
// Returns this week's digest for display on the website
// Caches in Supabase — Groq only runs once per 24 hours

import { createClient } from '@supabase/supabase-js'
import Parser from 'rss-parser'

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)
const parser   = new Parser({ timeout: 8000 })

// ── RSS Feeds ─────────────────────────────────────────────
// Removed dead feeds: Anthropic /news/rss.xml (404), The Batch (404),
// Wired AI (404), Reuters feeds.reuters.com (ENOTFOUND), Analytics India (malformed HTML).
// HackerNews changed from /frontpage to /newest to reduce 429s.
const RSS_FEEDS = [
  { name: 'TechCrunch AI',          url: 'https://techcrunch.com/category/artificial-intelligence/feed/' },
  { name: 'HackerNews AI',          url: 'https://hnrss.org/newest?q=AI+OR+LLM+OR+Claude+OR+Anthropic&count=10' },
  { name: 'MIT Technology Review',  url: 'https://www.technologyreview.com/feed/' },
  { name: 'Google DeepMind',        url: 'https://deepmind.google/blog/rss.xml' },
  { name: 'Anthropic Blog',         url: 'https://buttondown.com/jlweston/rss' },
  { name: 'OpenAI Blog',            url: 'https://openai.com/blog/rss.xml' },
  { name: 'Google AI Blog',         url: 'https://blog.google/technology/ai/rss/' },
  { name: 'Hugging Face',           url: 'https://huggingface.co/blog/feed.xml' },
  { name: 'Import AI',              url: 'https://jack-clark.net/feed/' },
  { name: 'Ars Technica AI',        url: 'https://arstechnica.com/tag/ai/feed/' },
  { name: 'VentureBeat AI',         url: 'https://venturebeat.com/category/ai/feed/' },
  { name: 'The Verge AI',           url: 'https://www.theverge.com/rss/index.xml' },
  { name: 'ZDNet AI',               url: 'https://www.zdnet.com/topic/artificial-intelligence/rss.xml' },
  { name: 'Mashable Tech',          url: 'https://mashable.com/feeds/rss/tech' },
  // Research papers
  { name: 'arXiv AI',               url: 'https://rss.arxiv.org/rss/cs.AI' },
  { name: 'arXiv ML',               url: 'https://rss.arxiv.org/rss/cs.LG' },
  // Developer/community signal
  { name: 'Reddit MachineLearning', url: 'https://www.reddit.com/r/MachineLearning/top/.rss?t=week' },
  { name: 'Reddit LocalLLaMA',      url: 'https://www.reddit.com/r/LocalLLaMA/top/.rss?t=week' },
  // Business angle
  { name: 'CNBC Tech',              url: 'https://www.cnbc.com/id/19854910/device/rss/rss.html' },
]

function isFresh(cachedAt) {
  return Date.now() - new Date(cachedAt).getTime() < 24 * 60 * 60 * 1000
}

// ── Scoring system ─────────────────────────────────────────
const HIGH_SIGNAL = [
  'gpt', 'chatgpt', 'gemini', 'claude', 'llama', 'mistral', 'grok', 'sora',
  'openai', 'anthropic', 'deepmind', 'hugging face', 'google ai', 'meta ai',
  'llm', 'large language model', 'foundation model', 'model release',
  'announces', 'launches', 'releases', 'introduces', 'unveils', 'drops',
  'generative ai', 'reasoning model', 'multimodal', 'ai agent',
]

const MEDIUM_SIGNAL = [
  'machine learning', 'deep learning', 'neural network', 'transformer',
  'diffusion', 'reinforcement learning', 'fine-tuning', 'fine tuning',
  'rag', 'retrieval', 'embedding', 'vector database', 'inference',
  'context window', 'benchmark', 'ai model', 'language model',
  'computer vision', 'image generation', 'text to image', 'voice ai',
  'ai safety', 'alignment', 'hallucination', 'ai funding', 'ai startup',
  'ai tool', 'agentic', 'chatbot', 'speech model', 'coding ai',
  'nvidia', 'gpu', 'tpu', 'semiconductor', 'ai chip',
  'copilot', 'midjourney', 'stable diffusion', 'dall-e',
  'whisper', 'runway', 'perplexity', 'cursor', 'windsurf',
  'cohere', 'groq', 'together ai', 'replicate', 'scale ai',
  'robotics', 'autonomous', 'self-driving', 'tokenizer',
  'ai regulation', 'ai policy', 'artificial intelligence',
]

const BLOCK_KEYWORDS = [
  'gas price', 'fuel price', 'gasoline', 'petrol', 'plastic',
  'spacex rocket', 'stock market crash', 'crypto crash', 'bitcoin price', 'ethereum price',
  'real estate', 'housing market', 'mortgage', 'recipe', 'cooking', 'food review',
  'nba', 'nfl', 'soccer match', 'cricket score', 'weather forecast',
  'electric vehicle recall', 'tesla stock', 'climate change protest',
  'war crimes', 'military strike', 'election results', 'congress vote', 'senate bill',
]

const SOURCE_WEIGHT = {
  'OpenAI Blog':            5,
  'Google DeepMind':        5,
  'Anthropic News':         5,
  'Google AI Blog':         5,
  'Hugging Face':           4,
  'TechCrunch AI':          4,
  'MIT Technology Review':  4,
  'Import AI':              4,
  'VentureBeat AI':         3,
  'Ars Technica AI':        3,
  'The Verge AI':           3,
  'arXiv AI':               3,
  'arXiv ML':               3,
  'HackerNews AI':          3,
  'Wired AI':               3,
  'ZDNet AI':               2,
  'Mashable Tech':          2,
  'Analytics India':        2,
  'CNBC Tech':              2,
  'Reuters Tech':           2,
  'Reddit MachineLearning': 2,
  'Reddit LocalLLaMA':      2,
}

function scoreStory(title, description, source, pubDate) {
  const text = (title + ' ' + description).toLowerCase()

  // Hard block — no AI keyword present alongside block keyword
  const hasBlock = BLOCK_KEYWORDS.some(kw => text.includes(kw))
  const hasAI    = HIGH_SIGNAL.some(kw => text.includes(kw)) || MEDIUM_SIGNAL.some(kw => text.includes(kw))
  if (hasBlock && !hasAI) return -1

  let score = 0

  // Keyword scoring
  HIGH_SIGNAL.forEach(kw => { if (text.includes(kw)) score += 3 })
  MEDIUM_SIGNAL.forEach(kw => { if (text.includes(kw)) score += 1 })

  // Source weight
  score += (SOURCE_WEIGHT[source] || 1)

  // Recency boost
  if (pubDate) {
    const ageHours = (Date.now() - new Date(pubDate).getTime()) / 3600000
    if (ageHours < 6)  score += 3
    else if (ageHours < 12) score += 2
    else if (ageHours < 24) score += 1
  }

  return score
}

// Deduplicate by title similarity (first 4 words)
function deduplicateStories(stories) {
  const seen = new Set()
  return stories.filter(s => {
    const key = s.title.toLowerCase().split(/\s+/).slice(0, 4).join(' ')
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

const REDDIT_SOURCES = ['Reddit MachineLearning', 'Reddit LocalLLaMA']

async function fetchStories() {
  const all = []
  for (const feed of RSS_FEEDS) {
    // Skip Reddit — handled separately as Community Signal
    if (REDDIT_SOURCES.includes(feed.name)) continue
    try {
      const parsed = await parser.parseURL(feed.url)
      for (const item of parsed.items.slice(0, 5)) {
        const title       = (item.title || 'Untitled').trim()
        const description = (item.contentSnippet || item.summary || '').slice(0, 150)
        const pubDate     = item.pubDate || item.isoDate || null
        const score       = scoreStory(title, description, feed.name, pubDate)

        if (score < 0) { console.log(`⛔ Blocked: ${title}`); continue }
        if (score === 0) { console.log(`⚠️ Low signal (skipped): ${title}`); continue }

        all.push({ source: feed.name, title, description, link: item.link || '', score, pubDate })
      }
    } catch (e) { console.log(`⚠️ ${feed.name}: ${e.message}`) }
  }

  all.sort((a, b) => b.score - a.score)
  const deduped = deduplicateStories(all)
  console.log(`✅ ${deduped.length} stories after scoring + dedup (from ${all.length} raw)`)
  return deduped
}

// ── Community Signal — top Reddit discussions ──────────────
const REDDIT_BLOCK = [
  'how do i', 'how to learn', 'beginner', 'newbie', 'noob',
  'help me', 'career advice', 'resume', 'job hunt', 'salary',
  'rant', 'meme', 'weekly thread', 'discussion thread',
]

async function fetchCommunitySignal() {
  const posts = []
  for (const feed of RSS_FEEDS) {
    if (!REDDIT_SOURCES.includes(feed.name)) continue
    try {
      const parsed = await parser.parseURL(feed.url)
      for (const item of parsed.items.slice(0, 10)) {
        const title = (item.title || '').trim()
        const text  = title.toLowerCase()
        // Block low-quality posts
        if (REDDIT_BLOCK.some(kw => text.includes(kw))) continue
        // Must have AI relevance
        const hasAI = HIGH_SIGNAL.some(kw => text.includes(kw)) || MEDIUM_SIGNAL.some(kw => text.includes(kw))
        if (!hasAI) continue
        posts.push({
          title,
          link:   item.link || '',
          source: feed.name,
        })
        if (posts.length >= 3) break
      }
    } catch (e) { console.log(`⚠️ ${feed.name}: ${e.message}`) }
    if (posts.length >= 3) break
  }

  if (posts.length === 0) return null

  // Use AI to pick the best one and write a 1-line insight
  try {
    const postsText = posts.map((p, i) => `[${i+1}] ${p.title}`).join('\n')
    const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.GROQ_API_KEY}` },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: `Pick the BEST post from this list for an Indian CS/AI student (most insightful, not a beginner question):
${postsText}

Return ONLY valid JSON:
{"index": 0, "insight": "one sharp sentence — why this discussion matters for AI developers (max 15 words)"}` }],
        temperature: 0.3,
        max_tokens: 100,
      }),
    })
    const data  = await resp.json()
    const raw   = data.choices[0].message.content.trim().replace(/```json|```/g, '').trim()
    const picked = JSON.parse(raw)
    const best  = posts[picked.index] || posts[0]
    return { title: best.title, link: best.link, source: best.source, insight: picked.insight }
  } catch {
    return { title: posts[0].title, link: posts[0].link, source: posts[0].source, insight: '' }
  }
}

// ── AI call: Groq primary → Gemini 2.0 Flash fallback ─────
async function callAI(prompt, maxTokens = 4000) {
  // Try Groq first
  try {
    const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.GROQ_API_KEY}` },
      body: JSON.stringify({
        model:       'llama-3.3-70b-versatile',
        messages:    [{ role: 'user', content: prompt }],
        temperature: 0.35,
        max_tokens:  maxTokens,
      }),
    })
    const data = await resp.json()
    if (data?.choices?.[0]?.message?.content) {
      console.log('✅ Groq response received')
      return data.choices[0].message.content.trim()
    }
    console.log('⚠️ Groq failed:', JSON.stringify(data?.error))
  } catch (e) {
    console.log('⚠️ Groq error:', e.message)
  }

  // FIX: gemini-1.5-flash was deprecated/removed. Use gemini-2.0-flash instead.
  if (!process.env.GEMINI_API_KEY) throw new Error('Groq failed and no GEMINI_API_KEY set')
  console.log('🔄 Falling back to Gemini...')
  try {
    const resp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents:         [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.35, maxOutputTokens: maxTokens },
        }),
      }
    )
    const data = await resp.json()
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
    if (text) {
      console.log('✅ Gemini fallback response received')
      return text.trim()
    }
    console.log('⚠️ Gemini also failed:', JSON.stringify(data?.error))
    throw new Error('Both Groq and Gemini returned empty responses')
  } catch (e) {
    throw new Error(`AI fallback failed: ${e.message}`)
  }
}

async function fetchGithubTrending() {
  try {
    const res  = await fetch('https://github.com/trending/python?since=weekly&spoken_language_code=en', {
      headers: { 'Accept': 'text/html', 'User-Agent': 'Mozilla/5.0' }
    })
    const html = await res.text()

    const repos = []
    const articleMatches = [...html.matchAll(/<article[^>]*>([\s\S]*?)<\/article>/g)]
    for (const match of articleMatches.slice(0, 25)) {
      const block      = match[1]
      const nameMatch  = block.match(/href="\/([^"\/]+\/[^"\/]+)"/)
      const descMatch  = block.match(/<p[^>]*col-9[^>]*>([\s\S]*?)<\/p>/)
      const starsMatch = block.match(/([\d,]+)\s*stars this week/)
      const langMatch  = block.match(/itemprop="programmingLanguage"[^>]*>\s*([^<]+)\s*</)

      if (!nameMatch) continue
      const name  = nameMatch[1].trim()
      // Skip GitHub special paths that aren't real repos
      if (/^(sponsors|orgs|topics|trending|explore|marketplace)\//.test(name)) continue
      // Strip HTML tags from description
      const rawDesc = descMatch ? descMatch[1].replace(/\s+/g, ' ').trim() : ''
      const desc  = rawDesc.replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').trim()
      const stars = starsMatch ? starsMatch[1].trim() : '0'
      const lang  = langMatch  ? langMatch[1].trim()  : ''

      repos.push({ name, desc, stars, lang })
    }

    if (repos.length === 0) return null

    // ── Filter to AI/ML relevant repos ──────────────────────────
    const AI_REPO_KEYWORDS = [
      'ai', 'llm', 'gpt', 'language model', 'machine learning', 'deep learning',
      'neural', 'transformer', 'diffusion', 'stable diffusion', 'inference', 'embedding',
      'rag', 'agent', 'chatbot', 'vision', 'multimodal', 'nlp', 'speech',
      'fine-tun', 'dataset', 'benchmark', 'openai', 'anthropic', 'gemini',
      'claude', 'llama', 'mistral', 'hugging', 'pytorch', 'tensorflow', 'jax',
      'generative', 'vector', 'onnx', 'cuda', 'reasoning',
      'autonomous', 'robot', 'computer vision', 'video generation',
    ]

    const REPO_BLOCK_KEYWORDS = [
      'quant', 'trading', 'finance', 'stock', 'investment', 'crypto', 'blockchain',
      'market', 'forex', 'hedge', 'portfolio', 'defi', 'nft', 'web3',
    ]

    const isAIRepo = (name, desc) => {
      const combined = (name + ' ' + desc).toLowerCase()
      const blocked = REPO_BLOCK_KEYWORDS.some(kw => combined.includes(kw))
      if (blocked) return false
      return AI_REPO_KEYWORDS.some(kw => combined.includes(kw))
    }

    // Pick first AI repo, fallback to top repo if none match
    const aiRepo = repos.find(r => isAIRepo(r.name, r.desc)) || repos[0]

    return {
      name:  aiRepo.name,
      desc:  aiRepo.desc || 'Trending AI/ML repository',
      stars: aiRepo.stars,
      lang:  aiRepo.lang,
      link:  `https://github.com/${aiRepo.name}`,
    }
  } catch (e) {
    console.log('⚠️ GitHub trending fetch failed:', e.message)
    return null
  }
}

async function summarise(stories) {
  // FIX: Groq's TPM limit is 12,000. The old code requested 12,000 output tokens alone,
  // Input is ~1300 tokens. Groq TPM limit is 12k total (input+output).
  // 15 stories * ~500 tokens each + overhead = ~7800 output tokens. 8000 gives safe headroom.
  const text = stories.slice(0, 30).map((s, i) =>
    `[${i+1}] ${s.source} | ${s.title}\n${s.description.slice(0, 80)}\n${s.link}`
  ).join('\n\n')

  const prompt = `You are the editor of Neural Brief — a sharp, no-BS AI news digest for Indian college students and developers. You write like a smart senior developer who reads everything and cuts through hype.

Recent AI stories (pre-scored by relevance):
${text}

Pick EXACTLY 15 most important, varied stories. Prioritise: model releases, tool launches, research breakthroughs, major industry moves. Always include an Anthropic/Claude story if one exists.

Also pick:
- ONE "biggest_move": {title, reason, link} — the single most impactful development this week
- ONE "jargon_of_week": {term, explanation} — explain like the user is smart but new to AI
- ONE "tool_of_week": {name, what, pricing (Free/Freemium/Paid/Open Source), best_for (Students/Developers/Founders/Everyone), why, link}

For each of the 15 stories, follow these rules STRICTLY:

TITLE (≤12 words):
- Must be punchy and create curiosity
- Include the actual product/company name
- Add a hook: "— strong benchmarks, real gaps" or "— faster than GPT-4" etc.
- BAD: "New Model Released" | GOOD: "Meta unveils Muse Spark — strong benchmarks, real gaps"

SUMMARY (2 sentences):
- Sentence 1: What exactly happened — be specific, name the product/model/company
- Sentence 2: What makes it significant or different from what came before

TLDR (one sentence starting with "-> TL;DR:"):
- Must be actionable insight, not just a repeat of the title
- BAD: "-> TL;DR: New model released" | GOOD: "-> TL;DR: Developers can now run GPT-4 level reasoning at 10x lower cost"

WHY_STUDENT (1-2 sentences):
- Must be SPECIFIC and ACTIONABLE for an Indian CS/AI student
- Mention what they can actually DO with this — build, test, compare, use in project
- BAD: "Students can explore this technology" | GOOD: "You can now fine-tune Gemma 4 on a free Colab GPU — try it for your next NLP project"

WHY_DEVELOPER (1-2 sentences):
- Concrete outcome — what changes in their workflow or stack

WHY_FOUNDER (1-2 sentences):
- Business impact — cost, opportunity, competitive angle

SIGNAL_SCORE + SIGNAL_LABEL:
- Score must have a 1-line reason baked into the summary context
- Major = changes the field | Important = worth knowing | Interesting = worth watching | Minor = FYI

HYPE (one sentence):
- What the marketing/press is saying — slightly exaggerated
- BAD: "Revolutionary AI" | GOOD: "Meta claims Muse Spark is the most capable open model ever built"

REALITY (one sentence):
- Honest, specific assessment — name the actual limitation
- BAD: "Has some limitations" | GOOD: "Strong on benchmarks but still inconsistent on multi-step reasoning tasks"

ELI15 (1-2 sentences): Explain to a curious 15-year-old with zero AI background

TWEET (≤280 chars + 2-3 hashtags): Punchy, shareable
LINKEDIN (3 professional sentences + 2-3 hashtags): Insight-driven, not just news

Return ONLY valid JSON, no markdown fences:
{"biggest_move":{"title":"...","reason":"...","link":"..."},"jargon_of_week":{"term":"...","explanation":"..."},"tool_of_week":{"name":"...","what":"...","pricing":"Freemium","best_for":"Students","why":"...","link":"..."},"stories":[{"tag":"...","title":"...","summary":"...","tldr":"...","why_student":"...","why_developer":"...","why_founder":"...","signal_score":8,"signal_label":"Important","tweet":"...","linkedin":"...","eli15":"...","hype":"...","reality":"...","source":"...","link":"..."}]}`

  const raw = (await callAI(prompt, 8000)).replace(/```json|```/g, '').trim()

  let parsed
  try {
    parsed = JSON.parse(raw)
  } catch (e) {
    console.error('❌ JSON parse failed — likely truncated. Tail:', raw.slice(-200))
    throw new Error('AI response was truncated or malformed.')
  }
  return parsed
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')

  try {
    const { data: cache } = await supabase
      .from('digest_cache')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)

    if (cache && cache.length > 0 && isFresh(cache[0].created_at)) {
      console.log('📦 Serving from cache')
      return res.status(200).json({ ...cache[0].data, cached: true })
    }

    console.log('🔄 Fetching fresh stories...')
    const [raw, github_trending, community_signal] = await Promise.all([
      fetchStories(),
      fetchGithubTrending(),
      fetchCommunitySignal(),
    ])
    const result = await summarise(raw)

    if (github_trending) {
      try {
        await new Promise(r => setTimeout(r, 3000))
        const whyPrompt = `GitHub repo: ${github_trending.name}\nDescription: ${github_trending.desc}\n\nWrite ONE sharp sentence (max 12 words) — why should an Indian CS/AI student care about this? Be specific. Return only the sentence.`
        github_trending.why = (await callAI(whyPrompt, 100)).replace(/^["']|["']$/g, '')
      } catch (e) {
        github_trending.why = ''
        console.log('⚠️ GitHub why generation failed:', e.message)
      }
      result.github_trending = github_trending
    }

    if (community_signal) result.community_signal = community_signal

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