export type Quarter = "Q1" | "Q2" | "Q3" | "Q4";
export type Section = "dashboard" | "client-profile" | "quarterly-entry" | "report-preview" | "report-history";

export type RetirementAccountType = "IRA" | "Roth IRA" | "401K" | "Pension";
export type NonRetirementType = "Brokerage" | "Joint" | "Savings";
export type LiabilityType = "Mortgage" | "Auto Loan" | "Personal Loan" | "Credit Line";

export interface RetirementAccount {
  id: string;
  owner: "client1" | "client2";
  label: RetirementAccountType;
  last4: string;
}

export interface NonRetirementAccount {
  id: string;
  label: NonRetirementType;
  last4: string;
}

export interface Liability {
  id: string;
  label: LiabilityType;
  interestRate: number;
}

export interface ClientProfile {
  id: string;
  primaryName: string;
  spouseName: string;
  primaryDob: string;
  spouseDob: string;
  primarySsnLast4: string;
  spouseSsnLast4: string;
  monthlyInflow: number;
  monthlyExpense: number;
  insuranceDeductibles: number;
  trustAddress: string;
  retirementAccounts: RetirementAccount[];
  nonRetirementAccounts: NonRetirementAccount[];
  liabilities: Liability[];
  createdAt: string;
  updatedAt: string;
}

export interface QuarterlyBalances {
  id: string;
  clientId: string;
  year: number;
  quarter: Quarter;
  privateReserveBalance: number;
  trustValue: number;
  retirementBalances: Record<string, number>;
  nonRetirementBalances: Record<string, number>;
  liabilityBalances: Record<string, number>;
  updatedAt: string;
}

export interface CalculationResult {
  excessToPrivateReserve: number;
  privateReserveTarget: number;
  client1RetirementTotal: number;
  client2RetirementTotal: number;
  nonRetirementTotal: number;
  trustTotal: number;
  liabilitiesTotal: number;
  liabilitiesAnnualInterest: number;
  liabilitiesProjectedTotal: number;
  netWorth: number;
}

export interface MissingFieldIssue {
  field: string;
  label: string;
}
