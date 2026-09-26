import React from 'react'

const titles = { dashboard:'Dashboard', leads:'Leads', campaigns:'Campaigns', templates:'Templates', queue:'Message Queue', whatsapp:'WhatsApp Connection', history:'Message History', reports:'Reports', settings:'Settings' }

export default function Topbar({ page, onMenuClick, onStopAll, onLogout }) {
  return (
    <header style={{ position:'fixed', top:0, left: window.innerWidth > 768 ? 240 : 0, right:0, height:64, background:'white', borderBottom:'1px solid #e8eeff', display:'flex', alignItems:'center', padding:'0 24px', gap:16, zIndex:90, boxShadow:'0 1px 3px rgba(13,27,62,0.06)' }}>
      <button onClick={onMenuClick} style={{ display: window.innerWidth <= 768 ? 'block' : 'none', background:'none', border:'none', cursor:'pointer', fontSize:22, padding:4 }}>☰</button>
      <div style={{ fontSize:18, fontWeight:700, color:'#0d1b3e', letterSpacing:'-0.3px' }}>{titles[page] || page}</div>
      <div style={{ flex:1 }} />
      <button
        onClick={onStopAll}
        style={{ padding:'8px 18px', background:'#dc2626', color:'white', border:'none', borderRadius:8, fontSize:13, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:6, fontFamily:'Inter,sans-serif' }}
      >
        🛑 Stop All
      </button>
      <div
        onClick={onLogout}
        style={{ width:36, height:36, borderRadius:'50%', background:'linear-gradient(135deg,#1a3fa8,#0d1b3e)', color:'white', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:700, cursor:'pointer' }}
        title="Logout"
      >
        Y
      </div>
    </header>
  )
}
