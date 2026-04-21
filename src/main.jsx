import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import Auth from './Auth'
import App from './App'

function Root() {
  const [session, setSession] = useState(undefined) // undefined = loading

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  if (session === undefined) return (
    <div style={{ minHeight: '100vh', background: '#0f0f0f', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Mono', monospace", color: '#555', fontSize: 14 }}>
      loading...
    </div>
  )

  return session ? <App user={session.user} /> : <Auth />
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Root />
  </StrictMode>
)
