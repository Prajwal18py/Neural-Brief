// ProjectIdeaGenerator.jsx
// Drop into src/ alongside App.jsx
// Usage: import ProjectIdeaGenerator from './ProjectIdeaGenerator'
// Place after stories in LiveDigest

import { useState } from 'react'

const DIFFICULTY_COLORS = {
  'Beginner':     { bg: '#edf5eb', color: '#357025', border: '#bdd9b7' },
  'Intermediate': { bg: '#fdf5e8', color: '#7a5018', border: '#e8d3a0' },
  'Advanced':     { bg: '#fef0ec', color: '#c13d18', border: '#f5cec4' },
}

function parseIdea(raw) {
  try {
    const cleaned = raw.replace(/```json|```/g, '').trim()
    return JSON.parse(cleaned)
  } catch {
    return null
  }
}

export default function ProjectIdeaGenerator({ stories = [] }) {
  const [selected, setSelected]   = useState([])
  const [loading, setLoading]     = useState(false)
  const [idea, setIdea]           = useState(null)
  const [loadingMsg, setLoadingMsg] = useState('')
  const [mode, setMode]           = useState('normal') // normal | simple | beginner

  const LOADING_MSGS = [
    'Neural AI is building your idea…',
    'Connecting the dots between stories…',
    'Thinking like an engineer…',
    'Almost there — crafting your project…',
  ]

  const toggle = (i) => {
    setSelected(prev =>
      prev.includes(i) ? prev.filter(x => x !== i) : prev.length < 3 ? [...prev, i] : prev
    )
    setIdea(null)
  }

  const generate = async (overrideMode) => {
    const m = overrideMode || mode
    if (selected.length === 0) return
    setLoading(true)
    setIdea(null)

    let msgIdx = 0
    setLoadingMsg(LOADING_MSGS[0])
    const msgInterval = setInterval(() => {
      msgIdx = (msgIdx + 1) % LOADING_MSGS.length
      setLoadingMsg(LOADING_MSGS[msgIdx])
    }, 1800)

    const pickedStories = selected.map(i => stories[i]).filter(Boolean)
    const storiesText = pickedStories.map((s, i) =>
      `Story ${i + 1}: ${s.title}\nSummary: ${s.summary || ''}`
    ).join('\n\n')

    const modeInstruction =
      m === 'simple'   ? 'Make it very simple — 1-2 core features only. Short sentences.' :
      m === 'beginner' ? 'Make it beginner-friendly. Assume the user just started coding. Use only basic tools like Python, HTML, or no-code.' :
      selected.length === 1
        ? 'Simple focused idea based on this one story.'
        : 'Combine ALL the stories into one creative project idea.'

    const prompt = `You are a creative AI project idea generator for Neural Brief — a weekly AI digest for Indian college students.

Based on these AI news stories:
${storiesText}

${modeInstruction}

Return ONLY valid JSON, no markdown, no extra text:
{
  "name": "Project name (5-8 words, catchy)",
  "tagline": "One punchy sentence — what it does",
  "what_it_does": "2-3 plain English sentences. What the user builds and why it's useful.",
  "how_it_uses_ai": ["bullet 1 (max 10 words)", "bullet 2 (max 10 words)", "bullet 3 optional"],
  "why_useful": ["bullet 1 (max 10 words)", "bullet 2 (max 10 words)"],
  "stack": ["e.g. Python", "OpenAI API", "Streamlit"],
  "difficulty": "Beginner OR Intermediate OR Advanced",
  "time_to_build": "e.g. 1 weekend OR 2-3 days"
}`

    try {
      const resp = await fetch('/api/neural-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemPrompt: 'You are a project idea generator. Return only valid JSON. No markdown. No explanation.',
          messages: [{ role: 'user', content: prompt }],
        }),
      })
      const data = await resp.json()
      const parsed = parseIdea(data.text || '')
      setIdea(parsed || { error: true })
    } catch {
      setIdea({ error: true })
    }

    clearInterval(msgInterval)
    setLoading(false)
  }

  const handleGenerate = () => { setMode('normal'); generate('normal') }
  const handleSimplify = () => { setMode('simple'); generate('simple') }
  const handleBeginner = () => { setMode('beginner'); generate('beginner') }
  const handleAnother  = () => { generate(mode) }

  const diffColors = idea?.difficulty ? (DIFFICULTY_COLORS[idea.difficulty] || DIFFICULTY_COLORS['Intermediate']) : null

  return (
    <div className="pig-wrap">
      {/* Header */}
      <div className="pig-header">
        <div className="pig-header-left">
          <span className="pig-icon">💡</span>
          <div>
            <p className="pig-title">Turn news into a project</p>
            <p className="pig-sub">Select 1–3 stories · Neural AI generates a real buildable idea</p>
          </div>
        </div>
        {selected.length > 0 && (
          <span className="pig-count">{selected.length} selected</span>
        )}
      </div>

      {/* Story checkboxes */}
      <div className="pig-stories">
        {stories.map((story, i) => {
          const isSelected = selected.includes(i)
          const isDisabled = !isSelected && selected.length >= 3
          return (
            <button
              key={i}
              className={'pig-story' + (isSelected ? ' selected' : '') + (isDisabled ? ' disabled' : '')}
              onClick={() => !isDisabled && toggle(i)}
              disabled={isDisabled}
            >
              <span className={'pig-check' + (isSelected ? ' checked' : '')}>
                {isSelected ? '✓' : ''}
              </span>
              <span className="pig-story-text">{story.title}</span>
            </button>
          )
        })}
      </div>

      {selected.length === 0 && (
        <p className="pig-hint">☝ Pick at least one story to get started</p>
      )}

      {/* Generate button */}
      {selected.length > 0 && !loading && !idea && (
        <button className="pig-generate-btn" onClick={handleGenerate}>
          <span className="pig-generate-icon">⚡</span>
          Generate Project Idea
        </button>
      )}

      {/* Loading */}
      {loading && (
        <div className="pig-loading">
          <div className="pig-loading-dots">
            <span /><span /><span />
          </div>
          <p className="pig-loading-msg">{loadingMsg}</p>
        </div>
      )}

      {/* Output */}
      {!loading && idea && !idea.error && (
        <div className="pig-output">
          {/* Glow border */}
          <div className="pig-output-glow" />

          {/* Top row */}
          <div className="pig-output-top">
            <span className="pig-output-eyebrow">💡 Your project idea</span>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
              {diffColors && (
                <span className="pig-diff-badge" style={{ background: diffColors.bg, color: diffColors.color, border: `1px solid ${diffColors.border}` }}>
                  {idea.difficulty}
                </span>
              )}
              {idea.time_to_build && (
                <span className="pig-time-badge">⏱ {idea.time_to_build}</span>
              )}
            </div>
          </div>

          {/* Project name */}
          <p className="pig-output-name">{idea.name}</p>
          {idea.tagline && <p className="pig-output-tagline">{idea.tagline}</p>}

          <div className="pig-output-rule" />

          {/* What it does */}
          <div className="pig-output-section">
            <span className="pig-output-section-label">⚙️ What it does</span>
            <p className="pig-output-section-text">{idea.what_it_does}</p>
          </div>

          {/* How it uses AI */}
          {idea.how_it_uses_ai?.length > 0 && (
            <div className="pig-output-section">
              <span className="pig-output-section-label">🧠 How it uses AI</span>
              <ul className="pig-output-list">
                {idea.how_it_uses_ai.map((b, i) => <li key={i}>{b}</li>)}
              </ul>
            </div>
          )}

          {/* Why useful */}
          {idea.why_useful?.length > 0 && (
            <div className="pig-output-section">
              <span className="pig-output-section-label">🚀 Why it's useful</span>
              <ul className="pig-output-list">
                {idea.why_useful.map((b, i) => <li key={i}>{b}</li>)}
              </ul>
            </div>
          )}

          {/* Stack */}
          {idea.stack?.length > 0 && (
            <div className="pig-output-section">
              <span className="pig-output-section-label">🛠 Stack</span>
              <div className="pig-stack-pills">
                {idea.stack.map((s, i) => <span key={i} className="pig-stack-pill">{s}</span>)}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="pig-output-actions">
            <button className="pig-action-btn pig-action-primary" onClick={handleAnother}>
              🔄 Generate another idea
            </button>
            <button className="pig-action-btn" onClick={handleSimplify}>
              ✂️ Simplify this idea
            </button>
            <button className="pig-action-btn" onClick={handleBeginner}>
              🎓 Make it beginner-friendly
            </button>
          </div>
        </div>
      )}

      {!loading && idea?.error && (
        <div className="pig-error">
          Something went wrong. <button onClick={handleGenerate}>Try again →</button>
        </div>
      )}

      <style>{`
        .pig-wrap {
          margin: 32px 0 0;
          border: 1px solid var(--rule);
          border-radius: 6px;
          overflow: hidden;
        }
        .pig-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          background: #18160f;
          border-bottom: 1px solid rgba(255,255,255,0.07);
          gap: 12px;
          flex-wrap: wrap;
        }
        .pig-header-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .pig-icon {
          font-size: 22px;
          flex-shrink: 0;
        }
        .pig-title {
          font-family: var(--serif);
          font-size: 16px;
          font-weight: 700;
          color: #f5f0e8;
          margin: 0 0 2px;
        }
        .pig-sub {
          font-family: var(--mono);
          font-size: 10px;
          color: rgba(255,255,255,0.35);
          margin: 0;
          letter-spacing: 0.04em;
        }
        .pig-count {
          font-family: var(--mono);
          font-size: 10px;
          color: #c13d18;
          background: rgba(193,61,24,0.12);
          border: 1px solid rgba(193,61,24,0.25);
          padding: 4px 10px;
          border-radius: 20px;
          white-space: nowrap;
        }
        .pig-stories {
          padding: 14px 16px;
          display: flex;
          flex-direction: column;
          gap: 6px;
          background: var(--paper);
        }
        .pig-story {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 10px 12px;
          border: 1px solid var(--rule);
          border-radius: 4px;
          background: var(--paper);
          cursor: pointer;
          text-align: left;
          transition: border-color 0.15s, background 0.15s;
          width: 100%;
        }
        .pig-story:hover:not(.disabled) {
          border-color: #c13d18;
          background: #fef8f6;
        }
        .pig-story.selected {
          border-color: #c13d18;
          background: #fef0ec;
        }
        .pig-story.disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        .pig-check {
          width: 16px;
          height: 16px;
          border: 1.5px solid #ccc;
          border-radius: 3px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          font-weight: 700;
          color: #fff;
          flex-shrink: 0;
          margin-top: 1px;
          transition: all 0.15s;
        }
        .pig-check.checked {
          background: #c13d18;
          border-color: #c13d18;
        }
        .pig-story-text {
          font-family: var(--serif);
          font-size: 13px;
          color: var(--ink);
          line-height: 1.4;
        }
        .pig-hint {
          font-family: var(--mono);
          font-size: 10px;
          color: var(--muted2);
          text-align: center;
          padding: 8px 0 16px;
          margin: 0;
        }
        .pig-generate-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: calc(100% - 32px);
          margin: 0 16px 16px;
          padding: 13px;
          background: #c13d18;
          color: #fff;
          border: none;
          border-radius: 4px;
          font-family: var(--mono);
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 0.04em;
          cursor: pointer;
          transition: background 0.15s, transform 0.1s;
        }
        .pig-generate-btn:hover {
          background: #a8311200;
          background: #a83112;
          transform: translateY(-1px);
        }
        .pig-generate-icon {
          font-size: 15px;
        }
        .pig-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          padding: 32px 20px;
          background: var(--paper);
        }
        .pig-loading-dots {
          display: flex;
          gap: 6px;
        }
        .pig-loading-dots span {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #c13d18;
          animation: pigDot 1.2s infinite ease-in-out;
        }
        .pig-loading-dots span:nth-child(2) { animation-delay: 0.2s; }
        .pig-loading-dots span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes pigDot {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
        .pig-loading-msg {
          font-family: var(--mono);
          font-size: 11px;
          color: var(--muted2);
          margin: 0;
          letter-spacing: 0.04em;
          text-align: center;
        }
        .pig-output {
          margin: 0 16px 16px;
          border: 1px solid rgba(193,61,24,0.25);
          border-radius: 6px;
          padding: 20px;
          background: #fdf9f7;
          position: relative;
          overflow: hidden;
        }
        .pig-output-glow {
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 3px;
          background: linear-gradient(90deg, #c13d18, #e86840, #c13d18);
          background-size: 200% 100%;
          animation: pigGlow 2s linear infinite;
        }
        @keyframes pigGlow {
          0% { background-position: 0% 0%; }
          100% { background-position: 200% 0%; }
        }
        .pig-output-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 10px;
          flex-wrap: wrap;
        }
        .pig-output-eyebrow {
          font-family: var(--mono);
          font-size: 10px;
          color: #c13d18;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          font-weight: 600;
        }
        .pig-diff-badge {
          font-family: var(--mono);
          font-size: 9px;
          font-weight: 600;
          padding: 3px 8px;
          border-radius: 2px;
          letter-spacing: 0.06em;
        }
        .pig-time-badge {
          font-family: var(--mono);
          font-size: 9px;
          color: var(--muted2);
          background: var(--paper);
          border: 1px solid var(--rule);
          padding: 3px 8px;
          border-radius: 2px;
        }
        .pig-output-name {
          font-family: var(--serif);
          font-size: 22px;
          font-weight: 700;
          color: var(--ink);
          margin: 0 0 6px;
          line-height: 1.25;
        }
        .pig-output-tagline {
          font-family: var(--serif);
          font-size: 13px;
          color: #c13d18;
          margin: 0;
          font-style: italic;
        }
        .pig-output-rule {
          height: 1px;
          background: var(--rule);
          margin: 14px 0;
        }
        .pig-output-section {
          margin-bottom: 14px;
        }
        .pig-output-section-label {
          font-family: var(--mono);
          font-size: 10px;
          font-weight: 600;
          color: var(--muted2);
          letter-spacing: 0.08em;
          text-transform: uppercase;
          display: block;
          margin-bottom: 6px;
        }
        .pig-output-section-text {
          font-family: var(--serif);
          font-size: 13px;
          color: var(--ink);
          line-height: 1.65;
          margin: 0;
        }
        .pig-output-list {
          margin: 0;
          padding-left: 0;
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 5px;
        }
        .pig-output-list li {
          font-family: var(--serif);
          font-size: 13px;
          color: var(--ink);
          line-height: 1.5;
          padding-left: 14px;
          position: relative;
        }
        .pig-output-list li::before {
          content: '→';
          position: absolute;
          left: 0;
          color: #c13d18;
          font-size: 11px;
          top: 1px;
        }
        .pig-stack-pills {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }
        .pig-stack-pill {
          font-family: var(--mono);
          font-size: 10px;
          color: #27438a;
          background: #ebf0f9;
          border: 1px solid #bcc9ec;
          padding: 3px 10px;
          border-radius: 2px;
        }
        .pig-output-actions {
          display: flex;
          gap: 8px;
          margin-top: 16px;
          flex-wrap: wrap;
          border-top: 1px solid var(--rule);
          padding-top: 14px;
        }
        .pig-action-btn {
          font-family: var(--mono);
          font-size: 11px;
          padding: 7px 12px;
          border-radius: 3px;
          border: 1px solid var(--rule);
          background: var(--paper);
          color: var(--ink);
          cursor: pointer;
          transition: border-color 0.15s, background 0.15s;
        }
        .pig-action-btn:hover {
          border-color: #c13d18;
          background: #fef0ec;
          color: #c13d18;
        }
        .pig-action-primary {
          background: #18160f;
          color: #f5f0e8;
          border-color: #18160f;
        }
        .pig-action-primary:hover {
          background: #2a2720;
          border-color: #2a2720;
          color: #f5f0e8;
        }
        .pig-error {
          padding: 16px 20px;
          font-family: var(--mono);
          font-size: 11px;
          color: var(--muted2);
          background: var(--paper);
        }
        .pig-error button {
          background: none;
          border: none;
          color: #c13d18;
          cursor: pointer;
          font-family: var(--mono);
          font-size: 11px;
          text-decoration: underline;
          text-underline-offset: 3px;
          padding: 0;
        }
      `}</style>
    </div>
  )
}