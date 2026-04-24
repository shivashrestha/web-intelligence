const LS_KEY = 'wi_sessions'

function encode(data) {
  return btoa(encodeURIComponent(JSON.stringify(data)))
}

function decode(str) {
  try {
    return JSON.parse(decodeURIComponent(atob(str)))
  } catch {
    return null
  }
}

export function loadLocalSessions() {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return []
    const data = decode(raw)
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

export function saveLocalSession(session) {
  const { session_id, title, urls, created_at } = session
  const entry = { session_id, title, urls, created_at }
  const existing = loadLocalSessions()
  const filtered = existing.filter((s) => s.session_id !== session_id)
  const updated = [entry, ...filtered]
  localStorage.setItem(LS_KEY, encode(updated))
}

export function removeLocalSession(sessionId) {
  const updated = loadLocalSessions().filter((s) => s.session_id !== sessionId)
  localStorage.setItem(LS_KEY, encode(updated))
}

export function clearLocalSessions() {
  localStorage.removeItem(LS_KEY)
}

export function mergeSessionLists(backendSessions, localSessions) {
  return backendSessions
}

// ── Artifact cache (insights + media + sources per session) ───────────────
const ART_TTL = 30 * 60 * 1000 // 30 min
const ART_MAX_BYTES = 2 * 1024 * 1024 // 2 MB guard

function artKey(sid) { return `wi_art_${sid}` }

export function loadCachedArtifacts(sid) {
  try {
    const raw = localStorage.getItem(artKey(sid))
    if (!raw) return null
    const data = JSON.parse(raw)
    if (Date.now() - (data.cachedAt || 0) > ART_TTL) {
      localStorage.removeItem(artKey(sid))
      return null
    }
    return data
  } catch {
    return null
  }
}

export function saveCachedArtifacts(sid, payload) {
  try {
    const str = JSON.stringify({ ...payload, cachedAt: Date.now() })
    if (str.length > ART_MAX_BYTES) return
    localStorage.setItem(artKey(sid), str)
  } catch {}
}

export function removeCachedArtifacts(sid) {
  try { localStorage.removeItem(artKey(sid)) } catch {}
}

export function clearAllCachedArtifacts() {
  try {
    Object.keys(localStorage)
      .filter((k) => k.startsWith('wi_art_'))
      .forEach((k) => localStorage.removeItem(k))
  } catch {}
}
