import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function History({ toast }) {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('message_logs')
      .select('*, leads(full_name,mobile), campaigns(name), message_templates(name)')
      .order('created_at', { ascending: false })
      .limit(100)
    setLogs(data || [])
    setLoading(false)
  }

  function statusBadge(s) {
    const m = { sent:{bg:'#dcfce7',color:'#15803d',label:'✓ Sent'}, failed:{bg:'#fee2e2',color:'#991b1b',label:'✗ Failed'}, cancelled:{bg:'#f3f4f6',color:'#4b5563',label:'Cancelled'}, skipped:{bg:'#fef3c7',color:'#92400e',label:'Skipped'} }
    const b = m[s] || { bg:'#f3f4f6', color:'#4b5563', label:s }
    return <span style={{ background:b.bg, color:b.color, padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:600 }}>{b.label}</span>
  }

  return (
    <div style={{ padding:24 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 }}>
        <div>
          <div style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontSize:24, fontWeight:800, color:'#0d1b3e' }}>Message History</div>
          <div style={{ fontSize:13, color:'#4a5a8a' }}>Complete log of all sent messages</div>
        </div>
        <button onClick={load} style={{ padding:'9px 18px', background:'white', color:'#0d1b3e', border:'1.5px solid #d1daf5', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer' }}>🔄 Refresh</button>
      </div>
      <div style={{ background:'white', borderRadius:12, border:'1px solid #e8eeff', boxShadow:'0 1px 3px rgba(13,27,62,0.08)' }}>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
            <thead>
              <tr>{['Candidate','Mobile','Campaign','Template','Sent At','Status','Error'].map(h=>(
                <th key={h} style={{ padding:'10px 14px', textAlign:'left', fontSize:11, fontWeight:700, color:'#8a97bb', textTransform:'uppercase', background:'#f0f4ff', borderBottom:'1px solid #e8eeff' }}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan={7} style={{ padding:40, textAlign:'center', color:'#8a97bb' }}>Loading...</td></tr>
              : logs.length === 0 ? <tr><td colSpan={7} style={{ padding:40, textAlign:'center', color:'#8a97bb' }}>No messages sent yet.</td></tr>
              : logs.map(l => (
                <tr key={l.id} style={{ borderBottom:'1px solid #e8eeff' }}>
                  <td style={{ padding:'11px 14px', fontWeight:600 }}>{l.leads?.full_name || '—'}</td>
                  <td style={{ padding:'11px 14px', fontFamily:'monospace', fontSize:12 }}>{l.mobile}</td>
                  <td style={{ padding:'11px 14px' }}>{l.campaigns?.name || '—'}</td>
                  <td style={{ padding:'11px 14px' }}>{l.message_templates?.name || `Step ${l.step_number}`}</td>
                  <td style={{ padding:'11px 14px', fontSize:12, color:'#8a97bb' }}>{l.sent_at ? new Date(l.sent_at).toLocaleString('en-IN') : '—'}</td>
                  <td style={{ padding:'11px 14px' }}>{statusBadge(l.status)}</td>
                  <td style={{ padding:'11px 14px', fontSize:12, color:'#dc2626' }}>{l.error_message || ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
