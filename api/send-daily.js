// api/send-daily.js
// Triggered daily via GitHub Actions cron at 9am IST (3:30 UTC)
// Sends a lightweight Top 5 email to subscribers who opted in to daily emails

import { createClient } from '@supabase/supabase-js'
import nodemailer from 'nodemailer'

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)

const transporter = nodemailer.createTransport({
  host: 'smtp-relay.brevo.com',
  port: 587,
  secure: false,
  auth: { user: process.env.BREVO_SMTP_LOGIN, pass: process.env.BREVO_SMTP_KEY },
})

const FROM_EMAIL = `Neural Brief <${process.env.BREVO_FROM_EMAIL}>`
const REPLY_TO   = process.env.BREVO_FROM_EMAIL
const WEBSITE    = 'https://neural-brief-eight.vercel.app'

// ── Get opted-in subscribers ──────────────────────────────
async function getDailySubscribers() {
  const { data, error } = await supabase
    .from('subscribers')
    .select('email')
    .eq('confirmed', true)
    .eq('daily_optin', true)

  if (error) throw new Error(error.message)
  console.log(`📬 ${data.length} daily subscribers`)
  return data
}

// ── Get live feed from cache ──────────────────────────────
async function getLiveStories() {
  const { data } = await supabase
    .from('live_feed_cache')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)

  if (data && data.length > 0 && data[0].stories) {
    return data[0].stories.slice(0, 5)
  }
  return null
}

// ── Build daily email HTML ────────────────────────────────
function buildDailyEmail(stories, email) {
  const dateStr = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
  }).toUpperCase()

  const storyRows = stories.map((story, i) => {
    let domain = ''
    try { domain = new URL(story.link).hostname } catch {}
    const faviconUrl = domain ? `https://www.google.com/s2/favicons?domain=${domain}&sz=16` : ''
    const why = story.why || ''

    return `
<tr>
  <td style="padding:16px 0;border-bottom:1px solid #e8e3db;">
    <div style="display:flex;align-items:flex-start;gap:12px;">
      <span style="font-family:'Courier New',monospace;font-size:11px;color:#c4bdb0;flex-shrink:0;padding-top:3px;">${String(i+1).padStart(2,'0')}</span>
      <div style="flex:1;">
        <div style="margin-bottom:4px;">
          ${faviconUrl ? `<img src="${faviconUrl}" width="14" height="14" style="border-radius:3px;vertical-align:middle;margin-right:5px;" />` : ''}
          <a href="${story.link}" style="font-family:Georgia,serif;font-size:15px;font-weight:bold;color:#18160f;text-decoration:none;line-height:1.4;">
            ${story.title}
          </a>
        </div>
        ${why ? `<p style="font-family:'Courier New',monospace;font-size:10px;color:#c13d18;margin:4px 0 4px;line-height:1.5;">→ ${why}</p>` : ''}
        <p style="font-size:10px;font-family:'Courier New',monospace;color:#a09890;margin:0;">via ${story.source}</p>
      </div>
      <a href="${story.link}" style="font-size:14px;color:#c4bdb0;text-decoration:none;flex-shrink:0;padding-top:3px;">→</a>
    </div>
  </td>
</tr>`
  }).join('')

  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f4f1ea;font-family:'Helvetica Neue',Helvetica,sans-serif;">
<div style="max-width:560px;margin:28px auto;background:#fff;border:1px solid #d6d0c2;">

  <!-- Masthead -->
  <div style="text-align:center;padding:24px 40px 16px;border-bottom:3px double #d6d0c2;">
    <div style="font-family:Georgia,serif;font-size:30px;font-weight:bold;color:#18160f;letter-spacing:-.02em;line-height:1;">
      Neural <span style="color:#c13d18;">Brief</span>
    </div>
    <div style="font-family:'Courier New',monospace;font-size:9px;color:#9a938a;letter-spacing:.1em;text-transform:uppercase;margin-top:5px;">
      DAILY TOP 5 · ${dateStr}
    </div>
    <div style="font-family:Georgia,serif;font-size:13px;color:#5a5550;font-style:italic;margin-top:8px;">
      Your 2-minute AI update — only what actually matters.
    </div>
  </div>

  <!-- Meta bar -->
  <div style="padding:8px 40px;background:#f4f1ea;border-bottom:1px solid #d6d0c2;font-family:'Courier New',monospace;font-size:10px;color:#9a938a;display:flex;justify-content:space-between;">
    <span>5 stories · ~2 min read</span>
    <span>Updated today</span>
  </div>

  <!-- Stories -->
  <div style="padding:0 40px;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      ${storyRows}
    </table>
  </div>

  <!-- CTA -->
  <div style="padding:20px 40px;text-align:center;border-top:1px solid #e8e3db;">
    <a href="${WEBSITE}#this-week"
      style="display:inline-block;background:#c13d18;color:#fff;font-family:'Helvetica Neue',sans-serif;font-size:12px;font-weight:500;padding:9px 20px;border-radius:3px;text-decoration:none;">
      See what everyone's building this week →
    </a>
  </div>

  <!-- Footer -->
  <div style="background:#18160f;padding:18px 40px;text-align:center;font-family:'Courier New',monospace;font-size:10px;color:rgba(255,255,255,.3);line-height:1.9;">
    <div style="color:rgba(255,255,255,.8);font-family:Georgia,serif;font-size:13px;margin-bottom:4px;">
      Neural <span style="color:#c13d18;">Brief</span>
    </div>
    2 min daily · Free forever · 9am IST<br>
    <a href="${WEBSITE}/api/unsubscribe?email=${email}" style="color:rgba(255,255,255,.4);text-decoration:none;">Unsubscribe</a>
    &nbsp;·&nbsp;
    <a href="${WEBSITE}" style="color:rgba(255,255,255,.4);text-decoration:none;">Website</a>
  </div>

</div>
</body>
</html>`
}

// ── Main handler ──────────────────────────────────────────
export default async function handler(req, res) {
  const authHeader   = req.headers['authorization']
  const cronHeader   = req.headers['x-vercel-cron']
  const isVercelCron = cronHeader === '1'
  const isManual     = authHeader === `Bearer ${process.env.CRON_SECRET}`

  if (!isVercelCron && !isManual) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  console.log('⚡ Neural Brief Daily — starting')

  try {
    const stories = await getLiveStories()
    if (!stories || stories.length === 0) {
      return res.status(200).json({ message: 'No live stories in cache — skipping' })
    }

    const subscribers = await getDailySubscribers()
    if (!subscribers.length) {
      return res.status(200).json({ message: 'No daily subscribers yet' })
    }

    const dateStr = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'long' })
    const subject = `⚡ Neural Brief Daily — Top 5 AI stories · ${dateStr}`

    let sent = 0, failed = 0
    for (const sub of subscribers) {
      try {
        const html = buildDailyEmail(stories, sub.email)
        await transporter.sendMail({ from: FROM_EMAIL, to: sub.email, replyTo: REPLY_TO, subject, html })
        sent++
      } catch (e) {
        failed++
        console.log(`❌ ${sub.email}: ${e.message}`)
      }
    }

    console.log(`✅ Daily sent: ${sent} | Failed: ${failed}`)
    return res.status(200).json({ success: true, sent, failed })

  } catch (err) {
    console.error('❌ Daily digest error:', err)
    return res.status(500).json({ error: err.message })
  }
}