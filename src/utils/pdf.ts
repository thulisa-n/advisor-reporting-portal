import { jsPDF } from "jspdf";
import type { CalculationResult, ClientProfile, QuarterlyBalances } from "../types";
import { calculateAge, currency } from "./calculations";

// ─── shared helpers ───────────────────────────────────────────────────────────

function quarterLabel(q: QuarterlyBalances): string {
  return `${q.year} ${q.quarter}`;
}

function slugName(profile: ClientProfile): string {
  return profile.primaryName.replace(/\s+/g, "-").toLowerCase();
}

// Draw a right-pointing arrow from (x1, y) to (x2, y)
function drawArrow(doc: jsPDF, x1: number, x2: number, y: number) {
  const hw = 6; // arrowhead half-width
  doc.line(x1, y, x2 - hw, y);
  // arrowhead triangle
  doc.triangle(x2, y, x2 - hw, y - hw / 2, x2 - hw, y + hw / 2, "F");
}

// ─── SACS PDF ─────────────────────────────────────────────────────────────────

export function generateSacsPdf(
  profile: ClientProfile,
  balances: QuarterlyBalances,
  calc: CalculationResult,
): void {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = 595;

  // ── Header ──────────────────────────────────────────────────────────────────
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, W, 52, "F");
  doc.setTextColor(248, 250, 252);
  doc.setFontSize(15);
  doc.setFont("helvetica", "bold");
  doc.text("Systematic Accumulation of Cash Summary (SACS)", 36, 22);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(
    `${profile.primaryName}${profile.spouseName ? ` & ${profile.spouseName}` : ""}  ·  ${quarterLabel(balances)}`,
    36,
    40,
  );

  // ── Three-circle cash-flow diagram ──────────────────────────────────────────
  const cy = 148;   // circle centre y
  const r  = 62;    // circle radius
  const cx1 = 92;   // Inflow
  const cx2 = 306;  // Outflow
  const cx3 = 520;  // Private Reserve

  // circle fills
  doc.setTextColor(255, 255, 255);

  // Inflow — green
  doc.setFillColor(22, 163, 74);
  doc.circle(cx1, cy, r, "F");
  // Outflow — red
  doc.setFillColor(220, 38, 38);
  doc.circle(cx2, cy, r, "F");
  // Private Reserve — blue
  doc.setFillColor(37, 99, 235);
  doc.circle(cx3, cy, r, "F");

  // circle labels (top line = category, bottom line = amount)
  const label = (cx: number, top: string, bottom: string) => {
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "normal");
    doc.text(top, cx, cy - 12, { align: "center" });
    doc.setFontSize(9.5);
    doc.setFont("helvetica", "bold");
    doc.text(bottom, cx, cy + 2, { align: "center" });
  };

  label(cx1, "Monthly Inflow", currency.format(profile.monthlyInflow));
  label(cx2, "Monthly Outflow", currency.format(profile.monthlyExpense));
  label(cx3, "Private Reserve", currency.format(balances.privateReserveBalance));

  // arrows between circles
  doc.setDrawColor(100, 116, 139);
  doc.setFillColor(100, 116, 139);
  doc.setLineWidth(1.2);
  drawArrow(doc, cx1 + r + 4, cx2 - r - 4, cy + 8);
  drawArrow(doc, cx2 + r + 4, cx3 - r - 4, cy + 8);

  // caption below arrow lines
  doc.setTextColor(71, 85, 105);
  doc.setFontSize(8);
  doc.setFont("helvetica", "italic");
  const midA = (cx1 + cx2) / 2;
  const midB = (cx2 + cx3) / 2;
  doc.text("monthly expense", midA, cy + 22, { align: "center" });
  doc.text(`excess: ${currency.format(calc.excessToPrivateReserve)}/mo`, midB, cy + 22, {
    align: "center",
  });

  // ── Private Reserve target panel ─────────────────────────────────────────────
  const prY = cy + r + 28;
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.5);
  doc.roundedRect(36, prY, W - 72, 88, 6, 6);

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Private Reserve", 52, prY + 18);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);

  const prRows = [
    ["Current Balance", currency.format(balances.privateReserveBalance)],
    [
      "Target  (6 × monthly expenses + insurance deductibles)",
      currency.format(calc.privateReserveTarget),
    ],
    ["Monthly Excess Transferred", currency.format(calc.excessToPrivateReserve)],
  ];

  let ry = prY + 36;
  for (const [label2, value] of prRows) {
    doc.setTextColor(71, 85, 105);
    doc.text(label2, 52, ry);
    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.text(value, W - 52, ry, { align: "right" });
    doc.setFont("helvetica", "normal");
    ry += 18;
  }

  // ── SACS Account detail table ─────────────────────────────────────────────────
  let y = prY + 88 + 20;

  const sectionHeader = (title: string) => {
    doc.setFillColor(241, 245, 249);
    doc.rect(36, y - 13, W - 72, 18, "F");
    doc.setTextColor(51, 65, 85);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text(title, 52, y);
    y += 20;
  };

  const accountRow = (label3: string, value: number) => {
    doc.setTextColor(71, 85, 105);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(label3, 60, y);
    doc.setTextColor(15, 23, 42);
    doc.text(currency.format(value), W - 52, y, { align: "right" });
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.4);
    doc.line(36, y + 5, W - 36, y + 5);
    y += 18;
  };

  // Non-retirement (cash / brokerage)
  sectionHeader("Non-Retirement Accounts");
  for (const acct of profile.nonRetirementAccounts) {
    const bal = balances.nonRetirementBalances[acct.id] ?? 0;
    accountRow(`${acct.label} ··· ${acct.last4 || "----"}`, bal);
  }

  // Liabilities
  sectionHeader("Liabilities");
  for (const liab of profile.liabilities) {
    const bal = balances.liabilityBalances[liab.id] ?? 0;
    accountRow(`${liab.label}  (${liab.interestRate}% APR)`, bal);
  }

  // ── Footer ────────────────────────────────────────────────────────────────────
  doc.setFillColor(241, 245, 249);
  doc.rect(0, 820, W, 22, "F");
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.setFont("helvetica", "normal");
  doc.text("Confidential — for client use only", 36, 833);
  doc.text(`Generated ${new Date().toLocaleDateString()}`, W - 36, 833, { align: "right" });

  doc.save(`${slugName(profile)}-sacs-${quarterLabel(balances)}.pdf`);
}

// ─── TCC PDF ──────────────────────────────────────────────────────────────────

export function generateTccPdf(
  profile: ClientProfile,
  balances: QuarterlyBalances,
  calc: CalculationResult,
): void {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = 595;

  // ── Header ───────────────────────────────────────────────────────────────────
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, W, 52, "F");
  doc.setTextColor(248, 250, 252);
  doc.setFontSize(15);
  doc.setFont("helvetica", "bold");
  doc.text("Total Client Capture (TCC)", 36, 22);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(
    `${profile.primaryName}${profile.spouseName ? ` & ${profile.spouseName}` : ""}  ·  ${quarterLabel(balances)}`,
    36,
    40,
  );

  // ── Client profile bubbles ────────────────────────────────────────────────────
  const bubbleW = profile.spouseName ? 244 : 519;
  const bubbleH = 72;
  const bubbleY = 64;

  // Client 1 bubble
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.5);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(36, bubbleY, bubbleW, bubbleH, 6, 6, "FD");
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(9.5);
  doc.setFont("helvetica", "bold");
  doc.text(profile.primaryName, 50, bubbleY + 18);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text(`DOB: ${profile.primaryDob || "—"}`, 50, bubbleY + 34);
  doc.text(`Age: ${profile.primaryDob ? calculateAge(profile.primaryDob) : "—"}`, 50, bubbleY + 50);
  doc.text(`SSN last 4: ${profile.primarySsnLast4 || "—"}`, 50 + bubbleW / 2, bubbleY + 34);

  // Client 2 bubble (if present)
  if (profile.spouseName) {
    const bx2 = 36 + bubbleW + 10;
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(bx2, bubbleY, bubbleW, bubbleH, 6, 6, "FD");
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(9.5);
    doc.setFont("helvetica", "bold");
    doc.text(profile.spouseName, bx2 + 14, bubbleY + 18);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text(`DOB: ${profile.spouseDob || "—"}`, bx2 + 14, bubbleY + 34);
    doc.text(`Age: ${profile.spouseDob ? calculateAge(profile.spouseDob) : "—"}`, bx2 + 14, bubbleY + 50);
    doc.text(`SSN last 4: ${profile.spouseSsnLast4 || "—"}`, bx2 + 14 + bubbleW / 2, bubbleY + 34);
  }

  // ── Account rows ──────────────────────────────────────────────────────────────
  let y = bubbleY + bubbleH + 18;

  const sectionHeader2 = (title: string) => {
    doc.setFillColor(241, 245, 249);
    doc.rect(36, y - 13, W - 72, 18, "F");
    doc.setTextColor(51, 65, 85);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text(title, 52, y);
    y += 20;
  };

  const accountRow2 = (label: string, value: number) => {
    doc.setTextColor(71, 85, 105);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(label, 60, y);
    doc.setTextColor(15, 23, 42);
    doc.text(currency.format(value), W - 52, y, { align: "right" });
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.4);
    doc.line(36, y + 5, W - 36, y + 5);
    y += 17;
  };

  const subtotalRow = (label: string, value: number) => {
    doc.setFillColor(248, 250, 252);
    doc.rect(36, y - 12, W - 72, 16, "F");
    doc.setTextColor(51, 65, 85);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text(label, 52, y);
    doc.text(currency.format(value), W - 52, y, { align: "right" });
    y += 20;
  };

  // Client 1 Retirement
  const c1Ret = profile.retirementAccounts.filter((a) => a.owner === "client1");
  if (c1Ret.length) {
    sectionHeader2(`${profile.primaryName} — Retirement`);
    for (const acct of c1Ret) {
      accountRow2(`${acct.label} ··· ${acct.last4 || "----"}`, balances.retirementBalances[acct.id] ?? 0);
    }
    subtotalRow("Subtotal", calc.client1RetirementTotal);
  }

  // Client 2 Retirement
  const c2Ret = profile.retirementAccounts.filter((a) => a.owner === "client2");
  if (c2Ret.length) {
    sectionHeader2(`${profile.spouseName || "Client 2"} — Retirement`);
    for (const acct of c2Ret) {
      accountRow2(`${acct.label} ··· ${acct.last4 || "----"}`, balances.retirementBalances[acct.id] ?? 0);
    }
    subtotalRow("Subtotal", calc.client2RetirementTotal);
  }

  // Non-retirement (excludes trust per PRD)
  if (profile.nonRetirementAccounts.length) {
    sectionHeader2("Non-Retirement Accounts  (trust excluded)");
    for (const acct of profile.nonRetirementAccounts) {
      accountRow2(`${acct.label} ··· ${acct.last4 || "----"}`, balances.nonRetirementBalances[acct.id] ?? 0);
    }
    subtotalRow("Subtotal", calc.nonRetirementTotal);
  }

  // Trust
  if (profile.trustAddress) {
    sectionHeader2("Trust");
    accountRow2(profile.trustAddress, balances.trustValue);
    subtotalRow("Subtotal", calc.trustTotal);
  }

  // Liabilities (display only — not subtracted from net worth per PRD)
  if (profile.liabilities.length) {
    sectionHeader2("Liabilities  (display only — not subtracted from net worth)");
    for (const liab of profile.liabilities) {
      accountRow2(
        `${liab.label}  (${liab.interestRate}% APR)`,
        balances.liabilityBalances[liab.id] ?? 0,
      );
    }
    subtotalRow("Subtotal", calc.liabilitiesTotal);
  }

  // ── Grand Total Net Worth ──────────────────────────────────────────────────────
  y += 6;
  doc.setFillColor(15, 23, 42);
  doc.roundedRect(36, y - 14, W - 72, 32, 5, 5, "F");
  doc.setTextColor(248, 250, 252);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Grand Total Net Worth", 52, y + 4);
  doc.text(currency.format(calc.netWorth), W - 52, y + 4, { align: "right" });
  y += 32;

  // SACS / formulas note
  y += 10;
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(100, 116, 139);
  doc.text(
    "Net worth = Ret C1 + Ret C2 + Non-Ret + Trust  (liabilities shown for reference only).",
    52,
    y,
  );

  // ── Footer ────────────────────────────────────────────────────────────────────
  doc.setFillColor(241, 245, 249);
  doc.rect(0, 820, W, 22, "F");
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.setFont("helvetica", "normal");
  doc.text("Confidential — for client use only", 36, 833);
  doc.text(`Generated ${new Date().toLocaleDateString()}`, W - 36, 833, { align: "right" });

  doc.save(`${slugName(profile)}-tcc-${quarterLabel(balances)}.pdf`);
}
