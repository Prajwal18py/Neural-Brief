// ShareCard.jsx
// Drop this file into src/
// Usage: import ShareCard from './ShareCard'
// Then use <ShareCard story={story} /> inside the accordion body

import { useState, useRef, useEffect } from 'react'

// Neural Brief logo as inline SVG text mark (no external dependency)
function NBMark() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="28" height="28" fill="#c13d18"/>
      <text x="5" y="20" fontFamily="Georgia, serif" fontSize="16" fontWeight="700" fill="#fff">N</text>
    </svg>
  )
}

// The actual card rendered to canvas
function CardCanvas({ story, canvasRef }) {
  const TAG_COLORS = {
    'New Model':  { bg: '#fef0ec', color: '#c13d18' },
    'Research':   { bg: '#edf5eb', color: '#357025' },
    'Industry':   { bg: '#ebf0f9', color: '#27438a' },
    'Tool Drop':  { bg: '#fdf5e8', color: '#7a5018' },
    'Policy':     { bg: '#f3f0fb', color: '#4f2fa8' },
    'Opinion':    { bg: '#f3f0fb', color: '#4f2fa8' },
  }
  const tag = TAG_COLORS[story.tag] || { bg: '#f4f4f4', color: '#888' }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const W = 1080, H = 566
    canvas.width = W
    canvas.height = H

    // ── Background ───────────────────────────────────────────
    ctx.fillStyle = '#0e0c07'
    ctx.fillRect(0, 0, W, H)

    // Subtle grain texture
    for (let i = 0; i < 8000; i++) {
      const x = Math.random() * W
      const y = Math.random() * H
      const a = Math.random() * 0.04
      ctx.fillStyle = `rgba(255,255,255,${a})`
      ctx.fillRect(x, y, 1, 1)
    }

    // Left accent bar
    ctx.fillStyle = '#c13d18'
    ctx.fillRect(0, 0, 4, H)

    // Top rule
    ctx.fillStyle = 'rgba(255,255,255,0.06)'
    ctx.fillRect(0, 0, W, 1)

    // Bottom rule
    ctx.fillStyle = 'rgba(255,255,255,0.06)'
    ctx.fillRect(0, H - 1, W, 1)

    // ── NB Logo box ──────────────────────────────────────────
    ctx.fillStyle = '#c13d18'
    ctx.fillRect(52, 46, 36, 36)
    ctx.fillStyle = '#fff'
    ctx.font = 'bold 22px Georgia, serif'
    ctx.fillText('N', 61, 71)

    // Brand name
    ctx.fillStyle = '#fff'
    ctx.font = 'bold 15px Georgia, serif'
    ctx.fillText('Neural', 98, 61)
    ctx.fillStyle = '#c13d18'
    ctx.font = 'bold 15px Georgia, serif'
    ctx.fillText('Brief', 98, 78)

    // ── Tag pill ─────────────────────────────────────────────
    const tagText = story.tag || 'AI News'
    ctx.font = '500 11px monospace'
    const tagW = ctx.measureText(tagText).width + 20
    const tagX = 52, tagY = 112

    ctx.fillStyle = tag.bg
    roundRect(ctx, tagX, tagY, tagW, 22, 2)
    ctx.fill()
    ctx.fillStyle = tag.color
    ctx.font = '600 11px monospace'
    ctx.fillText(tagText.toUpperCase(), tagX + 10, tagY + 15)

    // Signal badge
    if (story.signal_label && story.signal_score) {
      const sigText = `${story.signal_score}/10 ${story.signal_label}`
      ctx.font = '500 10px monospace'
      const sigW = ctx.measureText(sigText).width + 16
      const sigX = tagX + tagW + 10

      ctx.strokeStyle = 'rgba(193,61,24,0.4)'
      ctx.lineWidth = 1
      roundRect(ctx, sigX, tagY, sigW, 22, 2)
      ctx.stroke()
      ctx.fillStyle = '#c13d18'
      ctx.fillText(sigText, sigX + 8, tagY + 15)
    }

    // ── Title ────────────────────────────────────────────────
    ctx.fillStyle = '#f5f0e8'
    ctx.font = 'bold 36px Georgia, serif'
    const title = story.title || ''
    wrapText(ctx, title, 52, 178, W - 104, 46)

    // ── TL;DR ────────────────────────────────────────────────
    const tldr = (story.tldr || '').replace(/^->\s*TL;DR:\s*/i, '').replace(/^TL;DR:\s*/i, '')
    if (tldr) {
      ctx.fillStyle = '#c13d18'
      ctx.font = '600 13px monospace'
      ctx.fillText('TL;DR', 52, 350)

      ctx.fillStyle = 'rgba(245,240,232,0.7)'
      ctx.font = '400 15px Georgia, serif'
      wrapText(ctx, tldr, 52, 374, W - 104, 22)
    }

    // ── Bottom bar ───────────────────────────────────────────
    ctx.fillStyle = 'rgba(255,255,255,0.04)'
    ctx.fillRect(0, H - 64, W, 64)

    // URL
    ctx.fillStyle = 'rgba(255,255,255,0.35)'
    ctx.font = '400 12px monospace'
    ctx.fillText('neuralbriefai.vercel.app', 52, H - 24)

    // Source
    if (story.source) {
      ctx.fillStyle = 'rgba(255,255,255,0.25)'
      ctx.font = '400 11px monospace'
      const srcText = `via ${story.source}`
      const srcW = ctx.measureText(srcText).width
      ctx.fillText(srcText, W - 52 - srcW, H - 24)
    }

    // Decorative corner mark
    ctx.fillStyle = 'rgba(193,61,24,0.15)'
    ctx.font = '400 80px Georgia, serif'
    ctx.fillText('✦', W - 110, 110)

  }, [story])

  return (
    <canvas
      ref={canvasRef}
      style={{ display: 'none' }}
    />
  )
}

// Canvas helpers
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

function wrapText(ctx, text, x, y, maxW, lineH) {
  const words = text.split(' ')
  let line = ''
  let cy = y
  for (let i = 0; i < words.length; i++) {
    const test = line + words[i] + ' '
    if (ctx.measureText(test).width > maxW && i > 0) {
      ctx.fillText(line.trim(), x, cy)
      line = words[i] + ' '
      cy += lineH
      if (cy > y + lineH * 4) { ctx.fillText('…', x, cy); break }
    } else {
      line = test
    }
  }
  if (line.trim()) ctx.fillText(line.trim(), x, cy)
}

// Preview card (visible in UI)
function CardPreview({ story }) {
  const TAG_COLORS = {
    'New Model':  { bg: '#fef0ec', color: '#c13d18' },
    'Research':   { bg: '#edf5eb', color: '#357025' },
    'Industry':   { bg: '#ebf0f9', color: '#27438a' },
    'Tool Drop':  { bg: '#fdf5e8', color: '#7a5018' },
    'Policy':     { bg: '#f3f0fb', color: '#4f2fa8' },
    'Opinion':    { bg: '#f3f0fb', color: '#4f2fa8' },
  }
  const tag = TAG_COLORS[story.tag] || { bg: '#f4f4f4', color: '#888' }
  const tldr = (story.tldr || '').replace(/^->\s*TL;DR:\s*/i, '').replace(/^TL;DR:\s*/i, '')

  return (
    <div style={{
      background: '#0e0c07',
      borderRadius: '6px',
      padding: '24px 28px',
      position: 'relative',
      overflow: 'hidden',
      border: '1px solid rgba(255,255,255,0.07)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      fontFamily: 'Georgia, serif',
    }}>
      {/* Left accent */}
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '3px', background: '#c13d18' }} />

      {/* Decorative mark */}
      <div style={{ position: 'absolute', right: '20px', top: '10px', fontSize: '60px', color: 'rgba(193,61,24,0.1)', lineHeight: 1 }}>✦</div>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
        <div style={{ background: '#c13d18', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '2px', flexShrink: 0 }}>
          <span style={{ color: '#fff', fontWeight: 700, fontSize: '16px', fontFamily: 'Georgia, serif' }}>N</span>
        </div>
        <div style={{ lineHeight: 1.2 }}>
          <span style={{ color: '#fff', fontWeight: 700, fontSize: '13px' }}>Neural</span>
          <span style={{ color: '#c13d18', fontWeight: 700, fontSize: '13px' }}> Brief</span>
        </div>
      </div>

      {/* Tag */}
      <div style={{ marginBottom: '12px', display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ background: tag.bg, color: tag.color, fontFamily: 'monospace', fontSize: '9px', fontWeight: 600, padding: '3px 8px', borderRadius: '2px', letterSpacing: '0.08em' }}>
          {(story.tag || 'AI NEWS').toUpperCase()}
        </span>
        {story.signal_label && story.signal_score && (
          <span style={{ border: '1px solid rgba(193,61,24,0.4)', color: '#c13d18', fontFamily: 'monospace', fontSize: '9px', padding: '3px 8px', borderRadius: '2px' }}>
            {story.signal_score}/10 {story.signal_label}
          </span>
        )}
      </div>

      {/* Title */}
      <p style={{ color: '#f5f0e8', fontSize: '18px', fontWeight: 700, lineHeight: 1.35, margin: '0 0 14px', fontFamily: 'Georgia, serif' }}>
        {story.title}
      </p>

      {/* TL;DR */}
      {tldr && (
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: '12px' }}>
          <span style={{ fontFamily: 'monospace', fontSize: '9px', color: '#c13d18', fontWeight: 600, letterSpacing: '0.1em', display: 'block', marginBottom: '5px' }}>TL;DR</span>
          <p style={{ color: 'rgba(245,240,232,0.65)', fontSize: '12px', lineHeight: 1.6, margin: 0, fontFamily: 'Georgia, serif' }}>{tldr}</p>
        </div>
      )}

      {/* Footer */}
      <div style={{ marginTop: '18px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontFamily: 'monospace', fontSize: '9px', color: 'rgba(255,255,255,0.3)' }}>neuralbriefai.vercel.app</span>
        {story.source && <span style={{ fontFamily: 'monospace', fontSize: '9px', color: 'rgba(255,255,255,0.2)' }}>via {story.source}</span>}
      </div>
    </div>
  )
}

export default function ShareCard({ story }) {
  const [open, setOpen]       = useState(false)
  const [copied, setCopied]   = useState(false)
  const [downloaded, setDownloaded] = useState(false)
  const canvasRef             = useRef(null)

  const downloadCard = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const link = document.createElement('a')
    link.download = `neural-brief-${story.title.slice(0, 30).replace(/\s+/g, '-').toLowerCase()}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
    setDownloaded(true)
    setTimeout(() => setDownloaded(false), 2000)
  }

  const copyImage = async () => {
    const canvas = canvasRef.current
    if (!canvas) return
    try {
      canvas.toBlob(async (blob) => {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ])
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      })
    } catch {
      // Fallback — just download
      downloadCard()
    }
  }

  return (
    <>
      {/* Hidden canvas for actual image generation */}
      <CardCanvas story={story} canvasRef={canvasRef} />

      {/* Trigger button */}
      <button
        className="share-btn"
        style={{ background: '#0e0c07', color: '#f5f0e8', border: '1px solid rgba(255,255,255,0.15)' }}
        onClick={() => setOpen(o => !o)}
      >
        {open ? '✕ Close card' : '🖼 Share card'}
      </button>

      {/* Card modal */}
      {open && (
        <div style={{
          marginTop: '12px',
          background: 'rgba(0,0,0,0.03)',
          border: '1px solid rgba(0,0,0,0.08)',
          borderRadius: '6px',
          padding: '16px',
        }}>
          {/* Preview */}
          <CardPreview story={story} />

          {/* Actions */}
          <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
            <button
              className="share-btn"
              style={{ background: '#c13d18', color: '#fff', border: 'none', fontWeight: 600 }}
              onClick={downloadCard}
            >
              {downloaded ? '✓ Saved!' : '⬇ Download PNG'}
            </button>
            <button
              className="share-btn"
              style={{ background: '#0e0c07', color: '#f5f0e8', border: '1px solid rgba(255,255,255,0.15)' }}
              onClick={copyImage}
            >
              {copied ? '✓ Copied!' : '📋 Copy image'}
            </button>
            <a
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`${story.title}\n\nvia @NeuralBrief 🧠\nneuralbriefai.vercel.app\n\n#AI #NeuralBrief`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="share-btn share-x"
            >
              Post on X →
            </a>
          </div>
          <p style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--muted2)', marginTop: '8px', marginBottom: 0 }}>
            Download the card and attach it to your post for best reach 📈
          </p>
        </div>
      )}
    </>
  )
}