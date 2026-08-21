// api/get-digest.js
import { createClient } from '@supabase/supabase-js'
import Parser from 'rss-parser'

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)
const parser   = new Parser({ timeout: 8000 })

const RSS_FEEDS = [
  { name: 'TechCrunch AI',           url: 'https://techcrunch.com/category/artificial-intelligence/feed/' },
  { name: 'HackerNews AI',           url: 'https://hnrss.org/newest?q=AI+OR+LLM+OR+Claude+OR+Anthropic&count=10' },
  { name: 'HackerNews Claude',       url: 'https://hnrss.org/newest?q=Claude+OR+Anthropic+OR+Gemini+OR+OpenAI&points=5&count=5' },
  { name: 'MIT Technology Review',   url: 'https://www.technologyreview.com/feed/' },
  { name: 'Google DeepMind',         url: 'https://deepmind.google/blog/rss.xml' },
  { name: 'Anthropic Blog',          url: 'https://buttondown.com/jlweston/rss' },
  { name: 'Anthropic News',          url: 'https://www.anthropic.com/news/rss.xml' },
  { name: 'OpenAI Blog',             url: 'https://openai.com/blog/rss.xml' },
  { name: 'Google AI Blog',          url: 'https://blog.google/technology/ai/rss/' },
  { name: 'Hugging Face',            url: 'https://huggingface.co/blog/feed.xml' },
  { name: 'Import AI',               url: 'https://jack-clark.net/feed/' },
  { name: 'Ars Technica AI',         url: 'https://arstechnica.com/tag/ai/feed/' },
  { name: 'VentureBeat AI',          url: 'https://venturebeat.com/category/ai/feed/' },
  { name: 'The Verge AI',            url: 'https://www.theverge.com/rss/index.xml' },
  { name: 'ZDNet AI',                url: 'https://www.zdnet.com/topic/artificial-intelligence/rss.xml' },
  // Research papers
  { name: 'arXiv AI',                url: 'https://rss.arxiv.org/rss/cs.AI' },
  { name: 'arXiv ML',                url: 'https://rss.arxiv.org/rss/cs.LG' },
  // Community signal — all Reddit sources (used only by fetchCommunitySignal)
  { name: 'Reddit MachineLearning',  url: 'https://www.reddit.com/r/MachineLearning/top/.rss?t=week' },
  { name: 'Reddit LocalLLaMA',       url: 'https://www.reddit.com/r/LocalLLaMA/top/.rss?t=week' },
  { name: 'Reddit artificial',       url: 'https://www.reddit.com/r/artificial/top/.rss?t=week' },
  { name: 'Reddit LanguageModels',   url: 'https://www.reddit.com/r/LanguageModels/top/.rss?t=week' },
  { name: 'Reddit ClaudeAI',         url: 'https://www.reddit.com/r/ClaudeAI/top/.rss?t=week' },
  { name: 'Reddit ClaudeCode',       url: 'https://www.reddit.com/r/ClaudeCode/top/.rss?t=week' },
  { name: 'Reddit OpenAI',           url: 'https://www.reddit.com/r/OpenAI/top/.rss?t=week' },
  { name: 'Reddit PromptEngineering',url: 'https://www.reddit.com/r/PromptEngineering/top/.rss?t=week' },
  { name: 'Reddit AI_Agents',        url: 'https://www.reddit.com/r/AI_Agents/top/.rss?t=week' },
  { name: 'Reddit AI_Automations',   url: 'https://www.reddit.com/r/AI_Automations/top/.rss?t=week' },
  { name: 'Reddit n8n',              url: 'https://www.reddit.com/r/n8n/top/.rss?t=week' },
]

// All Reddit source names — excluded from main news, used only for Community Signal
const REDDIT_SOURCES = [
  'Reddit MachineLearning', 'Reddit LocalLLaMA', 'Reddit artificial',
  'Reddit LanguageModels', 'Reddit ClaudeAI', 'Reddit ClaudeCode',
  'Reddit OpenAI', 'Reddit PromptEngineering', 'Reddit AI_Agents',
  'Reddit AI_Automations', 'Reddit n8n',
]

function isFresh(cachedAt) {
  return Date.now() - new Date(cachedAt).getTime() < 24 * 60 * 60 * 1000
}

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
  'prompt', 'automation', 'workflow', 'n8n', 'zapier', 'agent',
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
  'OpenAI Blog':             5,
  'Google DeepMind':         5,
  'Anthropic News':          5,
  'Anthropic Blog':          5,
  'Google AI Blog':          5,
  'Hugging Face':            4,
  'TechCrunch AI':           4,
  'MIT Technology Review':   4,
  'Import AI':               4,
  'HackerNews Claude':       4,
  'VentureBeat AI':          3,
  'Ars Technica AI':         3,
  'The Verge AI':            3,
  'arXiv AI':                3,
  'arXiv ML':                3,
  'HackerNews AI':           3,
  'ZDNet AI':                2,
  'Reddit MachineLearning':  2,
  'Reddit LocalLLaMA':       2,
  'Reddit artificial':       2,
  'Reddit LanguageModels':   2,
  'Reddit ClaudeAI':         2,
  'Reddit ClaudeCode':       2,
  'Reddit OpenAI':           2,
  'Reddit PromptEngineering':2,
  'Reddit AI_Agents':        2,
  'Reddit AI_Automations':   2,
  'Reddit n8n':              1,
}

function scoreStory(title, description, source, pubDate) {
  const text = (title + ' ' + description).toLowerCase()
  const hasBlock = BLOCK_KEYWORDS.some(kw => text.includes(kw))
  const hasAI    = HIGH_SIGNAL.some(kw => text.includes(kw)) || MEDIUM_SIGNAL.some(kw => text.includes(kw))
  if (hasBlock && !hasAI) return -1
  let score = 0
  HIGH_SIGNAL.forEach(kw => { if (text.includes(kw)) score += 3 })
  MEDIUM_SIGNAL.forEach(kw => { if (text.includes(kw)) score += 1 })
  score += (SOURCE_WEIGHT[source] || 1)
  if (pubDate) {
    const ageHours = (Date.now() - new Date(pubDate).getTime()) / 3600000
    if (ageHours < 6)  score += 3
    else if (ageHours < 12) score += 2
    else if (ageHours < 24) score += 1
  }
  return score
}

function deduplicateStories(stories) {
  const seen = new Set()
  return stories.filter(s => {
    const key = s.title.toLowerCase().split(/\s+/).slice(0, 4).join(' ')
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

async function fetchStories() {
  const all = []
  for (const feed of RSS_FEEDS) {
    if (REDDIT_SOURCES.includes(feed.name)) continue
    try {
      const parsed = await parser.parseURL(feed.url)
      for (const item of parsed.items.slice(0, 5)) {
        const title       = (item.title || 'Untitled').trim()
        const description = (item.contentSnippet || item.summary || '').slice(0, 150)
        const pubDate     = item.pubDate || item.isoDate || null
        const score       = scoreStory(title, description, feed.name, pubDate)
        if (score < 0) { console.log(`⛔ Blocked: ${title}`); continue }
        if (score === 0) { console.log(`⚠️ Low signal: ${title}`); continue }
        all.push({ source: feed.name, title, description, link: item.link || '', score, pubDate })
      }
    } catch (e) { console.log(`⚠️ ${feed.name}: ${e.message}`) }
  }
  all.sort((a, b) => b.score - a.score)
  const deduped = deduplicateStories(all)
  console.log(`✅ ${deduped.length} stories after scoring + dedup (from ${all.length} raw)`)
  return deduped
}

// ── Community Signal ───────────────────────────────────────
const REDDIT_BLOCK = [
  'how do i', 'how to learn', 'beginner', 'newbie', 'noob',
  'help me', 'career advice', 'resume', 'job hunt', 'salary',
  'rant', 'meme', 'weekly thread', 'discussion thread', 'weekly discussion',
  'megathread', 'mod post', 'rules', 'pinned',
]

async function fetchCommunitySignal() {
  const posts = []
  for (const feed of RSS_FEEDS) {
    if (!REDDIT_SOURCES.includes(feed.name)) continue
    try {
      const parsed = await parser.parseURL(feed.url)
      for (const item of parsed.items.slice(0, 8)) {
        const title = (item.title || '').trim()
        const text  = title.toLowerCase()
        if (REDDIT_BLOCK.some(kw => text.includes(kw))) continue
        const hasAI = HIGH_SIGNAL.some(kw => text.includes(kw)) || MEDIUM_SIGNAL.some(kw => text.includes(kw))
        if (!hasAI) continue
        posts.push({ title, link: item.link || '', source: feed.name })
        if (posts.length >= 6) break
      }
    } catch (e) { console.log(`⚠️ ${feed.name}: ${e.message}`) }
    if (posts.length >= 6) break
  }

  if (posts.length === 0) return null

  try {
    const postsText = posts.map((p, i) => `[${i+1}] (${p.source}) ${p.title}`).join('\n')
    const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.GROQ_API_KEY}` },
      body: JSON.stringify({
        model: 'qwen/qwen3.6-27b',
        messages: [{ role: 'user', content: `Pick the BEST post from this list for an Indian CS/AI student (most insightful, not a beginner question, not a rant):
${postsText}

Return ONLY valid JSON:
{"index": 0, "insight": "one sharp sentence why this discussion matters for AI developers (max 15 words)"}` }],
        temperature: 0.3,
        max_tokens: 120,
      }),
    })
    const data   = await resp.json()
    const raw    = data.choices[0].message.content.trim().replace(/```json|```/g, '').trim()
    const picked = JSON.parse(raw)
    const best   = posts[picked.index] || posts[0]
    return { title: best.title, link: best.link, source: best.source, insight: picked.insight }
  } catch {
    return { title: posts[0].title, link: posts[0].link, source: posts[0].source, insight: '' }
  }
}

async function callAI(prompt, maxTokens = 4000) {
  const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.GROQ_API_KEY}` },
    body: JSON.stringify({
      model: 'qwen/qwen3.6-27b',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.35,
      max_tokens: maxTokens,
    }),
  })
  const data = await resp.json()
  if (data?.choices?.[0]?.message?.content) {
    console.log('✅ Groq response received')
    return data.choices[0].message.content.trim()
  }
  throw new Error(`Groq failed: ${JSON.stringify(data?.error)}`)
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
      const name = nameMatch[1].trim()
      if (/^(sponsors|orgs|topics|trending|explore|marketplace)\//.test(name)) continue
      const rawDesc = descMatch ? descMatch[1].replace(/\s+/g, ' ').trim() : ''
      const desc  = rawDesc.replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').trim()
      const stars = starsMatch ? starsMatch[1].trim() : '0'
      const lang  = langMatch  ? langMatch[1].trim()  : ''
      repos.push({ name, desc, stars, lang })
    }
    if (repos.length === 0) return null

    const AI_REPO_KEYWORDS = [
      'ai', 'llm', 'gpt', 'language model', 'machine learning', 'deep learning',
      'neural', 'transformer', 'diffusion', 'inference', 'embedding',
      'rag', 'agent', 'chatbot', 'vision', 'multimodal', 'nlp', 'speech',
      'fine-tun', 'dataset', 'benchmark', 'openai', 'anthropic', 'gemini',
      'claude', 'llama', 'mistral', 'hugging', 'pytorch', 'tensorflow', 'jax',
      'generative', 'vector', 'onnx', 'cuda', 'reasoning', 'autonomous', 'robot',
    ]
    const REPO_BLOCK = ['quant', 'trading', 'finance', 'stock', 'crypto', 'blockchain', 'defi', 'nft', 'web3']
    const isAIRepo = (name, desc) => {
      const combined = (name + ' ' + desc).toLowerCase()
      if (REPO_BLOCK.some(kw => combined.includes(kw))) return false
      return AI_REPO_KEYWORDS.some(kw => combined.includes(kw))
    }
    const aiRepo = repos.find(r => isAIRepo(r.name, r.desc)) || repos[0]
    return { name: aiRepo.name, desc: aiRepo.desc || 'Trending AI/ML repository', stars: aiRepo.stars, lang: aiRepo.lang, link: `https://github.com/${aiRepo.name}` }
  } catch (e) { console.log('⚠️ GitHub trending failed:', e.message); return null }
}

async function summarise(stories) {
  const text = stories.slice(0, 30).map((s, i) =>
    `[${i+1}] ${s.source} | ${s.title}\n${s.description.slice(0, 80)}\n${s.link}`
  ).join('\n\n')

  const prompt = `You are the editor of Neural Brief — a sharp, no-BS AI news digest for Indian college students and developers. You write like a smart senior developer who reads everything and cuts through hype.

Recent AI stories (pre-scored by relevance):
${text}

Pick EXACTLY 15 most important, varied stories. Prioritise: model releases, tool launches, research breakthroughs, major industry moves. Always include an Anthropic/Claude story if one exists.

Also pick:
- ONE "biggest_move": {title, reason, link}
- ONE "jargon_of_week": {term, explanation}
- ONE "tool_of_week": {name, what, pricing (Free/Freemium/Paid/Open Source), best_for (Students/Developers/Founders/Everyone), why, link}

For each story:
TITLE (≤12 words): punchy, includes product/company name + hook
SUMMARY (2 sentences): what happened + why significant
TLDR: "-> TL;DR: [actionable insight]"
WHY_STUDENT: specific + actionable for Indian CS/AI student
WHY_DEVELOPER: concrete workflow/stack outcome
WHY_FOUNDER: business impact
SIGNAL_SCORE: 1-10 | SIGNAL_LABEL: Major/Important/Interesting/Minor
HYPE: what marketing says (specific)
REALITY: honest specific limitation
ELI15: 1-2 sentences for curious 15-year-old
TWEET: ≤280 chars + 2-3 hashtags
LINKEDIN: 3 professional sentences + 2-3 hashtags

Return ONLY valid JSON, no markdown:
{"biggest_move":{"title":"...","reason":"...","link":"..."},"jargon_of_week":{"term":"...","explanation":"..."},"tool_of_week":{"name":"...","what":"...","pricing":"Freemium","best_for":"Students","why":"...","link":"..."},"stories":[{"tag":"...","title":"...","summary":"...","tldr":"...","why_student":"...","why_developer":"...","why_founder":"...","signal_score":8,"signal_label":"Important","tweet":"...","linkedin":"...","eli15":"...","hype":"...","reality":"...","source":"...","link":"..."}]}`

  const raw = (await callAI(prompt, 8000)).replace(/```json|```/g, '').trim()
  try { return JSON.parse(raw) }
  catch (e) {
    console.error('❌ JSON parse failed. Tail:', raw.slice(-200))
    throw new Error('AI response was truncated or malformed.')
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  try {
    const { data: cache } = await supabase
      .from('digest_cache').select('*')
      .order('created_at', { ascending: false }).limit(1)

    if (cache && cache.length > 0 && isFresh(cache[0].created_at)) {
      console.log('📦 Serving from cache')
      return res.status(200).json({ ...cache[0].data, cached: true })
    }

    console.log('🔄 Fetching fresh stories...')
    const [raw, github_trending, community_signal] = await Promise.all([
      fetchStories(), fetchGithubTrending(), fetchCommunitySignal(),
    ])
    const result = await summarise(raw)

    if (github_trending) {
      try {
        await new Promise(r => setTimeout(r, 3000))
        const whyPrompt = `GitHub repo: ${github_trending.name}\nDescription: ${github_trending.desc}\n\nWrite ONE sharp sentence (max 12 words) — why should an Indian CS/AI student care? Return only the sentence.`
        github_trending.why = (await callAI(whyPrompt, 100)).replace(/^["']|["']$/g, '')
      } catch (e) { github_trending.why = ''; console.log('⚠️ GitHub why failed:', e.message) }
      result.github_trending = github_trending
    }

    if (community_signal) result.community_signal = community_signal

    await supabase.from('digest_cache').insert({ data: result, created_at: new Date().toISOString() })
    return res.status(200).json({ ...result, cached: false })
  } catch (err) {
    console.error('❌ get-digest error:', err)
    return res.status(500).json({ error: err.message })
  }
}