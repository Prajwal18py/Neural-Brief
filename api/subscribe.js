// api/subscribe.js
// Vercel Serverless Function
// Runs on SERVER — all keys safe, never exposed to browser
//
// What it does:
// 1. Receives email from React frontend
// 2. Saves to Supabase
// 3. Sends welcome email via Brevo SMTP instantly

import { createClient } from '@supabase/supabase-js'
import nodemailer from 'nodemailer'

// ── Supabase client (service_role key — full access) ──────
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
)

// ── Brevo SMTP transporter ────────────────────────────────
const transporter = nodemailer.createTransport({
  host: 'smtp-relay.brevo.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.BREVO_SMTP_LOGIN,
    pass: process.env.BREVO_SMTP_KEY,
  },
})

// ── Welcome email HTML ────────────────────────────────────
function buildWelcomeEmail() {
  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Welcome to Neural Brief</title></head>
<body style="margin:0;padding:0;background:#f4f1ea;font-family:'Helvetica Neue',Helvetica,sans-serif;">

<div style="max-width:600px;margin:32px auto;background:#fff;border:1px solid #d6d0c2;">

  <!-- Masthead -->
  <div style="text-align:center;padding:32px 40px 20px;border-bottom:3px double #d6d0c2;">
    <div style="font-family:Georgia,'Times New Roman',serif;font-size:38px;font-weight:bold;
      color:#18160f;letter-spacing:-.02em;line-height:1;">
      Neural <span style="color:#c13d18;">Brief</span>
    </div>
    <div style="font-family:'Courier New',monospace;font-size:9px;color:#9a938a;
      letter-spacing:.1em;text-transform:uppercase;margin-top:5px;">
      WELCOME TO THE BRIEF
    </div>
  </div>

  <!-- Welcome message -->
  <div style="padding:36px 40px;">

    <h2 style="font-family:Georgia,serif;font-size:24px;font-weight:bold;
      color:#18160f;margin:0 0 16px;letter-spacing:-.01em;">
      You're officially in. 🎉
    </h2>

    <p style="font-size:15px;color:#6b6560;line-height:1.8;margin:0 0 20px;font-weight:300;">
      Welcome to <strong style="color:#18160f;">Neural Brief</strong> — your daily dose of AI news, 
      summarised in plain English. No jargon, no hype, just the 5 stories worth knowing.
    </p>

    <div style="background:#18160f;border-radius:3px;padding:24px 28px;margin:0 0 24px;">
      <p style="font-family:'Courier New',monospace;font-size:9px;color:rgba(255,255,255,.35);
        letter-spacing:.14em;text-transform:uppercase;margin:0 0 16px;">
        WHAT TO EXPECT
      </p>
      ${[
        ['📡', 'Real AI news', 'Fetched fresh every Friday from 7+ top sources'],
        ['🧠', 'AI summarised', 'Groq\'s Llama 3.3 70B picks the best 5 and writes plain English summaries'],
        ['⏰', 'Every Friday at 9am IST', 'Lands in your inbox every Friday morning — start your weekend informed'],
        ['₹0', 'Free forever', 'No credit card, no trial, no catch'],
      ].map(([icon, title, desc]) => `
      <div style="display:flex;gap:14px;margin-bottom:16px;align-items:flex-start;">
        <span style="font-size:18px;flex-shrink:0;">${icon}</span>
        <div>
          <div style="font-size:13px;font-weight:500;color:#fff;margin-bottom:3px;">${title}</div>
          <div style="font-size:12px;color:rgba(255,255,255,.4);line-height:1.6;">${desc}</div>
        </div>
      </div>`).join('')}
    </div>

    <p style="font-size:14px;color:#6b6560;line-height:1.8;margin:0 0 8px;font-style:italic;">
      Your first digest arrives tomorrow morning at 9am IST. Until then, tell a friend about Neural Brief 👇
    </p>

    <a href="https://neural-brief-eight.vercel.app" 
      style="display:inline-block;margin-top:16px;background:#c13d18;color:#fff;
      font-family:'Helvetica Neue',sans-serif;font-size:13px;font-weight:500;
      padding:11px 22px;border-radius:3px;text-decoration:none;">
      Share Neural Brief →
    </a>
  </div>

  <!-- Footer -->
  <div style="background:#18160f;padding:24px 40px;text-align:center;
    font-family:'Courier New',monospace;font-size:10px;color:rgba(255,255,255,.3);line-height:1.9;">
    <div style="color:rgba(255,255,255,.65);font-family:Georgia,serif;font-size:13px;margin-bottom:6px;">
      Neural <span style="color:#c13d18;">Brief</span>
    </div>
    Weekly AI news for students · Free forever<br>
    You're receiving this because you subscribed at Neural Brief.<br>
    <a href="https://neural-brief-eight.vercel.app/api/unsubscribe?email=${email}" style="color:rgba(255,255,255,.25);text-decoration:none;">Unsubscribe</a>
    &nbsp;·&nbsp;
    <a href="https://neural-brief-eight.vercel.app" style="color:rgba(255,255,255,.25);text-decoration:none;">Website</a>
  </div>

</div>
</body></html>`
}

// ── Main handler ──────────────────────────────────────────
export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { email } = req.body

  // Validate email
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Invalid email' })
  }

  try {
    // ── 1. Save to Supabase ─────────────────────────────
    const { error: dbError } = await supabase
      .from('subscribers')
      .insert([{ email, confirmed: true }])

    if (dbError) {
      // Duplicate email — already subscribed, still send welcome
      if (dbError.code !== '23505') {
        throw new Error(dbError.message)
      }
    }

    // ── 2. Send welcome email via Brevo ─────────────────
    await transporter.sendMail({
      from: `Neural Brief <${process.env.BREVO_SMTP_LOGIN}>`,
      to: email,
      replyTo: process.env.BREVO_SMTP_LOGIN,
      subject: 'Welcome to Neural Brief 🧠 — You\'re in!',
      html: buildWelcomeEmail(),
    })

    return res.status(200).json({ success: true })

  } catch (err) {
    console.error('Subscribe error:', err)
    return res.status(500).json({ error: 'Something went wrong' })
  }
}