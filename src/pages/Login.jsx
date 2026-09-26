import React, { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Login({ toast }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError(error.message)
    setLoading(false)
  }

  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg,#0d1b3e 0%,#162454 50%,#1a3fa8 100%)', display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
      <div style={{ background:'white', borderRadius:20, padding:48, width:'100%', maxWidth:440, boxShadow:'0 24px 80px rgba(0,0,0,0.25)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:32 }}>
          <div style={{ width:48, height:48, background:'linear-gradient(135deg,#1a3fa8,#0d1b3e)', borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22 }}>💬</div>
          <div>
            <div style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontSize:22, fontWeight:800, color:'#0d1b3e' }}>Yash WhatsApp</div>
            <div style={{ fontSize:11, color:'#c9a227', fontWeight:600, letterSpacing:1, textTransform:'uppercase' }}>Campaign Manager</div>
          </div>
        </div>

        <h1 style={{ fontSize:26, fontWeight:700, color:'#0d1b3e', marginBottom:6 }}>Welcome back</h1>
        <p style={{ fontSize:14, color:'#4a5a8a', marginBottom:32 }}>Sign in to your admin account</p>

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom:18 }}>
            <label style={{ display:'block', fontSize:13, fontWeight:600, color:'#4a5a8a', marginBottom:6 }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="admin@example.com"
              required
              style={{ width:'100%', padding:'12px 16px', border:'1.5px solid #d1daf5', borderRadius:8, fontSize:14, fontFamily:'Inter,sans-serif', color:'#0d1b3e' }}
            />
          </div>
          <div style={{ marginBottom:24 }}>
            <label style={{ display:'block', fontSize:13, fontWeight:600, color:'#4a5a8a', marginBottom:6 }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={{ width:'100%', padding:'12px 16px', border:'1.5px solid #d1daf5', borderRadius:8, fontSize:14, fontFamily:'Inter,sans-serif', color:'#0d1b3e' }}
            />
          </div>
          {error && <div style={{ padding:'10px 14px', background:'#fee2e2', color:'#991b1b', borderRadius:8, fontSize:13, marginBottom:16 }}>⚠️ {error}</div>}
          <button
            type="submit"
            disabled={loading}
            style={{ width:'100%', padding:13, background:'linear-gradient(135deg,#1a3fa8,#0d1b3e)', color:'white', border:'none', borderRadius:8, fontSize:15, fontWeight:600, cursor:'pointer', fontFamily:'Inter,sans-serif' }}
          >
            {loading ? 'Signing in...' : 'Sign in to Dashboard'}
          </button>
        </form>
      </div>
    </div>
  )
}
