<div align="center">

# 🧠 Neural Brief

### Weekly AI intelligence, engineered for students.

[![Live](https://img.shields.io/badge/▶_READ_LATEST_ISSUE-neural--brief--eight.vercel.app-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://neural-brief-eight.vercel.app)
[![Powered by Groq](https://img.shields.io/badge/AI-Groq_Llama_3.3_70B-F97316?style=for-the-badge)](https://console.groq.com)
[![Free forever](https://img.shields.io/badge/Cost-₹0_/_month-22C55E?style=for-the-badge)](#-free-tier-breakdown)

*Delivered every Friday 9:00 AM IST · No jargon · No paywalls · No noise*

</div>

---

## ✦ What's Inside Every Issue

Neural Brief is a **fully automated AI news digest** — fetching, curating, and summarising the week's most important AI stories and dropping them straight to your inbox. Every Friday morning, while you're still half-asleep, the pipeline is already done.

```
┌─────────────────────────────────────────────────────────────┐
│  NEURAL BRIEF — ISSUE #42                     Friday, 9 AM  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ★ BIGGEST MOVE THIS WEEK                                   │
│  ─────────────────────────────────────────────────────────  │
│  The single most important AI story you can't miss          │
│                                                             │
│  📰 TOP 15 STORIES                                          │
│  ─────────────────────────────────────────────────────────  │
│  Picked from 70+ articles across 7 curated RSS feeds        │
│  Plain English · No jargon · 30-second reads                │
│                                                             │
│  🇮🇳 WHY IT MATTERS  (per story)                            │
│  ─────────────────────────────────────────────────────────  │
│  India-specific context so you know why you should care     │
│                                                             │
│  🏷️  SOURCE LABELS                                          │
│  ─────────────────────────────────────────────────────────  │
│  Official · Media · Research · Community                    │
│                                                             │
│  📖 JARGON OF THE WEEK                                      │
│  ─────────────────────────────────────────────────────────  │
│  One AI/ML term broken down, simply                         │
│                                                             │
│  🐦 SHARE BUTTONS                                           │
│  ─────────────────────────────────────────────────────────  │
│  Tweet or post to LinkedIn in one click per story           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## ⚡ The Pipeline

> From raw internet noise → curated intelligence → your inbox. Fully automated. Zero humans in the loop.

```
  Every Friday 3:30 AM UTC  (9:00 AM IST)
           │
           ▼
  ┌──────────────────────┐
  │   Vercel Cron        │  fires /api/send-digest
  └──────────┬───────────┘
             │
             ▼
  ┌──────────────────────┐
  │   RSS Feed Scraper   │  10 stories × 7 feeds = 70 raw articles
  └──────────┬───────────┘
             │
             ▼
  ┌──────────────────────┐
  │   Supabase Filter    │  deduplication — skip already-sent stories
  └──────────┬───────────┘
             │
             ▼
  ┌──────────────────────┐
  │   Groq Llama 3.3 70B │  picks top 15 + writes:
  │                      │  biggest_move · summary · tldr
  │                      │  why_it_matters · jargon · tweet
  └──────────┬───────────┘
             │
             ▼
  ┌──────────────────────┐
  │   HTML Email Builder │  formatted, mobile-ready
  └──────────┬───────────┘
             │
             ▼
  ┌──────────────────────┐
  │   Brevo SMTP         │  delivered to all subscribers
  └──────────┬───────────┘
             │
             ▼
  ┌──────────────────────┐
  │   Supabase Archive   │  issue stored permanently
  └──────────────────────┘
```

---

## 🛠️ Tech Stack

> Built entirely on free tiers. ₹0/month. No credit card required.

| Layer | Tech | Cost |
|---|---|---|
| Frontend | React 18 + Vite | Free |
| Styling | Pure CSS — newspaper aesthetic | Free |
| AI Brain | Groq API · Llama 3.3 70B | Free |
| Backend | Vercel Serverless Functions | Free |
| Scheduler | Vercel Cron Jobs | Free |
| Database | Supabase (PostgreSQL) | Free |
| Email | Brevo SMTP | Free |
| News Sources | RSS Feeds via rss-parser | Free |

**Total: ₹0/month. Seriously.**

---

## 📁 Project Structure

```
neural-brief/
│
├── api/
│   ├── subscribe.js       ← saves email + fires welcome email instantly
│   ├── unsubscribe.js     ← removes email + shows confirmation page
│   ├── send-digest.js     ← the beast — weekly cron pipeline
│   └── get-digest.js      ← serves live news to website (cached 24h)
│
├── src/
│   ├── App.jsx            ← full React UI + accordion news feed
│   ├── index.css          ← all styles, newspaper aesthetic
│   ├── main.jsx           ← Vite entry point
│   ├── supabase.js        ← Supabase client
│   └── assets/
│       └── logo.jpg       ← NB monogram
│
├── digest.py              ← manual trigger (test before Friday)
├── server.js              ← local dev API server
├── vercel.json            ← cron config (Friday 3:30am UTC)
└── .env                   ← all secrets (never committed)
```

---

## 🗄️ Database Schema

| Table | What Lives Here |
|---|---|
| `subscribers` | Emails + confirmed status |
| `sent_stories` | Deduplication — story hashes |
| `config` | Issue number counter |
| `digest_cache` | Live news cache (24h TTL) |
| `digest_archive` | Every past issue, stored forever |

---

## 🚀 Run It Yourself

### 1 · Clone & Install

```bash
git clone https://github.com/Prajwal18py/Neural-Brief.git
cd Neural-Brief
npm install
pip install groq supabase feedparser python-dotenv
```

### 2 · Configure Environment

```bash
cp .env.example .env
# Fill in your keys — see table below
```

### 3 · Set Up Supabase

Go to **Supabase → SQL Editor** → paste and run `digest_cache.sql`

### 4 · Start Dev Server

```bash
# Terminal 1 — API
node server.js

# Terminal 2 — React UI
npm run dev
```

Open [`http://localhost:5173`](http://localhost:5173)

### 5 · Preview a Digest Before Sending

```bash
python digest.py
# Opens preview_email.html — inspect before it goes to subscribers
```

---

## 🔑 Environment Variables

| Variable | Where | What |
|---|---|---|
| `VITE_SUPABASE_URL` | React | Supabase project URL (public) |
| `VITE_SUPABASE_ANON_KEY` | React | Supabase anon key (safe to expose) |
| `SUPABASE_URL` | API + Python | Supabase project URL (server) |
| `SUPABASE_KEY` | API + Python | `service_role` key — keep secret |
| `GROQ_API_KEY` | API + Python | Groq API key |
| `BREVO_SMTP_LOGIN` | API + Python | Brevo SMTP login |
| `BREVO_SMTP_KEY` | API + Python | Brevo SMTP password |
| `BREVO_FROM_EMAIL` | API + Python | Verified sender address |
| `CRON_SECRET` | Vercel API | Guards `/api/send-digest` from outside calls |

---

## 📊 Free Tier Breakdown

| Service | Free Limit | Neural Brief Usage |
|---|---|---|
| Groq | ~14,400 req / day | 1–2 req / week ✅ |
| Brevo | 9,000 emails / month | Safe up to ~300 subscribers ✅ |
| Supabase | 500 MB · 50k rows | Years away from hitting ✅ |
| Vercel | Unlimited + 2 crons | Free forever ✅ |

---

## 🗺️ Roadmap

```
  SHIPPED                               COMING SOON
  ───────────────────────────────────   ──────────────────────────────────
  ✅ Biggest Move banner                ○ Archive page on website
  ✅ Why it matters (per story)         ○ Custom domain — neuralbriefai.in
  ✅ Source credibility labels          ○ WhatsApp Channel
  ✅ Jargon of the week                ○ Reader mode — Student / Dev / Founder
  ✅ Tweet + LinkedIn share buttons     ○ Neural Brief Score (weekly AI heat)
  ✅ Live news accordion on site        ○ AI Job & Internship drops
  ✅ Unsubscribe with confirmation
  ✅ Digest archive in Supabase
```

---

## 👤 Built By

**Prajwal A** · Sem 4 AIML · Alliance University, Bengaluru 🇮🇳

Built as a real product — not a college assignment. Automated end-to-end, deployed, live, and growing.

📬 [neuralbrief18@gmail.com](mailto:neuralbrief18@gmail.com) · 🌐 [neural-brief-eight.vercel.app](https://neural-brief-eight.vercel.app)

---

## 📄 License

MIT — fork it, build on it, ship your own version.

---

<div align="center">

**NEURAL BRIEF** &nbsp;·&nbsp; Every Friday 9 AM IST &nbsp;·&nbsp; Free forever &nbsp;·&nbsp; Built in Bengaluru 🇮🇳

*The AI news digest that actually respects your time.*

</div>
