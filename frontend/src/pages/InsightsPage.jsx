import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, Sparkles, TrendingUp, Zap, Users, Cpu, Tag, ThumbsUp,
  Globe, ExternalLink, RefreshCw,
} from 'lucide-react'
import { loadInsights, loadSessions } from '../services/api'
import { useSEO } from '../hooks/useSEO'

const CARD_META = {
  'Overview':        { Icon: Sparkles,   color: '#00D4FF' },
  'Business Model':  { Icon: TrendingUp, color: '#8B5CF6' },
  'Key Features':    { Icon: Zap,        color: '#00D4FF' },
  'Target Audience': { Icon: Users,      color: '#8B5CF6' },
  'Technology':      { Icon: Cpu,        color: '#10FFA8' },
  'Pricing':         { Icon: Tag,        color: '#10FFA8' },
  'Pros & Cons':     { Icon: ThumbsUp,   color: '#10FFA8' },
}

function hex2rgba(hex, a) {
  try {
    const h = hex.replace('#', '')
    const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16))
    return `rgba(${r},${g},${b},${a})`
  } catch { return `rgba(0,212,255,${a})` }
}

function InsightCard({ block, accent, idx }) {
  const meta = CARD_META[block.title] || { Icon: Sparkles, color: '#00D4FF' }
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
          const text = (isPro || isCon) ? item.replace(/^(Pro:|Con:)\s*/, '') : item
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

export default function InsightsPage() {
  const { sessionId } = useParams()
  const [insights, setInsights] = useState(null)
  const [meta, setMeta] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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

  const accent = meta?.theme?.accent
  const favicon = meta?.theme?.favicon
  const ogImage = meta?.theme?.og_image

  useSEO({
    title: meta?.title || null,
    image: ogImage || null,
    url: `/insights/${sessionId}`,
  })

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
            <button
              onClick={fetchAll}
              className="text-xs text-cyber-cyan hover:text-white transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {!error && (
          <>
            {/* Page title */}
            <motion.div
              className="mb-8 space-y-1"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h1 className="font-heading font-bold text-2xl text-gradient">AI-Generated Insights</h1>
              <p className="text-sm text-cyber-muted">
                {meta?.title ? `Analysis of ${meta.title}` : 'Site analysis'}
              </p>
            </motion.div>

            {/* Cards grid */}
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
    </div>
  )
}
