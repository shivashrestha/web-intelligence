import { useEffect, useRef, useState } from 'react'
import { ArrowUp, Loader2, Bot, User, Zap, ChevronDown, ChevronUp } from 'lucide-react'

const QUICK_PROMPTS = [
  'Summarize this website',
  'What is the business model?',
  'Who is the target audience?',
  'What are the key features?',
]

// ── Lightweight markdown renderer ─────────────────────────────────────────
function renderInline(str, keyPrefix) {
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*|\[Source \d+\])/g
  const parts = []
  let last = 0
  let i = 0
  let match
  while ((match = regex.exec(str)) !== null) {
    if (match.index > last) parts.push(str.slice(last, match.index))
    const m = match[0]
    if (m.startsWith('**')) {
      parts.push(<strong key={`${keyPrefix}-b${i++}`} className="text-white font-semibold">{m.slice(2, -2)}</strong>)
    } else if (m.startsWith('*')) {
      parts.push(<em key={`${keyPrefix}-i${i++}`} className="text-slate-300 not-italic font-medium">{m.slice(1, -1)}</em>)
    } else {
      parts.push(
        <span key={`${keyPrefix}-c${i++}`} className="inline-flex items-center px-1.5 py-0.5 mx-0.5 rounded text-[10px] font-mono bg-cyber-cyan/10 text-cyber-cyan border border-cyber-cyan/20">
          {m}
        </span>
      )
    }
    last = match.index + m.length
  }
  if (last < str.length) parts.push(str.slice(last))
  return parts.length ? parts : str
}

function MarkdownContent({ text }) {
  const lines = text.split('\n')
  const elements = []
  let listItems = []
  let key = 0

  function flushList() {
    if (listItems.length === 0) return
    elements.push(
      <ul key={key++} className="space-y-1 my-2 pl-4 list-disc list-outside">
        {listItems}
      </ul>
    )
    listItems = []
  }

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) { flushList(); continue }

    if (/^#{1,6}\s/.test(trimmed)) {
      flushList()
      const hText = trimmed.replace(/^#{1,6}\s/, '')
      elements.push(
        <p key={key++} className="text-white font-semibold text-sm mt-3 mb-0.5">
          {renderInline(hText, `h${key}`)}
        </p>
      )
    } else if (/^[-*•]\s/.test(trimmed)) {
      const item = trimmed.replace(/^[-*•]\s/, '')
      listItems.push(
        <li key={key++} className="text-slate-300 text-sm leading-6 marker:text-cyber-cyan">
          {renderInline(item, `li${key}`)}
        </li>
      )
    } else if (/^\d+\.\s/.test(trimmed)) {
      const item = trimmed.replace(/^\d+\.\s/, '')
      listItems.push(
        <li key={key++} className="text-slate-300 text-sm leading-6 marker:text-cyber-cyan">
          {renderInline(item, `li${key}`)}
        </li>
      )
    } else {
      flushList()
      elements.push(
        <p key={key++} className="text-slate-300 text-sm leading-7">
          {renderInline(trimmed, `p${key}`)}
        </p>
      )
    }
  }
  flushList()
  return <div className="space-y-1">{elements}</div>
}

// ── Message bubble ────────────────────────────────────────────────────────
function Message({ msg }) {
  const isUser = msg.role === 'user'
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className={['flex gap-3 animate-slide-up', isUser ? 'justify-end' : 'justify-start'].join(' ')}>
      {!isUser && (
        <div className="h-8 w-8 rounded-xl bg-cyber-cyan/10 border border-cyber-cyan/20 flex items-center justify-center shrink-0 mt-0.5">
          <Bot className="h-4 w-4 text-cyber-cyan" />
        </div>
      )}

      <div className={['max-w-[80%] space-y-2', isUser ? 'items-end' : 'items-start'].join(' ')}>
        <div
          className={[
            'rounded-2xl px-4 py-3 text-sm',
            isUser
              ? 'bg-cyber-cyan/10 border border-cyber-cyan/20 text-white rounded-tr-sm'
              : 'glass text-slate-200 rounded-tl-sm',
          ].join(' ')}
        >
          {!isUser && (
            <div className="flex items-center justify-between mb-2 -mt-0.5">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-cyber-muted">AI Response</span>
              <button
                onClick={() => setCollapsed((v) => !v)}
                className="flex items-center gap-1 text-[10px] text-cyber-muted hover:text-cyber-cyan transition-colors rounded px-1.5 py-0.5 hover:bg-cyber-cyan/10"
              >
                {collapsed ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />}
                {collapsed ? 'Show' : 'Hide'}
              </button>
            </div>
          )}

          {!collapsed && msg.content && (
            isUser
              ? <p className="whitespace-pre-wrap">{msg.content}</p>
              : <MarkdownContent text={msg.content} />
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

// ── Chat panel (fills its container; input pinned to bottom) ──────────────
export default function ChatPanel({ messages, question, onQuestionChange, onAsk, loading, sessionReady, siteTheme }) {
  const canSend = sessionReady && question.trim().length >= 3 && !loading
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length, loading])

  return (
    <div className="h-full flex flex-col">

      {/* Scrollable message thread */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {messages.map((msg, idx) => (
          <Message key={idx} msg={msg} />
        ))}

        {loading && (
          <div className="flex gap-3 animate-fade-in">
            <div className="h-8 w-8 rounded-xl bg-cyber-cyan/10 border border-cyber-cyan/20 flex items-center justify-center shrink-0">
              <Bot className="h-4 w-4 text-cyber-cyan" />
            </div>
            <div className="glass rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex gap-1.5 items-center">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="h-1.5 w-1.5 rounded-full bg-cyber-cyan animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input area — pinned to bottom */}
      <div className="shrink-0 border-t border-white/6 bg-cyber-bg/60 backdrop-blur-sm px-4 pt-3 pb-4 space-y-2.5">
        {/* Quick prompts */}
        <div className="flex items-center gap-2 flex-wrap">
          <Zap className="h-3.5 w-3.5 text-cyber-cyan shrink-0" />
          {QUICK_PROMPTS.map((q) => (
            <button
              key={q}
              onClick={() => onQuestionChange(q)}
              className="rounded-full text-[11px] px-2.5 py-0.5 border border-cyber-cyan/20 bg-cyber-cyan/5 text-cyber-muted hover:text-cyber-cyan hover:border-cyber-cyan/40 transition-all"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Text input */}
        <div className="flex gap-2">
          <input
            value={question}
            onChange={(e) => onQuestionChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && canSend && onAsk()}
            placeholder={sessionReady ? 'Ask anything about the processed site…' : 'Process a URL first to enable chat'}
            disabled={!sessionReady}
            className="input-cyber flex-1 rounded-xl px-4 py-3 text-sm"
          />
          <button
            onClick={onAsk}
            disabled={!canSend}
            className="rounded-xl px-4 py-3 bg-gradient-cyber text-[#030B18] font-semibold hover:shadow-glow-cyan disabled:opacity-40 disabled:cursor-not-allowed transition-all shrink-0"
            aria-label="Send"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  )
}
