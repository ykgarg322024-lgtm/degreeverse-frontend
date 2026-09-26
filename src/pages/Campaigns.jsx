import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Campaigns({ toast }) {
  const [campaigns, setCampaigns] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ name:'', description:'', daily_limit:20, start_time:'10:00', end_time:'20:00', min_interval_minutes:40, max_interval_minutes:45 })

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('campaigns').select('*').order('created_at', { ascending: false })
    setCampaigns(data || [])
    setLoading(false)
  }

  async function updateStatus(id, status) {
    await supabase.from('campaigns').update({ status }).eq('id', id)
    if (status === 'paused' || status === 'stopped') {
      await supabase.from('message_queue').update({ status: 'cancelled' }).eq('campaign_id', id).in('status', ['pending','scheduled'])
    }
    toast(`Campaign ${status}`, status === 'active' ? 'success' : 'warning')
    load()
  }

  async function create() {
    if (!form.name.trim()) { toast('Campaign name required', 'error'); return }
    const { error } = await supabase.from('campaigns').insert({ ...form, status: 'active' })
    if (error) { toast('Error creating campaign', 'error'); return }
    toast('Campaign created!', 'success')
    setShowCreate(false)
    setForm({ name:'', description:'', daily_limit:20, start_time:'10:00', end_time:'20:00', min_interval_minutes:40, max_interval_minutes:45 })
    load()
  }

  function statusBadge(s) {
    const m = { active:{bg:'#d1fae5',color:'#065f46',label:'● Running'}, paused:{bg:'#fef3c7',color:'#92400e',label:'⏸ Paused'}, stopped:{bg:'#f3f4f6',color:'#4b5563',label:'⏹ Stopped'}, draft:{bg:'#dbeafe',color:'#1e40af',label:'Draft'}, completed:{bg:'#e0e7ff',color:'#3730a3',label:'Completed'} }
    const b = m[s] || m.draft
    return <span style={{ background:b.bg, color:b.color, padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:600 }}>{b.label}</span>
  }

  return (
    <div style={{ padding:24 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 }}>
        <div>
          <div style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontSize:24, fontWeight:800, color:'#0d1b3e' }}>Campaigns</div>
          <div style={{ fontSize:13, color:'#4a5a8a' }}>Manage automated WhatsApp campaigns</div>
        </div>
        <button onClick={()=>setShowCreate(true)} style={{ padding:'9px 18px', background:'#1a3fa8', color:'white', border:'none', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer' }}>➕ New Campaign</button>
      </div>

      {loading ? <div style={{ textAlign:'center', padding:40, color:'#8a97bb' }}>Loading...</div> :
      campaigns.length === 0 ? (
        <div style={{ background:'white', borderRadius:12, border:'1px solid #e8eeff', padding:60, textAlign:'center' }}>
          <div style={{ fontSize:48, marginBottom:14, opacity:.5 }}>📣</div>
          <div style={{ fontSize:16, fontWeight:600, marginBottom:6 }}>No campaigns yet</div>
          <div style={{ fontSize:13, color:'#4a5a8a', marginBottom:20 }}>Create your first campaign to start sending messages</div>
          <button onClick={()=>setShowCreate(true)} style={{ padding:'9px 18px', background:'#1a3fa8', color:'white', border:'none', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer' }}>➕ Create Campaign</button>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          {campaigns.map(c => (
            <div key={c.id} style={{ background:'white', borderRadius:12, border:'1px solid #e8eeff', padding:20, boxShadow:'0 1px 3px rgba(13,27,62,0.08)' }}>
              <div style={{ display:'flex', alignItems:'flex-start', gap:14, marginBottom:16, flexWrap:'wrap' }}>
                <div style={{ flex:1 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap', marginBottom:4 }}>
                    <div style={{ fontSize:16, fontWeight:700, color:'#0d1b3e' }}>{c.name}</div>
                    {statusBadge(c.status)}
                  </div>
                  <div style={{ fontSize:12, color:'#4a5a8a' }}>{c.description}</div>
                </div>
                <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                  {c.status === 'active' && <button onClick={()=>updateStatus(c.id,'paused')} style={btnOutline}>⏸ Pause</button>}
                  {c.status === 'paused' && <button onClick={()=>updateStatus(c.id,'active')} style={btnGreen}>▶ Resume</button>}
                  {['active','paused'].includes(c.status) && <button onClick={()=>updateStatus(c.id,'stopped')} style={btnRed}>⏹ Stop</button>}
                </div>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:10, fontSize:12, color:'#4a5a8a', flexWrap:'wrap' }}>
                <span>🕐 {c.start_time}–{c.end_time}</span>
                <span>📅 {c.daily_limit}/day limit</span>
                <span>⏱ {c.min_interval_minutes}–{c.max_interval_minutes} min interval</span>
                <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:8 }}>
                  <span>{c.sent_today}/{c.daily_limit} today</span>
                  <div style={{ width:100, height:6, background:'#e8eeff', borderRadius:99, overflow:'hidden' }}>
                    <div style={{ height:'100%', width:`${Math.min((c.sent_today/c.daily_limit)*100,100)}%`, background:'linear-gradient(90deg,#1a3fa8,#c9a227)', borderRadius:99 }} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <>
          <div onClick={()=>setShowCreate(false)} style={{ position:'fixed', inset:0, background:'rgba(13,27,62,0.5)', zIndex:1000 }} />
          <div style={{ position:'fixed', top:'50%', left:'50%', transform:'translate(-50%,-50%)', background:'white', borderRadius:16, width:'90%', maxWidth:520, zIndex:1001, boxShadow:'0 24px 80px rgba(0,0,0,0.2)', maxHeight:'85vh', overflowY:'auto' }}>
            <div style={{ padding:'20px 24px', borderBottom:'1px solid #e8eeff', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div style={{ fontSize:16, fontWeight:700, color:'#0d1b3e' }}>New Campaign</div>
              <button onClick={()=>setShowCreate(false)} style={{ background:'none', border:'none', cursor:'pointer', fontSize:18, color:'#8a97bb' }}>✕</button>
            </div>
            <div style={{ padding:24 }}>
              {[['Campaign Name *','name','text'],['Description','description','text']].map(([label,key,type])=>(
                <div key={key} style={{ marginBottom:16 }}>
                  <label style={{ display:'block', fontSize:13, fontWeight:600, color:'#4a5a8a', marginBottom:6 }}>{label}</label>
                  <input type={type} value={form[key]} onChange={e=>setForm({...form,[key]:e.target.value})} style={{ width:'100%', padding:'10px 14px', border:'1.5px solid #d1daf5', borderRadius:8, fontSize:13, fontFamily:'Inter,sans-serif' }} />
                </div>
              ))}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                {[['Daily Limit','daily_limit','number'],['Start Time','start_time','time'],['End Time','end_time','time'],['Min Interval (min)','min_interval_minutes','number'],['Max Interval (min)','max_interval_minutes','number']].map(([label,key,type])=>(
                  <div key={key} style={{ marginBottom:16 }}>
                    <label style={{ display:'block', fontSize:13, fontWeight:600, color:'#4a5a8a', marginBottom:6 }}>{label}</label>
                    <input type={type} value={form[key]} onChange={e=>setForm({...form,[key]:e.target.value})} style={{ width:'100%', padding:'10px 14px', border:'1.5px solid #d1daf5', borderRadius:8, fontSize:13, fontFamily:'Inter,sans-serif' }} />
                  </div>
                ))}
              </div>
            </div>
            <div style={{ padding:'16px 24px', borderTop:'1px solid #e8eeff', display:'flex', justifyContent:'flex-end', gap:10 }}>
              <button onClick={()=>setShowCreate(false)} style={btnOutline}>Cancel</button>
              <button onClick={create} style={{ padding:'9px 18px', background:'#1a3fa8', color:'white', border:'none', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer' }}>🚀 Create Campaign</button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
const btnOutline = { padding:'7px 14px', background:'white', color:'#0d1b3e', border:'1.5px solid #d1daf5', borderRadius:8, fontSize:12, fontWeight:600, cursor:'pointer' }
const btnGreen = { padding:'7px 14px', background:'#16a34a', color:'white', border:'none', borderRadius:8, fontSize:12, fontWeight:600, cursor:'pointer' }
const btnRed = { padding:'7px 14px', background:'#dc2626', color:'white', border:'none', borderRadius:8, fontSize:12, fontWeight:600, cursor:'pointer' }
