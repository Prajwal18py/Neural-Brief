// api/subscribe.js
// 1. Saves email to Supabase
// 2. Sends welcome email instantly
// 3. Fetches this week's digest from cache + sends it immediately
//    (so new subscribers don't wait until Friday)

import { createClient } from '@supabase/supabase-js'
import nodemailer from 'nodemailer'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
)

const transporter = nodemailer.createTransport({
  host: 'smtp-relay.brevo.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.BREVO_SMTP_LOGIN,
    pass: process.env.BREVO_SMTP_KEY,
  },
})

const WEBSITE     = 'https://neural-brief-eight.vercel.app'
const FROM_EMAIL  = `Neural Brief <${process.env.BREVO_FROM_EMAIL}>`
const REPLY_TO    = process.env.BREVO_FROM_EMAIL

const TAG_COLORS = {
  'New Model':  { bg: '#fef0ec', color: '#c13d18', border: '#f5cec4' },
  'Research':   { bg: '#edf5eb', color: '#357025', border: '#bdd9b7' },
  'Industry':   { bg: '#ebf0f9', color: '#27438a', border: '#bcc9ec' },
  'Tool Drop':  { bg: '#fdf5e8', color: '#7a5018', border: '#e8d3a0' },
  'Policy':     { bg: '#f3f0fb', color: '#4f2fa8', border: '#cfc6f0' },
  'Opinion':    { bg: '#f3f0fb', color: '#4f2fa8', border: '#cfc6f0' },
}

const SOURCE_LABELS = {
  'Google DeepMind':       { label: 'Official',  bg: '#edf5eb', color: '#357025', border: '#bdd9b7' },
  'OpenAI Blog':           { label: 'Official',  bg: '#edf5eb', color: '#357025', border: '#bdd9b7' },
  'Anthropic News':        { label: 'Official',  bg: '#edf5eb', color: '#357025', border: '#bdd9b7' },
  'TechCrunch AI':         { label: 'Media',     bg: '#ebf0f9', color: '#27438a', border: '#bcc9ec' },
  'MIT Technology Review': { label: 'Research',  bg: '#f3f0fb', color: '#4f2fa8', border: '#cfc6f0' },
  'HackerNews AI':         { label: 'Community', bg: '#fdf5e8', color: '#7a5018', border: '#e8d3a0' },
  'Wired AI':              { label: 'Media',     bg: '#ebf0f9', color: '#27438a', border: '#bcc9ec' },
  'Import AI':             { label: 'Research',  bg: '#f3f0fb', color: '#4f2fa8', border: '#cfc6f0' },
  'Analytics India':       { label: 'India',     bg: '#fff3e0', color: '#e65100', border: '#ffcc80' },
  'Reuters Tech':          { label: 'Media',     bg: '#ebf0f9', color: '#27438a', border: '#bcc9ec' },
  'Ars Technica AI':       { label: 'Media',     bg: '#ebf0f9', color: '#27438a', border: '#bcc9ec' },
  'ZDNet AI':              { label: 'Media',     bg: '#ebf0f9', color: '#27438a', border: '#bcc9ec' },
  'Mashable Tech':         { label: 'Media',     bg: '#ebf0f9', color: '#27438a', border: '#bcc9ec' },
}

// ── Welcome email ─────────────────────────────────────────
function buildWelcomeEmail(email) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f4f1ea;font-family:'Helvetica Neue',Helvetica,sans-serif;">
<div style="max-width:600px;margin:32px auto;background:#fff;border:1px solid #d6d0c2;">

  <div style="text-align:center;padding:32px 40px 20px;border-bottom:3px double #d6d0c2;">
    <div style="font-family:Georgia,serif;font-size:38px;font-weight:bold;color:#18160f;letter-spacing:-.02em;line-height:1;">
      Neural <span style="color:#c13d18;">Brief</span>
    </div>
    <div style="font-family:'Courier New',monospace;font-size:9px;color:#9a938a;letter-spacing:.1em;text-transform:uppercase;margin-top:5px;">
      WELCOME TO THE BRIEF
    </div>
  </div>

  <div style="padding:36px 40px;">
    <h2 style="font-family:Georgia,serif;font-size:24px;font-weight:bold;color:#18160f;margin:0 0 16px;">
      You're officially in. 🎉
    </h2>
    <p style="font-size:15px;color:#5a5550;line-height:1.8;margin:0 0 20px;">
      Welcome to <strong style="color:#18160f;">Neural Brief</strong> — your weekly dose of AI news, 
      filtered for humans. No jargon, no hype, just the <strong style="color:#18160f;">15 stories worth knowing</strong>.
    </p>

    <div style="background:#18160f;border-radius:3px;padding:24px 28px;margin:0 0 24px;">
      <p style="font-family:'Courier New',monospace;font-size:9px;color:rgba(255,255,255,.35);letter-spacing:.14em;text-transform:uppercase;margin:0 0 16px;">
        WHAT TO EXPECT
      </p>
      ${[
        ['📡', 'Real AI news', 'Fetched fresh every Friday from 7+ top sources'],
        ['🧠', 'AI summarised', "Groq's Llama 3.3 70B picks the best 15 stories and writes plain English summaries"],
        ['🇮🇳', 'Why it matters', 'Every story has India-specific context — why you as a student should care'],
        ['⏰', 'Every Friday at 9am IST', 'Lands in your inbox every Friday — read it over chai in 3 minutes'],
        ['₹0', 'Free forever', 'No credit card, no trial, no catch'],
      ].map(([icon, title, desc]) => `
      <div style="display:flex;gap:14px;margin-bottom:14px;align-items:flex-start;">
        <span style="font-size:18px;flex-shrink:0;">${icon}</span>
        <div>
          <div style="font-size:13px;font-weight:500;color:#fff;margin-bottom:3px;">${title}</div>
          <div style="font-size:12px;color:rgba(255,255,255,.4);line-height:1.6;">${desc}</div>
        </div>
      </div>`).join('')}
    </div>

    <p style="font-size:14px;color:#5a5550;line-height:1.8;margin:0 0 16px;font-style:italic;">
      🎁 <strong style="color:#18160f;">Bonus:</strong> This week's AI digest is on its way to your inbox right now!
    </p>

    <a href="${WEBSITE}" style="display:inline-block;background:#c13d18;color:#fff;
      font-family:'Helvetica Neue',sans-serif;font-size:13px;font-weight:500;
      padding:11px 22px;border-radius:3px;text-decoration:none;">
      Share Neural Brief →
    </a>
  </div>

  <div style="background:#18160f;padding:24px 40px;text-align:center;font-family:'Courier New',monospace;font-size:10px;color:rgba(255,255,255,.3);line-height:1.9;">
    <div style="color:rgba(255,255,255,.65);font-family:Georgia,serif;font-size:13px;margin-bottom:6px;">
      Neural <span style="color:#c13d18;">Brief</span>
    </div>
    Weekly AI news for students · Free forever · Every Friday<br>
    <a href="${WEBSITE}/api/unsubscribe?email=${email}" style="color:rgba(255,255,255,.25);text-decoration:none;">Unsubscribe</a>
    &nbsp;·&nbsp;
    <a href="${WEBSITE}" style="color:rgba(255,255,255,.25);text-decoration:none;">Website</a>
  </div>

</div>
</body></html>`
}

// ── Build digest email from cached stories ────────────────
function buildDigestEmail(data, briefNum, email, persona = '') {
  const { stories, biggest_move, jargon_of_week } = data
  const dateStr = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
  }).toUpperCase()

  const biggestBanner = biggest_move ? `
<div style="margin:0 40px 0;padding:20px 24px;background:#18160f;border-radius:3px;">
  <div style="font-family:'Courier New',monospace;font-size:9px;color:rgba(255,255,255,.4);letter-spacing:.14em;text-transform:uppercase;margin-bottom:10px;">
    🔥 Biggest move this week
  </div>
  <a href="${biggest_move.link}" style="text-decoration:none;">
    <div style="font-family:Georgia,serif;font-size:17px;font-weight:bold;color:#fff;margin-bottom:6px;line-height:1.3;">${biggest_move.title}</div>
  </a>
  <div style="font-size:12px;color:rgba(255,255,255,.5);line-height:1.6;">${biggest_move.reason}</div>
</div>
<div style="height:1px;background:#d6d0c2;margin:20px 40px 0;"></div>` : ''

  const storyBlocks = stories.map((story, i) => {
    const tag      = story.tag || 'Research'
    const colors   = TAG_COLORS[tag] || TAG_COLORS['Research']
    const srcLabel = SOURCE_LABELS[story.source]

    const whyKey   = persona === 'Developer' ? 'why_developer' : persona === 'Founder' ? 'why_founder' : 'why_student'
    const whyText  = story[whyKey] || story.why_student || story.why_developer || ''
    const whyLabel = persona === 'Developer' ? 'Why devs care →' : persona === 'Founder' ? 'Why founders care →' : 'Why students care →'

    return `
<div style="padding:20px 0;border-bottom:1px solid #e8e3db;">
  <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;flex-wrap:wrap;">
    <span style="font-family:'Courier New',monospace;font-size:11px;color:#bfb9aa;">#${String(i+1).padStart(2,'0')}</span>
    <span style="font-size:9px;font-family:'Courier New',monospace;padding:2px 8px;border-radius:1px;
      text-transform:uppercase;letter-spacing:.08em;font-weight:500;
      background:${colors.bg};color:${colors.color};border:1px solid ${colors.border};">${tag}</span>
    ${srcLabel ? `<span style="font-size:9px;font-family:'Courier New',monospace;padding:2px 8px;border-radius:1px;
      text-transform:uppercase;letter-spacing:.08em;font-weight:500;
      background:${srcLabel.bg};color:${srcLabel.color};border:1px solid ${srcLabel.border};">${srcLabel.label}</span>` : ''}
  </div>
  <a href="${story.link}" style="text-decoration:none;">
    <h2 style="font-family:Georgia,serif;font-size:17px;font-weight:bold;color:#18160f;margin:0 0 8px;line-height:1.3;">${story.title}</h2>
  </a>
  <p style="font-size:13px;color:#5a5550;margin:0 0 6px;line-height:1.75;">${story.summary}</p>
  <p style="font-size:11px;font-family:'Courier New',monospace;color:#c13d18;margin:0 0 8px;">${story.tldr}</p>
  ${whyText ? `
  <div style="background:#f4f1ea;border-left:3px solid #c13d18;padding:8px 12px;margin-bottom:8px;">
    <span style="font-family:'Courier New',monospace;font-size:9px;color:#9a938a;text-transform:uppercase;letter-spacing:.1em;">${whyLabel} </span>
    <span style="font-size:12px;color:#5a5550;line-height:1.6;">${whyText}</span>
  </div>` : ''}
  <p style="font-size:10px;color:#bfb9aa;margin:0;">via ${story.source || 'Neural Brief'}</p>
</div>`
  }).join('')

  const jargonBlock = jargon_of_week ? `
<div style="margin:0 40px 28px;padding:20px 24px;background:#f4f1ea;border:1px solid #d6d0c2;border-radius:3px;">
  <div style="font-family:'Courier New',monospace;font-size:9px;color:#9a938a;letter-spacing:.14em;text-transform:uppercase;margin-bottom:10px;">
    📖 Jargon of the week
  </div>
  <span style="font-family:Georgia,serif;font-size:16px;font-weight:bold;color:#18160f;">${jargon_of_week.term}</span>
  <p style="font-size:13px;color:#5a5550;margin:6px 0 0;line-height:1.7;">${jargon_of_week.explanation}</p>
</div>` : ''

  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f4f1ea;font-family:'Helvetica Neue',Helvetica,sans-serif;">
<div style="max-width:620px;margin:32px auto;background:#fff;border:1px solid #d6d0c2;">

  <div style="text-align:center;padding:32px 40px 20px;border-bottom:3px double #d6d0c2;">
    <div style="font-family:Georgia,serif;font-size:38px;font-weight:bold;color:#18160f;letter-spacing:-.02em;line-height:1;">
      Neural <span style="color:#c13d18;">Brief</span>
    </div>
    <div style="font-family:'Courier New',monospace;font-size:9px;color:#9a938a;letter-spacing:.1em;text-transform:uppercase;margin-top:6px;">
      THIS WEEK IN AI &middot; BRIEF #${briefNum} &middot; ${dateStr}
    </div>
  </div>

  <div style="display:flex;justify-content:space-between;padding:10px 40px;background:#f4f1ea;border-bottom:1px solid #d6d0c2;font-family:'Courier New',monospace;font-size:10px;color:#9a938a;">
    <span>${stories.length} stories</span>
    <span>~3 min read</span>
    <span>neural-brief-eight.vercel.app</span>
  </div>

  ${biggestBanner}
  <div style="padding:8px 40px 28px;">${storyBlocks}</div>
  ${jargonBlock}

  <div style="background:#18160f;padding:24px 40px;text-align:center;font-family:'Courier New',monospace;font-size:10px;color:rgba(255,255,255,.3);line-height:1.9;">
    <div style="color:rgba(255,255,255,.65);font-size:14px;font-family:Georgia,serif;margin-bottom:6px;">
      Neural <span style="color:#c13d18;">Brief</span>
    </div>
    Weekly AI news for students &middot; Free forever &middot; Every Friday<br>
    <a href="${WEBSITE}/api/unsubscribe?email=${email}" style="color:rgba(255,255,255,.25);text-decoration:none;">Unsubscribe</a>
    &nbsp;&middot;&nbsp;
    <a href="${WEBSITE}" style="color:rgba(255,255,255,.25);text-decoration:none;">Website</a>
  </div>

</div>
</body></html>`
}

// ── Get cached digest from Supabase ───────────────────────
// Returns cached digest only if it is less than 3 days old
// If older than 3 days — subscriber will just wait for next Friday
async function getCachedDigest() {
  try {
    const { data } = await supabase
      .from('digest_cache')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)

    if (data && data.length > 0 && data[0].data) {
      const ageMs  = Date.now() - new Date(data[0].created_at).getTime()
      const ageDays = ageMs / (1000 * 60 * 60 * 24)

      if (ageDays > 3) {
        console.log(`⚠️ Cache is ${ageDays.toFixed(1)} days old — too stale, skipping digest send`)
        return null
      }

      console.log(`✅ Cache is ${ageDays.toFixed(1)} days old — fresh enough, sending digest`)
      return data[0].data
    }
    return null
  } catch (e) {
    console.log('⚠️ Cache fetch failed:', e.message)
    return null
  }
}

// ── Get latest brief number ───────────────────────────────
async function getIssueNum() {
  try {
    const { data } = await supabase.from('config').select('value').eq('key', 'brief_number')
    if (data && data.length > 0) return parseInt(data[0].value)
    return 1
  } catch { return 1 }
}

// ── Main handler ──────────────────────────────────────────
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { email, persona, daily_optin } = req.body

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Invalid email' })
  }

  try {
    // 1. Save to Supabase
    const { error: dbError } = await supabase
      .from('subscribers')
      .insert([{ email, confirmed: true, persona: persona || null, daily_optin: daily_optin || false }])

    if (dbError && dbError.code !== '23505') {
      throw new Error(dbError.message)
    }

    // 2. Send welcome email
    await transporter.sendMail({
      from:    FROM_EMAIL,
      to:      email,
      replyTo: REPLY_TO,
      subject: "Welcome to Neural Brief 🧠 — You're in!",
      html:    buildWelcomeEmail(email),
    })
    console.log('✅ Welcome email sent to:', email)

    // 3. Send this week's digest from cache (non-blocking)
    // Don't await — let it send in background so subscribe is instant
    getCachedDigest().then(async (cached) => {
      if (!cached || !cached.stories) {
        console.log('⚠️ No cached digest found — skipping digest send')
        return
      }
      try {
        const briefNum = await getIssueNum()
        const html     = buildDigestEmail(cached, briefNum, email, persona || '')
        await transporter.sendMail({
          from:    FROM_EMAIL,
          to:      email,
          replyTo: REPLY_TO,
          subject: `Neural Brief #${briefNum} — This week in AI 🧠 (Your welcome issue)`,
          html,
        })
        console.log('✅ Welcome digest sent to:', email)
      } catch (e) {
        // Digest send failed — that's ok, welcome email already sent
        console.log('⚠️ Welcome digest failed (non-critical):', e.message)
      }
    })

    return res.status(200).json({ success: true })

  } catch (err) {
    console.error('Subscribe error:', err)
    return res.status(500).json({ error: 'Something went wrong' })
  }
}