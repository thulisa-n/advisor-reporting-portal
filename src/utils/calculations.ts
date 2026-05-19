import type { CalculationResult, ClientProfile, QuarterlyBalances } from "../types";

export const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export function calculateAge(dob: string): number {
  if (!dob) {
    return 0;
  }
  const birth = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const monthDiff = now.getMonth() - birth.getMonth();
  const hadBirthday = monthDiff > 0 || (monthDiff === 0 && now.getDate() >= birth.getDate());
  if (!hadBirthday) {
    age -= 1;
  }
  return age;
}

export function calculateOutputs(profile: ClientProfile, balances: QuarterlyBalances): CalculationResult {
  const client1RetirementTotal = profile.retirementAccounts
    .filter((account) => account.owner === "client1")
    .reduce((sum, account) => sum + (balances.retirementBalances[account.id] ?? 0), 0);

  const client2RetirementTotal = profile.retirementAccounts
    .filter((account) => account.owner === "client2")
    .reduce((sum, account) => sum + (balances.retirementBalances[account.id] ?? 0), 0);

  const nonRetirementTotal = profile.nonRetirementAccounts.reduce(
    (sum, account) => sum + (balances.nonRetirementBalances[account.id] ?? 0),
    0,
  );

  const liabilitiesTotal = profile.liabilities.reduce(
    (sum, liability) => sum + (balances.liabilityBalances[liability.id] ?? 0),
    0,
  );
  const liabilitiesAnnualInterest = profile.liabilities.reduce((sum, liability) => {
    const balance = balances.liabilityBalances[liability.id] ?? 0;
    return sum + balance * (liability.interestRate / 100);
  }, 0);

  const privateReserveTarget = profile.monthlyExpense * 6 + profile.insuranceDeductibles;
  const excessToPrivateReserve = profile.monthlyInflow - profile.monthlyExpense;

  // PRD rule: liabilities are not subtracted from net worth.
  const netWorth = client1RetirementTotal + client2RetirementTotal + nonRetirementTotal + balances.trustValue;

  return {
    excessToPrivateReserve,
    privateReserveTarget,
    client1RetirementTotal,
    client2RetirementTotal,
    nonRetirementTotal,
    trustTotal: balances.trustValue,
    liabilitiesTotal,
    liabilitiesAnnualInterest,
    liabilitiesProjectedTotal: liabilitiesTotal + liabilitiesAnnualInterest,
    netWorth,
  };
}
