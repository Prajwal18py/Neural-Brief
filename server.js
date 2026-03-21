import express from 'express'
import { createClient } from '@supabase/supabase-js'
import nodemailer from 'nodemailer'
import { config } from 'dotenv'

config()

const app = express()
app.use(express.json())

console.log('🔑 SUPABASE_URL:', process.env.SUPABASE_URL ? '✅ found' : '❌ MISSING')
console.log('🔑 SUPABASE_KEY:', process.env.SUPABASE_KEY ? '✅ found' : '❌ MISSING')
console.log('🔑 BREVO_SMTP_LOGIN:', process.env.BREVO_SMTP_LOGIN ? '✅ found' : '❌ MISSING')
console.log('🔑 BREVO_SMTP_KEY:', process.env.BREVO_SMTP_KEY ? '✅ found' : '❌ MISSING')

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

const WEBSITE = 'https://neural-brief-eight.vercel.app'

function buildWelcomeEmail() {
  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f4f1ea;font-family:'Helvetica Neue',sans-serif;">
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
      summarised in plain English. No jargon, no hype, just the 15 stories worth knowing.
    </p>

    <div style="background:#18160f;border-radius:3px;padding:24px 28px;margin:0 0 24px;">
      <p style="font-family:'Courier New',monospace;font-size:9px;color:rgba(255,255,255,.35);letter-spacing:.14em;text-transform:uppercase;margin:0 0 16px;">
        WHAT TO EXPECT
      </p>
      <div style="display:flex;gap:14px;margin-bottom:14px;align-items:flex-start;">
        <span style="font-size:18px;flex-shrink:0;">📡</span>
        <div>
          <div style="font-size:13px;font-weight:500;color:#fff;margin-bottom:3px;">Real AI news</div>
          <div style="font-size:12px;color:rgba(255,255,255,.4);line-height:1.6;">Fetched fresh every Friday from 7+ top sources</div>
        </div>
      </div>
      <div style="display:flex;gap:14px;margin-bottom:14px;align-items:flex-start;">
        <span style="font-size:18px;flex-shrink:0;">🧠</span>
        <div>
          <div style="font-size:13px;font-weight:500;color:#fff;margin-bottom:3px;">AI summarised</div>
          <div style="font-size:12px;color:rgba(255,255,255,.4);line-height:1.6;">Groq's Llama 3.3 70B picks the best 15 stories of the week and writes plain English summaries</div>
        </div>
      </div>
      <div style="display:flex;gap:14px;margin-bottom:14px;align-items:flex-start;">
        <span style="font-size:18px;flex-shrink:0;">⏰</span>
        <div>
          <div style="font-size:13px;font-weight:500;color:#fff;margin-bottom:3px;">Every Friday at 9am IST</div>
          <div style="font-size:12px;color:rgba(255,255,255,.4);line-height:1.6;">Lands in your inbox every Friday morning — start your weekend informed</div>
        </div>
      </div>
      <div style="display:flex;gap:14px;align-items:flex-start;">
        <span style="font-size:18px;flex-shrink:0;">₹</span>
        <div>
          <div style="font-size:13px;font-weight:500;color:#fff;margin-bottom:3px;">Free forever</div>
          <div style="font-size:12px;color:rgba(255,255,255,.4);line-height:1.6;">No credit card, no trial, no catch. Always free.</div>
        </div>
      </div>
    </div>

    <p style="font-size:14px;color:#5a5550;line-height:1.8;margin:0 0 8px;font-style:italic;">
      Your first digest arrives this Friday at 9am IST. Until then, tell a friend!
    </p>

    <a href="${WEBSITE}"
      style="display:inline-block;margin-top:16px;background:#c13d18;color:#fff;
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
    You're receiving this because you subscribed at Neural Brief.<br>
    <a href="https://neural-brief-eight.vercel.app/api/unsubscribe?email=${email}" style="color:rgba(255,255,255,.25);text-decoration:none;">Unsubscribe</a>
    &nbsp;·&nbsp;
    <a href="${WEBSITE}" style="color:rgba(255,255,255,.25);text-decoration:none;">Website</a>
  </div>

</div>
</body></html>`
}

app.post('/api/subscribe', async (req, res) => {
  console.log('📩 Subscribe request received:', req.body)
  const { email } = req.body

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    console.log('❌ Invalid email')
    return res.status(400).json({ error: 'Invalid email' })
  }

  try {
    console.log('💾 Saving to Supabase...')
    const { error: dbError } = await supabase
      .from('subscribers')
      .insert([{ email, confirmed: true }])

    if (dbError && dbError.code !== '23505') {
      console.log('❌ Supabase error:', dbError.message)
      throw new Error(dbError.message)
    }
    console.log('✅ Saved to Supabase!')

    console.log('📧 Sending welcome email to:', email)
    await transporter.sendMail({
      from: `Neural Brief <neuralbrief18@gmail.com>`,
      to: email,
      replyTo: 'neuralbrief18@gmail.com',
      subject: "Welcome to Neural Brief 🧠 — You're in!",
      html: buildWelcomeEmail(),
    })
    console.log('✅ Welcome email sent!')

    return res.status(200).json({ success: true })
  } catch (err) {
    console.log('❌ Error:', err.message)
    return res.status(500).json({ error: err.message })
  }
})

app.listen(3001, () => {
  console.log('✅ Local API server running on http://localhost:3001')
  console.log('✅ Now run: npm run dev in another terminal')
})