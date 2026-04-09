import React, { useEffect, useRef, useState } from 'react'

function FlapUnit({ char, size = 'logo', animDelay = 0 }) {
  const ref = useRef(null)
  const prevChar = useRef(char)

  useEffect(() => {
    if (!ref.current || prevChar.current === char) return
    setTimeout(() => {
      if (!ref.current) return
      ref.current.classList.remove('flipping')
      void ref.current.offsetWidth
      ref.current.classList.add('flipping')
      const t = setTimeout(() => {
        if (ref.current) ref.current.classList.remove('flipping')
      }, 400)
      prevChar.current = char
      return () => clearTimeout(t)
    }, animDelay)
  }, [char, animDelay])

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
  }

  return (
    <div ref={ref} style={unitStyle} className="flap-unit">
      <div style={lineStyle} />
      <div style={charStyle}>{char}</div>
      <style>{`
        .flap-unit.flipping {
          animation: flapFlip 0.3s ease-in-out;
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
  const [chars, setChars] = useState(Array(TOTAL).fill(' '))
  const [delays, setDelays] = useState(Array(TOTAL).fill(0))

  function padWord(word) {
    const w = word.slice(0, TOTAL)
    const totalPad = TOTAL - w.length
    const left = Math.floor(totalPad / 2)
    const right = Math.ceil(totalPad / 2)
    return ' '.repeat(left) + w + ' '.repeat(right)
  }

  function randomDelays() {
    return Array.from({ length: TOTAL }, () => Math.floor(Math.random() * 800))
  }

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDelays(randomDelays())
      setChars(padWord(words[0]).split(''))
    }, 300)

    const interval = setInterval(() => {
      wordRef.current = (wordRef.current + 1) % words.length
      setDelays(randomDelays())
      setChars(padWord(words[wordRef.current]).split(''))
    }, 5000)

    return () => { clearTimeout(timeout); clearInterval(interval) }
  }, [words])

  return (
    <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
      {chars.map((c, i) => (
        <FlapUnit key={i} char={c} size="logo" animDelay={delays[i]} />
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