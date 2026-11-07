import React, { useState } from 'react'
import { Icon } from './ui.jsx'
import { employee, withdrawTypes, distributionModes, sources, history, sampleDocs, fmtAddress, money, num, calc } from './data.js'

const MAX_CHIPS = 3

export default function Summary({ s, setAgreed, locked }) {
  const [tab, setTab] = useState('summary')
  return (
    <>
      <div className="tabs" role="tablist">
        <button role="tab" aria-selected={tab === 'summary'} className={tab === 'summary' ? 'on' : ''} onClick={() => setTab('summary')}>Request Summary</button>
        <button role="tab" aria-selected={tab === 'history'} className={tab === 'history' ? 'on' : ''} onClick={() => setTab('history')}>History</button>
      </div>
      {tab === 'summary' ? <Body s={s} setAgreed={setAgreed} locked={locked} /> : <History />}
    </>
  )
}

function Body({ s, setAgreed, locked }) {
  const [feeOpen, setFeeOpen] = useState(true)
  const rows = s.allocations.map((a) => ({ a, c: calc(a) }))
  const t = rows.reduce((x, { a, c }) => ({
    gross: x.gross + c.gross, fed: x.fed + c.fed, state: x.state + c.state, pen: x.pen + c.pen,
    eft: x.eft + (a.payment === 'eft' ? c.fee : 0), check: x.check + (a.payment === 'eft' ? 0 : c.fee),
  }), { gross: 0, fed: 0, state: 0, pen: 0, eft: 0, check: 0 })
  const fees = [['Overall Withdrawal fee', num(s.fee)], ['EFT fee', t.eft], ['Check fee', t.check], ['Early Withdraw penalty', t.pen], ['Federal tax', t.fed], ['State tax', t.state]].filter(([, v]) => v > 0)
  const ded = fees.reduce((n, [, v]) => n + v, 0)
  const type = withdrawTypes.find((w) => w.id === s.typeId)

  return (
    <div className="sum">
      <section>
        <h2>Withdrawal Details</h2>
        <div className="wd card">
          <div className="wd-l">
            <span className="sub">Requested Amount</span>
            <b className="big">{money(t.gross)}</b>
            <dl>
              <dt>Withdrawal type</dt><dd>{type?.display || type?.label}</dd>
              <dt>Withdrawal as</dt><dd>One time payment</dd>
              <dt>Withdrawal entire balance</dt><dd>{s.entire === 'yes' ? 'Yes' : 'No'}</dd>
            </dl>
          </div>
          <div className="wd-r">
            <div className="wd-row"><span className="sub">Gross withdrawal amount</span><b>{money(t.gross)}</b></div>
            <div className="wd-row wd-fee">
              <button type="button" className="tree-tg" aria-expanded={feeOpen} onClick={() => setFeeOpen(!feeOpen)}>
                {feeOpen ? <Icon.minusSq /> : <Icon.plusSq />} Fee &amp; tax details
              </button>
              <b className="lg">{money(-ded)}</b>
            </div>
            {feeOpen && <ul className="tree">{fees.map(([k, v]) => <li key={k}><span>{k}</span><span>{money(v)}</span></li>)}</ul>}
            <div className="wd-row wd-net"><b>Net withdrawal amount</b><b>{money(t.gross - ded)}</b></div>
          </div>
        </div>
      </section>

      <section>
        <h2>Withdrawal Allocation</h2>
        <table className="ro card">
          <thead><tr><th>Recipient &amp; Payment</th><th>1099 Codes</th><th>Address</th><th className="r">Net amount</th></tr></thead>
          <tbody>
            {rows.map(({ a, c }) => (
              <tr key={a.id}>
                <td><b>{distributionModes.find((m) => m.id === a.mode)?.label}</b><small>{a.payment === 'eft' ? 'EFT' : 'Mail check'}</small></td>
                <td><span>Roth: code {a.roth}</span><span>Non Roth: code {a.nonRoth}</span></td>
                <td>{(() => { const custom = a.payment === 'check' && a.addrSrc === 'custom'; const t = fmtAddress(custom ? a.address : employee.address); return <><span className="trunc" title={t}>{t}</span><em className="tag">{custom ? 'Custom address' : 'As per employee records'}</em></> })()}</td>
                <td className="r"><b>{money(c.net)}</b></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h2>Source Withdraw Amount</h2>
        <div className="card src">
          {sources.map((src) => <SourceRow key={src.name} src={src} amount={t.gross * src.share} />)}
        </div>
      </section>

      <section>
        <h2>Uploaded documents</h2>
        <div className="files">
          {(s.doc.method === 'manual' && s.doc.file ? [s.doc.file, ...sampleDocs.slice(1)] : sampleDocs).map((f) => (
            <div key={f.name} className="file">
              <span className="ok"><Icon.check /></span>
              <span className="nm trunc" title={f.name}>{f.name}</span>
              <b className="sz">{Math.round(f.size / 1024)}KB</b>
              <button type="button" className="icon-btn" aria-label={`Download ${f.name}`}><Icon.download /></button>
              <button type="button" className="icon-btn" aria-label={`Delete ${f.name}`} disabled={locked}><Icon.trash /></button>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2>Confirm and submit</h2>
        <label className="confirm">
          <input type="checkbox" checked={!!s.agreed} disabled={locked} onChange={(e) => setAgreed(e.target.checked)} />
          By checking this box, I declare that i have read the <a href="#" onClick={(e) => e.preventDefault()}>Terms &amp; Conditions</a>
        </label>
      </section>
    </div>
  )
}

function SourceRow({ src, amount }) {
  const [open, setOpen] = useState(false)
  const per = amount / src.investments.length
  const shown = open ? src.investments : src.investments.slice(0, MAX_CHIPS)
  const extra = src.investments.length - MAX_CHIPS
  return (
    <div className="src-row">
      <div className="src-name"><a href="#" className="trunc" title={src.name} onClick={(e) => e.preventDefault()}>{src.name}</a><small>{money(amount)}</small></div>
      <div className="chips">
        {shown.map((i) => <span key={i} className="chip">{i} <b>{money(per)}</b></span>)}
        {extra > 0 && <button type="button" className="chip more" aria-expanded={open} onClick={() => setOpen(!open)}>{open ? 'Show less' : `+${extra}`}</button>}
      </div>
    </div>
  )
}

function History() {
  return (
    <ol className="hist">
      {history.map((h, i) => (
        <li key={i}>
          <span className="hist-at">{h.at}</span>
          <span className="hist-dot" aria-hidden="true" />
          <div>
            <b>{h.title}</b>
            <div className="hist-by">{h.by}{h.role && <><i aria-hidden="true">|</i><em>{h.role}</em></>}</div>
          </div>
        </li>
      ))}
    </ol>
  )
}
