import React, { useEffect, useRef, useState } from 'react'

const CHARS = ' ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.,$@'

function getIndex(c) {
  const i = CHARS.indexOf(c.toUpperCase())
  return i === -1 ? 0 : i
}

function FlapUnit({ targetChar, size = 'logo' }) {
  const [displayChar, setDisplayChar] = useState(' ')
  const intervalRef = useRef(null)
  const currentIndexRef = useRef(0)

  useEffect(() => {
    const target = targetChar.toUpperCase()
    const targetIndex = getIndex(target)

    if (intervalRef.current) clearInterval(intervalRef.current)

    const tick = () => {
      currentIndexRef.current = (currentIndexRef.current + 1) % CHARS.length
      setDisplayChar(CHARS[currentIndexRef.current])
      if (currentIndexRef.current === targetIndex) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    if (currentIndexRef.current !== targetIndex) {
      intervalRef.current = setInterval(tick, 80)
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [targetChar])

  const isLogo = size === 'logo'

  const unitStyle = {
    display: 'inline-flex',
    width: isLogo ? '34px' : '22px',
    height: isLogo ? '46px' : '30px',
    background: 'var(--flap-face)',
    borderRadius: '3px',
    border: '1px solid #333330',
    overflow: 'hidden',
    position: 'relative',
    boxShadow: '0 2px 8px rgba(0,0,0,0.6)',
    flexShrink: 0,
  }

  const lineStyle = {
    position: 'absolute',
    left: 0, right: 0,
    top: '50%',
    height: '1px',
    background: '#111110',
    zIndex: 2,
    pointerEvents: 'none',
  }

  const charStyle = {
    fontFamily: 'var(--font-display)',
    fontSize: isLogo ? '24px' : '16px',
    fontWeight: 700,
    color: size === 'price' ? 'var(--accent)' : 'var(--flap-text)',
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
    transition: 'none',
  }

  return (
    <div style={unitStyle} className="flap-unit">
      <div style={lineStyle} />
      <div style={charStyle} className="flap-char">{displayChar}</div>
      <style>{`
        .flap-char {
          animation: flapTick 0.08s ease-in-out;
        }
        @keyframes flapTick {
          0% { transform: rotateX(0deg); opacity: 1; }
          40% { transform: rotateX(90deg); opacity: 0.3; }
          100% { transform: rotateX(0deg); opacity: 1; }
        }
      `}</style>
    </div>
  )
}

export function LogoFlap({ words = ['ODDLOT'] }) {
  const TOTAL = 12
  const wordRef = useRef(0)
  const [chars, setChars] = useState(Array(TOTAL).fill(' '))

  function padWord(word) {
    const w = word.slice(0, TOTAL)
    const totalPad = TOTAL - w.length
    const left = Math.floor(totalPad / 2)
    const right = Math.ceil(totalPad / 2)
    return ' '.repeat(left) + w + ' '.repeat(right)
  }

  useEffect(() => {
    const timeout = setTimeout(() => {
      setChars(padWord(words[0]).split(''))
    }, 300)

    const interval = setInterval(() => {
      wordRef.current = (wordRef.current + 1) % words.length
      setChars(padWord(words[wordRef.current]).split(''))
    }, 6000)

    return () => { clearTimeout(timeout); clearInterval(interval) }
  }, [words])

  return (
    <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
      {chars.map((c, i) => (
        <FlapUnit key={i} targetChar={c} size="logo" />
      ))}
    </div>
  )
}

export function PriceFlap({ value }) {
  const chars = ('$' + value.toFixed(2)).split('')
  return (
    <div style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
      {chars.map((c, i) => (
        <FlapUnit key={i} targetChar={c} size="price" />
      ))}
    </div>
  )
}