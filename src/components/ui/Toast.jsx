import React from 'react'

const icons = { success:'✅', error:'❌', warning:'⚠️', info:'ℹ️' }
const colors = { success:'#16a34a', error:'#dc2626', warning:'#d97706', info:'#1a3fa8' }

export default function Toast({ message, type = 'info' }) {
  return (
    <div style={{
      background:'white', borderRadius:10, padding:'12px 18px',
      boxShadow:'0 4px 20px rgba(0,0,0,0.15)',
      display:'flex', alignItems:'center', gap:10,
      fontSize:13, fontWeight:500,
      minWidth:260,
      borderLeft:`4px solid ${colors[type]}`,
      animation:'slideIn .25s ease'
    }}>
      <span>{icons[type]}</span>
      <span>{message}</span>
    </div>
  )
}
