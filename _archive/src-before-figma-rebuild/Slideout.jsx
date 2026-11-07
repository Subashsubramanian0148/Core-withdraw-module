import React, { useState } from 'react'
import { codes1099, distributionModes, investments, moneySources, waiveReasons, PENALTY_RATE, employee, ETF_FEE, ROLLOVER_MODES, rolloverOnFile, modeBalanceNote } from './data.js'
import { Icon, Select, Segmented, NumInput, TextInput, money, num, fmt2, useTrap } from './ui.jsx'

const bankRecord = { institution: 'JP Morgan Chase', holder: employee.name, type: 'checking', account: '••••••4521', routing: '021000021', email: employee.email, phone: employee.phone }

export const emptyAllocation = {
  mode: '', amount: '', roth: '', nonRoth: '',
  fed: '', state: '', waive: 'no', penalty: '10.00', waiveReason: '', waivePct: '',
  payment: 'etf', bank: 'records', addr: 'records',
  address: { line1: '', line2: '', city: '', state: '', zip: '' },
  custom: { institution: '', holder: employee.name, type: 'checking', account: '', routing: '', email: employee.email, phone: employee.phone },
  source: 'prorata', chooseBy: 'source', sources: {},
  rollover: { plan: '', type: 'traditional', account: '', trustee: '', delivery: 'check' },
}

export const isRollover = (a) => ROLLOVER_MODES.includes(a.mode)

// Shared maths so the slide-over and the summary table never disagree
export function calc(a) {
  const gross = num(a.amount)
  const fedAmt = (gross * num(a.fed)) / 100
  const stateAmt = (gross * num(a.state)) / 100
  const ro = isRollover(a)
  // Waive = Yes keeps a reduced penalty at the waive-off percentage (Figma: 10% → 2%)
  // RMD (age 73+) carries no early withdrawal penalty
  const penAmt = ro || a.noPen ? 0 : (gross * (a.waive === 'yes' ? 0 : PENALTY_RATE)) / 100
  const fullPen = ro || a.noPen ? 0 : (gross * PENALTY_RATE) / 100
  const fee = ro ? 0 : ETF_FEE // EFT fee or Check fee, $5 each (Figma)
  return { gross, fedAmt, stateAmt, penAmt, fullPen, fee, net: Math.max(0, gross - fedAmt - stateAmt - penAmt - fee) }
}

export default function Slideout({ initial, plan, othersTotal, onCancel, onSave, isEdit, cap, hideSource, rmd, noPenalty }) {
  const [a, setA] = useState(() => structuredClone(initial || (rmd || noPenalty ? { ...emptyAllocation, noPen: true, roth: '7', nonRoth: '7', penalty: '' } : emptyAllocation)))
  const [touched, setTouched] = useState(!!initial?.mode)
  const set = (k, v) => { setA((p) => ({ ...p, [k]: v })); setTouched(true) }
  const setC = (k, v) => setA((p) => ({ ...p, custom: { ...p.custom, [k]: v } }))
  const setAd = (k, v) => setA((p) => ({ ...p, address: { ...p.address, [k]: v } }))
  const setR = (k, v) => setA((p) => ({ ...p, rollover: { ...p.rollover, [k]: v } }))
  // Picking a rollover mode prefills codes, 0% tax and the rollover details on file
  const pickMode = (id) => {
    const f = rolloverOnFile[id]
    setTouched(true)
    setA((p) => f
      ? { ...p, mode: id, roth: f.roth, nonRoth: f.nonRoth, fed: '0.00', state: '0.00', rollover: { ...p.rollover, plan: f.plan, type: f.type, account: f.account, trustee: f.trustee } }
      : { ...p, mode: id, ...(isRollover(p) ? { roth: '', nonRoth: '', fed: '', state: '' } : {}) })
  }
  const ref = useTrap(true, onCancel)

  const mode = distributionModes.find((m) => m.id === a.mode)
  // cap: periodic payments allocate the periodic total amount
  const remaining = Math.max(0, (cap ?? plan.available) - othersTotal)
  const max = mode ? Math.min(remaining, plan.available * mode.ratio) : 0
  const c = calc(a)
  const ro = isRollover(a)
  const word = ro ? 'rollover' : 'withdrawal'

  // ---------- validation ----------
  const err = {}
  if (a.mode && c.gross > max) err.amount = `Maximum amount available for ${word} ${money(max)}`
  if (a.mode && max === 0) err.amount = `No balance left to allocate. Maximum amount available for ${word} ${money(0)}`
  ;['fed', 'state', 'penalty'].forEach((k) => { if (num(a[k]) > 100) err[k] = 'Enter a rate between 0 and 100%.' })
  if (c.gross > 0 && c.net <= 0 && !err.amount) err.net = 'Deductions are more than the allocation amount. Lower the tax or penalty rates.'

  if (ro) {
    if (a.rollover.account && !/^[A-Za-z0-9-]{5,20}$/.test(a.rollover.account)) err.rAccount = 'Account / IRA no must be 5 to 20 letters, numbers or dashes.'
  }
  if (!ro && a.waive === 'yes' && num(a.waivePct) >= PENALTY_RATE) err.waivePct = `Waive off percentage must be below the ${PENALTY_RATE}% penalty. Choose No to apply the full penalty.`
  const etf = !ro && a.payment === 'etf'
  const custom = etf && a.bank === 'custom'
  if (custom) {
    const cc = a.custom
    if (cc.routing && !/^\d{9}$/.test(cc.routing)) err.routing = 'ABA routing number must be 9 digits.'
    if (cc.account && !/^\d{4,17}$/.test(cc.account)) err.account = 'Account number must be 4 to 17 digits.'
  }

  const check = !ro && a.payment === 'check'
  const customAddr = check && a.addr === 'custom'
  if (customAddr) {
    const ad = a.address
    if (ad.zip && !/^\d{5}(-\d{4})?$/.test(ad.zip)) err.zip = 'Enter 5 digits'
    if (ad.state && !/^[A-Za-z]{2}$/.test(ad.state)) err.adState = 'Use 2 letters'
  }

  const src = sourceModel(a, plan, c.gross)
  if (!hideSource) Object.assign(err, src.err)

  const required = a.mode && c.gross > 0 && a.roth && a.nonRoth && 
    (!ro || (a.rollover.plan && a.rollover.account && a.rollover.trustee)) &&
    (!customAddr || (a.address.line1 && a.address.city && a.address.state && a.address.zip)) &&
    (!custom || (a.custom.institution && a.custom.holder && a.custom.account && a.custom.routing))
  const canSave = required && Object.keys(err).length === 0

  const missing = !a.mode ? 'Select the distribution mode' : c.gross <= 0 ? 'Enter the allocation amount'
    : !a.roth || !a.nonRoth ? 'Select both 1099 codes' : ro && !required ? 'Fill in the rollover information' : custom && !required ? 'Fill in the custom bank details' : customAddr && !required ? 'Fill in the custom mailing address' : ''


  return (
    <div className="scrim" onMouseDown={(e) => e.target === e.currentTarget && onCancel()}>
      <aside className="slide" role="dialog" aria-modal="true" aria-labelledby="stitle" ref={ref}>
        <header className="slide-head">
          <h2 id="stitle">{isEdit ? 'Edit Withdrawal Allocation' : 'Add Withdrawal Allocation'}</h2>
          <div className="actions">
            <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
            <button className="btn btn-primary" disabled={!canSave} onClick={() => onSave(a)}
              title={!canSave && touched ? missing : undefined}>Save</button>
          </div>
        </header>

        <div className="slide-body">
          <div className="slide-form">
          <section>
            <h3>Distribution</h3>
            <Select id="mode" label="Select distribution mode" placeholder="Select the distribution mode" value={a.mode}
              options={rmd ? distributionModes.map((m) => ROLLOVER_MODES.includes(m.id) ? { ...m, disabled: true, reason: 'RMD amounts can’t be rolled over' } : m) : distributionModes} onChange={pickMode}
              renderSub={(o) => `Balance : ${money(plan.available * o.ratio)}${o.excludes ? ` · excludes ${o.excludes === 'pretax' ? 'pre-tax' : 'Roth'} ${money(plan.available * (1 - o.ratio))}` : ''}`} />
            <NumInput id="amt" label="Allocation amount" prefix="$" value={a.amount} onChange={(v) => set('amount', v)}
              error={err.amount} hint={`Maximum amount available for ${word} ${money(max)}${mode?.excludes ? ` (${modeBalanceNote(mode, plan.available)})` : ''}`} disabled={!a.mode} />
          </section>

          <section>
            <h3>Tax &amp; Penalty</h3>
            <div className="row">
              <Select id="roth" label="Select Roth 1099 Code" placeholder="Select Roth 1099" value={a.roth} options={codes1099} onChange={(v) => set('roth', v)} searchable={false} />
              <Select id="nroth" label="Select Non Roth 1099 Code" placeholder="Select Non Roth 1099" value={a.nonRoth} options={codes1099} onChange={(v) => set('nonRoth', v)} searchable={false} />
            </div>
            <NumInput id="fed" label="Federal tax" tip="Percentage of the allocation amount withheld for federal income tax." suffix="%" width={120} value={a.fed} max={100} onChange={(v) => set('fed', v)} error={err.fed}
              after={<><b>{money(c.fedAmt)}</b> tax deduction</>} />
            <NumInput id="state" label="State tax" tip="Percentage of the allocation amount withheld for state income tax." suffix="%" width={120} value={a.state} max={100} onChange={(v) => set('state', v)} error={err.state}
              after={<><b>{money(c.stateAmt)}</b> tax deduction</>} />
            {!ro && !a.noPen && <>
            {/* Early withdrawal penalty: Yes = penalty applies at the entered rate; No = no penalty for this transaction */}
            <Segmented label="Early withdraw penalty" size="sm" value={a.waive === 'yes' ? 'no' : 'yes'} onChange={(v) => { setTouched(true); setA((p) => ({ ...p,
                ...(v === 'no'
                  ? { waive: 'yes', waivePct: '0.00', waiveReason: '', roth: p.roth === '1' || !p.roth ? '2' : p.roth, nonRoth: p.nonRoth === '1' || !p.nonRoth ? '2' : p.nonRoth }
                  : { waive: 'no', waivePct: '', waiveReason: '', roth: p.roth === '2' ? '1' : p.roth, nonRoth: p.nonRoth === '2' ? '1' : p.nonRoth }) })) }}
              options={[{ id: 'yes', label: 'Yes' }, { id: 'no', label: 'No' }]} />
            {c.gross > 0 && (a.waive === 'no' ? (c.penAmt > 0 && (
              <div className="as-note warn" role="status">
                <Icon.warn />
                <div><b>Early withdrawal penalty applies</b>
                  <p>{employee.name} is under 59½, so a {PENALTY_RATE}% early withdrawal penalty ({money(c.penAmt)}) will be deducted. This notice is shared with the participant and the admin.</p></div>
              </div>
            )) : (
              <div className="as-note warn" role="status">
                <Icon.warn />
                <div><b>Early withdrawal penalty does not apply</b>
                  <p>Early Withdrawal Penalty does not apply for this transaction. This notice is shared with the participant and the admin.</p></div>
              </div>
            ))}
            </>}
          </section>

          {ro ? (
          <>
          <section>
            <h3>Rollover Information</h3>
            <TextInput id="rplan" label="Plan name" value={a.rollover.plan} onChange={(v) => setR('plan', v)} />
            <div className="row">
              <TextInput id="racc" label="Account / IRA no" value={a.rollover.account} onChange={(v) => setR('account', v)} error={err.rAccount} />
              <TextInput id="rtrustee" label="Company / Trustee name" value={a.rollover.trustee} onChange={(v) => setR('trustee', v)} />
            </div>
            <p className="hint"><Icon.info /> Pre-filled from the participant’s rollover details on file (last used 03/2025) — edit if needed</p>
          </section>
          <section>
            <h3>Rollover delivery</h3>
            <Segmented label="Delivery method" value={a.rollover.delivery} onChange={(v) => setR('delivery', v)}
              options={[{ id: 'check', label: 'Check mailed to trustee' }, { id: 'wire', label: 'Wire transfer' }]} />
          </section>
          </>
          ) : (
          <section>
            <h3>Payment Method</h3>
            <Segmented label="Choose payment method" value={a.payment} onChange={(v) => set('payment', v)}
              options={[{ id: 'check', label: 'Mail check to address' }, { id: 'etf', label: 'EFT' }]} />
            {check && (() => {
              const r = customAddr ? a.address : employee.address
              const lock = !customAddr
              return (
                <>
                  <NumInput id="chkfee" label="Check Fee" prefix="$" width={120} value={fmt2(ETF_FEE)} onChange={() => {}} disabled hint="Fee will be deducted from account balance" />
                  <Segmented label="Select address details" value={a.addr} onChange={(v) => set('addr', v)}
                    options={[{ id: 'records', label: 'As in employee records' }, { id: 'custom', label: 'Custom' }]} />
                  <h3>{customAddr ? 'Address details (custom)' : 'Address details (from employee records)'}</h3>
                  <div className="row">
                    <TextInput id="ad1" label="Address line 1" placeholder="Street address" value={r.line1} disabled={lock} onChange={(v) => setAd('line1', v)} />
                    <TextInput id="ad2" label="Address line 2" placeholder="Apt, suite, unit" value={r.line2} disabled={lock} onChange={(v) => setAd('line2', v)} />
                  </div>
                  <div className="row">
                    <TextInput id="adcity" label="City" value={r.city} disabled={lock} onChange={(v) => setAd('city', v)} />
                    <TextInput id="adcountry" label="Country" value={r.country ?? 'USA'} disabled onChange={() => {}} />
                  </div>
                  <div className="row">
                    <TextInput id="adstate" label="State" placeholder="CA" value={r.state} disabled={lock} onChange={(v) => setAd('state', v.toUpperCase().slice(0, 2))} error={err.adState} />
                    <TextInput id="adzip" label="Zip code" placeholder="94110" value={r.zip} disabled={lock} onChange={(v) => setAd('zip', v.replace(/[^0-9-]/g, '').slice(0, 10))} error={err.zip} />
                  </div>
                  <p className="hint"><Icon.info /> Custom address is available in the Admin portal only. Participants can only use the address in their employee records.</p>
                </>
              )
            })()}
            {etf && (
              <>
                <NumInput id="etf" label="EFT Fee" prefix="$" width={120} value={fmt2(ETF_FEE)} onChange={() => {}} disabled hint="Fee will be deducted from account balance" />
                <Segmented label="Select bank details" value={a.bank} onChange={(v) => set('bank', v)}
                  options={[{ id: 'records', label: 'As in employee records' }, { id: 'custom', label: 'Custom' }]} />
                <h3>{custom ? 'Bank details (custom)' : 'Bank details (from employee records)'}</h3>
                {(() => {
                  const r = custom ? a.custom : bankRecord
                  const ro = !custom
                  return (
                    <>
                      <div className="row">
                        <TextInput id="acc" label="Bank Account Number" placeholder="4–17 digits" value={r.account} disabled={ro} onChange={(v) => setC('account', v.replace(/\D/g, ''))} error={err.account} />
                        <TextInput id="holder" label="Account Holder Name" value={r.holder} disabled={ro} onChange={(v) => setC('holder', v)} />
                      </div>
                      <div className="row">
                        <TextInput id="inst" label="Bank Name" placeholder="e.g. Wells Fargo" value={r.institution} disabled={ro} onChange={(v) => setC('institution', v)} />
                        <TextInput id="aba" label="ABA routing Number" placeholder="9 digits" value={r.routing} disabled={ro} onChange={(v) => setC('routing', v.replace(/\D/g, '').slice(0, 9))} error={err.routing} />
                      </div>
                      <div className={ro ? 'faded' : ''}>
                        <Segmented label="Account type" value={r.type} disabled={ro} onChange={(v) => setC('type', v)}
                          options={[{ id: 'savings', label: 'Savings' }, { id: 'checking', label: 'Checking' }]} />
                      </div>
                    </>
                  )
                })()}
              </>
            )}
          </section>
          )}

          </div>
          {!hideSource && (
          <section className="src-full">
            <SourceDetails v={a} set={set} setA={setA} plan={plan} gross={c.gross} net={c.net} />
            {err.net && <p className="err" role="alert"><Icon.warn width="14" height="14" /> {err.net}</p>}
          </section>
          )}
        </div>
      </aside>
    </div>
  )
}


// Source details: shared by the allocation slide-over and the periodic payment page
export function sourceModel(v, plan, gross) {
  const choose = v.source === 'choose'
  const bySource = choose && (v.chooseBy || 'source') === 'source'
  const byInv = choose && !bySource
  const rowWord = bySource ? 'Sources' : 'Investments'
  // Each money source holds the same investment mix; source-level entry splits across its investments pro-rata
  const srcCards = moneySources.map((s) => {
    const available = plan.available * s.share
    const g = bySource ? num(v.sources[s.id])
      : byInv ? investments.reduce((t, i) => t + num(v.sources[s.id + ':' + i.id]), 0)
      : gross * s.share
    const rows = investments.map((i) => ({ ...i, key: s.id + ':' + i.id, available: available * i.share,
      gross: byInv ? num(v.sources[s.id + ':' + i.id]) : g * i.share }))
    return { ...s, available, gross: g, rows }
  })
  const srcTotal = srcCards.reduce((t, s) => t + s.gross, 0)
  const err = {}
  if (choose) {
    srcCards.forEach((s) => {
      if (bySource && s.gross > s.available) err['src_' + s.id] = `More than available ${money(s.available)}.`
      if (byInv) s.rows.forEach((r) => { if (r.gross > r.available) err['src_' + r.key] = `More than available ${money(r.available)}.` })
    })
    const diff = gross - srcTotal
    if (gross > 0 && Math.abs(diff) > 0.004)
      err.sources = diff > 0
        ? `${money(diff)} left to allocate. ${rowWord} must add up to ${money(gross)}.`
        : `Over by ${money(-diff)}. ${rowWord} must add up to ${money(gross)}.`
  }
  return { choose, bySource, byInv, rowWord, srcCards, srcTotal, err }
}

// Example investment-restriction alert (sample data: INVST072 is restricted)
export const RESTRICTED_INV = 'INVST072'
export function InvRestriction() {
  return (
    <div className="inv-warn" role="note">
      <Icon.warn width="16" height="16" />
      <div><b>Investment restriction: {RESTRICTED_INV}</b>
        <p>Withdrawals from {RESTRICTED_INV} are restricted by the plan. This part of the amount may be delayed or taken from other investments. Review before submitting.</p></div>
    </div>
  )
}

export function SourceDetails({ v, set, setA, plan, gross, net, locked }) {
  const [srcOpen, setSrcOpen] = useState({ [moneySources[0].id]: true })
  const m = sourceModel(v, plan, gross)
  const { choose, bySource, byInv, srcCards, srcTotal } = m
  const ratio = (g) => (gross > 0 ? g / gross : 0)
  return (
    <>
      <InvRestriction />
      <Segmented label="Source details" disabled={locked} value={v.source} onChange={(v) => set('source', v)}
        options={[{ id: 'prorata', label: 'Pro-Rata' }, { id: 'choose', label: 'Allow me to choose', disabled: !plan.allowChoose }]} />
      {!plan.allowChoose && !locked && <p className="hint"><Icon.info /> Allow me to choose is not enabled for {plan.name}. The amount is taken pro-rata across sources.</p>}
      {choose && (
        <Segmented label="Choose by" disabled={locked} value={v.chooseBy || 'source'} onChange={(v) => setA((p) => ({ ...p, chooseBy: v, sources: {} }))}
          options={[{ id: 'source', label: 'Source' }, { id: 'investment', label: 'Investments', disabled: true }]} />
      )}
      {choose && !locked && <p className="hint"><Icon.info /> Choosing by Investments isn’t available yet.</p>}
      {srcCards.map((s) => {
        const open = !!srcOpen[s.id]
        const toggle = () => setSrcOpen((o) => ({ ...o, [s.id]: !o[s.id] }))
        const moneyIn = (key, value, enabled, label) => (
          <div className="cell-input">
            <div className={`num gi ${enabled ? '' : 'is-disabled'} ${m.err['src_' + key] ? 'is-error' : ''}`}>
              <span className="cap">$</span>
              <input aria-label={label} inputMode="decimal" disabled={!enabled}
                value={enabled ? (v.sources[key] ?? '') : fmt2(value)} placeholder="0.00"
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => set('sources', { ...v.sources, [key]: e.target.value.replace(/[^0-9.,]/g, '') })}
                onBlur={(e) => e.target.value && set('sources', { ...v.sources, [key]: fmt2(e.target.value) })} />
            </div>
            {m.err['src_' + key] && <span className="err sm" role="alert">{m.err['src_' + key]}</span>}
          </div>
        )
        return (
          <div className="src-card" key={s.id}>
            <div className="src-head">
              <button type="button" className="src-toggle" aria-expanded={open} aria-label={`${open ? 'Collapse' : 'Expand'} ${s.name}`} onClick={toggle}>
                <Icon.chevron style={{ transform: open ? 'rotate(180deg)' : 'none' }} width="20" height="20" />
              </button>
              <div className="src-col first"><span>Source name</span><b>{plan.name}</b></div>
              <div className="src-col"><span>Available amount</span><b className="semi">{money(s.available)}</b></div>
              <div className="src-col"><span>Gross Withdrawal</span>
                {moneyIn(s.id, s.gross, bySource && !locked, `Gross withdrawal from ${s.name}`)}</div>
              <div className="src-col"><span>Net Withdrawal</span><b>{money(net * ratio(s.gross))}</b></div>
            </div>
            {open && (
              <div className="src-body">
                <div className="src-count"><b>{String(s.rows.length).padStart(2, '0')} -</b> Investments</div>
                <table className="itbl">
                  <thead><tr><th>Investment Name <Icon.sort /></th><th className="r">Available amount</th><th className="r">Gross Withdrawal</th><th className="r">Net Withdrawal</th></tr></thead>
                  <tbody>
                    {s.rows.map((r) => (
                      <tr key={r.key}>
                        <td>{r.name}</td>
                        <td className="r">{money(r.available)}</td>
                        <td className="r">{moneyIn(r.key, r.gross, byInv && !locked, `Gross withdrawal from ${r.name} in ${s.name}`)}</td>
                        <td className="r">{money(net * ratio(r.gross))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )
      })}
      {m.err.sources && <p className="err" role="alert"><Icon.warn width="14" height="14" /> {m.err.sources}</p>}
      <div className="src-foot"><b>Net Withdrawal amount</b><b>{money(choose ? net * ratio(srcTotal) : net)}</b></div>
    </>
  )
}

// Read-only source → investments tree for the summary page
export function SourceSummary({ items, plan }) {
  // First MAX_SOURCES source groups show; the rest sit behind "+N more" which expands the whole table
  const [open, setOpen] = useState(false)
  // Merge the same source across allocations into one row (investments summed by name)
  const merged = new Map()
  items.forEach((it) => sourceModel(it.v, plan, it.gross).srcCards.forEach((sc) => {
    const m = merged.get(sc.id) || { ...sc, gross: 0, rows: [] }
    m.gross += sc.gross
    sc.rows.forEach((r) => {
      const ex = m.rows.find((x) => x.name === r.name)
      if (ex) ex.gross += r.gross; else m.rows.push({ ...r, key: `${sc.id}-${r.name}` })
    })
    merged.set(sc.id, m)
  }))
  const all = [...merged.values()].map((sc) => ({ sc, key: sc.id }))
  const extra = all.length - MAX_SOURCES
  const shown = open || extra <= 0 ? all : all.slice(0, MAX_SOURCES)
  return (
    <div className="src-rows">
      {shown.map(({ sc, key }) => (
        <div className="src-row" key={key}>
          <div className="src-groups"><SourceChips sc={sc} /></div>
        </div>
      ))}
      {extra > 0 && (
        <button type="button" className="src-more" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
          {open ? 'Show less' : `+${extra} more`}
        </button>
      )}
    </div>
  )
}

const MAX_SOURCES = 3
const MAX_ROWS = 5, MAX_CHIPS = 3
const sentence = (t) => t.charAt(0) + t.slice(1).toLowerCase()
function SourceChips({ sc }) {
  const [open, setOpen] = useState(false)
  const extra = sc.rows.length - MAX_CHIPS
  const rows = open || extra <= 0 ? sc.rows : sc.rows.slice(0, MAX_CHIPS)
  return (
    <div className="src-grp">
      <div className="src-nm" title={sc.name}><span>{sc.name}</span><b>{money(sc.gross)}</b></div>
      <ul className="stree-chips">
        {rows.map((r) => <li key={r.key} className="chip" title={`${r.name} ${money(r.gross)}`}><span>{r.name}</span><b>{money(r.gross)}</b></li>)}
        {extra > 0 && <li><button type="button" className="chip chip-more" aria-expanded={open} onClick={() => setOpen((v) => !v)}>{open ? 'Show less' : `+${extra}`}</button></li>}
      </ul>
    </div>
  )
}

function SourceTree({ v, gross, title, plan }) {
  const m = sourceModel(v, plan, gross)
  const [open, setOpen] = useState(() => ({ [m.srcCards[0]?.id]: true }))
  return (
    <div className="stree">
      <div className="stree-head">
        <div><b>{title}</b></div>
        <div className="r"><b>{money(m.srcTotal)}</b></div>
      </div>
      {m.srcCards.map((s) => {
        const on = !!open[s.id]
        return (
          <div className="stree-node" key={s.id}>
            <button type="button" className="stree-src" aria-expanded={on} onClick={() => setOpen((o) => ({ ...o, [s.id]: !o[s.id] }))}>
              <span className="box" aria-hidden="true">{on ? '−' : '+'}</span>
              <span className="nm">{s.name}</span>
              <b>{money(s.gross)}</b>
            </button>
            {on && (
              <ul className="stree-chips">
                {s.rows.map((r) => <li key={r.key} className="chip"><span>{r.name}</span><b>{money(r.gross)}</b></li>)}
              </ul>
            )}
          </div>
        )
      })}
    </div>
  )
}
