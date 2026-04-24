import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, X, Send, Cpu, User } from 'lucide-react'
import { sendChat } from '../services/api'

const GREETING = "Hi! I'm the Web Intelligence assistant. Ask me anything about the app, how it works, or the developer."

export default function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([
    { role: 'assistant', content: GREETING },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
      inputRef.current?.focus()
    }
  }, [open, messages])

  async function handleSend() {
    const text = input.trim()
    if (!text || loading) return
    setInput('')

    const userMsg = { role: 'user', content: text }
    const next = [...messages, userMsg]
    setMessages(next)
    setLoading(true)

    try {
      const history = next.slice(0, -1).map(({ role, content }) => ({ role, content }))
      const { reply } = await sendChat(text, history)
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }])
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: "Sorry, I couldn't reach the server right now." },
      ])
    } finally {
      setLoading(false)
    }
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <>
      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed bottom-28 right-4 z-40 flex flex-col rounded-2xl overflow-hidden"
            style={{
              width: 340,
              height: 460,
              background: 'rgba(10, 22, 40, 0.98)',
              border: '1px solid rgba(0, 212, 255, 0.2)',
              boxShadow: '0 0 60px rgba(0, 212, 255, 0.1), 0 24px 64px rgba(0, 0, 0, 0.7)',
            }}
            initial={{ opacity: 0, y: 16, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.94 }}
            transition={{ type: 'spring', stiffness: 380, damping: 28 }}
          >
            {/* Header */}
            <div
              className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-white/8"
              style={{ background: 'rgba(15, 31, 58, 0.9)' }}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className="h-7 w-7 rounded-xl flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, rgba(0,212,255,0.2) 0%, rgba(139,92,246,0.18) 100%)', border: '1px solid rgba(0,212,255,0.28)' }}
                >
                  <Cpu className="h-3.5 w-3.5 text-cyber-cyan" />
                </div>
                <div>
                  <p className="font-heading font-semibold text-white text-[13px] leading-tight">Ask me anything</p>
                  <p className="text-[10px] text-cyber-muted">About the app & developer</p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="h-7 w-7 rounded-lg flex items-center justify-center text-cyber-muted hover:text-white hover:bg-white/8 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={['flex gap-2 items-start', msg.role === 'user' ? 'flex-row-reverse' : ''].join(' ')}
                >
                  <div
                    className="shrink-0 h-6 w-6 rounded-lg flex items-center justify-center mt-0.5"
                    style={
                      msg.role === 'assistant'
                        ? { background: 'linear-gradient(135deg, rgba(0,212,255,0.18) 0%, rgba(139,92,246,0.14) 100%)', border: '1px solid rgba(0, 212, 255, 0.25)' }
                        : { background: 'rgba(139, 92, 246, 0.15)', border: '1px solid rgba(139, 92, 246, 0.25)' }
                    }
                  >
                    {msg.role === 'assistant'
                      ? <Cpu className="h-3 w-3 text-cyber-cyan" />
                      : <User className="h-3 w-3 text-cyber-purple" />
                    }
                  </div>
                  <div
                    className="rounded-xl px-3 py-2 text-[12px] leading-5 max-w-[82%]"
                    style={
                      msg.role === 'assistant'
                        ? { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: '#CBD5E1' }
                        : { background: 'rgba(139, 92, 246, 0.12)', border: '1px solid rgba(139, 92, 246, 0.22)', color: '#EEF2FF' }
                    }
                  >
                    {msg.content}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex gap-2 items-start">
                  <div
                    className="shrink-0 h-6 w-6 rounded-lg flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg, rgba(0,212,255,0.18) 0%, rgba(139,92,246,0.14) 100%)', border: '1px solid rgba(0, 212, 255, 0.25)' }}
                  >
                    <Cpu className="h-3 w-3 text-cyber-cyan" />
                  </div>
                  <div
                    className="rounded-xl px-3 py-2"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
                  >
                    <div className="flex gap-1 items-center h-4">
                      {[0, 1, 2].map((i) => (
                        <motion.span
                          key={i}
                          className="h-1.5 w-1.5 rounded-full bg-cyber-cyan/60"
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="shrink-0 px-3 py-3 border-t border-white/8">
              <div className="flex gap-2 items-end">
                <textarea
                  ref={inputRef}
                  rows={1}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder="Ask about the app…"
                  className="flex-1 resize-none rounded-xl px-3 py-2 text-[12px] leading-5 input-cyber"
                  style={{ maxHeight: 80, overflowY: 'auto' }}
                  disabled={loading}
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || loading}
                  className="shrink-0 h-8 w-8 rounded-xl flex items-center justify-center analyze-btn disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating toggle button */}
      <motion.button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-14 right-4 z-40 h-12 w-12 rounded-2xl flex items-center justify-center analyze-btn shadow-lg"
        style={{ boxShadow: '0 0 24px rgba(0, 212, 255, 0.3), 0 0 60px rgba(139,92,246,0.12), 0 8px 32px rgba(0,0,0,0.5)' }}
        whileHover={{ scale: 1.1, boxShadow: '0 0 32px rgba(0,212,255,0.45), 0 8px 40px rgba(0,0,0,0.6)' }}
        whileTap={{ scale: 0.93 }}
        title="Ask about Web Intelligence"
      >
        <AnimatePresence mode="wait">
          {open
            ? <motion.span key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}><X className="h-5 w-5" /></motion.span>
            : <motion.span key="c" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}><Sparkles className="h-5 w-5" /></motion.span>
          }
        </AnimatePresence>
      </motion.button>
    </>
  )
}
