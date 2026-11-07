import React, { useState } from 'react'
import { Rail, TopBar } from './App.jsx'
import { Icon } from './ui.jsx'

// Redesign of the existing Transaction → Request Summary screen. Same data as the live screen, denser layout.
const TX = {
  employee: { initial: 'D', name: 'Distribution Test15', ssn: '675-76-1115', status: 'Active', company: 'Distribution Test' },
  plan: { name: 'Distribution Plan', id: 'DIS001' },
  type: 'In-Service - withdrawal',
  payment: 'Onetime payment',
  requested: '$12,259.16',
  gross: '$14,501.00',
  net: '$12,259.16',
  feeSource: 'Fees deducted from account balance',
  penaltyNote: 'This distribution may be subject to a 10% early withdrawal penalty if the Participant is under age 59½. Based on the transaction amount, the estimated penalty would be approximately $699.95. This penalty is not withheld from the distribution. The Participant is responsible for paying any applicable penalty directly to the IRS when filing their annual tax return.',
  feeTax: { total: '$1,540.89', items: [['Check Fee', '$1.00'], ['State Tax', '$139.99'], ['Federal Tax', '$1,399.90']] },
  commission: '$0.00',
  // Withdrawal Allocation + 1099 codes: shown on the live screen as two separate sections, grouped here per allocation
  srcTotal: '$14,500.00',
  sources: [
    { name: 'PreTax', amount: '$5,000.00', inv: [['IQOO2', '$1,000.00'], ['SGMutual Funf', '$1,250.00'], ['SGNEWONE', '$1,000.00']] },
    { name: 'AfterTax', amount: '$7,500.00', inv: [['SGNEWONE', '$1,500.00'], ['SGMutual Funf', '$1,875.00'], ['IQOO2', '$1,500.00']] },
    { name: 'Match', amount: '$2,000.00', inv: [['IQOO2', '$400.00'], ['SGMutual Funf', '$500.00'], ['SGNEWONE', '$400.00']] },
  ],
  docGroups: [{ title: 'Withdrawal request on 10/14/2026', docs: [] }],
  allocRequested: '$9,424.00',
  allocations: [{ mode: 'Distribution to self', payee: 'Distribution Test15...', method: 'Check', address: 'qwerty, Street3, N...', amount: '$9,424.00',
    codes: [['Non-Roth Sources Code', 'Code 2: Early distribution, exception applies']] }],
}

export default function TransactionSummary() {
  const [tab, setTab] = useState('summary')
  const [open, setOpen] = useState(true)
  const [note, setNote] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const [docOpen, setDocOpen] = useState({ 0: true })
  const e = TX.employee
  return (
    <div className="app">
      <Rail />
      <div className="main">
        <TopBar />
        <main className="tx">
          <div className="tx-head">
            <h1>Transaction</h1>
            <div className="tx-actions">
              <button className="btn btn-secondary tx-export">Export <span aria-hidden="true">▾</span></button>
              <button className="btn btn-tertiary">Previous</button>
              <button className="btn btn-secondary">Cancel</button>
              <button className="btn btn-primary" disabled={!agreed}>Submit</button>
            </div>
          </div>


          <div className="tx-banner" role="note">
            <Icon.warn /> Below is a summary of your In-Service - request application. Please review prior to submitting the withdrawal request.
          </div>

          <div className="tabs" role="tablist">
            <button role="tab" aria-selected={tab === 'summary'} className={tab === 'summary' ? 'on' : ''} onClick={() => setTab('summary')}>Request Summary</button>
            <button role="tab" aria-selected={tab === 'history'} className={tab === 'history' ? 'on' : ''} onClick={() => setTab('history')}>History</button>
          </div>

          {tab === 'summary' && (
            <dl className="tx-kpis" aria-label="Key amounts">
              <div><dt>Requested Amount</dt><dd>{TX.requested}</dd><small>{TX.type} · {TX.payment}</small></div>
              <div><dt>Gross Withdrawal Amount</dt><dd>{TX.gross}</dd></div>
              <div><dt>Fee &amp; Tax total</dt><dd>{TX.feeTax.total}</dd><small>{TX.feeSource}</small></div>
              <div className="key"><dt>Net Withdrawal Amount</dt><dd>{TX.net}</dd></div>
            </dl>
          )}

          <div className="tx-pair">
          {tab === 'summary' ? (
            <section className="tx-card st" aria-labelledby="tx-wd">
              {/* Statement layout: banded groups, line items, subtotal, highlighted total */}
              <div className="st-band"><h2 id="tx-wd">Withdrawal Details</h2></div>
              <div className="st-band sub">
                <button type="button" className="wd-tg" aria-expanded={open} onClick={() => setOpen(!open)}><span className="box" aria-hidden="true">{open ? '−' : '+'}</span>Fee &amp; Tax details</button>
              </div>
              {open && TX.feeTax.items.map(([k, v]) => <div className="st-row" key={k}><span>{k}</span><span className="n">{v}</span></div>)}
              <div className="st-row"><span>Fee / Commission <span className="tx-info" title="Fee / Commission"><Icon.info /></span></span><span className="n neg">{TX.commission}</span></div>
              <div className="st-row st-subtotal"><b>Fee &amp; Tax total</b><b className="n">{TX.feeTax.total}</b></div>


              <ul className="st-notes">
                <li><Icon.info /><span>{TX.feeSource}</span></li>
                <li><Icon.info /><div>
                  <span>Early Withdrawal Penalty Notice</span>
                  <button type="button" className="link" aria-expanded={note} onClick={() => setNote(!note)}>{note ? 'View Less' : 'View More'}</button>
                  {note && <p>{TX.penaltyNote}</p>}
                </div></li>
              </ul>
            </section>
          ) : <p className="kv-note">No history yet.</p>}

          {tab === 'summary' && (
            <section className="tx-card" aria-labelledby="tx-al">
              <div className="tx-card-head">
                <h2 id="tx-al">Withdrawal Allocation</h2>
              </div>
              {TX.allocations.map((a, i) => (
                <article className="tx-alloc" key={i} aria-label={a.mode}>
                  <header><b>{a.mode}</b><b className="n">{a.amount}</b></header>
                  <dl className="tx-alloc-grid">
                    <div><dt>Payee</dt><dd title={a.payee}>{a.payee}</dd></div>
                    <div><dt>Payment Method</dt><dd>{a.method}</dd></div>
                    <div><dt>Address</dt><dd title={a.address}>{a.address}</dd></div>
                  </dl>
                  <div className="tx-codes">
                    <span className="tx-codes-lbl">1099 Codes</span>
                    {a.codes.map(([k, v]) => <div key={k} className="tx-code"><span>{k}</span><b>{v}</b></div>)}
                  </div>
                </article>
              ))}
            </section>
          )}
          </div>

          {tab === 'summary' && (
            <section className="tx-card" aria-labelledby="tx-src">
              <div className="tx-card-head">
                <h2 id="tx-src">Source &amp; Investment Splitup</h2>
              </div>
              <div className="src-rows tx-src">
                {TX.sources.map((sr) => (
                  <div className="src-row" key={sr.name}>
                    <div className="src-grp">
                      <div className="src-nm"><span>{sr.name}</span><b>{sr.amount}</b></div>
                      <ul className="stree-chips">
                        {sr.inv.map(([n, v]) => {
                          return <li key={n} className="chip"><span>{n}</span><b>{v}</b></li>
                        })}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {tab === 'summary' && (
            <section className="tx-card" aria-labelledby="tx-docs">
              <div className="tx-card-head"><h2 id="tx-docs">Uploaded Documents</h2></div>
              {TX.docGroups.map((g, i) => (
                <div className="tx-docgrp" key={i}>
                  <button type="button" className="tx-docgrp-head" aria-expanded={!!docOpen[i]} onClick={() => setDocOpen((o) => ({ ...o, [i]: !o[i] }))}>
                    <span>{g.title}</span><span className="tx-count">{String(g.docs.length).padStart(2, '0')}</span><span aria-hidden="true">{docOpen[i] ? '▴' : '▾'}</span>
                  </button>
                  {docOpen[i] && (g.docs.length ? null : <p className="tx-empty">No documents available</p>)}
                </div>
              ))}
            </section>
          )}

          {tab === 'summary' && (
            <div className="tx-final">
              <label><input type="checkbox" checked={agreed} onChange={(ev) => setAgreed(ev.target.checked)} /> By checking this box, I declare that I have read the <a href="#" onClick={(ev) => ev.preventDefault()}>Terms and Conditions</a></label>
              <button className="btn btn-primary" disabled={!agreed}>Submit</button>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
