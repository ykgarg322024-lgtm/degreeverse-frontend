import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Settings({ toast }) {
  const [form, setForm] = useState({ business_name:'Yash WhatsApp', timezone:'Asia/Kolkata', daily_limit:20, default_start_time:'10:00', default_end_time:'20:00', min_interval_minutes:40, max_interval_minutes:45, message_signature:'Regards,\nYash WhatsApp Team' })

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase.from('settings').select('*').single()
    if (data) setForm(data)
  }

  async function save() {
    const { error } = await supabase.from('settings').update(form).not('id','is',null)
    if (error) { toast('Error saving settings', 'error'); return }
    toast('Settings saved!', 'success')
  }

  return (
    <div style={{ padding:24 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 }}>
        <div>
          <div style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontSize:24, fontWeight:800, color:'#0d1b3e' }}>Settings</div>
          <div style={{ fontSize:13, color:'#4a5a8a' }}>Configure global defaults</div>
        </div>
        <button onClick={save} style={{ padding:'9px 18px', background:'#1a3fa8', color:'white', border:'none', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer' }}>💾 Save Settings</button>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
        <div style={{ background:'white', borderRadius:12, border:'1px solid #e8eeff', overflow:'hidden' }}>
          <div style={{ padding:'18px 20px', borderBottom:'1px solid #e8eeff', fontSize:15, fontWeight:700, color:'#0d1b3e' }}>🏢 Business Info</div>
          <div style={{ padding:20 }}>
            {[['Business Name','business_name','text'],['Timezone','timezone','text']].map(([label,key,type])=>(
              <div key={key} style={{ marginBottom:16 }}>
                <label style={{ display:'block', fontSize:13, fontWeight:600, color:'#4a5a8a', marginBottom:6 }}>{label}</label>
                <input type={type} value={form[key]||''} onChange={e=>setForm({...form,[key]:e.target.value})} style={{ width:'100%', padding:'10px 14px', border:'1.5px solid #d1daf5', borderRadius:8, fontSize:13, fontFamily:'Inter,sans-serif' }} />
              </div>
            ))}
            <div style={{ marginBottom:16 }}>
              <label style={{ display:'block', fontSize:13, fontWeight:600, color:'#4a5a8a', marginBottom:6 }}>Message Signature</label>
              <textarea value={form.message_signature||''} onChange={e=>setForm({...form,message_signature:e.target.value})} rows={3} style={{ width:'100%', padding:'10px 14px', border:'1.5px solid #d1daf5', borderRadius:8, fontSize:13, fontFamily:'Inter,sans-serif', resize:'vertical' }} />
            </div>
          </div>
        </div>
        <div style={{ background:'white', borderRadius:12, border:'1px solid #e8eeff', overflow:'hidden' }}>
          <div style={{ padding:'18px 20px', borderBottom:'1px solid #e8eeff', fontSize:15, fontWeight:700, color:'#0d1b3e' }}>⏱️ Scheduling Defaults</div>
          <div style={{ padding:20 }}>
            {[['Daily Limit','daily_limit','number'],['Start Time','default_start_time','time'],['End Time','default_end_time','time'],['Min Interval (min)','min_interval_minutes','number'],['Max Interval (min)','max_interval_minutes','number']].map(([label,key,type])=>(
              <div key={key} style={{ marginBottom:16 }}>
                <label style={{ display:'block', fontSize:13, fontWeight:600, color:'#4a5a8a', marginBottom:6 }}>{label}</label>
                <input type={type} value={form[key]||''} onChange={e=>setForm({...form,[key]:e.target.value})} style={{ width:'100%', padding:'10px 14px', border:'1.5px solid #d1daf5', borderRadius:8, fontSize:13, fontFamily:'Inter,sans-serif' }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
