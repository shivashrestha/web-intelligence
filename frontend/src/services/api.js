const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

function _extractDetail(detail) {
  if (!detail) return null
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail)) {
    // FastAPI validation error array: [{loc, msg, type}, ...]
    return detail.map((e) => e.msg || JSON.stringify(e)).join('; ')
  }
  return JSON.stringify(detail)
}

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(_extractDetail(data.detail) || data.message || 'Request failed')
  }
  return data
}

export async function processUrls(urls, sessionId) {
  return request('/api/process', {
    method: 'POST',
    body: JSON.stringify({ urls, session_id: sessionId }),
  })
}

export async function askQuestion(sessionId, question, topK = 5) {
  return request('/api/ask', {
    method: 'POST',
    body: JSON.stringify({ session_id: sessionId, question, top_k: topK }),
  })
}

export async function loadInsights(sessionId) {
  return request(`/api/insights/${sessionId}`)
}

export async function loadSources(sessionId) {
  return request(`/api/session/${sessionId}/sources`)
}

export async function loadMedia(sessionId) {
  return request(`/api/session/${sessionId}/media`)
}

export async function loadSessions() {
  return request('/api/sessions')
}

export async function deleteSession(sessionId) {
  return request(`/api/sessions/${sessionId}`, { method: 'DELETE' })
}

export async function clearAllSessions() {
  return request('/api/sessions', { method: 'DELETE' })
}

export async function loadExampleQueries() {
  return request('/api/example-queries')
}
