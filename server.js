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

function buildWelcomeEmail() {
  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f4f1ea;font-family:'Helvetica Neue',sans-serif;">
<div style="max-width:600px;margin:32px auto;background:#fff;border:1px solid #d6d0c2;">
  <div style="text-align:center;padding:32px 40px 20px;border-bottom:3px double #d6d0c2;">
    <div style="font-family:Georgia,serif;font-size:38px;font-weight:bold;color:#18160f;">
      Neural <span style="color:#c13d18;">Brief</span>
    </div>
    <div style="font-family:'Courier New',monospace;font-size:9px;color:#9a938a;letter-spacing:.1em;text-transform:uppercase;margin-top:5px;">
      WELCOME TO THE BRIEF
    </div>
  </div>
  <div style="padding:36px 40px;">
    <h2 style="font-family:Georgia,serif;font-size:24px;color:#18160f;margin:0 0 16px;">You're officially in. 🎉</h2>
    <p style="font-size:15px;color:#6b6560;line-height:1.8;margin:0 0 20px;">
      Welcome to <strong style="color:#18160f;">Neural Brief</strong> — your daily dose of AI news, summarised in plain English.
    </p>
    <div style="background:#18160f;border-radius:3px;padding:24px 28px;margin:0 0 24px;">
      <p style="font-family:'Courier New',monospace;font-size:9px;color:rgba(255,255,255,.35);letter-spacing:.14em;text-transform:uppercase;margin:0 0 16px;">WHAT TO EXPECT</p>
      <div style="margin-bottom:12px;color:#fff;font-size:13px;">📡 Real AI news — fetched fresh every day from 7+ sources</div>
      <div style="margin-bottom:12px;color:#fff;font-size:13px;">🧠 AI summarised — plain English, no jargon</div>
      <div style="margin-bottom:12px;color:#fff;font-size:13px;">⏰ Daily at 9am IST — every morning</div>
      <div style="color:#fff;font-size:13px;">₹0 — Free forever, no catch</div>
    </div>
    <p style="font-size:14px;color:#6b6560;font-style:italic;">Your first digest arrives tomorrow at 9am IST!</p>
  </div>
  <div style="background:#18160f;padding:24px 40px;text-align:center;font-family:'Courier New',monospace;font-size:10px;color:rgba(255,255,255,.3);line-height:1.9;">
    Neural <span style="color:#c13d18;">Brief</span> · Daily AI news for students · Free forever
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
      replyTo: process.env.BREVO_SMTP_LOGIN,
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