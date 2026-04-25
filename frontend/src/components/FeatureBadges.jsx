import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Network, BrainCircuit, BarChart3, ImageDown } from 'lucide-react'

// ── Mini animated previews ─────────────────────────────────────────────────

function CrawlPreview() {
  const pages = [
    { url: '/home', depth: 0, status: '200', delay: 0 },
    { url: '/about', depth: 1, status: '200', delay: 0.45 },
    { url: '/pricing', depth: 1, status: '200', delay: 0.88 },
    { url: '/blog/ai-intro', depth: 2, status: '200', delay: 1.3 },
    { url: '/contact', depth: 2, status: '200', delay: 1.72 },
  ]
  const LOOP = 3.8
  return (
    <div className="w-full h-full flex flex-col gap-1 px-1 overflow-hidden">
      <div className="flex items-center gap-1.5 mb-0.5">
        <motion.div
          className="h-1.5 w-1.5 rounded-full shrink-0"
          style={{ background: '#00D4FF' }}
          animate={{ opacity: [1, 0.25, 1] }}
          transition={{ duration: 0.85, repeat: Infinity }}
        />
        <span style={{ fontSize: 9, color: '#00D4FF', fontFamily: 'monospace' }}>crawling example.com</span>
      </div>

      {pages.map((p, i) => (
        <motion.div
          key={i}
          className="flex items-center gap-1"
          style={{ paddingLeft: p.depth * 10 }}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: p.delay, duration: 0.2, repeat: Infinity, repeatDelay: LOOP - p.delay }}
        >
          <div style={{
            width: 5, height: 5, borderRadius: '50%', flexShrink: 0,
            background: p.depth === 0 ? '#00D4FF' : p.depth === 1 ? 'rgba(0,212,255,0.55)' : 'rgba(0,212,255,0.3)',
          }} />
          <span style={{ fontSize: 9, color: 'rgba(148,163,184,0.85)', fontFamily: 'monospace', flex: 1 }}>{p.url}</span>
          <motion.span
            style={{ fontSize: 8, color: '#10FFA8', fontFamily: 'monospace', flexShrink: 0 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: p.delay + 0.28, duration: 0.15, repeat: Infinity, repeatDelay: LOOP - p.delay - 0.28 }}
          >{p.status}</motion.span>
        </motion.div>
      ))}

      <motion.div
        className="flex items-center justify-between mt-auto"
        style={{ borderTop: '1px solid rgba(0,212,255,0.12)', paddingTop: 3 }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.1, duration: 0.25, repeat: Infinity, repeatDelay: 2.1 }}
      >
        <span style={{ fontSize: 9, color: 'rgba(0,212,255,0.5)', fontFamily: 'monospace' }}>5 / 25 pages</span>
        <span style={{ fontSize: 9, color: '#10FFA8', fontFamily: 'monospace' }}>depth 2</span>
      </motion.div>
    </div>
  )
}

function RAGPreview() {
  const chunks = [
    { text: '"Pricing starts at $29/mo…"', score: '0.94' },
    { text: '"Enterprise: unlimited seats"', score: '0.88' },
    { text: '"Free tier: 5 projects max"', score: '0.81' },
  ]
  const LOOP = 3.5
  return (
    <div className="w-full h-full flex flex-col gap-1.5 px-0.5 overflow-hidden">
      <div className="flex items-center gap-1 mb-0.5">
        <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#8B5CF6', flexShrink: 0 }} />
        <span style={{ fontSize: 9, color: 'rgba(139,92,246,0.8)', fontFamily: 'monospace', fontStyle: 'italic', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
          "What are the pricing plans?"
        </span>
      </div>

      {chunks.map((c, i) => (
        <motion.div
          key={i}
          className="flex items-center gap-1.5 rounded-md px-2 py-1"
          style={{ background: 'rgba(139,92,246,0.07)', border: '1px solid rgba(139,92,246,0.16)' }}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.38 + 0.15, duration: 0.24, repeat: Infinity, repeatDelay: LOOP - i * 0.38 - 0.15 }}
        >
          <span style={{ fontSize: 8, color: 'rgba(148,163,184,0.72)', flex: 1, fontFamily: 'monospace', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{c.text}</span>
          <span style={{ fontSize: 9, color: '#10FFA8', fontWeight: 700, flexShrink: 0, fontFamily: 'monospace' }}>{c.score}</span>
        </motion.div>
      ))}

      <motion.div
        className="flex items-center gap-1.5 mt-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 0.2, repeat: Infinity, repeatDelay: 2.2 }}
      >
        <motion.div
          className="h-1.5 w-1.5 rounded-full shrink-0"
          style={{ background: '#8B5CF6' }}
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 0.65, repeat: Infinity }}
        />
        <span style={{ fontSize: 9, color: 'rgba(139,92,246,0.75)' }}>Generating answer</span>
        <motion.span
          style={{ display: 'inline-block', width: 1.5, height: 9, background: '#8B5CF6', borderRadius: 1 }}
          animate={{ opacity: [1, 0, 1] }}
          transition={{ duration: 0.55, repeat: Infinity }}
        />
      </motion.div>
    </div>
  )
}

function InsightsPreview() {
  const insights = [
    { color: '#00D4FF', category: 'Target Market', value: 'B2B · SaaS' },
    { color: '#8B5CF6', category: 'Pricing Model', value: 'Freemium · $29' },
    { color: '#10FFA8', category: 'Core Strength', value: 'AI automation' },
    { color: '#F59E0B', category: 'Growth Signal', value: 'Hiring · Series A' },
  ]
  const LOOP = 3.2
  return (
    <div className="w-full h-full flex flex-col gap-1 px-0.5 overflow-hidden">
      <div className="flex items-center gap-1.5 mb-0.5">
        <motion.div
          className="h-1.5 w-1.5 rounded-full shrink-0"
          style={{ background: '#10FFA8' }}
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ duration: 1.1, repeat: Infinity }}
        />
        <span style={{ fontSize: 9, color: '#10FFA8' }}>Generating insights…</span>
      </div>

      {insights.map((ins, i) => (
        <motion.div
          key={i}
          className="flex items-center gap-1.5 rounded-md px-1.5 py-1"
          style={{ background: `${ins.color}0b`, border: `1px solid ${ins.color}28` }}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.38 + 0.18, duration: 0.22, repeat: Infinity, repeatDelay: LOOP - i * 0.38 - 0.18 }}
        >
          <div style={{ width: 5, height: 5, borderRadius: '50%', background: ins.color, flexShrink: 0 }} />
          <span style={{ fontSize: 8, color: `${ins.color}cc`, fontWeight: 600, flexShrink: 0 }}>{ins.category}</span>
          <span style={{ fontSize: 8, color: 'rgba(148,163,184,0.6)', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>· {ins.value}</span>
        </motion.div>
      ))}
    </div>
  )
}

function ImagePreview() {
  const imgs = [
    { name: 'hero-banner', ext: 'jpg', dim: '1280×640' },
    { name: 'product-shot', ext: 'png', dim: '800×600' },
    { name: 'team-photo', ext: 'jpg', dim: '960×480' },
    { name: 'logo', ext: 'svg', dim: '240×80' },
    { name: 'cta-bg', ext: 'webp', dim: '1920×400' },
    { name: 'icon-set', ext: 'png', dim: '256×256' },
  ]
  const accent = '#F59E0B'
  return (
    <div className="w-full h-full flex flex-col gap-1.5 overflow-hidden px-0.5">
      <div className="grid grid-cols-3 gap-1 flex-1">
        {imgs.map((img, i) => (
          <motion.div
            key={i}
            className="rounded-md flex flex-col items-center justify-center gap-0.5 overflow-hidden"
            style={{ background: `rgba(245,158,11,${0.04 + i * 0.015})`, border: `1px solid rgba(245,158,11,0.22)` }}
            initial={{ opacity: 0, scale: 0.75 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.22 + 0.1, type: 'spring', stiffness: 320, damping: 22, repeat: Infinity, repeatDelay: 2.8 }}
          >
            <div style={{
              width: 18, height: 11, borderRadius: 2,
              background: `rgba(245,158,11,${0.18 + i * 0.04})`,
              border: '1px solid rgba(245,158,11,0.3)',
            }} />
            <span style={{ fontSize: 6.5, color: `rgba(245,158,11,0.65)`, fontFamily: 'monospace', textAlign: 'center', lineHeight: 1.2 }}>
              {img.name.split('-')[0]}.{img.ext}
            </span>
          </motion.div>
        ))}
      </div>
      <motion.div
        className="flex items-center justify-between"
        style={{ borderTop: `1px solid rgba(245,158,11,0.15)`, paddingTop: 3 }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.55, duration: 0.25, repeat: Infinity, repeatDelay: 2.5 }}
      >
        <span style={{ fontSize: 8, color: `rgba(245,158,11,0.55)`, fontFamily: 'monospace' }}>6 images found</span>
        <span style={{ fontSize: 8, color: '#10FFA8', fontFamily: 'monospace' }}>jpg · png · svg · webp</span>
      </motion.div>
    </div>
  )
}

// ── Feature definitions ────────────────────────────────────────────────────

const FEATURES = [
  {
    label: 'Deep Site Crawl',
    desc: 'BFS · up to 25 pages · depth 3',
    Icon: Network,
    g1: '#00D4FF', g2: '#0EA5E9',
    Preview: CrawlPreview,
    previewColor: '#00D4FF',
  },
  {
    label: 'AI Q&A',
    desc: 'Ask questions & answers sourced from page content',
    Icon: BrainCircuit,
    g1: '#8B5CF6', g2: '#6366F1',
    Preview: RAGPreview,
    previewColor: '#8B5CF6',
  },
  {
    label: 'Business Insights',
    desc: '7 AI-generated insight cards per site',
    Icon: BarChart3,
    g1: '#10FFA8', g2: '#34D399',
    Preview: InsightsPreview,
    previewColor: '#10FFA8',
  },
  {
    label: 'Image Extraction',
    desc: 'All images scraped across crawled pages',
    Icon: ImageDown,
    g1: '#F59E0B', g2: '#EC4899',
    Preview: ImagePreview,
    previewColor: '#F59E0B',
  },
]

function FeatureCard({ feature, index }) {
  const [hovered, setHovered] = useState(false)
  const { label, desc, Icon, g1, g2, Preview, previewColor } = feature

  return (
    <div
      className="relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <motion.button
        className="relative rounded-2xl px-5 py-3.5 text-left overflow-hidden select-none"
        style={{
          background: `linear-gradient(135deg, ${g1}10 0%, ${g2}07 100%)`,
          border: `1px solid ${g1}30`,
          minWidth: 158,
        }}
        animate={{
          boxShadow: hovered
            ? `0 0 28px ${g1}30, 0 8px 32px rgba(0,0,0,0.45)`
            : `0 0 10px ${g1}10, 0 2px 8px rgba(0,0,0,0.2)`,
          borderColor: hovered ? `${g1}55` : `${g1}30`,
        }}
        whileHover={{ scale: 1.06, y: -3 }}
        whileTap={{ scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 360, damping: 22 }}
      >
        {/* Ambient idle gradient pulse */}
        <motion.div
          className="absolute inset-0 rounded-2xl pointer-events-none"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 3 + index * 0.5, repeat: Infinity, ease: 'easeInOut' }}
          style={{ background: `linear-gradient(135deg, ${g1}09 0%, ${g2}05 100%)` }}
        />

        {/* Shimmer on hover */}
        <AnimatePresence>
          {hovered && (
            <motion.div
              className="absolute inset-0 pointer-events-none"
              initial={{ x: '-110%' }}
              animate={{ x: '110%' }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: 'easeInOut' }}
              style={{ background: `linear-gradient(90deg, transparent, ${g1}12, transparent)` }}
            />
          )}
        </AnimatePresence>

        <div className="relative z-10 flex items-center gap-3">
          {/* Icon box */}
          <div
            className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0"
            style={{
              background: `linear-gradient(135deg, ${g1}22 0%, ${g2}18 100%)`,
              border: `1px solid ${g1}40`,
            }}
          >
            <motion.div
              animate={{ scale: [1, 1.18, 1] }}
              transition={{ duration: 2.8 + index * 0.4, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Icon className="h-4 w-4" style={{ color: g1 }} />
            </motion.div>
          </div>

          {/* Text */}
          <div>
            <p className="text-[13px] font-heading font-semibold leading-tight" style={{ color: g1 }}>{label}</p>
            <p className="text-[10px] text-cyber-muted mt-0.5 leading-4">{desc}</p>
          </div>
        </div>
      </motion.button>

      {/* Hover preview tooltip */}
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.94 }}
            transition={{ type: 'spring', stiffness: 400, damping: 26 }}
            className="absolute bottom-full mb-2 right-0 lg:right-auto lg:left-1/2 lg:-translate-x-1/2 z-50 pointer-events-none"
            style={{ width: 'min(268px, calc(100vw - 2rem))' }}
          >
            <div
              className="rounded-2xl overflow-hidden"
              style={{
                background: 'rgba(8,18,36,0.98)',
                border: `1px solid ${previewColor}40`,
                boxShadow: `0 0 40px ${previewColor}18, 0 14px 44px rgba(0,0,0,0.6)`,
              }}
            >
              <div style={{ height: 152, padding: '10px' }}>
                <Preview />
              </div>
              <div className="px-3.5 pb-3.5 pt-2 border-t" style={{ borderColor: `${previewColor}22` }}>
                <p className="text-[12px] font-semibold" style={{ color: previewColor }}>{label}</p>
                <p className="text-[10px] text-cyber-muted mt-1 leading-4">{desc}</p>
              </div>
            </div>
            <div
              className="mx-auto"
              style={{
                width: 0, height: 0,
                borderLeft: '6px solid transparent',
                borderRight: '6px solid transparent',
                borderTop: `6px solid ${previewColor}33`,
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
    <div className="flex flex-wrap justify-center gap-3">
      {FEATURES.map((f, i) => (
        <FeatureCard key={f.label} feature={f} index={i} />
      ))}
    </div>
  )
}
