
import React, { useEffect, useRef, useState } from 'react'

const CHARS = ' ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.,$@'

function FlapUnit({ char, size = 'logo' }) {
  const ref = useRef(null)
  const prevChar = useRef(char)

  useEffect(() => {
    if (!ref.current || prevChar.current === char) return
    ref.current.classList.remove('flipping')
    void ref.current.offsetWidth
    ref.current.classList.add('flipping')
    const t = setTimeout(() => {
      if (ref.current) ref.current.classList.remove('flipping')
    }, 200)
    prevChar.current = char
    return () => clearTimeout(t)
  }, [char])

  const isLogo = size === 'logo'
  const unitStyle = {
    display: 'inline-flex',
    width: isLogo ? '28px' : '22px',
    height: isLogo ? '38px' : '30px',
    background: 'var(--flap-face)',
    borderRadius: '3px',
    border: '1px solid #333330',
    overflow: 'hidden',
    position: 'relative',
    boxShadow: '0 2px 8px rgba(0,0,0,0.6)',
    flexShrink: 0,
  }
  const lineStyle = {
    content: '""',
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
    fontSize: isLogo ? '20px' : '16px',
    fontWeight: 700,
    color: size === 'price' ? 'var(--accent)' : 'var(--flap-text)',
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  }

  return (
    <div ref={ref} style={unitStyle} className="flap-unit">
      <div style={lineStyle} />
      <div style={charStyle}>{char}</div>
      <style>{`
        .flap-unit.flipping {
          animation: flapFlip 0.15s ease-in-out;
        }
        @keyframes flapFlip {
          0% { transform: rotateX(0); }
          40% { transform: rotateX(90deg); background: #0e0e0c; }
          100% { transform: rotateX(0); }
        }
      `}</style>
    </div>
  )
}

export function LogoFlap({ words = ['ODDLOT'] }) {
  const TOTAL = 12
  const wordRef = useRef(0)
  const charsRef = useRef(Array(TOTAL).fill(' '))
  const [chars, setChars] = useStateRef(Array(TOTAL).fill(' '))

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
    }, 4000)

    return () => { clearTimeout(timeout); clearInterval(interval) }
  }, [words])

  return (
    <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
      {chars.map((c, i) => (
        <FlapUnit key={i} char={c} size="logo" />
      ))}
    </div>
  )
}

export function PriceFlap({ value }) {
  const chars = ('$' + value.toFixed(2)).split('')
  return (
    <div style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
      {chars.map((c, i) => (
        <FlapUnit key={i} char={c} size="price" />
      ))}
    </div>
  )
}

function useStateRef(initial) {
  const [state, setState] = React.useState(initial)
  return [state, setState]
}