import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Reports({ toast }) {
  const [stats, setStats] = useState({ sent:0, failed:0, replies:0, converted:0 })

  useEffect(() => { load() }, [])

  async function load() {
    const today = new Date().toISOString().split('T')[0]
    const { data: logs } = await supabase.from('message_logs').select('status').gte('created_at', today)
    const { count: replies } = await supabase.from('replies').select('*', { count:'exact', head:true })
    const { count: converted } = await supabase.from('leads').select('*', { count:'exact', head:true }).eq('status','converted')
    setStats({
      sent: logs?.filter(l=>l.status==='sent').length || 0,
      failed: logs?.filter(l=>l.status==='failed').length || 0,
      replies: replies || 0,
      converted: converted || 0
    })
  }

  const kpis = [
    { label:'Sent Today', value:stats.sent, color:'#1a3fa8' },
    { label:'Failed Today', value:stats.failed, color:'#dc2626' },
    { label:'Total Replies', value:stats.replies, color:'#7c3aed' },
    { label:'Converted', value:stats.converted, color:'#c9a227' },
  ]

  return (
    <div style={{ padding:24 }}>
      <div style={{ marginBottom:24 }}>
        <div style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontSize:24, fontWeight:800, color:'#0d1b3e' }}>Reports</div>
        <div style={{ fontSize:13, color:'#4a5a8a' }}>Analytics and performance overview</div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))', gap:16 }}>
        {kpis.map(k => (
          <div key={k.label} style={{ background:'white', borderRadius:12, padding:20, border:'1px solid #e8eeff', borderTop:`3px solid ${k.color}` }}>
            <div style={{ fontSize:11, fontWeight:600, color:'#8a97bb', textTransform:'uppercase', marginBottom:8 }}>{k.label}</div>
            <div style={{ fontSize:32, fontWeight:800, color:'#0d1b3e', fontFamily:'Plus Jakarta Sans,sans-serif' }}>{k.value}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
