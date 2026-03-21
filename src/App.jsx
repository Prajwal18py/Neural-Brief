import { useState, useEffect } from 'react'
import logo from './assets/logo.jpg'

const TAG_CLASS = {
  'New Model': 't-model', 'Research': 't-research',
  'Industry': 't-industry', 'Tool Drop': 't-tool',
  'Policy': 't-opinion', 'Opinion': 't-opinion',
}

const SOURCE_LABELS = {
  'Google DeepMind': 'Official', 'OpenAI Blog': 'Official',
  'TechCrunch AI': 'Media', 'MIT Technology Review': 'Research',
  'VentureBeat AI': 'Media', 'The Verge AI': 'Media',
  'HackerNews AI': 'Community', 'Wired AI': 'Media', 'arXiv CS.AI': 'Research',
}

// ── Subscribe Form ────────────────────────────────────────
function SubscribeForm({ id, ctaText = 'Get the next brief →' }) {
  const [email, setEmail]     = useState('')
  const [status, setStatus]   = useState('idle')
  const [persona, setPersona] = useState('')

  const PERSONAS = ['Student', 'Developer', 'Founder', 'Creator']

  const handleSubmit = async () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setStatus('error'); setTimeout(() => setStatus('idle'), 2200); return
    }
    setStatus('loading')
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, persona }),
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
          {/* Persona selector */}
          <div className="persona-wrap">
            <span className="persona-label">I am a →</span>
            <div className="persona-options">
              {PERSONAS.map(p => (
                <button key={p}
                  className={'persona-btn' + (persona === p ? ' selected' : '')}
                  onClick={() => setPersona(persona === p ? '' : p)}>
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div className="form-row">
            <input type="email"
              placeholder={status === 'error' ? 'Enter a valid email ↑' : 'your@email.com'}
              style={{ color: status === 'error' ? '#c13d18' : '' }}
              value={email} onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              autoComplete="email" />
            <button className="btn-sub" onClick={handleSubmit} disabled={status === 'loading'}>
              {status === 'loading' ? 'Joining...' : ctaText}
            </button>
          </div>
          <span className="form-note">Free · No spam · Unsubscribe anytime</span>
        </>
      ) : (
        <div className="success-box">
          <span className="success-title">✦ You're in{persona ? ', ' + persona : ''}!</span>
          <span className="success-sub">Check inbox · Brief arrives this Friday 9am IST{persona ? ' · Curated for ' + persona + 's' : ''}</span>
        </div>
      )}
    </div>
  )
}

// ── Live Digest ───────────────────────────────────────────
function LiveDigest() {
  const [data, setData]         = useState(null)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(false)
  const [expanded, setExpanded] = useState({})

  const FALLBACK = {
    biggest_move: { title: 'OpenAI releases GPT-5 with major reasoning upgrades', reason: 'Biggest model leap in 2 years — faster, cheaper, and better at complex tasks.', link: 'https://openai.com' },
    jargon_of_week: { term: 'RAG (Retrieval Augmented Generation)', explanation: 'A technique where an AI looks up real information before answering — like giving it a search engine + brain combo.' },
    stories: [
      { tag: 'New Model',  title: 'Google drops Gemini 2.5 with 2M token context',        summary: 'Biggest context window yet — can process entire codebases in one shot. Strong reasoning gains over 2.0.',                         tldr: '-> TL;DR: Longer memory, smarter answers.',              why_it_matters: 'Developers can now build apps that understand entire codebases at once.',          source: 'Google DeepMind',       link: 'https://deepmind.google' },
      { tag: 'Research',   title: 'MIT: LLMs plan 10-step tasks without fine-tuning',      summary: 'Zero-shot prompting beats fine-tuning for complex multi-step real-world tasks, new MIT paper shows.',                              tldr: '-> TL;DR: Prompting beats training. Big for AI agents.', why_it_matters: 'Less compute, more power — great for student AI projects.',                       source: 'MIT Technology Review',  link: 'https://technologyreview.com' },
      { tag: 'Industry',   title: 'OpenAI reportedly acquiring Windsurf for B',          summary: 'The AI code editor wars heat up — OpenAI wants a direct IDE-level product to challenge Cursor and Copilot.',                        tldr: '-> TL;DR: Code editors are the new AI battlefield.',    why_it_matters: "Every major AI lab wants to own your IDE — here's why it matters.",              source: 'TechCrunch AI',          link: 'https://techcrunch.com' },
      { tag: 'Tool Drop',  title: 'Notion AI gets real-time web search built in',          summary: 'Live web search in every Notion AI query puts it in direct competition with Perplexity.',                                           tldr: '-> TL;DR: Notion just became Perplexity for your notes.', why_it_matters: 'Your notes can now answer questions using live web data.',                      source: 'The Verge AI',           link: 'https://theverge.com' },
      { tag: 'Research',   title: 'Anthropic publishes new AI safety framework',           summary: 'Anthropic released a detailed framework for evaluating AI safety at scale, covering robustness and alignment.',                      tldr: '-> TL;DR: AI safety is getting more structured.',        why_it_matters: 'Understanding safety frameworks helps you build more responsible AI projects.',  source: 'HackerNews AI',          link: 'https://news.ycombinator.com' },
    ]
  }

  useEffect(() => {
    fetch('/api/get-digest')
      .then(r => r.json())
      .then(d => { if (d.stories) setData(d); else setData(FALLBACK) })
      .catch(() => setData(FALLBACK))
      .finally(() => setLoading(false))
  }, [])

  const toggle = i => setExpanded(e => ({ ...e, [i]: !e[i] }))

  if (loading) return (
    <div style={{ padding: '48px 0', textAlign: 'center' }}>
      <div style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--muted2)', letterSpacing: '0.1em' }}>
        LOADING THIS WEEK'S STORIES...
      </div>
    </div>
  )

  const { stories, biggest_move, jargon_of_week } = data

  return (
    <div>
      {biggest_move && (
        <div className="biggest-move">
          <span className="biggest-move-label">🔥 Biggest move this week</span>
          <a href={biggest_move.link} target="_blank" rel="noopener noreferrer" className="biggest-move-title">
            {biggest_move.title}
          </a>
          <p className="biggest-move-reason">{biggest_move.reason}</p>
        </div>
      )}

      <div className="accordion">
        {stories.map((story, i) => {
          const srcLabel = SOURCE_LABELS[story.source]
          const isOpen   = expanded[i]
          return (
            <div className={'accordion-item' + (isOpen ? ' open' : '')} key={i}>
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
                    <a href={story.link} target="_blank" rel="noopener noreferrer" className="share-btn share-x">Read full story →</a>
                    {story.tweet && (
                      <>
                        <a href={'https://twitter.com/intent/tweet?text=' + encodeURIComponent(story.tweet)} target="_blank" rel="noopener noreferrer" className="share-btn share-x">Post on X →</a>
                        <a href={'https://www.linkedin.com/sharing/share-offsite/?url=' + encodeURIComponent(story.link)} target="_blank" rel="noopener noreferrer" className="share-btn share-li">LinkedIn →</a>
                      </>
                    )}
                  </div>
                  <p style={{ fontSize: '10px', fontFamily: 'var(--mono)', color: 'var(--muted2)', marginTop: '8px' }}>via {story.source}</p>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {jargon_of_week && (
        <div className="jargon-box">
          <span className="jargon-label">📖 Jargon of the week</span>
          <span className="jargon-term">{jargon_of_week.term}</span>
          <p className="jargon-exp">{jargon_of_week.explanation}</p>
        </div>
      )}

      <div className="digest-cta">
        <div>
          <p className="digest-cta-title">Get this in your inbox every Friday.</p>
          <p className="digest-cta-sub">Free · No spam · Unsubscribe anytime</p>
        </div>
        <a className="btn-primary" href="#subscribe">Get the next brief →</a>
      </div>
    </div>
  )
}


// ── Archive Component ─────────────────────────────────────
function ArchivePage({ onClose }) {
  const [briefs, setBriefs]   = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [detail, setDetail]   = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)

  useEffect(() => {
    fetch('/api/get-archive')
      .then(r => r.json())
      .then(d => setBriefs(d.briefs || []))
      .catch(() => setBriefs([]))
      .finally(() => setLoading(false))
  }, [])

  const openBrief = async (brief) => {
    setSelected(brief)
    setDetailLoading(true)
    try {
      const res  = await fetch(`/api/get-archive?id=${brief.id}`)
      const data = await res.json()
      setDetail(data)
    } catch { setDetail(null) }
    finally { setDetailLoading(false) }
  }

  const formatDate = (d) => new Date(d).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'long', year: 'numeric'
  })

  return (
    <div className="archive-overlay">
      <div className="archive-panel">
        <div className="archive-header">
          <div>
            <span className="archive-header-label">Past Briefs</span>
            <h2 style={{ margin: 0, fontSize: '22px' }}>Neural Brief Archive</h2>
          </div>
          <button className="archive-close" onClick={onClose}>✕ Close</button>
        </div>

        {!selected ? (
          // List view
          <div className="archive-list">
            {loading && (
              <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--muted2)' }}>
                LOADING ARCHIVE...
              </div>
            )}
            {!loading && briefs.length === 0 && (
              <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--muted2)' }}>
                No past briefs yet. Check back after the first Friday!
              </div>
            )}
            {briefs.map((brief) => (
              <div className="archive-item" key={brief.id} onClick={() => openBrief(brief)}>
                <div className="archive-item-left">
                  <span className="archive-brief-num">Brief #{brief.brief_num}</span>
                  <span className="archive-brief-date">{formatDate(brief.created_at)}</span>
                </div>
                <div className="archive-item-right">
                  {brief.biggest_move && (
                    <p className="archive-brief-title">{brief.biggest_move.title}</p>
                  )}
                  {brief.jargon && (
                    <span className="archive-jargon-tag">📖 {brief.jargon.term}</span>
                  )}
                </div>
                <span className="archive-arrow">→</span>
              </div>
            ))}
          </div>
        ) : (
          // Detail view
          <div className="archive-detail">
            <button className="archive-back" onClick={() => { setSelected(null); setDetail(null) }}>
              ← Back to archive
            </button>
            {detailLoading && (
              <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--muted2)' }}>
                LOADING BRIEF...
              </div>
            )}
            {!detailLoading && detail && (
              <div>
                <div className="archive-detail-header">
                  <span className="archive-brief-num">Brief #{detail.brief_num}</span>
                  <span className="archive-brief-date">{formatDate(detail.created_at)}</span>
                </div>

                {detail.biggest_move && (
                  <div className="biggest-move" style={{ margin: '20px 0 0' }}>
                    <span className="biggest-move-label">🔥 Biggest move this week</span>
                    <a href={detail.biggest_move.link} target="_blank" rel="noopener noreferrer" className="biggest-move-title">
                      {detail.biggest_move.title}
                    </a>
                    <p className="biggest-move-reason">{detail.biggest_move.reason}</p>
                  </div>
                )}

                <div className="archive-stories">
                  {(detail.stories || []).map((story, i) => (
                    <div className="archive-story" key={i}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--muted2)' }}>#{String(i+1).padStart(2,'0')}</span>
                        <span className={`stag ${TAG_CLASS[story.tag] || 't-research'}`}>{story.tag}</span>
                      </div>
                      <a href={story.link} target="_blank" rel="noopener noreferrer" className="live-title">{story.title}</a>
                      <p className="live-summary">{story.summary}</p>
                      <p className="live-tldr">{story.tldr}</p>
                      {story.why_it_matters && (
                        <div className="why-matters">
                          <span className="why-matters-label">Why it matters → </span>
                          <span className="why-matters-text">{story.why_it_matters}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {detail.jargon && (
                  <div className="jargon-box">
                    <span className="jargon-label">📖 Jargon of the week</span>
                    <span className="jargon-term">{detail.jargon.term}</span>
                    <p className="jargon-exp">{detail.jargon.explanation}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main App ──────────────────────────────────────────────
export default function App() {
  const [showArchive, setShowArchive] = useState(false)
  return (
    <>
      {/* ARCHIVE OVERLAY */}
      {showArchive && <ArchivePage onClose={() => setShowArchive(false)} />}

      {/* NAV */}
      <nav>
        <a className="logo" href="#">
          <img src={logo} alt="NB" />
          <span className="logo-text">Neural <span>Brief</span></span>
        </a>
        <div className="nav-right">
          <span className="nav-chip">Every Friday · Free</span>
          <button className="nav-archive-btn" onClick={() => setShowArchive(true)}>Past Briefs</button>
          <a className="nav-cta" href="#subscribe">Get the next brief →</a>
        </div>
      </nav>

      {/* MASTHEAD */}
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
          <span>AI news, filtered for humans</span>
          <span>✦ ✦ ✦</span>
          <span>15 stories · 3 min read · ₹0 forever</span>
        </div>
      </div>

      {/* HERO */}
      <div className="wrap">
        <div className="hero-grid">
          <div className="hero-main fi">
            <div className="kicker">
              <span className="kicker-bar"></span>Weekly AI News Digest<span className="kicker-bar"></span>
            </div>

            {/* NEW HERO HEADLINE */}
            <h1>AI news,<br />filtered for <em style={{ fontStyle: 'italic', color: 'var(--accent)' }}>humans.</em></h1>

            <p className="hero-deck">
              Stop wasting time scrolling. Get the <strong>15 AI stories that actually matter</strong>, 
              delivered every Friday in under <strong>3 minutes</strong>.
            </p>

            <p className="why-line">
              No hype. No jargon. No noise. Just signal — with plain English summaries, 
              source labels, and "why it matters" for every story.
            </p>

            {/* CTA GROUP */}
            <div className="cta-group">
              <a className="btn-primary btn-large" href="#subscribe">Get the next brief →</a>
              <a className="btn-secondary" href="#this-week">Read this week's issue</a>
            </div>

            <SubscribeForm id="subscribe" ctaText="Get the next brief →" />

            {/* TRUST STRIP */}
            <div className="trust-strip">
              {[
                ['⏱', '3 min read'],
                ['🚫', 'No jargon'],
                ['📡', 'Only signal'],
                ['₹0', 'Free forever'],
                ['🔕', 'No spam'],
              ].map(([icon, text]) => (
                <span className="trust-item" key={text}>
                  <span className="trust-icon">{icon}</span>
                  <span>{text}</span>
                </span>
              ))}
            </div>
          </div>

          {/* SIDEBAR */}
          <div className="hero-sidebar fi">
            <div className="sb-section">
              <span className="sb-label">By the numbers</span>
              {[
                ['Stories per issue', '15'],
                ['Read time', '< 3 min'],
                ['Delivery', 'Every Friday'],
                ['Language', 'Plain English'],
                ['Cost', '₹0'],
              ].map(([k, v]) => (
                <div className="stat-row" key={k}><span className="stat-key">{k}</span><span className="stat-val">{v}</span></div>
              ))}
            </div>
            <div className="sb-section">
              <span className="sb-label">Sources we track</span>
              {['HackerNews AI', 'TechCrunch AI', 'Google DeepMind', 'OpenAI Blog', 'arXiv CS.AI', 'MIT Tech Review', 'The Verge AI'].map(s => (
                <div className="src-item" key={s}><span className="src-dot"></span>{s}</div>
              ))}
            </div>
            <div className="sb-section">
              <span className="sb-label">Built with</span>
              {['Groq · Llama 3.3 70B', 'Brevo · Email delivery', 'Supabase · Subscribers'].map(s => (
                <div className="src-item" key={s}><span className="src-dot"></span>{s}</div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* WHAT MAKES IT DIFFERENT */}
      <div className="wrap">
        <div className="section fi">
          <div className="section-hd"><span className="section-sym">§</span><h2>What makes Neural Brief different</h2></div>
          <div className="diff-grid">
            {[
              { icon: '📡', title: 'Only signal, no noise', desc: 'We track 7 top AI sources, read everything, and send you only what actually matters.' },
              { icon: '🗣', title: 'Plain English, always', desc: 'No jargon. No hype. Every story explained like you\'re talking to a friend.' },
              { icon: '🇮🇳', title: '"Why it matters" for India', desc: 'Every story has a dedicated callout — why should an Indian student or developer care?' },
              { icon: '🏷', title: 'Source credibility labels', desc: 'Official, Media, Research, or Community — know how much to trust each story.' },
              { icon: '📖', title: 'Jargon of the week', desc: 'One AI term explained simply at the bottom of every issue. RAG, fine-tuning, embeddings — demystified.' },
              { icon: '🐦', title: 'Ready-to-share posts', desc: 'Every story has a tweet and LinkedIn post written by AI — share your knowledge in one click.' },
            ].map(d => (
              <div className="diff-card" key={d.title}>
                <span className="diff-icon">{d.icon}</span>
                <p className="diff-title">{d.title}</p>
                <p className="diff-desc">{d.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* THIS WEEK IN AI — LIVE */}
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

      {/* SAMPLE ISSUE */}
      <div className="wrap" id="sample">
        <div className="sample-section fi">
          <div className="section-hd"><span className="section-sym">§</span><h2>Inside a typical issue</h2></div>

          {/* Biggest move preview */}
          <div style={{ background: 'var(--text)', padding: '20px 24px', marginBottom: '0', borderRadius: '3px 3px 0 0' }}>
            <span style={{ fontFamily: 'var(--mono)', fontSize: '9px', color: 'rgba(255,255,255,.4)', letterSpacing: '.14em', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
              🔥 Biggest Move
            </span>
            <p style={{ fontFamily: 'var(--serif)', fontSize: '17px', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>
              OpenAI launches GPT-5 with major upgrades
            </p>
            <p style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--accent)', marginBottom: '6px' }}>
              → TL;DR: Faster, cheaper, and better at reasoning than anything before it.
            </p>
            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,.45)', lineHeight: '1.6' }}>
              <span style={{ fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '.08em' }}>Why it matters → </span>
              This could replace multiple tools and reduce AI costs for developers and startups significantly.
            </p>
          </div>

          <div className="inside-grid" style={{ borderTop: 'none', borderRadius: '0 0 0 0' }}>
            <div className="inside-sidebar">
              <span className="inside-label">Neural Brief</span>
              <div className="inside-meta">
                <span>Brief #42</span>
                <span>15 stories</span>
                <span>~3 min read</span>
                <span style={{ marginTop: '12px', color: 'var(--accent)' }}>This week in AI</span>
              </div>
            </div>
            <div>
              {[
                { n: '01', tag: 't-model',    label: 'New Model',  emoji: '🧠', title: 'Google drops Gemini 2.5 with 2M token context',         tldr: '→ TL;DR: Longer memory, smarter answers.',               why: 'Developers can now build apps that understand entire codebases at once.' },
                { n: '02', tag: 't-research', label: 'Research',   emoji: '🔬', title: 'MIT: LLMs plan 10-step tasks without fine-tuning',        tldr: '→ TL;DR: Prompting beats training for complex tasks.',    why: 'Less compute, more power — great for student AI projects.' },
                { n: '03', tag: 't-industry', label: 'Industry',   emoji: '⚡', title: 'OpenAI acquiring Windsurf for $3B',                       tldr: '→ TL;DR: Code editors are the new AI battlefield.',      why: 'Every major AI lab wants to own your IDE — here\'s why.' },
                { n: '04', tag: 't-tool',     label: 'Tool Drop',  emoji: '🛠', title: 'Notion AI gets real-time web search',                     tldr: '→ TL;DR: Notion just became Perplexity for your notes.', why: 'Your notes can now answer questions using live web data.' },
              ].map(s => (
                <div className="inside-story" key={s.n}>
                  <span className="story-num">{s.n}</span>
                  <div className="story-body">
                    <span className={'stag ' + s.tag}>{s.emoji} {s.label}</span>
                    <p className="story-title">{s.title}</p>
                    <p className="story-tldr">{s.tldr}</p>
                    <p style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '4px', lineHeight: '1.6' }}>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '.08em' }}>Why it matters → </span>
                      {s.why}
                    </p>
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
                <span className="em-tag">THIS WEEK IN AI · BRIEF #42 · FRIDAY DIGEST</span>
              </div>
              <div className="em-meta">
                <span>Friday, 21 March 2026</span>
                <span>15 stories · ~3 min read</span>
                <span>neural-brief-eight.vercel.app</span>
              </div>
              {[
                { tag: 't-model',    label: 'New Model',  title: 'Google drops Gemini 2.5 with 2M token context', body: "Biggest context window yet — processes entire codebases. Strong reasoning gains over 2.0.", tldr: '→ TL;DR: Longer memory, smarter answers.' },
                { tag: 't-research', label: 'Research',   title: 'MIT: LLMs plan complex tasks without fine-tuning', body: 'Base models execute 10+ step real-world tasks through structured prompting alone — no training required.', tldr: '→ TL;DR: Prompting beats fine-tuning. Huge for AI agents.' },
                { tag: 't-industry', label: 'Industry',   title: 'OpenAI in talks to acquire Windsurf for $3B', body: "OpenAI acquiring Windsurf for a direct IDE-level product to compete with Cursor and Copilot.", tldr: '→ TL;DR: Code editors are the new AI battlefield.' },
              ].map(s => (
                <div className="em-story" key={s.title}>
                  <span className={'stag ' + s.tag}>{s.label}</span>
                  <p className="em-title">{s.title}</p>
                  <p className="em-body">{s.body}</p>
                  <p className="em-tldr">{s.tldr}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* HOW IT WORKS */}
      <div className="wrap">
        <div className="section fi">
          <div className="section-hd"><span className="section-sym">§</span><h2>How Neural Brief works</h2></div>
          <div className="steps">
            {[
              { n: '01', i: '📡', t: 'We track top AI sources',   d: 'Every Friday we pull fresh stories from 7+ top AI sources — TechCrunch, HackerNews, DeepMind, arXiv, MIT Tech Review, and more.' },
              { n: '02', i: '🔍', t: 'Filter out the noise',       d: "Groq's Llama 3.3 70B reads everything and picks only the 15 stories worth your attention. No fluff, no duplication." },
              { n: '03', i: '✍️', t: 'Summarise what matters',     d: 'Each story gets a plain English summary, a TL;DR, a why-it-matters callout, and a ready-to-share social post.' },
              { n: '04', i: '📬', t: 'Delivered to your inbox',    d: 'Every Friday at 9am IST a clean, beautifully formatted digest lands in your inbox. Read it over chai in 3 minutes.' },
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

      {/* WHY THIS EXISTS */}
      <div className="wrap">
        <div className="why-section fi">
          <div className="why-card">
            <div className="why-accent">"</div>
            <div className="why-body">
              <h3>Why this exists</h3>
              <p>
                AI moves fast. Most of it is noise. Neural Brief filters everything 
                and gives you only what's worth your time — in plain English. 
                No hype. No doom. No jargon. Just the <strong style={{ color: '#fff' }}>15 stories that actually moved the needle</strong> this week, 
                delivered free to your inbox every Friday.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* FINAL CTA */}
      <div className="wrap">
        <div className="final-cta-section fi">
          <div className="final-cta-inner">
            <p className="final-cta-eyebrow">Join Neural Brief</p>
            <h2 style={{ marginBottom: '12px' }}>Stop missing the AI<br />stories that matter.</h2>
            <p className="cta-sub">
              Join Neural Brief and stay ahead — without the noise.<br />
              <strong>Free. Takes 3 minutes. No spam.</strong>
            </p>
            <div style={{ maxWidth: '440px', margin: '32px auto 0' }}>
              <SubscribeForm id="subscribe-bottom" ctaText="Get the next brief →" />
              <div className="trust-strip" style={{ justifyContent: 'center', marginTop: '20px' }}>
                {[['⏱', '3 min read'], ['🚫', 'No jargon'], ['₹0', 'Free forever'], ['🔕', 'No spam']].map(([icon, text]) => (
                  <span className="trust-item" key={text}>
                    <span className="trust-icon">{icon}</span>
                    <span>{text}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <footer>
        <strong>Neural Brief</strong> · Weekly AI news for students · Est. 2025<br />
        Powered by Groq API · Sent via Brevo · Subscribers on Supabase<br />
        Sources: TechCrunch · MIT Tech Review · HackerNews · DeepMind · The Verge · Wired<br />
        Built by <strong>Prajwal A</strong> · Sem 4 AIML · Bengaluru 🇮🇳<br /><br />
        <a href="#">Unsubscribe</a> &nbsp;·&nbsp;
        <a href="https://neural-brief-eight.vercel.app">Website</a> &nbsp;·&nbsp;
        <a href="https://github.com/Prajwal18py/Neural-Brief">GitHub</a> &nbsp;·&nbsp;
        <a href="mailto:neuralbrief18@gmail.com">Contact</a><br /><br />
        <span style={{ opacity: 0.4 }}>© 2025 Neural Brief · Made with ☕ somewhere in India</span>
      </footer>
    </>
  )
}