import type { ClientProfile, MissingFieldIssue, QuarterlyBalances } from "../types";

const isEmpty = (value: string | number) => value === "" || value === 0;

export function validateProfile(profile: ClientProfile): MissingFieldIssue[] {
  const missing: MissingFieldIssue[] = [];

  if (!profile.primaryName) missing.push({ field: "primaryName", label: "Client 1 name" });
  if (!profile.primaryDob) missing.push({ field: "primaryDob", label: "Client 1 DOB" });
  if (!profile.primarySsnLast4) missing.push({ field: "primarySsnLast4", label: "Client 1 SSN last 4" });
  if (isEmpty(profile.monthlyInflow)) missing.push({ field: "monthlyInflow", label: "Monthly inflow" });
  if (isEmpty(profile.monthlyExpense)) missing.push({ field: "monthlyExpense", label: "Monthly expense budget" });
  if (isEmpty(profile.insuranceDeductibles)) {
    missing.push({ field: "insuranceDeductibles", label: "Insurance deductibles total" });
  }
  if (!profile.trustAddress) missing.push({ field: "trustAddress", label: "Trust property address" });

  if (profile.retirementAccounts.length === 0) {
    missing.push({ field: "retirementAccounts", label: "At least one retirement account" });
  }
  if (profile.nonRetirementAccounts.length === 0) {
    missing.push({ field: "nonRetirementAccounts", label: "At least one non-retirement account" });
  }

  return missing;
}

export function validateBalances(profile: ClientProfile, balances: QuarterlyBalances): MissingFieldIssue[] {
  const missing: MissingFieldIssue[] = [];

  if (!balances.privateReserveBalance) {
    missing.push({ field: "privateReserveBalance", label: "Private reserve balance" });
  }
  if (!balances.trustValue) {
    missing.push({ field: "trustValue", label: "Trust value (Zillow)" });
  }

  profile.retirementAccounts.forEach((account) => {
    if (balances.retirementBalances[account.id] === undefined) {
      missing.push({ field: account.id, label: `${account.label} balance (${account.owner})` });
    }
  });

  profile.nonRetirementAccounts.forEach((account) => {
    if (balances.nonRetirementBalances[account.id] === undefined) {
      missing.push({ field: account.id, label: `${account.label} balance` });
    }
  });

  profile.liabilities.forEach((liability) => {
    if (balances.liabilityBalances[liability.id] === undefined) {
      missing.push({ field: liability.id, label: `${liability.label} balance` });
    }
  });

  return missing;
}
