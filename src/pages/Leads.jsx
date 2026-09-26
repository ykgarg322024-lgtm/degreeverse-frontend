import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Leads({ toast }) {
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [selected, setSelected] = useState(null)
  const [importing, setImporting] = useState(false)

  useEffect(() => { loadLeads() }, [search, statusFilter])

  async function loadLeads() {
    setLoading(true)
    let q = supabase.from('leads').select('*').order('created_at', { ascending: false }).limit(50)
    if (search) q = q.or(`full_name.ilike.%${search}%,mobile.ilike.%${search}%,university.ilike.%${search}%`)
    if (statusFilter) q = q.eq('status', statusFilter)
    const { data, error } = await q
    if (error) toast('Error loading leads', 'error')
    else setLeads(data || [])
    setLoading(false)
  }

  async function markDNC(id) {
    await supabase.from('leads').update({ status: 'do_not_contact', do_not_contact: true }).eq('id', id)
    await supabase.from('message_queue').update({ status: 'cancelled' }).eq('lead_id', id).in('status', ['pending','scheduled'])
    toast('Marked as Do Not Contact', 'warning')
    setSelected(null)
    loadLeads()
  }

  const statusColors = { new:'#dbeafe:#1e40af', contacted:'#fef3c7:#92400e', replied:'#e0e7ff:#3730a3', interested:'#d1fae5:#065f46', converted:'#fef3c7:#92400e', do_not_contact:'#fee2e2:#991b1b' }

  function getBadge(status) {
    const map = { new:{bg:'#dbeafe',color:'#1e40af'}, contacted:{bg:'#fef3c7',color:'#92400e'}, replied:{bg:'#e0e7ff',color:'#3730a3'}, interested:{bg:'#d1fae5',color:'#065f46'}, converted:{bg:'#fef3c7',color:'#92400e'}, do_not_contact:{bg:'#fee2e2',color:'#991b1b'} }
    const s = map[status] || { bg:'#f3f4f6', color:'#4b5563' }
    return { background: s.bg, color: s.color, padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:600 }
  }

  return (
    <div style={{ padding:24 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <div>
          <div style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontSize:24, fontWeight:800, color:'#0d1b3e' }}>Leads</div>
          <div style={{ fontSize:13, color:'#4a5a8a' }}>Manage your candidate database</div>
        </div>
      </div>

      <div style={{ background:'white', borderRadius:12, border:'1px solid #e8eeff', padding:14, marginBottom:16, display:'flex', gap:12, flexWrap:'wrap' }}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Search name, phone, university..." style={{ padding:'8px 14px', border:'1.5px solid #d1daf5', borderRadius:8, fontSize:13, width:240, fontFamily:'Inter,sans-serif' }} />
        <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} style={{ padding:'8px 12px', border:'1.5px solid #d1daf5', borderRadius:8, fontSize:13, fontFamily:'Inter,sans-serif' }}>
          <option value="">All Statuses</option>
          <option value="new">New</option>
          <option value="contacted">Contacted</option>
          <option value="replied">Replied</option>
          <option value="interested">Interested</option>
          <option value="converted">Converted</option>
          <option value="do_not_contact">Do Not Contact</option>
        </select>
        <button onClick={loadLeads} style={{ padding:'8px 16px', background:'#1a3fa8', color:'white', border:'none', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer' }}>Refresh</button>
      </div>

      <div style={{ background:'white', borderRadius:12, border:'1px solid #e8eeff', boxShadow:'0 1px 3px rgba(13,27,62,0.08)' }}>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
            <thead>
              <tr>{['Name','Mobile','University','Course/Sem','Status','Last Contact','Action'].map(h=>(
                <th key={h} style={{ padding:'10px 14px', textAlign:'left', fontSize:11, fontWeight:700, color:'#8a97bb', textTransform:'uppercase', background:'#f0f4ff', borderBottom:'1px solid #e8eeff', whiteSpace:'nowrap' }}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ padding:40, textAlign:'center', color:'#8a97bb' }}>Loading leads...</td></tr>
              ) : leads.length === 0 ? (
                <tr><td colSpan={7} style={{ padding:40, textAlign:'center', color:'#8a97bb' }}>No leads found. Import leads to get started.</td></tr>
              ) : leads.map(l => (
                <tr key={l.id} style={{ borderBottom:'1px solid #e8eeff' }}>
                  <td style={{ padding:'11px 14px', fontWeight:600 }}>{l.full_name}</td>
                  <td style={{ padding:'11px 14px', fontFamily:'monospace', fontSize:12, color:'#4a5a8a' }}>{l.mobile}</td>
                  <td style={{ padding:'11px 14px' }}>{l.university || '—'}</td>
                  <td style={{ padding:'11px 14px' }}>{l.course} {l.semester ? `· ${l.semester}` : ''}</td>
                  <td style={{ padding:'11px 14px' }}><span style={getBadge(l.status)}>{l.status?.replace('_',' ')}</span></td>
                  <td style={{ padding:'11px 14px', fontSize:12, color:'#8a97bb' }}>{l.last_contacted_at ? new Date(l.last_contacted_at).toLocaleDateString('en-IN') : '—'}</td>
                  <td style={{ padding:'11px 14px' }}><button onClick={()=>setSelected(l)} style={{ padding:'5px 12px', background:'white', border:'1.5px solid #d1daf5', borderRadius:6, fontSize:12, fontWeight:600, cursor:'pointer' }}>View</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Lead Detail Panel */}
      {selected && (
        <>
          <div onClick={()=>setSelected(null)} style={{ position:'fixed', inset:0, background:'rgba(13,27,62,0.3)', zIndex:199 }} />
          <div style={{ position:'fixed', top:0, right:0, width:380, height:'100vh', background:'white', zIndex:200, boxShadow:'-4px 0 40px rgba(13,27,62,0.12)', overflowY:'auto' }}>
            <div style={{ padding:'20px 24px', borderBottom:'1px solid #e8eeff', display:'flex', alignItems:'center', gap:12, position:'sticky', top:0, background:'white' }}>
              <div style={{ width:44, height:44, borderRadius:'50%', background:'linear-gradient(135deg,#1a3fa8,#0d1b3e)', color:'white', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, fontWeight:700 }}>{selected.full_name?.[0]}</div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:15, fontWeight:700, color:'#0d1b3e' }}>{selected.full_name}</div>
                <div style={{ fontSize:12, color:'#4a5a8a' }}>{selected.mobile}</div>
              </div>
              <span style={getBadge(selected.status)}>{selected.status?.replace('_',' ')}</span>
              <button onClick={()=>setSelected(null)} style={{ background:'none', border:'none', cursor:'pointer', fontSize:18, color:'#8a97bb' }}>✕</button>
            </div>
            <div style={{ padding:'16px 24px', borderBottom:'1px solid #e8eeff' }}>
              <div style={{ fontSize:11, fontWeight:700, color:'#8a97bb', textTransform:'uppercase', marginBottom:12 }}>Contact Info</div>
              {[['Mobile', selected.mobile], ['WhatsApp', selected.whatsapp_number || selected.mobile], ['Email', selected.email || '—'], ['City', selected.city || '—'], ['State', selected.state || '—']].map(([k,v])=>(
                <div key={k} style={{ marginBottom:8 }}>
                  <div style={{ fontSize:11, color:'#8a97bb' }}>{k}</div>
                  <div style={{ fontSize:13, fontWeight:500 }}>{v}</div>
                </div>
              ))}
            </div>
            <div style={{ padding:'16px 24px', borderBottom:'1px solid #e8eeff' }}>
              <div style={{ fontSize:11, fontWeight:700, color:'#8a97bb', textTransform:'uppercase', marginBottom:12 }}>Education</div>
              {[['University', selected.university], ['Course', selected.course], ['Semester', selected.semester], ['Assignment', selected.assignment]].map(([k,v])=>(
                v ? <div key={k} style={{ marginBottom:8 }}><div style={{ fontSize:11, color:'#8a97bb' }}>{k}</div><div style={{ fontSize:13, fontWeight:500 }}>{v}</div></div> : null
              ))}
            </div>
            <div style={{ padding:'16px 24px' }}>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                <button onClick={()=>markDNC(selected.id)} style={{ padding:'8px 14px', background:'#fee2e2', color:'#991b1b', border:'none', borderRadius:8, fontSize:12, fontWeight:600, cursor:'pointer' }}>🚫 Do Not Contact</button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
