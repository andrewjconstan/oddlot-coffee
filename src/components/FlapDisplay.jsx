import React, { useEffect, useRef, useState } from 'react'

const CHARS = ' ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.,$@'
const PRICE_CHARS = ' 0123456789.'

function getIndex(chars, c) {
  const i = chars.indexOf(c.toUpperCase())
  return i === -1 ? 0 : i
}

function FlapUnit({ targetChar, size = 'logo', charSet = CHARS.split(''), animate = true }) {
  const [currentChar, setCurrentChar] = useState(' ')
  const [nextChar, setNextChar] = useState(' ')
  const [flipping, setFlipping] = useState(false)
  const currentIndexRef = useRef(0)
  const targetIndexRef = useRef(0)
  const timeoutRef = useRef(null)

  const isLogo = size === 'logo'
  const w = isLogo ? '34px' : '22px'
  const h = isLogo ? '46px' : '30px'
  const fs = isLogo ? '24px' : '16px'
  const color = size === 'price' ? 'var(--accent)' : 'var(--flap-text)'

  useEffect(() => {
    if (!animate && size === 'price') {
      const idx = charSet.indexOf(targetChar.toUpperCase()) === -1 ? 0 : charSet.indexOf(targetChar.toUpperCase())
      setCurrentChar(targetChar)
      setNextChar(targetChar)
      currentIndexRef.current = idx
      targetIndexRef.current = idx
      return
    }
    const target = targetChar.toUpperCase()
    targetIndexRef.current = getIndex(charSet, target)
    scheduleNext()
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current) }
  }, [targetChar, animate])

  function scheduleNext() {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(doFlip, 50)
  }

  function doFlip() {
    if (currentIndexRef.current === targetIndexRef.current) return
    const next = (currentIndexRef.current + 1) % charSet.length
    const nextC = charSet[next]
    setNextChar(nextC)
    setFlipping(true)
    timeoutRef.current = setTimeout(() => {
      currentIndexRef.current = next
      setCurrentChar(nextC)
      setFlipping(false)
      if (next !== targetIndexRef.current) scheduleNext()
    }, 100)
  }

  const card = {
    position: 'relative',
    width: w, height: h,
    display: 'inline-flex',
    flexShrink: 0,
    perspective: '200px',
  }

  const half = {
    position: 'absolute',
    left: 0, right: 0,
    width: '100%',
    height: '50%',
    overflow: 'hidden',
    background: 'var(--flap-face)',
    border: '1px solid #333330',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 8px rgba(0,0,0,0.6)',
  }

  const charEl = (char, clip) => (
    <div style={{
      fontFamily: 'var(--font-display)',
      fontSize: fs,
      fontWeight: 700,
      color,
      position: 'absolute',
      width: '100%',
      height: '200%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      top: clip === 'top' ? 0 : '-100%',
      userSelect: 'none',
    }}>{char}</div>
  )

  const dividerStyle = {
    position: 'absolute',
    left: 0, right: 0,
    top: '50%',
    height: '1.5px',
    background: '#0a0a08',
    zIndex: 10,
    transform: 'translateY(-50%)',
  }

  const flapStyle = {
    position: 'absolute',
    left: 0, right: 0,
    top: 0,
    width: '100%',
    height: '50%',
    overflow: 'hidden',
    background: 'var(--flap-face)',
    border: '1px solid #2a2a28',
    transformOrigin: 'bottom center',
    transformStyle: 'preserve-3d',
    zIndex: 5,
    animation: flipping ? 'flapDown 0.1s ease-in forwards' : 'none',
    borderRadius: '2px 2px 0 0',
  }

  return (
    <div style={card}>
      <style>{`
        @keyframes flapDown {
          0%   { transform: rotateX(0deg); background: var(--flap-face); }
          49%  { transform: rotateX(-90deg); background: #111110; }
          50%  { transform: rotateX(-90deg); background: #111110; }
          100% { transform: rotateX(-180deg); background: #1e1e1c; opacity: 0; }
        }
      `}</style>
      <div style={{ ...half, top: 0, borderRadius: '2px 2px 0 0', borderBottom: 'none' }}>
        {charEl(currentChar, 'top')}
      </div>
      <div style={{ ...half, bottom: 0, borderRadius: '0 0 2px 2px', borderTop: 'none' }}>
        {charEl(nextChar, 'bottom')}
      </div>
      <div style={{ ...half, bottom: 0, borderRadius: '0 0 2px 2px', borderTop: 'none', zIndex: 2 }}>
        {charEl(currentChar, 'bottom')}
      </div>
      <div style={flapStyle}>
        {charEl(currentChar, 'top')}
      </div>
      <div style={dividerStyle} />
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
    }, 10500)
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

export function PriceFlap({ value, animate = true }) {
  const chars = ('$' + value.toFixed(2)).split('')
  return (
    <div style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
      {chars.map((c, i) => (
        <FlapUnit
          key={i}
          targetChar={c}
          size="price"
          charSet={c === '$' ? ['$'] : PRICE_CHARS.split('')}
          animate={animate}
        />
      ))}
    </div>
  )
}