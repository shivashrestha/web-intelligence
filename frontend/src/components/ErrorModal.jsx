import { X, WifiOff, ShieldX, FileX2, Clock, AlertTriangle, Globe } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const ERROR_META = {
  unreachable: {
    Icon: WifiOff,
    color: '#FF4D6D',
    title: 'Site Unreachable',
    hints: ['Verify the URL and domain spelling', 'Check the site is live and public', 'Try again in a moment'],
  },
  blocked: {
    Icon: ShieldX,
    color: '#F59E0B',
    title: 'Access Blocked',
    hints: ['Site blocks automated crawlers', 'May require login or CAPTCHA', 'Try the homepage URL instead'],
  },
  empty: {
    Icon: FileX2,
    color: '#8B5CF6',
    title: 'No Content Found',
    hints: ['Page may require JavaScript to render', 'Content may be behind authentication', 'Try linking to a specific content page'],
  },
  timeout: {
    Icon: Clock,
    color: '#F59E0B',
    title: 'Request Timed Out',
    hints: ['Site is responding slowly or overloaded', 'Try again in a minute', 'Check your internet connection'],
  },
  network: {
    Icon: WifiOff,
    color: '#FF4D6D',
    title: 'Network Error',
    hints: ['Check your internet connection', 'Server may be temporarily unavailable'],
  },
  invalid: {
    Icon: Globe,
    color: '#00D4FF',
    title: 'Invalid URL',
    hints: ['Include the https:// prefix', 'Check for typos in the domain name'],
  },
  generic: {
    Icon: AlertTriangle,
    color: '#FF4D6D',
    title: 'Analysis Failed',
    hints: ['Check the URL and try again', 'Site may be temporarily unavailable'],
  },
}

export function categorizeError(message = '') {
  const m = message.toLowerCase()
  if (m.includes('failed to fetch') || m.includes('networkerror') || m.includes('network request failed')) return 'network'
  if (m.includes('domain not found') || m.includes('name resolution') || m.includes('nodename') || m.includes('dns') || m.includes('no address') || m.includes('not accepting')) return 'unreachable'
  if (m.includes('could not access') || m.includes('unreachable') || m.includes('connection refused')) return 'unreachable'
  if (m.includes('503') || m.includes('could not reach')) return 'unreachable'
  if (m.includes('403') || m.includes('forbidden') || m.includes('blocked') || m.includes('bot') || m.includes('captcha') || m.includes('bot protection')) return 'blocked'
  if (m.includes('401') || m.includes('unauthorized') || m.includes('authentication required')) return 'blocked'
  if (m.includes('no readable content') || m.includes('no text content') || m.includes('could not be extracted') || m.includes('no content')) return 'empty'
  if (m.includes('timed out') || m.includes('timeout') || m.includes('504')) return 'timeout'
  if (m.includes('invalid url') || m.includes('not a valid')) return 'invalid'
  return 'generic'
}

export default function ErrorModal({ error, onClose, onRetry }) {
  if (!error) return null

  const type = categorizeError(error)
  const meta = ERROR_META[type] || ERROR_META.generic
  const { Icon, color, title, hints } = meta
  const bg = `${color}0d`
  const border = `${color}33`

  return (
    <AnimatePresence>
      <motion.div
        key="error-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: 'rgba(3,11,24,0.88)', backdropFilter: 'blur(14px)' }}
        onClick={onClose}
      >
        <motion.div
          key="error-card"
          initial={{ scale: 0.9, opacity: 0, y: 24 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 24 }}
          transition={{ type: 'spring', stiffness: 320, damping: 26 }}
          className="w-full max-w-[420px] rounded-3xl p-6 space-y-5"
          style={{
            background: 'rgba(10,22,40,0.97)',
            border: `1px solid ${border}`,
            boxShadow: `0 0 80px ${color}12, 0 24px 64px rgba(0,0,0,0.6)`,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.1 }}
                className="h-12 w-12 rounded-2xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: bg, border: `1px solid ${border}` }}
              >
                <Icon className="h-6 w-6" style={{ color }} />
              </motion.div>
              <div>
                <h3 className="font-heading font-bold text-white text-[17px]">{title}</h3>
                <p className="text-[11px] text-cyber-muted mt-0.5">Could not analyze this URL</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="h-8 w-8 rounded-xl glass flex items-center justify-center text-cyber-muted hover:text-white transition-colors shrink-0"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Raw error */}
          <div className="glass rounded-2xl px-4 py-3">
            <p className="text-[11px] font-mono text-slate-400 leading-5 break-words">{error}</p>
          </div>

          {/* Hints */}
          <div className="space-y-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-cyber-muted">Suggestions</p>
            {hints.map((hint, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 + i * 0.06 }}
                className="flex items-center gap-2.5"
              >
                <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: color, opacity: 0.55 }} />
                <span className="text-sm text-slate-400">{hint}</span>
              </motion.div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              onClick={onRetry}
              className="flex-1 rounded-2xl py-3 text-sm font-semibold font-heading transition-all active:scale-95"
              style={{
                background: `linear-gradient(135deg, ${color} 0%, ${color}bb 100%)`,
                color: '#030B18',
                boxShadow: `0 0 20px ${color}35`,
              }}
            >
              Try Again
            </button>
            <button
              onClick={onClose}
              className="flex-1 glass rounded-2xl py-3 text-sm font-semibold font-heading text-cyber-muted hover:text-white transition-colors"
            >
              Dismiss
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
