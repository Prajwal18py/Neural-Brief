import { useState, useEffect } from 'react'
import logo from './assets/logo.jpg'

const TAG_CLASS = {
  'New Model': 't-model', 'Research': 't-research',
  'Industry': 't-industry', 'Tool Drop': 't-tool',
  'Policy': 't-opinion', 'Opinion': 't-opinion',
}

const SOURCE_LABELS = {
  'Google DeepMind':       'Official',
  'OpenAI Blog':           'Official',
  'TechCrunch AI':         'Media',
  'MIT Technology Review': 'Research',
  'VentureBeat AI':        'Media',
  'The Verge AI':          'Media',
  'HackerNews AI':         'Community',
  'Wired AI':              'Media',
  'arXiv CS.AI':           'Research',
}

function SubscribeForm({ id }) {
  const [email, setEmail]   = useState('')
  const [status, setStatus] = useState('idle')

  const handleSubmit = async () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setStatus('error'); setTimeout(() => setStatus('idle'), 2200); return
    }
    setStatus('loading')
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (res.ok) setStatus('success')
      else { setStatus('idle'); alert('Something went wrong. Please try again.') }
    } catch { setStatus('idle'); alert('Something went wrong. Please try again.') }
  }

  return (
    <div className="subscribe-wrap" id={id}>
      <span className="sub-label">Drop your email — it's free</span>
      {status !== 'success' ? (
        <>
          <div className="form-row">
            <input type="email"
              placeholder={status === 'error' ? 'Enter a valid email ↑' : 'your@email.com'}
              style={{ color: status === 'error' ? '#c13d18' : '' }}
              value={email} onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()} autoComplete="email" />
            <button className="btn-sub" onClick={handleSubmit} disabled={status === 'loading'}>
              {status === 'loading' ? 'Joining...' : 'Subscribe →'}
            </button>
          </div>
          <span className="form-note">No spam · Unsubscribe anytime · Every Friday 9am IST</span>
        </>
      ) : (
        <div className="success-box">
          <span className="success-title">✦ You're in!</span>
          <span className="success-sub">Check inbox to confirm · First brief this Friday 9am IST</span>
        </div>
      )}
    </div>
  )
}

function LiveDigest() {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(false)
  const [expanded, setExpanded] = useState({})

  useEffect(() => {
    fetch('/api/get-digest')
      .then(r => r.json())
      .then(d => { if (d.stories) setData(d); else setError(true) })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [])

  const toggle = (i) => setExpanded(e => ({ ...e, [i]: !e[i] }))

  if (loading) return (
    <div style={{ padding: '48px 0', textAlign: 'center' }}>
      <div style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--muted2)', letterSpacing: '0.1em' }}>
        LOADING THIS WEEK'S STORIES...
      </div>
    </div>
  )

  if (error || !data) return (
    <div style={{ padding: '32px 0', textAlign: 'center' }}>
      <p style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--muted2)' }}>
        Could not load stories. Please try again later.
      </p>
    </div>
  )

  const { stories, biggest_move, jargon_of_week } = data

  return (
    <div>
      {/* Biggest Move */}
      {biggest_move && (
        <div className="biggest-move">
          <span className="biggest-move-label">★ Biggest move this week</span>
          <a href={biggest_move.link} target="_blank" rel="noopener noreferrer" className="biggest-move-title">
            {biggest_move.title}
          </a>
          <p className="biggest-move-reason">{biggest_move.reason}</p>
        </div>
      )}

      {/* Accordion Stories */}
      <div className="accordion">
        {stories.map((story, i) => {
          const srcLabel  = SOURCE_LABELS[story.source]
          const isOpen    = expanded[i]
          return (
            <div className={'accordion-item' + (isOpen ? ' open' : '')} key={i}>

              {/* Header — always visible, click to toggle */}
              <button className="accordion-header" onClick={() => toggle(i)}>
                <div className="accordion-left">
                  <span className="live-num">{String(i + 1).padStart(2, '0')}</span>
                  <div className="accordion-meta">
                    <div className="accordion-tags">
                      <span className={'stag ' + (TAG_CLASS[story.tag] || 't-research')}>{story.tag}</span>
                      {srcLabel && <span className={'src-label src-' + srcLabel.toLowerCase()}>{srcLabel}</span>}
                    </div>
                    <span className="accordion-title">{story.title}</span>
                  </div>
                </div>
                <span className="accordion-chevron">{isOpen ? '−' : '+'}</span>
              </button>

              {/* Body — only shown when expanded */}
              {isOpen && (
                <div className="accordion-body">
                  <p className="live-summary">{story.summary}</p>
                  <p className="live-tldr">{story.tldr}</p>

                  {story.why_it_matters && (
                    <div className="why-matters">
                      <span className="why-matters-label">Why it matters → </span>
                      <span className="why-matters-text">{story.why_it_matters}</span>
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
                    <a href={story.link} target="_blank" rel="noopener noreferrer" className="share-btn share-x">
                      Read full story →
                    </a>
                    {story.tweet && (
                      <>
                        <a href={'https://twitter.com/intent/tweet?text=' + encodeURIComponent(story.tweet)}
                          target="_blank" rel="noopener noreferrer" className="share-btn share-x">
                          Post on X →
                        </a>
                        <a href={'https://www.linkedin.com/sharing/share-offsite/?url=' + encodeURIComponent(story.link)}
                          target="_blank" rel="noopener noreferrer" className="share-btn share-li">
                          LinkedIn →
                        </a>
                      </>
                    )}
                  </div>
                  <p style={{ fontSize: '10px', fontFamily: 'var(--mono)', color: 'var(--muted2)', marginTop: '8px' }}>
                    via {story.source}
                  </p>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Jargon of the week */}
      {jargon_of_week && (
        <div className="jargon-box">
          <span className="jargon-label">📖 Jargon of the week</span>
          <span className="jargon-term">{jargon_of_week.term}</span>
          <p className="jargon-exp">{jargon_of_week.explanation}</p>
        </div>
      )}

      {/* Subscribe CTA */}
      <div className="digest-cta">
        <div>
          <p className="digest-cta-title">Get this in your inbox every Friday.</p>
          <p className="digest-cta-sub">Free · No spam · Unsubscribe anytime</p>
        </div>
        <a className="btn-primary" href="#subscribe">Subscribe Free →</a>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <>
      <nav>
        <a className="logo" href="#">
          <img src={logo} alt="NB" />
          <span className="logo-text">Neural <span>Brief</span></span>
        </a>
        <div className="nav-right">
          <span className="nav-chip">Every Friday · Free</span>
          <a className="nav-cta" href="#subscribe">Subscribe Free</a>
        </div>
      </nav>

      <div className="masthead fi">
        <div className="masthead-inner">
          <div className="masthead-name">Neural<br /><em>Brief</em></div>
          <div className="masthead-meta">
            Vol. 1, No. 1 &nbsp;·&nbsp; Est. 2025<br />
            Weekly AI digest for students<br />
            Plain English · Free forever<br />
            <strong style={{ color: 'var(--accent)' }}>neural-brief-eight.vercel.app</strong>
          </div>
        </div>
        <div className="masthead-rule">
          <span>The smartest way to follow AI</span>
          <span>✦ ✦ ✦</span>
          <span>15 stories · every Friday · ₹0 forever</span>
        </div>
      </div>

      <div className="wrap">
        <div className="hero-grid">
          <div className="hero-main fi">
            <div className="kicker">
              <span className="kicker-bar"></span>Weekly AI News Digest<span className="kicker-bar"></span>
            </div>
            <h1>Stop missing the AI<br />stories that matter.</h1>
            <p className="hero-deck">Every Friday, Neural Brief lands in your inbox with the top 15 AI stories of the week — summarised in plain English. No jargon. No hype. Just signal.</p>
            <p className="why-line">AI moves fast. Most people don't have time to track everything. Neural Brief filters the noise and gives you only the stories worth knowing.</p>
            <div className="cta-group">
              <a className="btn-primary" href="#subscribe">Subscribe Free →</a>
              <a className="btn-secondary" href="#this-week">Read This Week's Issue</a>
            </div>
            <SubscribeForm id="subscribe" />
            <div className="trust-badges">
              {['No spam','Free forever','Plain English','Unsubscribe anytime','Every Friday'].map(b => (
                <span className="badge" key={b}><span className="badge-dot"></span>{b}</span>
              ))}
            </div>
          </div>

          <div className="hero-sidebar fi">
            <div className="sb-section">
              <span className="sb-label">By the numbers</span>
              {[['Top stories per issue','15'],['Read time','~15 min'],['Delivery','Every Friday'],['Language','Plain English'],['Cost','₹0']].map(([k,v]) => (
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

      {/* THIS WEEK IN AI */}
      <div className="wrap" id="this-week">
        <div className="section fi">
          <div className="section-hd">
            <span className="section-sym">§</span>
            <div>
              <h2>This week in AI</h2>
              <p style={{ fontSize: '11px', fontFamily: 'var(--mono)', color: 'var(--muted2)', marginTop: '4px' }}>
                Live · Updated weekly · Powered by Groq
              </p>
            </div>
          </div>
          <LiveDigest />
        </div>
      </div>

      {/* HOW IT WORKS */}
      <div className="wrap">
        <div className="section fi">
          <div className="section-hd"><span className="section-sym">§</span><h2>How it works</h2></div>
          <div className="steps">
            {[
              { n:'01', i:'📡', t:'Scan RSS feeds',  d:"Every Friday morning we pull the week's top stories from 7+ AI sources — TechCrunch, HackerNews, DeepMind, arXiv, and more." },
              { n:'02', i:'🧠', t:'AI summarises',   d:"Groq's Llama 3.3 70B picks the best 15 stories and writes plain English summaries, TL;DRs, and why-it-matters for each." },
              { n:'03', i:'✉️', t:'Hits your inbox', d:'Every Friday at 9am IST, a clean digest lands in your inbox via Brevo — reliable delivery, beautiful formatting.' },
              { n:'04', i:'🎓', t:'You stay sharp',  d:"Drop real AI news in interviews, seminars, and projects. Be the person in the room who actually knows what's happening." },
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

      {/* WHY */}
      <div className="wrap">
        <div className="why-section fi">
          <div className="why-card">
            <div className="why-accent">"</div>
            <div className="why-body">
              <h3>Why Neural Brief exists</h3>
              <p>AI moves insanely fast — new models, new tools, new research, every single day. Most students don't have time to track all of it. So Neural Brief does it for you. We read everything, cut the hype, and send you the 15 stories actually worth your attention. Free, every Friday, plain English.</p>
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
                <span>15 stories</span>
                <span>~15 min read</span>
                <span style={{ marginTop: "12px", color: "var(--accent)" }}>This week in AI</span>
              </div>
            </div>
            <div>
              {[
                { n:"01", tag:"t-model",    label:"New Model",  title:"Google drops Gemini 2.5 with 2M token context window",       desc:"Biggest context window yet — processes entire codebases in one shot.",       tldr:"→ TL;DR: Longer memory, smarter answers." },
                { n:"02", tag:"t-research", label:"Research",   title:"MIT: LLMs can plan 10-step tasks without fine-tuning",        desc:"Zero-shot prompting beats fine-tuning for complex multi-step tasks.",         tldr:"→ TL;DR: Prompting beats training. Big for AI agents." },
                { n:"03", tag:"t-industry", label:"Industry",   title:"OpenAI reportedly acquiring Windsurf for B",               desc:"The AI code editor wars heat up — OpenAI challenges Cursor and Copilot.",    tldr:"→ TL;DR: Code editors are the new AI battlefield." },
                { n:"04", tag:"t-tool",     label:"Tool Drop",  title:"Notion AI gets real-time web search built in",               desc:"Live web search in every Notion AI query — direct competition with Perplexity.", tldr:"→ TL;DR: Notion just became Perplexity for your notes." },
                { n:"05", tag:"t-opinion",  label:"Opinion",    title:"Why every AI company is racing to own your code editor",     desc:"A sharp take on why the IDE is the most strategic surface in AI.",           tldr:"→ TL;DR: Whoever owns your editor owns your workflow." },
              ].map(s => (
                <div className="inside-story" key={s.n}>
                  <span className="story-num">{s.n}</span>
                  <div className="story-body">
                    <span className={"stag " + s.tag}>{s.label}</span>
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
              <span className="email-url">From: neuralbrief18@gmail.com · Neural Brief #42 — This week in AI 🧠</span>
            </div>
            <div className="email-body">
              <div className="em-head">
                <div className="em-brand">Neural <span>Brief</span></div>
                <span className="em-tag">THIS WEEK IN AI · ISSUE #42 · FRIDAY DIGEST</span>
              </div>
              <div className="em-meta">
                <span>Friday, 21 March 2026</span>
                <span>15 stories · ~15 min read</span>
                <span>neural-brief-eight.vercel.app</span>
              </div>
              {[
                { tag:"t-model",    label:"New Model",  title:"Google drops Gemini 2.5 with 2M token context window",     body:"Google DeepMind latest model processes entire codebases in a single prompt. Strong reasoning improvements over 2.0.", tldr:"→ TL;DR: Longer memory, smarter answers." },
                { tag:"t-research", label:"Research",   title:"MIT shows LLMs can plan complex tasks without fine-tuning", body:"Base models reliably execute 10+ step real-world tasks through structured prompting alone — no training required.", tldr:"→ TL;DR: Prompting beats fine-tuning. Huge for AI agents." },
                { tag:"t-industry", label:"Industry",   title:"OpenAI in talks to acquire Windsurf for B",              body:"OpenAI acquiring Windsurf for a direct IDE-level product to compete with Cursor and Copilot.", tldr:"→ TL;DR: Code editors are the new AI battlefield." },
              ].map(s => (
                <div className="em-story" key={s.title}>
                  <span className={"stag " + s.tag}>{s.label}</span>
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
              {['No spam','Every Friday','Free forever','Plain English'].map(b => (
                <span className="badge" key={b}><span className="badge-dot"></span>{b}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <footer>
        <strong>Neural Brief</strong> · Weekly AI news for students · Est. 2025<br />
        Powered by Groq API · Sent via Brevo · Subscribers on Supabase<br />
        <a href="#">Unsubscribe</a> &nbsp;·&nbsp; <a href="https://neural-brief-eight.vercel.app">Website</a> &nbsp;·&nbsp; <a href="#">WhatsApp Channel</a><br /><br />
        <span style={{ opacity: 0.4 }}>© 2025 Neural Brief · Made with ☕ somewhere in India 🇮🇳</span>
      </footer>
    </>
  )
}