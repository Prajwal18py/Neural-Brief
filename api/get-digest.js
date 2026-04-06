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
  { name: 'TechCrunch AI',         url: 'https://techcrunch.com/category/artificial-intelligence/feed/' },
  { name: 'HackerNews AI',         url: 'https://hnrss.org/newest?q=AI+OR+LLM&count=10' },
  { name: 'MIT Technology Review', url: 'https://www.technologyreview.com/feed/' },
  { name: 'Google DeepMind',       url: 'https://deepmind.google/blog/rss.xml' },
  { name: 'Anthropic Blog',        url: 'https://buttondown.com/jlweston/rss' },          // Anthropic has no public RSS; using AI newsletter as proxy
  { name: 'OpenAI Blog',           url: 'https://openai.com/blog/rss.xml' },
  { name: 'Google AI Blog',        url: 'https://blog.google/technology/ai/rss/' },
  { name: 'Hugging Face',          url: 'https://huggingface.co/blog/feed.xml' },
  { name: 'Import AI',             url: 'https://jack-clark.net/feed/' },
  { name: 'Ars Technica AI',       url: 'https://arstechnica.com/tag/ai/feed/' },
  { name: 'VentureBeat AI',        url: 'https://venturebeat.com/category/ai/feed/' },
  { name: 'The Verge AI',          url: 'https://www.theverge.com/rss/index.xml' },
  { name: 'ZDNet AI',              url: 'https://www.zdnet.com/topic/artificial-intelligence/rss.xml' },
  { name: 'Mashable Tech',         url: 'https://mashable.com/feeds/rss/tech' },
]

function isFresh(cachedAt) {
  return Date.now() - new Date(cachedAt).getTime() < 24 * 60 * 60 * 1000
}

// ── Strict AI relevance filter ─────────────────────────────
const AI_KEYWORDS = [
  'artificial intelligence', 'machine learning', 'deep learning',
  'neural network', 'llm', 'large language model', 'generative ai',
  'foundation model', 'transformer', 'diffusion', 'reinforcement learning',
  'gpt', 'chatgpt', 'gemini', 'claude', 'llama', 'mistral', 'grok',
  'copilot', 'midjourney', 'stable diffusion', 'dall-e', 'sora',
  'whisper', 'runway', 'perplexity', 'cursor', 'windsurf',
  'openai', 'anthropic', 'deepmind', 'google ai', 'meta ai',
  'microsoft ai', 'nvidia', 'hugging face', 'cohere', 'mistral ai',
  'stability ai', 'groq', 'together ai', 'replicate', 'scale ai',
  'fine-tuning', 'fine tuning', 'rag', 'retrieval', 'embedding',
  'vector database', 'inference', 'context window', 'tokenizer',
  'robotics', 'autonomous', 'self-driving', 'computer vision',
  'image generation', 'text to image', 'multimodal', 'reasoning model',
  'coding ai', 'ai safety', 'alignment', 'hallucination',
  'ai regulation', 'ai policy', 'ai funding', 'ai startup', 'ai tool',
  'ai agent', 'agentic', 'chatbot', 'voice ai', 'speech model',
  'benchmark', 'ai model', 'language model', 'model release',
  'gpu', 'tpu', 'semiconductor', 'ai chip',
]

const BLOCK_KEYWORDS = [
  'gas price', 'fuel price', 'gasoline', 'petrol', 'plastic',
  'spacex', 'ipo', 'stock market', 'crypto', 'bitcoin', 'ethereum',
  'real estate', 'housing', 'mortgage', 'recipe', 'cooking', 'food',
  'sports', 'nba', 'nfl', 'soccer', 'cricket', 'weather',
  'electric vehicle', 'tesla stock', 'climate change', 'war', 'military',
  'warfare', 'election', 'politics', 'congress', 'senate',
]

function isAIRelevant(title, description = '') {
  const text = (title + ' ' + description).toLowerCase()
  const blocked = BLOCK_KEYWORDS.some(kw => text.includes(kw))
  if (blocked) return false
  return AI_KEYWORDS.some(kw => text.includes(kw))
}

async function fetchStories() {
  const all = []
  for (const feed of RSS_FEEDS) {
    try {
      const parsed = await parser.parseURL(feed.url)
      for (const item of parsed.items.slice(0, 4)) {
        const title = item.title || 'Untitled'
        const description = (item.contentSnippet || item.summary || '').slice(0, 120)
        // Skip non-AI stories at source level
        if (!isAIRelevant(title, description)) {
          console.log(`⛔ Filtered out: ${title}`)
          continue
        }
        all.push({
          source:      feed.name,
          title,
          description,
          link:        item.link || '',
        })
      }
    } catch (e) { console.log(`⚠️ ${feed.name}: ${e.message}`) }
  }
  console.log(`✅ ${all.length} AI-relevant stories after filtering`)
  return all
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
      const descMatch  = block.match(/<p[^>]*col-9[^>]*>\s*([\s\S]*?)\s*<\/p>/)
      const starsMatch = block.match(/([\d,]+)\s*stars this week/)
      const langMatch  = block.match(/itemprop="programmingLanguage"[^>]*>\s*([^<]+)\s*</)

      if (!nameMatch) continue
      const name  = nameMatch[1].trim()
      // Skip GitHub special paths that aren't real repos
      if (/^(sponsors|orgs|topics|trending|explore|marketplace)\//.test(name)) continue
      const desc  = descMatch  ? descMatch[1].replace(/\s+/g, ' ').trim() : ''
      const stars = starsMatch ? starsMatch[1].trim() : '0'
      const lang  = langMatch  ? langMatch[1].trim()  : ''

      repos.push({ name, desc, stars, lang })
    }

    if (repos.length === 0) return null

    // ── Filter to AI/ML relevant repos ──────────────────────────
    const AI_REPO_KEYWORDS = [
      'ai', 'ml', 'llm', 'gpt', 'language model', 'machine learning', 'deep learning',
      'neural', 'transformer', 'diffusion', 'stable diffusion', 'inference', 'embedding',
      'rag', 'agent', 'chatbot', 'vision', 'multimodal', 'nlp', 'speech', 'image',
      'training', 'fine-tun', 'dataset', 'benchmark', 'openai', 'anthropic', 'gemini',
      'claude', 'llama', 'mistral', 'hugging', 'pytorch', 'tensorflow', 'jax',
      'generative', 'vector', 'onnx', 'cuda', 'gpu', 'model', 'reasoning',
      'autonomous', 'robot', 'computer vision', 'text', 'audio', 'video generation',
    ]

    const isAIRepo = (name, desc) => {
      const combined = (name + ' ' + desc).toLowerCase()
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

  const prompt = `You are the editor of Neural Brief, a weekly AI news digest for Indian college students.

Recent AI stories:
${text}

Pick EXACTLY 15 most important, varied stories. Include an Anthropic/Claude story if one exists.

Also pick:
- ONE "biggest_move": {title, reason, link}
- ONE "jargon_of_week": {term, explanation}
- ONE "tool_of_week": {name, what, pricing (Free/Freemium/Paid/Open Source), best_for (Students/Developers/Founders/Everyone), why, link (official homepage)}

For each of the 15 stories:
- tag: New Model | Research | Industry | Tool Drop | Policy | Opinion
- title: ≤12 words
- summary: 2 plain-English sentences
- tldr: one punchy sentence starting with "-> TL;DR:"
- why_student: specific concrete impact on an Indian CS/AI student
- why_developer: specific concrete outcome for a developer
- why_founder: specific business impact for a founder
- signal_score: 1-10
- signal_label: Major | Important | Interesting | Minor
- tweet: ≤280 chars + 2-3 hashtags
- linkedin: 3 professional sentences + 2-3 hashtags
- eli15: 1-2 sentences for a 15-year-old
- hype: one sentence — marketing spin
- reality: one honest sentence
- source, link

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
    const [raw, github_trending] = await Promise.all([
      fetchStories(),
      fetchGithubTrending(),
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