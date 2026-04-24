import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// ── Mini animated previews for each feature ────────────────────────────────

function CrawlPreview() {
  const nodes = [
    { cx: 50, cy: 70, r: 6, delay: 0 },
    { cx: 22, cy: 38, r: 5, delay: 0.3 },
    { cx: 78, cy: 38, r: 5, delay: 0.5 },
    { cx: 10, cy: 12, r: 4, delay: 0.8 },
    { cx: 38, cy: 12, r: 4, delay: 1.0 },
    { cx: 62, cy: 12, r: 4, delay: 1.2 },
    { cx: 90, cy: 12, r: 4, delay: 1.4 },
  ]
  const lines = [
    { x1: 50, y1: 70, x2: 22, y2: 38, delay: 0.15 },
    { x1: 50, y1: 70, x2: 78, y2: 38, delay: 0.15 },
    { x1: 22, y1: 38, x2: 10, y2: 12, delay: 0.6 },
    { x1: 22, y1: 38, x2: 38, y2: 12, delay: 0.8 },
    { x1: 78, y1: 38, x2: 62, y2: 12, delay: 1.0 },
    { x1: 78, y1: 38, x2: 90, y2: 12, delay: 1.1 },
  ]
  return (
    <svg viewBox="0 0 100 80" className="w-full h-full">
      {lines.map((l, i) => (
        <motion.line
          key={i}
          x1={`${l.x1}%`} y1={`${l.y1}%`}
          x2={`${l.x2}%`} y2={`${l.y2}%`}
          stroke="rgba(0,212,255,0.3)" strokeWidth="1"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ delay: l.delay, duration: 0.4, repeat: Infinity, repeatDelay: 2 }}
        />
      ))}
      {nodes.map((n, i) => (
        <motion.circle
          key={i}
          cx={`${n.cx}%`} cy={`${n.cy}%`} r={n.r}
          fill="rgba(0,212,255,0.15)" stroke="#00D4FF" strokeWidth="1.5"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: n.delay, type: 'spring', stiffness: 300, damping: 20, repeat: Infinity, repeatDelay: 1.8 }}
        />
      ))}
    </svg>
  )
}

function HiddenPreview() {
  const blocks = [
    { w: '70%', color: 'rgba(139,92,246,0.5)', locked: true },
    { w: '90%', color: 'rgba(139,92,246,0.3)', locked: true },
    { w: '55%', color: 'rgba(139,92,246,0.4)', locked: true },
  ]
  return (
    <div className="w-full h-full flex flex-col justify-center gap-2 px-2">
      {blocks.map((b, i) => (
        <div key={i} className="relative overflow-hidden rounded">
          <div className="h-4 rounded" style={{ width: b.w, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }} />
          <motion.div
            className="absolute inset-0 rounded"
            style={{ background: b.color }}
            initial={{ x: 0 }}
            animate={{ x: ['0%', '-100%'] }}
            transition={{ delay: 0.4 + i * 0.25, duration: 0.5, repeat: Infinity, repeatDelay: 2.2, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute inset-0 rounded flex items-center px-1.5"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0, 1] }}
            transition={{ delay: 0.4 + i * 0.25 + 0.5, duration: 0.3, repeat: Infinity, repeatDelay: 2.2 }}
          >
            <div className="h-1.5 rounded-full bg-cyber-purple/60" style={{ width: b.w }} />
          </motion.div>
        </div>
      ))}
    </div>
  )
}

function ImagePreview() {
  const colors = ['rgba(0,212,255,0.2)', 'rgba(139,92,246,0.2)', 'rgba(16,255,168,0.2)', 'rgba(255,77,109,0.2)']
  return (
    <div className="w-full h-full grid grid-cols-2 gap-1.5 p-1">
      {colors.map((c, i) => (
        <motion.div
          key={i}
          className="rounded-lg flex items-center justify-center"
          style={{ background: c, border: '1px solid rgba(255,255,255,0.08)' }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: i * 0.2, type: 'spring', stiffness: 280, damping: 18, repeat: Infinity, repeatDelay: 2 }}
        >
          <div className="h-2 w-2 rounded-full bg-white/20" />
        </motion.div>
      ))}
    </div>
  )
}

function RAGPreview() {
  const lines = ['Analyzing content…', 'Retrieving context…', 'Generating answer…']
  return (
    <div className="w-full h-full flex flex-col justify-center gap-2 px-2">
      {lines.map((text, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <motion.div
            className="h-1.5 w-1.5 rounded-full bg-cyber-cyan shrink-0"
            animate={{ opacity: [0.2, 1, 0.2] }}
            transition={{ duration: 1, delay: i * 0.4, repeat: Infinity }}
          />
          <motion.div
            className="h-2 rounded-full bg-cyber-cyan/20 overflow-hidden"
            style={{ flex: 1 }}
            initial={{ width: 0 }}
            animate={{ width: '100%' }}
            transition={{ delay: i * 0.5 + 0.2, duration: 0.7, repeat: Infinity, repeatDelay: 2 }}
          >
            <motion.div
              className="h-full bg-cyber-cyan/30 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: '100%' }}
              transition={{ delay: i * 0.5 + 0.2, duration: 0.7, repeat: Infinity, repeatDelay: 2 }}
            />
          </motion.div>
        </div>
      ))}
    </div>
  )
}

function CitationsPreview() {
  return (
    <div className="w-full h-full flex flex-col justify-center gap-2 px-2">
      <div className="glass rounded-lg px-2 py-1.5">
        <div className="flex items-start gap-1.5">
          <div className="w-0.5 h-full bg-cyber-cyan/50 rounded shrink-0 self-stretch mt-0.5" />
          <p className="text-[9px] text-slate-400 leading-4">
            The platform offers enterprise-grade
            <motion.span
              className="inline-flex items-center mx-0.5 px-1 py-0.5 rounded text-[8px] font-mono"
              style={{ background: 'rgba(0,212,255,0.15)', color: '#00D4FF', border: '1px solid rgba(0,212,255,0.3)' }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.4, type: 'spring', repeat: Infinity, repeatDelay: 2.5 }}
            >
              [1]
            </motion.span>
            security with SOC 2
            <motion.span
              className="inline-flex items-center mx-0.5 px-1 py-0.5 rounded text-[8px] font-mono"
              style={{ background: 'rgba(139,92,246,0.15)', color: '#8B5CF6', border: '1px solid rgba(139,92,246,0.3)' }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.8, type: 'spring', repeat: Infinity, repeatDelay: 2.5 }}
            >
              [2]
            </motion.span>
          </p>
        </div>
      </div>
      <div className="flex gap-1">
        {['Source 1', 'Source 2'].map((s, i) => (
          <motion.div
            key={i}
            className="rounded-lg px-2 py-1 text-[8px]"
            style={{ background: 'rgba(0,212,255,0.08)', color: '#00D4FF', border: '1px solid rgba(0,212,255,0.2)' }}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 + i * 0.2, repeat: Infinity, repeatDelay: 2.2 }}
          >
            {s}
          </motion.div>
        ))}
      </div>
    </div>
  )
}

function InsightsPreview() {
  const bars = [
    { h: '60%', color: '#00D4FF', label: 'Features' },
    { h: '85%', color: '#8B5CF6', label: 'Audience' },
    { h: '45%', color: '#10FFA8', label: 'Pricing' },
  ]
  return (
    <div className="w-full h-full flex items-end justify-around px-3 pb-3 pt-2 gap-2">
      {bars.map((b, i) => (
        <div key={i} className="flex flex-col items-center gap-1 flex-1">
          <motion.div
            className="w-full rounded-t-lg"
            style={{ backgroundColor: `${b.color}30`, border: `1px solid ${b.color}50` }}
            initial={{ height: 0 }}
            animate={{ height: b.h }}
            transition={{ delay: i * 0.25, duration: 0.6, ease: 'backOut', repeat: Infinity, repeatDelay: 2 }}
          />
          <span className="text-[8px] text-cyber-muted">{b.label}</span>
        </div>
      ))}
    </div>
  )
}

function ThemePreview() {
  const palettes = [
    ['#00D4FF', '#8B5CF6', '#10FFA8'],
    ['#FF4D6D', '#F59E0B', '#EC4899'],
    ['#3B82F6', '#06B6D4', '#6366F1'],
  ]
  const [idx, setIdx] = useState(0)

  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-3 px-2">
      {/* Mini browser bar */}
      <div className="w-full glass rounded-lg px-2 py-1.5 flex items-center gap-1.5">
        <div className="flex gap-1">
          {['#FF4D6D', '#F59E0B', '#10FFA8'].map((c, i) => (
            <div key={i} className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: c }} />
          ))}
        </div>
        <div className="flex-1 h-1.5 rounded-full bg-white/10" />
      </div>
      {/* Palette cycles */}
      <motion.div
        className="flex gap-2 items-center"
        animate={{ opacity: [1, 0, 1] }}
        transition={{ duration: 0.5, times: [0, 0.5, 1], repeat: Infinity, repeatDelay: 1.5 }}
        onAnimationComplete={() => setIdx((p) => (p + 1) % palettes.length)}
      >
        {palettes[idx].map((c, i) => (
          <div key={i} className="h-7 w-7 rounded-lg shadow-surface" style={{ backgroundColor: c }} />
        ))}
      </motion.div>
      <div className="text-[9px] text-cyber-muted">Theme extracted</div>
    </div>
  )
}

// ── Feature definitions ────────────────────────────────────────────────────

const FEATURES = [
  { label: 'Deep site crawl',   color: '#00D4FF', Preview: CrawlPreview,    desc: 'BFS crawl · up to 25 pages · depth 3' },
  { label: 'Hidden content',    color: '#8B5CF6', Preview: HiddenPreview,   desc: 'Extracts details, accordions & data attrs' },
  { label: 'Image extraction',  color: '#10FFA8', Preview: ImagePreview,    desc: 'Scrapes all images across crawled pages' },
  { label: 'RAG answers',       color: '#00D4FF', Preview: RAGPreview,      desc: 'Context-aware answers with FAISS retrieval' },
  { label: 'Source citations',  color: '#8B5CF6', Preview: CitationsPreview, desc: 'Every answer cites the exact source chunk' },
  { label: 'Business insights', color: '#10FFA8', Preview: InsightsPreview, desc: '7 AI-generated insight cards per site' },
  { label: 'Theme mimicry',     color: '#FF4D6D', Preview: ThemePreview,    desc: 'Extracts & applies the site color palette' },
]

function FeatureBadge({ feature }) {
  const [hovered, setHovered] = useState(false)
  const { label, color, Preview, desc } = feature

  return (
    <div
      className="relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <motion.button
        className="rounded-full px-3 py-1.5 text-xs border transition-all duration-200 select-none"
        style={{
          borderColor: hovered ? `${color}66` : `${color}25`,
          backgroundColor: hovered ? `${color}15` : `${color}08`,
          color: hovered ? color : `${color}bb`,
          boxShadow: hovered ? `0 0 12px ${color}25` : 'none',
        }}
        animate={{ scale: hovered ? 1.06 : 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      >
        {label}
      </motion.button>

      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.94 }}
            transition={{ type: 'spring', stiffness: 400, damping: 26 }}
            className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
            style={{ width: 268 }}
          >
            <div
              className="rounded-2xl overflow-hidden"
              style={{
                background: 'rgba(8,18,36,0.98)',
                border: `1px solid ${color}40`,
                boxShadow: `0 0 40px ${color}18, 0 14px 44px rgba(0,0,0,0.6)`,
              }}
            >
              {/* Animation area */}
              <div style={{ height: 152, padding: '10px' }}>
                <Preview />
              </div>
              {/* Label */}
              <div className="px-3.5 pb-3.5 pt-2 border-t" style={{ borderColor: `${color}22` }}>
                <p className="text-[12px] font-semibold" style={{ color }}>{label}</p>
                <p className="text-[10px] text-cyber-muted mt-1 leading-4">{desc}</p>
              </div>
            </div>
            {/* Arrow */}
            <div
              className="mx-auto mt-0"
              style={{
                width: 0,
                height: 0,
                borderLeft: '6px solid transparent',
                borderRight: '6px solid transparent',
                borderTop: `6px solid ${color}33`,
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function FeatureBadges() {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      {FEATURES.map((f) => (
        <FeatureBadge key={f.label} feature={f} />
      ))}
    </div>
  )
}
