import React from 'react'
import { periodicKinds, frequencies, tenureOptions, annuitant, FIXED_PAY_DAY } from './data.js'
import { Select, Segmented, NumInput, TextInput, Icon, money, num, useTrap } from './ui.jsx'

export const emptyPeriodic = { kind: '', total: '', installment: '', tenure: '', years: '', dateMode: 'fixed', date: '', freq: 'monthly', interest: annuitant.interest }

const today = () => new Date().toISOString().slice(0, 10)

// Schedule maths shared by the form, the allocation cap and the summary page
export function periodicCalc(p) {
  const f = frequencies.find((x) => x.id === p.freq) || frequencies[0]
  const total = num(p.total)
  let count = 0, amount = 0
  if (p.kind === 'dollar') {
    amount = num(p.installment)
    count = amount > 0 ? Math.ceil(total / amount - 1e-9) : 0
  } else if (p.kind === 'tenure') {
    const yrs = p.tenure === 'life' ? annuitant.lifeExpectancy : p.tenure === 'other' ? num(p.years) : num(p.tenure)
    count = Math.round(yrs * f.perYear * 10) / 10
    amount = count > 0 ? total / count : 0
  } else if (p.kind === 'annuity') {
    const r = num(p.interest) / 100 / f.perYear
    count = annuitant.lifeExpectancy * f.perYear
    amount = total <= 0 ? 0 : r === 0 ? total / count : (total * r) / (1 - Math.pow(1 + r, -count))
  }
  amount = Math.round(amount * 100) / 100
  return { f, total, count, amount }
}

export function periodicErrors(p, available) {
  const e = {}
  const t = num(p.total)
  if (!p.kind) e.kind = 'Select the periodic payment type.'
  if (p.total !== '' && t <= 0) e.total = 'Enter an amount greater than $0.00.'
  else if (t > available) e.total = `Maximum amount available for withdrawal ${money(available)}.`
  if (p.kind === 'dollar' && p.installment !== '') {
    if (num(p.installment) <= 0) e.installment = 'Enter an installment amount greater than $0.00.'
    else if (num(p.installment) > t && t > 0) e.installment = `Installment can't be more than the total amount ${money(t)}.`
  }
  if (p.kind === 'tenure' && p.tenure === 'other' && p.years !== '' && (num(p.years) < 1 || num(p.years) > 50 || !Number.isInteger(num(p.years))))
    e.years = 'Enter whole years between 1 and 50.'
  if (p.kind === 'annuity' && p.interest !== '' && num(p.interest) > 20) e.interest = 'Interest rate must be 20% or less.'
  if (p.dateMode === 'custom' && p.date && p.date <= today()) e.date = 'Choose a date after today.'
  return e
}

export function periodicComplete(p) {
  if (!p.kind || num(p.total) <= 0) return false
  if (p.kind === 'dollar' && num(p.installment) <= 0) return false
  if (p.kind === 'tenure' && (!p.tenure || (p.tenure === 'other' && !p.years))) return false
  if (p.kind === 'annuity' && p.interest === '') return false
  if (p.dateMode === 'custom' && !p.date) return false
  return true
}

export default function Periodic({ p, set, available, locked, showErr }) {
  const e = periodicErrors(p, available)
  const { f, count, amount, total } = periodicCalc(p)
  const kind = periodicKinds.find((k) => k.id === p.kind)
  const ok = periodicComplete(p) && !Object.keys(e).length
  const err = (k) => (showErr || p[k] !== '' ? e[k] : null)
  const freqSel = (
    <Select id="freq" label="Disbursement Frequency" value={p.freq} disabled={locked} searchable={false}
      options={frequencies} onChange={(v) => set({ freq: v })} />
  )
  const schedule = ok && (
    p.kind === 'dollar' ? `Tenure: ${count} ${f.unit} installments (${money(total)} ÷ ${money(num(p.installment))})`
      : p.kind === 'tenure' ? `Withdrawal amount ${money(amount)} / ${f.label} (${Math.ceil(count - 1e-9)} installments)`
        : `Withdrawal amount ${money(amount)} / ${f.label} (life expectancy ${annuitant.lifeExpectancy} yrs at ${num(p.interest).toFixed(2)}%)`
  )

  return (
    <>
      <Select id="ptype" label="Periodic payment" placeholder="Select the periodic payment" value={p.kind} disabled={locked} searchable={false}
        options={periodicKinds} onChange={(v) => set({ ...emptyPeriodic, kind: v, total: p.total })} error={showErr && !p.kind ? e.kind : null} />

      {kind && (
        <div className="periodic">
          <h3>{kind.label} Details</h3>
          <NumInput id="ptotal" label="Total available amount" prefix="$" value={p.total} disabled={locked} width={156}
            onChange={(v) => set({ total: v })} error={err('total')} />

          {p.kind === 'dollar' && (
            <NumInput id="pinst" label="Installment amount" prefix="$" value={p.installment} disabled={locked} width={135}
              onChange={(v) => set({ installment: v })} error={err('installment')} />
          )}

          {p.kind === 'tenure' && (<>
            <Select id="ptenure" label="Specific Tenure" placeholder="Select the tenure" value={p.tenure} disabled={locked} searchable={false}
              options={tenureOptions} onChange={(v) => set({ tenure: v, years: v === 'other' || v === 'life' ? '' : v })} />
            {p.tenure === 'life' ? (<>
              <TextInput id="plife" label="Participant Life Expectancy" value={String(annuitant.lifeExpectancy)} disabled onChange={() => {}} />
              <TextInput id="page" label="Participant Current Age" value={String(annuitant.age)} disabled onChange={() => {}} />
              <TextInput id="pdob" label="Participant Date of Birth" value={annuitant.dob} disabled width={165} onChange={() => {}} />
            </>) : (
            <div className="field" style={{ width: 240 }}>
              <label className="lbl" htmlFor="pyears">Number of years</label>
              <input id="pyears" className={`txt ${err('years') ? 'is-error' : ''}`} inputMode="numeric" placeholder="Enter years"
                disabled={locked || p.tenure !== 'other'} value={p.years} aria-invalid={!!err('years')}
                onChange={(ev) => set({ years: ev.target.value.replace(/\D/g, '').slice(0, 2) })} />
              {err('years') && <p className="err" role="alert">{err('years')}</p>}
            </div>
            )}
          </>)}

          {p.kind === 'annuity' && (<>
            <TextInput id="plife" label="Participant Life Expectancy" value={String(annuitant.lifeExpectancy)} disabled onChange={() => {}} />
            <TextInput id="page" label="Participant Current Age" value={String(annuitant.age)} disabled onChange={() => {}} />
            <TextInput id="pdob" label="Participant Date of Birth" value={annuitant.dob} disabled width={165} onChange={() => {}} />
            <NumInput id="pint" label="Interest rate (%)" suffix="%" value={p.interest} disabled={locked} width={135}
              onChange={(v) => set({ interest: v })} error={err('interest')} />
          </>)}

          <Segmented label="Installment date" value={p.dateMode} disabled={locked} onChange={(v) => set({ dateMode: v, date: '' })}
            options={[{ id: 'fixed', label: 'Fixed date' }, { id: 'custom', label: 'Custom date' }]} />
          <div className="num-row">
            {freqSel}
            {schedule && <span className="after">{schedule}</span>}
          </div>
          {p.dateMode === 'custom' ? (
            <TextInput id="pdate" type="date" label="Date" value={p.date} width={165} disabled={locked}
              onChange={(v) => set({ date: v })} error={err('date') || (showErr && !p.date ? 'Select the first installment date.' : null)} />
          ) : (
            <TextInput id="pdate" label="Date" value={FIXED_PAY_DAY} width={200} disabled onChange={() => {}} />
          )}
        </div>
      )}
    </>
  )
}

// Installment-by-installment schedule for "View payment schedule"
export function buildSchedule(p) {
  const { f, total, count, amount } = periodicCalc(p)
  const n = Math.ceil(count - 1e-9)
  const step = 12 / f.perYear
  const now = new Date()
  const start = p.dateMode === 'custom' && p.date ? new Date(p.date + 'T00:00') : new Date(now.getFullYear(), now.getMonth() + 1, 1)
  const r = p.kind === 'annuity' ? num(p.interest) / 100 / f.perYear : 0
  const rows = []
  let bal = total
  for (let i = 0; i < n && bal > 0.004; i++) {
    const d = new Date(start.getFullYear(), start.getMonth() + i * step, start.getDate())
    bal = bal * (1 + r)
    const pay = Math.min(amount, Math.round(bal * 100) / 100)
    bal = Math.max(0, bal - pay)
    rows.push({ no: i + 1, date: d.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }), pay, bal })
  }
  return rows
}

export function ScheduleModal({ p, onClose }) {
  const ref = useTrap(true, onClose)
  const rows = buildSchedule(p)
  const { f } = periodicCalc(p)
  const sum = rows.reduce((t, r) => t + r.pay, 0)
  return (
    <div className="scrim" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <aside className="slide" role="dialog" aria-modal="true" aria-labelledby="schtitle" ref={ref}>
        <header className="slide-head">
          <h2 id="schtitle">Payment Schedule</h2>
          <div className="actions"><button className="btn btn-primary" onClick={onClose}>Close</button></div>
        </header>
        <div className="sched-body">
          <section>
            <h3>Installments</h3>
            <table className="itbl">
              <thead><tr><th>Installment</th><th>Payment date</th><th className="r">Amount</th><th className="r">Remaining balance</th></tr></thead>
              <tbody>{rows.map((r) => <tr key={r.no}><td>{String(r.no).padStart(2, '0')}</td><td>{r.date}</td><td className="r">{money(r.pay)}</td><td className="r">{money(r.bal)}</td></tr>)}</tbody>
            </table>
          </section>
        </div>
      </aside>
    </div>
  )
}
