import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles, TrendingUp, Zap, Users, Cpu, Tag, ThumbsUp,
  Loader2, X, ChevronRight, ChevronLeft, Shield, ClipboardList,
  Presentation, FileDown, Globe, RefreshCw,
} from 'lucide-react'

const CARD_META = {
  'Overview':          { Icon: Sparkles,   defaultColor: '#00D4FF' },
  'Business Model':    { Icon: TrendingUp, defaultColor: '#8B5CF6' },
  'Key Features':      { Icon: Zap,        defaultColor: '#00D4FF' },
  'Target Audience':   { Icon: Users,      defaultColor: '#8B5CF6' },
  'Technology':        { Icon: Cpu,        defaultColor: '#10FFA8' },
  'Pricing':           { Icon: Tag,        defaultColor: '#10FFA8' },
  'Pros & Cons':       { Icon: ThumbsUp,   defaultColor: '#10FFA8' },
  'Website Security':  { Icon: Shield,     defaultColor: '#10FFA8' },
}

// Preferred display order — unlisted titles fall to end
const CARD_ORDER = [
  'Overview', 'Key Features', 'Website Security', 'Target Audience',
  'Business Model', 'Technology', 'Pricing', 'Pros & Cons',
]

function isNoSource(block) {
  const items = block?.items || []
  return items.length === 0 || items.every((i) => i.trim().toLowerCase() === 'no source found.')
}

function hex2rgba(hex, alpha) {
  try {
    const h = hex.replace('#', '')
    const r = parseInt(h.substring(0, 2), 16)
    const g = parseInt(h.substring(2, 4), 16)
    const b = parseInt(h.substring(4, 6), 16)
    return `rgba(${r},${g},${b},${alpha})`
  } catch {
    return `rgba(0,212,255,${alpha})`
  }
}

function cardColor(idx, accent) {
  return idx % 3 === 0 ? (accent || '#00D4FF') : idx % 3 === 1 ? '#8B5CF6' : '#10FFA8'
}

// ── Score ring (SVG) ──────────────────────────────────────────────────────
function ScoreRing({ score }) {
  const r = 28
  const circ = 2 * Math.PI * r
  const color = score >= 75 ? '#10FFA8' : score >= 52 ? '#00D4FF' : score >= 36 ? '#F59E0B' : '#FF4D6D'

  return (
    <div className="relative flex items-center justify-center shrink-0" style={{ width: 76, height: 76 }}>
      <svg width="76" height="76" viewBox="0 0 76 76" className="absolute inset-0">
        <circle cx="38" cy="38" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4.5" />
        <motion.circle
          cx="38" cy="38" r={r}
          fill="none" stroke={color} strokeWidth="4.5"
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ - (score / 100) * circ }}
          transition={{ duration: 1.4, ease: 'easeOut', delay: 0.3 }}
          style={{ transform: 'rotate(-90deg)', transformOrigin: '38px 38px' }}
        />
      </svg>
      <div className="relative text-center z-10">
        <motion.div
          className="text-[17px] font-bold leading-none"
          style={{ color }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          {score}
        </motion.div>
        <div className="text-[8px] text-cyber-muted mt-0.5 leading-none">/ 100</div>
      </div>
    </div>
  )
}

// ── Analyst report derived from structured blocks ─────────────────────────
function computeReport(structured, security) {
  const prosConsBlock = structured.find((b) => b.title === 'Pros & Cons')
  const pros  = (prosConsBlock?.items || []).filter((i) => i.startsWith('Pro:'))
  const cons  = (prosConsBlock?.items || []).filter((i) => i.startsWith('Con:'))
  const features = (structured.find((b) => b.title === 'Key Features')?.items || [])
  const pricing  = (structured.find((b) => b.title === 'Pricing')?.items || [])

  // Security bonus: up to 27 pts based on factual header checks
  let secBonus = 0
  const secDetails = []
  if (security) {
    if (security.https_enabled)        { secBonus += 8; secDetails.push({ label: 'HTTPS Enabled', pts: 8 }) }
    if (security.ssl_valid)            { secBonus += 4; secDetails.push({ label: 'Valid SSL Certificate', pts: 4 }) }
    if (security.has_csp)              { secBonus += 6; secDetails.push({ label: 'Content-Security-Policy', pts: 6 }) }
    if (security.has_x_frame_options)  { secBonus += 4; secDetails.push({ label: 'X-Frame-Options', pts: 4 }) }
    if (security.has_x_xss_protection) { secBonus += 2; secDetails.push({ label: 'X-XSS-Protection', pts: 2 }) }
    if (security.cookies_secure)       { secBonus += 2; secDetails.push({ label: 'Secure Cookie Flag', pts: 2 }) }
    if (security.cookies_httponly)     { secBonus += 1; secDetails.push({ label: 'HttpOnly Cookie Flag', pts: 1 }) }
  }

  const featureScore = Math.min(features.length * 3, 12)
  const proScore     = Math.min(pros.length * 6, 18)
  const conPenalty   = Math.min(cons.length * 5, 15)

  const score = Math.min(95, Math.max(15, 40 + proScore - conPenalty + featureScore + secBonus))

  const verdict =
    score >= 78 ? 'Strong platform with clear value proposition and differentiated positioning.'
    : score >= 60 ? 'Solid offering — core strengths evident, some areas warrant closer evaluation.'
    : score >= 42 ? 'Mixed signals detected. Weigh benefits carefully against the noted risk factors.'
    :               'Notable risk factors present. Independent validation recommended before commitment.'

  const signals = [
    features[0] && { label: 'Top Feature',    value: features[0] },
    pros[0]      && { label: 'Key Strength',   value: pros[0].replace(/^Pro:\s*/, '') },
    cons[0]      && { label: 'Risk Factor',    value: cons[0].replace(/^Con:\s*/, '') },
    pricing[0]   && { label: 'Pricing Signal', value: pricing[0] },
  ].filter(Boolean).slice(0, 3)

  const breakdown = [
    {
      label: 'Base Signal', score: 40, max: 40, color: '#00D4FF',
      desc: 'Fixed floor for any accessible, indexable page',
      isBase: true,
    },
    {
      label: 'Security Posture', score: secBonus, max: 27, color: '#10FFA8',
      desc: 'HTTPS · SSL · CSP · X-Frame-Options · XSS Protection · Cookie Flags',
      sub: secDetails,
    },
    {
      label: 'Value Signals', score: proScore, max: 18, color: '#8B5CF6',
      desc: `Up to 3 identified strengths × 6 pts each`,
    },
    {
      label: 'Content Quality', score: featureScore, max: 12, color: '#00D4FF',
      desc: `Up to 4 detected features × 3 pts each`,
    },
    {
      label: 'Risk Adjustment', score: -conPenalty, max: 0, color: '#FF4D6D',
      desc: `Up to 3 risk factors × −5 pts each`,
      isRisk: true,
    },
  ]

  return { pros, cons, score, verdict, signals, breakdown }
}

// ── Score breakdown modal ─────────────────────────────────────────────────
function ScoreBreakdownModal({ breakdown, totalScore, onClose }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const scoreColor = totalScore >= 75 ? '#10FFA8' : totalScore >= 52 ? '#00D4FF' : totalScore >= 36 ? '#F59E0B' : '#FF4D6D'

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      style={{ background: 'rgba(3,11,24,0.88)', backdropFilter: 'blur(14px)' }}
    >
      <motion.div
        className="relative w-full max-w-md rounded-3xl overflow-hidden"
        initial={{ scale: 0.88, y: 24, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.92, y: 12, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 380, damping: 28 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'rgba(10,22,40,0.97)',
          border: '1px solid rgba(0,212,255,0.25)',
          boxShadow: '0 0 70px rgba(0,212,255,0.1), 0 28px 80px rgba(0,0,0,0.75)',
        }}
      >
        {/* Header */}
        <div className="px-5 sm:px-6 pt-5 sm:pt-6 pb-4" style={{ background: 'linear-gradient(135deg, rgba(0,212,255,0.1) 0%, transparent 100%)' }}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: 'rgba(0,212,255,0.12)', border: '1px solid rgba(0,212,255,0.3)' }}>
                <ClipboardList className="h-5 w-5 text-cyber-cyan" />
              </div>
              <div>
                <h2 className="font-heading font-bold text-[1.05rem] text-white leading-tight">Score Methodology</h2>
                <p className="text-[10px] text-cyber-muted mt-0.5">How the Intelligence Report score is calculated</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="shrink-0 h-8 w-8 rounded-xl flex items-center justify-center text-cyber-muted hover:text-white hover:bg-white/10 transition-all"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Total score chip */}
          <div className="flex items-center gap-2 mt-4">
            <span className="text-[10px] text-cyber-muted">Total Score</span>
            <span
              className="font-bold text-[1.1rem] leading-none"
              style={{ color: scoreColor }}
            >{totalScore}</span>
            <span className="text-[10px] text-cyber-muted">/ 95 max</span>
          </div>
        </div>

        <div className="h-px mx-5 sm:mx-6" style={{ background: 'linear-gradient(90deg, rgba(0,212,255,0.3), transparent)' }} />

        {/* Categories */}
        <div className="px-5 sm:px-6 py-4 sm:py-5 space-y-4 max-h-[50vh] sm:max-h-[60vh] overflow-y-auto">
          {breakdown.map((cat, i) => {
            const pct = cat.isRisk
              ? 0
              : cat.max > 0 ? (cat.score / cat.max) * 100 : 100
            const displayScore = cat.isRisk ? cat.score : `+${cat.score}`

            return (
              <motion.div
                key={cat.label}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.07 }}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-semibold text-white">{cat.label}</span>
                  <span
                    className="text-[11px] font-bold tabular-nums"
                    style={{ color: cat.isRisk ? '#FF4D6D' : cat.color }}
                  >
                    {displayScore} <span className="text-cyber-muted font-normal text-[9px]">/ {cat.max}</span>
                  </span>
                </div>
                <p className="text-[9px] text-cyber-muted mb-1.5 leading-4">{cat.desc}</p>
                {!cat.isRisk && (
                  <div className="h-1 rounded-full bg-white/5 overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: cat.color }}
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.8, delay: 0.1 + i * 0.07, ease: 'easeOut' }}
                    />
                  </div>
                )}
                {cat.isRisk && cat.score < 0 && (
                  <div className="h-1 rounded-full bg-white/5 overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-red-400/60"
                      initial={{ width: 0 }}
                      animate={{ width: `${(Math.abs(cat.score) / 15) * 100}%` }}
                      transition={{ duration: 0.8, delay: 0.1 + i * 0.07, ease: 'easeOut' }}
                    />
                  </div>
                )}
                {/* Security sub-items */}
                {cat.sub?.length > 0 && (
                  <div className="mt-2 pl-2 space-y-1">
                    {cat.sub.map((s) => (
                      <div key={s.label} className="flex items-center justify-between text-[9px]">
                        <span className="text-cyber-muted">{s.label}</span>
                        <span style={{ color: cat.color }}>+{s.pts}</span>
                      </div>
                    ))}
                    {Array.from({ length: 7 - cat.sub.length }).map((_, idx) => {
                      const missing = [
                        'HTTPS Enabled', 'Valid SSL Certificate', 'Content-Security-Policy',
                        'X-Frame-Options', 'X-XSS-Protection', 'Secure Cookie Flag', 'HttpOnly Cookie Flag',
                      ].filter((l) => !cat.sub.find((s) => s.label === l))[idx]
                      return missing ? (
                        <div key={missing} className="flex items-center justify-between text-[9px]">
                          <span className="text-white/25">{missing}</span>
                          <span className="text-white/20">+0</span>
                        </div>
                      ) : null
                    })}
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>

        <div className="px-5 sm:px-6 pb-5 pt-1 border-t border-white/5">
          <p className="text-[9px] text-cyber-muted text-center leading-4">
            Security scores are factual (HTTP header checks). Content scores are derived from AI analysis.
            <br />Press Esc or click outside to close.
          </p>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ── Presentation slide logic ──────────────────────────────────────────────

function buildSlides(structured, meta) {
  if (!structured?.length) return []
  const get = (title) => {
    const block = structured.find((b) => b.title === title)
    return (block?.items || []).filter((i) => i.toLowerCase().trim() !== 'no source found.')
  }
  const title    = meta?.title || 'Website Analysis'
  const url      = meta?.urls?.[0] || ''
  const intro    = get('Introduction') || get('Overview')
  const features = get('Key Features')
  const bizModel = get('Business Model')
  const audience = get('Target Audience')
  const themes   = get('Content Themes')
  const pricing  = get('Pricing')
  const tech     = get('Technology')
  const proscons = structured.find((b) => b.title === 'Pros & Cons')?.items || []
  const pros = proscons.filter((i) => i.startsWith('Pro:')).map((i) => i.replace(/^Pro:\s*/i, ''))
  const cons = proscons.filter((i) => i.startsWith('Con:')).map((i) => i.replace(/^Con:\s*/i, ''))
  const skip = (arr) => arr.length === 0  // drop slide if no real bullets
  const takeaway = [...pros.slice(0, 2), ...cons.slice(0, 1), ...intro.slice(0, 2)].filter(Boolean).slice(0, 5)
  return [
    { id: 1,  type: 'title',    title, subtitle: url, desc: intro[0] || '', color: '#00D4FF' },
    !skip(intro.slice(0, 5))            && { id: 2,  type: 'bullets',  title: 'What This Website Does', bullets: intro.slice(0, 5),                           color: '#00D4FF' },
    !skip(intro.length > 1 ? intro.slice(1, 5) : []) && { id: 3, type: 'bullets', title: 'Value Proposition', bullets: intro.slice(1, 5),                    color: '#8B5CF6' },
    !skip(features.slice(0, 6))         && { id: 4,  type: 'features', title: 'Key Features',           bullets: features.slice(0, 6),                       color: '#10FFA8' },
    !skip(audience.slice(0, 5))         && { id: 5,  type: 'bullets',  title: 'Target Audience',         bullets: audience.slice(0, 5),                       color: '#8B5CF6' },
    !skip(bizModel.slice(0, 4))         && { id: 6,  type: 'bullets',  title: 'Business Model',          bullets: bizModel.slice(0, 4),                       color: '#00D4FF' },
    !skip([...themes, ...pricing, ...tech].slice(0, 5)) && { id: 7, type: 'bullets', title: 'UX & Content Style', bullets: [...themes, ...pricing, ...tech].slice(0, 5), color: '#10FFA8' },
    !skip(pros.slice(0, 4))             && { id: 8,  type: 'pros',     title: 'Strengths',               bullets: pros.slice(0, 4),                           color: '#10FFA8' },
    !skip(cons.slice(0, 4))             && { id: 9,  type: 'cons',     title: 'Weaknesses',               bullets: cons.slice(0, 4),                           color: '#FF4D6D' },
    !skip(takeaway)                     && { id: 10, type: 'takeaway', title: 'Final Takeaway',           bullets: takeaway,                                   color: '#8B5CF6' },
  ].filter(Boolean)
}

function downloadSlidesAsPDF(slides, meta) {
  const esc = (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
  const ac = (hex, op) => {
    try {
      const h = hex.replace('#', '')
      const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16))
      return `rgba(${r},${g},${b},${op})`
    } catch { return `rgba(0,212,255,${op})` }
  }
  const buildEl = (slide, i, total) => {
    const prefix = slide.type === 'pros' ? '✓&nbsp;' : slide.type === 'cons' ? '✗&nbsp;' : '→&nbsp;'
    const bg  = ac(slide.color, 0.05); const brd = ac(slide.color, 0.18)
    const list = (slide.bullets || []).map((b) => `<li style="background:${bg};border:1px solid ${brd}">${prefix}${esc(b)}</li>`).join('')
    const glow = `background:radial-gradient(ellipse 80% 70% at 10% 50%,${ac(slide.color, 0.07)} 0%,transparent 70%)`
    if (slide.type === 'title') return `<div class="slide"><div class="slide-num">${i+1}/${total}</div><div class="badge" style="color:${slide.color};border-color:${brd};background:${bg}">Website Analysis</div><h1 style="color:${slide.color}">${esc(slide.title)}</h1>${slide.subtitle ? `<p class="sub">${esc(slide.subtitle)}</p>` : ''}${slide.desc && slide.desc !== 'Not enough information' ? `<p class="desc">${esc(slide.desc)}</p>` : ''}<div class="wm">Web Intelligence · AI Analysis</div><div class="glow" style="${glow}"></div></div>`
    return `<div class="slide"><div class="slide-num">${i+1}/${total}</div><h2 style="color:${slide.color}">${esc(slide.title)}</h2><div class="bar" style="background:${slide.color}"></div>${list ? `<ul>${list}</ul>` : ''}<div class="glow" style="${glow}"></div></div>`
  }
  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>${esc(meta?.title||'Slides')}</title><style>@page{size:A4 landscape;margin:0}*{box-sizing:border-box;margin:0;padding:0}body{font-family:'Segoe UI',system-ui,sans-serif;background:#030b18;color:#e2e8f0;-webkit-print-color-adjust:exact;print-color-adjust:exact}.slide{width:100%;min-height:100vh;padding:60px 80px;display:flex;flex-direction:column;justify-content:center;background:linear-gradient(135deg,#030b18 0%,#0a1628 100%);position:relative;overflow:hidden;page-break-after:always;break-after:page}.glow{position:absolute;inset:0;pointer-events:none}.slide-num{position:absolute;top:20px;right:32px;font-size:11px;color:rgba(255,255,255,.25);font-family:monospace}.badge{display:inline-flex;padding:4px 14px;border-radius:20px;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;border:1px solid;margin-bottom:20px;width:fit-content}h1{font-size:52px;font-weight:800;line-height:1.1;margin-bottom:12px;position:relative}h2{font-size:36px;font-weight:700;line-height:1.2;margin-bottom:8px;position:relative}.bar{height:4px;width:48px;border-radius:4px;margin-bottom:24px;position:relative}.sub{font-size:13px;color:rgba(255,255,255,.4);margin-bottom:20px;position:relative}.desc{font-size:17px;color:rgba(255,255,255,.78);line-height:1.65;max-width:800px;position:relative}.wm{position:absolute;bottom:24px;right:32px;font-size:10px;color:rgba(255,255,255,.18)}ul{list-style:none;display:flex;flex-direction:column;gap:8px;position:relative}li{font-size:14px;color:rgba(255,255,255,.88);line-height:1.55;padding:10px 16px;border-radius:8px;max-width:900px}</style></head><body>${slides.map((s,i)=>buildEl(s,i,slides.length)).join('')}</body></html>`
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url  = URL.createObjectURL(blob)
  const win  = window.open(url, '_blank')
  if (win) win.addEventListener('load', () => { setTimeout(() => { win.print(); setTimeout(() => URL.revokeObjectURL(url), 3000) }, 700) })
}

const slideVariants = {
  enter:  (dir) => ({ x: dir > 0 ? '55%' : '-55%', opacity: 0, scale: 0.97 }),
  center: { x: 0, opacity: 1, scale: 1 },
  exit:   (dir) => ({ x: dir > 0 ? '-55%' : '55%', opacity: 0, scale: 0.97 }),
}

function SlideContent({ slide }) {
  const color = slide.color
  if (slide.type === 'title') {
    return (
      <div className="text-center flex flex-col items-center gap-5">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border"
          style={{ borderColor: hex2rgba(color, 0.35), background: hex2rgba(color, 0.08), color }}>
          <Globe className="h-3 w-3" /> Website Analysis
        </motion.div>
        <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, type: 'spring', stiffness: 260, damping: 22 }}
          className="font-heading font-black text-4xl sm:text-5xl lg:text-6xl leading-tight max-w-3xl" style={{ color }}>
          {slide.title}
        </motion.h1>
        {slide.subtitle && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.18 }} className="text-sm text-slate-500 truncate max-w-md">{slide.subtitle}</motion.p>}
        {slide.desc && slide.desc !== 'Not enough information' && (
          <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }} className="text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed">{slide.desc}</motion.p>
        )}
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="text-[11px] text-slate-600 tracking-widest uppercase">Web Intelligence · AI Analysis</motion.p>
      </div>
    )
  }
  const bulletColor = slide.type === 'pros' ? '#10FFA8' : slide.type === 'cons' ? '#FF4D6D' : color
  const prefix      = slide.type === 'pros' ? '✓' : slide.type === 'cons' ? '✗' : null
  const gridClass   = slide.type === 'features' && slide.bullets.length >= 4 ? 'grid grid-cols-1 sm:grid-cols-2 gap-3' : 'flex flex-col gap-2.5'
  return (
    <div className="space-y-5 w-full">
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 }}>
        <h2 className="font-heading font-bold text-3xl sm:text-4xl" style={{ color }}>{slide.title}</h2>
        <motion.div initial={{ width: 0 }} animate={{ width: 48 }} transition={{ delay: 0.12, duration: 0.4 }} className="h-1 rounded-full mt-2.5" style={{ background: color }} />
      </motion.div>
      <div className={gridClass}>
        {(slide.bullets || []).map((bullet, i) => (
          <motion.div key={i} initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.065, type: 'spring', stiffness: 320, damping: 26 }}
            className="flex items-start gap-3 rounded-xl px-4 py-3"
            style={{ background: hex2rgba(bulletColor, 0.05), border: `1px solid ${hex2rgba(bulletColor, 0.18)}` }}>
            {prefix
              ? <span className="shrink-0 text-sm font-bold mt-0.5" style={{ color: bulletColor }}>{prefix}</span>
              : <span className="shrink-0 h-1.5 w-1.5 rounded-full mt-2" style={{ background: bulletColor, opacity: 0.75 }} />}
            <span className="text-slate-200 text-sm sm:text-base leading-relaxed">{bullet}</span>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

function PresentationModal({ slides, meta, onClose }) {
  const [current, setCurrent] = useState(0)
  const [dir, setDir]         = useState(1)
  const go   = (idx) => { setDir(idx > current ? 1 : -1); setCurrent(idx) }
  const next = () => { if (current < slides.length - 1) go(current + 1) }
  const prev = () => { if (current > 0) go(current - 1) }
  useEffect(() => {
    const h = (e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next()
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') prev()
      else if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [current, slides.length])
  const slide    = slides[current]
  const progress = ((current + 1) / slides.length) * 100
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[60] flex flex-col" style={{ background: '#030b18' }}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-white/8 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <Presentation className="h-4 w-4 text-cyber-cyan shrink-0" />
          <span className="text-sm font-semibold text-white truncate max-w-xs">{meta?.title || 'Presentation'}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-slate-500 font-mono tabular-nums">{current + 1}&thinsp;/&thinsp;{slides.length}</span>
          <button onClick={() => downloadSlidesAsPDF(slides, meta)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-white/10 bg-white/5 hover:bg-white/10 text-white transition-colors">
            <FileDown className="h-3.5 w-3.5" /><span className="hidden sm:inline">Download PDF</span>
          </button>
          <button onClick={onClose} className="h-8 w-8 rounded-lg flex items-center justify-center border border-white/10 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
      {/* Progress */}
      <div className="h-0.5 bg-white/5 shrink-0">
        <motion.div className="h-full" style={{ background: `linear-gradient(90deg,${slide.color},#8B5CF6)` }}
          animate={{ width: `${progress}%` }} transition={{ type: 'spring', stiffness: 180, damping: 28 }} />
      </div>
      {/* Slide area */}
      <div className="flex-1 relative overflow-hidden">
        <motion.div key={slide.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}
          className="absolute inset-0 pointer-events-none"
          style={{ background: `radial-gradient(ellipse 65% 55% at 50% 50%,${hex2rgba(slide.color, 0.05)} 0%,transparent 70%)` }} />
        <AnimatePresence custom={dir} mode="wait">
          <motion.div key={current} custom={dir} variants={slideVariants} initial="enter" animate="center" exit="exit"
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="absolute inset-0 flex items-center justify-center px-6 sm:px-12 py-8">
            <div className="w-full max-w-4xl"><SlideContent slide={slide} /></div>
          </motion.div>
        </AnimatePresence>
      </div>
      {/* Nav */}
      <div className="flex items-center justify-center gap-4 py-4 border-t border-white/8 shrink-0">
        <button onClick={prev} disabled={current === 0} className="h-9 w-9 rounded-xl flex items-center justify-center border border-white/10 text-slate-400 hover:text-white hover:border-white/20 transition-all disabled:opacity-25 disabled:cursor-not-allowed">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="flex gap-1.5 items-center">
          {slides.map((s, i) => (
            <motion.button key={i} onClick={() => go(i)}
              animate={{ width: i === current ? 24 : 8, background: i === current ? s.color : 'rgba(255,255,255,0.15)' }}
              transition={{ type: 'spring', stiffness: 400, damping: 28 }}
              className="h-2 rounded-full cursor-pointer" />
          ))}
        </div>
        <button onClick={next} disabled={current === slides.length - 1} className="h-9 w-9 rounded-xl flex items-center justify-center border border-white/10 text-slate-400 hover:text-white hover:border-white/20 transition-all disabled:opacity-25 disabled:cursor-not-allowed">
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </motion.div>
  )
}

// ── Analyst report ────────────────────────────────────────────────────────────

function AnalystReport({ structured, accent, security }) {
  const { pros, cons, score, verdict, signals, breakdown } = computeReport(structured, security)
  const scoreColor = score >= 75 ? '#10FFA8' : score >= 52 ? '#00D4FF' : score >= 36 ? '#F59E0B' : '#FF4D6D'
  const balance = score / 100
  const [showBreakdown, setShowBreakdown]       = useState(false)
  const [showPresentation, setShowPresentation] = useState(false)
  const slides = buildSlides(structured, null)

  return (
    <>
    <motion.div
      className="rounded-2xl p-5 mb-5"
      style={{
        background: 'linear-gradient(135deg, rgba(0,212,255,0.06) 0%, rgba(10,22,40,0.92) 55%, rgba(139,92,246,0.05) 100%)',
        border: `1px solid rgba(0,212,255,0.22)`,
        boxShadow: '0 0 40px rgba(0,212,255,0.06)',
      }}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Header row */}
      <div className="flex items-start gap-4 mb-4">
        <ScoreRing score={score} />
        <div className="flex-1 min-w-0 pt-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[9px] font-bold uppercase tracking-widest text-cyber-cyan">
              Intelligence Report
            </span>
            <span
              className="rounded-full px-2 py-0.5 text-[8px] font-semibold"
              style={{ backgroundColor: `${scoreColor}18`, color: scoreColor, border: `1px solid ${scoreColor}40` }}
            >
              {score >= 78 ? 'Strong' : score >= 60 ? 'Solid' : score >= 42 ? 'Mixed' : 'At Risk'}
            </span>
            <button
              onClick={() => setShowPresentation(true)}
              title="View as Presentation Slides"
              className="ml-auto flex items-center gap-1 h-6 px-2 rounded-lg text-[10px] font-semibold border transition-all hover:scale-105 active:scale-95"
              style={{
                borderColor: 'rgba(139,92,246,0.45)',
                background: 'rgba(139,92,246,0.12)',
                color: '#c4b5fd',
                boxShadow: '0 0 10px rgba(139,92,246,0.15)',
              }}
            >
              <Presentation className="h-3 w-3" />
              <span>Slides</span>
            </button>
            <button
              onClick={() => setShowBreakdown(true)}
              title="View score methodology"
              className="flex items-center gap-1 h-6 px-2 rounded-lg text-[10px] font-semibold border transition-all hover:scale-105 active:scale-95"
              style={{
                borderColor: 'rgba(0,212,255,0.35)',
                background: 'rgba(0,212,255,0.08)',
                color: '#67e8f9',
                boxShadow: '0 0 8px rgba(0,212,255,0.1)',
              }}
            >
              <ClipboardList className="h-3 w-3" />
              <span>Score Methodology</span>
            </button>
          </div>
          <p className="text-[11px] text-slate-400 leading-5 italic">"{verdict}"</p>
        </div>
      </div>

      {/* Signal balance bar — width = score/100, not pros:cons ratio */}
      <div className="mb-4">
          <div className="flex justify-between text-[9px] text-cyber-muted mb-1.5">
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-cyber-green inline-block" />
              {pros.length} strength{pros.length !== 1 ? 's' : ''}
            </span>
            <span className="tracking-wide">Signal Balance</span>
            <span className="flex items-center gap-1.5">
              {cons.length} risk{cons.length !== 1 ? 's' : ''}
              <span className="h-1.5 w-1.5 rounded-full bg-red-400 inline-block" />
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{
                background: balance > 0.65
                  ? 'linear-gradient(90deg, #10FFA8, #00D4FF)'
                  : balance > 0.4
                  ? 'linear-gradient(90deg, #10FFA8, #00D4FF, #F59E0B)'
                  : 'linear-gradient(90deg, #10FFA8 30%, #F59E0B 60%, #FF4D6D)',
                width: `${balance * 100}%`,
              }}
              initial={{ width: 0 }}
              animate={{ width: `${balance * 100}%` }}
              transition={{ duration: 1.1, delay: 0.5, ease: 'easeOut' }}
            />
          </div>
        </div>

      {/* Key signals */}
      {signals.length > 0 && (
        <div className="space-y-1.5 pt-1 border-t border-white/5">
          {signals.map((s, i) => (
            <motion.div
              key={i}
              className="flex items-baseline gap-2.5 text-xs"
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 + i * 0.08 }}
            >
              <span className="shrink-0 text-[9px] uppercase tracking-wider text-cyber-muted w-24">{s.label}</span>
              <span className="text-slate-300 leading-5 line-clamp-2">{s.value}</span>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>

    <AnimatePresence>
      {showBreakdown && (
        <ScoreBreakdownModal
          breakdown={breakdown}
          totalScore={score}
          onClose={() => setShowBreakdown(false)}
        />
      )}
    </AnimatePresence>

    <AnimatePresence>
      {showPresentation && slides.length > 0 && (
        <PresentationModal
          slides={slides}
          meta={null}
          onClose={() => setShowPresentation(false)}
        />
      )}
    </AnimatePresence>
    </>
  )
}

// ── Detail modal ──────────────────────────────────────────────────────────
function InsightDetailModal({ block, color, onClose }) {
  const meta  = CARD_META[block.title] || { Icon: Sparkles }
  const { Icon } = meta
  const pros    = (block.items || []).filter((i) => i.startsWith('Pro:'))
  const cons    = (block.items || []).filter((i) => i.startsWith('Con:'))
  const regular = (block.items || []).filter((i) => !i.startsWith('Pro:') && !i.startsWith('Con:'))
  const hasPCons = pros.length > 0 || cons.length > 0

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      style={{ background: 'rgba(3,11,24,0.88)', backdropFilter: 'blur(14px)' }}
    >
      <motion.div
        className="relative w-full max-w-lg rounded-3xl overflow-hidden"
        initial={{ scale: 0.88, y: 24, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.92, y: 12, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 380, damping: 28 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'rgba(10,22,40,0.97)',
          border: `1px solid ${hex2rgba(color, 0.3)}`,
          boxShadow: `0 0 70px ${hex2rgba(color, 0.12)}, 0 28px 80px rgba(0,0,0,0.75)`,
        }}
      >
        {/* Hero header */}
        <div
          className="px-5 sm:px-7 pt-5 sm:pt-7 pb-4 sm:pb-5"
          style={{ background: `linear-gradient(135deg, ${hex2rgba(color, 0.13)} 0%, transparent 100%)` }}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div
                className="h-14 w-14 rounded-2xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: hex2rgba(color, 0.14), border: `1px solid ${hex2rgba(color, 0.3)}` }}
              >
                <Icon className="h-7 w-7" style={{ color }} />
              </div>
              <div>
                <h2 className="font-heading font-bold text-[1.2rem] text-white leading-tight">{block.title}</h2>
                <p className="text-[11px] text-cyber-muted mt-1">
                  {block.items?.length} signal{block.items?.length !== 1 ? 's' : ''} identified
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="shrink-0 h-8 w-8 rounded-xl flex items-center justify-center text-cyber-muted hover:text-white hover:bg-white/10 transition-all mt-0.5"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px mx-5 sm:mx-7" style={{ background: `linear-gradient(90deg, ${hex2rgba(color, 0.3)}, transparent)` }} />

        {/* Items */}
        <div className="px-5 sm:px-7 py-4 sm:py-5 space-y-2 max-h-[50vh] sm:max-h-[58vh] overflow-y-auto">
          {hasPCons ? (
            <>
              {pros.map((item, i) => (
                <motion.div
                  key={`p${i}`}
                  className="flex gap-3 items-start rounded-xl px-4 py-3"
                  style={{ background: 'rgba(16,255,168,0.05)', border: '1px solid rgba(16,255,168,0.2)' }}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                >
                  <span className="text-cyber-green font-bold text-base mt-0.5 shrink-0 leading-none">✓</span>
                  <span className="text-slate-200 text-sm leading-6">{item.replace(/^Pro:\s*/, '')}</span>
                </motion.div>
              ))}
              {cons.map((item, i) => (
                <motion.div
                  key={`c${i}`}
                  className="flex gap-3 items-start rounded-xl px-4 py-3"
                  style={{ background: 'rgba(255,77,109,0.05)', border: '1px solid rgba(255,77,109,0.2)' }}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: (pros.length + i) * 0.06 }}
                >
                  <span className="text-red-400 font-bold text-base mt-0.5 shrink-0 leading-none">✗</span>
                  <span className="text-slate-200 text-sm leading-6">{item.replace(/^Con:\s*/, '')}</span>
                </motion.div>
              ))}
            </>
          ) : (
            regular.map((item, i) => (
              <motion.div
                key={i}
                className="flex gap-3 items-start rounded-xl px-4 py-3"
                style={{ background: hex2rgba(color, 0.04), border: `1px solid ${hex2rgba(color, 0.15)}` }}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
              >
                <span
                  className="shrink-0 mt-2.5 h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: color, opacity: 0.8 }}
                />
                <span className="text-slate-200 text-sm leading-6">{item}</span>
              </motion.div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-5 sm:px-7 pb-5 pt-1">
          <p className="text-[10px] text-cyber-muted text-center tracking-wide">
            Press Esc or click outside to close
          </p>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ── Insight card (clickable) ──────────────────────────────────────────────
function InsightCard({ block, accent, idx, onClick }) {
  const meta  = CARD_META[block.title] || { Icon: Sparkles, defaultColor: '#00D4FF' }
  const { Icon } = meta
  const color = cardColor(idx, accent)

  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-2xl p-5 space-y-3.5 transition-all duration-200 hover:-translate-y-0.5 animate-slide-up group cursor-pointer"
      style={{
        background: `linear-gradient(135deg, ${hex2rgba(color, 0.05)} 0%, rgba(10,22,40,0.8) 100%)`,
        border: `1px solid ${hex2rgba(color, 0.18)}`,
      }}
    >
      <div className="flex items-center gap-3">
        <div
          className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: hex2rgba(color, 0.12), border: `1px solid ${hex2rgba(color, 0.25)}` }}
        >
          <Icon className="h-4 w-4" style={{ color }} />
        </div>
        <h3 className="font-heading font-semibold text-sm flex-1 text-left" style={{ color }}>{block.title}</h3>
        <ChevronRight
          className="h-3.5 w-3.5 shrink-0 transition-all duration-200 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5"
          style={{ color }}
        />
      </div>

      <ul className="space-y-1.5">
        {(block.items || []).slice(0, 3).map((item, i) => {
          const isPro = item.startsWith('Pro:')
          const isCon = item.startsWith('Con:')
          const displayText = (isPro || isCon) ? item.replace(/^(Pro:|Con:)\s*/, '') : item
          const dotColor = isPro ? '#10FFA8' : isCon ? '#FF4D6D' : color

          return (
            <li
              key={i}
              className="flex gap-2.5 items-start rounded-xl px-3 py-2 text-sm leading-6"
              style={{
                background: isPro ? 'rgba(16,255,168,0.04)' : isCon ? 'rgba(255,77,109,0.04)' : 'rgba(255,255,255,0.02)',
                border: isPro ? '1px solid rgba(16,255,168,0.14)' : isCon ? '1px solid rgba(255,77,109,0.14)' : '1px solid rgba(255,255,255,0.05)',
              }}
            >
              {(isPro || isCon) ? (
                <span className="shrink-0 mt-1.5 text-[10px] font-bold" style={{ color: dotColor }}>
                  {isPro ? '✓' : '✗'}
                </span>
              ) : (
                <span className="shrink-0 mt-2.5 h-1.5 w-1.5 rounded-full" style={{ backgroundColor: dotColor, opacity: 0.7 }} />
              )}
              <span className="text-slate-300 line-clamp-2">{displayText}</span>
            </li>
          )
        })}
        {block.items?.length > 3 && (
          <li className="text-[10px] text-cyber-muted px-3 pt-0.5 group-hover:text-slate-400 transition-colors">
            +{block.items.length - 3} more — click to expand
          </li>
        )}
      </ul>
    </button>
  )
}

// ── Hero banner (og:image / description) ─────────────────────────────────
function HeroBanner({ siteTheme }) {
  const { og_image, site_name, description, accent, favicon } = siteTheme || {}
  if (!og_image && !description) return null

  return (
    <div
      className="rounded-2xl overflow-hidden mb-4 animate-fade-in"
      style={{
        background: og_image
          ? `linear-gradient(to bottom, rgba(3,11,24,0.3) 0%, rgba(3,11,24,0.9) 100%), url(${og_image})`
          : `linear-gradient(135deg, ${hex2rgba(accent || '#00D4FF', 0.12)} 0%, rgba(10,22,40,0.9) 100%)`,
        backgroundSize: 'cover',
        backgroundPosition: 'center top',
        border: `1px solid ${hex2rgba(accent || '#00D4FF', 0.2)}`,
      }}
    >
      <div className="px-5 py-5">
        <div className="flex items-center gap-2.5 mb-2">
          {favicon && <img src={favicon} alt="" className="h-6 w-6 rounded" onError={(e) => e.target.style.display = 'none'} />}
          {site_name && <span className="text-sm font-heading font-bold text-white">{site_name}</span>}
        </div>
        {description && <p className="text-xs text-slate-300 leading-6 line-clamp-3">{description}</p>}
      </div>
    </div>
  )
}

// ── Main export ───────────────────────────────────────────────────────────
export default function InsightPanel({ insights, loading, siteTheme }) {
  const accent = siteTheme?.accent
  const security = insights?.security || null
  const [selected, setSelected] = useState(null)
  const [selectedIdx, setSelectedIdx] = useState(0)

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2.5 pb-1">
          <Loader2 className="h-3.5 w-3.5 text-cyber-cyan animate-spin shrink-0" />
          <div className="flex-1 h-1 rounded-full bg-cyber-cyan/10 overflow-hidden">
            <div className="h-full bg-cyber-cyan/50 rounded-full animate-progress-indeterminate" />
          </div>
          <span className="text-[10px] text-cyber-muted shrink-0">Generating insights…</span>
        </div>
        {siteTheme && <HeroBanner siteTheme={siteTheme} />}
        {/* Analyst report skeleton */}
        <div className="glass rounded-2xl p-5 mb-5 space-y-3">
          <div className="flex items-start gap-4">
            <div className="shimmer h-[76px] w-[76px] rounded-full shrink-0" />
            <div className="flex-1 space-y-2 pt-2">
              <div className="shimmer h-3 w-32 rounded-lg" />
              <div className="shimmer h-3 w-full rounded-lg" />
              <div className="shimmer h-3 w-3/4 rounded-lg" />
            </div>
          </div>
          <div className="shimmer h-1.5 rounded-full w-full" />
        </div>
        <div className="columns-1 md:columns-2 gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="break-inside-avoid mb-3 glass rounded-2xl p-5 space-y-3">
              <div className="flex items-center gap-3">
                <div className="shimmer h-9 w-9 rounded-xl" />
                <div className="shimmer h-4 w-28 rounded-lg" />
              </div>
              {[1, 2, 3].map((j) => <div key={j} className="shimmer h-10 rounded-xl" />)}
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!insights?.structured?.length) {
    return (
      <div className="glass rounded-2xl p-8 flex flex-col items-center gap-3 text-center">
        <Sparkles className="h-8 w-8 text-cyber-cyan/40" />
        <p className="text-cyber-muted text-sm">No insights yet. Process a URL to generate analysis.</p>
      </div>
    )
  }

  return (
    <div className="space-y-0">
      {siteTheme && <HeroBanner siteTheme={siteTheme} />}

      <AnalystReport structured={insights.structured} accent={accent} security={security} />

      <div className="columns-1 md:columns-2 gap-3">
        {[...insights.structured]
          .filter((block) => !isNoSource(block))
          .sort((a, b) => {
            const ai = CARD_ORDER.indexOf(a.title)
            const bi = CARD_ORDER.indexOf(b.title)
            return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi)
          })
          .map((block, idx) => (
            <div key={block.title} className="break-inside-avoid mb-3">
              <InsightCard
                block={block}
                accent={accent}
                idx={idx}
                onClick={() => { setSelected(block); setSelectedIdx(idx) }}
              />
            </div>
          ))}
      </div>

      <AnimatePresence>
        {selected && (
          <InsightDetailModal
            block={selected}
            color={cardColor(selectedIdx, accent)}
            onClose={() => setSelected(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
