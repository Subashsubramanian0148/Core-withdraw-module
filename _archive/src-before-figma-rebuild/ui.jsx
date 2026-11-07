import React, { useEffect, useRef, useState } from 'react'

export const money = (n) =>
  '$' + (Number(n) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
export const num = (v) => {
  const n = parseFloat(String(v ?? '').replace(/,/g, ''))
  return Number.isFinite(n) ? n : 0
}
export const fmt2 = (v) => (v === '' || v == null ? '' : num(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }))

/* ---------- Icons ---------- */
const I = ({ d, size = 20, sw = 1.6, fill = 'none', children, ...p }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...p}>
    {d ? <path d={d} /> : children}
  </svg>
)
export const Icon = {
  arrowRight: (p) => <I {...p} d="M5 12h14M13 6l6 6-6 6" />,
  dashboard: (p) => <I {...p}><circle cx="12" cy="12" r="9" /><path d="M12 12l4-3M7.5 12h1M12 7.5v1M15.5 12h1" /></I>,
  payroll: (p) => <I {...p}><path d="M7 3h7l4 4v14H7z" /><path d="M10 11h5M10 15h5" /></I>,
  employee: (p) => <I {...p}><circle cx="12" cy="8" r="4" /><path d="M4 21c1-4 4-6 8-6s7 2 8 6" /></I>,
  config: (p) => <I {...p} d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.6 2.6-2.4-.6-.6-2.4z" />,
  transact: (p) => <I {...p} d="M4 8h14l-3-3M20 16H6l3 3" />,
  others: (p) => <I {...p}><rect x="4" y="4" width="4" height="4" /><rect x="10" y="4" width="4" height="4" /><rect x="16" y="4" width="4" height="4" /><rect x="4" y="12" width="4" height="4" /><rect x="10" y="12" width="4" height="4" /><rect x="16" y="12" width="4" height="4" /></I>,
  bell: (p) => <I {...p} d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4zM10 20a2 2 0 0 0 4 0" />,
  help: (p) => <I {...p}><circle cx="12" cy="12" r="9" /><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .9-1 1.7M12 17h.01" /></I>,
  back: (p) => <I {...p} d="M19 12H5M11 6l-6 6 6 6" />,
  chevron: (p) => <I size={16} {...p} d="M6 9l6 6 6-6" />,
  info: (p) => <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true" {...p}><circle cx="8" cy="8" r="7" fill="currentColor" /><path d="M8 7v4.5M8 4.6v.1" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" /></svg>,
  check: (p) => <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" {...p}><circle cx="8" cy="8" r="7.5" fill="currentColor" /><path d="M4.8 8.2l2.1 2.1 4.3-4.3" stroke="#fff" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>,
  shield: (p) => <svg width="11" height="11" viewBox="0 0 16 16" aria-hidden="true" {...p}><path d="M8 1l6 2.5V8c0 3.5-2.6 6-6 7-3.4-1-6-3.5-6-7V3.5z" fill="currentColor" /><path d="M5.3 8l1.9 1.9 3.5-3.5" stroke="#fff" strokeWidth="1.6" fill="none" /></svg>,
  edit: (p) => <I size={14} {...p} d="M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4" />,
  trash: (p) => <I size={14} {...p} d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6" />,
  close: (p) => <I size={18} {...p} d="M6 6l12 12M18 6L6 18" />,
  warn: (p) => <svg width="18" height="18" viewBox="0 0 16 16" aria-hidden="true" {...p}><circle cx="8" cy="8" r="7.5" fill="currentColor" /><path d="M8 4.3v4.5M8 11.2v.1" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" /></svg>,
  triangle: (p) => <I size={40} sw={1.4} {...p} d="M12 3L2 20h20zM12 10v4M12 17h.01" />,
  sign: (p) => <I size={16} {...p} d="M3 17c3-1 4-5 6-5s-1 5 1 5 3-3 4-3 1 2 2 2M14 5l5 5-6 6h-0" />,
  download: (p) => <I size={16} {...p} d="M12 4v12M7 11l5 5 5-5M4 20h16" />,
  upload: (p) => <I size={22} {...p} d="M12 16V4M7 9l5-5 5 5M4 16v4h16v-4" />,
  file: (p) => <I size={18} {...p} d="M7 3h7l4 4v14H7zM14 3v4h4" />,
  search: (p) => <I size={16} {...p}><circle cx="11" cy="11" r="7" /><path d="M20 20l-4-4" /></I>,
  sort: (p) => <svg width="8" height="12" viewBox="0 0 8 12" aria-hidden="true" {...p}><path d="M4 0l4 5H0zM4 12L0 7h8z" fill="currentColor" /></svg>,
  layers: (p) => <I size={18} {...p} d="M12 3l9 5-9 5-9-5zM3 13l9 5 9-5" />,
}

/* ---------- Select with search (Figma "Dropdown - Select") ---------- */
export function Select({ label, value, options, placeholder, onChange, disabled, error, width = 240, searchable = true, id, renderSub }) {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const ref = useRef(null)
  useEffect(() => {
    if (!open) return
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    const k = (e) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', h); document.addEventListener('keydown', k)
    return () => { document.removeEventListener('mousedown', h); document.removeEventListener('keydown', k) }
  }, [open])
  const sel = options.find((o) => o.id === value)
  const list = options.filter((o) => o.label.toLowerCase().includes(q.toLowerCase()))
  return (
    <div className="field" style={{ width }} ref={ref}>
      {label && <label className="lbl" htmlFor={id}>{label}</label>}
      <button
        id={id} type="button" className={`select ${open ? 'is-open' : ''} ${error ? 'is-error' : ''}`}
        disabled={disabled} aria-haspopup="listbox" aria-expanded={open}
        onClick={() => { setOpen(!open); setQ('') }}
      >
        <span className={`sel-text ${sel ? '' : 'ph'}`} title={sel ? sel.display || sel.label : undefined}>{sel ? sel.display || sel.label : placeholder}</span>
        <Icon.chevron style={{ transform: open ? 'rotate(180deg)' : 'none' }} />
      </button>
      {open && (
        <div className="menu" role="listbox">
          {searchable && (
            <div className="menu-search">
              <Icon.search />
              <input autoFocus placeholder="Search content" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search options" />
            </div>
          )}
          <div className="menu-list">
            {list.length === 0 && <div className="menu-empty">No match for "{q}".</div>}
            {list.map((o) => (
              <button
                key={o.id} type="button" role="option" aria-selected={o.id === value}
                className={`menu-item ${o.id === value ? 'is-sel' : ''}`} disabled={o.disabled}
                onClick={() => { onChange(o.id); setOpen(false) }}
              >
                <span>{o.label}</span>
                {renderSub && <small>{renderSub(o)}</small>}
                {o.disabled && o.reason && <small>{o.reason}</small>}
              </button>
            ))}
          </div>
        </div>
      )}
      {error && <p className="err" role="alert"><Icon.warn width="14" height="14" /> {error}</p>}
    </div>
  )
}

/* ---------- Segmented (Figma toggle buttons) ---------- */
export function Segmented({ label, options, value, onChange, disabled, size }) {
  return (
    <div className="field">
      {label && <span className="lbl">{label}</span>}
      <div className={`seg ${size === 'sm' ? 'seg-sm' : ''}`} role="group" aria-label={label}>
        {options.map((o) => (
          <button key={o.id} type="button" aria-pressed={value === o.id} disabled={disabled || o.disabled}
            className={value === o.id ? 'on' : ''} onClick={() => onChange(o.id)}>
            {o.label}
          </button>
        ))}
      </div>
    </div>
  )
}

/* ---------- Money / percent input ---------- */
export function NumInput({ label, value, onChange, prefix, suffix, disabled, error, hint, width = 146, after, id, placeholder = '0.00', max, tip }) {
  return (
    <div className="field">
      {label && <label className="lbl" htmlFor={id}>{label}{tip && <span className="tip" tabIndex={0} aria-label={tip}><Icon.info width="14" height="14" /><span role="tooltip">{tip}</span></span>}</label>}
      <div className="num-row">
        <div className={`num ${error ? 'is-error' : ''} ${disabled ? 'is-disabled' : ''}`} style={{ width }}>
          {prefix && <span className="cap">{prefix}</span>}
          <input
            id={id} inputMode="decimal" value={value} disabled={disabled} placeholder={placeholder}
            aria-invalid={!!error}
            onChange={(e) => {
              const v = e.target.value.replace(/[^0-9.,]/g, '')
              if ((v.match(/\./g) || []).length > 1) return
              onChange(v)
            }}
            onBlur={(e) => e.target.value !== '' && onChange(fmt2(Math.min(num(e.target.value), max ?? Infinity)))}
          />
          {suffix && <span className="cap">{suffix}</span>}
        </div>
        {after && <span className="after">{after}</span>}
      </div>
      {error ? (
        <p className="err" role="alert"><Icon.warn width="14" height="14" /> {error}</p>
      ) : hint ? (
        <p className="hint"><Icon.info /> {hint}</p>
      ) : null}
    </div>
  )
}

export function TextInput({ label, value, onChange, error, width = 240, id, placeholder, type = 'text', disabled }) {
  return (
    <div className="field" style={{ width }}>
      <label className="lbl" htmlFor={id}>{label}</label>
      <input id={id} type={type} className={`txt ${error ? 'is-error' : ''}`} value={value} placeholder={placeholder} disabled={disabled}
        aria-invalid={!!error} onChange={(e) => onChange(e.target.value)} />
      {error && <p className="err" role="alert"><Icon.warn width="14" height="14" /> {error}</p>}
    </div>
  )
}

export function Radio({ name, options, value, onChange, label }) {
  return (
    <div className="field">
      {label && <span className="lbl">{label}</span>}
      <div className="radios" role="radiogroup" aria-label={label}>
        {options.map((o) => (
          <label key={o.id} className="radio">
            <input type="radio" name={name} checked={value === o.id} onChange={() => onChange(o.id)} />
            <span>{o.label}</span>
          </label>
        ))}
      </div>
    </div>
  )
}

/* ---------- Focus trap helper for modal / slide-over ---------- */
export function useTrap(active, onEsc) {
  const ref = useRef(null)
  useEffect(() => {
    if (!active) return
    const el = ref.current
    const prev = document.activeElement
    const sel = 'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
    el?.querySelector(sel)?.focus()
    const k = (e) => {
      if (e.key === 'Escape') { onEsc?.(); return }
      if (e.key !== 'Tab' || !el) return
      const f = [...el.querySelectorAll(sel)]
      if (!f.length) return
      if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus() }
      else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus() }
    }
    document.addEventListener('keydown', k)
    return () => { document.removeEventListener('keydown', k); prev?.focus?.() }
  }, [active])
  return ref
}

export function Modal({ title, body, okLabel = 'Okay', danger, onOk, onCancel }) {
  const ref = useTrap(true, onCancel)
  return (
    <div className="scrim center" onMouseDown={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="modal" role="alertdialog" aria-modal="true" aria-labelledby="mtitle" ref={ref}>
        <div className="modal-icon"><Icon.triangle /></div>
        <div className="modal-main">
          <div className="modal-head">
            <h2 id="mtitle">{title}</h2>
            <button className="icon-btn" aria-label="Close" onClick={onCancel}><Icon.close /></button>
          </div>
          <p>{body}</p>
          <div className="modal-actions">
            <button className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} onClick={onOk}>{okLabel}</button>
            <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  )
}
