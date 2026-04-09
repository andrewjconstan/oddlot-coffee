import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD

function Field({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <label style={{ fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: 'var(--font-display)' }}>{label}</label>
      {children}
    </div>
  )
}

const inputStyle = {
  background: 'var(--flap-bg)', border: '1px solid var(--tile-border)',
  color: 'var(--off-white)', fontFamily: 'var(--font-display)', fontSize: '13px',
  padding: '8px 10px', outline: 'none', letterSpacing: '0.05em', width: '100%',
}

const btnStyle = {
  background: 'var(--accent)', color: '#fff', border: '1px solid var(--accent)',
  fontFamily: 'var(--font-display)', fontSize: '11px', letterSpacing: '0.15em',
  textTransform: 'uppercase', padding: '10px 20px', cursor: 'pointer',
}

export default function Admin() {
  const [authed, setAuthed] = useState(false)
  const [pw, setPw] = useState('')
  const [pwError, setPwError] = useState('')
  const [bags, setBags] = useState([])
  const [config, setConfig] = useState({})
  const [logoWords, setLogoWords] = useState([])
  const [newWord, setNewWord] = useState('')
  const [editingBag, setEditingBag] = useState(null)
  const [saving, setSaving] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [message, setMessage] = useState('')

  const emptyBag = {
    name: '', origin: '', roast: 'Light', best_for: '', description: '',
    total_cost: '', shipping_cost: '', tax_amount: '', total_oz: '',
    purchase_date: '', purchase_url: '', roaster_name: '', process_method: '',
    tasting_notes: '', max_spots: 6, purchased: false, photo_url: '',
  }

  useEffect(() => {
    if (authed) fetchAll()
  }, [authed])

  async function fetchAll() {
    const [bagsRes, configRes] = await Promise.all([
      supabase.from('bags').select('*').order('display_order'),
      supabase.from('config').select('*'),
    ])
    if (bagsRes.data) setBags(bagsRes.data)
    if (configRes.data) {
      const cfg = {}
      configRes.data.forEach(row => { cfg[row.key] = row.value })
      setConfig(cfg)
      setLogoWords(cfg.logo_words || ['ODDLOT'])
    }
  }

  function handleLogin() {
    if (pw === ADMIN_PASSWORD) { setAuthed(true); setPwError('') }
    else setPwError('incorrect password')
  }

  async function saveBag() {
    setSaving(true)
    const payload = {
      ...editingBag,
      total_cost: parseFloat(editingBag.total_cost) || 0,
      shipping_cost: parseFloat(editingBag.shipping_cost) || 0,
      tax_amount: parseFloat(editingBag.tax_amount) || 0,
      total_oz: parseFloat(editingBag.total_oz) || 0,
      max_spots: parseInt(editingBag.max_spots) || 6,
      display_order: parseInt(editingBag.display_order) || 0,
      updated_at: new Date().toISOString(),
    }
    if (editingBag.id) {
      await supabase.from('bags').update(payload).eq('id', editingBag.id)
    } else {
      await supabase.from('bags').insert(payload)
    }
    setEditingBag(null)
    setSaving(false)
    setMessage('saved.')
    setTimeout(() => setMessage(''), 2000)
    fetchAll()
  }

  async function markPurchased(bag) {
    const participants = await supabase.from('participants').select('*').eq('bag_id', bag.id)
    const partList = participants.data || []
    const total = (bag.total_cost || 0) + (bag.shipping_cost || 0) + (bag.tax_amount || 0)
    const n = partList.length || 1

    await supabase.from('history').insert({
      bag_id: bag.id,
      name: bag.name, origin: bag.origin, roast: bag.roast,
      best_for: bag.best_for, description: bag.description,
      total_cost: bag.total_cost, shipping_cost: bag.shipping_cost,
      tax_amount: bag.tax_amount, total_oz: bag.total_oz,
      purchase_url: bag.purchase_url, roaster_name: bag.roaster_name,
      process_method: bag.process_method, tasting_notes: bag.tasting_notes,
      photo_url: bag.photo_url,
      participant_count: partList.length,
      cost_per_person: total / n,
      oz_per_person: (bag.total_oz || 0) / n,
      participants: partList.map(p => ({ name: p.name, cookie_id: p.cookie_id })),
      purchased_at: new Date().toISOString(),
    })
    await supabase.from('bags').update({ purchased: true }).eq('id', bag.id)
    setMessage('marked as purchased and archived.')
    setTimeout(() => setMessage(''), 3000)
    fetchAll()
  }

  async function deleteBag(id) {
    if (!confirm('delete this bag?')) return
    await supabase.from('bags').delete().eq('id', id)
    fetchAll()
  }

  async function saveLogoWords() {
    await supabase.from('config').upsert({ key: 'logo_words', value: logoWords, updated_at: new Date().toISOString() })
    setMessage('logo words saved.')
    setTimeout(() => setMessage(''), 2000)
  }

  async function saveConfig(key, value) {
    await supabase.from('config').upsert({ key, value, updated_at: new Date().toISOString() })
    setMessage('settings saved.')
    setTimeout(() => setMessage(''), 2000)
  }

  if (!authed) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ background: 'var(--tile)', border: '1px solid var(--tile-border)', padding: '2rem', width: '320px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '12px', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--muted)' }}>admin access</div>
          <input type="password" value={pw} onChange={e => setPw(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()} placeholder="password" style={inputStyle} />
          {pwError && <div style={{ fontSize: '11px', color: '#e05050', fontFamily: 'var(--font-display)' }}>{pwError}</div>}
          <button onClick={handleLogin} style={btnStyle}>enter</button>
        </div>
      </div>
    )
  }

  async function handlePhotoUpload(e) {
    const file = e.target.files[0]
    if (!file) return
    setUploadingPhoto(true)
    const ext = file.name.split('.').pop()
    const filename = `${Date.now()}.${ext}`
    const { data, error } = await supabase.storage
      .from('bag-photos')
      .upload(filename, file, { upsert: true })
    if (error) {
      alert('upload failed: ' + error.message)
      setUploadingPhoto(false)
      return
    }
    const { data: urlData } = supabase.storage
      .from('bag-photos')
      .getPublicUrl(filename)
    setEditingBag(b => ({ ...b, photo_url: urlData.publicUrl }))
    setUploadingPhoto(false)
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface)', padding: '2rem', maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', borderBottom: '1px solid var(--tile-border)', paddingBottom: '1rem' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '14px', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--off-white)' }}>oddlot admin</div>
        {message && <div style={{ fontFamily: 'var(--font-display)', fontSize: '11px', color: 'var(--accent)', letterSpacing: '0.1em' }}>{message}</div>}
      </div>

      {/* Bags section */}
      <section style={{ marginBottom: '3rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div style={{ fontSize: '10px', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: 'var(--font-display)' }}>— bags —</div>
          <button onClick={() => setEditingBag(emptyBag)} style={btnStyle}>+ new bag</button>
        </div>

        {bags.map(bag => (
          <div key={bag.id} style={{ background: 'var(--tile)', border: '1px solid var(--tile-border)', padding: '1rem', marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '14px', fontWeight: 500, color: bag.purchased ? 'var(--muted)' : 'var(--off-white)' }}>{bag.name}</div>
              <div style={{ fontSize: '11px', color: 'var(--muted)', fontFamily: 'var(--font-display)', letterSpacing: '0.1em' }}>{bag.origin} · {bag.roast} · ${bag.total_cost} · {bag.total_oz}oz · {bag.max_spots} spots {bag.purchased ? '· PURCHASED' : ''}</div>
            </div>
            <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
              <button onClick={() => setEditingBag({ ...bag })} style={{ ...btnStyle, background: 'transparent', color: 'var(--muted)', borderColor: 'var(--tile-border)' }}>edit</button>
              {!bag.purchased && <button onClick={() => markPurchased(bag)} style={{ ...btnStyle, background: 'transparent', color: 'var(--accent)', borderColor: 'var(--accent)' }}>mark purchased</button>}
              <button onClick={() => deleteBag(bag.id)} style={{ ...btnStyle, background: 'transparent', color: '#e05050', borderColor: '#e05050' }}>delete</button>
            </div>
          </div>
        ))}
      </section>

      {/* Edit/New bag form */}
      {editingBag && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '1rem' }}>
          <div style={{ background: 'var(--tile)', border: '1px solid var(--tile-border)', padding: '2rem', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '12px', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '0.5rem' }}>{editingBag.id ? 'edit bag' : 'new bag'}</div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <Field label="Name"><input style={inputStyle} value={editingBag.name} onChange={e => setEditingBag(b => ({ ...b, name: e.target.value }))} /></Field>
              <Field label="Origin"><input style={inputStyle} value={editingBag.origin} onChange={e => setEditingBag(b => ({ ...b, origin: e.target.value }))} /></Field>
              <Field label="Roast">
                <select style={inputStyle} value={editingBag.roast} onChange={e => setEditingBag(b => ({ ...b, roast: e.target.value }))}>
                  <option>Dark</option>
                  <option>Medium Dark</option>
                  <option>Medium</option>
                  <option>Medium Light</option>
                  <option>Light</option>
                  <option>Blonde</option>
                </select>
              </Field>
              <Field label="Best For"><input style={inputStyle} value={editingBag.best_for} onChange={e => setEditingBag(b => ({ ...b, best_for: e.target.value }))} /></Field>
              <Field label="Total Cost ($)"><input style={inputStyle} type="number" value={editingBag.total_cost} onChange={e => setEditingBag(b => ({ ...b, total_cost: e.target.value }))} /></Field>
              <Field label="Shipping Cost ($)"><input style={inputStyle} type="number" value={editingBag.shipping_cost} onChange={e => setEditingBag(b => ({ ...b, shipping_cost: e.target.value }))} /></Field>
              <Field label="Tax ($)"><input style={inputStyle} type="number" value={editingBag.tax_amount} onChange={e => setEditingBag(b => ({ ...b, tax_amount: e.target.value }))} /></Field>
              <Field label="Total Oz"><input style={inputStyle} type="number" value={editingBag.total_oz} onChange={e => setEditingBag(b => ({ ...b, total_oz: e.target.value }))} /></Field>
              <Field label="Purchase Date">
                <input
                  style={inputStyle}
                  type="date"
                  value={editingBag.purchase_date
                    ? (() => { const d = new Date(editingBag.purchase_date); return isNaN(d) ? '' : `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}` })()
                    : new Date().toISOString().split('T')[0]
                  }
                  onChange={e => {
                    const [year, month, day] = e.target.value.split('-')
                    const d = new Date(year, month - 1, day)
                    const formatted = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                    setEditingBag(b => ({ ...b, purchase_date: formatted }))
                  }}
                />
              </Field>
              <Field label="Max Spots"><input style={inputStyle} type="number" value={editingBag.max_spots} onChange={e => setEditingBag(b => ({ ...b, max_spots: e.target.value }))} /></Field>
              {/* <Field label="Display Order"><input style={inputStyle} type="number" value={editingBag.display_order} onChange={e => setEditingBag(b => ({ ...b, display_order: e.target.value }))} /></Field> */}
              <Field label="Roaster Name"><input style={inputStyle} value={editingBag.roaster_name || ''} onChange={e => setEditingBag(b => ({ ...b, roaster_name: e.target.value }))} /></Field>
              <Field label="Process Method"><input style={inputStyle} value={editingBag.process_method || ''} onChange={e => setEditingBag(b => ({ ...b, process_method: e.target.value }))} /></Field>
              <Field label="Purchase URL"><input style={inputStyle} value={editingBag.purchase_url || ''} onChange={e => setEditingBag(b => ({ ...b, purchase_url: e.target.value }))} /></Field>
            </div>

            <Field label="Tasting Notes"><input style={inputStyle} value={editingBag.tasting_notes || ''} onChange={e => setEditingBag(b => ({ ...b, tasting_notes: e.target.value }))} /></Field>
            <Field label="Description"><textarea style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }} value={editingBag.description} onChange={e => setEditingBag(b => ({ ...b, description: e.target.value }))} /></Field>
            <Field label="Photo">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {editingBag.photo_url && (
                  <img src={editingBag.photo_url} alt="bag preview" style={{ width: '100%', maxHeight: '200px', objectFit: 'cover', opacity: 0.85, filter: 'saturate(0.7) contrast(1.1)' }} />
                )}
                <label style={{
                  background: 'transparent', border: '1px solid var(--tile-border)',
                  color: 'var(--muted)', fontFamily: 'var(--font-display)', fontSize: '11px',
                  letterSpacing: '0.2em', textTransform: 'uppercase', padding: '10px 16px',
                  cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s',
                  display: 'block',
                }}>
                  {uploadingPhoto ? 'uploading...' : editingBag.photo_url ? 'replace photo' : 'upload photo'}
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handlePhotoUpload}
                  />
                </label>
                {editingBag.photo_url && (
                  <input
                    style={{ ...inputStyle, fontSize: '10px', color: 'var(--muted)' }}
                    value={editingBag.photo_url}
                    onChange={e => setEditingBag(b => ({ ...b, photo_url: e.target.value }))}
                    placeholder="or paste a URL"
                  />
                )}
              </div>
            </Field>

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              <button onClick={() => setEditingBag(null)} style={{ ...btnStyle, background: 'transparent', color: 'var(--muted)', borderColor: 'var(--tile-border)' }}>cancel</button>
              <button onClick={saveBag} disabled={saving} style={btnStyle}>{saving ? 'saving...' : 'save bag'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Logo words */}
      <section style={{ marginBottom: '3rem' }}>
        <div style={{ fontSize: '10px', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: 'var(--font-display)', marginBottom: '1rem' }}>— flap words (max 12 chars) —</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '1rem' }}>
          {logoWords.map((word, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ flex: 1, background: 'var(--flap-bg)', border: '1px solid var(--tile-border)', padding: '8px 10px', fontFamily: 'var(--font-display)', fontSize: '13px', color: i === 0 ? 'var(--muted)' : 'var(--off-white)', letterSpacing: '0.1em' }}>{word}{i === 0 ? ' (locked)' : ''}</div>
              {i > 0 && (
                <button onClick={() => setLogoWords(w => w.filter((_, j) => j !== i))} style={{ ...btnStyle, background: 'transparent', color: '#e05050', borderColor: '#e05050', padding: '8px 12px' }}>✕</button>
              )}
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input style={{ ...inputStyle, flex: 1 }} value={newWord} onChange={e => setNewWord(e.target.value.toUpperCase().slice(0, 12))} placeholder="NEW WORD (max 12 chars)" maxLength={12} onKeyDown={e => { if (e.key === 'Enter' && newWord.trim()) { setLogoWords(w => [...w, newWord.trim()]); setNewWord('') } }} />
          <button onClick={() => { if (newWord.trim()) { setLogoWords(w => [...w, newWord.trim()]); setNewWord('') } }} style={btnStyle}>add</button>
        </div>
        <button onClick={saveLogoWords} style={{ ...btnStyle, marginTop: '1rem' }}>save words</button>
      </section>

      {/* Site settings */}
      <section style={{ marginBottom: '3rem' }}>
        <div style={{ fontSize: '10px', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: 'var(--font-display)', marginBottom: '1rem' }}>— site settings —</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <Field label="Tagline">
            <input style={inputStyle} defaultValue={config.tagline || ''} onBlur={e => saveConfig('tagline', e.target.value)} />
          </Field>
          <Field label="Recommend Email">
            <input style={inputStyle} defaultValue={config.recommend_email || ''} onBlur={e => saveConfig('recommend_email', e.target.value)} />
          </Field>
          <Field label="Grams Per Drink">
            <input style={inputStyle} type="number" defaultValue={config.grams_per_drink || 20} onBlur={e => saveConfig('grams_per_drink', parseInt(e.target.value))} />
          </Field>
        </div>
      </section>
    </div>
  )
}