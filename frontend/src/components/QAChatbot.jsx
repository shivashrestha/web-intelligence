import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageSquare, X, ArrowUp, Loader2, Bot, User, Zap, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react'
import { askQuestion } from '../services/api'

const QUICK_PROMPTS = [
  'Summarize this website',
  'What is the business model?',
  'Who is the target audience?',
  'What are the key features?',
]

// ── Inline markdown renderer ─────────────────────────────────────────────────
function renderInline(str, keyPrefix) {
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*|\[Source \d+\])/g
  const parts = []
  let last = 0, i = 0, match
  while ((match = regex.exec(str)) !== null) {
    if (match.index > last) parts.push(str.slice(last, match.index))
    const m = match[0]
    if (m.startsWith('**'))
      parts.push(<strong key={`${keyPrefix}-b${i++}`} className="text-white font-semibold">{m.slice(2, -2)}</strong>)
    else if (m.startsWith('*'))
      parts.push(<em key={`${keyPrefix}-i${i++}`} className="text-slate-300 not-italic font-medium">{m.slice(1, -1)}</em>)
    else
      parts.push(
        <span key={`${keyPrefix}-c${i++}`} className="inline-flex items-center px-1.5 py-0.5 mx-0.5 rounded text-[10px] font-mono bg-cyber-cyan/10 text-cyber-cyan border border-cyber-cyan/20">
          {m}
        </span>
      )
    last = match.index + m.length
  }
  if (last < str.length) parts.push(str.slice(last))
  return parts.length ? parts : str
}

function MarkdownContent({ text }) {
  const lines = text.split('\n')
  const elements = []
  let listItems = [], key = 0
  function flushList() {
    if (!listItems.length) return
    elements.push(<ul key={key++} className="space-y-1 my-1.5 pl-4 list-disc list-outside">{listItems}</ul>)
    listItems = []
  }
  for (const line of lines) {
    const t = line.trim()
    if (!t) { flushList(); continue }
    if (/^#{1,6}\s/.test(t)) {
      flushList()
      elements.push(<p key={key++} className="text-white font-semibold text-sm mt-2 mb-0.5">{renderInline(t.replace(/^#{1,6}\s/, ''), `h${key}`)}</p>)
    } else if (/^[-*•]\s/.test(t)) {
      listItems.push(<li key={key++} className="text-slate-300 text-sm leading-6 marker:text-cyber-cyan">{renderInline(t.replace(/^[-*•]\s/, ''), `li${key}`)}</li>)
    } else {
      flushList()
      elements.push(<p key={key++} className="text-slate-300 text-sm leading-7">{renderInline(t, `p${key}`)}</p>)
    }
  }
  flushList()
  return <div className="space-y-1">{elements}</div>
}

// ── Source URL list ───────────────────────────────────────────────────────────
function SourceList({ sources }) {
  const unique = []
  const seen = new Set()
  for (const s of (sources || [])) {
    const url = s.anchor_url || s.url
    if (url && !seen.has(url)) { seen.add(url); unique.push({ url, title: s.title || s.section_title || '' }) }
  }
  if (!unique.length) return null
  return (
    <div className="mt-2 pt-2 border-t border-white/6">
      <p className="text-[10px] text-cyber-muted mb-1.5 uppercase tracking-widest">Sources</p>
      <div className="flex flex-col gap-1">
        {unique.slice(0, 4).map((s, i) => (
          <a
            key={i}
            href={s.url}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 text-[11px] text-cyber-cyan/70 hover:text-cyber-cyan transition-colors truncate"
          >
            <ExternalLink className="h-3 w-3 shrink-0" />
            <span className="truncate">{s.url}</span>
          </a>
        ))}
      </div>
    </div>
  )
}

// ── Message bubble ───────────────────────────────────────────────────────────
function Message({ msg }) {
  const isUser = msg.role === 'user'
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className={['flex gap-3', isUser ? 'justify-end' : 'justify-start'].join(' ')}>
      {!isUser && (
        <div className="h-8 w-8 rounded-xl bg-cyber-cyan/10 border border-cyber-cyan/20 flex items-center justify-center shrink-0 mt-0.5">
          <Bot className="h-4 w-4 text-cyber-cyan" />
        </div>
      )}
      <div className={['max-w-[82%]', isUser ? 'items-end' : 'items-start'].join(' ')}>
        <div className={[
          'rounded-2xl px-4 py-3 text-sm',
          isUser
            ? 'bg-cyber-cyan/10 border border-cyber-cyan/20 text-white rounded-tr-sm'
            : 'glass text-slate-200 rounded-tl-sm',
        ].join(' ')}>
          {!isUser && (
            <div className="flex items-center justify-between mb-2 -mt-0.5">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-cyber-muted">AI Answer</span>
              <button
                onClick={() => setCollapsed(v => !v)}
                className="flex items-center gap-1 text-[10px] text-cyber-muted hover:text-cyber-cyan transition-colors rounded px-1.5 py-0.5 hover:bg-cyber-cyan/10"
              >
                {collapsed ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />}
                {collapsed ? 'Show' : 'Hide'}
              </button>
            </div>
          )}
          {!collapsed && (
            isUser
              ? <p className="whitespace-pre-wrap">{msg.content}</p>
              : <>
                  <MarkdownContent text={msg.content} />
                  <SourceList sources={msg.sources} />
                </>
          )}
          {collapsed && <p className="text-cyber-muted text-xs italic">Response hidden</p>}
        </div>
      </div>
      {isUser && (
        <div className="h-8 w-8 rounded-xl bg-cyber-purple/10 border border-cyber-purple/20 flex items-center justify-center shrink-0 mt-0.5">
          <User className="h-4 w-4 text-cyber-purple" />
        </div>
      )}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function QAChatbot({ sessionId, sessionReady }) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [question, setQuestion] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
      inputRef.current?.focus()
    }
  }, [open, messages.length])

  const canSend = sessionReady && question.trim().length >= 3 && !loading

  async function handleAsk() {
    if (!canSend) return
    const q = question.trim()
    setQuestion('')
    setLoading(true)
    setMessages(prev => [...prev, { role: 'user', content: q, sources: [] }])
    try {
      const res = await askQuestion(sessionId, q)
      setMessages(prev => [...prev, { role: 'assistant', content: res.answer, sources: res.sources || [] }])
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${e.message || 'Failed to get an answer.'}`, sources: [] }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Large Q&A modal */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:justify-end p-0 sm:p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          >
            <motion.div
              className="flex flex-col rounded-t-3xl sm:rounded-3xl overflow-hidden w-full sm:w-[680px]"
              style={{
                height: 'min(90vh, 700px)',
                background: 'rgba(6,16,32,0.98)',
                border: '1px solid rgba(0,212,255,0.22)',
                boxShadow: '0 0 80px rgba(0,212,255,0.12), 0 32px 80px rgba(0,0,0,0.8)',
              }}
              initial={{ opacity: 0, y: 40, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 340, damping: 28 }}
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div
                className="shrink-0 flex items-center justify-between px-5 py-4 border-b border-white/8"
                style={{ background: 'rgba(10,22,40,0.95)' }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="h-9 w-9 rounded-2xl flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg, rgba(0,212,255,0.22) 0%, rgba(139,92,246,0.18) 100%)', border: '1px solid rgba(0,212,255,0.3)' }}
                  >
                    <MessageSquare className="h-4 w-4 text-cyber-cyan" />
                  </div>
                  <div>
                    <p className="font-heading font-bold text-white text-[15px] leading-tight">Site Q&amp;A</p>
                    <p className="text-[11px] text-cyber-muted">Ask anything about the analysed website</p>
                  </div>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="h-8 w-8 rounded-xl flex items-center justify-center text-cyber-muted hover:text-white hover:bg-white/8 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                {messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full gap-3 text-center pb-8">
                    <div
                      className="h-14 w-14 rounded-3xl flex items-center justify-center"
                      style={{ background: 'linear-gradient(135deg, rgba(0,212,255,0.15) 0%, rgba(139,92,246,0.12) 100%)', border: '1px solid rgba(0,212,255,0.2)' }}
                    >
                      <MessageSquare className="h-6 w-6 text-cyber-cyan/60" />
                    </div>
                    <p className="text-cyber-muted text-sm">Ask anything about the website you've analysed.</p>
                  </div>
                )}
                {messages.map((msg, idx) => <Message key={idx} msg={msg} />)}
                {loading && (
                  <div className="flex gap-3">
                    <div className="h-8 w-8 rounded-xl bg-cyber-cyan/10 border border-cyber-cyan/20 flex items-center justify-center shrink-0">
                      <Bot className="h-4 w-4 text-cyber-cyan" />
                    </div>
                    <div className="glass rounded-2xl rounded-tl-sm px-4 py-3">
                      <div className="flex gap-1.5 items-center">
                        {[0, 1, 2].map(i => (
                          <span key={i} className="h-1.5 w-1.5 rounded-full bg-cyber-cyan animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <div className="shrink-0 border-t border-white/6 bg-cyber-bg/60 backdrop-blur-sm px-5 pt-3 pb-4 space-y-2.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <Zap className="h-3.5 w-3.5 text-cyber-cyan shrink-0" />
                  {QUICK_PROMPTS.map(q => (
                    <button
                      key={q}
                      onClick={() => { setQuestion(q); inputRef.current?.focus() }}
                      className="rounded-full text-[11px] px-2.5 py-0.5 border border-cyber-cyan/20 bg-cyber-cyan/5 text-cyber-muted hover:text-cyber-cyan hover:border-cyber-cyan/40 transition-all"
                    >
                      {q}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    ref={inputRef}
                    value={question}
                    onChange={e => setQuestion(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && canSend && handleAsk()}
                    placeholder={sessionReady ? 'Ask anything about the processed site…' : 'Process a URL first to enable chat'}
                    disabled={!sessionReady}
                    className="input-cyber flex-1 rounded-xl px-4 py-3 text-sm"
                  />
                  <button
                    onClick={handleAsk}
                    disabled={!canSend}
                    className="rounded-xl px-4 py-3 bg-gradient-cyber text-[#030B18] font-semibold hover:shadow-glow-cyan disabled:opacity-40 disabled:cursor-not-allowed transition-all shrink-0"
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating toggle button — clearly visible, bottom-right */}
      <motion.button
        onClick={() => setOpen(v => !v)}
        className="fixed bottom-6 right-6 z-40 h-14 w-14 rounded-2xl flex items-center justify-center analyze-btn shadow-lg"
        style={{
          boxShadow: open
            ? '0 0 32px rgba(0,212,255,0.5), 0 8px 40px rgba(0,0,0,0.6)'
            : '0 0 24px rgba(0,212,255,0.3), 0 0 60px rgba(139,92,246,0.12), 0 8px 32px rgba(0,0,0,0.5)',
        }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.93 }}
        title="Ask questions about this site"
      >
        <AnimatePresence mode="wait">
          {open
            ? <motion.span key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}><X className="h-6 w-6" /></motion.span>
            : <motion.span key="c" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}><MessageSquare className="h-6 w-6" /></motion.span>
          }
        </AnimatePresence>
      </motion.button>
    </>
  )
}
