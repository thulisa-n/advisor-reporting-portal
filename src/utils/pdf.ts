import { jsPDF } from "jspdf";
import type { CalculationResult, ClientProfile, QuarterlyBalances } from "../types";
import { calculateAge, currency } from "./calculations";

function quarterLabel(input: QuarterlyBalances): string {
  return `${input.year} ${input.quarter}`;
}

export function generateSacsPdf(
  profile: ClientProfile,
  balances: QuarterlyBalances,
  calculations: CalculationResult,
): void {
  const doc = new jsPDF({ unit: "pt" });
  doc.setFontSize(16);
  doc.text(`SACS Report - ${profile.primaryName}`, 40, 48);
  doc.setFontSize(11);
  doc.text(`Period: ${quarterLabel(balances)}`, 40, 68);

  doc.setFillColor(34, 197, 94);
  doc.circle(160, 190, 65, "F");
  doc.setTextColor(255, 255, 255);
  doc.text("Inflow", 145, 182);
  doc.text(currency.format(profile.monthlyInflow), 126, 200);

  doc.setFillColor(239, 68, 68);
  doc.circle(330, 190, 65, "F");
  doc.text("Outflow", 312, 182);
  doc.text(currency.format(profile.monthlyExpense), 296, 200);

  doc.setFillColor(59, 130, 246);
  doc.circle(500, 190, 65, "F");
  doc.text("Private Reserve", 462, 182);
  doc.text(currency.format(calculations.excessToPrivateReserve), 466, 200);

  doc.setTextColor(15, 23, 42);
  doc.line(225, 190, 265, 190);
  doc.line(395, 190, 435, 190);

  doc.roundedRect(40, 300, 515, 140, 8, 8);
  doc.setFontSize(12);
  doc.text("SACS Summary", 56, 325);
  doc.setFontSize(11);
  doc.text(`Private reserve balance: ${currency.format(balances.privateReserveBalance)}`, 56, 350);
  doc.text(`Private reserve target: ${currency.format(calculations.privateReserveTarget)}`, 56, 372);
  doc.text(`Monthly excess transferred: ${currency.format(calculations.excessToPrivateReserve)}`, 56, 394);

  doc.save(`${profile.primaryName.replace(/\s+/g, "-").toLowerCase()}-sacs.pdf`);
}

export function generateTccPdf(
  profile: ClientProfile,
  balances: QuarterlyBalances,
  calculations: CalculationResult,
): void {
  const doc = new jsPDF({ unit: "pt" });
  doc.setFontSize(16);
  doc.text(`TCC Report - ${profile.primaryName}`, 40, 48);
  doc.setFontSize(11);
  doc.text(`Period: ${quarterLabel(balances)}`, 40, 68);

  doc.roundedRect(40, 86, 250, 90, 10, 10);
  doc.text(`Client 1: ${profile.primaryName}`, 56, 112);
  doc.text(`Age: ${calculateAge(profile.primaryDob)}`, 56, 132);
  doc.text(`SSN last 4: ${profile.primarySsnLast4 || "-"}`, 56, 152);

  if (profile.spouseName) {
    doc.roundedRect(305, 86, 250, 90, 10, 10);
    doc.text(`Client 2: ${profile.spouseName}`, 321, 112);
    doc.text(`Age: ${calculateAge(profile.spouseDob)}`, 321, 132);
    doc.text(`SSN last 4: ${profile.spouseSsnLast4 || "-"}`, 321, 152);
  }

  doc.roundedRect(40, 198, 515, 220, 8, 8);
  doc.setFontSize(12);
  doc.text("Totals", 56, 226);
  doc.setFontSize(11);
  doc.text(`Client 1 retirement: ${currency.format(calculations.client1RetirementTotal)}`, 56, 252);
  doc.text(`Client 2 retirement: ${currency.format(calculations.client2RetirementTotal)}`, 56, 274);
  doc.text(`Non-retirement (excludes trust): ${currency.format(calculations.nonRetirementTotal)}`, 56, 296);
  doc.text(`Trust total: ${currency.format(calculations.trustTotal)}`, 56, 318);
  doc.text(`Grand total net worth: ${currency.format(calculations.netWorth)}`, 56, 340);
  doc.text(`Liabilities (display only): ${currency.format(calculations.liabilitiesTotal)}`, 56, 362);
  doc.text(`Trust property: ${profile.trustAddress}`, 56, 392);
  doc.text(`Trust value: ${currency.format(balances.trustValue)}`, 56, 414);

  doc.save(`${profile.primaryName.replace(/\s+/g, "-").toLowerCase()}-tcc.pdf`);
}
