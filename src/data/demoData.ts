import type { ClientProfile, QuarterlyBalances } from "../types";

// ─── Client 1: Andrew & Rebecca Walker ───────────────────────────────────────
export const demoClient: ClientProfile = {
  id: "client-demo-aw",
  primaryName: "Andrew Walker",
  spouseName: "Rebecca Walker",
  primaryDob: "1984-05-11",
  spouseDob: "1986-09-02",
  primarySsnLast4: "4421",
  spouseSsnLast4: "8013",
  monthlyInflow: 15000,
  monthlyExpense: 11000,
  insuranceDeductibles: 18000,
  trustAddress: "125 Peachtree Ave, Atlanta, GA",
  retirementAccounts: [
    { id: "ret-aw-c1-ira",  owner: "client1", label: "IRA",      last4: "1102" },
    { id: "ret-aw-c1-roth", owner: "client1", label: "Roth IRA", last4: "8764" },
    { id: "ret-aw-c2-401k", owner: "client2", label: "401K",     last4: "2190" },
  ],
  nonRetirementAccounts: [
    { id: "nonret-aw-brokerage", label: "Brokerage", last4: "0021" },
    { id: "nonret-aw-joint",     label: "Joint",     last4: "4047" },
  ],
  liabilities: [
    { id: "liab-aw-mortgage", label: "Mortgage",  interestRate: 4.5 },
    { id: "liab-aw-auto",     label: "Auto Loan", interestRate: 6.1 },
  ],
  createdAt: "2026-01-15T10:00:00.000Z",
  updatedAt: "2026-01-15T10:00:00.000Z",
};

export const demoReportQ1: QuarterlyBalances = {
  id: "client-demo-aw-2026-Q1",
  clientId: "client-demo-aw",
  year: 2026,
  quarter: "Q1",
  privateReserveBalance: 95000,
  trustValue: 450000,
  retirementBalances: {
    "ret-aw-c1-ira":  110000,
    "ret-aw-c1-roth":  85000,
    "ret-aw-c2-401k": 212000,
  },
  nonRetirementBalances: {
    "nonret-aw-brokerage": 50000,
    "nonret-aw-joint":     42000,
  },
  liabilityBalances: {
    "liab-aw-mortgage": 200000,
    "liab-aw-auto":      18000,
  },
  updatedAt: "2026-04-02T10:00:00.000Z",
};

// ─── Client 2: Marcus & Diane Chen ───────────────────────────────────────────
export const demoChenClient: ClientProfile = {
  id: "client-demo-mc",
  primaryName: "Marcus Chen",
  spouseName: "Diane Chen",
  primaryDob: "1972-03-28",
  spouseDob: "1974-11-14",
  primarySsnLast4: "7730",
  spouseSsnLast4: "3318",
  monthlyInflow: 22000,
  monthlyExpense: 14500,
  insuranceDeductibles: 24000,
  trustAddress: "88 Willow Creek Dr, Austin, TX",
  retirementAccounts: [
    { id: "ret-mc-c1-401k", owner: "client1", label: "401K",     last4: "5502" },
    { id: "ret-mc-c1-roth", owner: "client1", label: "Roth IRA", last4: "3391" },
    { id: "ret-mc-c2-ira",  owner: "client2", label: "IRA",      last4: "7744" },
    { id: "ret-mc-c2-401k", owner: "client2", label: "401K",     last4: "9920" },
  ],
  nonRetirementAccounts: [
    { id: "nonret-mc-brokerage", label: "Brokerage", last4: "1188" },
    { id: "nonret-mc-joint",     label: "Joint",     last4: "6672" },
    { id: "nonret-mc-savings",   label: "Savings",   last4: "4430" },
  ],
  liabilities: [
    { id: "liab-mc-mortgage",   label: "Mortgage",    interestRate: 3.75 },
    { id: "liab-mc-creditline", label: "Credit Line", interestRate: 7.5  },
  ],
  createdAt: "2026-02-01T09:00:00.000Z",
  updatedAt: "2026-02-01T09:00:00.000Z",
};

export const demoChenReportQ1: QuarterlyBalances = {
  id: "client-demo-mc-2026-Q1",
  clientId: "client-demo-mc",
  year: 2026,
  quarter: "Q1",
  privateReserveBalance: 138000,
  trustValue: 720000,
  retirementBalances: {
    "ret-mc-c1-401k": 385000,
    "ret-mc-c1-roth":  92000,
    "ret-mc-c2-ira":  145000,
    "ret-mc-c2-401k": 278000,
  },
  nonRetirementBalances: {
    "nonret-mc-brokerage": 95000,
    "nonret-mc-joint":     64000,
    "nonret-mc-savings":   31000,
  },
  liabilityBalances: {
    "liab-mc-mortgage":   310000,
    "liab-mc-creditline":  22000,
  },
  updatedAt: "2026-04-05T09:00:00.000Z",
};

// ─── Client 3: Patricia Okafor (solo, near retirement) ───────────────────────
export const demoOkaforClient: ClientProfile = {
  id: "client-demo-po",
  primaryName: "Patricia Okafor",
  spouseName: "",
  primaryDob: "1963-07-19",
  spouseDob: "",
  primarySsnLast4: "5590",
  spouseSsnLast4: "",
  monthlyInflow: 18500,
  monthlyExpense: 9800,
  insuranceDeductibles: 12000,
  trustAddress: "42 Magnolia Blvd, Charlotte, NC",
  retirementAccounts: [
    { id: "ret-po-c1-ira",     owner: "client1", label: "IRA",      last4: "2244" },
    { id: "ret-po-c1-roth",    owner: "client1", label: "Roth IRA", last4: "8801" },
    { id: "ret-po-c1-pension", owner: "client1", label: "Pension",  last4: "0099" },
  ],
  nonRetirementAccounts: [
    { id: "nonret-po-brokerage", label: "Brokerage", last4: "3377" },
  ],
  liabilities: [
    { id: "liab-po-mortgage", label: "Mortgage", interestRate: 5.25 },
  ],
  createdAt: "2026-02-14T08:00:00.000Z",
  updatedAt: "2026-02-14T08:00:00.000Z",
};

export const demoOkaforReportQ1: QuarterlyBalances = {
  id: "client-demo-po-2026-Q1",
  clientId: "client-demo-po",
  year: 2026,
  quarter: "Q1",
  privateReserveBalance: 206000,
  trustValue: 540000,
  retirementBalances: {
    "ret-po-c1-ira":     320000,
    "ret-po-c1-roth":    115000,
    "ret-po-c1-pension": 480000,
  },
  nonRetirementBalances: {
    "nonret-po-brokerage": 88000,
  },
  liabilityBalances: {
    "liab-po-mortgage": 95000,
  },
  updatedAt: "2026-04-08T08:00:00.000Z",
};

// ─── Client 4: James & Sofia Reyes (younger, early accumulation) ─────────────
export const demoReyesClient: ClientProfile = {
  id: "client-demo-jr",
  primaryName: "James Reyes",
  spouseName: "Sofia Reyes",
  primaryDob: "1991-09-04",
  spouseDob: "1993-04-22",
  primarySsnLast4: "1167",
  spouseSsnLast4: "4482",
  monthlyInflow: 9500,
  monthlyExpense: 7200,
  insuranceDeductibles: 8000,
  trustAddress: "",
  retirementAccounts: [
    { id: "ret-jr-c1-401k", owner: "client1", label: "401K",     last4: "6631" },
    { id: "ret-jr-c2-roth", owner: "client2", label: "Roth IRA", last4: "9905" },
  ],
  nonRetirementAccounts: [
    { id: "nonret-jr-savings", label: "Savings", last4: "7723" },
  ],
  liabilities: [
    { id: "liab-jr-mortgage", label: "Mortgage",      interestRate: 6.875 },
    { id: "liab-jr-auto",     label: "Auto Loan",     interestRate: 5.9   },
    { id: "liab-jr-personal", label: "Personal Loan", interestRate: 9.25  },
  ],
  createdAt: "2026-03-01T11:00:00.000Z",
  updatedAt: "2026-03-01T11:00:00.000Z",
};

export const demoReyesReportQ1: QuarterlyBalances = {
  id: "client-demo-jr-2026-Q1",
  clientId: "client-demo-jr",
  year: 2026,
  quarter: "Q1",
  privateReserveBalance: 18500,
  trustValue: 0,
  retirementBalances: {
    "ret-jr-c1-401k": 42000,
    "ret-jr-c2-roth": 28000,
  },
  nonRetirementBalances: {
    "nonret-jr-savings": 14000,
  },
  liabilityBalances: {
    "liab-jr-mortgage": 375000,
    "liab-jr-auto":      21000,
    "liab-jr-personal":   8500,
  },
  updatedAt: "2026-04-10T11:00:00.000Z",
};

// ─── Client 5: Robert & Carol Finley (retired, drawdown phase) ───────────────
export const demoFinleyClient: ClientProfile = {
  id: "client-demo-rf",
  primaryName: "Robert Finley",
  spouseName: "Carol Finley",
  primaryDob: "1957-01-30",
  spouseDob: "1959-06-12",
  primarySsnLast4: "3344",
  spouseSsnLast4: "6611",
  monthlyInflow: 11200,
  monthlyExpense: 8400,
  insuranceDeductibles: 15000,
  trustAddress: "770 Harbor View Ln, Naples, FL",
  retirementAccounts: [
    { id: "ret-rf-c1-ira",     owner: "client1", label: "IRA",     last4: "2255" },
    { id: "ret-rf-c1-pension", owner: "client1", label: "Pension", last4: "8834" },
    { id: "ret-rf-c2-ira",     owner: "client2", label: "IRA",     last4: "7761" },
  ],
  nonRetirementAccounts: [
    { id: "nonret-rf-brokerage", label: "Brokerage", last4: "1199" },
    { id: "nonret-rf-joint",     label: "Joint",     last4: "4453" },
  ],
  liabilities: [
    { id: "liab-rf-creditline", label: "Credit Line", interestRate: 6.5 },
  ],
  createdAt: "2026-03-10T14:00:00.000Z",
  updatedAt: "2026-03-10T14:00:00.000Z",
};

export const demoFinleyReportQ1: QuarterlyBalances = {
  id: "client-demo-rf-2026-Q1",
  clientId: "client-demo-rf",
  year: 2026,
  quarter: "Q1",
  privateReserveBalance: 175000,
  trustValue: 980000,
  retirementBalances: {
    "ret-rf-c1-ira":     620000,
    "ret-rf-c1-pension": 290000,
    "ret-rf-c2-ira":     410000,
  },
  nonRetirementBalances: {
    "nonret-rf-brokerage": 220000,
    "nonret-rf-joint":     145000,
  },
  liabilityBalances: {
    "liab-rf-creditline": 14000,
  },
  updatedAt: "2026-04-12T14:00:00.000Z",
};

// ─── Convenience arrays ───────────────────────────────────────────────────────
export const allDemoClients: ClientProfile[] = [
  demoClient,
  demoChenClient,
  demoOkaforClient,
  demoReyesClient,
  demoFinleyClient,
];

export const allDemoReports: QuarterlyBalances[] = [
  demoReportQ1,
  demoChenReportQ1,
  demoOkaforReportQ1,
  demoReyesReportQ1,
  demoFinleyReportQ1,
];
