import React, { useEffect, useRef, useState } from 'react'

/* ---------- Icons (Font Awesome 6 style, inline SVG) ---------- */
const svg = (d, vb = '0 0 16 16') => (p) => (
  <svg width="16" height="16" viewBox={vb} fill="currentColor" aria-hidden="true" {...p}>{d}</svg>
)
export const Icon = {
  info: svg(<path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1Zm.9 10.6H7.1V7h1.8v4.6ZM8 5.9a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z" />),
  warn: svg(<path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1Zm.9 10.6H7.1V9.8h1.8v1.8Zm0-3H7.1V4.4h1.8v4.2Z" />),
  check: svg(<path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1Zm-1 10.2L3.8 8l1.2-1.2 2 2 4-4L12.2 6 7 11.2Z" />),
  chevron: svg(<path d="M3.5 6 8 10.5 12.5 6l-1-1L8 8.5 4.5 5z" />),
  close: svg(<path d="M4.2 3.1 8 6.9l3.8-3.8 1.1 1.1L9.1 8l3.8 3.8-1.1 1.1L8 9.1l-3.8 3.8-1.1-1.1L6.9 8 3.1 4.2z" />),
  back: svg(<path d="M7 3 2 8l5 5 1-1-3.3-3.3H14V7.3H4.7L8 4z" />),
  search: svg(<path d="M7 2a5 5 0 0 1 4 8l3 3-1 1-3-3A5 5 0 1 1 7 2Zm0 1.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z" />),
  edit: svg(<path d="M11.3 1.6 14.4 4.7 6 13.1H2.9V10L11.3 1.6Zm0 2.1L4.4 10.6v1h1l6.9-6.9-1-1Z" />),
  trash: svg(<path d="M6 1h4l.6 1H14v1.5H2V2h3.4L6 1Zm-3 3.5h10l-.7 10.5H3.7L3 4.5Zm3 1.8v6.9h1.2V6.3H6Zm2.8 0v6.9H10V6.3H8.8Z" />),
  download: svg(<path d="M7.2 1.5h1.6v7l2.6-2.6 1.1 1.1L8 11.5 3.5 7l1.1-1.1 2.6 2.6v-7ZM2 13h12v1.5H2z" />),
  upload: svg(<path d="M8 1.5 12.5 6l-1.1 1.1-2.6-2.6v7H7.2v-7L4.6 7.1 3.5 6 8 1.5ZM2 13h12v1.5H2z" />),
  sign: svg(<path d="M2 12.5c2-3 3-6 4.5-6S6 11 8 11s2-3 3.5-3 1 3 2.5 3v1.5c-2 0-1.8-2.5-2.5-2.5S9.7 12.5 8 12.5 5 9 6.3 8 3.8 12 3.2 13.3L2 12.5Z" />),
  shield: svg(<path d="M8 1 2.5 3v4.5C2.5 11 5 13.6 8 15c3-1.4 5.5-4 5.5-7.5V3L8 1Zm-1 9.6L4.6 8.2l1.1-1.1L7 8.4l3.3-3.3 1.1 1.1L7 10.6Z" />),
  minusSq: svg(<path d="M2 2h12v12H2V2Zm1.3 1.3v9.4h9.4V3.3H3.3ZM5 7.3h6v1.4H5z" />),
  plusSq: svg(<path d="M2 2h12v12H2V2Zm1.3 1.3v9.4h9.4V3.3H3.3ZM7.3 5h1.4v2.3H11v1.4H8.7V11H7.3V8.7H5V7.3h2.3z" />),
  file: svg(<path d="M3 1h6.5L13 4.5V15H3V1Zm1.5 1.5v11h7V5.2H8.8V2.5H4.5Z" />),
  bell: svg(<path d="M8 1.5a1 1 0 0 1 1 1v.6a4.5 4.5 0 0 1 3.5 4.4v3l1.5 1.5v.5H2v-.5L3.5 10.5v-3A4.5 4.5 0 0 1 7 3.1v-.6a1 1 0 0 1 1-1ZM6.5 14h3a1.5 1.5 0 0 1-3 0Z" />, '0 0 16 16'),
  help: svg(<path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1Zm0 1.3a5.7 5.7 0 1 1 0 11.4A5.7 5.7 0 0 1 8 2.3Zm-.1 1.9c-1.4 0-2.4.8-2.5 2.1h1.4c0-.6.5-.9 1.1-.9.6 0 1 .4 1 .9 0 .4-.2.7-.8 1.1-.7.4-1 .9-.9 1.7v.3h1.4v-.3c0-.5.2-.7.8-1.1.6-.4 1-.9 1-1.7 0-1.2-1-2.1-2.5-2.1Zm-.1 6.4a.9.9 0 1 0 0 1.8.9.9 0 0 0 0-1.8Z" />),
  gauge: svg(<path d="M8 1.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13Zm0 1.3a5.2 5.2 0 1 1 0 10.4A5.2 5.2 0 0 1 8 2.8Zm-.6 2.5 1.2 0-.1 3.7a1 1 0 1 1-1 0L7.4 5.3Z" />),
  doc: svg(<path d="M3 1h6.5L13 4.5V15H3V1Zm2 6v1.3h6V7H5Zm0 2.7V11h6V9.7H5Z" />),
  user: svg(<path d="M8 1.5a3.3 3.3 0 1 1 0 6.6 3.3 3.3 0 0 1 0-6.6Zm0 1.3a2 2 0 1 0 0 4 2 2 0 0 0 0-4ZM2.5 14.5c0-3 2.5-5 5.5-5s5.5 2 5.5 5H12.2c0-2.3-1.9-3.7-4.2-3.7s-4.2 1.4-4.2 3.7H2.5Z" />),
  wrench: svg(<path d="M10.7 1.2a4 4 0 0 0-4 5.1L1.5 11.5a2 2 0 0 0 2.9 2.9L9.7 9.2a4 4 0 0 0 5.1-4l-2.3 2.3-2.2-.5-.5-2.2 2.3-2.3-1.4-.3Z" />),
  swap: svg(<path d="M11 1.5 14.5 5 11 8.5 10 7.5l1.8-1.8H2V4.3h9.8L10 2.5l1-1Zm-6 6L6 8.5 4.2 10.3H14v1.4H4.2L6 13.5l-1 1L1.5 11 5 7.5Z" />),
  grid: svg(<path d="M2 3h3v3H2V3Zm4.5 0h3v3h-3V3ZM11 3h3v3h-3V3ZM2 8h3v3H2V8Zm4.5 0h3v3h-3V8ZM11 8h3v3h-3V8Z" />),
  times: svg(<path d="M3.5 2.4 8 6.9l4.5-4.5 1.1 1.1L9.1 8l4.5 4.5-1.1 1.1L8 9.1l-4.5 4.5-1.1-1.1L6.9 8 2.4 3.5z" />),
  triangle: svg(<path d="M8 1.5 15 14H1L8 1.5Zm0 2.8L3.4 12.6h9.2L8 4.3Zm-.7 2.8h1.4v3H7.3v-3Zm0 3.8h1.4v1.3H7.3v-1.3Z" />),
}

/* ---------- Tooltip ---------- */
export function Tip({ text }) {
  return (
    <span className="tip" tabIndex={0} aria-label={text}>
      <Icon.info width="12" height="12" />
      <span role="tooltip">{text}</span>
    </span>
  )
}

/* ---------- Dropdown select (Figma "Dropdown - Select") ---------- */
export function Select({ id, label, placeholder, value, options, onChange, disabled, searchable = true, width = 240 }) {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const ref = useRef(null)
  useEffect(() => {
    const h = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false)
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])
  const cur = options.find((o) => o.id === value)
  const list = options.filter((o) => o.label.toLowerCase().includes(q.toLowerCase()))
  return (
    <div className="field" ref={ref} style={{ width }}>
      {label && <label className="lbl" htmlFor={id}>{label}</label>}
      <button id={id} type="button" className={`sel ${open ? 'open' : ''}`} disabled={disabled} aria-haspopup="listbox" aria-expanded={open}
        onClick={() => { setOpen(!open); setQ('') }}>
        <span className={cur ? '' : 'ph'}>{cur ? (cur.display || cur.label) : placeholder}</span>
        <Icon.chevron style={{ transform: open ? 'rotate(180deg)' : 'none' }} />
      </button>
      {open && (
        <div className="menu" role="listbox">
          {searchable && (
            <div className="menu-search"><Icon.search /><input autoFocus placeholder="Search content" value={q} onChange={(e) => setQ(e.target.value)} /></div>
          )}
          <div className="menu-list">
            {list.map((o) => (
              <button key={o.id} type="button" role="option" aria-selected={o.id === value} className={o.id === value ? 'on' : ''}
                onClick={() => { onChange(o.id); setOpen(false) }}>{o.label}</button>
            ))}
            {!list.length && <div className="menu-empty">No results</div>}
          </div>
        </div>
      )}
    </div>
  )
}

/* ---------- Segmented control ---------- */
export function Segmented({ label, value, options, onChange, disabled, size }) {
  return (
    <div className="field">
      {label && <span className="lbl">{label}</span>}
      <div className={`seg ${size === 'lg' ? 'seg-lg' : ''}`} role="radiogroup" aria-label={label}>
        {options.map((o) => (
          <button key={o.id} type="button" role="radio" aria-checked={value === o.id} className={value === o.id ? 'on' : ''} disabled={disabled}
            onClick={() => onChange(o.id)}>{o.label}</button>
        ))}
      </div>
    </div>
  )
}

/* ---------- Number input with $ prefix or % suffix ---------- */
export function NumInput({ id, label, tip, value, onChange, prefix, suffix, disabled, error, hint, after, width = 144 }) {
  return (
    <div className="field">
      {label && <label className="lbl" htmlFor={id}>{label}{tip && <Tip text={tip} />}</label>}
      <div className="num-row">
        <div className={`num ${error ? 'err' : ''} ${disabled ? 'dis' : ''}`} style={{ width }}>
          {prefix && <span className="cap">{prefix}</span>}
          <input id={id} inputMode="decimal" value={value} disabled={disabled} placeholder="0.00" aria-invalid={!!error}
            onChange={(e) => onChange(e.target.value.replace(/[^0-9.,]/g, ''))} />
          {suffix && <span className="cap">{suffix}</span>}
        </div>
        {after && <span className="after">{after}</span>}
      </div>
      {error ? <p className="msg err"><Icon.warn width="12" height="12" />{error}</p> : hint ? <p className="msg"><Icon.info width="12" height="12" />{hint}</p> : null}
    </div>
  )
}
