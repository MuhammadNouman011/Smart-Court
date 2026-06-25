import axios from 'axios'

const baseURL = import.meta.env.VITE_API_URL || ''

const api = axios.create({
  baseURL,
  timeout: 180_000,
})

const authHeader = () => {
  const t = localStorage.getItem('smartcourt:token')
  return t ? { Authorization: `Bearer ${t}` } : {}
}

export const Auth = {
  signup: (full_name, email, password) =>
    api.post('/api/auth/signup', { full_name, email, password }).then(r => r.data),
  login: (email, password) =>
    api.post('/api/auth/login', { email, password }).then(r => r.data),
  me: (token) =>
    api.get('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.data),
}

export const Sessions = {
  list: () => api.get('/api/sessions', { headers: authHeader() }).then(r => r.data),
  get:  (sid) => api.get(`/api/sessions/${sid}`, { headers: authHeader() }).then(r => r.data),
  delete: (sid) => api.delete(`/api/sessions/${sid}`, { headers: authHeader() }).then(r => r.data),
}

export const Chat = {
  send: (payload) => api.post('/api/chat', payload).then(r => r.data),
  history: (sid) => api.get(`/api/chat/history/${sid}`).then(r => r.data),
  detect: (text) => api.get('/api/chat/detect', { params: { text } }).then(r => r.data),

  /**
   * Server-Sent-Events streaming chat. Calls `handlers` as events arrive:
   *  - onSession({session_id})
   *  - onMeta({category, language, sources})
   *  - onChunk(textPiece)
   *  - onFinal({answer, citations, action_plan, case_strength, warning})
   *  - onError(message)
   *  Returns a Promise that resolves when the stream ends.
   */
  stream: async (payload, handlers = {}) => {
    const url = (baseURL || '') + '/api/chat/stream'
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!resp.ok || !resp.body) {
      const txt = await resp.text().catch(() => '')
      throw new Error(txt || `HTTP ${resp.status}`)
    }
    const reader = resp.body.getReader()
    const dec = new TextDecoder()
    let buf = ''
    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      buf += dec.decode(value, { stream: true })
      const frames = buf.split('\n\n')
      buf = frames.pop() || ''
      for (const frame of frames) {
        const line = frame.split('\n').find(l => l.startsWith('data: '))
        if (!line) continue
        let evt
        try { evt = JSON.parse(line.slice(6)) } catch { continue }
        switch (evt.type) {
          case 'session': handlers.onSession?.(evt); break
          case 'meta':    handlers.onMeta?.(evt.data); break
          case 'chunk':   handlers.onChunk?.(evt.data); break
          case 'final':   handlers.onFinal?.(evt.data); break
          case 'error':   handlers.onError?.(evt.message); break
        }
      }
    }
  },
}

export const Documents = {
  types: () => api.get('/api/documents/types').then(r => r.data),
  draft: (payload) => api.post('/api/documents/draft', payload).then(r => r.data),
  pdf:   (payload) => api.post('/api/documents/pdf',  payload, { responseType: 'blob' }).then(r => r.data),
  docx:  (payload) => api.post('/api/documents/docx', payload, { responseType: 'blob' }).then(r => r.data),
}

export const Scanner = {
  upload: (file, language='en') => {
    const fd = new FormData()
    fd.append('file', file)
    fd.append('language', language)
    return api.post('/api/scanner/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' }}).then(r => r.data)
  },
  text: (text, language='en') => api.post('/api/scanner/text', { text, language }).then(r => r.data),
}

export const Courtroom = {
  start: (case_summary, language='en') => api.post('/api/courtroom/start', { case_summary, language }).then(r => r.data),
  respond: (session_id, message, language='en') => api.post('/api/courtroom/respond', { session_id, message, language }).then(r => r.data),
  verdict: (session_id, language='en') => api.post('/api/courtroom/verdict', { session_id, language }).then(r => r.data),
}

export const Voice = {
  transcribe: (file, language=null) => {
    const fd = new FormData()
    fd.append('file', file)
    if (language) fd.append('language', language)
    return api.post('/api/voice/transcribe', fd, { headers: { 'Content-Type': 'multipart/form-data' }}).then(r => r.data)
  },
  ask: (file, language=null, session_id=null) => {
    const fd = new FormData()
    fd.append('file', file)
    if (language) fd.append('language', language)
    if (session_id) fd.append('session_id', session_id)
    return api.post('/api/voice/ask', fd, { headers: { 'Content-Type': 'multipart/form-data' }}).then(r => r.data)
  },
}

export const Inheritance = {
  calculate: (payload) => api.post('/api/inheritance/calculate', payload).then(r => r.data),
}

export const Health = {
  check: () => api.get('/health').then(r => r.data),
}

export default api
