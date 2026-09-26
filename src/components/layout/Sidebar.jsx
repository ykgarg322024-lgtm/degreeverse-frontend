import React from 'react'

const navItems = [
  { section: 'Main', items: [
    { id: 'dashboard', icon: '📊', label: 'Dashboard' },
    { id: 'leads', icon: '👥', label: 'Leads' },
  ]},
  { section: 'Campaigns', items: [
    { id: 'campaigns', icon: '📣', label: 'Campaigns' },
    { id: 'templates', icon: '📝', label: 'Templates' },
    { id: 'queue', icon: '⏱️', label: 'Message Queue' },
  ]},
  { section: 'WhatsApp', items: [
    { id: 'whatsapp', icon: '💬', label: 'WA Connection' },
  ]},
  { section: 'Analytics', items: [
    { id: 'history', icon: '📋', label: 'Message History' },
    { id: 'reports', icon: '📈', label: 'Reports' },
  ]},
  { section: 'System', items: [
    { id: 'settings', icon: '⚙️', label: 'Settings' },
  ]},
]

export default function Sidebar({ currentPage, onNavigate, isOpen, onClose }) {
  const sidebarStyle = {
    position: 'fixed',
    top: 0, left: 0,
    width: 240,
    height: '100vh',
    background: '#0d1b3e',
    display: 'flex',
    flexDirection: 'column',
    zIndex: 100,
    transition: 'transform .3s',
    transform: window.innerWidth <= 768 ? (isOpen ? 'translateX(0)' : 'translateX(-240px)') : 'translateX(0)',
  }

  return (
    <>
      {isOpen && window.innerWidth <= 768 && (
        <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', zIndex:99 }} />
      )}
      <aside style={sidebarStyle}>
        <div style={{ padding:'20px 20px 16px', borderBottom:'1px solid rgba(255,255,255,0.08)', display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:36, height:36, background:'linear-gradient(135deg,#2952c8,#c9a227)', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>💬</div>
          <div>
            <div style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontSize:15, fontWeight:800, color:'white' }}>Yash WhatsApp</div>
            <div style={{ fontSize:9, color:'#e2bb45', fontWeight:600, letterSpacing:'0.8px', textTransform:'uppercase' }}>WA Manager</div>
          </div>
        </div>

        <nav style={{ flex:1, padding:'12px 0', overflowY:'auto' }}>
          {navItems.map(section => (
            <div key={section.section}>
              <div style={{ fontSize:9, fontWeight:700, color:'rgba(255,255,255,0.3)', letterSpacing:'1.2px', textTransform:'uppercase', padding:'8px 20px 4px' }}>
                {section.section}
              </div>
              {section.items.map(item => (
                <div
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  style={{
                    display:'flex', alignItems:'center', gap:10,
                    padding:'9px 20px',
                    color: currentPage === item.id ? '#e2bb45' : 'rgba(255,255,255,0.65)',
                    cursor:'pointer',
                    fontSize:13.5, fontWeight:500,
                    borderLeft: currentPage === item.id ? '3px solid #c9a227' : '3px solid transparent',
                    background: currentPage === item.id ? 'rgba(201,162,39,0.15)' : 'transparent',
                  }}
                >
                  <span style={{ fontSize:16, width:20, textAlign:'center' }}>{item.icon}</span>
                  {item.label}
                </div>
              ))}
            </div>
          ))}
        </nav>

        <div style={{ padding:16, borderTop:'1px solid rgba(255,255,255,0.08)' }}>
          <div
            onClick={() => onNavigate('whatsapp')}
            style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 12px', borderRadius:8, background:'rgba(22,163,74,0.2)', cursor:'pointer' }}
          >
            <div style={{ width:8, height:8, borderRadius:'50%', background:'#4ade80', animation:'pulse 2s infinite' }} />
            <span style={{ fontSize:12, fontWeight:600, color:'#4ade80' }}>WhatsApp Connected</span>
          </div>
        </div>
      </aside>
    </>
  )
}
