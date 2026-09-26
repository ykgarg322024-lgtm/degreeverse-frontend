import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { workerFetch } from '../lib/supabase'

export default function WhatsApp({ toast }) {
  const [session, setSession] = useState(null)
  const [qr, setQr] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadSession()
    const unsub = supabase.channel('wa-session')
      .on('postgres_changes', { event:'UPDATE', schema:'public', table:'whatsapp_sessions', filter:'session_key=eq.main' }, p => setSession(p.new))
      .subscribe()
    return () => supabase.removeChannel(unsub)
  }, [])

  async function loadSession() {
    const { data } = await supabase.from('whatsapp_sessions').select('*').eq('session_key','main').single()
    setSession(data)
  }

  async function connect() {
    setLoading(true)
    try {
      await workerFetch('/connect', { method:'POST' })
      toast('Connecting to WhatsApp...', 'info')
      setTimeout(async () => {
        const r = await workerFetch('/qr')
        if (r.qr) setQr(r.qr)
        setLoading(false)
      }, 3000)
    } catch(e) { toast('Worker error: ' + e.message, 'error'); setLoading(false) }
  }

  async function disconnect() {
    if (!confirm('Disconnect WhatsApp? Campaigns will be paused.')) return
    try {
      await workerFetch('/disconnect', { method:'POST' })
      toast('WhatsApp disconnected', 'warning')
      loadSession()
    } catch(e) { toast('Error: ' + e.message, 'error') }
  }

  const connected = session?.status === 'connected'

  return (
    <div style={{ padding:24 }}>
      <div style={{ marginBottom:24 }}>
        <div style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontSize:24, fontWeight:800, color:'#0d1b3e' }}>WhatsApp Connection</div>
        <div style={{ fontSize:13, color:'#4a5a8a' }}>Connect your WhatsApp account to send messages</div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'460px 1fr', gap:20, alignItems:'start' }}>
        <div style={{ background:'white', borderRadius:12, border:'1px solid #e8eeff', boxShadow:'0 1px 3px rgba(13,27,62,0.08)', overflow:'hidden' }}>
          <div style={{ padding:'18px 20px 14px', borderBottom:'1px solid #e8eeff', display:'flex', alignItems:'center', gap:12 }}>
            <span style={{ fontSize:20 }}>💬</span>
            <div style={{ fontSize:15, fontWeight:700, color:'#0d1b3e' }}>WhatsApp Web</div>
            <span style={{ marginLeft:'auto', background: connected ? '#d1fae5' : '#fee2e2', color: connected ? '#065f46' : '#991b1b', padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:600 }}>
              {connected ? '● Connected' : '● Disconnected'}
            </span>
          </div>

          {connected ? (
            <div style={{ padding:36, textAlign:'center' }}>
              <div style={{ fontSize:60, marginBottom:16 }}>✅</div>
              <div style={{ fontSize:18, fontWeight:700, color:'#0d1b3e', marginBottom:6 }}>WhatsApp Connected</div>
              <div style={{ fontSize:13, color:'#4a5a8a', marginBottom:24 }}>Session active · Worker running</div>
              {session?.phone_number && <div style={{ fontSize:13, color:'#4a5a8a', marginBottom:16 }}>📱 +{session.phone_number}</div>}
              <div style={{ display:'flex', gap:10, justifyContent:'center' }}>
                <button onClick={disconnect} style={{ padding:'9px 18px', background:'white', color:'#0d1b3e', border:'1.5px solid #d1daf5', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer' }}>🔌 Disconnect</button>
              </div>
            </div>
          ) : (
            <div style={{ padding:32, display:'flex', flexDirection:'column', alignItems:'center', gap:20 }}>
              <p style={{ fontSize:13, color:'#4a5a8a', textAlign:'center' }}>Scan QR code with your WhatsApp app to connect</p>
              {qr ? (
                <>
                  <img src={qr} alt="QR Code" style={{ width:200, height:200, borderRadius:12, border:'3px solid #0d1b3e' }} />
                  <div style={{ fontSize:13, color:'#4a5a8a', textAlign:'center', lineHeight:1.6 }}>
                    Open <strong>WhatsApp</strong> → <strong>Settings</strong> → <strong>Linked Devices</strong> → <strong>Link a Device</strong>
                  </div>
                </>
              ) : (
                <div style={{ width:200, height:200, borderRadius:12, border:'2px dashed #d1daf5', display:'flex', alignItems:'center', justifyContent:'center', color:'#8a97bb', fontSize:13 }}>
                  {loading ? 'Generating QR...' : 'QR code will appear here'}
                </div>
              )}
              <button onClick={connect} disabled={loading} style={{ padding:'10px 24px', background:'#1a3fa8', color:'white', border:'none', borderRadius:8, fontSize:14, fontWeight:600, cursor:'pointer' }}>
                {loading ? '⏳ Connecting...' : '🔗 Connect WhatsApp'}
              </button>
            </div>
          )}
        </div>

        <div style={{ background:'white', borderRadius:12, border:'1px solid #e8eeff', boxShadow:'0 1px 3px rgba(13,27,62,0.08)', padding:20 }}>
          <div style={{ fontSize:15, fontWeight:700, color:'#0d1b3e', marginBottom:16 }}>⚙️ Worker Status</div>
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {[
              ['Status', connected ? '🟢 Connected' : '🔴 Disconnected'],
              ['Session Key', session?.session_key || 'main'],
              ['Last Heartbeat', session?.last_heartbeat ? new Date(session.last_heartbeat).toLocaleString('en-IN') : '—'],
              ['Connected At', session?.connected_at ? new Date(session.connected_at).toLocaleString('en-IN') : '—'],
              ['Worker URL', 'yash-whatsapp-worker.onrender.com'],
            ].map(([k,v]) => (
              <div key={k} style={{ display:'flex', justifyContent:'space-between', padding:'10px 14px', background:'#f0f4ff', borderRadius:8, fontSize:13 }}>
                <span style={{ color:'#4a5a8a' }}>{k}</span>
                <span style={{ fontWeight:600 }}>{v}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop:16, padding:14, background:'#fef3c7', borderRadius:8, fontSize:12, color:'#92400e' }}>
            ⚠️ Keep your phone connected to internet at all times for WhatsApp to work.
          </div>
        </div>
      </div>
    </div>
  )
}
