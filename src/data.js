// Sample data taken from the Figma "Withdrawal" file (Components section, node 5372:76978)

export const employee = {
  name: 'Kevin Thomas',
  ssn: 'AAA-GG-XXXX',
  id: '724010103',
  status: 'Active',
  company: 'Family Health of Five Ltd.',
  // Employee records used in the slide-out (Figma frames 05/09)
  address: { line1: '654 Maple street', line2: 'Unit 8 downtown', city: 'Boston', country: 'USA', state: 'Massachusetts', zip: '12108' },
  bank: { account: '50010023445112', holder: 'James Wan', name: 'Citi bank', routing: '1222767762', type: 'savings' },
}

export const plans = [
  { id: 'vanguard', label: 'Vanguard 401(k) Plan', available: 3000, vested: 3000 },
  { id: 'jpm', label: 'JPM Equity 50 Plan', available: 3000, vested: 3000 },
  { id: 'sp500', label: 'S&P 500 Plan', available: 3000, vested: 3000 },
]

export const withdrawTypes = [
  { id: 'INS', label: 'In-Service', display: 'In-Service - INS' },
  { id: 'HDS', label: 'Hardship' },
  { id: 'RMD', label: 'Required Minimum Distribution' },
  { id: 'SFS', label: 'Separation from Service' },
  { id: 'PW', label: 'Permissible Withdrawal' },
  { id: 'FO', label: 'Force out' },
  { id: 'QBAD', label: 'Qualified Birth and Adoption Distribution' },
]

export const distributionModes = [
  { id: 'self', label: 'Distribution to self' },
  { id: 'beneficiary', label: 'Distribution to beneficiary' },
  { id: 'roth', label: 'Rollover to Roth IRA' },
  { id: 'trad', label: 'Rollover to Traditional IRA' },
  { id: 'plan', label: 'Rollover to another plan' },
]

export const codes1099 = [
  { id: '1', label: 'Code 1: Early distribution' },
  { id: '2', label: 'Code 2: Early distribution, exception applies' },
  { id: '7', label: 'Code 7: Normal distribution' },
]

export const MIN_WITHDRAW = 10
export const DEFAULT_FEE = 50
export const PAYMENT_FEE = 5
export const PENALTY_RATE = 10

export const sources = [
  { name: 'Vanguard Institutional Nasdaq 500 employee Pre-tax deferral', share: 0.5, investments: ['SEAS001', 'KEIFER', 'INVST072', 'VTSAX', 'FXAIX'] },
  { name: 'Employee Pre-tax deferral', share: 0.5, investments: ['SEAS001', 'KEIFER', 'INVST072', 'VTSAX', 'FXAIX', 'BNDX', 'VBTLX', 'VTIAX'] },
]

export const history = [
  { at: 'Jan 7, 2025 at 10:00', title: 'Loan request submitted', by: 'Jack Dawson', role: 'Admin' },
  { at: 'Jan 8, 2025 at 13:00', title: 'Loan request Approved', by: 'Jack Dawson', role: 'Sponsor' },
  { at: 'Jan 8, 2025 at 13:00', title: 'Loan request Approved', by: 'Jack Dawson', role: 'Super user' },
  { at: 'Jan 8, 2025 at 13:00', title: 'Awaiting trade', by: 'System generatred' },
  { at: 'Jan 8, 2025 at 13:00', title: 'Completed', by: 'Aris states' },
]

export const money = (n) => `${n < 0 ? '-' : ''}$${Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
export const num = (v) => parseFloat(String(v ?? '').replace(/,/g, '')) || 0
export const fmt2 = (n) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

// Amounts for one allocation
export function calc(a) {
  const gross = num(a.amount)
  const fed = (gross * num(a.fed)) / 100
  const state = (gross * num(a.state)) / 100
  const pen = a.penalty === 'yes' ? (gross * PENALTY_RATE) / 100 : 0
  // Check/EFT fee is deducted from the account balance, not from this allocation (Figma hint)
  const fee = PAYMENT_FEE
  return { gross, fed, state, pen, fee, net: Math.max(0, gross - fed - state - pen) }
}

// Uploaded documents shown on the summary (Figma sample files)
export const sampleDocs = [
  { name: 'Spouse.pdf', size: 189 * 1024 },
  { name: 'Distribution election form.pdf', size: 189 * 1024 },
  { name: 'W-4R holding with election.pdf', size: 189 * 1024 },
]

export const fmtAddress = (a) => [a.line1, a.line2, a.city, a.state, a.zip].filter(Boolean).join(', ')

// Source details in the slide-out (Figma frame 09)
export const slideSource = { name: 'NLG 403(k) Plan', investments: ['KEIFER', 'SEAS001', 'INVST072'] }
