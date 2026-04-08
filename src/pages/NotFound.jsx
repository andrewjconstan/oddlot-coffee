import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--surface)',
      backgroundImage: 'linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)',
      backgroundSize: '40px 40px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '1.5rem',
    }}>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: '48px', color: 'var(--tile-border)', letterSpacing: '0.1em' }}>404</div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: '12px', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--muted)' }}>lot not found</div>
      <Link to="/" style={{
        fontFamily: 'var(--font-display)', fontSize: '11px', letterSpacing: '0.2em',
        textTransform: 'uppercase', color: 'var(--muted)',
        border: '1px solid var(--tile-border)', padding: '10px 24px',
        transition: 'all 0.2s',
      }}
        onMouseEnter={e => { e.target.style.color = 'var(--off-white)'; e.target.style.borderColor = 'var(--muted)' }}
        onMouseLeave={e => { e.target.style.color = 'var(--muted)'; e.target.style.borderColor = 'var(--tile-border)' }}
      >back to the lot</Link>
    </div>
  )
}