import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Dashboard({ toast, onNavigate }) {
  const [stats, setStats] = useState({ leads: 0, campaigns: 0, sentToday: 0, pending: 0, replies: 0 })
  const [recentLogs, setRecentLogs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  async function loadStats() {
    try {
      const [{ count: leads }, { count: campaigns }, { count: pending }, { data: logs }] = await Promise.all([
        supabase.from('leads').select('*', { count: 'exact', head: true }),
        supabase.from('campaigns').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('message_queue').select('*', { count: 'exact', head: true }).in('status', ['pending', 'scheduled']),
        supabase.from('message_logs').select('*, leads(full_name), campaigns(name)').order('created_at', { ascending: false }).limit(8)
      ])
      const today = new Date().toISOString().split('T')[0]
      const { count: sentToday } = await supabase.from('message_logs').select('*', { count: 'exact', head: true }).eq('status', 'sent').gte('created_at', today)
      const { count: replies } = await supabase.from('replies').select('*', { count: 'exact', head: true })
      setStats({ leads: leads || 0, campaigns: campaigns || 0, sentToday: sentToday || 0, pending: pending || 0, replies: replies || 0 })
      setRecentLogs(logs || [])
    } catch (e) { toast('Error loading stats', 'error') }
    setLoading(false)
  }

  const kpis = [
    { label: 'Total Leads', value: stats.leads, color: '#1a3fa8', sub: 'In database' },
    { label: 'Active Campaigns', value: stats.campaigns, color: '#c9a227', sub: 'Running now' },
    { label: 'Sent Today', value: `${stats.sentToday}/20`, color: '#16a34a', sub: 'Daily limit: 20' },
    { label: 'Pending', value: stats.pending, color: '#d97706', sub: 'In queue' },
    { label: 'Replies', value: stats.replies, color: '#7c3aed', sub: 'Auto-paused' },
  ]

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <div>
          <div style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontSize:24, fontWeight:800, color:'#0d1b3e' }}>Dashboard</div>
          <div style={{ fontSize:13, color:'#4a5a8a', marginTop:2 }}>{new Date().toDateString()} · Asia/Kolkata</div>
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <button onClick={() => onNavigate('leads')} style={btnOutline}>📤 Import Leads</button>
          <button onClick={() => onNavigate('campaigns')} style={btnBlue}>➕ New Campaign</button>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))', gap:16, marginBottom:24 }}>
        {kpis.map(k => (
          <div key={k.label} style={{ background:'white', borderRadius:12, padding:20, border:'1px solid #e8eeff', boxShadow:'0 1px 3px rgba(13,27,62,0.08)', borderTop:`3px solid ${k.color}` }}>
            <div style={{ fontSize:11, fontWeight:600, color:'#8a97bb', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:8 }}>{k.label}</div>
            <div style={{ fontSize:28, fontWeight:800, color:'#0d1b3e', fontFamily:'Plus Jakarta Sans,sans-serif', letterSpacing:'-1px' }}>{k.value}</div>
            <div style={{ fontSize:12, color:'#4a5a8a', marginTop:4 }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div style={{ background:'white', borderRadius:12, border:'1px solid #e8eeff', boxShadow:'0 1px 3px rgba(13,27,62,0.08)' }}>
        <div style={{ padding:'18px 20px 14px', borderBottom:'1px solid #e8eeff', display:'flex', alignItems:'center', gap:12 }}>
          <span style={{ fontSize:18 }}>📅</span>
          <div style={{ fontSize:15, fontWeight:700, color:'#0d1b3e' }}>Recent Activity</div>
        </div>
        {loading ? (
          <div style={{ padding:40, textAlign:'center', color:'#8a97bb' }}>Loading...</div>
        ) : recentLogs.length === 0 ? (
          <div style={{ padding:40, textAlign:'center', color:'#8a97bb' }}>
            <div style={{ fontSize:36, marginBottom:12 }}>📭</div>
            <div>No messages sent yet. Create a campaign to get started!</div>
            <button onClick={() => onNavigate('campaigns')} style={{ ...btnBlue, marginTop:16 }}>Create Campaign</button>
          </div>
        ) : (
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
              <thead>
                <tr>
                  {['Candidate','Campaign','Sent At','Status'].map(h => (
                    <th key={h} style={{ padding:'10px 14px', textAlign:'left', fontSize:11, fontWeight:700, color:'#8a97bb', textTransform:'uppercase', background:'#f0f4ff', borderBottom:'1px solid #e8eeff' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentLogs.map(log => (
                  <tr key={log.id}>
                    <td style={{ padding:'11px 14px', fontWeight:600 }}>{log.leads?.full_name || log.mobile}</td>
                    <td style={{ padding:'11px 14px' }}>{log.campaigns?.name || '—'}</td>
                    <td style={{ padding:'11px 14px', fontSize:12, color:'#8a97bb' }}>{log.sent_at ? new Date(log.sent_at).toLocaleString('en-IN') : '—'}</td>
                    <td style={{ padding:'11px 14px' }}>
                      <span style={{ ...badge, ...(log.status === 'sent' ? badgeSent : log.status === 'failed' ? badgeFailed : badgePending) }}>
                        {log.status === 'sent' ? '✓ Sent' : log.status === 'failed' ? '✗ Failed' : log.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

const btnBlue = { padding:'9px 18px', background:'#1a3fa8', color:'white', border:'none', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'Inter,sans-serif' }
const btnOutline = { padding:'9px 18px', background:'white', color:'#0d1b3e', border:'1.5px solid #d1daf5', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'Inter,sans-serif' }
const badge = { display:'inline-flex', alignItems:'center', gap:4, padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:600 }
const badgeSent = { background:'#dcfce7', color:'#15803d' }
const badgeFailed = { background:'#fee2e2', color:'#991b1b' }
const badgePending = { background:'#fef3c7', color:'#92400e' }
