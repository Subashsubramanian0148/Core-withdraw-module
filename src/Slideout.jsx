import React, { useEffect, useState } from 'react'
import { Icon, Select, Segmented, NumInput } from './ui.jsx'
import { employee, distributionModes, codes1099, slideSource, plans, money, num, fmt2, calc, PAYMENT_FEE, PENALTY_RATE } from './data.js'

const blankAddr = { line1: '', line2: '', city: '', country: 'USA', state: '', zip: '' }
const blankBank = { account: '', holder: '', name: '', routing: '', type: 'savings' }
const empty = { mode: '', amount: '', roth: '1', nonRoth: '1', fed: '20.00', state: '0.00', penalty: 'no', payment: 'check',
  addrSrc: 'records', address: blankAddr, bankSrc: 'records', bank: blankBank, srcMode: 'prorata', picks: {} }

export default function Slideout({ initial, max, available, onCancel, onSave }) {
  const [a, setA] = useState({ ...empty, ...initial })
  const set = (k, v) => setA((p) => ({ ...p, [k]: v }))
  const c = calc(a)
  const over = c.gross > max
  const customAddr = a.payment === 'check' && a.addrSrc === 'custom'
  const customBank = a.payment === 'eft' && a.bankSrc === 'custom'
  const addrOk = !customAddr || (a.address.line1 && a.address.city && a.address.state && a.address.zip)
  const bankOk = !customBank || (a.bank.account && a.bank.holder && a.bank.name && a.bank.routing)
  const valid = a.mode && c.gross > 0 && !over && addrOk && bankOk
  useEffect(() => {
    const k = (e) => e.key === 'Escape' && onCancel()
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [onCancel])

  return (
    <div className="scrim" onMouseDown={(e) => e.target === e.currentTarget && onCancel()}>
      <aside className="slide" role="dialog" aria-modal="true" aria-labelledby="st">
        <header className="slide-head">
          <h2 id="st">{initial ? 'Edit Withdrawal Allocation' : 'Add Withdrawal Allocation'}</h2>
          <div className="head-actions">
            <button type="button" className="btn btn-outline" onClick={onCancel}>Cancel</button>
            <button type="button" className="btn btn-primary" disabled={!valid} onClick={() => onSave(a)}>Save</button>
          </div>
        </header>
        <div className="slide-body">
          <section>
            <h3>Distribution</h3>
            <Select id="mode" label="Select distribution mode" placeholder="Select the distribution mode" value={a.mode} options={distributionModes} onChange={(v) => set('mode', v)} />
            <NumInput id="amt" label="Allocation amount" prefix="$" value={a.amount} onChange={(v) => set('amount', v)}
              error={over ? `Maximum amount available for withdrawal ${money(max)}` : null} hint={`Maximum amount available for withdrawal ${money(max)}`} />
          </section>

          <section>
            <h3>Tax &amp; Penalty</h3>
            <div className="row">
              <Select id="roth" label="Select Roth 1099 Code" value={a.roth} options={codes1099} searchable={false} onChange={(v) => set('roth', v)} />
              <Select id="nroth" label="Select Non Roth 1099 Code" value={a.nonRoth} options={codes1099} searchable={false} onChange={(v) => set('nonRoth', v)} />
            </div>
            <NumInput id="fed" label="Federal tax" tip="Fee will be deducted from account balance" suffix="%" width={120}
              value={a.fed} onChange={(v) => set('fed', v)} after={<><b>{money(c.fed)}</b> tax deduction</>} />
            <NumInput id="state" label="State tax" tip="Fee will be deducted from account balance" suffix="%" width={120}
              value={a.state} onChange={(v) => set('state', v)} after={<><b>{money(c.state)}</b> tax deduction</>} />
            <div className="field">
              <Segmented label="Early withdraw penalty" value={a.penalty} onChange={(v) => set('penalty', v)} options={[{ id: 'yes', label: 'Yes' }, { id: 'no', label: 'No' }]} />
              <p className="msg"><Icon.info width="12" height="12" />
                {a.penalty === 'no'
                  ? 'Early Withdrawal Penalty does not apply for this transaction. This notice is shared with the participant and the admin.'
                  : `Early Withdrawal Penalty of ${PENALTY_RATE}% (${money(c.pen)}) applies for this transaction. This notice is shared with the participant and the admin.`}
              </p>
            </div>
          </section>

          <section>
            <h3>Payment Method</h3>
            <Segmented label="Choose payment method" value={a.payment} onChange={(v) => set('payment', v)} options={[{ id: 'check', label: 'Mail check to address' }, { id: 'eft', label: 'EFT' }]} />
            <NumInput id="pfee" label={a.payment === 'eft' ? 'EFT Fee' : 'Check Fee'} prefix="$" value={fmt2(PAYMENT_FEE)} onChange={() => {}} disabled
              hint="Fee will be deducted from account balance" />
            {a.payment === 'check' ? <>
              <Segmented label="Select address details" value={a.addrSrc} onChange={(v) => set('addrSrc', v)} options={[{ id: 'records', label: 'As in employee records' }, { id: 'custom', label: 'Custom' }]} />
              <h4>{customAddr ? 'Address Details (Custom)' : 'Address Details (From Employee Records)'}</h4>
              <Fields cols={[['line1', 'Address line 1', 'Enter street address'], ['line2', 'Address line 2', 'Apartment, suite, unit (optional)'], ['city', 'City', 'Enter city'], ['country', 'Country', 'USA'], ['state', 'State', 'Enter state'], ['zip', 'Zip code', 'Enter 5-digit zip code']]}
                values={customAddr ? a.address : employee.address} disabled={!customAddr} lock={['country']} onChange={(k, v) => set('address', { ...a.address, [k]: v })} />
            </> : <>
              <Segmented label="Select bank details" value={a.bankSrc} onChange={(v) => set('bankSrc', v)} options={[{ id: 'records', label: 'As in employee records' }, { id: 'custom', label: 'Custom' }]} />
              <h4>{customBank ? 'Bank Details (Custom)' : 'Bank Details (From Employee Records)'}</h4>
              <Fields cols={[['account', 'Bank Account Number', 'Enter account number'], ['holder', 'Account Holder Name', 'Enter name as on bank account'], ['name', 'Bank Name', 'Enter bank name'], ['routing', 'ABA routing Number', 'Enter 9-digit routing number']]}
                values={customBank ? a.bank : employee.bank} disabled={!customBank} onChange={(k, v) => set('bank', { ...a.bank, [k]: v })} />
              <Segmented label="Account type" value={(customBank ? a.bank : employee.bank).type} disabled={!customBank}
                onChange={(v) => set('bank', { ...a.bank, type: v })} options={[{ id: 'savings', label: 'Savings' }, { id: 'checking', label: 'Checking' }]} />
            </>}
            <Segmented label="Source details" value={a.srcMode} onChange={(v) => set('srcMode', v)} options={[{ id: 'prorata', label: 'Pro-Rata' }, { id: 'choose', label: 'Allow me to choose' }]} />
            <SourceDetails a={a} c={c} available={available} setPick={(k, v) => set('picks', { ...a.picks, [k]: v })} />
          </section>
        </div>
      </aside>
    </div>
  )
}

function Fields({ cols, values, disabled, lock = [], onChange }) {
  return (
    <div className="grid2">
      {cols.map(([k, label, ph]) => (
        <div className="field" key={k}>
          <label className="lbl" htmlFor={`f-${k}`}>{label}</label>
          <input id={`f-${k}`} className="txt" value={values[k] ?? ''} placeholder={ph} disabled={disabled || lock.includes(k)} onChange={(e) => onChange(k, e.target.value)} />
        </div>
      ))}
    </div>
  )
}

// Pro-Rata splits the allocation evenly across investments; "Allow me to choose" lets the admin type each amount
function SourceDetails({ a, c, available, setPick }) {
  const [open, setOpen] = useState(true)
  const inv = slideSource.investments
  const keep = c.gross > 0 ? c.net / c.gross : 0
  const gross = (k) => (a.srcMode === 'prorata' ? c.gross / inv.length : num(a.picks[k]))
  const total = inv.reduce((t, k) => t + gross(k), 0)
  return (
    <>
      <div className="srcd">
        <div className="srcd-head">
          <button type="button" className="icon-btn" aria-expanded={open} aria-label={open ? 'Collapse investments' : 'Expand investments'} onClick={() => setOpen(!open)}>
            <Icon.chevron style={{ transform: open ? 'rotate(180deg)' : 'none' }} />
          </button>
          <div><span>Source name</span><b>{slideSource.name}</b></div>
          <div className="r"><span>Available amount</span><b>{money(available)}</b></div>
          <div className="c"><span>Gross Withdrawal</span><div className="num dis mini"><span className="cap">$</span><input value={fmt2(total)} disabled readOnly /></div></div>
          <div className="r"><span>Net Withdrawal</span><b>{money(total * keep)}</b></div>
        </div>
        {open && <>
          <div className="srcd-sub">{String(inv.length).padStart(2, '0')} - Investments</div>
          <table className="srcd-t">
            <thead><tr><th>Investment Name</th><th className="r">Available amount</th><th className="c">Gross Withdrawal</th><th className="r">Net Withdrawal</th></tr></thead>
            <tbody>
              {inv.map((k) => (
                <tr key={k}>
                  <td><b>{k}</b></td>
                  <td className="r"><b>{money(available / inv.length)}</b></td>
                  <td className="c"><div className={`num mini ${a.srcMode === 'prorata' ? 'dis' : ''}`}><span className="cap">$</span>
                    <input aria-label={`${k} gross withdrawal`} value={a.srcMode === 'prorata' ? fmt2(gross(k)) : a.picks[k] ?? ''} placeholder="0.00" disabled={a.srcMode === 'prorata'}
                      onChange={(e) => setPick(k, e.target.value.replace(/[^0-9.,]/g, ''))} /></div></td>
                  <td className="r"><b>{money(gross(k) * keep)}</b></td>
                </tr>
              ))}
            </tbody>
          </table>
        </>}
      </div>
      <div className="srcd-total"><b>Net Withdrawal amount</b><b>{money(total * keep)}</b></div>
    </>
  )
}
