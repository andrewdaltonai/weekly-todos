import { useState } from 'react'
import { supabase } from './supabase'

export default function Auth() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin() {
    if (!email.trim()) return
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.origin }
    })
    if (error) setError(error.message)
    else setSent(true)
    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#0f0f0f', display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: 24,
      fontFamily: "'DM Mono', 'Courier New', monospace"
    }}>
      <div style={{ width: '100%', maxWidth: 360 }}>
        <div style={{ marginBottom: 48 }}>
          <div style={{ fontSize: 11, color: '#555', letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 10 }}>
            weekly todos
          </div>
          <div style={{ fontSize: 28, color: '#f0ede8', fontWeight: 300, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
            {sent ? 'check your email' : 'sign in'}
          </div>
        </div>

        {sent ? (
          <div>
            <div style={{ fontSize: 13, color: '#666', lineHeight: 1.7, marginBottom: 32 }}>
              a magic link has been sent to<br />
              <span style={{ color: '#f0ede8' }}>{email}</span>
            </div>
            <div style={{ fontSize: 11, color: '#444', letterSpacing: '0.06em' }}>
              click the link to sign in — no password needed.<br />
              you can close this tab.
            </div>
            <button onClick={() => setSent(false)} style={{
              marginTop: 32, background: 'none', border: 'none',
              color: '#555', fontSize: 11, cursor: 'pointer',
              fontFamily: 'inherit', letterSpacing: '0.08em',
              textTransform: 'uppercase', padding: 0
            }}>
              ← use a different email
            </button>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: 12, color: '#555', marginBottom: 24, lineHeight: 1.6 }}>
              enter your email — we'll send a magic link.<br />
              no password, works on any device.
            </div>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              placeholder="your@email.com"
              style={{
                width: '100%', background: '#161616', border: '1px solid #252525',
                borderRadius: 10, padding: '13px 16px', color: '#f0ede8',
                fontSize: 14, fontFamily: 'inherit', outline: 'none',
                marginBottom: 10
              }}
            />
            {error && <div style={{ fontSize: 11, color: '#e05c5c', marginBottom: 10 }}>{error}</div>}
            <button
              onClick={handleLogin}
              disabled={loading || !email.trim()}
              style={{
                width: '100%', background: email.trim() && !loading ? '#f0ede8' : '#1a1a1a',
                color: email.trim() && !loading ? '#0f0f0f' : '#444',
                border: 'none', borderRadius: 10, padding: '13px',
                fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
                letterSpacing: '0.1em', textTransform: 'uppercase',
                transition: 'all 0.15s'
              }}
            >
              {loading ? 'sending...' : 'send magic link'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
