import type { ClientProfile, QuarterlyBalances } from "../types";

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
    { id: "ret-c1-ira", owner: "client1", label: "IRA", last4: "1102" },
    { id: "ret-c1-roth", owner: "client1", label: "Roth IRA", last4: "8764" },
    { id: "ret-c2-401k", owner: "client2", label: "401K", last4: "2190" },
  ],
  nonRetirementAccounts: [
    { id: "nonret-brokerage", label: "Brokerage", last4: "0021" },
    { id: "nonret-joint", label: "Joint", last4: "4047" },
  ],
  liabilities: [
    { id: "liab-mortgage", label: "Mortgage", interestRate: 4.5 },
    { id: "liab-auto", label: "Auto Loan", interestRate: 6.1 },
  ],
  createdAt: "2026-05-01T10:00:00.000Z",
  updatedAt: "2026-05-01T10:00:00.000Z",
};

export const demoReportQ1: QuarterlyBalances = {
  id: "client-demo-aw-2026-Q1",
  clientId: "client-demo-aw",
  year: 2026,
  quarter: "Q1",
  privateReserveBalance: 95000,
  trustValue: 450000,
  retirementBalances: {
    "ret-c1-ira": 11000,
    "ret-c1-roth": 15000,
    "ret-c2-401k": 21000,
  },
  nonRetirementBalances: {
    "nonret-brokerage": 50000,
    "nonret-joint": 42000,
  },
  liabilityBalances: {
    "liab-mortgage": 200000,
    "liab-auto": 18000,
  },
  updatedAt: "2026-05-01T10:00:00.000Z",
};
