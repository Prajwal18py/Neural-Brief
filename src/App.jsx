import { useState } from 'react'
import logo from './assets/logo.jpg'

// ── Subscribe Form Component ──────────────────────────────
function SubscribeForm({ id }) {
  const [email, setEmail]     = useState('')
  const [status, setStatus]   = useState('idle') // idle | loading | success | error

  const handleSubmit = async () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setStatus('error')
      setTimeout(() => setStatus('idle'), 2200)
      return
    }

    setStatus('loading')

    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (res.ok) {
        setStatus('success')
      } else {
        setStatus('idle')
        alert('Something went wrong. Please try again.')
      }
    } catch (err) {
      console.error(err)
      setStatus('idle')
      alert('Something went wrong. Please try again.')
    }
  }

  return (
    <div className="subscribe-wrap" id={id}>
      <span className="sub-label">Drop your email — it's free</span>

      {status !== 'success' ? (
        <>
          <div className="form-row">
            <input
              type="email"
              placeholder={status === 'error' ? 'Enter a valid email ↑' : 'your@email.com'}
              style={{ color: status === 'error' ? '#c13d18' : '' }}
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              autoComplete="email"
            />
            <button
              className="btn-sub"
              onClick={handleSubmit}
              disabled={status === 'loading'}
            >
              {status === 'loading' ? 'Joining...' : 'Subscribe →'}
            </button>
          </div>
          <span className="form-note">No spam · Unsubscribe anytime · ~3 min read daily</span>
        </>
      ) : (
        <div className="success-box">
          <span className="success-title">✦ You're in!</span>
          <span className="success-sub">Check inbox to confirm · First brief tomorrow 9am</span>
        </div>
      )}
    </div>
  )
}

// ── Main App ──────────────────────────────────────────────
export default function App() {
  return (
    <>
      {/* NAV */}
      <nav>
        <a className="logo" href="#">
          <img src={logo} alt="NB" />
          <span className="logo-text">Neural <span>Brief</span></span>
        </a>
        <div className="nav-right">
          <span className="nav-chip">Daily · Free</span>
          <a className="nav-cta" href="#subscribe">Subscribe Free</a>
        </div>
      </nav>

      {/* MASTHEAD */}
      <div className="masthead fi">
        <div className="masthead-inner">
          <div className="masthead-name">Neural<br /><em>Brief</em></div>
          <div className="masthead-meta">
            Vol. 1, No. 1 &nbsp;·&nbsp; Est. 2025<br />
            Daily AI digest for students<br />
            Plain English · Free forever<br />
            <strong style={{ color: 'var(--accent)' }}>neuralbriefai.in</strong>
          </div>
        </div>
        <div className="masthead-rule">
          <span>The smartest way to follow AI</span>
          <span>✦ ✦ ✦</span>
          <span>5 stories · 3 min read · ₹0 forever</span>
        </div>
      </div>

      {/* HERO */}
      <div className="wrap">
        <div className="hero-grid">
          <div className="hero-main fi">
            <div className="kicker">
              <span className="kicker-bar"></span>Curated AI News Digest<span className="kicker-bar"></span>
            </div>
            <h1>Stop missing the AI<br />stories that matter.</h1>
            <p className="hero-deck">Every day, Neural Brief lands in your inbox with the top 5 AI stories — summarised in plain English. No jargon. No hype. Just signal.</p>
            <p className="why-line">AI moves fast. Most people don't have time to track everything. Neural Brief filters the noise and gives you only the stories worth knowing.</p>

            <div className="cta-group">
              <a className="btn-primary" href="#subscribe">Subscribe Free →</a>
              <a className="btn-secondary" href="#sample">Read Sample Issue</a>
            </div>

            <SubscribeForm id="subscribe" />

            <div className="trust-badges">
              {['No spam','Free forever','Plain English','Unsubscribe anytime','Curated daily'].map(b => (
                <span className="badge" key={b}><span className="badge-dot"></span>{b}</span>
              ))}
            </div>
          </div>

          <div className="hero-sidebar fi">
            <div className="sb-section">
              <span className="sb-label">By the numbers</span>
              {[['Top stories per issue','5'],['Read time','< 3 min'],['Delivery','Daily'],['Language','Plain English'],['Cost','₹0']].map(([k,v]) => (
                <div className="stat-row" key={k}><span className="stat-key">{k}</span><span className="stat-val">{v}</span></div>
              ))}
            </div>
            <div className="sb-section">
              <span className="sb-label">Sources we track</span>
              {['HackerNews AI','TechCrunch AI','Google DeepMind Blog','OpenAI Blog','arXiv CS.AI','MIT Technology Review','The Verge AI'].map(s => (
                <div className="src-item" key={s}><span className="src-dot"></span>{s}</div>
              ))}
            </div>
            <div className="sb-section">
              <span className="sb-label">Built with</span>
              {['Groq · Llama 3.3 70B','Brevo · Email delivery','Supabase · Subscribers'].map(s => (
                <div className="src-item" key={s}><span className="src-dot"></span>{s}</div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* HOW IT WORKS */}
      <div className="wrap">
        <div className="section fi">
          <div className="section-hd"><span className="section-sym">§</span><h2>How it works</h2></div>
          <div className="steps">
            {[
              { n:'01', i:'📡', t:'Scan RSS feeds',   d:'Every morning we pull fresh stories from 7+ top AI sources — TechCrunch, HackerNews, DeepMind, arXiv, and more.' },
              { n:'02', i:'🧠', t:'AI summarises',    d:"Groq's Llama 3.3 70B picks the best 5 stories and writes plain English summaries with a sharp TL;DR for each." },
              { n:'03', i:'✉️', t:'Hits your inbox',  d:'A clean digest lands in your inbox every morning at 9am IST via Brevo — reliable delivery, beautiful formatting.' },
              { n:'04', i:'🎓', t:'You stay sharp',   d:'Drop real AI news in interviews, seminars, and projects. Be the person in the room who actually knows what\'s happening.' },
            ].map(s => (
              <div className="step" key={s.n}>
                <span className="step-num">{s.n} —</span>
                <span className="step-ico">{s.i}</span>
                <p className="step-title">{s.t}</p>
                <p className="step-desc">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* WHY NEURAL BRIEF */}
      <div className="wrap">
        <div className="why-section fi">
          <div className="why-card">
            <div className="why-accent">"</div>
            <div className="why-body">
              <h3>Why Neural Brief exists</h3>
              <p>AI moves insanely fast — new models, new tools, new research, every single day. Most students don't have time to track all of it. So Neural Brief does it for you. We read everything, cut the hype, and send you only the 5 stories actually worth your attention. Free, daily, plain English.</p>
            </div>
          </div>
        </div>
      </div>

      {/* SAMPLE ISSUE */}
      <div className="wrap" id="sample">
        <div className="sample-section fi">
          <div className="section-hd"><span className="section-sym">§</span><h2>Inside a typical issue</h2></div>
          <div className="inside-grid">
            <div className="inside-sidebar">
              <span className="inside-label">Neural Brief</span>
              <div className="inside-meta">
                <span>Issue #42</span>
                <span>5 stories</span>
                <span>~3 min read</span>
                <span style={{ marginTop: '12px', color: 'var(--accent)' }}>Today in AI</span>
              </div>
            </div>
            <div>
              {[
                { n:'01', tag:'t-model',    label:'New Model',  title:'Google drops Gemini 2.5 with 2M token context window',          desc:'Biggest context window yet — can process entire codebases in one shot. Strong reasoning gains over 2.0.',        tldr:'→ TL;DR: Longer memory, smarter answers.' },
                { n:'02', tag:'t-research', label:'Research',   title:'MIT: LLMs can plan 10-step tasks without fine-tuning',           desc:'Zero-shot prompting beats fine-tuning for complex multi-step real-world tasks, new MIT paper shows.',              tldr:'→ TL;DR: Prompting beats training. Big for AI agents.' },
                { n:'03', tag:'t-industry', label:'Industry',   title:'OpenAI reportedly acquiring Windsurf for $3B',                  desc:'The AI code editor wars heat up — OpenAI wants a direct IDE-level product to challenge Cursor and Copilot.',       tldr:'→ TL;DR: Code editors are the new AI battlefield.' },
                { n:'04', tag:'t-tool',     label:'Tool Drop',  title:'Notion AI gets real-time web search built in',                  desc:'Live web search in every Notion AI query puts it in direct competition with Perplexity.',                          tldr:"→ TL;DR: Notion just became Perplexity for your notes." },
                { n:'05', tag:'t-opinion',  label:'Opinion',    title:'Why every AI company is racing to own your code editor',        desc:'A sharp take on why the IDE is the most strategic surface in AI — and what it means for developers.',               tldr:'→ TL;DR: Whoever owns your editor owns your workflow.' },
              ].map(s => (
                <div className="inside-story" key={s.n}>
                  <span className="story-num">{s.n}</span>
                  <div className="story-body">
                    <span className={`stag ${s.tag}`}>{s.label}</span>
                    <p className="story-title">{s.title}</p>
                    <p className="story-desc">{s.desc}</p>
                    <p className="story-tldr">{s.tldr}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* EMAIL PREVIEW */}
      <div className="wrap">
        <div className="preview-section fi">
          <div className="section-hd"><span className="section-sym">§</span><h2>What lands in your inbox</h2></div>
          <div className="email-mock">
            <div className="email-bar">
              <div className="wdots"><div className="wd wd-r"></div><div className="wd wd-y"></div><div className="wd wd-g"></div></div>
              <span className="email-url">From: digest@neuralbriefai.in · Neural Brief #42 — Today in AI 🧠</span>
            </div>
            <div className="email-body">
              <div className="em-head">
                <div className="em-brand">Neural <span>Brief</span></div>
                <span className="em-tag">TODAY IN AI · ISSUE #42 · DAILY DIGEST</span>
              </div>
              <div className="em-meta">
                <span>Friday, 20 March 2026</span>
                <span>5 stories · ~3 min read</span>
                <span>neuralbriefai.in</span>
              </div>
              {[
                { tag:'t-model',    label:'New Model',  title:'Google drops Gemini 2.5 with 2M token context window',      body:"Google DeepMind's latest model can process entire codebases in a single prompt. Early benchmarks show strong reasoning improvements over 2.0.", tldr:'→ TL;DR: Longer memory, smarter answers. Think reading a whole textbook at once.' },
                { tag:'t-research', label:'Research',   title:'MIT shows LLMs can plan complex tasks without fine-tuning',  body:'A new MIT paper proves base language models can reliably execute 10+ step real-world tasks through structured prompting alone — no training required.', tldr:'→ TL;DR: Prompting beats fine-tuning. Huge for AI agents.' },
                { tag:'t-industry', label:'Industry',   title:'OpenAI in talks to acquire Windsurf for $3B',               body:"After Microsoft Copilot and Anthropic's Cursor integration, OpenAI is acquiring Windsurf for a direct IDE-level product.", tldr:'→ TL;DR: Code editors are the new AI battlefield.' },
              ].map(s => (
                <div className="em-story" key={s.title}>
                  <span className={`stag ${s.tag}`}>{s.label}</span>
                  <p className="em-title">{s.title}</p>
                  <p className="em-body">{s.body}</p>
                  <p className="em-tldr">{s.tldr}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM CTA */}
      <div className="wrap">
        <div className="cta-section fi">
          <span className="cta-eyebrow">Join Neural Brief</span>
          <h2>Your inbox, upgraded.</h2>
          <p className="cta-sub">The AI space moves faster than anyone can track alone.<br />Neural Brief does the tracking. You get the signal.</p>
          <div className="cta-form">
            <SubscribeForm id="subscribe-bottom" />
            <div className="trust-badges" style={{ justifyContent: 'center', marginTop: '16px' }}>
              {['No spam','Curated daily','Free forever','Plain English'].map(b => (
                <span className="badge" key={b}><span className="badge-dot"></span>{b}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <footer>
        <strong>Neural Brief</strong> · Daily AI news for students · Est. 2025<br />
        Powered by Groq API · Sent via Brevo · Subscribers on Supabase<br />
        <a href="#">Unsubscribe</a> &nbsp;·&nbsp; <a href="#">Website</a> &nbsp;·&nbsp; <a href="#">WhatsApp Channel</a><br /><br />
        <span style={{ opacity: 0.4 }}>© 2025 Neural Brief · Made with ☕ somewhere in India 🇮🇳</span>
      </footer>
    </>
  )
}