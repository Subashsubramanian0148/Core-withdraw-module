import React, { useEffect, useRef, useState } from 'react'
import { employee, plans, withdrawTypes, distributionModes, codes1099, DEFAULT_FEE, MAX_FILE_MB, periodicKinds, FIXED_PAY_DAY, persons, RMD_YEAR, RMD_AGE, IRS_FACTOR, rmdMinimum, PENALTY_FREE_AGE, PENALTY_RATE } from './data.js'
import { Icon, Select, Segmented, NumInput, Modal, money, num, fmt2 } from './ui.jsx'
import Slideout, { calc, emptyAllocation, isRollover, SourceDetails, sourceModel, SourceSummary, InvRestriction } from './Slideout.jsx'
import { rolloverOnFile, requiredDocs } from './data.js'
import Periodic, { emptyPeriodic, periodicCalc, periodicErrors, periodicComplete, ScheduleModal } from './Periodic.jsx'
import coreLogo from './core-logo.png'

const blank = {
  planId: '', typeId: '', withdrawAs: '', entire: '', fee: '', feeCommitted: null,
  allocations: [], docs: {}, periodic: emptyPeriodic, src: { source: 'prorata', chooseBy: 'source', sources: {} }, person: 'active', rmdAmount: '', submitted: false, tried: false, step: 'edit',
}

const alloc = (o) => ({ ...structuredClone(emptyAllocation), roth: '1', nonRoth: '1', fed: '20.00', state: '0.00', penalty: '10.00', payment: 'check', mode: 'self', ...o })
const A1 = alloc({ id: 'a1', amount: '2,000.00' })
const A2 = alloc({ id: 'a2', amount: '1,000.00' })
const roll = (mode, o) => { const f = rolloverOnFile[mode]; return alloc({ mode, roth: f.roth, nonRoth: f.nonRoth, fed: '0.00', state: '0.00', penalty: '', rollover: { plan: f.plan, type: f.type, account: f.account, trustee: f.trustee, delivery: 'check' }, ...o }) }
const R1 = roll('roth', { id: 'r1', amount: '1,500.00' })
const R2 = roll('trad', { id: 'r2', amount: '1,500.00', rollover: { ...roll('trad').rollover, delivery: 'wire' } })
const typed = { planId: 'vanguard', typeId: 'INS', withdrawAs: 'one', entire: 'yes', fee: '50.00', feeCommitted: 50 }

// Every frame in the Figma In-Service row, plus the edge cases we want to check
const PD = { ...emptyPeriodic, kind: 'dollar', total: '3,000.00', installment: '500.00', dateMode: 'custom', date: '2026-11-01' }
const PT = { ...emptyPeriodic, kind: 'tenure', total: '3,000.00', tenure: 'other', years: '5' }
const PA = { ...emptyPeriodic, kind: 'annuity', total: '3,000.00' }
const DOCS_OK = { spousal: { method: 'docusign' }, election: { method: 'docusign' }, w4r: { method: 'docusign' } }
const RT = { ...typed, typeId: 'RMD', entire: 'no', rmdAmount: '2,000.00', person: 'retired' }
const RA = (o) => alloc({ noPen: true, roth: '7', nonRoth: '7', penalty: '', ...o })
function typedR() { return { ...typed } }

const SCENARIOS = [
  { group: 'Main flow' },
  { id: 's1', label: 'Without plan select', state: {} },
  { id: 's2', label: 'After plan select', state: { planId: 'vanguard' } },
  { id: 's3', label: 'Choose withdrawal type (In-Service)', state: { ...typed } },
  { id: 's4', label: 'Slide-out without data', state: { ...typed }, slide: {} },
  { id: 's5', label: 'Slide-out with data', state: { ...typed }, slide: { initial: alloc({ amount: '2,000.00', payment: 'etf' }) } },
  { id: 's6', label: 'One allocation added', state: { ...typed, allocations: [A1] } },
  { id: 's7', label: 'Summary page finished', state: { ...typed, allocations: [A1, A2] } },
  { id: 's7b', label: 'Withdrawal summary (after Next)', state: { ...typed, allocations: [A1, A2], step: 'summary' } },
  { id: 's8', label: 'Summary page submitted', state: { ...typed, allocations: [A1, A2], step: 'summary', submitted: true }, toast: 'success' },
  { group: 'In-Service Rollover' },
  { id: 'r1', label: 'Slide-out: Rollover to Roth IRA', state: { ...typedR() }, slide: { initial: roll('roth', { amount: '1,500.00' }) } },
  { id: 'r2', label: 'Slide-out: Rollover to Traditional IRA', state: { ...typedR() }, slide: { initial: roll('trad', { amount: '2,000.00' }) } },
  { id: 'r3', label: 'Rollover allocations added', state: { ...typedR(), allocations: [R1, R2] } },
  { id: 'r4', label: 'Rollover summary (after Next)', state: { ...typedR(), allocations: [R1, R2], step: 'summary' } },
  { id: 'r5', label: 'Rollover submitted', state: { ...typedR(), allocations: [R1, R2], step: 'summary', submitted: true }, toast: 'success' },
  { id: 'r6', label: 'Rollover error: amount above $1,800 (Roth IRA)', state: { ...typedR() }, slide: { initial: roll('roth', { amount: '2,500.00' }) } },
  { id: 'r8', label: 'Rollover error: invalid account no, no trustee', state: { ...typedR() }, slide: { initial: roll('trad', { amount: '1,000.00', rollover: { plan: 'Fidelity Traditional IRA', type: 'traditional', account: 'IRA#1', trustee: '', delivery: 'check' } }) } },
  { group: 'Early penalty' },
  { id: 'p1', label: 'Penalty applies (10% · $300.00)', state: { ...typed }, slide: { initial: alloc({ amount: '3,000.00', payment: 'etf' }) } },
  { id: 'p2', label: 'Early withdrawal penalty: No', state: { ...typed }, slide: { initial: alloc({ amount: '3,000.00', waive: 'yes', roth: '2', nonRoth: '2', waivePct: '0.00' }) } },
  { id: 'p6', label: 'No-penalty allocation on summary', state: { ...typed, allocations: [alloc({ id: 'w1', amount: '3,000.00', waive: 'yes', roth: '2', nonRoth: '2', waivePct: '0.00' })], step: 'summary' } },
  { group: 'Separation from Service' },
  { id: 'f1', label: 'SFS full distribution (terminated)', state: { ...typed, typeId: 'SEP', person: 'retired' } },
  { id: 'f2', label: 'SFS slide-out (no early penalty at 80)', state: { ...typed, typeId: 'SEP', person: 'retired' }, slide: {} },
  { id: 'f3', label: 'SFS allocation added', state: { ...typed, typeId: 'SEP', person: 'retired', allocations: [alloc({ id: 'f', amount: '3,000.00', noPen: true, roth: '7', nonRoth: '7', penalty: '' })] } },
  { id: 'f4', label: 'SFS not eligible (Active)', state: { ...typed, typeId: 'SEP', person: 'active' } },
  { group: 'Periodic payment' },

  { id: 'q1', label: 'Periodic selected (choose type)', state: { ...typed, typeId: 'SEP', person: 'retired', withdrawAs: 'periodic' } },
  { id: 'q2', label: 'Specific Dollar ($500 · custom date)', state: { ...typed, typeId: 'SEP', person: 'retired', withdrawAs: 'periodic', periodic: PD } },
  { id: 'q3', label: 'Specific Tenure (Other · 5 years)', state: { ...typed, typeId: 'SEP', person: 'retired', withdrawAs: 'periodic', periodic: PT } },
  { id: 'q3b', label: 'Specific Tenure (My life expectancy)', state: { ...typed, typeId: 'SEP', person: 'retired', withdrawAs: 'periodic', periodic: { ...PT, tenure: 'life', years: '' }, allocations: [alloc({ id: 'q', amount: '1,500.00', roth: '7', nonRoth: '7', fed: '0.00' })] } },
  { id: 'q4', label: 'Annuitization (4.00%)', state: { ...typed, typeId: 'SEP', person: 'retired', withdrawAs: 'periodic', periodic: PA } },
  { id: 'q5', label: 'Allocation added', state: { ...typed, typeId: 'SEP', person: 'retired', withdrawAs: 'periodic', periodic: PD, allocations: [alloc({ id: 'q', amount: '500.00' })] } },
  { id: 'q6', label: 'Periodic summary (after Next)', state: { ...typed, typeId: 'SEP', person: 'retired', withdrawAs: 'periodic', periodic: PD, allocations: [alloc({ id: 'q', amount: '500.00' })], docs: DOCS_OK, step: 'summary' } },
  { id: 'q7', label: 'Error: installment above total', state: { ...typed, typeId: 'SEP', person: 'retired', withdrawAs: 'periodic', periodic: { ...PD, installment: '3,500.00' } } },
  { id: 'q8', label: 'Error: custom date in the past', state: { ...typed, typeId: 'SEP', person: 'retired', withdrawAs: 'periodic', periodic: { ...PD, date: '2024-01-01' } } },
  { group: 'Required documents' },
  { id: 'd1', label: 'Documents: all via Docusign', state: { ...typed, allocations: [A1, A2], docs: DOCS_OK } },
  { id: 'd2', label: 'Documents: required upload missing (after Next)', state: { ...typed, allocations: [A1, A2], tried: true, docs: { election: { method: 'manual' } } } },
  { id: 'd3', label: 'Documents: files uploaded', state: { ...typed, allocations: [A1, A2], docs: { spousal: { method: 'manual', file: { name: 'spousal-consent.pdf', size: 184320 } }, election: { method: 'manual', file: { name: 'election-form.pdf', size: 96256 } }, w4r: { method: 'docusign' } } } },
  { group: 'RMD' },
  { id: 'm1', label: 'RMD eligible (type chosen)', state: { ...RT, rmdAmount: '148.51' } },
  { id: 'm2', label: 'Slide-out: RMD allocation', state: { ...RT }, slide: { initial: RA({ amount: '2,000.00' }) } },
  { id: 'm3', label: 'RMD allocation added', state: { ...RT, allocations: [RA({ id: 'm', amount: '2,000.00' })] } },
  { id: 'm4', label: 'RMD summary (after Next)', state: { ...RT, allocations: [RA({ id: 'm', amount: '2,000.00' })], step: 'summary' } },
  { id: 'm5', label: 'RMD not eligible (52 · Active)', state: { ...RT, person: 'active', rmdAmount: '' } },
  { id: 'm6', label: 'Error: amount below required minimum', state: { ...RT, rmdAmount: '100.00' } },
  { id: 'm7', label: 'Error: allocations don’t match amount', state: { ...RT, allocations: [RA({ id: 'm', amount: '1,500.00' })], tried: true } },
  { group: 'Payment & balances' },
  { id: 'b1', label: 'Mail check: employee address', state: { ...typed }, slide: { initial: alloc({ amount: '1,000.00' }) } },
  { id: 'b2', label: 'Mail check: custom address (with errors)', state: { ...typed }, slide: { initial: alloc({ amount: '1,000.00', addr: 'custom', address: { line1: '18 Ocean Ave', line2: '', city: 'Oakland', state: 'Cal', zip: '946' } }) } },
  { id: 'b3', label: 'Custom address allocation added', state: { ...typed, allocations: [alloc({ id: 'b', amount: '1,000.00', addr: 'custom', address: { line1: '18 Ocean Ave', line2: '', city: 'Oakland', state: 'CA', zip: '94607' } })] } },
  { id: 'b4', label: 'Roth IRA balance (minus pre-tax)', state: { ...typed }, slide: { initial: roll('roth', { amount: '' }) } },
  { id: 'b5', label: 'Plan without “Allow me to choose”', state: { ...typed, planId: 'jpm' }, slide: { initial: alloc({ amount: '1,000.00' }) } },
  { group: 'Errors & edge cases' },
  { id: 'e1', label: 'Slide-out error: amount above maximum', state: { ...typed }, slide: { initial: alloc({ amount: '3,500.00' }) } },
  { id: 'e2', label: 'Entire balance not covered', state: { ...typed, allocations: [A1], tried: true } },
  { id: 'e3', label: 'Withdraw fee changed', state: { ...typed, fee: '150.00', allocations: [A1, A2] } },
  { id: 'e4', label: 'Plan change confirmation', state: { ...typed, allocations: [A1] }, modal: { kind: 'plan', planId: 'jpm' } },
  { id: 'e5', label: 'Slide-out: custom bank details', state: { ...typed }, slide: { initial: alloc({ amount: '1,000.00', payment: 'etf', bank: 'custom', custom: { ...emptyAllocation.custom, institution: 'Wells Fargo', account: '77300', routing: '1210', email: 'kevin.thomas@' } }) } },
  { id: 'e6b', label: 'Slide-out: choose by source (off by $)', state: { ...typed }, slide: { initial: alloc({ amount: '1,000.00', source: 'choose', chooseBy: 'source', sources: { SRC_EE: '600.00' } }) } },
  { id: 'e7', label: 'Slide-out: no balance left', state: { ...typed, allocations: [alloc({ id: 'a9', amount: '3,000.00' })] }, slide: { initial: alloc({ amount: '' }) } },
  { id: 'e8', label: 'Plan with $0.00 balance', state: { planId: 'sp500' } },
  { id: 'e9', label: 'Upload manually: wrong file type', state: { ...typed, allocations: [A1, A2], docs: { spousal: { method: 'manual', error: 'Only PDF files are accepted. Upload a .pdf file.' } } } },
  { id: 'e10', label: 'Partial withdrawal (Entire balance: No)', state: { ...typed, entire: 'no', allocations: [A1] } },
]

export default function App() {
  const [s, setS] = useState(blank)
  const [slide, setSlide] = useState(null) // { initial, editId }
  const [modal, setModal] = useState(null)
  const [toast, setToast] = useState(null)
  const [scnOpen, setScnOpen] = useState(false)
  const [scn, setScn] = useState('s1')
  const [slideKey, setSlideKey] = useState(0)
  const up = (o) => setS((p) => ({ ...p, ...o }))

  const plan = plans.find((p) => p.id === s.planId)
  const typeChosen = !!s.typeId
  const total = s.allocations.reduce((t, a) => t + num(a.amount), 0)
  const feeChanged = s.allocations.length > 0 && s.feeCommitted != null && num(s.fee) !== s.feeCommitted
  const periodic = s.withdrawAs === 'periodic'
  const pc = periodicCalc(s.periodic)
  const pReady = periodic && plan && periodicComplete(s.periodic) && !Object.keys(periodicErrors(s.periodic, plan.available)).length
  const rmd = s.typeId === 'RMD'
  const person = persons[s.person]
  const rmdOk = person.age >= RMD_AGE && person.status !== 'Active'
  const rmdMin = plan ? rmdMinimum(plan.available) : 0
  const rmdPartial = rmd && s.entire === 'no'
  const rmdAmtErr = !rmdPartial || s.rmdAmount === '' ? '' : num(s.rmdAmount) < rmdMin ? `Withdrawal amount must be at least the required minimum ${money(rmdMin)}.`
    : num(s.rmdAmount) > plan.available ? `Maximum amount available for withdrawal ${money(plan.available)}.` : ''
  // RMD with a set withdrawal amount: allocations must add up to it
  const target = rmdPartial ? num(s.rmdAmount) : plan?.available
  const coverErr = !periodic && (s.entire === 'yes' || rmdPartial) && s.allocations.length > 0 && plan && Math.abs(total - target) > 0.004
  // Separation from Service (incl. periodic payments) is only for terminated participants
  const sep = s.typeId === 'SEP'
  const sepNo = sep && person.status === 'Active'
  const noPenalty = person.age >= PENALTY_FREE_AGE
  const blocked = (rmd && !rmdOk) || sepNo
  // Periodic: source details sit on the page and cover all allocations together
  const allocNet = s.allocations.reduce((t, a) => t + calc(a).net, 0)
  const srcErr = {}
  const docList = requiredDocs.filter((d) => d.types === 'all' || d.types.includes(s.typeId))
  const docOf = (id) => ({ method: 'docusign', file: null, error: '', ...s.docs[id] })
  const docMissing = docList.filter((d) => d.required && docOf(d.id).method === 'manual' && !docOf(d.id).file)
  const docErr = docList.some((d) => docOf(d.id).error)
  const zeroPlan = plan && plan.available === 0
  const locked = s.submitted

  useEffect(() => {
    if (!toast || toast.kind === 'success') return
    const t = setTimeout(() => setToast(null), 5000)
    return () => clearTimeout(t)
  }, [toast])

  function load(sc) {
    setS({ ...blank, ...structuredClone(sc.state) })
    setSlide(sc.slide ? { initial: sc.slide.initial ? structuredClone(sc.slide.initial) : null } : null)
    setSlideKey((k) => k + 1)
    setModal(sc.modal || null)
    setToast(sc.toast === 'success' ? { kind: 'success', text: 'Withdrawal request submitted successfully' } : null)
    setScn(sc.id); setScnOpen(false)
  }

  const dirty = s.typeId || s.allocations.length
  function changePlan(id) {
    if (id === s.planId) return
    if (dirty) setModal({ kind: 'plan', planId: id })
    else up({ planId: id })
  }
  function chooseType(id) {
    const r = id === 'RMD'
    up({ typeId: id, withdrawAs: s.withdrawAs || 'one', entire: r ? 'no' : s.entire || 'yes', fee: s.fee || fmt2(DEFAULT_FEE),
      rmdAmount: r ? fmt2(rmdMinimum(plan.available)) : '', allocations: r !== (s.typeId === 'RMD') ? [] : s.allocations })
  }
  function saveAllocation(a) {
    const others = slide.editId
    const next = others ? s.allocations.map((x) => (x.id === others ? { ...a, id: others } : x)) : [...s.allocations, { ...a, id: 'a' + Date.now() }]
    up({ allocations: next, feeCommitted: num(s.fee) })
    setSlide(null)
    setToast({ text: others ? 'Allocation updated.' : `Allocation of ${money(num(a.amount))} added.` })
  }
  function remove(a) {
    const idx = s.allocations.indexOf(a)
    const next = s.allocations.filter((x) => x !== a)
    up({ allocations: next, ...(next.length ? {} : { feeCommitted: null }) })
    setToast({ text: `Removed ${distributionModes.find((m) => m.id === a.mode)?.label} ${money(num(a.amount))}.`, undo: () => setS((p) => { const l = [...p.allocations]; l.splice(idx, 0, a); return { ...p, allocations: l } }) })
  }
  function next() {
    up({ tried: true })
    if (coverErr || rmdAmtErr || blocked || feeChanged || docErr || docMissing.length || (periodic && !pReady) || Object.keys(srcErr).length) {
      setTimeout(() => document.querySelector('[data-first-error]')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 0)
      return
    }
    up({ step: 'summary', tried: true })
    window.scrollTo({ top: 0 })
  }
  const [tab, setTab] = useState('summary')
  const [agreed, setAgreed] = useState(false)
  function submitFinal() {
    up({ submitted: true })
    setToast({ kind: 'success', text: 'Withdrawal request submitted successfully' })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const canSubmit = !locked && plan && typeChosen && s.allocations.length > 0 && !blocked

  const othersTotal = s.allocations.filter((a) => a.id !== slide?.editId).reduce((t, a) => t + num(a.amount), 0)

  return (
    <div className="app">
      <Rail />
      <div className="main">
        <TopBar />
        <div className="body">
          <EmployeePanel person={person} />
          <main className="content">
            <div className="page-head">
              <h1>{s.step === 'summary' ? 'Withdrawal Summary' : 'New Withdrawal Request'}</h1>
              <div className="actions">
                {typeChosen &&                 <button className="btn btn-tertiary" disabled={locked || !plan || blocked} onClick={() => setToast({ text: 'Withdrawal request saved as draft.' })}>Save as draft</button>}
                {s.step === 'summary' ? (
                  <>
                    <button className="btn btn-secondary" disabled={locked} onClick={() => up({ step: 'edit' })}>Back</button>
                    <button className="btn btn-primary" disabled={locked} disabled={locked || !agreed} onClick={submitFinal}>Submit</button>
                  </>
                ) : (
                  <>
                    <button className="btn btn-secondary" disabled={locked} onClick={() => (dirty ? setModal({ kind: 'cancel' }) : setS(blank))}>Cancel</button>
                    <button className="btn btn-primary" disabled={!canSubmit} onClick={next}>Next</button>
                  </>
                )}
              </div>
            </div>

            {toast?.kind === 'success' && (
              <div className="success" role="status">
                <Icon.check /> <span>{toast.text}</span>
                <button className="icon-btn" aria-label="Dismiss" onClick={() => setToast(null)}><Icon.close width="14" height="14" /></button>
              </div>
            )}

                        <div className="plan-bar">
              <Select id="plan" label="Select the plan" placeholder="Select plan" value={s.planId} options={plans} onChange={changePlan} disabled={locked || s.step === 'summary'} />
              {s.step === 'summary'
                ? <div className="stat"><span>Plan ID</span><b>{plan?.planId ?? '—'}</b></div>
                : <><div className="stat"><span>Available Balance</span><b>{money(plan?.available ?? 0)}</b></div>
                  <div className="stat"><span>Vested Balance</span><b>{money(plan?.vested ?? 0)}</b></div></>}
              <div className="stat"><span>Company</span><b>{employee.company}</b></div>
            </div>
            {s.step === 'summary' ? (<>
              <div className="tabs-bar">
              <div className="tabs" role="tablist">
                <button role="tab" aria-selected={tab === 'summary'} className={tab === 'summary' ? 'on' : ''} onClick={() => setTab('summary')}>Request Summary</button>
                <button role="tab" aria-selected={tab === 'history'} className={tab === 'history' ? 'on' : ''} onClick={() => setTab('history')}>History</button>
              </div>
                <button type="button" className="btn btn-secondary tabs-cta"><Icon.download width="16" height="16" /> Export</button>
              </div>
              {tab === 'summary' ? (<>
                <div className="scroll"><Summary s={s} plan={plan} docList={docList} docOf={docOf} agreed={agreed} setAgreed={setAgreed} locked={locked} onSubmit={submitFinal} /></div>
              </>) : <History />}
            </>) : (<>
            {plan && <p className="hint plan-hint"><Icon.info /> The available amount is reported as of 09/10/2026 and may change due to market fluctuations.</p>}
            <div className="scroll">

            {zeroPlan && (
              <div className="banner warn" role="alert"><Icon.warn /> <span>{plan.name} has {money(0)} available. Choose another plan to request a withdrawal.</span></div>
            )}

            {plan && (
              <>
                {sepNo && (
                  <div className="banner error" role="alert"><Icon.warn />
                    <span><b>Not eligible for Separation from Service</b><br />Separation from Service (including periodic payments) is only available for terminated participants. {employee.name} is {person.status}.</span></div>
                )}
                {rmd && (rmdOk ? (
                  <div className="banner info" role="status"><Icon.info />
                    <span><b>Eligible for Required Minimum Distribution</b><br />{employee.name} is {person.age} years old and {person.status.toLowerCase()}, so an RMD can be raised for {RMD_YEAR}.</span></div>
                ) : (
                  <div className="banner error" role="alert"><Icon.warn />
                    <span><b>Not eligible for Required Minimum Distribution</b><br />RMD can only be requested for participants aged {RMD_AGE} or above who are terminated or retired. {employee.name} is {person.age} and {person.status}.</span></div>
                ))}
                <section className="sec">
                  <h2>Distribution Inputs</h2>
                  <Select id="type" label="Withdraw Type" placeholder="Select the withdrawal type" value={s.typeId} disabled={locked || zeroPlan}
                    options={withdrawTypes.map((t) => ({ ...t, disabled: !t.enabled, reason: t.enabled ? '' : 'Next scenario' }))} onChange={chooseType} />
                  {typeChosen && <>
                  <Segmented label="Withdraw as" value={s.withdrawAs} disabled={!typeChosen || locked || blocked} onChange={(v) => up({ withdrawAs: v })}
                    options={[{ id: 'one', label: 'One time payment' }, { id: 'periodic', label: 'Periodic payment' }]} />
                  {rmd && rmdOk && !periodic && (
                    <div className="row">
                      <div className="field" style={{ width: 240 }}><label className="lbl" htmlFor="rmdy">RMD year</label><input id="rmdy" className="txt" value={RMD_YEAR} disabled /></div>
                      <div className="field" style={{ width: 240 }}><label className="lbl" htmlFor="rmdm">Required minimum amount</label><input id="rmdm" className="txt" value={money(rmdMin)} disabled /></div>
                    </div>
                  )}
                  {!periodic && <Segmented label="Withdraw Entire Balance" size="sm" value={s.entire} disabled={!typeChosen || locked || blocked} onChange={(v) => up({ entire: v })}
                    options={[{ id: 'yes', label: 'Yes' }, { id: 'no', label: 'No' }]} />}
                  {!periodic && <small className="hint"><Icon.info /> Minimum $10.00 / Maximum {money(plan.available)}</small>}
                  {rmdPartial && rmdOk && !periodic && (
                    <div data-first-error={rmdAmtErr ? '' : undefined}>
                      <NumInput id="rmdamt" label="Withdrawal amount" prefix="$" value={s.rmdAmount} disabled={locked} width={135}
                        onChange={(v) => up({ rmdAmount: v })} error={rmdAmtErr || (s.tried && !num(s.rmdAmount) ? 'Enter the withdrawal amount.' : null)}
                        hint={`Minimum ${money(rmdMin)} (prior year-end balance ÷ IRS factor ${IRS_FACTOR}). You can withdraw more, up to ${money(plan.available)}.`} />
                    </div>
                  )}
                  <div data-first-error={feeChanged ? '' : undefined}>
                    <NumInput id="fee" label="Overall Withdraw Fee" prefix="$" value={typeChosen ? s.fee : ''} disabled={!typeChosen || locked || blocked}
                      onChange={(v) => up({ fee: v })}
                      error={feeChanged ? <>Changing this fee will impact the existing allocation(s). Please verify the allocations to proceed, or{' '}
                        restore the previous fee amount {money(s.feeCommitted)}.</> : null} />
                  </div>
                  {periodic && (
                    <div data-first-error={s.tried && !pReady ? '' : undefined} className="periodic-wrap">
                      <Periodic p={s.periodic} available={plan.available} locked={locked || blocked} showErr={s.tried}
                        set={(o) => up({ periodic: { ...s.periodic, ...o } })} />
                    </div>
                  )}
                  </>}
                </section>

                {typeChosen && <>
                <section className="sec">
                  <h2>Withdrawal Allocation</h2>
                  <div>
                    <button className="btn btn-secondary" disabled={!typeChosen || locked || (periodic && !pReady) || blocked || (rmdPartial && (!num(s.rmdAmount) || !!rmdAmtErr))}
                      onClick={() => { setSlide({}); setSlideKey((k) => k + 1) }}>Add Allocation</button>
                  </div>
                  {coverErr && (s.tried || s.allocations.length > 0) && (
                    <div className="banner warn" role="alert" data-first-error="">
                      <Icon.warn />
                      {rmdPartial ? <span>The allocation amount ({money(total)}) must add up to the withdrawal amount ({money(target)}). Update the allocation(s) or the withdrawal amount.</span> : <>
                      <span>The allocation amount ({money(total)}) does not cover the entire available balance ({money(plan.available)}). Please update the allocation(s) to withdraw the full balance or choose to{' '}
                        proceed with a partial withdrawal.</span></>}
                    </div>
                  )}
                  {s.allocations.length > 0 && (
                    <AllocTable rows={s.allocations} locked={locked}
                      onEdit={(a) => { setSlide({ initial: a, editId: a.id }); setSlideKey((k) => k + 1) }} onRemove={remove} />
                  )}
                </section>

                {periodic && s.allocations.length > 0 && (
                  <section className="sec">
                    <h2>Payment schedule</h2>
                    <div><button className="btn-link-arrow" disabled={!pReady} onClick={() => setModal({ kind: 'schedule' })}>View payment schedule <Icon.arrowRight /></button></div>
                    {!pReady && <p className="hint"><Icon.info /> Complete the periodic payment details to view the schedule.</p>}
                  </section>
                )}

                <section className="sec">
                  <h2>Required Documents</h2>
                  {docList.map((d) => (
                    <Docs key={d.id} d={d} v={docOf(d.id)} locked={locked || blocked}
                      missing={s.tried && docMissing.includes(d)}
                      set={(o) => setS((p) => ({ ...p, docs: { ...p.docs, [d.id]: { ...docOf(d.id), ...p.docs[d.id], ...o } } }))} />
                  ))}
                </section>
                </>}

              </>
            )}
            </div>
            </>)}
          </main>
        </div>
      </div>

      {slide && plan && (
        <Slideout key={slideKey} plan={plan} initial={slide.initial} isEdit={!!slide.editId} othersTotal={othersTotal} cap={periodic ? pc.total : rmdPartial ? num(s.rmdAmount) : undefined} hideSource={false} rmd={rmd} noPenalty={noPenalty}
          onCancel={() => setSlide(null)} onSave={saveAllocation} />
      )}

      {modal?.kind === 'plan' && (
        <Modal title="Do you want to proceed?" body="Changing the plan now will result in losing all your progress."
          onCancel={() => setModal(null)} onOk={() => { setS({ ...blank, planId: modal.planId }); setModal(null); setToast({ text: 'Plan changed. Your previous inputs were cleared.' }) }} />
      )}
      {modal?.kind === 'schedule' && <ScheduleModal p={s.periodic} onClose={() => setModal(null)} />}
      {modal?.kind === 'cancel' && (
        <Modal title="Discard this request?" body="You will lose the inputs and allocations you have added." okLabel="Discard" danger
          onCancel={() => setModal(null)} onOk={() => { setS(blank); setModal(null) }} />
      )}

      {toast && toast.kind !== 'success' && (
        <div className="toast" role="status">
          {toast.text}
          {toast.undo && <button className="link light" onClick={() => { toast.undo(); setToast(null) }}>Undo</button>}
        </div>
      )}

      {SHOW_SCN && (<div className="scn">
        {scnOpen && (
          <div className="scn-panel" role="dialog" aria-label="Scenarios">
            <div className="scn-head"><b>Scenarios</b><button className="icon-btn" aria-label="Close" onClick={() => setScnOpen(false)}><Icon.close width="14" height="14" /></button></div>
            {SCENARIOS.map((x, i) => x.group ? <div key={i} className="scn-group">{x.group}</div> : (
              <button key={x.id} className={`scn-item ${scn === x.id ? 'on' : ''}`} onClick={() => load(x)}>{x.label}</button>
            ))}
          </div>
        )}
        <button className="scn-btn" onClick={() => setScnOpen(!scnOpen)} aria-expanded={scnOpen}><Icon.layers /> Scenarios</button>
      </div>)}
    </div>
  )
}

function AllocTable({ rows, onEdit, onRemove, locked, readOnly }) {
  const code = (id) => (codes1099.find((c) => c.id === id)?.label.match(/Code \w+/) || [''])[0]
  return (
    <div className={`alloc ${readOnly ? 'ro' : ''}`}>
      <div className="alloc-head">
        {readOnly ? <><span>Recipient &amp; Payment</span><span>1099 codes</span><span>Address</span><span>Net amount</span></> : <><span>Recipient &amp; Payment</span><span>1099 codes</span><span>Gross amount</span><span>State tax</span><span>Federal tax</span><span>Penalty</span><span>Fee</span><span>Net amount</span><span className="c">Action</span></>}
      </div>
      {rows.map((a) => {
        const c = calc(a)
        const mode = distributionModes.find((m) => m.id === a.mode)
        const pay = isRollover(a) ? `${a.rollover.delivery === 'wire' ? 'Wire transfer' : 'Check to trustee'} · ${a.rollover.plan}` : a.payment === 'etf' ? `EFT · ${a.bank === 'custom' ? 'Custom bank' : 'Employee bank'}` : `Mail check · ${a.addr === 'custom' ? 'Custom address' : 'Employee address'}`
        if (readOnly) {
          return (
            <div className="alloc-row" key={a.id}>
              <div className="cell-main"><b>{mode?.label}</b><span>{pay}</span></div>
              <div><b>Roth: {code(a.roth)}</b><b>Non Roth: {code(a.nonRoth)}</b></div>
              {(() => {
                if (isRollover(a)) return <div><span>Not applicable</span></div>
                const custom = a.payment !== 'etf' && a.addr === 'custom', ad = custom ? a.address : employee.address
                return <div><b>{[ad.line1, ad.line2].filter(Boolean).join(', ')}</b><span>{ad.city}, {ad.state} {ad.zip}</span><em className="addr-src">{custom ? 'Custom address' : 'As per employee records'}</em></div>
              })()}
              <div><b>{money(c.net)}</b></div>
            </div>
          )
        }
        return (
          <div className="alloc-row" key={a.id}>
            <div className="cell-main"><b>{mode?.label}</b><span>{pay}</span></div>
            <div><b>Roth: {code(a.roth)}</b><b>Non Roth: {code(a.nonRoth)}</b></div>
            <div><b>{money(c.gross)}</b></div>
            <div><b>{num(a.state)}%</b><span>{money(c.stateAmt)}</span></div>
            <div><b>{num(a.fed)}%</b><span>{money(c.fedAmt)}</span></div>
            <div>{isRollover(a) || a.noPen ? <><b>{money(0)}</b><span>{isRollover(a) ? 'Rollover' : 'Not applicable'}</span></>
              : <><b>{a.waive === 'yes' ? 0 : PENALTY_RATE}%</b><span>{a.waive === 'yes' ? 'Not applicable' : money(c.penAmt)}</span></>}</div>
            <div><b>{money(c.fee)}</b><span>{c.fee ? (a.payment === 'etf' ? 'EFT fee' : 'Check fee') : isRollover(a) ? 'Rollover' : 'No fee'}</span></div>
            <div><b>{money(c.net)}</b></div>
            {!readOnly && <div className="cell-act">
              <button className="round edit" aria-label={`Edit ${mode?.label} ${money(c.gross)}`} disabled={locked} onClick={() => onEdit(a)}><Icon.edit /></button>
              <button className="round del" aria-label={`Delete ${mode?.label} ${money(c.gross)}`} disabled={locked} onClick={() => onRemove(a)}><Icon.trash /></button>
            </div>}
          </div>
        )
      })}
    </div>
  )
}

// Sample template for each required document (prototype: a one-page PDF)
function downloadTemplate(d) {
  const text = `${d.name} - sample template`
  const body = `BT /F1 18 Tf 72 720 Td (${text}) Tj ET`
  const objs = ['<< /Type /Catalog /Pages 2 0 R >>', '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
    `<< /Length ${body.length} >>\nstream\n${body}\nendstream`, '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>']
  let pdf = '%PDF-1.4\n'; const offs = []
  objs.forEach((o, i) => { offs.push(pdf.length); pdf += `${i + 1} 0 obj\n${o}\nendobj\n` })
  const x = pdf.length
  pdf += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n${offs.map((o) => String(o).padStart(10, '0') + ' 00000 n \n').join('')}trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${x}\n%%EOF`
  const url = URL.createObjectURL(new Blob([pdf], { type: 'application/pdf' }))
  const el = document.createElement('a'); el.href = url; el.download = `${d.id}-template.pdf`; el.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function Docs({ d, v, set, locked, missing }) {
  const input = useRef(null)
  const [drag, setDrag] = useState(false)
  function take(f) {
    if (!f) return
    if (f.type !== 'application/pdf' && !/\.pdf$/i.test(f.name)) return set({ file: null, error: `Only PDF files are accepted. "${f.name}" is not a PDF.` })
    if (f.size > MAX_FILE_MB * 1024 * 1024) return set({ file: null, error: `File is ${(f.size / 1048576).toFixed(1)} MB. Upload a PDF of ${MAX_FILE_MB} MB or less.` })
    set({ file: { name: f.name, size: f.size }, error: '' })
  }
  const error = v.error || (missing ? `${d.name} is required. Upload the PDF or switch to Use docusign.` : '')
  return (
    <div className="docs" data-first-error={error ? '' : undefined}>
      <div className="docs-left">
        <div className="doc-title">{d.name} <span>({d.required ? 'Required' : 'Optional'})</span></div>
        <Segmented value={v.method} disabled={locked} onChange={(m) => set({ method: m, error: '' })}
          options={[{ id: 'manual', label: 'Upload manually' }, { id: 'docusign', label: 'Use docusign' }]} />
        <div className="doc-meta">Accepted file : PDF <i /> Max File Size : {MAX_FILE_MB} MB</div>
      </div>
      <div className="docs-right">
        {v.method === 'docusign' ? (
          <div className="docusign">
            <div className="ds-title"><Icon.sign /> Use Docusign</div>
            <p>Participants will receive documents<br />via their Docsign accounts</p>
          </div>
        ) : v.file ? (
          <div className="file-chip">
            <Icon.file /> <span><b>{v.file.name}</b><small>{(v.file.size / 1024).toFixed(0)} KB</small>
              <em className="up-ok" role="status"><Icon.check /> Uploaded successfully</em></span>
            {!locked && <button className="link" onClick={() => set({ file: null })}>Remove</button>}
          </div>
        ) : (
          <div className={`drop ${drag ? 'is-drag' : ''} ${error ? 'is-error' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setDrag(true) }} onDragLeave={() => setDrag(false)}
            onDrop={(e) => { e.preventDefault(); setDrag(false); take(e.dataTransfer.files[0]) }}>
            <Icon.upload />
            <p>Drag and drop the {d.name.toLowerCase()} here, or <button className="link" onClick={() => input.current?.click()}>browse</button></p>
            <input ref={input} type="file" hidden accept="application/pdf,.pdf" onChange={(e) => { take(e.target.files[0]); e.target.value = '' }} />
            {error && <p className="err" role="alert"><Icon.warn width="14" height="14" /> {error}</p>}
          </div>
        )}
      </div>
    </div>
  )
}

const RAIL_ITEMS = [['dashboard', 'Dashboard'], ['payroll', 'Payroll'], ['employee', 'Employee'], ['config', 'Plan Config'], ['transact', 'Transact...'], ['others', 'Others']]
export function Rail({ items = RAIL_ITEMS, active = 'payroll' }) {
  return (
    <nav className="rail" aria-label="Main">
      <CoreLogo />
      {items.map(([k, l]) => {
        const Ic = Icon[k]
        return <a key={k} href="#" className={`rail-item ${k === active ? 'on' : ''}`} aria-current={k === active ? 'page' : undefined} onClick={(e) => e.preventDefault()}><Ic /><span>{l}</span></a>
      })}
    </nav>
  )
}

export function TopBar({ simple }) {
  return (
    <header className="topbar">
      <div className="logo">
        <svg viewBox="0 0 44 44" width="34" height="34" aria-hidden="true"><ellipse cx="17" cy="22" rx="12" ry="20" fill="#0B6FD3" /><path d="M30 4c6 5 9 11 9 18s-3 13-9 18" stroke="#0B9BE0" strokeWidth="4" fill="none" strokeLinecap="round" /></svg>
        <span>Galileo</span>
      </div>
      {simple ? (
        <div className="top-actions">
          <button className="icon-btn" aria-label="Profile"><svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="12" cy="8" r="4" /><path d="M4 21c1-4 4-6 8-6s7 2 8 6z" /></svg></button>
          <button className="icon-btn" aria-label="More"><svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="12" cy="5" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="12" cy="19" r="2" /></svg></button>
        </div>
      ) : (
      <div className="top-actions">
        <button className="icon-btn bell" aria-label="Notifications, 25 new"><Icon.bell size={22} /><span className="badge">+25</span></button>
        <button className="icon-btn" aria-label="Help"><Icon.help size={24} /></button>
        <div className="avatar sm" aria-label="Signed in as AR">AR<span className="dot" /></div>
      </div>
      )}
    </header>
  )
}

function EmployeePanel({ person }) {
  return (
    <aside className="emp">
      <a href="#" className="back" onClick={(e) => e.preventDefault()}><Icon.back size={16} /> <u>Back</u></a>
      <h2>Employee Details</h2>
      <div className="emp-card">
        <div className="emp-top">
          <div className="avatar lg">{employee.initials}</div>
          <div className="emp-info">
            <b>{employee.name}</b>
            <span>SSN : {employee.ssn}</span>
            <span>ID : {employee.id}</span>
            <span>Status : <em className={person.status === 'Active' ? 'chip-ok' : 'chip-bad'}>{person.status === 'Active' ? <Icon.shield /> : <Icon.warn width="11" height="11" />} {person.status}</em></span>
          </div>
        </div>
        <div className="emp-co"><span>Company :</span> <b>{employee.company}</b></div>
        <button type="button" className="link emp-more">View more</button>
      </div>
    </aside>
  )
}

function CoreLogo() {
  return <img className="core" src={coreLogo} alt="CORE" width="84" />
}

const HISTORY = [
  { at: 'Jan 7, 2025 at 10:00', title: 'Withdrawal request submitted', by: 'Jack Dawson', role: 'Admin' },
  { at: 'Jan 8, 2025 at 13:00', title: 'Withdrawal request Approved', by: 'Jack Dawson', role: 'Sponsor' },
  { at: 'Jan 8, 2025 at 13:00', title: 'Withdrawal request Approved', by: 'Jack Dawson', role: 'Super user' },
  { at: 'Jan 8, 2025 at 13:00', title: 'Awaiting trade', by: 'System generated' },
  { at: 'Jan 8, 2025 at 13:00', title: 'Completed', by: 'Aris states' },
]

function History() {
  return (
    <ol className="hist">
      {HISTORY.map((h, i) => (
        <li key={i}>
          <span className="hist-at">{h.at}</span>
          <span className="hist-dot" aria-hidden="true" />
          <div className="hist-body">
            <b>{h.title}</b>
            <div className="hist-by">{h.by}{h.role && <><i aria-hidden="true">|</i><span className="hist-role">{h.role}</span></>}</div>
          </div>
        </li>
      ))}
    </ol>
  )
}

// Scenario switcher is hidden; open the app with ?scenarios to bring it back for testing
const SHOW_SCN = new URLSearchParams(window.location.search).has('scenarios')

function Summary({ s, plan, docList, docOf, agreed, setAgreed, locked, onSubmit }) {
  const [feeOpen, setFeeOpen] = useState(true)
  const [penOpen, setPenOpen] = useState(false)
  const type = withdrawTypes.find((t) => t.id === s.typeId)
  const rows = s.allocations.map((a) => ({ a, c: calc(a), mode: distributionModes.find((m) => m.id === a.mode) }))
  const t = rows.reduce((x, { a, c }) => ({ gross: x.gross + c.gross, fed: x.fed + c.fedAmt, st: x.st + c.stateAmt, pen: x.pen + c.penAmt, fee: x.fee + c.fee, eft: x.eft + (a.payment === 'etf' ? c.fee : 0), chk: x.chk + (a.payment === 'etf' ? 0 : c.fee), net: x.net + c.net }), { gross: 0, fed: 0, st: 0, pen: 0, fee: 0, eft: 0, chk: 0, net: 0 })
  const ded = t.fed + t.st + t.pen + t.fee + num(s.fee)
  const asLabel = s.withdrawAs === 'one' ? 'One time payment' : 'Periodic payment'
  const reduced = rows.some(({ a }) => a.waive === 'yes' && !a.noPen)
  const n = s.allocations.length
  const go = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  const KV = ({ k, children }) => <div className="kv"><span>{k}</span><div>{children}</div></div>
  // One step on the reading path: number on the line, title, and a lead that ties it to the figures above
  const Step = ({ id, n: num, title, lead, children }) => (
    <section className="fl-step" id={id} aria-label={title || "Withdrawal Details"}>
      <span className="fl-dot" aria-hidden="true">{num}</span>
      {title && <h2 id={`${id}-h`}>{title}</h2>}
      {children}
    </section>
  )
  let step = 0
  return (
    <div className="ws">
      <div className="fl">
        <Step id="fl-fees" n={++step} title="Withdrawal Details">
          <div className="wdx">
            <div className="wdx-req">
              <span>Requested Amount</span>
              <b>{money(t.gross)}</b>
              <div className="wdx-kv"><span>Withdrawal type</span><b>{type?.display}</b></div>
              <div className="wdx-kv"><span>Withdrawal as</span><b>{asLabel}</b></div>
              {s.withdrawAs !== 'periodic' && <div className="wdx-kv"><span>Withdrawal entire balance</span><b>{s.entire === 'yes' ? 'Yes' : 'No'}</b></div>}
            </div>
            <div className="wdx-st">
              <div className="wdx-row"><span>Gross withdrawal amount</span><b>{money(t.gross)}</b></div>
              <div className="wdx-row"><button type="button" className="wd-tg" aria-expanded={feeOpen} onClick={() => setFeeOpen(!feeOpen)}><span className="box" aria-hidden="true">{feeOpen ? '−' : '+'}</span>Fee &amp; tax details</button><b>− {money(ded)}</b></div>
              {feeOpen && <div className="wdx-sub">{[['Overall Withdrawal fee', num(s.fee)], ['EFT fee', t.eft], ['Check fee', t.chk], [`Early Withdraw penalty${reduced ? ' (reduced)' : ''}`, t.pen], ['Federal tax', t.fed], ['State tax', t.st]]
                .filter(([, v]) => v > 0)
                .map(([k, v]) => <div key={k}><span>{k}</span><span>{money(v)}</span></div>)}</div>}
              <div className="wdx-row wdx-net"><b>Net withdrawal amount</b><b>{money(t.gross - ded)}</b></div>
            </div>
          </div>
          {(s.typeId === 'RMD' || t.pen > 0) && <div className="wdx-foot">
            {t.pen > 0 && <p><Icon.info /> <b>Early Withdrawal Penalty Notice</b> <button type="button" className="link" aria-expanded={penOpen} onClick={() => setPenOpen(!penOpen)}>{penOpen ? 'View Less' : 'View More'}</button></p>}
            {t.pen > 0 && penOpen && <p>{employee.name} is under 59½, so an early withdrawal penalty of {money(t.pen)} will be deducted. This notice is shared with the participant and the admin.</p>}
            {s.typeId === 'RMD' && <p><Icon.info /> RMD year {RMD_YEAR} · Required minimum amount {money(rmdMinimum(plan.available))}{s.entire === 'no' ? ` · Withdrawal amount ${money(num(s.rmdAmount))}` : ''}</p>}
          </div>}
        </Step>

        {s.withdrawAs === 'periodic' && (() => {
          const p = s.periodic, pc = periodicCalc(p)
          return (
            <Step id="fl-sched" n={++step} title="Payment schedule" lead={<>The net amount is paid in {Math.ceil(pc.count)} {pc.f.label.toLowerCase()} installments of {money(pc.amount)}.</>}>
              <div className="kv-grid">
                <KV k="Periodic payment"><b>{periodicKinds.find((k) => k.id === p.kind)?.label}</b></KV>
                <KV k="Total amount"><b>{money(pc.total)}</b></KV>
                <KV k="Installment amount"><b>{money(pc.amount)}</b></KV>
                <KV k="Installments"><b>{Math.ceil(pc.count)} · {pc.f.label}</b></KV>
                {p.kind === 'tenure' && <KV k="Tenure"><b>{p.tenure === 'other' ? p.years : p.tenure} years</b></KV>}
                {p.kind === 'annuity' && <KV k="Interest rate"><b>{num(p.interest).toFixed(2)}%</b></KV>}
                <KV k="Installment date"><b>{p.dateMode === 'custom' ? new Date(p.date + 'T00:00').toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }) : FIXED_PAY_DAY}</b></KV>
              </div>
            </Step>
          )
        })()}

        <Step id="fl-alloc" n={++step} title="Withdrawal Allocation"
          lead={<>Where the money goes: {money(t.gross)} is paid out through {n} allocation{n === 1 ? '' : 's'}; each row shows its own taxes and net.</>}>
          <div className="summary"><AllocTable rows={s.allocations} readOnly /></div>
        </Step>

        <Step id="fl-src" n={++step} title="Source Withdraw Amount"
          lead={<>Where the money comes from: the {money(t.gross)} is taken from these sources and investments.</>}>
          <InvRestriction />
          <SourceSummary plan={plan} items={rows.map(({ a, c, mode }) => ({ key: a.id, v: a, gross: c.gross, net: c.net, title: mode?.label }))} />
        </Step>

        <Step id="fl-docs" n={++step} title="Uploaded Documents"
          lead={<>{docList.length} document{docList.length === 1 ? '' : 's'} support this request.</>}>
          <ul className="doc-list">
            {docList.map((d) => { const v = docOf(d.id); return (
              <li key={d.id}>
                {v.method === 'manual' && v.file
                  ? <><span className="ok" aria-hidden="true"><Icon.check /></span><span className="nm"><b>{v.file.name}</b><small>{(v.file.size / 1024).toFixed(0)}KB</small></span>
                    <span className="act"><button type="button" className="icon-btn" aria-label={`Download ${v.file.name}`}><Icon.download /></button><button type="button" className="icon-btn" aria-label={`Delete ${v.file.name}`} disabled={locked}><Icon.trash /></button></span></>
                  : <><span className="nm"><b>{d.name}{d.required ? '' : ' (optional)'}</b><small>{v.method === 'docusign' ? 'Use docusign' : 'Not uploaded'}</small></span></>}
              </li>
            ) })}
          </ul>
          {docList.some((d) => docOf(d.id).method === 'docusign') && <p className="kv-note">Participants will receive Docusign documents via their Docusign accounts.</p>}
        </Step>

        <Step id="fl-confirm" n={++step} title="Confirm and submit" lead={<>You are submitting {money(t.gross)} with {money(t.net)} net to the participant.</>}>
          <div className="tx-final">
            <label><input type="checkbox" checked={agreed} disabled={locked} onChange={(e) => setAgreed(e.target.checked)} /> By checking this box, I declare that I have read the <a href="#" onClick={(e) => e.preventDefault()}>Terms &amp; Conditions</a></label>
          </div>
        </Step>
      </div>
    </div>
  )
}

