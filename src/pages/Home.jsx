import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { LogoFlap } from '../components/FlapDisplay'
import BagCard from '../components/BagCard'

export default function Home() {
  const [bags, setBags] = useState([])
  const [history, setHistory] = useState([])
  const [config, setConfig] = useState({})
  const [activeTab, setActiveTab] = useState('current')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAll()
  }, [])

  async function fetchAll() {
    const [bagsRes, historyRes, configRes] = await Promise.all([
      supabase.from('bags').select('*, participants(*)').eq('purchased', false).order('display_order'),
      supabase.from('history').select('*').order('purchased_at', { ascending: false }),
      supabase.from('config').select('*'),
    ])
    if (bagsRes.data) setBags(bagsRes.data)
    if (historyRes.data) setHistory(historyRes.data)
    if (configRes.data) {
      const cfg = {}
      configRes.data.forEach(row => { cfg[row.key] = row.value })
      setConfig(cfg)
    }
    setLoading(false)
  }

  const logoWords = config.logo_words || ['ODDLOT']
  const tagline = config.tagline || 'split a bag. share the find.'
  const gramsPerDrink = config.grams_per_drink || 20
  const recommendEmail = config.recommend_email || ''

  const tabStyle = (tab) => ({
    fontFamily: 'var(--font-body)',
    fontSize: '12px',
    letterSpacing: '0.15em',
    textTransform: 'uppercase',
    color: activeTab === tab ? 'var(--off-white)' : 'var(--muted)',
    padding: '1rem 1.5rem',
    cursor: 'pointer',
    borderBottom: activeTab === tab ? '2px solid var(--accent)' : '2px solid transparent',
    borderTop: 'none', borderLeft: 'none', borderRight: 'none',
    background: 'none',
    fontWeight: 400,
    transition: 'color 0.2s, border-color 0.2s',
  })

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--surface)',
      backgroundImage: 'linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)',
      backgroundSize: '40px 40px',
    }}>
      <header style={{ padding: '2.5rem 2rem 2rem', borderBottom: '1px solid var(--tile-border)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
        <LogoFlap words={logoWords} />
        <div style={{ fontFamily: 'var(--font-body)', fontSize: '11px', letterSpacing: '0.25em', color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 300 }}>{tagline}</div>
      </header>

      <nav style={{ display: 'flex', borderBottom: '1px solid var(--tile-border)', padding: '0 2rem', background: 'var(--surface)' }}>
        <button style={tabStyle('current')} onClick={() => setActiveTab('current')}>Current Bags</button>
        <button style={tabStyle('history')} onClick={() => setActiveTab('history')}>History</button>
      </nav>

      <main style={{ padding: '2rem', maxWidth: '480px', margin: '0 auto' }}>
        {loading ? (
          <div style={{ color: 'var(--muted)', fontFamily: 'var(--font-display)', fontSize: '12px', letterSpacing: '0.2em', textAlign: 'center', paddingTop: '4rem' }}>loading lots...</div>
        ) : (
          <>
            {activeTab === 'current' && (
              <>
                <div style={{ fontSize: '10px', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '1.5rem', fontFamily: 'var(--font-display)' }}>— open lots —</div>
                {bags.length === 0 ? (
                  <div style={{ color: 'var(--muted)', fontFamily: 'var(--font-display)', fontSize: '12px', letterSpacing: '0.15em', textAlign: 'center', paddingTop: '3rem' }}>no open lots right now. check back soon.</div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0', background: 'transparent', border: 'none' }}>
  {bags.map(bag => (
    <BagCard key={bag.id} bag={bag} gramsPerDrink={gramsPerDrink} onParticipantsChange={fetchAll} />
  ))}
</div>
                )}
                <div style={{ marginTop: '2.5rem', display: 'flex', justifyContent: 'center' }}>
                  <a href={`mailto:${recommendEmail}?subject=Bag%20Recommendation%20for%20Odd%20Lot&body=Hey%2C%20I%20have%20a%20coffee%20bag%20recommendation%3A%0A%0A`}
                    style={{ background: 'transparent', border: '1px solid var(--tile-border)', color: 'var(--muted)', fontFamily: 'var(--font-display)', fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', padding: '10px 28px', transition: 'all 0.2s', display: 'inline-block' }}
                    onMouseEnter={e => { e.target.style.color = 'var(--off-white)'; e.target.style.borderColor = 'var(--muted)' }}
                    onMouseLeave={e => { e.target.style.color = 'var(--muted)'; e.target.style.borderColor = 'var(--tile-border)' }}
                  >+ recommend a bag</a>
                </div>
              </>
            )}

            {activeTab === 'history' && (
              <>
                <div style={{ fontSize: '10px', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '1.5rem', fontFamily: 'var(--font-display)' }}>— past lots —</div>
                {history.length === 0 ? (
                  <div style={{ color: 'var(--muted)', fontFamily: 'var(--font-display)', fontSize: '12px', letterSpacing: '0.15em', textAlign: 'center', paddingTop: '3rem' }}>no history yet.</div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5px', background: 'var(--tile-border)', border: '1.5px solid var(--tile-border)' }}>
                    {history.map(h => (
                      <div key={h.id} style={{ background: 'var(--tile)', padding: '1.25rem', opacity: 0.7 }}>
                        {h.photo_url && <img src={h.photo_url} alt={h.name} style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover', marginBottom: '1rem', opacity: 0.7, filter: 'saturate(0.5)' }} />}
                        <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--off-white)', marginBottom: '4px' }}>{h.name}</div>
                        <div style={{ fontSize: '10px', color: 'var(--muted)', letterSpacing: '0.2em', textTransform: 'uppercase', fontFamily: 'var(--font-display)', marginBottom: '8px' }}>{h.origin}</div>
                        <div style={{ fontSize: '12px', color: '#888880', lineHeight: 1.5, fontWeight: 300, marginBottom: '10px' }}>{h.description}</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                          {(h.participants || []).map((p, i) => (
                            <div key={i} style={{ fontFamily: 'var(--font-display)', fontSize: '10px', color: 'var(--muted)', border: '1px solid var(--tile-border)', padding: '2px 8px', letterSpacing: '0.05em' }}>
                              {typeof p === 'string' ? p : p.name}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </main>
    </div>
  )
}