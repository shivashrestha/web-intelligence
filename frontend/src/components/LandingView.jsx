import { useState, useRef } from 'react'
import { motion, AnimatePresence, useInView } from 'framer-motion'
import {
  ArrowRight, Zap, Search, Cpu, MessageSquare,
  CheckCircle, BarChart3, ImageDown,
  FileText, Trophy, MonitorPlay, Users, Briefcase,
  Eye, ScanSearch, Download, ExternalLink,
} from 'lucide-react'

const C = {
  cyan:   '#00D4FF',
  purple: '#8B5CF6',
  green:  '#10FFA8',
  amber:  '#F59E0B',
  pink:   '#EC4899',
}

const fadeUp = (delay = 0) => ({
  hidden:  { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.16, 1, 0.3, 1], delay } },
})

function ScrollReveal({ children, delay = 0, className = '' }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  return (
    <motion.div ref={ref} className={className}
      variants={fadeUp(delay)} initial="hidden" animate={inView ? 'visible' : 'hidden'}>
      {children}
    </motion.div>
  )
}

function SectionDivider({ label, color = 'rgba(0,212,255,0.2)' }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true })
  return (
    <motion.div ref={ref} className="w-full flex items-center gap-3"
      initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}} transition={{ duration: 0.4 }}>
      <div className="flex-1 h-px" style={{ background: `linear-gradient(to right, transparent, ${color})` }} />
      {label && <span className="text-[10px] font-semibold tracking-widest uppercase shrink-0" style={{ color }}>{label}</span>}
      <div className="flex-1 h-px" style={{ background: `linear-gradient(to left, transparent, ${color})` }} />
    </motion.div>
  )
}

// ── Animated Globe ────────────────────────────────────────────────────────
function AnimatedGlobe({ logo }) {
  return (
    <div className="relative flex items-center justify-center">
      {[
        { size: 130, color: C.cyan,   opacity: 0.18, dur: 3.2, delay: 0   },
        { size: 130, color: C.purple, opacity: 0.15, dur: 3.2, delay: 1.6 },
      ].map((r, i) => (
        <motion.div key={i} className="absolute rounded-full"
          style={{ width: r.size, height: r.size, border: `1px solid ${r.color}`, opacity: r.opacity }}
          animate={{ scale: [1, 1.7, 1], opacity: [r.opacity, 0, r.opacity] }}
          transition={{ duration: r.dur, repeat: Infinity, ease: 'easeInOut', delay: r.delay }} />
      ))}
      {[
        { w: 120, h: 36, color: C.cyan,   dir:  1, dur:  9 },
        { w: 115, h: 28, color: C.purple, dir: -1, dur: 13, rotate: '45deg' },
      ].map((ring, i) => (
        <motion.div key={i} className="absolute"
          style={{ width: ring.w, height: ring.h, borderRadius: '50%', border: `1px solid ${ring.color}33`, rotate: ring.rotate }}
          animate={{ rotateZ: [0, ring.dir * 360] }}
          transition={{ duration: ring.dur, repeat: Infinity, ease: 'linear' }} />
      ))}
      <motion.div className="absolute" style={{ width: 120, height: 36 }}
        animate={{ rotateZ: [0, 360] }} transition={{ duration: 9, repeat: Infinity, ease: 'linear' }}>
        <div style={{ position: 'absolute', top: -3, left: '50%', width: 6, height: 6, borderRadius: '50%', background: C.cyan, boxShadow: `0 0 6px ${C.cyan}`, transform: 'translateX(-50%)' }} />
      </motion.div>
      <motion.div animate={{ y: [0, -7, 0] }} transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }} style={{ zIndex: 1, position: 'relative' }}>
        <motion.div className="absolute inset-0 rounded-3xl" animate={{ opacity: [0.5, 0.9, 0.5] }} transition={{ duration: 2.5, repeat: Infinity }}
          style={{ background: `linear-gradient(135deg, ${C.cyan}4d 0%, ${C.purple}4d 100%)`, filter: 'blur(14px)', transform: 'scale(1.2)' }} />
        <div className="relative h-20 w-20 rounded-3xl flex items-center justify-center"
          style={{ background: `linear-gradient(135deg, ${C.cyan} 0%, ${C.purple} 100%)`, boxShadow: `0 0 20px ${C.cyan}59, 0 0 60px ${C.cyan}1a` }}>
          <motion.div animate={{ rotate: [0, 360] }} transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}>
            {logo ? <img src={logo} alt="Web Intelligence" className="h-15 w-15 object-contain" /> : <ScanSearch className="h-10 w-10 text-white" />}
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}

// ── Stats ─────────────────────────────────────────────────────────────────
const STATS = [
  { value: '6',    label: 'analysis modules',   color: C.purple },
  { value: 'PDF',  label: 'slide export',       color: C.green  },
  { value: '95pt', label: 'intelligence score', color: C.amber  },
]

// ── Module preview components ─────────────────────────────────────────────

function InsightsPreview({ active }) {
  const items = [
    { label: 'Target Market', val: 'B2B · SaaS',      color: C.cyan   },
    { label: 'Pricing',       val: 'Freemium · $29',  color: C.purple },
    { label: 'Core Strength', val: 'AI automation',   color: C.green  },
    { label: 'Risk Signal',   val: 'Low · Series A',  color: C.amber  },
  ]
  const LOOP = 3.5
  return (
    <div className="flex flex-col gap-1.5 h-full justify-center">
      {items.map((it, i) => (
        <motion.div key={i} className="flex items-center gap-2 rounded-lg px-2.5 py-1.5"
          style={{ background: `${it.color}0c`, border: `1px solid ${it.color}28` }}
          initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.3, duration: 0.28, repeat: Infinity, repeatDelay: LOOP - i * 0.3 }}>
          <div className="h-2 w-2 rounded-full shrink-0" style={{ background: it.color }} />
          <span className="text-[10px] font-semibold" style={{ color: `${it.color}dd` }}>{it.label}</span>
          <span className="text-[10px] text-slate-500 ml-auto">{it.val}</span>
        </motion.div>
      ))}
    </div>
  )
}

function ScorePreview({ active }) {
  const score = 66
  const max = 95
  const pct = score / max
  const bars = [
    { label: 'Security',   val: 12, max: 27, color: C.cyan   },
    { label: 'Value',      val: 12, max: 18, color: C.purple },
    { label: 'Content',    val: 12, max: 12, color: C.green  },
  ]
  const circum = 2 * Math.PI * 28
  return (
    <div className="flex items-center gap-4 h-full">
      {/* Ring */}
      <div className="relative shrink-0 flex items-center justify-center" style={{ width: 72, height: 72 }}>
        <svg width="72" height="72" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="36" cy="36" r="28" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
          <motion.circle cx="36" cy="36" r="28" fill="none" stroke={C.amber} strokeWidth="5"
            strokeLinecap="round" strokeDasharray={circum}
            initial={{ strokeDashoffset: circum }}
            animate={{ strokeDashoffset: circum * (1 - pct) }}
            transition={{ duration: 1.4, ease: 'easeOut', repeat: Infinity, repeatDelay: 2.5 }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span className="text-[17px] font-bold font-mono" style={{ color: C.amber }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8, repeat: Infinity, repeatDelay: 3.1 }}>{score}</motion.span>
          <span className="text-[8px] text-slate-500">/ {max}</span>
        </div>
      </div>
      {/* Bars */}
      <div className="flex flex-col gap-2 flex-1">
        {bars.map((b, i) => (
          <div key={i} className="flex flex-col gap-0.5">
            <div className="flex justify-between">
              <span className="text-[9px] text-slate-500">{b.label}</span>
              <span className="text-[9px] font-mono" style={{ color: b.color }}>+{b.val}</span>
            </div>
            <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
              <motion.div className="h-full rounded-full" style={{ background: b.color }}
                initial={{ width: 0 }} animate={{ width: `${(b.val / b.max) * 100}%` }}
                transition={{ delay: 0.5 + i * 0.2, duration: 0.7, ease: 'easeOut', repeat: Infinity, repeatDelay: 2.8 }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function SlidePreview({ active }) {
  const slides = ['Introduction', 'Key Features', 'Pricing Model', 'Security Posture']
  const [idx, setIdx] = useState(0)
  return (
    <div className="h-full flex flex-col gap-2">
      <div className="flex items-center justify-between mb-0.5">
        <div className="flex items-center gap-1.5">
          <div className="h-1.5 w-1.5 rounded-full" style={{ background: C.purple }} />
          <span className="text-[9px] font-mono" style={{ color: `${C.purple}aa` }}>Presentation</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[8px] text-slate-500 font-mono">{idx + 1} / 9</span>
          <div className="flex items-center gap-1 rounded px-1.5 py-0.5" style={{ background: `${C.purple}18`, border: `1px solid ${C.purple}35` }}>
            <Download className="h-2.5 w-2.5" style={{ color: C.purple }} />
            <span className="text-[8px]" style={{ color: C.purple }}>PDF</span>
          </div>
        </div>
      </div>
      {/* Slide frame */}
      <div className="flex-1 rounded-lg relative overflow-hidden"
        style={{ background: 'rgba(3,11,24,0.9)', border: `1px solid ${C.purple}30` }}>
        <AnimatePresence mode="wait">
          <motion.div key={idx} className="absolute inset-0 p-3 flex flex-col gap-1.5"
            initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.28 }}>
            <div className="h-1 w-8 rounded-full" style={{ background: C.purple }} />
            <p className="text-[11px] font-semibold text-white">{slides[idx % slides.length]}</p>
            {[60, 80, 50].map((w, j) => (
              <motion.div key={j} className="h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.07)', width: `${w}%` }}
                initial={{ scaleX: 0, originX: 0 }} animate={{ scaleX: 1 }}
                transition={{ delay: j * 0.1 + 0.15, duration: 0.3 }} />
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
      {/* Dot nav auto-advances */}
      <motion.div className="flex gap-1 justify-center"
        onAnimationComplete={() => setIdx(i => (i + 1) % 4)}
        animate={{ opacity: 1 }}
        transition={{ duration: 2.2, repeat: Infinity, repeatDelay: 0 }}
        onUpdate={() => {}}>
        {[0,1,2,3].map(d => (
          <motion.div key={d} className="h-1 rounded-full transition-all duration-300"
            style={{ width: d === idx % 4 ? 14 : 4, background: d === idx % 4 ? C.purple : 'rgba(255,255,255,0.15)' }} />
        ))}
      </motion.div>
    </div>
  )
}

function QAPreview({ active }) {
  const exchanges = [
    { q: 'What is the pricing model?', a: 'Freemium — starts at $29/mo. Enterprise tier available.' },
    { q: 'Who is the target market?', a: 'B2B SaaS companies, primarily Series A–B.' },
  ]
  const [step, setStep] = useState(0)
  const LOOP = 4.5
  return (
    <div className="h-full flex flex-col gap-2 justify-end">
      {/* User bubble */}
      <motion.div className="self-end rounded-xl rounded-br-sm px-3 py-1.5 max-w-[85%]"
        style={{ background: `${C.green}18`, border: `1px solid ${C.green}30` }}
        initial={{ opacity: 0, y: 6, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.3, repeat: Infinity, repeatDelay: LOOP }}>
        <p className="text-[10px] text-white">{exchanges[step % 2].q}</p>
      </motion.div>
      {/* Typing */}
      <motion.div className="flex items-center gap-1 px-2"
        initial={{ opacity: 0 }} animate={{ opacity: [0,1,0] }}
        transition={{ delay: 0.6, duration: 1.2, repeat: Infinity, repeatDelay: LOOP - 1.2 }}>
        {[0,1,2].map(d => (
          <motion.div key={d} className="h-1.5 w-1.5 rounded-full" style={{ background: `${C.green}80` }}
            animate={{ y: [0,-3,0] }} transition={{ delay: d*0.15, duration: 0.5, repeat: Infinity }} />
        ))}
        <span className="text-[8px] text-slate-600 ml-1">AI thinking…</span>
      </motion.div>
      {/* AI reply */}
      <motion.div className="self-start rounded-xl rounded-bl-sm px-3 py-1.5 max-w-[90%]"
        style={{ background: 'rgba(10,22,40,0.9)', border: `1px solid ${C.green}25` }}
        initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.5, duration: 0.3, repeat: Infinity, repeatDelay: LOOP - 1.5 }}>
        <p className="text-[10px] text-slate-300">{exchanges[step % 2].a}</p>
        <div className="flex items-center gap-1 mt-1">
          <ExternalLink className="h-2.5 w-2.5" style={{ color: `${C.green}80` }} />
          <span className="text-[8px]" style={{ color: `${C.green}80` }}>source: /pricing</span>
        </div>
      </motion.div>
    </div>
  )
}

function MediaPreview({ active }) {
  const colors = [
    [`${C.pink}30`,`${C.pink}50`], [`${C.purple}30`,`${C.purple}50`], [`${C.cyan}30`,`${C.cyan}50`],
    [`${C.amber}30`,`${C.amber}50`], [`${C.pink}25`,`${C.pink}45`], [`${C.green}25`,`${C.green}45`],
  ]
  return (
    <div className="h-full flex flex-col gap-1.5">
      <div className="flex items-center justify-between mb-0.5">
        <span className="text-[9px]" style={{ color: `${C.pink}aa` }}>72 images found</span>
        <div className="flex gap-1">
          {['jpg','png','svg','webp'].map(ext => (
            <span key={ext} className="text-[7px] font-mono px-1 rounded" style={{ background: `${C.pink}15`, color: `${C.pink}cc` }}>{ext}</span>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-1 flex-1">
        {colors.map(([bg, border], i) => (
          <motion.div key={i} className="rounded-md flex items-center justify-center relative overflow-hidden"
            style={{ background: bg, border: `1px solid ${border}` }}
            initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.12 + 0.1, type: 'spring', stiffness: 300, damping: 20, repeat: Infinity, repeatDelay: 2.5 }}>
            <div className="absolute inset-1 rounded" style={{ background: 'rgba(255,255,255,0.04)' }} />
            <ImageDown className="h-3 w-3 opacity-40" style={{ color: C.pink }} />
          </motion.div>
        ))}
      </div>
    </div>
  )
}

function SourcesPreview({ active }) {
  const srcs = [
    { url: '/home',        words: '847 words',  badge: 'main'  },
    { url: '/pricing',     words: '312 words',  badge: 'key'   },
    { url: '/blog/post-1', words: '1,204 words', badge: null   },
    { url: '/contact',     words: '98 words',   badge: null    },
  ]
  const LOOP = 3.8
  return (
    <div className="h-full flex flex-col gap-1.5 justify-center">
      {srcs.map((s, i) => (
        <motion.div key={i} className="flex items-center gap-2 rounded-lg px-2.5 py-1.5"
          style={{ background: 'rgba(10,22,40,0.7)', border: `1px solid ${C.cyan}18` }}
          initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.22, duration: 0.25, repeat: Infinity, repeatDelay: LOOP - i * 0.22 }}>
          <div className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: C.cyan, opacity: 0.6 }} />
          <span className="text-[9px] font-mono flex-1 truncate" style={{ color: `${C.cyan}cc` }}>{s.url}</span>
          {s.badge && <span className="text-[7px] px-1 rounded shrink-0" style={{ background: `${C.green}20`, color: C.green }}>{s.badge}</span>}
          <span className="text-[8px] text-slate-600 shrink-0">{s.words}</span>
        </motion.div>
      ))}
    </div>
  )
}

// ── Feature cards ─────────────────────────────────────────────────────────
const FEATURES = [
  {
    Icon: BarChart3, label: 'Site Analysis & Insights', tag: 'Core', color: C.cyan,
    desc: 'AI-generated intelligence report covering target market, pricing model, value props, risk signals, and competitive positioning.',
    Preview: InsightsPreview,
  },
  {
    Icon: Trophy, label: 'Intelligence Score', tag: 'Scoring', color: C.amber,
    desc: 'Composite score out of 95 — weighted across security posture (HTTPS, CSP, headers), content quality, and value signals.',
    Preview: ScorePreview,
  },
  {
    Icon: MonitorPlay, label: 'Slide Presentation', tag: 'Export', color: C.purple, badge: 'PDF',
    desc: 'Auto-generated 9-slide deck summarising the site. Navigate slides in-browser and export as a downloadable PDF.',
    Preview: SlidePreview,
  },
  {
    Icon: MessageSquare, label: 'Q&A Chat', tag: 'RAG', color: C.green,
    desc: 'Ask anything about the site in natural language. Every answer cites the exact source page — no hallucination.',
    Preview: QAPreview,
  },
  {
    Icon: ImageDown, label: 'Media Extraction', tag: 'Media', color: C.pink,
    desc: 'All images scraped across every crawled page, displayed in a browsable gallery with filenames and dimensions.',
    Preview: MediaPreview,
  },
  {
    Icon: FileText, label: 'Sources Index', tag: 'Sources', color: C.cyan,
    desc: 'Full list of extracted source pages with content snippets, word counts, and direct links back to each URL.',
    Preview: SourcesPreview,
  },
]

function FeatureCard({ feature, index }) {
  const { Icon, label, desc, color, tag, badge, Preview } = feature
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })
  const [hovered, setHovered] = useState(false)

  return (
    <motion.div ref={ref}
      variants={fadeUp(index * 0.08)} initial="hidden" animate={inView ? 'visible' : 'hidden'}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      whileHover={{ y: -5 }}
      className="relative rounded-2xl flex flex-col overflow-hidden cursor-default"
      style={{
        background: `linear-gradient(160deg, ${color}0f 0%, rgba(8,16,32,0.7) 100%)`,
        border: `1px solid ${color}2a`,
        transition: 'box-shadow 0.25s ease',
        boxShadow: hovered ? `0 0 40px ${color}20, 0 12px 40px rgba(0,0,0,0.5)` : `0 0 12px ${color}08`,
      }}>

      {/* Animated border glow on hover */}
      <motion.div className="absolute inset-0 rounded-2xl pointer-events-none"
        animate={{ opacity: hovered ? 1 : 0 }}
        transition={{ duration: 0.25 }}
        style={{ boxShadow: `inset 0 0 0 1px ${color}50` }} />

      {/* Top section: icon + tag + text */}
      <div className="p-5 pb-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <motion.div className="h-11 w-11 rounded-xl flex items-center justify-center"
            style={{ background: `${color}18`, border: `1px solid ${color}35` }}
            animate={{ boxShadow: hovered ? `0 0 16px ${color}40` : '0 0 0px transparent' }}
            transition={{ duration: 0.3 }}>
            <motion.div animate={hovered ? { scale: 1.2, rotate: [0, -8, 8, 0] } : { scale: [1, 1.1, 1] }}
              transition={hovered ? { duration: 0.35 } : { duration: 3, repeat: Infinity }}>
              <Icon className="h-5 w-5" style={{ color }} />
            </motion.div>
          </motion.div>

          <div className="flex items-center gap-1.5">
            {badge && (
              <span className="flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold"
                style={{ background: `${color}20`, color, border: `1px solid ${color}40` }}>
                <Download className="h-2.5 w-2.5" />{badge}
              </span>
            )}
            <span className="rounded-full px-2.5 py-1 text-[10px] font-semibold tracking-wider uppercase"
              style={{ background: `${color}15`, color: `${color}cc`, border: `1px solid ${color}25` }}>{tag}</span>
          </div>
        </div>

        <div>
          <h3 className="font-heading font-bold text-[17px] text-white mb-2 leading-tight">{label}</h3>
          <p className="text-[13px] text-slate-400 leading-relaxed">{desc}</p>
        </div>
      </div>

      {/* Divider */}
      <div className="mx-5 h-px" style={{ background: `linear-gradient(to right, transparent, ${color}30, transparent)` }} />

      {/* Preview area */}
      <div className="p-4" style={{ height: 148 }}>
        <Preview active={hovered} />
      </div>

      {/* Bottom accent pulse */}
      <motion.div className="absolute bottom-0 left-6 right-6 h-px"
        style={{ background: `linear-gradient(to right, transparent, ${color}55, transparent)` }}
        animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 2.5 + index * 0.3, repeat: Infinity }} />
    </motion.div>
  )
}

// ── How it works ──────────────────────────────────────────────────────────
const HOW_STEPS = [
  {
    num: '01', title: 'Enter a URL', Icon: Search, color: C.cyan,
    desc: 'Paste any public website. BFS crawler traverses pages at depth 3, extracting only meaningful content.',
    detail: 'BeautifulSoup · requests · depth-3 BFS',
    preview: ['/home', '/about', '/pricing', '/blog/post-1', '/contact'],
  },
  {
    num: '02', title: 'AI Indexes & Analyses', Icon: Cpu, color: C.purple,
    desc: 'Text chunked, embedded with MiniLM-L6. FAISS index built. AI generates insights, score, and slide deck.',
    detail: 'MiniLM-L6 · FAISS · GPT-4o · 384-dim',
    preview: ['Indexing 847 chunks…', 'Computing intelligence score…', 'Generating 9-slide deck…'],
  },
  {
    num: '03', title: 'Explore Everything', Icon: MessageSquare, color: C.green,
    desc: 'Ask questions, browse insights, view slides, download PDF, extract media, and review all sources.',
    detail: 'RAG · source attribution · PDF export',
    preview: ['"What is the pricing?"', '→ /pricing: "Starts at $29/mo…"', '→ PDF ready to download'],
  },
]

function StepCard({ step, index }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  const { num, title, desc, detail, Icon, color, preview } = step
  return (
    <motion.div ref={ref} variants={fadeUp(index * 0.15)} initial="hidden" animate={inView ? 'visible' : 'hidden'}
      className="rounded-2xl p-5 flex flex-col gap-3"
      style={{ background: `linear-gradient(135deg, ${color}0d 0%, transparent 100%)`, border: `1px solid ${color}2a` }}>
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-xl flex items-center justify-center font-mono text-[11px] font-bold shrink-0"
          style={{ background: `${color}18`, color, border: `1px solid ${color}40` }}>{num}</div>
        <div className="h-8 w-8 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: `${color}15`, border: `1px solid ${color}35` }}>
          <Icon className="h-4 w-4" style={{ color }} />
        </div>
        <h3 className="font-heading font-bold text-[16px] text-white">{title}</h3>
      </div>
      <p className="text-[13px] text-slate-400 leading-relaxed">{desc}</p>
      <div className="rounded-xl overflow-hidden font-mono"
        style={{ background: 'rgba(3,11,24,0.8)', border: `1px solid ${color}22` }}>
        <div className="flex items-center gap-1.5 px-3 py-1.5" style={{ borderBottom: `1px solid ${color}18`, background: `${color}08` }}>
          {[0,1,2].map(d => <div key={d} className="h-1.5 w-1.5 rounded-full" style={{ background: d===0?'#FF5F57':d===1?'#FFBD2E':'#28CA41', opacity: 0.7 }} />)}
          <span className="ml-1 text-[9px]" style={{ color: `${color}80` }}>{detail}</span>
        </div>
        <div className="p-2.5 flex flex-col gap-1">
          {preview.map((line, i) => (
            <motion.div key={i} className="text-[9px] leading-4" style={{ color: i===0 ? color : `${color}99` }}
              initial={{ opacity: 0, x: -6 }} animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: 0.4 + index * 0.15 + i * 0.12, duration: 0.3 }}>
              {i > 0 && <span style={{ color: `${color}55`, marginRight: 4 }}>▸</span>}{line}
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}

// ── Who is it for ─────────────────────────────────────────────────────────
const USERS = [
  {
    Icon: Users, title: 'Site Visitors & Researchers', color: C.cyan,
    desc: 'Instantly understand what a website offers, how it prices, and what risks it carries — before you engage.',
    points: ['Understand site purpose & value', 'Check security posture', 'Extract key info fast'],
  },
  {
    Icon: Briefcase, title: 'Site Owners & Marketers', color: C.purple,
    desc: 'See your site the way AI sees it. Identify content gaps, weak signals, and competitive angles.',
    points: ['AI intelligence score audit', 'Slide deck for stakeholders', 'Content & positioning review'],
  },
  {
    Icon: Eye, title: 'Content & Brand Monitors', color: C.green,
    desc: 'Track what a site says, extract all media, and get source-backed summaries on demand.',
    points: ['Q&A over full site content', 'Media gallery extraction', 'Full sources index'],
  },
]

function UserCard({ user, index }) {
  const { Icon, title, desc, color, points } = user
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })
  return (
    <motion.div ref={ref} variants={fadeUp(index * 0.12)} initial="hidden" animate={inView ? 'visible' : 'hidden'}
      whileHover={{ y: -3 }}
      className="rounded-2xl p-5 flex flex-col gap-3"
      style={{ background: `linear-gradient(160deg, ${color}0c 0%, rgba(10,22,40,0.4) 100%)`, border: `1px solid ${color}25` }}>
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: `${color}18`, border: `1px solid ${color}35` }}>
          <Icon className="h-5 w-5" style={{ color }} />
        </div>
        <h3 className="font-heading font-bold text-[15px] text-white leading-tight">{title}</h3>
      </div>
      <p className="text-[13px] text-slate-400 leading-relaxed">{desc}</p>
      <div className="flex flex-col gap-2 mt-1">
        {points.map((pt) => (
          <div key={pt} className="flex items-center gap-2">
            <CheckCircle className="h-3.5 w-3.5 shrink-0" style={{ color }} />
            <span className="text-[12px] text-slate-400">{pt}</span>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

// ── Query cards ───────────────────────────────────────────────────────────
function RAGFlowPreview({ query }) {
  const label = query.length > 26 ? query.slice(0, 24) + '…' : query
  return (
    <div className="w-full h-full flex flex-col gap-2 p-3 justify-center">
      <motion.div className="rounded-lg px-2.5 py-1.5 text-[9px] font-mono"
        style={{ background: `${C.cyan}14`, border: `1px solid ${C.cyan}38`, color: C.cyan }}
        initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.05, duration: 0.3, repeat: Infinity, repeatDelay: 3.5 }}>❯ {label}</motion.div>
      <motion.div className="flex items-center gap-1.5"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        transition={{ delay: 0.45, duration: 0.25, repeat: Infinity, repeatDelay: 3.5 }}>
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <span className="text-[8px] text-slate-500 tracking-wide">searching pages</span>
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </motion.div>
      <div className="flex gap-1">
        {[{ w: '91%' }, { w: '78%' }, { w: '63%' }].map((c, i) => (
          <motion.div key={i} className="flex-1 rounded px-1.5 py-1"
            style={{ background: `${C.purple}1a`, border: `1px solid ${C.purple}38` }}
            initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65 + i * 0.15, duration: 0.3, repeat: Infinity, repeatDelay: 3.5 }}>
            <div className="text-[7px] mb-0.5" style={{ color: `${C.purple}99` }}>result {i+1}</div>
            <div className="h-1 rounded-full bg-white/5 overflow-hidden">
              <motion.div className="h-full rounded-full" style={{ background: `${C.purple}80` }}
                initial={{ width: 0 }} animate={{ width: c.w }}
                transition={{ delay: 0.7 + i * 0.15, duration: 0.4, repeat: Infinity, repeatDelay: 3.5 }} />
            </div>
          </motion.div>
        ))}
      </div>
      <motion.div className="rounded-lg px-2.5 py-2"
        style={{ background: `${C.green}0d`, border: `1px solid ${C.green}26` }}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.3, repeat: Infinity, repeatDelay: 3.5 }}>
        <div className="flex items-center gap-1.5 mb-1.5">
          <span className="text-[8px]" style={{ color: `${C.green}cc` }}>Answer</span>
          <motion.span className="text-[9px]" style={{ color: C.green }} animate={{ opacity: [1,0,1] }} transition={{ duration: 0.7, repeat: Infinity, delay: 1.2 }}>▌</motion.span>
        </div>
        {[{ w: '88%' }, { w: '72%' }, { w: '50%' }].map((l, i) => (
          <motion.div key={i} className="h-1 rounded-full mb-1" style={{ background: `${C.green}20` }}
            initial={{ width: 0 }} animate={{ width: l.w }}
            transition={{ delay: 1.3 + i * 0.22, duration: 0.5, ease: 'easeOut', repeat: Infinity, repeatDelay: 3.5 }} />
        ))}
      </motion.div>
    </div>
  )
}

function QueryCard({ query, onClick }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div className="relative" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <motion.button onClick={onClick}
        className="glass rounded-xl px-4 py-4 text-left text-[14px] text-slate-300 hover:text-white flex items-start gap-3 w-full relative overflow-hidden"
        style={{ border: `1px solid ${C.cyan}1a` }}
        whileHover={{ scale: 1.02, y: -2, borderColor: `${C.cyan}52`, boxShadow: `0 0 18px ${C.cyan}1a` }}
        whileTap={{ scale: 0.975 }} transition={{ type: 'spring', stiffness: 380, damping: 22 }}>
        <AnimatePresence>
          {hovered && (
            <motion.div className="absolute inset-0 pointer-events-none"
              initial={{ x: '-110%' }} animate={{ x: '110%' }} exit={{ opacity: 0 }}
              transition={{ duration: 0.55, ease: 'easeInOut' }}
              style={{ background: `linear-gradient(90deg, transparent, ${C.cyan}17, transparent)` }} />
          )}
        </AnimatePresence>
        <motion.div className="shrink-0 mt-0.5 relative z-10"
          animate={hovered ? { scale: 1.25, rotate: [0,-12,12,0] } : { scale: [1,1.2,1], opacity: [0.75,1,0.75] }}
          transition={hovered ? { duration: 0.35 } : { duration: 2.8, repeat: Infinity }}>
          <Zap className="h-4 w-4" style={{ color: C.cyan }} />
        </motion.div>
        <span className="leading-6 relative z-10 font-medium flex-1">{query}</span>
        <motion.div className="shrink-0 self-center relative z-10 ml-1"
          animate={hovered ? { opacity: 1, x: 0 } : { opacity: 0, x: -6 }} transition={{ duration: 0.18 }}>
          <ArrowRight className="h-3.5 w-3.5" style={{ color: C.cyan }} />
        </motion.div>
      </motion.button>
      <AnimatePresence>
        {hovered && (
          <motion.div initial={{ opacity: 0, y: 8, scale: 0.93 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.93 }}
            transition={{ type: 'spring', stiffness: 420, damping: 28 }}
            className="absolute bottom-full mb-2 right-0 md:right-auto md:left-1/2 md:-translate-x-1/2 z-50 pointer-events-none"
            style={{ width: 'min(230px, calc(100vw - 2rem))' }}>
            <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(8,18,36,0.98)', border: `1px solid ${C.cyan}38`, boxShadow: `0 0 40px ${C.cyan}1a, 0 14px 44px rgba(0,0,0,0.6)` }}>
              <div style={{ height: 185, padding: '4px' }}><RAGFlowPreview query={query} /></div>
            </div>
            <div className="mx-auto" style={{ width:0, height:0, borderLeft:'6px solid transparent', borderRight:'6px solid transparent', borderTop:`6px solid ${C.cyan}38` }} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Root ──────────────────────────────────────────────────────────────────
export default function LandingView({ exampleQueries, onQuerySelect, logo }) {
  return (
    <div className="flex flex-col items-center text-center px-4 sm:px-8 py-8 gap-12 max-w-5xl mx-auto">

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="flex flex-col items-center gap-5 w-full">
        <AnimatedGlobe logo={logo} />
        <motion.div className="space-y-4" variants={fadeUp(0.08)} initial="hidden" animate="visible">
          <h1 className="font-heading font-bold text-[2rem] sm:text-[2.7rem] md:text-[3rem] leading-[1.08] text-gradient">
            Website Analysis &amp; Intelligence
          </h1>
          <p className="text-slate-400 text-[1rem] leading-[1.85] mx-auto" style={{ maxWidth: '40rem' }}>
            Paste any URL. Get a{' '}
            <span style={{ color: C.cyan }}>full AI analysis</span>,{' '}
            <span style={{ color: C.purple }}>slide presentation</span>,{' '}
            <span style={{ color: C.amber }}>intelligence score</span>,{' '}
            <span style={{ color: C.green }}>source-backed Q&A</span>,{' '}
            media gallery and sources index — in seconds.
          </p>
        </motion.div>

        {/* Stats */}
        <ScrollReveal delay={0.3}>
          <div className="flex flex-wrap justify-center gap-8 sm:gap-12">
            {STATS.map(({ value, label, color }, i) => (
              <motion.div key={label} className="flex flex-col items-center gap-0.5"
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 + i * 0.08, duration: 0.45 }}>
                <span className="text-[1.6rem] font-bold font-mono" style={{ color }}>{value}</span>
                <span className="text-[10px] text-slate-500 tracking-wide uppercase">{label}</span>
              </motion.div>
            ))}
          </div>
        </ScrollReveal>
      </section>

      {/* ── Everything you get — TOP ───────────────────────────────────── */}
      <SectionDivider label="everything you get" color={`${C.purple}45`} />

      <section className="w-full space-y-4">
        <ScrollReveal>
          <h2 className="font-heading font-bold text-[1.4rem] sm:text-[1.6rem] text-white mb-1">Six modules. One URL.</h2>
          <p className="text-[14px] text-slate-500 mb-6">Paste a URL and every module runs automatically.</p>
        </ScrollReveal>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 text-left">
          {FEATURES.map((f, i) => <FeatureCard key={f.label} feature={f} index={i} />)}
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────────────────── */}
      <SectionDivider label="how it works" color={`${C.cyan}38`} />

      <section className="w-full space-y-4">
        <ScrollReveal>
          <h2 className="font-heading font-bold text-[1.4rem] sm:text-[1.6rem] text-white mb-6">From URL to full intelligence in seconds</h2>
        </ScrollReveal>
        <div className="grid gap-4 lg:grid-cols-3 text-left">
          {HOW_STEPS.map((step, i) => <StepCard key={step.num} step={step} index={i} />)}
        </div>
      </section>

      {/* ── Who is it for ─────────────────────────────────────────────── */}
      <SectionDivider label="who is it for" color={`${C.green}38`} />

      <section className="w-full space-y-4">
        <ScrollReveal>
          <h2 className="font-heading font-bold text-[1.4rem] sm:text-[1.6rem] text-white mb-6">Built for anyone who needs to understand a website fast</h2>
        </ScrollReveal>
        <div className="grid gap-4 sm:grid-cols-3 text-left">
          {USERS.map((u, i) => <UserCard key={u.title} user={u} index={i} />)}
        </div>
      </section>

      {/* ── Example queries ───────────────────────────────────────────── */}
      {exampleQueries.length > 0 && (
        <>
          <SectionDivider label="questions to get you started" color={`${C.purple}4d`} />
          <ScrollReveal className="w-full">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {exampleQueries.slice(0, 3).map((q) => (
                <QueryCard key={q} query={q} onClick={() => onQuerySelect(q)} />
              ))}
            </div>
          </ScrollReveal>
        </>
      )}

    </div>
  )
}
