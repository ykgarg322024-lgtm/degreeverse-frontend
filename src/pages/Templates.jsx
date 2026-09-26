import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Templates({ toast }) {
  const [templates, setTemplates] = useState([])
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ name:'', body:'', sequence_number:1, is_active:true })
  const [preview, setPreview] = useState('')

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase.from('message_templates').select('*').order('sequence_number')
    setTemplates(data || [])
  }

  function renderPreview(body) {
    return (body||'').replace(/{{name}}/g,'Rahul').replace(/{{university}}/g,'NMIMS').replace(/{{course}}/g,'MBA').replace(/{{semester}}/g,'Semester 3').replace(/{{assignment}}/g,'Project').replace(/{{mobile}}/g,'9876543210')
  }

  async function save() {
    if (!form.name.trim() || !form.body.trim()) { toast('Name and body required', 'error'); return }
    const { error } = await supabase.from('message_templates').insert(form)
    if (error) { toast('Error saving template', 'error'); return }
    toast('Template saved!', 'success')
    setShowCreate(false)
    setForm({ name:'', body:'', sequence_number: templates.length + 1, is_active:true })
    load()
  }

  async function toggleActive(id, val) {
    await supabase.from('message_templates').update({ is_active: val }).eq('id', id)
    load()
  }

  return (
    <div style={{ padding:24 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 }}>
        <div>
          <div style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontSize:24, fontWeight:800, color:'#0d1b3e' }}>Templates</div>
          <div style={{ fontSize:13, color:'#4a5a8a' }}>Create reusable WhatsApp message templates</div>
        </div>
        <button onClick={()=>{setShowCreate(true);setForm({...form,sequence_number:templates.length+1})}} style={{ padding:'9px 18px', background:'#1a3fa8', color:'white', border:'none', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer' }}>➕ New Template</button>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))', gap:16 }}>
        {templates.map(t => (
          <div key={t.id} style={{ background:'white', borderRadius:12, border:'1px solid #e8eeff', boxShadow:'0 1px 3px rgba(13,27,62,0.08)', overflow:'hidden' }}>
            <div style={{ padding:'14px 18px', borderBottom:'1px solid #e8eeff', display:'flex', alignItems:'center', gap:8 }}>
              <div style={{ width:28, height:28, borderRadius:'50%', background:'#1a3fa8', color:'white', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700 }}>{t.sequence_number}</div>
              <div style={{ flex:1, fontWeight:600, fontSize:14, color:'#0d1b3e' }}>{t.name}</div>
              <label style={{ position:'relative', display:'inline-flex', width:42, height:24, cursor:'pointer' }}>
                <input type="checkbox" checked={t.is_active} onChange={e=>toggleActive(t.id,e.target.checked)} style={{ opacity:0, width:0, height:0 }} />
                <span style={{ position:'absolute', inset:0, background: t.is_active ? '#1a3fa8' : '#d1daf5', borderRadius:12, transition:'.2s' }}>
                  <span style={{ position:'absolute', width:18, height:18, background:'white', borderRadius:'50%', top:3, left: t.is_active ? 21 : 3, transition:'.2s', boxShadow:'0 1px 4px rgba(0,0,0,0.15)' }} />
                </span>
              </label>
            </div>
            <div style={{ padding:'14px 18px' }}>
              <div style={{ fontSize:12, color:'#4a5a8a', lineHeight:1.7, whiteSpace:'pre-wrap', maxHeight:100, overflow:'hidden' }}>{t.body.substring(0,200)}{t.body.length>200?'...':''}</div>
            </div>
          </div>
        ))}
        <div onClick={()=>setShowCreate(true)} style={{ background:'white', borderRadius:12, border:'2px dashed #d1daf5', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', minHeight:160 }}>
          <div style={{ textAlign:'center' }}>
            <div style={{ fontSize:32, opacity:.4 }}>➕</div>
            <div style={{ fontSize:14, fontWeight:600, color:'#4a5a8a', marginTop:8 }}>Add Template</div>
          </div>
        </div>
      </div>

      {showCreate && (
        <>
          <div onClick={()=>setShowCreate(false)} style={{ position:'fixed', inset:0, background:'rgba(13,27,62,0.5)', zIndex:1000 }} />
          <div style={{ position:'fixed', top:'50%', left:'50%', transform:'translate(-50%,-50%)', background:'white', borderRadius:16, width:'92%', maxWidth:700, zIndex:1001, maxHeight:'85vh', overflowY:'auto', boxShadow:'0 24px 80px rgba(0,0,0,0.2)' }}>
            <div style={{ padding:'20px 24px', borderBottom:'1px solid #e8eeff', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div style={{ fontSize:16, fontWeight:700, color:'#0d1b3e' }}>New Template</div>
              <button onClick={()=>setShowCreate(false)} style={{ background:'none', border:'none', cursor:'pointer', fontSize:18, color:'#8a97bb' }}>✕</button>
            </div>
            <div style={{ padding:24, display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
              <div>
                <div style={{ marginBottom:14 }}>
                  <label style={{ display:'block', fontSize:13, fontWeight:600, color:'#4a5a8a', marginBottom:6 }}>Template Name *</label>
                  <input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} style={{ width:'100%', padding:'10px 14px', border:'1.5px solid #d1daf5', borderRadius:8, fontSize:13, fontFamily:'Inter,sans-serif' }} placeholder="e.g. Initial Introduction" />
                </div>
                <div style={{ marginBottom:14 }}>
                  <label style={{ display:'block', fontSize:13, fontWeight:600, color:'#4a5a8a', marginBottom:6 }}>Sequence Number</label>
                  <input type="number" value={form.sequence_number} onChange={e=>setForm({...form,sequence_number:parseInt(e.target.value)})} style={{ width:'100%', padding:'10px 14px', border:'1.5px solid #d1daf5', borderRadius:8, fontSize:13, fontFamily:'Inter,sans-serif' }} />
                </div>
                <div>
                  <label style={{ display:'block', fontSize:13, fontWeight:600, color:'#4a5a8a', marginBottom:6 }}>Message Body *</label>
                  <textarea value={form.body} onChange={e=>{setForm({...form,body:e.target.value});setPreview(renderPreview(e.target.value))}} rows={10} style={{ width:'100%', padding:'10px 14px', border:'1.5px solid #d1daf5', borderRadius:8, fontSize:13, fontFamily:'Inter,sans-serif', resize:'vertical' }} placeholder="Hi {{name}}, This is Yash WhatsApp..." />
                  <div style={{ fontSize:11, color:'#8a97bb', marginTop:4 }}>Variables: {'{{name}} {{university}} {{course}} {{semester}} {{assignment}}'}</div>
                </div>
              </div>
              <div>
                <div style={{ fontSize:12, fontWeight:700, color:'#8a97bb', marginBottom:10 }}>📱 PREVIEW</div>
                <div style={{ background:'#e5ddd5', borderRadius:12, padding:16, minHeight:200 }}>
                  <div style={{ background:'white', borderRadius:8, padding:'12px 14px', maxWidth:'85%', marginLeft:'auto', boxShadow:'0 1px 2px rgba(0,0,0,0.1)' }}>
                    <div style={{ fontSize:13, lineHeight:1.6, color:'#333', whiteSpace:'pre-wrap' }}>{preview || renderPreview(form.body) || 'Preview appears here...'}</div>
                    <div style={{ fontSize:10, color:'#999', textAlign:'right', marginTop:6 }}>10:00 AM ✓✓</div>
                  </div>
                </div>
              </div>
            </div>
            <div style={{ padding:'16px 24px', borderTop:'1px solid #e8eeff', display:'flex', justifyContent:'flex-end', gap:10 }}>
              <button onClick={()=>setShowCreate(false)} style={{ padding:'9px 18px', background:'white', color:'#0d1b3e', border:'1.5px solid #d1daf5', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer' }}>Cancel</button>
              <button onClick={save} style={{ padding:'9px 18px', background:'#1a3fa8', color:'white', border:'none', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer' }}>💾 Save Template</button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
