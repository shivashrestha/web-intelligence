import { motion, AnimatePresence } from 'framer-motion'
import { Cookie, X, CheckCircle, XCircle, Settings } from 'lucide-react'

const COOKIE_KEY = 'wi_cookie_consent'

export function getCookieConsent() {
  return localStorage.getItem(COOKIE_KEY)
}

export function setCookieConsent(value) {
  localStorage.setItem(COOKIE_KEY, value)
}

const COOKIE_TYPES = [
  {
    name: 'Essential',
    description: 'Session caching (IndexedDB/localStorage) required for core functionality. Cannot be disabled.',
    required: true,
  },
  {
    name: 'Analytics',
    description: 'Anonymous usage metrics to improve the product. No personal data collected.',
    required: false,
  },
]

export default function CookiesModal({ open, onAccept, onDecline, onPrivacyClick }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Backdrop */}
          <motion.div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

          {/* Banner */}
          <motion.div
            className="relative w-full max-w-xl rounded-2xl overflow-hidden"
            style={{
              background: 'rgba(10, 22, 40, 0.98)',
              border: '1px solid rgba(0, 212, 255, 0.2)',
              boxShadow: '0 0 60px rgba(0, 212, 255, 0.1), 0 24px 64px rgba(0, 0, 0, 0.7)',
            }}
            initial={{ opacity: 0, y: 40, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
              <div className="flex items-center gap-3">
                <div
                  className="h-8 w-8 rounded-xl flex items-center justify-center"
                  style={{ background: 'rgba(0, 212, 255, 0.1)', border: '1px solid rgba(0, 212, 255, 0.2)' }}
                >
                  <Cookie className="h-4 w-4 text-cyber-cyan" />
                </div>
                <h2 className="font-heading font-bold text-white text-[14px]">Cookie Preferences</h2>
              </div>
              <button
                onClick={onDecline}
                className="h-7 w-7 rounded-lg flex items-center justify-center text-cyber-muted hover:text-white hover:bg-white/8 transition-colors"
                title="Decline and close"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Body */}
            <div className="px-5 py-4 space-y-4">
              <p className="text-[13px] text-slate-400 leading-6">
                We use cookies and browser storage to power this app and optionally improve your experience.
                {' '}
                <button
                  onClick={onPrivacyClick}
                  className="text-cyber-cyan hover:underline transition-colors"
                >
                  Read our Privacy Policy
                </button>
                .
              </p>

              <div className="space-y-2.5">
                {COOKIE_TYPES.map(({ name, description, required }) => (
                  <div
                    key={name}
                    className="flex items-start gap-3 rounded-xl px-4 py-3"
                    style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                    }}
                  >
                    <Settings className="h-3.5 w-3.5 mt-0.5 shrink-0 text-cyber-muted" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[13px] font-heading font-semibold text-white">{name}</span>
                        {required && (
                          <span
                            className="text-[10px] rounded-full px-2 py-0.5"
                            style={{
                              background: 'rgba(16, 255, 168, 0.08)',
                              border: '1px solid rgba(16, 255, 168, 0.2)',
                              color: '#10FFA8',
                            }}
                          >
                            Required
                          </span>
                        )}
                      </div>
                      <p className="text-[12px] text-slate-500 leading-5">{description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="px-5 py-4 border-t border-white/8 flex items-center justify-end gap-3">
              <button
                onClick={onDecline}
                className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-[13px] font-heading font-medium text-cyber-muted hover:text-white transition-colors"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <XCircle className="h-3.5 w-3.5" />
                Essential Only
              </button>
              <button
                onClick={onAccept}
                className="analyze-btn flex items-center gap-1.5 rounded-xl px-5 py-2 text-[13px] font-heading font-semibold transition-all"
              >
                <CheckCircle className="h-3.5 w-3.5" />
                Accept All
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
