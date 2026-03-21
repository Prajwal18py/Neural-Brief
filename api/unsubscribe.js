// api/unsubscribe.js
// Handles unsubscribe requests
// When user clicks unsubscribe link in email:
// GET /api/unsubscribe?email=user@gmail.com
// → deletes from Supabase → shows confirmation page

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
)

export default async function handler(req, res) {
  const { email } = req.query

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).send(errorPage('Invalid unsubscribe link.'))
  }

  try {
    await supabase
      .from('subscribers')
      .delete()
      .eq('email', email)

    return res.status(200).send(successPage(email))

  } catch (err) {
    console.error('Unsubscribe error:', err)
    return res.status(500).send(errorPage('Something went wrong. Please try again.'))
  }
}

// ── Success page ──────────────────────────────────────────
function successPage(email) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>Unsubscribed — Neural Brief</title>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=IBM+Plex+Mono:wght@400;500&family=Outfit:wght@300;400;500&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #f4f1ea; font-family: 'Outfit', sans-serif; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 24px; }
    .card { background: #fff; border: 1px solid #d6d0c2; max-width: 480px; width: 100%; padding: 48px 40px; text-align: center; }
    .brand { font-family: 'Playfair Display', serif; font-size: 28px; font-weight: 700; color: #18160f; margin-bottom: 32px; }
    .brand span { color: #c13d18; }
    .icon { font-size: 36px; margin-bottom: 20px; }
    h1 { font-family: 'Playfair Display', serif; font-size: 22px; font-weight: 700; color: #18160f; margin-bottom: 12px; }
    p { font-size: 14px; color: #6b6560; line-height: 1.7; margin-bottom: 8px; }
    .email { font-family: 'IBM Plex Mono', monospace; font-size: 12px; color: #9a938a; margin-bottom: 28px; }
    .btn { display: inline-block; background: #c13d18; color: #fff; font-family: 'Outfit', sans-serif; font-size: 13px; font-weight: 500; padding: 11px 24px; border-radius: 3px; text-decoration: none; transition: background 0.15s; }
    .btn:hover { background: #d95228; }
    .divider { border: none; border-top: 1px solid #d6d0c2; margin: 28px 0; }
    .footer { font-family: 'IBM Plex Mono', monospace; font-size: 10px; color: #9a938a; }
  </style>
</head>
<body>
  <div class="card">
    <div class="brand">Neural <span>Brief</span></div>
    <div class="icon">👋</div>
    <h1>You've been unsubscribed.</h1>
    <p>Sorry to see you go! You won't receive any more emails from Neural Brief.</p>
    <p class="email">${email}</p>
    <a href="https://neural-brief-eight.vercel.app" class="btn">Visit Neural Brief →</a>
    <hr class="divider">
    <p class="footer">Changed your mind? You can always subscribe again at neural-brief-eight.vercel.app</p>
  </div>
</body>
</html>`
}

// ── Error page ────────────────────────────────────────────
function errorPage(message) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>Error — Neural Brief</title>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Outfit:wght@400;500&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #f4f1ea; font-family: 'Outfit', sans-serif; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 24px; }
    .card { background: #fff; border: 1px solid #d6d0c2; max-width: 480px; width: 100%; padding: 48px 40px; text-align: center; }
    .brand { font-family: 'Playfair Display', serif; font-size: 28px; font-weight: 700; color: #18160f; margin-bottom: 32px; }
    .brand span { color: #c13d18; }
    .icon { font-size: 36px; margin-bottom: 20px; }
    h1 { font-family: 'Playfair Display', serif; font-size: 22px; font-weight: 700; color: #18160f; margin-bottom: 12px; }
    p { font-size: 14px; color: #6b6560; line-height: 1.7; margin-bottom: 24px; }
    .btn { display: inline-block; background: #c13d18; color: #fff; font-family: 'Outfit', sans-serif; font-size: 13px; font-weight: 500; padding: 11px 24px; border-radius: 3px; text-decoration: none; }
  </style>
</head>
<body>
  <div class="card">
    <div class="brand">Neural <span>Brief</span></div>
    <div class="icon">⚠️</div>
    <h1>Something went wrong.</h1>
    <p>${message}</p>
    <a href="https://neural-brief-eight.vercel.app" class="btn">Go to website →</a>
  </div>
</body>
</html>`
}