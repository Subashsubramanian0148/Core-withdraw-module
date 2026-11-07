// Mock data taken from Figma: Withdrawal › Distribution flow › In-Service row (4402:46865)

export const employee = {
  name: 'Kevin Thomas',
  initials: 'KT',
  ssn: 'AAA-GG-XXXX',
  id: '724010103',
  status: 'Active',
  company: 'Family Health of Five Ltd.',
  email: 'kevin.thomas@email.com',
  phone: '(415) 555-0142',
  address: { line1: '2450 Mission Street', line2: 'Apt 4B', city: 'San Francisco', state: 'CA', zip: '94110' },
}

export const plans = [
  { id: 'vanguard', planId: 'VAN401K', name: 'Vanguard 401(k) Plan', label: 'Vanguard 401(k) Plan', available: 3000, vested: 3000, allowChoose: true },
  { id: 'jpm', planId: 'JPM050', name: 'JPM Equity 50 Plan', label: 'JPM Equity 50 Plan', available: 9000, vested: 4986, allowChoose: false },
  { id: 'sp500', planId: 'SP500', name: 'S&P 500 Plan', label: 'S&P 500 Plan', available: 0, vested: 0 },
]

// Only In-Service is built in this prototype; the rest are listed as in Figma.
export const withdrawTypes = [
  { id: 'INS', label: 'In-Service', display: 'In-Service - INS', enabled: true },
  { id: 'HRD', label: 'Hardship' },
  { id: 'RMD', label: 'Required Minimum Distribution', display: 'Required Minimum Distribution - RMD', enabled: true },
  { id: 'SEP', label: 'Separation from Service', display: 'Separation from Service - SFS', enabled: true },
  { id: 'PRM', label: 'Permissible Withdrawal' },
  { id: 'FRC', label: 'Force out' },
  { id: 'QBA', label: 'Qualified Birth and Adoption Distribution' },
]

// Source split of the available balance (Figma: pre-tax $1,200 · Roth $900 on $3,000)
export const SOURCE_SPLIT = { pretax: 0.4, roth: 0.3 }
// Balance per mode: Roth IRA excludes pre-tax money, Traditional IRA excludes Roth money
export const distributionModes = [
  { id: 'self', label: 'Distribution to self', ratio: 1 },
  { id: 'beneficiary', label: 'Distribution to beneficiary', ratio: 1 },
  { id: 'roth', label: 'Rollover to Roth IRA', ratio: 1 - SOURCE_SPLIT.pretax, excludes: 'pretax' },
  { id: 'trad', label: 'Rollover to Traditional IRA', ratio: 1 - SOURCE_SPLIT.roth, excludes: 'roth' },
  { id: 'plan', label: 'Rollover to another plan', ratio: 1 },
]
export const modeBalanceNote = (m, available) => m.excludes
  ? `Account balance ${'$'}${available.toLocaleString('en-US', { minimumFractionDigits: 2 })} minus ${m.excludes === 'pretax' ? 'pre-tax' : 'Roth'} source balance ${'$'}${(available * SOURCE_SPLIT[m.excludes]).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
  : 'Full account balance'

export const codes1099 = [
  { id: '1', label: 'Code 1: Early distribution' },
  { id: '2', label: 'Code 2: Early dist., exception' },
  { id: '7', label: 'Code 7: Normal distribution' },
  { id: 'G', label: 'Code G: Direct rollover' },
  { id: 'H', label: 'Code H: Roth IRA rollover' },
]

// Investments for "Source details → Allow me to choose" (share of available balance)
// Example investments (sample data) — shares add up to 1
export const investments = [
  { id: 'KEIFER', name: 'KEIFER', share: 0.3 },
  { id: 'SEAS001', name: 'SEAS001', share: 0.2 },
  { id: 'INVST072', name: 'INVST072', share: 0.15 },
  { id: 'VTSAX', name: 'VTSAX', share: 0.15 },
  { id: 'FXAIX', name: 'FXAIX', share: 0.1 },
  { id: 'BNDX', name: 'BNDX', share: 0.1 },
]

// In-Service Rollover (Figma row 2): modes that roll money over instead of paying the participant
export const ROLLOVER_MODES = ['roth', 'trad', 'plan']
// Prefilled from the participant's rollover details on file (last used 03/2025)
export const rolloverOnFile = {
  roth: { plan: 'Fidelity Roth IRA', type: 'roth', account: 'RIRA-55120934', trustee: 'Fidelity Management Trust', roth: 'H', nonRoth: 'G' },
  trad: { plan: 'Fidelity Traditional IRA', type: 'traditional', account: 'IRA-88204517', trustee: 'Fidelity Management Trust', roth: 'G', nonRoth: 'G' },
  plan: { plan: 'Fidelity 401(k) Plan', type: 'traditional', account: 'PLN-30917745', trustee: 'Fidelity Management Trust', roth: 'G', nonRoth: 'G' },
}

// Money sources for "Allow me to choose → Source" (share of available balance)
export const moneySources = [
  { id: 'SRC_EE', name: 'Employee Pre-tax Deferral', share: 1 },
]

// Early penalty flow (Figma row 3)
export const PENALTY_RATE = 10
export const PENALTY_FREE_AGE = 59.5 // early withdrawal penalty applies below this age
export const waiveReasons = [
  { id: 'death', label: 'To a beneficiary on or after the death of the participant' },
  { id: 'disability', label: 'Total and permanent disability of the participant' },
  { id: 'sep55', label: 'Separation from service in or after the year of age 55' },
  { id: 'medical', label: 'Unreimbursed medical expenses above 7.5% of AGI' },
  { id: 'sepp', label: 'Series of substantially equal periodic payments' },
  { id: 'qdro', label: 'Paid to an alternate payee under a QDRO' },
  { id: 'birth', label: 'Qualified birth or adoption distribution' },
  { id: 'levy', label: 'IRS levy on the plan' },
]

export const ETF_FEE = 5
export const DEFAULT_FEE = 50
export const MAX_FILE_MB = 2

// Periodic payment flow (Figma: Periodic — Specific dollar / Specific tenure / Annuitization)
export const periodicKinds = [
  { id: 'dollar', label: 'Specific Dollar' },
  { id: 'tenure', label: 'Specific Tenure' },
  { id: 'annuity', label: 'Annuitization' },
  { id: 'amort', label: 'Amortization', disabled: true, reason: 'Not available yet' },
]
export const frequencies = [
  { id: 'monthly', label: 'Monthly', perYear: 12, unit: 'monthly' },
  { id: 'quarterly', label: 'Quarterly', perYear: 4, unit: 'quarterly' },
  { id: 'semi', label: 'Semi-annually', perYear: 2, unit: 'semi-annual' },
  { id: 'annual', label: 'Annually', perYear: 1, unit: 'annual' },
]
export const tenureOptions = [
  { id: 'life', label: 'My life expectancy' }, { id: 'other', label: 'Other' },
]
export const FIXED_PAY_DAY = '1st of every period' // plan's fixed installment date
// Annuitization reads these from the participant record (Figma values)
export const annuitant = { lifeExpectancy: 10.2, age: 80, dob: '15/01/1946', interest: '4.00' }

// Plan Config › Distributions › Required documents (Figma F08 · S1)
export const requiredDocs = [
  { id: 'spousal', name: 'Spousal consent', types: ['INS', 'SEP'], required: true },
  { id: 'election', name: 'Distribution election form', types: 'all', required: true },
  { id: 'w4r', name: 'W-4R withholding election', types: ['INS', 'RMD'], required: false },
]

// Participant profiles used by the scenarios (Figma: Active · 52 / Terminated · 80)
export const persons = {
  active: { age: 52, status: 'Active' },
  retired: { age: 80, status: 'Terminated' },
}

// Required Minimum Distribution (Figma row: RMD)
export const RMD_YEAR = 2026
export const RMD_AGE = 73
export const IRS_FACTOR = 20.2 // Uniform Lifetime Table factor at age 80
export const rmdMinimum = (priorBalance) => Math.round((priorBalance / IRS_FACTOR) * 100) / 100
