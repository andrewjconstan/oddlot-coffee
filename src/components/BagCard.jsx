import { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabase'
import { PriceFlap } from './FlapDisplay'

const GRAMS_PER_OZ = 28.3495

function calcPrice(bag) {
  const n = bag.participants?.length || 0
  const total = (bag.total_cost || 0) + (bag.shipping_cost || 0) + (bag.tax_amount || 0)
  return n === 0 ? total : total / n
}

function calcOz(bag) {
  const n = bag.participants?.length || 0
  return n === 0 ? (bag.total_oz || 0) : (bag.total_oz || 0) / n
}

function fmtOz(v) {
  return v % 1 === 0 ? v.toFixed(0) : v.toFixed(1)
}

function calcDrinks(oz, gramsPerDrink) {
  return Math.round((oz * GRAMS_PER_OZ) / gramsPerDrink)
}

function calcCountdown(dateStr) {
  if (!dateStr) return null
  const target = new Date(dateStr)
  const now = new Date()
  const diffMs = target - now
  if (diffMs <= 0) return null
  const totalHours = Math.floor(diffMs / (1000 * 60 * 60))
  const days = Math.floor(totalHours / 24)
  const hours = totalHours % 24
  return { days, hours }
}

function Tooltip({ children, content }) {
  const [open, setOpen] = useState(false)
  return (
    <span
      style={{ position: 'relative', cursor: 'pointer', userSelect: 'none', WebkitUserSelect: 'none' }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onTouchStart={e => { e.preventDefault(); setOpen(o => !o) }}
    >
      {children}
      {open && (
        <span style={{
          position: 'absolute', bottom: 'calc(100% + 8px)', right: 0,
          background: '#2a2a26', border: '1px solid var(--tile-border)',
          padding: '7px 11px', fontSize: '11px', color: 'var(--off-white)',
          whiteSpace: 'nowrap', zIndex: 100, letterSpacing: '0.05em',
          lineHeight: 1.6, fontFamily: 'var(--font-display)', pointerEvents: 'none',
        }}>
          {content}
          <span style={{
            position: 'absolute', top: '100%', right: '12px',
            borderLeft: '5px solid transparent', borderRight: '5px solid transparent',
            borderTop: '5px solid #2a2a26',
          }} />
        </span>
      )}
    </span>
  )
}

export default function BagCard({ bag, gramsPerDrink = 20, onParticipantsChange }) {
  const [participants, setParticipants] = useState(bag.participants || [])
  const [inputVisible, setInputVisible] = useState(false)
  const [nameInput, setNameInput] = useState('')
  const [error, setError] = useState('')
  const [animPrice, setAnimPrice] = useState(null)
  const inputRef = useRef(null)
  const cookieKey = `oddlot_${bag.id}`

  function getMyNames() {
    try { return JSON.parse(localStorage.getItem(cookieKey) || '[]') } catch { return [] }
  }
  function setMyNames(names) { localStorage.setItem(cookieKey, JSON.stringify(names)) }

  const bagWithParts = { ...bag, participants }
  const price = calcPrice(bagWithParts)
  const oz = calcOz(bagWithParts)
  const spotsLeft = (bag.max_spots || 6) - participants.length
  const isFull = spotsLeft <= 0
  const myNames = getMyNames()

  useEffect(() => {
    setAnimPrice(price * 1.8)
    const steps = 12
    for (let i = 0; i <= steps; i++) {
      setTimeout(() => {
        setAnimPrice(price * 1.8 - (price * 1.8 - price) * (i / steps))
      }, 400 + i * 80)
    }
  }, [])

  useEffect(() => {
    setAnimPrice(price)
  }, [participants])

  async function handleJoin() {
    const name = nameInput.trim()
    if (!name) return
    if (participants.some(p => p.name.toLowerCase() === name.toLowerCase())) {
      setError('that name is already in this lot'); return
    }
    if (isFull) { setError('this lot is full'); return }

    const { data, error: err } = await supabase
      .from('participants')
      .insert({ bag_id: bag.id, name, cookie_id: cookieKey })
      .select()
      .single()

    if (err) { setError('something went wrong, try again'); return }

    const updated = [...participants, data]
    setParticipants(updated)
    setMyNames([...myNames, name])
    setNameInput('')
    setInputVisible(false)
    setError('')
    spawnBurst()
    onParticipantsChange?.()
  }

  async function handleRemove(name) {
    if (!myNames.includes(name)) return
    await supabase.from('participants').delete().eq('bag_id', bag.id).eq('name', name)
    const updated = participants.filter(p => p.name !== name)
    setParticipants(updated)
    setMyNames(myNames.filter(n => n !== name))
  }

  function spawnBurst() {
    for (let i = 0; i < 20; i++) {
      setTimeout(() => {
        const el = document.createElement('div')
        el.textContent = '☕'
        el.style.cssText = `position:fixed;pointer-events:none;z-index:9999;font-size:20px;
          left:${50 + (Math.random() - 0.5) * 40}%;
          top:${50 + (Math.random() - 0.5) * 20}%;
          animation:burstFloat 1.8s ease forwards;
          animation-delay:${Math.random() * 0.4}s`
        document.body.appendChild(el)
        setTimeout(() => el.remove(), 2200)
      }, i * 40)
    }
  }

  const cd = calcCountdown(bag.purchase_date)
  const countdownText = cd
    ? `${cd.days > 0 ? cd.days + 'd ' : ''}${cd.hours}h away`
    : 'already purchased'

  const drinks = calcDrinks(oz, gramsPerDrink)

  return (
 <div style={{
  background: 'var(--tile)', display: 'flex', flexDirection: 'column',
  animation: 'cardReveal 0.5s ease forwards', opacity: 0,
  maxWidth: '350px', width: '100%', margin: '0 auto',
}}>
      <style>{`
        @keyframes cardReveal { to { opacity: 1; transform: translateY(0); } }
        @keyframes burstFloat {
          0% { transform: translateY(0) scale(0); opacity: 1; }
          30% { transform: translateY(-40px) scale(1.2); opacity: 1; }
          100% { transform: translateY(-120px) scale(0.6); opacity: 0; }
        }
      `}</style>

      <div style={{ position: 'relative', width: '100%', height: '550px', overflow: 'hidden', background: '#0e0e0c' }}>
        {bag.photo_url
          ? <img src={bag.photo_url} alt={bag.name} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.85, filter: 'saturate(0.7) contrast(1.1)' }} />
          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #1a1a14, #0e0e0a)' }}>
              <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
                <rect x="15" y="10" width="30" height="40" rx="2" stroke="#444" strokeWidth="1.5" fill="none"/>
                <rect x="20" y="16" width="20" height="12" rx="1" stroke="#555" strokeWidth="1" fill="none"/>
                <line x1="15" y1="34" x2="45" y2="34" stroke="#444" strokeWidth="1"/>
                <circle cx="30" cy="42" r="3" stroke="#555" strokeWidth="1" fill="none"/>
              </svg>
            </div>
        }
        <div style={{ position: 'absolute', top: 12, left: 12, background: 'var(--ink)', border: '1px solid var(--tile-border)', fontFamily: 'var(--font-display)', fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--muted)', padding: '4px 8px' }}>
          {bag.roast}
        </div>
        {bag.purchased && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', zIndex: 3 }}>
            <div style={{ border: '3px solid var(--accent)', color: 'var(--accent)', fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 700, letterSpacing: '0.2em', padding: '8px 16px', transform: 'rotate(-12deg)', opacity: 0.9, textTransform: 'uppercase' }}>
              Purchased
            </div>
          </div>
        )}
      </div>

      <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem', borderTop: '1px solid var(--tile-border)' }}>
        <div>
          <div style={{ fontSize: '15px', fontWeight: 500, color: 'var(--off-white)', letterSpacing: '0.05em', lineHeight: 1.3 }}>{bag.name}</div>
          <div style={{ fontSize: '11px', color: 'var(--muted)', letterSpacing: '0.15em', textTransform: 'uppercase', fontFamily: 'var(--font-display)' }}>{bag.origin}</div>
        </div>
        <div style={{ fontSize: '12px', color: '#aaa89e', lineHeight: 1.6, fontWeight: 300 }}>{bag.description}</div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: 'auto' }}>
          <div style={{ background: 'var(--flap-bg)', padding: '8px 10px', border: '1px solid var(--tile-border)' }}>
            <div style={{ fontSize: '9px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '3px', fontFamily: 'var(--font-display)' }}>Best For</div>
            <div style={{ fontSize: '11px', fontWeight: 500, color: 'var(--off-white)' }}>{bag.best_for}</div>
          </div>
          <div style={{ background: 'var(--flap-bg)', padding: '8px 10px', border: '1px solid var(--tile-border)' }}>
            <div style={{ fontSize: '9px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '3px', fontFamily: 'var(--font-display)' }}>Purchase</div>
            <div style={{ fontSize: '11px', fontWeight: 500, color: 'var(--off-white)' }}>
              <Tooltip content={<>{countdownText}<br /><span style={{ color: 'var(--muted)', fontSize: '10px' }}>until purchase</span></>}>
                <span style={{ textDecoration: 'underline', textDecorationStyle: 'dotted', textUnderlineOffset: '3px', textDecorationColor: 'var(--muted)' }}>{bag.purchase_date}</span>
              </Tooltip>
            </div>
          </div>

          <div style={{ background: 'var(--flap-bg)', padding: '10px 12px', border: '1px solid var(--tile-border)', gridColumn: '1 / -1', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ fontSize: '9px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: 'var(--font-display)' }}>Per Person</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap' }}>
                  {Array.from({ length: bag.max_spots }, (_, i) => (
                    <div key={i} style={{ width: '8px', height: '8px', borderRadius: '50%', background: i < participants.length ? 'var(--accent)' : 'transparent', border: i < participants.length ? 'none' : '1px solid var(--muted)', transition: 'background 0.3s' }} />
                  ))}
                </div>
                <span style={{ fontSize: '10px', color: 'var(--muted)', fontFamily: 'var(--font-display)', letterSpacing: '0.1em' }}>{spotsLeft > 0 ? `${spotsLeft} left` : 'full'}</span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
              {animPrice !== null && <PriceFlap value={animPrice} />}
              <div style={{ width: '1px', height: '24px', background: 'var(--tile-border)' }} />
              <Tooltip content={<><span style={{ fontSize: '13px', color: 'var(--accent)', fontWeight: 700 }}>~{drinks} drink{drinks === 1 ? '' : 's'}</span><br /><span style={{ color: 'var(--muted)', fontSize: '10px' }}>at {gramsPerDrink}g per brew</span></>}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '12px', color: 'var(--muted)', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
                  @ <span style={{ color: 'var(--off-white)', fontSize: '13px', textDecoration: 'underline', textDecorationStyle: 'dotted', textUnderlineOffset: '3px', textDecorationColor: 'var(--muted)' }}>{fmtOz(oz)}</span> oz
                </span>
              </Tooltip>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', minHeight: '28px' }}>
          {participants.map(p => (
            <div key={p.id} style={{ background: 'var(--flap-bg)', border: '1px solid var(--tile-border)', fontSize: '11px', color: 'var(--off-white)', padding: '4px 10px', fontFamily: 'var(--font-display)', letterSpacing: '0.05em', animation: 'tagPop 0.2s ease' }}>
              {p.name}
              {myNames.includes(p.name) && (
                <span onClick={() => handleRemove(p.name)} style={{ color: 'var(--accent)', cursor: 'pointer', fontSize: '10px', marginLeft: '6px' }}>✕</span>
              )}
            </div>
          ))}
        </div>

        <div style={{ marginTop: 'auto', paddingTop: '0.75rem', borderTop: '1px solid var(--tile-border)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {inputVisible && (
            <div style={{ display: 'flex', gap: '6px' }}>
              <input
                ref={inputRef}
                value={nameInput}
                onChange={e => setNameInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleJoin()}
                placeholder="your name"
                maxLength={24}
                style={{ flex: 1, background: 'var(--flap-bg)', border: '1px solid var(--tile-border)', color: 'var(--off-white)', fontFamily: 'var(--font-display)', fontSize: '13px', padding: '8px 10px', outline: 'none', letterSpacing: '0.05em' }}
              />
              <button onClick={handleJoin} style={{ background: 'var(--accent)', color: '#fff', border: '1px solid var(--accent)', fontFamily: 'var(--font-display)', fontSize: '11px', letterSpacing: '0.15em', padding: '10px 16px' }}>+</button>
              <button onClick={() => { setInputVisible(false); setError(''); setNameInput('') }} style={{ background: 'transparent', color: 'var(--muted)', border: '1px solid var(--tile-border)', fontFamily: 'var(--font-display)', fontSize: '11px', letterSpacing: '0.15em', padding: '10px 16px' }}>✕</button>
            </div>
          )}
          {error && <div style={{ fontSize: '11px', color: '#e05050', fontFamily: 'var(--font-display)', letterSpacing: '0.05em' }}>{error}</div>}
          <button
            onClick={() => { setInputVisible(true); setTimeout(() => inputRef.current?.focus(), 50) }}
            disabled={bag.purchased || isFull}
            style={{ background: 'transparent', border: '1px solid var(--accent)', color: bag.purchased || isFull ? 'var(--muted)' : '#a04818', fontFamily: 'var(--font-display)', fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', padding: '10px 16px', width: '100%', transition: 'all 0.2s', opacity: bag.purchased || isFull ? 0.35 : 1 }}
            onMouseEnter={e => { if (!bag.purchased && !isFull) { e.target.style.background = 'var(--accent)'; e.target.style.color = '#fff' }}}
            onMouseLeave={e => { e.target.style.background = 'transparent'; e.target.style.color = bag.purchased || isFull ? 'var(--muted)' : '#a04818' }}
          >
            {bag.purchased ? 'purchased' : isFull ? 'lot full' : '+ count me in'}
          </button>
        </div>
      </div>
      <style>{`@keyframes tagPop { 0%{transform:scale(0.8);opacity:0} 100%{transform:scale(1);opacity:1} }`}</style>
    </div>
  )
}