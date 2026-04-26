import { useEffect, useState, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, Sparkles, TrendingUp, Zap, Users, Cpu, Tag, ThumbsUp,
  Globe, ExternalLink, RefreshCw, BookOpen, Hash, BarChart2,
  ChevronLeft, ChevronRight, X, FileDown, Presentation,
} from 'lucide-react'
import { loadInsights, loadSessions } from '../services/api'
import { useSEO } from '../hooks/useSEO'

const CARD_META = {
  'Introduction':          { Icon: Sparkles,   color: '#00D4FF' },
  'Key Features':          { Icon: Zap,        color: '#00D4FF' },
  'Business Model':        { Icon: TrendingUp, color: '#8B5CF6' },
  'Target Audience':       { Icon: Users,      color: '#8B5CF6' },
  'Technology':            { Icon: Cpu,        color: '#10FFA8' },
  'Pricing':               { Icon: Tag,        color: '#10FFA8' },
  'Content Themes':        { Icon: BarChart2,  color: '#8B5CF6' },
  'Top Headlines':         { Icon: Hash,       color: '#00D4FF' },
  'Pros & Cons':           { Icon: ThumbsUp,   color: '#10FFA8' },
  'Overview':              { Icon: Sparkles,   color: '#00D4FF' },
  'Website Security':      { Icon: BookOpen,   color: '#10FFA8' },
}

function hex2rgba(hex, a) {
  try {
    const h = hex.replace('#', '')
    const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16))
    return `rgba(${r},${g},${b},${a})`
  } catch { return `rgba(0,212,255,${a})` }
}

// ─── Slide generation ─────────────────────────────────────────────────────────

function buildSlides(structured, meta) {
  if (!structured?.length) return []

  const get = (title) => {
    const block = structured.find((b) => b.title === title)
    return (block?.items || []).filter((i) => i.toLowerCase().trim() !== 'no source found.')
  }

  const title = meta?.title || 'Website Analysis'
  const url   = meta?.urls?.[0] || ''
  const intro    = get('Introduction')
  const features = get('Key Features')
  const bizModel = get('Business Model')
  const audience = get('Target Audience')
  const themes   = get('Content Themes')
  const pricing  = get('Pricing')
  const tech     = get('Technology')

  const proscons = structured.find((b) => b.title === 'Pros & Cons')?.items || []
  const pros = proscons.filter((i) => i.startsWith('Pro:')).map((i) => i.replace(/^Pro:\s*/i, ''))
  const cons = proscons.filter((i) => i.startsWith('Con:')).map((i) => i.replace(/^Con:\s*/i, ''))

  const NA   = 'Not enough information'
  const orNA = (arr) => (arr.length ? arr : [NA])

  const slides = [
    {
      id: 1, type: 'title',
      title, subtitle: url,
      desc: intro[0] || NA,
      color: '#00D4FF',
    },
    {
      id: 2, type: 'bullets',
      title: 'What This Website Does',
      bullets: orNA(intro.slice(0, 5)),
      color: '#00D4FF',
    },
    {
      id: 3, type: 'bullets',
      title: 'Value Proposition',
      bullets: orNA(intro.length > 1 ? intro.slice(1, 5) : intro),
      color: '#8B5CF6',
    },
    features.length > 0 && {
      id: 4, type: 'features',
      title: 'Key Features',
      bullets: features.slice(0, 6),
      color: '#10FFA8',
    },
    {
      id: 5, type: 'bullets',
      title: 'Target Audience',
      bullets: orNA(audience.slice(0, 5)),
      color: '#8B5CF6',
    },
    {
      id: 6, type: 'bullets',
      title: 'Business Model',
      bullets: orNA(bizModel.slice(0, 4)),
      color: '#00D4FF',
    },
    (themes.length > 0 || pricing.length > 0 || tech.length > 0) && {
      id: 7, type: 'bullets',
      title: 'UX & Content Style',
      bullets: orNA([...themes, ...pricing, ...tech].slice(0, 5)),
      color: '#10FFA8',
    },
    pros.length > 0 && {
      id: 8, type: 'pros',
      title: 'Strengths',
      bullets: pros.slice(0, 4),
      color: '#10FFA8',
    },
    cons.length > 0 && {
      id: 9, type: 'cons',
      title: 'Weaknesses',
      bullets: cons.slice(0, 4),
      color: '#FF4D6D',
    },
    {
      id: 10, type: 'takeaway',
      title: 'Final Takeaway',
      bullets: orNA([
        ...pros.slice(0, 2),
        ...cons.slice(0, 1),
        ...intro.slice(0, 2),
      ].filter(Boolean).slice(0, 5)),
      color: '#8B5CF6',
    },
  ].filter(Boolean)

  return slides
}

// ─── PDF download ─────────────────────────────────────────────────────────────

function downloadSlidesAsPDF(slides, meta) {
  const esc = (s) =>
    String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')

  const accent = (color, opacity) => {
    try {
      const h = color.replace('#', '')
      const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16))
      return `rgba(${r},${g},${b},${opacity})`
    } catch { return `rgba(0,212,255,${opacity})` }
  }

  const buildSlideEl = (slide, i, total) => {
    const prefix = slide.type === 'pros' ? '✓&nbsp;' : slide.type === 'cons' ? '✗&nbsp;' : '→&nbsp;'
    const ac  = slide.color
    const bg  = accent(ac, 0.05)
    const brd = accent(ac, 0.18)

    const listItems = (slide.bullets || [])
      .map((b) => `<li style="background:${bg};border:1px solid ${brd}">${prefix}${esc(b)}</li>`)
      .join('')

    if (slide.type === 'title') {
      return `<div class="slide" style="background:linear-gradient(135deg,#030b18 0%,#0a1628 100%)">
        <div class="slide-num">${i + 1} / ${total}</div>
        <div class="badge" style="color:${ac};border-color:${brd};background:${bg}">Website Analysis</div>
        <h1 style="color:${ac}">${esc(slide.title)}</h1>
        ${slide.subtitle ? `<p class="sub">${esc(slide.subtitle)}</p>` : ''}
        ${slide.desc && slide.desc !== 'Not enough information' ? `<p class="desc">${esc(slide.desc)}</p>` : ''}
        <div class="wm">Web Intelligence · AI-Generated Analysis</div>
        <div class="glow" style="background:radial-gradient(ellipse 80% 70% at 10% 50%,${accent(ac, 0.07)} 0%,transparent 70%)"></div>
      </div>`
    }

    return `<div class="slide" style="background:linear-gradient(135deg,#030b18 0%,#0a1628 100%)">
      <div class="slide-num">${i + 1} / ${total}</div>
      <h2 style="color:${ac}">${esc(slide.title)}</h2>
      <div class="bar" style="background:${ac}"></div>
      ${listItems ? `<ul>${listItems}</ul>` : ''}
      <div class="glow" style="background:radial-gradient(ellipse 60% 50% at 5% 50%,${accent(ac, 0.06)} 0%,transparent 70%)"></div>
    </div>`
  }

  const body = slides.map((s, i) => buildSlideEl(s, i, slides.length)).join('')

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>${esc(meta?.title || 'Presentation')} — Web Intelligence</title>
<style>
@page{size:A4 landscape;margin:0}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Segoe UI',system-ui,sans-serif;background:#030b18;color:#e2e8f0;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.slide{width:100%;min-height:100vh;padding:60px 80px;display:flex;flex-direction:column;justify-content:center;position:relative;overflow:hidden;page-break-after:always;break-after:page}
.glow{position:absolute;inset:0;pointer-events:none}
.slide-num{position:absolute;top:20px;right:32px;font-size:11px;color:rgba(255,255,255,.25);font-family:monospace}
.badge{display:inline-flex;padding:4px 14px;border-radius:20px;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;border:1px solid;margin-bottom:20px;width:fit-content}
h1{font-size:52px;font-weight:800;line-height:1.1;margin-bottom:12px;position:relative}
h2{font-size:36px;font-weight:700;line-height:1.2;margin-bottom:8px;position:relative}
.bar{height:4px;width:48px;border-radius:4px;margin-bottom:24px;position:relative}
.sub{font-size:13px;color:rgba(255,255,255,.4);margin-bottom:20px;position:relative}
.desc{font-size:17px;color:rgba(255,255,255,.78);line-height:1.65;max-width:800px;position:relative}
.wm{position:absolute;bottom:24px;right:32px;font-size:10px;color:rgba(255,255,255,.18)}
ul{list-style:none;display:flex;flex-direction:column;gap:8px;position:relative}
li{font-size:14px;color:rgba(255,255,255,.88);line-height:1.55;padding:10px 16px;border-radius:8px;max-width:900px}
</style>
</head>
<body>${body}</body>
</html>`

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url  = URL.createObjectURL(blob)
  const win  = window.open(url, '_blank')
  if (win) {
    win.addEventListener('load', () => {
      setTimeout(() => {
        win.print()
        setTimeout(() => URL.revokeObjectURL(url), 3000)
      }, 700)
    })
  }
}

// ─── Slide content renderer ────────────────────────────────────────────────────

const slideVariants = {
  enter: (dir) => ({ x: dir > 0 ? '55%' : '-55%', opacity: 0, scale: 0.97 }),
  center: { x: 0, opacity: 1, scale: 1 },
  exit:  (dir) => ({ x: dir > 0 ? '-55%' : '55%', opacity: 0, scale: 0.97 }),
}

function SlideContent({ slide }) {
  const color = slide.color

  if (slide.type === 'title') {
    return (
      <div className="text-center flex flex-col items-center gap-5">
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border"
          style={{ borderColor: hex2rgba(color, 0.35), background: hex2rgba(color, 0.08), color }}
        >
          <Globe className="h-3 w-3" />
          Website Analysis
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 260, damping: 22 }}
          className="font-heading font-black text-4xl sm:text-5xl lg:text-6xl leading-tight max-w-3xl"
          style={{ color }}
        >
          {slide.title}
        </motion.h1>

        {slide.subtitle && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.18 }}
            className="text-sm text-cyber-muted truncate max-w-md"
          >
            {slide.subtitle}
          </motion.p>
        )}

        {slide.desc && slide.desc !== 'Not enough information' && (
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.22 }}
            className="text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed"
          >
            {slide.desc}
          </motion.p>
        )}

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-[11px] text-cyber-muted/50 tracking-widest uppercase"
        >
          Web Intelligence · AI Analysis
        </motion.p>
      </div>
    )
  }

  const bulletColor =
    slide.type === 'pros'     ? '#10FFA8'
    : slide.type === 'cons'   ? '#FF4D6D'
    : color

  const prefix =
    slide.type === 'pros' ? '✓'
    : slide.type === 'cons' ? '✗'
    : null

  const gridCols = slide.type === 'features' && slide.bullets.length >= 4
    ? 'grid grid-cols-1 sm:grid-cols-2 gap-3'
    : 'flex flex-col gap-2.5'

  return (
    <div className="space-y-5 w-full">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.04 }}
      >
        <h2 className="font-heading font-bold text-3xl sm:text-4xl" style={{ color }}>
          {slide.title}
        </h2>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: 48 }}
          transition={{ delay: 0.12, duration: 0.4 }}
          className="h-1 rounded-full mt-2.5"
          style={{ background: color }}
        />
      </motion.div>

      <div className={gridCols}>
        {(slide.bullets || []).map((bullet, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -14 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 + i * 0.065, type: 'spring', stiffness: 320, damping: 26 }}
            className="flex items-start gap-3 rounded-xl px-4 py-3"
            style={{
              background: hex2rgba(bulletColor, 0.05),
              border: `1px solid ${hex2rgba(bulletColor, 0.18)}`,
            }}
          >
            {prefix ? (
              <span
                className="shrink-0 text-sm font-bold mt-0.5"
                style={{ color: bulletColor }}
              >
                {prefix}
              </span>
            ) : (
              <span
                className="shrink-0 h-1.5 w-1.5 rounded-full mt-2"
                style={{ background: bulletColor, opacity: 0.75 }}
              />
            )}
            <span className="text-slate-200 text-sm sm:text-base leading-relaxed">{bullet}</span>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

// ─── Presentation modal ────────────────────────────────────────────────────────

function PresentationModal({ slides, meta, onClose }) {
  const [current, setCurrent] = useState(0)
  const [dir, setDir]         = useState(1)

  const go = useCallback((idx) => {
    setDir(idx > current ? 1 : -1)
    setCurrent(idx)
  }, [current])

  const next = useCallback(() => { if (current < slides.length - 1) go(current + 1) }, [current, slides.length, go])
  const prev = useCallback(() => { if (current > 0) go(current - 1) }, [current, go])

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next()
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') prev()
      else if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [next, prev, onClose])

  const slide    = slides[current]
  const progress = ((current + 1) / slides.length) * 100

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: '#030b18' }}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-white/8 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <Presentation className="h-4 w-4 text-cyber-cyan shrink-0" />
          <span className="text-sm font-semibold text-white truncate max-w-xs">
            {meta?.title || 'Presentation'}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-cyber-muted font-mono tabular-nums">
            {current + 1}&thinsp;/&thinsp;{slides.length}
          </span>
          <button
            onClick={() => downloadSlidesAsPDF(slides, meta)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-white/10 bg-white/5 hover:bg-white/10 text-white transition-colors"
          >
            <FileDown className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Download PDF</span>
          </button>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-lg flex items-center justify-center border border-white/10 bg-white/5 hover:bg-white/10 text-cyber-muted hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-0.5 bg-white/5 shrink-0">
        <motion.div
          className="h-full"
          style={{ background: `linear-gradient(90deg, ${slide.color}, #8B5CF6)` }}
          animate={{ width: `${progress}%` }}
          transition={{ type: 'spring', stiffness: 180, damping: 28 }}
        />
      </div>

      {/* Slide area */}
      <div className="flex-1 relative overflow-hidden">
        {/* Background glow follows slide color */}
        <motion.div
          key={slide.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse 65% 55% at 50% 50%, ${hex2rgba(slide.color, 0.05)} 0%, transparent 70%)`,
          }}
        />

        <AnimatePresence custom={dir} mode="wait">
          <motion.div
            key={current}
            custom={dir}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="absolute inset-0 flex items-center justify-center px-6 sm:px-12 py-8"
          >
            <div className="w-full max-w-4xl">
              <SlideContent slide={slide} />
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation footer */}
      <div className="flex items-center justify-center gap-4 py-4 border-t border-white/8 shrink-0">
        <button
          onClick={prev}
          disabled={current === 0}
          className="h-9 w-9 rounded-xl flex items-center justify-center border border-white/10 text-cyber-muted hover:text-white hover:border-white/20 transition-all disabled:opacity-25 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        {/* Dot indicators */}
        <div className="flex gap-1.5 items-center">
          {slides.map((s, i) => (
            <motion.button
              key={i}
              onClick={() => go(i)}
              animate={{
                width: i === current ? 24 : 8,
                background: i === current ? s.color : 'rgba(255,255,255,0.15)',
              }}
              transition={{ type: 'spring', stiffness: 400, damping: 28 }}
              className="h-2 rounded-full cursor-pointer"
            />
          ))}
        </div>

        <button
          onClick={next}
          disabled={current === slides.length - 1}
          className="h-9 w-9 rounded-xl flex items-center justify-center border border-white/10 text-cyber-muted hover:text-white hover:border-white/20 transition-all disabled:opacity-25 disabled:cursor-not-allowed"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </motion.div>
  )
}

// ─── Insight card ──────────────────────────────────────────────────────────────

function InsightCard({ block, accent, idx }) {
  const meta  = CARD_META[block.title] || { Icon: Sparkles, color: '#00D4FF' }
  const { Icon } = meta
  const color = idx % 3 === 0 ? (accent || meta.color)
              : idx % 3 === 1 ? '#8B5CF6'
              : '#10FFA8'

  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.07, type: 'spring', stiffness: 260, damping: 24 }}
      className="rounded-2xl p-6 space-y-4 hover:-translate-y-1 transition-transform duration-300"
      style={{
        background: `linear-gradient(135deg, ${hex2rgba(color, 0.06)} 0%, rgba(10,22,40,0.85) 100%)`,
        border: `1px solid ${hex2rgba(color, 0.2)}`,
        boxShadow: `0 4px 24px rgba(0,0,0,0.3)`,
      }}
    >
      <div className="flex items-center gap-3">
        <motion.div
          initial={{ scale: 0, rotate: -30 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: idx * 0.07 + 0.1, type: 'spring', stiffness: 300, damping: 18 }}
          className="h-10 w-10 rounded-2xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: hex2rgba(color, 0.12), border: `1px solid ${hex2rgba(color, 0.28)}` }}
        >
          <Icon className="h-5 w-5" style={{ color }} />
        </motion.div>
        <h3 className="font-heading font-bold text-base" style={{ color }}>{block.title}</h3>
      </div>

      <ul className="space-y-2">
        {(block.items || []).map((item, i) => {
          const isPro = item.startsWith('Pro:')
          const isCon = item.startsWith('Con:')
          const text  = (isPro || isCon) ? item.replace(/^(Pro:|Con:)\s*/, '') : item
          const dotColor = isPro ? '#10FFA8' : isCon ? '#FF4D6D' : color

          return (
            <motion.li
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.07 + 0.18 + i * 0.04 }}
              className="flex gap-2.5 items-start rounded-xl px-3 py-2.5 text-sm leading-6"
              style={{
                background: isPro ? 'rgba(16,255,168,0.04)' : isCon ? 'rgba(255,77,109,0.04)' : 'rgba(255,255,255,0.02)',
                border: isPro ? '1px solid rgba(16,255,168,0.15)' : isCon ? '1px solid rgba(255,77,109,0.15)' : '1px solid rgba(255,255,255,0.05)',
              }}
            >
              {(isPro || isCon) ? (
                <span className="shrink-0 mt-1.5 text-[10px] font-bold uppercase tracking-wider" style={{ color: dotColor }}>
                  {isPro ? '✓' : '✗'}
                </span>
              ) : (
                <span className="shrink-0 mt-2 h-1.5 w-1.5 rounded-full" style={{ backgroundColor: dotColor, opacity: 0.7 }} />
              )}
              <span className="text-slate-300">{text}</span>
            </motion.li>
          )
        })}
      </ul>
    </motion.div>
  )
}

function SkeletonCard({ idx }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: idx * 0.05 }}
      className="glass rounded-2xl p-6 space-y-4"
    >
      <div className="flex items-center gap-3">
        <div className="shimmer h-10 w-10 rounded-2xl" />
        <div className="shimmer h-5 w-32 rounded-lg" />
      </div>
      {[1, 2, 3].map((j) => <div key={j} className="shimmer h-11 rounded-xl" />)}
    </motion.div>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function InsightsPage() {
  const { sessionId } = useParams()
  const [insights, setInsights]             = useState(null)
  const [meta, setMeta]                     = useState(null)
  const [loading, setLoading]               = useState(true)
  const [error, setError]                   = useState('')
  const [showPresentation, setShowPresentation] = useState(false)

  async function fetchAll() {
    setLoading(true)
    setError('')
    try {
      const [ins, sessions] = await Promise.allSettled([
        loadInsights(sessionId),
        loadSessions(),
      ])
      if (ins.status === 'fulfilled') setInsights(ins.value)
      else throw ins.reason
      if (sessions.status === 'fulfilled') {
        const match = (sessions.value.sessions || []).find((s) => s.session_id === sessionId)
        if (match) setMeta(match)
      }
    } catch (e) {
      setError(e.message || 'Failed to load insights')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAll() }, [sessionId])

  const accent  = meta?.theme?.accent
  const favicon = meta?.theme?.favicon
  const ogImage = meta?.theme?.og_image

  useSEO({
    title: meta?.title || null,
    image: ogImage || null,
    url: `/insights/${sessionId}`,
  })

  const slides = insights?.structured ? buildSlides(insights.structured, meta) : []
  const canPresent = !loading && slides.length > 0

  return (
    <div className="min-h-screen bg-cyber-bg bg-grid text-white">

      {/* Header */}
      <header className="sticky top-0 z-30 glass border-b border-white/8">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-4">
          <Link
            to="/"
            className="flex items-center gap-2 text-cyber-muted hover:text-white transition-colors text-sm font-medium shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back</span>
          </Link>

          <div className="h-4 w-px bg-white/10" />

          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            {favicon && <img src={favicon} alt="" className="h-5 w-5 rounded shrink-0" onError={(e) => e.target.style.display = 'none'} />}
            {!favicon && <Globe className="h-4 w-4 text-cyber-muted shrink-0" />}
            <span className="font-heading font-semibold text-sm text-white truncate">{meta?.title || 'Insights'}</span>
            {meta?.urls?.[0] && (
              <a
                href={meta.urls[0]}
                target="_blank"
                rel="noreferrer"
                className="text-cyber-muted hover:text-cyber-cyan transition-colors shrink-0"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
          </div>

          <div className="shrink-0 flex items-center gap-2">
            <span className="rounded-full px-3 py-1 text-[11px] border border-cyber-cyan/20 bg-cyber-cyan/5 text-cyber-cyan font-medium">
              AI Insights
            </span>

            <button
              onClick={fetchAll}
              disabled={loading}
              className="h-8 w-8 rounded-xl glass flex items-center justify-center text-cyber-muted hover:text-white transition-colors disabled:opacity-40"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      {ogImage && !loading && (
        <div
          className="relative h-40 overflow-hidden"
          style={{
            background: `linear-gradient(to bottom, rgba(3,11,24,0.2) 0%, rgba(3,11,24,0.95) 100%), url(${ogImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center top',
          }}
        />
      )}

      <main className="max-w-6xl mx-auto px-4 py-8">

        {error && (
          <div className="glass rounded-2xl p-6 flex flex-col items-center gap-3 text-center mb-8">
            <Sparkles className="h-8 w-8 text-cyber-cyan/30" />
            <p className="text-cyber-muted text-sm">{error}</p>
            <button onClick={fetchAll} className="text-xs text-cyber-cyan hover:text-white transition-colors">
              Retry
            </button>
          </div>
        )}

        {!error && (
          <>
            {/* Page title */}
            <motion.div
              className="mb-6 space-y-1"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h1 className="font-heading font-bold text-2xl text-gradient">AI-Generated Insights</h1>
              <p className="text-sm text-cyber-muted">
                {meta?.title ? `Analysis of ${meta.title}` : 'Site analysis'}
              </p>
            </motion.div>

            {/* ── Presentation Slides CTA ── centered, always visible ── */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 260, damping: 24 }}
              className="mb-8 flex justify-center"
            >
              <motion.button
                onClick={() => canPresent && setShowPresentation(true)}
                whileHover={{ scale: 1.03, y: -3 }}
                whileTap={{ scale: 0.97 }}
                className="group relative flex items-center gap-4 px-7 py-4 rounded-2xl overflow-hidden cursor-pointer"
                style={{
                  background: 'linear-gradient(135deg, rgba(139,92,246,0.22) 0%, rgba(0,212,255,0.12) 100%)',
                  border: '1px solid rgba(139,92,246,0.55)',
                  boxShadow: '0 0 40px rgba(139,92,246,0.2), 0 8px 24px rgba(0,0,0,0.4)',
                }}
              >
                {/* Pulse ring */}
                {canPresent && (
                  <span className="absolute inset-0 rounded-2xl animate-pulse pointer-events-none"
                    style={{ boxShadow: 'inset 0 0 0 1px rgba(139,92,246,0.3)' }} />
                )}
                {/* Shimmer sweep */}
                <span
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
                  style={{ background: 'linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.07) 50%, transparent 65%)' }}
                />

                {/* Icon */}
                <span
                  className="relative flex items-center justify-center h-10 w-10 rounded-xl shrink-0"
                  style={{ background: 'rgba(139,92,246,0.25)', border: '1px solid rgba(139,92,246,0.5)' }}
                >
                  {loading
                    ? <RefreshCw className="h-5 w-5 animate-spin" style={{ color: '#a78bfa' }} />
                    : <Presentation className="h-5 w-5" style={{ color: '#a78bfa' }} />
                  }
                </span>

                {/* Label */}
                <span className="relative flex flex-col items-start leading-tight">
                  <span className="font-bold text-base tracking-wide" style={{ color: '#e9d5ff' }}>
                    Presentation Slides
                  </span>
                  <span className="text-[11px] font-normal" style={{ color: 'rgba(196,181,253,0.65)' }}>
                    {loading
                      ? 'Generating insights…'
                      : `${slides.length} slides · Interactive · PDF export`}
                  </span>
                </span>

                <ChevronRight
                  className="relative h-5 w-5 opacity-60 group-hover:opacity-100 group-hover:translate-x-1 transition-all"
                  style={{ color: '#a78bfa' }}
                />
              </motion.button>
            </motion.div>
            {/* ── end CTA ── */}

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {loading
                ? Array.from({ length: 7 }, (_, i) => <SkeletonCard key={i} idx={i} />)
                : insights?.structured?.map((block, idx) => (
                    <InsightCard key={block.title} block={block} accent={accent} idx={idx} />
                  ))
              }
            </div>

            {!loading && !insights?.structured?.length && !error && (
              <div className="glass rounded-2xl p-10 flex flex-col items-center gap-3 text-center">
                <Sparkles className="h-8 w-8 text-cyber-cyan/30" />
                <p className="text-cyber-muted text-sm">No insights available for this session.</p>
              </div>
            )}
          </>
        )}
      </main>

      {/* Presentation modal */}
      <AnimatePresence>
        {showPresentation && slides.length > 0 && (
          <PresentationModal
            slides={slides}
            meta={meta}
            onClose={() => setShowPresentation(false)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
