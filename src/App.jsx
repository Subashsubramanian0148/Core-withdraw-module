import React, { useState } from 'react'
import { Icon, Select, Segmented, NumInput } from './ui.jsx'
import Slideout from './Slideout.jsx'
import Summary from './Summary.jsx'
import { employee, plans, withdrawTypes, distributionModes, money, num, fmt2, calc, MIN_WITHDRAW, DEFAULT_FEE } from './data.js'
import coreLogo from './assets/core.png'
import galileoLogo from './assets/logo.png'
import userImg from './assets/user.png'
import empImg from './assets/emp.png'

const blank = { planId: '', typeId: '', withdrawAs: 'one', entire: 'yes', fee: fmt2(DEFAULT_FEE), feeCommitted: null, allocations: [], doc: { method: 'manual', file: null } }

export default function App() {
  const [s, setS] = useState(blank)
  const [page, setPage] = useState('request') // request | summary
  const [slide, setSlide] = useState(null) // { edit?: allocation }
  const [modal, setModal] = useState(null) // { planId }
  const [coverOpen, setCoverOpen] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const up = (o) => setS((p) => ({ ...p, ...o }))

  const plan = plans.find((p) => p.id === s.planId)
  const total = s.allocations.reduce((t, a) => t + num(a.amount), 0)
  const feeChanged = s.allocations.length > 0 && s.feeCommitted != null && num(s.fee) !== s.feeCommitted
  const canNext = plan && s.typeId && s.allocations.length > 0 && !feeChanged

  const changePlan = (id) => {
    if (id === s.planId) return
    if (s.typeId) setModal({ planId: id })
    else up({ planId: id })
  }
  const saveAllocation = (a) => {
    const list = slide.edit ? s.allocations.map((x) => (x.id === a.id ? a : x)) : [...s.allocations, { ...a, id: Date.now() }]
    up({ allocations: list, feeCommitted: num(s.fee) })
    setSlide(null)
  }
  const next = () => {
    if (s.entire === 'yes' && Math.abs(total - plan.available) > 0.001) { setCoverOpen(true); return }
    setCoverOpen(false)
    setPage('summary')
  }

  return (
    <div className="app">
      <nav className="rail" aria-label="Main">
        <img className="rail-logo" src={coreLogo} alt="CORE" />
        {[['Dashboard', Icon.gauge], ['Payroll', Icon.doc], ['Employee', Icon.user], ['Plan Config', Icon.wrench], ['Transact...', Icon.swap], ['Others', Icon.grid]].map(([t, I]) => (
          <a key={t} href="#" className={t === 'Payroll' ? 'on' : ''} onClick={(e) => e.preventDefault()}><I width="20" height="20" /><span>{t}</span></a>
        ))}
      </nav>
      <header className="topbar">
        <img src={galileoLogo} alt="Galileo" height="32" />
        <div className="top-actions">
          <button type="button" className="icon-btn bell" aria-label="Notifications, 25 new"><Icon.bell width="24" height="24" /><span className="badge">+25</span></button>
          <button type="button" className="icon-btn" aria-label="Help"><Icon.help width="24" height="24" /></button>
          <img className="me" src={userImg} alt="Your profile" />
        </div>
      </header>

      <aside className="emp">
        <a href="#" className="back" onClick={(e) => e.preventDefault()}><Icon.back /> Back</a>
        <h2>Employee Details</h2>
        <div className="emp-card">
          <div className="emp-top">
            <img src={empImg} alt="" />
            <div>
              <b>{employee.name}</b>
              <span>SSN : {employee.ssn}</span>
              <span>ID : {employee.id}</span>
              <span>Status : <em className="active"><Icon.shield width="10" height="10" /> {employee.status}</em></span>
            </div>
          </div>
          <div className="emp-co">Company : <b>{employee.company}</b></div>
          <button type="button" className="link emp-more">View more</button>
        </div>
      </aside>

      <main className="content">
        <div className="head">
          <h1>{page === 'summary' ? 'Withdrawal Summary' : 'New Withdrawal Request'}</h1>
          <div className="head-actions">
            {s.typeId && <button type="button" className="link" disabled={submitted}>Save as draft</button>}
            {page === 'summary'
              ? <>
                  <button type="button" className="btn btn-outline" disabled={submitted} onClick={() => setPage('request')}>Back</button>
                  <button type="button" className="btn btn-primary" disabled={submitted || !s.agreed} onClick={() => setSubmitted(true)}>Submit</button>
                </>
              : <>
                  <button type="button" className="btn btn-outline" onClick={() => setS(blank)}>Cancel</button>
                  <button type="button" className="btn btn-primary" disabled={!canNext} onClick={next}>Next</button>
                </>}
          </div>
          {coverOpen && page === 'request' && (
            <div className="toast warn" role="alert">
              <Icon.warn width="16" height="16" />
              <span>The allocation amount ({money(total)}) does not cover the entire available balance ({money(plan.available)}). Please update the allocation(s) to withdraw the full balance or choose to proceed with a partial withdrawal.</span>
              <button type="button" className="icon-btn" aria-label="Dismiss" onClick={() => setCoverOpen(false)}><Icon.close width="12" height="12" /></button>
            </div>
          )}
          {submitted && page === 'summary' && (
            <div className="toast ok" role="status">
              <Icon.check width="16" height="16" />
              <span>Withdrawal requested submitted successfully</span>
              <button type="button" className="icon-btn" aria-label="Dismiss" onClick={(e) => e.currentTarget.parentElement.remove()}><Icon.close width="12" height="12" /></button>
            </div>
          )}
        </div>

        <div className="scroll">
          <div className="plan-bar">
            <Select id="plan" label="Select the plan" placeholder="Select the plan" value={s.planId} options={plans} onChange={changePlan} disabled={page === 'summary'} />
            <div className="stat"><span>Available Balance</span><b>{money(plan?.available ?? 0)}</b></div>
            <div className="stat"><span>Vested Balance</span><b>{plan ? money(plan.vested) : ''}</b></div>
            <div className="stat"><span>Company</span><b>{employee.company}</b></div>
          </div>

          {page === 'summary'
            ? <Summary s={s} plan={plan} setAgreed={(v) => up({ agreed: v })} locked={submitted} />
            : plan && <Request s={s} up={up} plan={plan} feeChanged={feeChanged} onAdd={() => setSlide({})} onEdit={(a) => setSlide({ edit: a })}
                onRemove={(id) => up({ allocations: s.allocations.filter((a) => a.id !== id) })} />}
        </div>
      </main>

      {slide && (
        <Slideout initial={slide.edit} available={plan.available} max={plan.available - total + (slide.edit ? num(slide.edit.amount) : 0)} onCancel={() => setSlide(null)} onSave={saveAllocation} />
      )}

      {modal && (
        <div className="scrim">
          <div className="modal" role="alertdialog" aria-labelledby="mt">
            <div className="modal-ico"><Icon.triangle width="40" height="40" /></div>
            <div className="modal-body">
              <h2 id="mt">Do you want to proceed?</h2>
              <p>Changing the plan now will result in losing all your progress.</p>
              <div className="modal-actions">
                <button type="button" className="btn btn-primary" onClick={() => { setS({ ...blank, planId: modal.planId }); setModal(null) }}>Okay</button>
                <button type="button" className="btn btn-outline" onClick={() => setModal(null)}>Cancel</button>
              </div>
            </div>
            <button type="button" className="icon-btn modal-x" aria-label="Close" onClick={() => setModal(null)}><Icon.times width="20" height="20" /></button>
          </div>
        </div>
      )}
    </div>
  )
}

function Request({ s, up, plan, feeChanged, onAdd, onEdit, onRemove }) {
  const typed = !!s.typeId
  return (
    <>
      <p className="note"><Icon.info width="12" height="12" /> The available amount is reported as of 09/10/2026 and may change due to market fluctuations.</p>

      <section className="sec">
        <h2>Distribution Inputs</h2>
        <Select id="type" label="Withdraw Type" placeholder="Select the withdrawal type" value={s.typeId} options={withdrawTypes} searchable={false} onChange={(v) => up({ typeId: v })} />
        {typed && <>
          <Segmented label="Withdraw as" size="lg" value="one" onChange={() => {}} options={[{ id: 'one', label: 'One time payment' }]} />
          <div className="field">
            <Segmented label="Withdraw Entire Balance" size="lg" value={s.entire} onChange={(v) => up({ entire: v })}
              options={[{ id: 'yes', label: 'Yes' }, { id: 'no', label: 'No' }]} />
            <p className="msg"><Icon.info width="12" height="12" />Minimum {money(MIN_WITHDRAW)} / Maximum {money(plan.available)}</p>
          </div>
          <NumInput id="fee" label="Overall Withdraw Fee" prefix="$" value={s.fee} onChange={(v) => up({ fee: v })}
            error={feeChanged ? `Changing this fee will impact the existing allocation(s). Please verify the allocations to proceed, or restore the previous fee amount ${money(s.feeCommitted)}` : null} />
        </>}
      </section>

      {typed && <>
        <section className="sec">
          <h2>Withdrawal Allocation</h2>
          <div><button type="button" className="btn btn-outline btn-lg" onClick={onAdd}>Add Allocation</button></div>
          {s.allocations.length > 0 && (
            <table className="alloc">
              <thead><tr><th>Recipient &amp; Payment</th><th>1099 codes</th><th>Gross amount</th><th>State tax</th><th>Federal tax</th><th>Fee</th><th>Net amount</th><th>Action</th></tr></thead>
              <tbody>
                {s.allocations.map((a) => { const c = calc(a); return (
                  <tr key={a.id}>
                    <td><b className="trunc">{distributionModes.find((m) => m.id === a.mode)?.label}</b><small>{a.payment === 'eft' ? 'EFT' : 'Mail check'}</small></td>
                    <td><span>Roth: Code {a.roth}</span><span>Non Roth: Code {a.nonRoth}</span></td>
                    <td>{money(c.gross)}</td>
                    <td><span>{num(a.state)}%</span><small>{money(c.state)}</small></td>
                    <td><span>{num(a.fed)}%</span><small>{money(c.fed)}</small></td>
                    <td>{money(c.fee)}</td>
                    <td>{money(c.net)}</td>
                    <td className="act">
                      <button type="button" className="round edit" aria-label="Edit allocation" onClick={() => onEdit(a)}><Icon.edit width="12" height="12" /></button>
                      <button type="button" className="round del" aria-label="Remove allocation" onClick={() => onRemove(a.id)}><Icon.trash width="12" height="12" /></button>
                    </td>
                  </tr>
                ) })}
              </tbody>
            </table>
          )}
        </section>

        <section className="sec">
          <h2>Required Document</h2>
          <DocUpload v={s.doc} set={(o) => up({ doc: { ...s.doc, ...o } })} />
        </section>
      </>}
    </>
  )
}

function DocUpload({ v, set }) {
  const pick = (f) => f && set({ file: { name: f.name, size: f.size } })
  return (
    <div className="doc">
      <div className="doc-l">
        <div className="doc-name">Spousal consent <span>(Optional)</span></div>
        <Segmented size="lg" value={v.method} onChange={(m) => set({ method: m })} options={[{ id: 'manual', label: 'Upload manually' }, { id: 'docusign', label: 'Use docusign' }]} />
        <div className="doc-meta"><span>Accepted file : PDF</span><span>Max File Size : 2 MB</span></div>
        <button type="button" className="link sm"><Icon.download width="12" height="12" /> Download template</button>
      </div>
      {v.method === 'manual' ? (
        v.file ? (
          <div className="drop done">
            <Icon.file width="20" height="20" />
            <span><b>{v.file.name}</b><small>{Math.round(v.file.size / 1024)}KB</small></span>
            <button type="button" className="round del" aria-label="Remove file" onClick={() => set({ file: null })}><Icon.trash width="12" height="12" /></button>
          </div>
        ) : (
          <label className="drop" onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); pick(e.dataTransfer.files[0]) }}>
            <span><Icon.upload width="14" height="14" /> Drag &amp; Drop here</span>
            <span>or</span>
            <span className="link sm">Browse File</span>
            <input type="file" accept="application/pdf" hidden onChange={(e) => pick(e.target.files[0])} />
          </label>
        )
      ) : (
        <div className="drop sign">
          <Icon.sign width="24" height="24" />
          <b>Use Docusign</b>
          <span>Participants will receive documents<br />via their Docsign accounts</span>
        </div>
      )}
    </div>
  )
}
