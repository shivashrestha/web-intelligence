import { CheckCircle2, Globe, Database, Cpu, Zap, Sparkles } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const STEPS = [
  { label: 'Crawling pages',      sub: 'Following links, extracting content & images', Icon: Globe },
  { label: 'Extracting content',  sub: 'Reading and preparing page content',           Icon: Database },
  { label: 'Building knowledge',  sub: 'Indexing content for semantic search',         Icon: Cpu },
  { label: 'Generating insights', sub: 'Running AI analysis — score, security, pros & cons', Icon: Sparkles },
  { label: 'Ready',               sub: 'Your knowledge base is live',                  Icon: Zap },
]

const PARTICLES = [
  { x: '20%', y: '15%', delay: 0,    dur: 3.2 },
  { x: '75%', y: '10%', delay: 0.8,  dur: 2.8 },
  { x: '85%', y: '60%', delay: 1.4,  dur: 3.6 },
  { x: '12%', y: '70%', delay: 0.4,  dur: 3.0 },
  { x: '55%', y: '85%', delay: 1.8,  dur: 2.6 },
  { x: '40%', y: '5%',  delay: 2.2,  dur: 3.4 },
]

export default function Loader({ step = 0, url = '' }) {
  let host = url
  try { host = new URL(url).hostname.replace(/^www\./, '') } catch {}

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-cyber-bg/95 backdrop-blur-sm">

      {/* Ambient orbs */}
      <motion.div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(0,212,255,0.06) 0%, transparent 70%)' }}
        animate={{ scale: [1, 1.15, 1], opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute top-2/3 left-1/3 h-[400px] w-[400px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.05) 0%, transparent 70%)' }}
        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.9, 0.5] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
      />

      {/* Floating particles */}
      {PARTICLES.map((p, i) => (
        <motion.div
          key={i}
          className="absolute h-1 w-1 rounded-full bg-cyber-cyan pointer-events-none"
          style={{ left: p.x, top: p.y }}
          animate={{ y: [0, -24, 0], opacity: [0, 0.6, 0] }}
          transition={{ duration: p.dur, delay: p.delay, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}

      <div className="relative z-10 w-full max-w-md px-4">

        {/* Central icon with orbital rings */}
        <div className="flex flex-col items-center mb-10">
          <div className="relative mb-5 flex items-center justify-center" style={{ width: 120, height: 120 }}>

            {/* Outer ring */}
            <motion.div
              className="absolute rounded-full"
              style={{ width: 120, height: 120, border: '1px solid rgba(0,212,255,0.15)' }}
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
            >
              <div className="absolute -top-1 left-1/2 h-2 w-2 rounded-full bg-cyber-cyan/60 -translate-x-1/2 shadow-glow-sm" />
            </motion.div>

            {/* Middle ring */}
            <motion.div
              className="absolute rounded-full"
              style={{ width: 96, height: 96, border: '1px solid rgba(139,92,246,0.2)' }}
              animate={{ rotate: -360 }}
              transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
            >
              <div className="absolute -top-1 left-1/2 h-1.5 w-1.5 rounded-full bg-cyber-purple/70 -translate-x-1/2" />
            </motion.div>

            {/* Inner pulse ring */}
            <motion.div
              className="absolute rounded-full"
              style={{ width: 76, height: 76, border: '1px solid rgba(0,212,255,0.1)' }}
              animate={{ scale: [1, 1.08, 1], opacity: [0.4, 0.9, 0.4] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
            />

            {/* Globe icon */}
            <motion.div
              className="relative h-16 w-16 rounded-2xl flex items-center justify-center shadow-glow-cyan"
              style={{ background: 'linear-gradient(135deg, #00D4FF 0%, #8B5CF6 100%)' }}
              animate={{ scale: [1, 1.04, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Globe className="h-8 w-8 text-[#030B18]" />
              {/* Scanning line */}
              <motion.div
                className="absolute left-0 right-0 h-px bg-white/30"
                animate={{ top: ['0%', '100%', '0%'] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: 'linear' }}
              />
            </motion.div>
          </div>

          <motion.h2
            className="font-heading font-bold text-2xl text-white"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            Analyzing Website
          </motion.h2>
          {host && (
            <motion.p
              className="mt-1.5 text-sm text-cyber-muted font-mono"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35 }}
            >
              <span className="text-cyber-cyan">{host}</span>
            </motion.p>
          )}
          <motion.p
            className="mt-1 text-xs text-cyber-muted"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.45 }}
          >
            Crawling all reachable pages…
          </motion.p>
        </div>

        {/* Steps */}
        <motion.div
          className="glass rounded-2xl p-5 space-y-3"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          {STEPS.map(({ label, sub, Icon }, idx) => {
            const done   = idx < step
            const active = idx === step
            const pending = idx > step

            return (
              <motion.div
                key={label}
                layout
                initial={{ opacity: 0, x: -12 }}
                animate={{
                  opacity: pending ? 0.4 : 1,
                  x: 0,
                }}
                transition={{ delay: idx * 0.08, duration: 0.3 }}
                className={[
                  'flex items-center gap-3 rounded-xl px-4 py-3 border transition-all duration-500',
                  done   ? 'border-cyber-green/30 bg-cyber-green/5'  :
                  active ? 'border-cyber-cyan/40 bg-cyber-cyan/5 shadow-glow-sm' :
                           'border-white/5 bg-white/[0.02]',
                ].join(' ')}
              >
                <div className={[
                  'h-8 w-8 rounded-lg flex items-center justify-center shrink-0',
                  done   ? 'bg-cyber-green/15' :
                  active ? 'bg-cyber-cyan/15'  :
                           'bg-white/5',
                ].join(' ')}>
                  <AnimatePresence mode="wait">
                    {done ? (
                      <motion.div
                        key="done"
                        initial={{ scale: 0, rotate: -90 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                      >
                        <CheckCircle2 className="h-4 w-4 text-cyber-green" />
                      </motion.div>
                    ) : active ? (
                      <motion.div
                        key="active"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
                        className="h-4 w-4 rounded-full border-2 border-cyber-cyan border-t-transparent"
                      />
                    ) : (
                      <motion.div key="pending">
                        <Icon className="h-4 w-4 text-cyber-muted" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="min-w-0 flex-1">
                  <p className={[
                    'text-sm font-medium',
                    done   ? 'text-cyber-green' :
                    active ? 'text-white'       :
                             'text-cyber-muted',
                  ].join(' ')}>{label}</p>
                  <AnimatePresence>
                    {active && (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="text-xs text-cyber-muted mt-0.5 truncate"
                      >
                        {sub}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                {active && (
                  <div className="ml-auto shrink-0 w-16">
                    <div className="h-1 rounded-full bg-cyber-cyan/15 overflow-hidden">
                      <div className="h-full bg-cyber-cyan rounded-full animate-progress-indeterminate" />
                    </div>
                  </div>
                )}
              </motion.div>
            )
          })}
        </motion.div>

        <motion.p
          className="mt-4 text-center text-[11px] text-cyber-muted"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          This may take 30–90 seconds depending on site size
        </motion.p>
      </div>
    </div>
  )
}
