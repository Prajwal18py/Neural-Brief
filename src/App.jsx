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
  'VentureBeat AI': 'Media', 'Wired AI': 'Media', 'arXiv CS.AI': 'Research',
  'Ars Technica AI': 'Media', 'ZDNet AI': 'Media', 'The Register AI': 'Media', 'Mashable Tech': 'Media',
}

const SIGNAL_COLORS = {
  'Major':       { bg: '#fef0ec', color: '#c13d18', border: '#f5cec4' },
  'Important':   { bg: '#fdf5e8', color: '#7a5018', border: '#e8d3a0' },
  'Interesting': { bg: '#ebf0f9', color: '#27438a', border: '#bcc9ec' },
  'Minor':       { bg: '#f4f4f4', color: '#888',    border: '#ddd'    },
}

// Subscribe Form
function SubscribeForm({ id, ctaText = 'Get the next brief' }) {
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
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, persona }),
      })
      if (res.ok) setStatus('success')
      else { setStatus('idle'); alert('Something went wrong. Please try again.') }
    } catch { setStatus('idle'); alert('Something went wrong. Please try again.') }
  }

  return (
    <div className="subscribe-wrap" id={id}>
      <span className="sub-label">Drop your email, it is free</span>
      {status !== 'success' ? (
        <>
          <div className="persona-wrap">
            <span className="persona-label">I am a</span>
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
              placeholder={status === 'error' ? 'Enter a valid email' : 'your@email.com'}
              style={{ color: status === 'error' ? '#c13d18' : '' }}
              value={email}
              onChange={e => setEmail(e.target.value)}
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
          <span className="success-title">You are in{persona ? ', ' + persona : ''}!</span>
          <span className="success-sub">Check inbox · Brief arrives this Friday 9am IST{persona ? ' · Curated for ' + persona + 's' : ''}</span>
        </div>
      )}
    </div>
  )
}

// Favicon helper
function getFavicon(url) {
  try {
    const domain = new URL(url).hostname
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`
  } catch {
    return null
  }
}

// Favicon image with fallback
function FaviconImg({ url, source, size = 20 }) {
  const [errored, setErrored] = useState(false)
  const src = getFavicon(url)
  if (!src || errored) {
    return (
      <div className="live-favicon-fallback" style={{ width: size, height: size, fontSize: size * 0.5 }}>
        {source ? source.charAt(0).toUpperCase() : '?'}
      </div>
    )
  }
  return (
    <img
      src={src}
      alt={source}
      className="live-favicon"
      style={{ width: size, height: size }}
      onError={() => setErrored(true)}
    />
  )
}

// Today's Top 5 Live Feed
function LiveFeed() {
  const [stories, setStories]         = useState([])
  const [loading, setLoading]         = useState(true)
  const [lastUpdated, setLastUpdated] = useState('')

  const FALLBACK = [
    { title: 'OpenAI releases new reasoning model with major upgrades', why: 'Better reasoning means smarter AI tools coming to developers soon.', link: 'https://openai.com', source: 'TechCrunch AI', published: new Date().toISOString() },
    { title: 'Google cuts AI API pricing across all Gemini models', why: 'AI tools will get cheaper — good news for students and startups.', link: 'https://deepmind.google', source: 'Google DeepMind', published: new Date().toISOString() },
    { title: 'Meta open sources new language model with strong benchmarks', why: 'More competition means more choice and lower costs for builders.', link: 'https://ai.meta.com', source: 'HackerNews AI', published: new Date().toISOString() },
    { title: 'Anthropic releases new Claude model with improved reasoning', why: 'Better AI assistants mean more powerful tools for building and learning.', link: 'https://anthropic.com', source: 'Anthropic News', published: new Date().toISOString() },
    { title: 'NVIDIA announces next-gen chips for AI inference', why: 'Faster, cheaper inference means more AI tools accessible to everyone.', link: 'https://nvidia.com', source: 'VentureBeat AI', published: new Date().toISOString() },
  ]

  function getWhy(title) {
    const t = title.toLowerCase()
    if (t.includes('open source') || t.includes('open-source')) return 'Free access to powerful AI — great for student projects and indie builders.'
    if (t.includes('pric') || t.includes('cheap') || t.includes('cost') || t.includes('free')) return 'Lower AI costs = more accessible tools for students and startups.'
    if (t.includes('model') || t.includes('gpt') || t.includes('gemini') || t.includes('claude') || t.includes('llm')) return 'New model capabilities mean smarter AI apps you can build.'
    if (t.includes('acqui') || t.includes('merger') || t.includes('buy') || t.includes('billion')) return 'Big money moves signal where AI is heading next — worth watching.'
    if (t.includes('research') || t.includes('paper') || t.includes('study')) return 'Academic breakthroughs often become practical tools within months.'
    if (t.includes('tool') || t.includes('launch') || t.includes('release') || t.includes('update')) return 'New tools in the AI stack you might use in your next project.'
    if (t.includes('safety') || t.includes('regulation') || t.includes('policy') || t.includes('ban')) return 'AI rules are being written now — they will affect every builder.'
    if (t.includes('agent') || t.includes('automat')) return 'AI agents are the next frontier — knowing this early gives you an edge.'
    if (t.includes('india') || t.includes('indian')) return 'Direct impact on the Indian AI ecosystem and opportunities here.'
    return 'This development shapes the AI tools and landscape you work with.'
  }

  useEffect(() => {
    fetch('/api/get-live-feed')
      .then(r => r.json())
      .then(d => {
        if (d.stories && d.stories.length > 0) {
          setStories(d.stories)
          if (d.stories[0].published) {
            const date = new Date(d.stories[0].published)
            setLastUpdated(date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) + ' IST')
          }
        } else {
          setStories(FALLBACK)
        }
      })
      .catch(() => setStories(FALLBACK))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div style={{ padding: '20px 0', fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--muted2)' }}>
      LOADING LATEST...
    </div>
  )

  return (
    <div className="live-feed">
      {stories.map((story, i) => (
        <a
          key={i}
          href={story.link}
          target="_blank"
          rel="noopener noreferrer"
          className="live-feed-item"
        >
          {/* Number */}
          <div className="live-feed-left">
            <span className="live-feed-num">{String(i + 1).padStart(2, '0')}</span>
          </div>

          {/* Favicon */}
          <div className="live-feed-favicon-wrap">
            <FaviconImg url={story.link} source={story.source} />
          </div>

          {/* Text */}
          <div className="live-feed-body">
            <span className="live-feed-title">{story.title}</span>
            <span className="live-feed-why">→ {story.why || getWhy(story.title)}</span>
            <span className="live-feed-source">via {story.source}</span>
          </div>

          {/* Arrow */}
          <div className="live-feed-arrow">→</div>
        </a>
      ))}
      <div className="live-feed-footer">
        <span>Updated {lastUpdated || 'recently'}</span>
        <a href="#this-week" className="live-feed-cta" onClick={e => e.stopPropagation()}>
          See deeper insights in this week's brief ↓
        </a>
      </div>
    </div>
  )
}

// Live Digest
function LiveDigest() {
  const [data, setData]           = useState(null)
  const [loading, setLoading]     = useState(true)
  const [expanded, setExpanded]   = useState({})
  const [eli15Open, setEli15Open] = useState({})
  const [persona, setPersona]     = useState(() => {
    try { return localStorage.getItem('nb_persona') || '' } catch { return '' }
  })

  const FALLBACK = {
    biggest_move: {
      title: 'OpenAI releases GPT-5 with major reasoning upgrades',
      reason: 'Biggest model leap in 2 years — faster, cheaper, and better at complex tasks.',
      link: 'https://openai.com'
    },
    jargon_of_week: {
      term: 'RAG (Retrieval Augmented Generation)',
      explanation: 'A technique where an AI looks up real information before answering — like giving it a search engine and brain combo.'
    },
    stories: [
      {
        tag: 'New Model', title: 'Google drops Gemini 2.5 with 2M token context',
        summary: 'Biggest context window yet — can process entire codebases in one shot. Strong reasoning gains over 2.0.',
        tldr: '-> TL;DR: Longer memory, smarter answers.',
        why_student: 'You can now build AI apps that read your entire codebase at once.',
        why_developer: 'Process entire codebases in a single prompt — massive for AI tooling.',
        why_founder: 'Cheaper and more powerful AI means lower cost to build intelligent products.',
        signal_score: 9.2, signal_label: 'Major',
        source: 'Google DeepMind', link: 'https://deepmind.google',
        eli15: 'Imagine an AI that can read your entire textbook in one go instead of just one chapter.',
        tweet: 'Google just dropped Gemini 2.5 with a 2M token context window. You can now feed it your entire codebase. #AI #Gemini',
        linkedin: 'Google DeepMind just released Gemini 2.5 with a 2 million token context window. This means AI can now process entire codebases in a single prompt. For developers building AI products, this dramatically reduces complexity and cost. #AI #GoogleDeepMind',
        hype: 'Google claims this is the most powerful AI model ever built that changes everything.',
        reality: 'A genuinely large context window — very useful for developers, but not magic.'
      },
      {
        tag: 'Research', title: 'MIT: LLMs plan 10-step tasks without fine-tuning',
        summary: 'Zero-shot prompting beats fine-tuning for complex multi-step real-world tasks, new MIT paper shows.',
        tldr: '-> TL;DR: Prompting beats training. Big for AI agents.',
        why_student: 'Less compute, more power — great for student AI projects with no GPU budget.',
        why_developer: 'Build powerful AI agents without expensive fine-tuning pipelines.',
        why_founder: 'Reduces AI development costs significantly.',
        signal_score: 7.8, signal_label: 'Important',
        source: 'MIT Technology Review', link: 'https://technologyreview.com',
        eli15: 'Getting an A on a test without studying — just by reading the question really carefully.',
        tweet: 'MIT proves LLMs can plan complex 10-step tasks with zero fine-tuning. Prompting > Training. #AI #Research',
        linkedin: 'New research from MIT shows that base language models can execute complex multi-step tasks through structured prompting alone. This means you can achieve sophisticated AI behavior without expensive training pipelines. #AI #Research',
        hype: 'AI can now plan and execute like a human expert without any training.',
        reality: 'Structured prompting improves multi-step task completion — useful but still limited.'
      },
      {
        tag: 'Industry', title: 'OpenAI reportedly acquiring Windsurf for 3B',
        summary: 'The AI code editor wars heat up — OpenAI wants a direct IDE-level product to challenge Cursor and Copilot.',
        tldr: '-> TL;DR: Code editors are the new AI battlefield.',
        why_student: 'The tools you code with are becoming AI-first — learn them early.',
        why_developer: 'Your IDE is becoming the most contested surface in AI.',
        why_founder: 'AI dev tools market is exploding — signals huge demand for developer productivity.',
        signal_score: 8.5, signal_label: 'Major',
        source: 'TechCrunch AI', link: 'https://techcrunch.com',
        eli15: 'Every big company wants to own the app you use to write code because it is the most valuable real estate in tech.',
        tweet: 'OpenAI acquiring Windsurf for 3B. The IDE is the new battleground. #AI #Coding #OpenAI',
        linkedin: 'OpenAI is reportedly acquiring Windsurf for 3 billion dollars. Every major AI lab wants to own where developers write code. This is not just about tools — it is about owning the developer workflow. #OpenAI #AI #DeveloperTools',
        hype: 'OpenAI is about to dominate coding forever with this acquisition.',
        reality: 'Strategic IDE acquisition — competition with Cursor and Copilot intensifies.'
      },
      {
        tag: 'Tool Drop', title: 'Notion AI gets real-time web search built in',
        summary: 'Live web search in every Notion AI query puts it in direct competition with Perplexity.',
        tldr: '-> TL;DR: Notion just became Perplexity for your notes.',
        why_student: 'Your notes can now answer questions using live web data — great for research.',
        why_developer: 'A major productivity tool just got significantly smarter at no extra cost.',
        why_founder: 'Shows how AI features are becoming table stakes in every product.',
        signal_score: 6.5, signal_label: 'Interesting',
        source: 'VentureBeat AI', link: 'https://venturebeat.com',
        eli15: 'Imagine your notebook could search Google while you are writing in it.',
        tweet: 'Notion AI now has real-time web search. Your notes just got a brain upgrade. #Notion #AI #Productivity',
        linkedin: 'Notion just added real-time web search to Notion AI. This puts Notion in direct competition with Perplexity and signals that AI-powered search is becoming a standard feature. #Notion #AI',
        hype: 'Notion AI is now smarter than Google for research.',
        reality: 'Web search added to Notion AI — handy feature, but Perplexity still leads in search quality.'
      },
      {
        tag: 'Research', title: 'Anthropic publishes new AI safety framework',
        summary: 'Anthropic released a detailed framework for evaluating AI safety at scale, covering robustness and alignment.',
        tldr: '-> TL;DR: AI safety is getting more structured.',
        why_student: 'Understanding safety frameworks helps you build more responsible AI projects.',
        why_developer: 'A practical guide for building safer AI systems — worth reading.',
        why_founder: 'Regulatory requirements for AI safety are coming — get ahead of it now.',
        signal_score: 7.2, signal_label: 'Important',
        source: 'HackerNews AI', link: 'https://news.ycombinator.com',
        eli15: 'Anthropic wrote a rulebook for how to make sure AI does not do bad things.',
        tweet: 'Anthropic just published a comprehensive AI safety framework. Safety needs to scale with capability. #AI #Safety',
        linkedin: 'Anthropic has released a new comprehensive framework for AI safety evaluation. As AI systems become more capable, structured safety evaluation becomes critical. #Anthropic #AISafety',
        hype: 'Anthropic has solved AI safety with this new framework.',
        reality: 'A useful evaluation framework — important step, but AI safety remains an open problem.'
      },
    ]
  }

  useEffect(() => {
    fetch('/api/get-digest')
      .then(r => r.json())
      .then(d => { if (d.stories) setData(d); else setData(FALLBACK) })
      .catch(() => setData(FALLBACK))
      .finally(() => setLoading(false))
  }, [])

  const toggle       = i => setExpanded(e => ({ ...e, [i]: !e[i] }))
  const toggleEli15  = i => setEli15Open(e => ({ ...e, [i]: !e[i] }))
  const updatePersona = p => {
    const val = persona === p ? '' : p
    setPersona(val)
    try { localStorage.setItem('nb_persona', val) } catch {}
  }

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
      {/* Time saved counter */}
      <div className="time-saved-bar">
        <span className="time-saved-icon">⏱</span>
        <div className="time-saved-content">
          <span className="time-saved-text">You just saved <strong>~45 minutes</strong> of AI research</span>
          <span className="time-saved-sub">15 stories tracked · summarised · delivered to you</span>
        </div>
      </div>

      {/* Persona switcher */}
      <div className="digest-persona-bar">
        <span className="digest-persona-label">Personalise for</span>
        <div className="digest-persona-opts">
          {['Student', 'Developer', 'Founder', 'Creator'].map(p => (
            <button key={p}
              className={'digest-persona-btn' + (persona === p ? ' active' : '')}
              onClick={() => updatePersona(p)}>
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Biggest Move */}
      {biggest_move && (
        <div className="biggest-move">
          <span className="biggest-move-label">Biggest move this week</span>
          <a href={biggest_move.link} target="_blank" rel="noopener noreferrer" className="biggest-move-title">
            {biggest_move.title}
          </a>
          <p className="biggest-move-reason">{biggest_move.reason}</p>
        </div>
      )}

      {/* Accordion */}
      <div className="accordion">
        {stories.map((story, i) => {
          const srcLabel = SOURCE_LABELS[story.source]
          const isOpen   = expanded[i]
          const signal   = story.signal_label ? (SIGNAL_COLORS[story.signal_label] || SIGNAL_COLORS['Interesting']) : null
          const whyKey   = persona === 'Developer' ? 'why_developer' : persona === 'Founder' ? 'why_founder' : 'why_student'
          const whyLabel = persona === 'Developer' ? 'Why devs care' : persona === 'Founder' ? 'Why founders care' : persona === 'Creator' ? 'Why creators care' : 'Why students care'
          const whyText  = story[whyKey] || story.why_student || story.why_it_matters || ''

          return (
            <div className={'accordion-item' + (isOpen ? ' open' : '')} key={i}>
              <button className="accordion-header" onClick={() => toggle(i)}>
                <div className="accordion-left">
                  <span className="live-num">{String(i + 1).padStart(2, '0')}</span>
                  <div className="accordion-meta">
                    <div className="accordion-tags">
                      <span className={'stag ' + (TAG_CLASS[story.tag] || 't-research')}>{story.tag}</span>
                      {srcLabel && <span className={'src-label src-' + srcLabel.toLowerCase()}>{srcLabel}</span>}
                      {signal && story.signal_score && (
                        <span className="signal-badge" style={{ background: signal.bg, color: signal.color, border: '1px solid ' + signal.border }}>
                          {story.signal_score}/10 {story.signal_label}
                        </span>
                      )}
                    </div>
                    <span className="accordion-title">{story.title}</span>
                  </div>
                </div>
                <span className="accordion-chevron">{isOpen ? '-' : '+'}</span>
              </button>

              {isOpen && (
                <div className="accordion-body">
                  <p className="live-summary">{story.summary}</p>
                  <p className="live-tldr">{story.tldr}</p>

                  {whyText && (
                    <div className="why-matters">
                      <span className="why-matters-label">{whyLabel} </span>
                      <span className="why-matters-text">{whyText}</span>
                    </div>
                  )}

                  {story.eli15 && (
                    <div className="eli15-wrap">
                      <button className="eli15-btn" onClick={() => toggleEli15(i)}>
                        {eli15Open[i] ? 'Collapse' : 'Break it down'}
                      </button>
                      {eli15Open[i] && (
                        <div className="eli15-box">
                          <span className="eli15-label">Simple version: </span>
                          <span className="eli15-text">{story.eli15}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* AI vs Reality */}
                  {(story.hype && story.reality) && (
                    <div className="hype-reality">
                      <div className="hype-row">
                        <span className="hype-label">Hype</span>
                        <span className="hype-text">{story.hype}</span>
                      </div>
                      <div className="reality-row">
                        <span className="reality-label">Reality</span>
                        <span className="reality-text">{story.reality}</span>
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
                    <a href={story.link} target="_blank" rel="noopener noreferrer" className="share-btn share-x">Read full story</a>
                    {story.tweet && (
                      <a href={'https://twitter.com/intent/tweet?text=' + encodeURIComponent(story.tweet)}
                        target="_blank" rel="noopener noreferrer" className="share-btn share-x">
                        Post on X
                      </a>
                    )}
                    {story.linkedin && (
                      <button className="share-btn share-li" onClick={() => {
                        navigator.clipboard.writeText(story.linkedin + '\n\n' + story.link + '\n\nvia Neural Brief -> neural-brief-eight.vercel.app')
                          .then(() => alert('LinkedIn post copied! Paste it on LinkedIn'))
                          .catch(() => alert('Could not copy. Please copy manually.'))
                      }}>
                        Copy LinkedIn post
                      </button>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px' }}>
                    <FaviconImg url={story.link} source={story.source} size={14} />
                    <p style={{ fontSize: '10px', fontFamily: 'var(--mono)', color: 'var(--muted2)', margin: 0 }}>via {story.source}</p>
                  </div>
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
        <a className="btn-primary" href="#subscribe">Get the next brief</a>
      </div>
    </div>
  )
}

// Archive
function ArchivePage({ onClose }) {
  const [briefs, setBriefs]               = useState([])
  const [loading, setLoading]             = useState(true)
  const [selected, setSelected]           = useState(null)
  const [detail, setDetail]               = useState(null)
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
      const res  = await fetch('/api/get-archive?id=' + brief.id)
      const data = await res.json()
      setDetail(data)
    } catch { setDetail(null) }
    finally { setDetailLoading(false) }
  }

  const formatDate = d => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })

  return (
    <div className="archive-overlay">
      <div className="archive-panel">
        <div className="archive-header">
          <div>
            <span className="archive-header-label">Past Briefs</span>
            <h2 style={{ margin: 0, fontSize: '22px' }}>Neural Brief Archive</h2>
          </div>
          <button className="archive-close" onClick={onClose}>Close</button>
        </div>

        {!selected ? (
          <div className="archive-list">
            {loading && <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--muted2)' }}>LOADING ARCHIVE...</div>}
            {!loading && briefs.length === 0 && <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--muted2)' }}>No past briefs yet. Check back after the first Friday!</div>}
            {briefs.map(brief => (
              <div className="archive-item" key={brief.id} onClick={() => openBrief(brief)}>
                <div className="archive-item-left">
                  <span className="archive-brief-num">Brief #{brief.brief_num}</span>
                  <span className="archive-brief-date">{formatDate(brief.created_at)}</span>
                </div>
                <div className="archive-item-right">
                  {brief.biggest_move && <p className="archive-brief-title">{brief.biggest_move.title}</p>}
                  {brief.jargon && <span className="archive-jargon-tag">{brief.jargon.term}</span>}
                </div>
                <span className="archive-arrow">→</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="archive-detail">
            <button className="archive-back" onClick={() => { setSelected(null); setDetail(null) }}>Back to archive</button>
            {detailLoading && <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--muted2)' }}>LOADING BRIEF...</div>}
            {!detailLoading && detail && (
              <div>
                <div className="archive-detail-header">
                  <span className="archive-brief-num">Brief #{detail.brief_num}</span>
                  <span className="archive-brief-date">{formatDate(detail.created_at)}</span>
                </div>
                {detail.biggest_move && (
                  <div className="biggest-move" style={{ margin: '20px 0 0' }}>
                    <span className="biggest-move-label">Biggest move this week</span>
                    <a href={detail.biggest_move.link} target="_blank" rel="noopener noreferrer" className="biggest-move-title">{detail.biggest_move.title}</a>
                    <p className="biggest-move-reason">{detail.biggest_move.reason}</p>
                  </div>
                )}
                <div className="archive-stories">
                  {(detail.stories || []).map((story, i) => (
                    <div className="archive-story" key={i}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--muted2)' }}>#{String(i+1).padStart(2,'00')}</span>
                        <span className={'stag ' + (TAG_CLASS[story.tag] || 't-research')}>{story.tag}</span>
                      </div>
                      <a href={story.link} target="_blank" rel="noopener noreferrer" className="live-title">{story.title}</a>
                      <p className="live-summary">{story.summary}</p>
                      <p className="live-tldr">{story.tldr}</p>
                      {(story.why_student || story.why_it_matters) && (
                        <div className="why-matters">
                          <span className="why-matters-label">Why it matters </span>
                          <span className="why-matters-text">{story.why_student || story.why_it_matters}</span>
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

// Main App
export default function App() {
  const [showArchive, setShowArchive] = useState(false)

  useEffect(() => {
    const revealEls = document.querySelectorAll('.reveal, .reveal-child')
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target) }
      })
    }, { threshold: 0.08 })
    revealEls.forEach(el => io.observe(el))

    const handleScroll = () => {
      const nav = document.querySelector('nav')
      if (nav) nav.classList.toggle('scrolled', window.scrollY > 60)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => { io.disconnect(); window.removeEventListener('scroll', handleScroll) }
  }, [])

  return (
    <>
      {showArchive && <ArchivePage onClose={() => setShowArchive(false)} />}

      <nav>
        <a className="logo" href="#">
          <img src={logo} alt="NB" />
          <span className="logo-text">Neural <span>Brief</span></span>
        </a>
        <div className="nav-right">
          <span className="nav-chip">Every Friday · Free</span>
          <button className="nav-archive-btn" onClick={() => setShowArchive(true)}>Past Briefs</button>
          <a className="nav-cta" href="#subscribe">Get the next brief</a>
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
          <span>AI news, filtered for humans</span>
          <span>✦ ✦ ✦</span>
          <span>15 stories · ~8 min read · free forever</span>
        </div>
      </div>

      <div className="wrap">
        <div className="hero-grid">
          <div className="hero-main fi">
            <div className="kicker">
              <span className="kicker-bar"></span>Weekly AI News Digest<span className="kicker-bar"></span>
            </div>
            <h1>AI news,<br />filtered for <em style={{ fontStyle: 'italic', color: 'var(--accent)' }}>humans.</em></h1>
            <p className="hero-deck">
              Stop wasting time scrolling. Get the <strong>15 AI stories that actually matter</strong>,
              delivered every Friday in under <strong>3 minutes</strong>.
            </p>
            <p className="why-line">
              No hype. No jargon. No noise. Just signal — with plain English summaries,
              source labels, why it matters, and a "Break it down" button for every story.
            </p>
            <div className="cta-group">
              <a className="btn-primary btn-large" href="#subscribe">Get the next brief</a>
              <a className="btn-secondary" href="#this-week">Read this week's issue</a>
            </div>
            <SubscribeForm id="subscribe" ctaText="Get the next brief" />
            <div className="trust-strip">
              {[['⏱', '~8 min read'], ['🚫', 'No jargon'], ['📡', 'Only signal'], ['₹0', 'Free forever'], ['🔕', 'No spam']].map(([icon, text]) => (
                <span className="trust-item" key={text}>
                  <span className="trust-icon">{icon}</span>
                  <span>{text}</span>
                </span>
              ))}
            </div>
          </div>

          <div className="hero-sidebar fi">
            <div className="sb-section">
              <span className="sb-label">By the numbers</span>
              {[['Stories per issue','15'],['Read time','~8 min'],['Delivery','Every Friday'],['Language','Plain English'],['Cost','Free']].map(([k,v]) => (
                <div className="stat-row" key={k}><span className="stat-key">{k}</span><span className="stat-val">{v}</span></div>
              ))}
            </div>
            <div className="sb-section">
              <span className="sb-label">Sources we track</span>
              {['Google DeepMind','Anthropic Blog','Google AI Blog','MIT Tech Review','TechCrunch AI','VentureBeat AI','Wired AI','& many more'].map(s => (
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

      <div className="wrap">
        <div className="section fi reveal">
          <div className="section-hd"><span className="section-sym">§</span><h2>What makes Neural Brief different</h2></div>
          <div className="diff-grid">
            {[
              { icon: '📡', title: 'Only signal, no noise', desc: 'We track 7 top AI sources, read everything, and send you only what actually matters.' },
              { icon: '💬', title: 'Plain English, always', desc: "No jargon. No hype. Every story explained like you're talking to a friend." },
              { icon: '🌏', title: '"Why it matters" for India', desc: 'Every story has a dedicated callout — why should an Indian student or developer care?' },
              { icon: '🔖', title: 'Source credibility labels', desc: 'Official, Media, Research, or Community — know how much to trust each story.' },
              { icon: '📖', title: 'Jargon of the week', desc: 'One AI term explained simply every Friday. RAG, fine-tuning, embeddings — demystified.' },
              { icon: '🔗', title: 'Ready-to-share posts', desc: 'Every story has a tweet and LinkedIn post written by AI — share your knowledge in one click.' },
            ].map((d, i) => (
              <div className="diff-card reveal-child" key={d.title}>
                <span className="diff-icon">{d.icon}</span>
                <p className="diff-title">{d.title}</p>
                <p className="diff-desc">{d.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* TODAY'S TOP 3 */}
      <div className="wrap">
        <div className="section fi reveal">
          <div className="section-hd">
            <span className="section-sym">§</span>
            <div>
              <h2>Today's Top 5</h2>
              <p style={{ fontSize: '11px', fontFamily: 'var(--mono)', color: 'var(--muted2)', marginTop: '4px' }}>
                Live · Updated daily
              </p>
            </div>
          </div>
          <LiveFeed />
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
                Live · Updated weekly · AI-powered
              </p>
            </div>
          </div>
          <LiveDigest />
        </div>
      </div>

      <div className="wrap">
        <div className="preview-section fi reveal">
          <div className="section-hd"><span className="section-sym">§</span><h2>What lands in your inbox</h2></div>
          <div className="email-mock">
            <div className="email-bar">
              <div className="wdots"><div className="wd wd-r"></div><div className="wd wd-y"></div><div className="wd wd-g"></div></div>
              <span className="email-url">From: neuralbrief18@gmail.com · Neural Brief #42 — This week in AI</span>
            </div>
            <div className="email-body">
              <div className="em-head">
                <div className="em-brand">Neural <span>Brief</span></div>
                <span className="em-tag">THIS WEEK IN AI · BRIEF #42 · FRIDAY DIGEST</span>
              </div>
              <div className="em-meta">
                <span>Friday, 21 March 2026</span>
                <span>15 stories · ~8 min read</span>
                <span>neural-brief-eight.vercel.app</span>
              </div>
              {[
                { tag:'t-model',    label:'New Model', title:'Google drops Gemini 2.5 with 2M token context',      body:'Biggest context window yet — processes entire codebases. Strong reasoning gains.', tldr:'TL;DR: Longer memory, smarter answers.' },
                { tag:'t-research', label:'Research',  title:'MIT: LLMs plan complex tasks without fine-tuning',   body:'Base models execute 10+ step tasks through structured prompting alone.', tldr:'TL;DR: Prompting beats fine-tuning.' },
                { tag:'t-industry', label:'Industry',  title:'OpenAI in talks to acquire Windsurf for $3B',        body:'OpenAI acquiring Windsurf for a direct IDE-level product.', tldr:'TL;DR: Code editors are the new AI battlefield.' },
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

      <div className="wrap">
        <div className="section fi">
          <div className="section-hd"><span className="section-sym">§</span><h2>How Neural Brief works</h2></div>
          <div className="steps">
            {[
              { n:'01', i:'📡', t:'We track top AI sources',  d:'Every Friday we pull fresh stories from 7+ top AI sources — TechCrunch, HackerNews, DeepMind, arXiv, MIT Tech Review, and more.' },
              { n:'02', i:'🔍', t:'Filter out the noise',      d:"Groq's Llama 3.3 70B reads everything and picks only the 15 stories worth your attention. No fluff, no duplication." },
              { n:'03', i:'✍️', t:'Summarise what matters',   d:'Each story gets a plain English summary, a TL;DR, a why-it-matters callout, and a ready-to-share social post.' },
              { n:'04', i:'📬', t:'Delivered to your inbox',  d:'Every Friday at 9am IST a clean, beautifully formatted digest lands in your inbox. Read it over chai in ~8 minutes.' },
            ].map((s, i) => (
              <div className="step reveal-child" key={s.n}>
                <span className="step-num">{s.n} —</span>
                <span className="step-ico">{s.i}</span>
                <p className="step-title">{s.t}</p>
                <p className="step-desc">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="wrap">
        <div className="why-section fi reveal">
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

      <div className="wrap">
        <div className="final-cta-section fi reveal">
          <div className="final-cta-inner">
            <p className="final-cta-eyebrow">Join Neural Brief</p>
            <h2 style={{ marginBottom: '12px' }}>Stop missing the AI<br />stories that matter.</h2>
            <p className="cta-sub">
              Join Neural Brief and stay ahead — without the noise.<br />
              <strong>Free. Takes 3 minutes. No spam.</strong>
            </p>
            <div className="cta-feature-pills">
              {['Signal Score per story', 'Break it down', 'LinkedIn post generator', 'Jargon of the week', 'Why it matters for you', 'Source labels'].map(f => (
                <span className="cta-pill" key={f}>{f}</span>
              ))}
            </div>
            <div style={{ maxWidth: '440px', margin: '32px auto 0' }}>
              <SubscribeForm id="subscribe-bottom" ctaText="Get the next brief" />
              <div className="trust-strip" style={{ justifyContent: 'center', marginTop: '20px' }}>
                {[['⏱', '~8 min read'], ['🚫', 'No jargon'], ['₹0', 'Free forever'], ['🔕', 'No spam']].map(([icon, text]) => (
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

      <footer>
        <strong>Neural Brief</strong> · Weekly AI news for students · Est. 2025<br />
        AI-powered summaries · Sent via Brevo · Subscribers on Supabase<br />
        Sources: DeepMind · Anthropic · Google AI · MIT Tech Review · TechCrunch · VentureBeat & more<br />
        Built by <strong>PRAJWAL.A</strong> — an AIML student who got tired of AI noise<br /><br />
        <a href="#">Unsubscribe</a> &nbsp;·&nbsp;
        <a href="https://neural-brief-eight.vercel.app">Website</a> &nbsp;·&nbsp;
        <a href="https://github.com/Prajwal18py/Neural-Brief">GitHub</a> &nbsp;·&nbsp;
        <a href="mailto:neuralbrief18@gmail.com">Contact</a><br /><br />
        <span style={{ opacity: 0.4 }}>© 2025 Neural Brief · Made with coffee somewhere in India</span>
      </footer>
    </>
  )
}