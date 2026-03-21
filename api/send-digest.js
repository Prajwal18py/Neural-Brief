// api/send-digest.js
// Vercel Cron — runs every Friday 9am IST (3:30 UTC)
// Features: Why it matters, Biggest Move, Source labels, Jargon of the week, Tweet share

import { createClient } from '@supabase/supabase-js'
import nodemailer from 'nodemailer'
import Parser from 'rss-parser'

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)

const transporter = nodemailer.createTransport({
  host: 'smtp-relay.brevo.com',
  port: 587,
  secure: false,
  auth: { user: process.env.BREVO_SMTP_LOGIN, pass: process.env.BREVO_SMTP_KEY },
})

const parser = new Parser()

const FROM_EMAIL = `Neural Brief <${process.env.BREVO_FROM_EMAIL}>`
const REPLY_TO   = process.env.BREVO_FROM_EMAIL
const WEBSITE    = 'https://neural-brief-eight.vercel.app'
const STORIES_COUNT = 15

// ── Source credibility labels ─────────────────────────────
const SOURCE_LABELS = {
  'Google DeepMind':       { label: 'Official',  bg: '#edf5eb', color: '#357025', border: '#bdd9b7' },
  'OpenAI Blog':           { label: 'Official',  bg: '#edf5eb', color: '#357025', border: '#bdd9b7' },
  'TechCrunch AI':         { label: 'Media',     bg: '#ebf0f9', color: '#27438a', border: '#bcc9ec' },
  'MIT Technology Review': { label: 'Research',  bg: '#f3f0fb', color: '#4f2fa8', border: '#cfc6f0' },
  'VentureBeat AI':        { label: 'Media',     bg: '#ebf0f9', color: '#27438a', border: '#bcc9ec' },
  'The Verge AI':          { label: 'Media',     bg: '#ebf0f9', color: '#27438a', border: '#bcc9ec' },
  'HackerNews AI':         { label: 'Community', bg: '#fdf5e8', color: '#7a5018', border: '#e8d3a0' },
  'Wired AI':              { label: 'Media',     bg: '#ebf0f9', color: '#27438a', border: '#bcc9ec' },
  'arXiv CS.AI':           { label: 'Research',  bg: '#f3f0fb', color: '#4f2fa8', border: '#cfc6f0' },
}

const TAG_COLORS = {
  'New Model':  { bg: '#fef0ec', color: '#c13d18', border: '#f5cec4' },
  'Research':   { bg: '#edf5eb', color: '#357025', border: '#bdd9b7' },
  'Industry':   { bg: '#ebf0f9', color: '#27438a', border: '#bcc9ec' },
  'Tool Drop':  { bg: '#fdf5e8', color: '#7a5018', border: '#e8d3a0' },
  'Policy':     { bg: '#f3f0fb', color: '#4f2fa8', border: '#cfc6f0' },
  'Opinion':    { bg: '#f3f0fb', color: '#4f2fa8', border: '#cfc6f0' },
}

const RSS_FEEDS = [
  { name: 'TechCrunch AI',         url: 'https://techcrunch.com/category/artificial-intelligence/feed/' },
  { name: 'HackerNews AI',         url: 'https://hnrss.org/frontpage?q=AI+OR+LLM+OR+machine+learning' },
  { name: 'MIT Technology Review', url: 'https://www.technologyreview.com/feed/' },
  { name: 'VentureBeat AI',        url: 'https://venturebeat.com/category/ai/feed/' },
  { name: 'The Verge AI',          url: 'https://www.theverge.com/rss/ai-artificial-intelligence/index.xml' },
  { name: 'Google DeepMind',       url: 'https://deepmind.google/blog/rss.xml' },
  { name: 'Wired AI',              url: 'https://www.wired.com/feed/tag/artificial-intelligence/latest/rss' },
]

// ── Fetch RSS ─────────────────────────────────────────────
async function fetchStories(maxPerFeed = 10) {
  const all = []
  for (const feed of RSS_FEEDS) {
    try {
      const parsed = await parser.parseURL(feed.url)
      for (const item of parsed.items.slice(0, maxPerFeed)) {
        all.push({
          source:      feed.name,
          title:       item.title || 'Untitled',
          description: (item.contentSnippet || item.summary || '').slice(0, 800),
          link:        item.link || '',
        })
      }
    } catch (e) { console.log(`⚠️ ${feed.name}: ${e.message}`) }
  }
  console.log(`📡 Fetched ${all.length} stories`)
  return all
}

// ── Deduplicate ───────────────────────────────────────────
function hashTitle(t) {
  let h = 0
  for (let i = 0; i < Math.min(t.length, 60); i++) { h = ((h << 5) - h) + t.charCodeAt(i); h |= 0 }
  return String(h)
}

async function filterSeen(stories) {
  try {
    const { data } = await supabase.from('sent_stories').select('title_hash')
    const seen = new Set(data.map(r => r.title_hash))
    const fresh = stories.filter(s => !seen.has(hashTitle(s.title)))
    console.log(`🔍 ${fresh.length} fresh stories`)
    return fresh
  } catch { return stories }
}

async function markSent(stories) {
  try {
    await supabase.from('sent_stories').insert(
      stories.map(s => ({ title_hash: hashTitle(s.title), sent_at: new Date().toISOString() }))
    )
  } catch (e) { console.log('⚠️ markSent:', e.message) }
}

// ── Groq — pick + summarise with all new fields ───────────
async function selectAndSummarise(stories) {
  const storiesText = stories.map((s, i) =>
    `[${i+1}] SOURCE: ${s.source}\nTITLE: ${s.title}\nDESC: ${s.description.slice(0, 300)}\nLINK: ${s.link}`
  ).join('\n\n')

  const prompt = `You are the editor of Neural Brief, a weekly AI news digest for Indian college students.

Here are ${stories.length} AI stories from this week:
${storiesText}

Pick the ${STORIES_COUNT} most important, interesting, and varied stories. Cover different categories.

Also pick ONE "biggest_move" — the single most important AI story of the week (a major launch, acquisition, or breakthrough).

Also pick ONE "jargon_of_week" — one AI/ML term that appeared in this week's stories. Explain it in one plain English sentence a student would understand.

For each of the ${STORIES_COUNT} stories write:
- tag: one of [New Model, Research, Industry, Tool Drop, Policy, Opinion]
- title: clean headline, max 12 words
- summary: 2-3 sentences, plain English, zero jargon, for students
- tldr: one punchy sentence starting with "-> TL;DR:"
- why_it_matters: one sentence — why should an Indian student/developer care about this specifically?
- tweet: ready-to-post Twitter/LinkedIn post, punchy, end with 2-3 hashtags. Max 280 chars.
- source: source name
- link: original link exactly

Return ONLY valid JSON, no markdown backticks:
{
  "biggest_move": {"title":"...","reason":"one sentence why this is the biggest move of the week","link":"..."},
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
  const result = JSON.parse(raw)
  console.log(`🧠 Groq selected ${result.stories.length} stories`)
  return result
}

// ── Build HTML email ──────────────────────────────────────
function buildHtml(result, issueNum, email) {
  const { stories, biggest_move, jargon_of_week } = result
  const dateStr = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
  }).toUpperCase()

  // Biggest Move banner
  const biggestMoveBanner = biggest_move ? `
<div style="margin:0 40px 0;padding:20px 24px;background:#18160f;border-radius:3px;">
  <div style="font-family:'Courier New',monospace;font-size:9px;color:rgba(255,255,255,.4);letter-spacing:.14em;text-transform:uppercase;margin-bottom:10px;">
    ★ Biggest move this week
  </div>
  <a href="${biggest_move.link}" style="text-decoration:none;">
    <div style="font-family:Georgia,serif;font-size:17px;font-weight:bold;color:#fff;margin-bottom:6px;line-height:1.3;">${biggest_move.title}</div>
  </a>
  <div style="font-size:12px;color:rgba(255,255,255,.5);line-height:1.6;">${biggest_move.reason}</div>
</div>
<div style="height:1px;background:#d6d0c2;margin:20px 40px 0;"></div>` : ''

  // Story blocks
  const storyBlocks = stories.map((story, i) => {
    const tag      = story.tag || 'Research'
    const colors   = TAG_COLORS[tag] || TAG_COLORS['Research']
    const srcLabel = SOURCE_LABELS[story.source]

    return `
<div style="padding:20px 0;border-bottom:1px solid #e8e3db;">

  <!-- Story header -->
  <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;flex-wrap:wrap;">
    <span style="font-family:'Courier New',monospace;font-size:11px;color:#bfb9aa;">#${String(i+1).padStart(2,'0')}</span>
    <span style="font-size:9px;font-family:'Courier New',monospace;padding:2px 8px;border-radius:1px;
      text-transform:uppercase;letter-spacing:.08em;font-weight:500;
      background:${colors.bg};color:${colors.color};border:1px solid ${colors.border};">${tag}</span>
    ${srcLabel ? `<span style="font-size:9px;font-family:'Courier New',monospace;padding:2px 8px;border-radius:1px;
      text-transform:uppercase;letter-spacing:.08em;font-weight:500;
      background:${srcLabel.bg};color:${srcLabel.color};border:1px solid ${srcLabel.border};">${srcLabel.label}</span>` : ''}
  </div>

  <!-- Title -->
  <a href="${story.link}" style="text-decoration:none;">
    <h2 style="font-family:Georgia,serif;font-size:17px;font-weight:bold;color:#18160f;margin:0 0 8px;line-height:1.3;">${story.title}</h2>
  </a>

  <!-- Summary -->
  <p style="font-size:13px;color:#5a5550;margin:0 0 6px;line-height:1.75;">${story.summary}</p>

  <!-- TL;DR -->
  <p style="font-size:11px;font-family:'Courier New',monospace;color:#c13d18;margin:0 0 8px;">${story.tldr}</p>

  <!-- Why it matters -->
  ${story.why_it_matters ? `
  <div style="background:#f4f1ea;border-left:3px solid #c13d18;padding:8px 12px;margin-bottom:8px;">
    <span style="font-family:'Courier New',monospace;font-size:9px;color:#9a938a;text-transform:uppercase;letter-spacing:.1em;">Why it matters → </span>
    <span style="font-size:12px;color:#5a5550;line-height:1.6;">${story.why_it_matters}</span>
  </div>` : ''}

  <!-- Source -->
  <p style="font-size:10px;color:#bfb9aa;margin:0 0 8px;">via ${story.source || 'Neural Brief'}</p>

  <!-- Tweet share -->
  ${story.tweet ? `
  <div style="background:#fafaf8;border:1px solid #e8e3db;border-radius:3px;padding:12px 14px;">
    <div style="font-family:'Courier New',monospace;font-size:9px;color:#9a938a;letter-spacing:.1em;text-transform:uppercase;margin-bottom:6px;">Share this story</div>
    <p style="font-size:12px;color:#18160f;line-height:1.6;margin:0 0 8px;">${story.tweet}</p>
    <a href="https://twitter.com/intent/tweet?text=${encodeURIComponent(story.tweet)}"
      style="display:inline-block;font-size:10px;font-family:'Courier New',monospace;color:#c13d18;text-decoration:none;border:1px solid #f5cec4;padding:3px 10px;border-radius:2px;margin-right:6px;">
      Post on X →
    </a>
    <a href="https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(story.link)}"
      style="display:inline-block;font-size:10px;font-family:'Courier New',monospace;color:#27438a;text-decoration:none;border:1px solid #bcc9ec;padding:3px 10px;border-radius:2px;">
      Post on LinkedIn →
    </a>
  </div>` : ''}

</div>`
  }).join('')

  // Jargon of the week
  const jargonBlock = jargon_of_week ? `
<div style="margin:0 40px;padding:20px 24px;background:#f4f1ea;border:1px solid #d6d0c2;border-radius:3px;">
  <div style="font-family:'Courier New',monospace;font-size:9px;color:#9a938a;letter-spacing:.14em;text-transform:uppercase;margin-bottom:10px;">
    📖 Jargon of the week
  </div>
  <span style="font-family:Georgia,serif;font-size:16px;font-weight:bold;color:#18160f;">${jargon_of_week.term}</span>
  <p style="font-size:13px;color:#5a5550;margin:6px 0 0;line-height:1.7;">${jargon_of_week.explanation}</p>
</div>` : ''

  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Neural Brief #${issueNum}</title></head>
<body style="margin:0;padding:0;background:#f4f1ea;font-family:'Helvetica Neue',Helvetica,sans-serif;">
<div style="max-width:620px;margin:32px auto;background:#fff;border:1px solid #d6d0c2;">

  <!-- Masthead -->
  <div style="text-align:center;padding:32px 40px 20px;border-bottom:3px double #d6d0c2;">
    <div style="font-family:Georgia,serif;font-size:38px;font-weight:bold;color:#18160f;letter-spacing:-.02em;line-height:1;">
      Neural <span style="color:#c13d18;">Brief</span>
    </div>
    <div style="font-family:'Courier New',monospace;font-size:9px;color:#9a938a;letter-spacing:.1em;text-transform:uppercase;margin-top:6px;">
      THIS WEEK IN AI &middot; ISSUE #${issueNum} &middot; ${dateStr}
    </div>
  </div>

  <!-- Meta bar -->
  <div style="display:flex;justify-content:space-between;padding:10px 40px;background:#f4f1ea;border-bottom:1px solid #d6d0c2;font-family:'Courier New',monospace;font-size:10px;color:#9a938a;">
    <span>${stories.length} stories</span>
    <span>~${stories.length} min read</span>
    <span>neural-brief-eight.vercel.app</span>
  </div>

  <!-- Biggest Move -->
  ${biggestMoveBanner}

  <!-- Stories -->
  <div style="padding:8px 40px 28px;">${storyBlocks}</div>

  <!-- Jargon of the week -->
  ${jargonBlock}

  <!-- Footer -->
  <div style="background:#18160f;padding:24px 40px;text-align:center;margin-top:28px;font-family:'Courier New',monospace;font-size:10px;color:rgba(255,255,255,.3);line-height:1.9;">
    <div style="color:rgba(255,255,255,.65);font-size:14px;font-family:Georgia,serif;margin-bottom:6px;">
      Neural <span style="color:#c13d18;">Brief</span>
    </div>
    Weekly AI news for students &middot; Free forever &middot; Every Friday<br>
    <a href="${WEBSITE}/api/unsubscribe?email=${email}" style="color:rgba(255,255,255,.25);text-decoration:none;">Unsubscribe</a>
    &nbsp;&middot;&nbsp;
    <a href="${WEBSITE}" style="color:rgba(255,255,255,.25);text-decoration:none;">Website</a>
  </div>

</div>
</body>
</html>`
}

// ── Get subscribers ───────────────────────────────────────
async function getSubscribers() {
  const { data } = await supabase.from('subscribers').select('email').eq('confirmed', true)
  console.log(`📬 ${data.length} subscribers`)
  return data.map(r => r.email)
}

// ── Issue number ──────────────────────────────────────────
async function nextIssue() {
  try {
    const { data } = await supabase.from('config').select('value').eq('key', 'issue_number')
    if (data && data.length > 0) {
      const n = parseInt(data[0].value) + 1
      await supabase.from('config').update({ value: String(n) }).eq('key', 'issue_number')
      return n
    }
    await supabase.from('config').insert({ key: 'issue_number', value: '1' })
    return 1
  } catch { return 1 }
}

// ── Main handler ──────────────────────────────────────────
export default async function handler(req, res) {
  const authHeader = req.headers['authorization']
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  console.log('🧠 Neural Brief — Weekly digest starting')

  try {
    const stories  = await fetchStories(10)
    if (!stories.length) return res.status(500).json({ error: 'No stories fetched' })

    const fresh    = await filterSeen(stories)
    const result   = await selectAndSummarise(fresh.length >= STORIES_COUNT ? fresh : stories)

    const issueNum = await nextIssue()
    const subject  = `Neural Brief #${issueNum} — This week in AI 🧠`

    const subscribers = await getSubscribers()
    if (!subscribers.length) return res.status(200).json({ message: 'No subscribers yet' })

    // Save to archive in Supabase
    try {
      await supabase.from('digest_archive').insert({
        issue_num:   issueNum,
        stories:     result.stories,
        biggest_move: result.biggest_move,
        jargon:      result.jargon_of_week,
        created_at:  new Date().toISOString(),
      })
    } catch (e) { console.log('⚠️ Archive save skipped:', e.message) }

    let sent = 0, failed = 0
    for (const email of subscribers) {
      try {
        const html = buildHtml(result, issueNum, email)
        await transporter.sendMail({ from: FROM_EMAIL, to: email, replyTo: REPLY_TO, subject, html })
        sent++
      } catch (e) { failed++; console.log(`❌ ${email}: ${e.message}`) }
    }

    await markSent(result.stories)

    console.log(`✅ Done! Sent: ${sent} | Failed: ${failed}`)
    return res.status(200).json({ success: true, sent, failed, issue: issueNum })

  } catch (err) {
    console.error('❌ Digest error:', err)
    return res.status(500).json({ error: err.message })
  }
}