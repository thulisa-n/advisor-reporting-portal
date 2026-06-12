import { jsPDF } from "jspdf";
import type { CalculationResult, ClientProfile, QuarterlyBalances } from "../types";
import { calculateAge, currency } from "./calculations";

// ── Color palette ─────────────────────────────────────────────────────────────
type RGB = [number, number, number];

const C = {
  inflow:      [34, 197, 94]   as RGB,  // green-500
  outflow:     [239, 68, 68]   as RGB,  // red-500
  reserve:     [59, 130, 246]  as RGB,  // blue-500
  retirement:  [99, 102, 241]  as RGB,  // indigo-500
  nonret:      [14, 165, 233]  as RGB,  // sky-500
  trust:       [16, 185, 129]  as RGB,  // emerald-500
  liability:   [239, 68, 68]   as RGB,  // red-500
  clientBubble:[34, 197, 94]   as RGB,  // green-500
  totals:      [203, 213, 225] as RGB,  // slate-300
  dark:        [15, 23, 42]    as RGB,  // slate-950
  mid:         [71, 85, 105]   as RGB,  // slate-600
  muted:       [148, 163, 184] as RGB,  // slate-400
  border:      [226, 232, 240] as RGB,  // slate-200
  surface:     [248, 250, 252] as RGB,  // slate-50
  white:       [255, 255, 255] as RGB,
  liabBg:      [254, 226, 226] as RGB,  // red-100
  liabText:    [153, 27, 27]   as RGB,  // red-800
};

// ── Low-level helpers ─────────────────────────────────────────────────────────

function fill(doc: jsPDF, color: RGB) {
  doc.setFillColor(color[0], color[1], color[2]);
}
function draw(doc: jsPDF, color: RGB) {
  doc.setDrawColor(color[0], color[1], color[2]);
}
function text(doc: jsPDF, color: RGB) {
  doc.setTextColor(color[0], color[1], color[2]);
}
function bold(doc: jsPDF, size: number) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(size);
}
function normal(doc: jsPDF, size: number) {
  doc.setFont("helvetica", "normal");
  doc.setFontSize(size);
}
function italic(doc: jsPDF, size: number) {
  doc.setFont("helvetica", "oblique");
  doc.setFontSize(size);
}

/** Draw a horizontal arrow from (x1,y) to (x2,y). */
function arrow(doc: jsPDF, x1: number, x2: number, y: number, color: RGB, lw = 2) {
  draw(doc, color);
  doc.setLineWidth(lw);
  doc.line(x1, y, x2, y);
  const h = 8;
  doc.line(x2, y, x2 - h, y - 5);
  doc.line(x2, y, x2 - h, y + 5);
}

function quarterLabel(b: QuarterlyBalances) {
  return `${b.year} ${b.quarter}`;
}

// ── Shared page header ────────────────────────────────────────────────────────

function pageHeader(doc: jsPDF, title: string, client: string, period: string) {
  const W = 612;
  fill(doc, C.dark);
  doc.rect(0, 0, W, 52, "F");

  text(doc, C.white);
  bold(doc, 14);
  doc.text(title, 30, 21);

  normal(doc, 10);
  doc.text(client, 30, 38);
  doc.text(period, W - 30, 38, { align: "right" });
}

// ─────────────────────────────────────────────────────────────────────────────
//  SACS PDF
// ─────────────────────────────────────────────────────────────────────────────

export function generateSacsPdf(
  profile: ClientProfile,
  balances: QuarterlyBalances,
  calculations: CalculationResult,
): void {
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const W = 612;

  pageHeader(doc, "Simple Automated Cash Flow System (SACS)", profile.primaryName, quarterLabel(balances));

  // Sub-heading
  text(doc, C.mid);
  normal(doc, 10);
  doc.text("Monthly Cash Flow Overview", W / 2, 72, { align: "center" });

  // ── Three circles ─────────────────────────────────────────────────────────
  // r=62 + symmetric margins gives ~74pt arrow spans — enough room for labels
  const cy  = 210;
  const r   = 62;
  const cx1 = 92;   // 30 margin + r
  const cx2 = 306;  // page centre
  const cx3 = 520;  // W - 30 margin - r
  const gap = 8;

  // Arrow span sanity: a1x1=162, a1x2=236 → 74pt; same for arrow 2
  const a1x1 = cx1 + r + gap;  // 162
  const a1x2 = cx2 - r - gap;  // 236
  const mid1 = (a1x1 + a1x2) / 2; // 199

  const a2x1 = cx2 + r + gap;  // 376
  const a2x2 = cx3 - r - gap;  // 450
  const mid2 = (a2x1 + a2x2) / 2; // 413

  // Labels above arrows (clear of the circle edges and the arrow line)
  // Arrow 1 labels — red ×
  text(doc, C.outflow);
  bold(doc, 18);
  doc.text("×", mid1, cy - 12, { align: "center" });
  normal(doc, 7);
  doc.text("outflow deducted", mid1, cy - 1, { align: "center" });

  // Arrow 1 line
  arrow(doc, a1x1, a1x2, cy + 8, C.outflow, 2);

  // Arrow 2 labels — blue excess
  text(doc, C.reserve);
  bold(doc, 10);
  doc.text(currency.format(calculations.excessToPrivateReserve) + " / mo", mid2, cy - 12, { align: "center" });
  normal(doc, 7);
  doc.text("excess to reserve", mid2, cy - 1, { align: "center" });

  // Arrow 2 line
  arrow(doc, a2x1, a2x2, cy + 8, C.reserve, 2);

  // INFLOW circle
  fill(doc, C.inflow);
  draw(doc, C.inflow);
  doc.circle(cx1, cy, r, "F");
  text(doc, C.white);
  bold(doc, 11);
  doc.text("INFLOW", cx1, cy - 14, { align: "center" });
  bold(doc, 14);
  doc.text(currency.format(profile.monthlyInflow), cx1, cy + 4, { align: "center" });
  normal(doc, 8);
  doc.text("per month", cx1, cy + 17, { align: "center" });

  // OUTFLOW circle
  fill(doc, C.outflow);
  draw(doc, C.outflow);
  doc.circle(cx2, cy, r, "F");
  text(doc, C.white);
  bold(doc, 11);
  doc.text("OUTFLOW", cx2, cy - 14, { align: "center" });
  bold(doc, 14);
  doc.text(currency.format(profile.monthlyExpense), cx2, cy + 4, { align: "center" });
  normal(doc, 8);
  doc.text("per month", cx2, cy + 17, { align: "center" });

  // PRIVATE RESERVE circle
  fill(doc, C.reserve);
  draw(doc, C.reserve);
  doc.circle(cx3, cy, r, "F");
  text(doc, C.white);
  bold(doc, 10);
  doc.text("PRIVATE", cx3, cy - 18, { align: "center" });
  doc.text("RESERVE", cx3, cy - 6, { align: "center" });
  bold(doc, 13);
  doc.text(currency.format(balances.privateReserveBalance), cx3, cy + 9, { align: "center" });
  normal(doc, 7);
  doc.text("current balance", cx3, cy + 21, { align: "center" });

  // ── SACS Summary box ──────────────────────────────────────────────────────
  const boxY = cy + r + 28;
  const boxH = 130;

  fill(doc, C.surface);
  draw(doc, C.border);
  doc.setLineWidth(1);
  doc.roundedRect(30, boxY, W - 60, boxH, 8, 8, "FD");

  // Title
  text(doc, C.dark);
  bold(doc, 11);
  doc.text("SACS Summary", 50, boxY + 20);

  draw(doc, C.border);
  doc.setLineWidth(0.5);
  doc.line(50, boxY + 26, W - 50, boxY + 26);

  // Left column
  const lx = 50;
  const lv = 215;
  const rx = W / 2 + 10;
  const rv = W - 50;

  normal(doc, 9);
  text(doc, C.mid);

  const rows: [string, string, string, string][] = [
    ["Monthly Inflow:",        currency.format(profile.monthlyInflow),                    "Private Reserve Balance:", currency.format(balances.privateReserveBalance)],
    ["Monthly Outflow:",       currency.format(profile.monthlyExpense),                   "Private Reserve Target:",  currency.format(calculations.privateReserveTarget)],
    ["Monthly Excess:",        currency.format(calculations.excessToPrivateReserve),      "Target Formula:",          `(6 × expenses) + deductibles`],
  ];

  rows.forEach(([lLabel, lVal, rLabel, rVal], i) => {
    const ry2 = boxY + 44 + i * 26;
    text(doc, C.mid);
    normal(doc, 9);
    doc.text(lLabel, lx, ry2);
    text(doc, C.dark);
    bold(doc, 9);
    doc.text(lVal, lv, ry2, { align: "right" });

    text(doc, C.mid);
    normal(doc, 9);
    doc.text(rLabel, rx, ry2);
    text(doc, C.dark);
    bold(doc, 9);
    doc.text(rVal, rv, ry2, { align: "right" });
  });

  // On-track badge
  const onTrack = balances.privateReserveBalance >= calculations.privateReserveTarget;
  const badgeX  = lx;
  const badgeY2 = boxY + boxH - 20;
  fill(doc, onTrack ? C.inflow : C.outflow);
  doc.roundedRect(badgeX, badgeY2 - 13, onTrack ? 70 : 95, 18, 4, 4, "F");
  text(doc, C.white);
  bold(doc, 8);
  doc.text(onTrack ? "ON TRACK" : "BELOW TARGET", badgeX + (onTrack ? 35 : 47.5), badgeY2, { align: "center" });

  // Deficit / surplus note
  const diff = balances.privateReserveBalance - calculations.privateReserveTarget;
  text(doc, diff >= 0 ? C.inflow : C.outflow);
  italic(doc, 8);
  doc.text(
    diff >= 0
      ? `Surplus: ${currency.format(diff)} above target`
      : `Deficit: ${currency.format(Math.abs(diff))} below target`,
    badgeX + 105,
    badgeY2,
  );

  // ── Footer ────────────────────────────────────────────────────────────────
  text(doc, C.muted);
  normal(doc, 7);
  doc.text("Generated by AW Client Report Portal", W / 2, 772, { align: "center" });

  doc.save(
    `${profile.primaryName.replace(/\s+/g, "-").toLowerCase()}-sacs-${balances.year}-${balances.quarter}.pdf`,
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  TCC PDF
// ─────────────────────────────────────────────────────────────────────────────

export function generateTccPdf(
  profile: ClientProfile,
  balances: QuarterlyBalances,
  calculations: CalculationResult,
): void {
  const doc  = new jsPDF({ unit: "pt", format: "letter" });
  const W    = 612;
  const MARGIN = 30;
  const INNER  = W - MARGIN * 2;
  let y = 0;

  // Page break helper
  function ensureSpace(needed: number) {
    if (y + needed > 760) {
      doc.addPage();
      y = 30;
    }
  }

  pageHeader(doc, "Total Client Chart (TCC)", profile.primaryName, quarterLabel(balances));
  y = 65;

  // ── Client info bubbles ───────────────────────────────────────────────────
  const hasSpouse = Boolean(profile.spouseName);
  const bubW  = hasSpouse ? (INNER - 10) / 2 : INNER;
  const bubH  = 66;

  function clientBubble(name: string, dob: string, ssn: string, x: number) {
    fill(doc, C.clientBubble);
    draw(doc, C.clientBubble);
    doc.roundedRect(x, y, bubW, bubH, 10, 10, "F");
    text(doc, C.white);
    bold(doc, 12);
    doc.text(name, x + bubW / 2, y + 19, { align: "center" });
    normal(doc, 8);
    const age = dob ? `Age: ${calculateAge(dob)}` : "";
    const dobStr = dob ? `DOB: ${dob}` : "";
    const ssnStr = ssn ? `SSN: ****${ssn}` : "";
    doc.text([age, dobStr, ssnStr].filter(Boolean).join("   |   "), x + bubW / 2, y + 33, { align: "center" });
  }

  clientBubble(profile.primaryName, profile.primaryDob, profile.primarySsnLast4, MARGIN);
  if (hasSpouse) {
    clientBubble(
      profile.spouseName,
      profile.spouseDob,
      profile.spouseSsnLast4,
      MARGIN + bubW + 10,
    );
  }
  y += bubH + 14;

  // ── Section header band ───────────────────────────────────────────────────
  function sectionHeader(label: string, color: RGB) {
    ensureSpace(24);
    fill(doc, color);
    doc.roundedRect(MARGIN, y, INNER, 18, 4, 4, "F");
    text(doc, C.white);
    bold(doc, 9);
    doc.text(label.toUpperCase(), MARGIN + 10, y + 12);
    y += 24;
  }

  // ── Account bubble (generic) ──────────────────────────────────────────────
  function accountBubble(
    label: string,
    sub: string,
    amount: number,
    x: number,
    w: number,
    accentColor: RGB,
  ) {
    const bh = 50;
    fill(doc, C.surface);
    draw(doc, accentColor);
    doc.setLineWidth(1.5);
    doc.roundedRect(x, y, w, bh, 8, 8, "FD");
    text(doc, accentColor);
    bold(doc, 9);
    doc.text(label, x + w / 2, y + 13, { align: "center" });
    if (sub) {
      text(doc, C.muted);
      normal(doc, 7);
      doc.text(sub, x + w / 2, y + 24, { align: "center" });
    }
    text(doc, C.dark);
    bold(doc, 11);
    doc.text(currency.format(amount), x + w / 2, y + 39, { align: "center" });
  }

  function accountRow(
    accounts: { label: string; sub: string; amount: number }[],
    color: RGB,
  ) {
    if (accounts.length === 0) return;
    ensureSpace(58);
    const bw  = (INNER - (accounts.length - 1) * 8) / accounts.length;
    accounts.forEach((acc, i) => {
      accountBubble(acc.label, acc.sub, acc.amount, MARGIN + i * (bw + 8), bw, color);
    });
    y += 58;
  }

  // ── Totals bar ────────────────────────────────────────────────────────────
  function totalsBar(items: { label: string; value: number }[]) {
    ensureSpace(32);
    fill(doc, C.totals);
    doc.roundedRect(MARGIN, y, INNER, 28, 5, 5, "F");
    const colW = INNER / items.length;
    items.forEach((item, i) => {
      const cx2 = MARGIN + i * colW + colW / 2;
      text(doc, C.dark);
      normal(doc, 7);
      doc.text(item.label, cx2, y + 10, { align: "center" });
      bold(doc, 9);
      doc.text(currency.format(item.value), cx2, y + 22, { align: "center" });
    });
    y += 34;
  }

  // ── Retirement ────────────────────────────────────────────────────────────
  const client1Ret = profile.retirementAccounts.filter(a => a.owner === "client1");
  const client2Ret = profile.retirementAccounts.filter(a => a.owner === "client2");

  if (client1Ret.length > 0 || client2Ret.length > 0) {
    sectionHeader("Retirement Accounts", C.retirement);

    if (client1Ret.length > 0) {
      // Sub-label for Client 1
      ensureSpace(16);
      text(doc, C.retirement);
      bold(doc, 8);
      doc.text(`${profile.primaryName}`, MARGIN, y + 10);
      y += 14;

      accountRow(
        client1Ret.map(a => ({
          label: a.label,
          sub: a.last4 ? `****${a.last4}` : "",
          amount: balances.retirementBalances[a.id] ?? 0,
        })),
        C.retirement,
      );
    }

    if (client2Ret.length > 0) {
      ensureSpace(16);
      text(doc, C.retirement);
      bold(doc, 8);
      doc.text(profile.spouseName || "Client 2", MARGIN, y + 10);
      y += 14;

      accountRow(
        client2Ret.map(a => ({
          label: a.label,
          sub: a.last4 ? `****${a.last4}` : "",
          amount: balances.retirementBalances[a.id] ?? 0,
        })),
        C.retirement,
      );
    }

    totalsBar([
      { label: `${profile.primaryName} Retirement`, value: calculations.client1RetirementTotal },
      ...(hasSpouse
        ? [{ label: `${profile.spouseName} Retirement`, value: calculations.client2RetirementTotal }]
        : []),
      {
        label: "Combined Retirement",
        value: calculations.client1RetirementTotal + calculations.client2RetirementTotal,
      },
    ]);
  }

  y += 5;

  // ── Non-Retirement ────────────────────────────────────────────────────────
  if (profile.nonRetirementAccounts.length > 0) {
    sectionHeader("Non-Retirement Accounts", C.nonret);

    accountRow(
      profile.nonRetirementAccounts.map(a => ({
        label: a.label,
        sub: a.last4 ? `****${a.last4}` : "",
        amount: balances.nonRetirementBalances[a.id] ?? 0,
      })),
      C.nonret,
    );

    totalsBar([
      { label: "Non-Retirement Total (excludes trust)", value: calculations.nonRetirementTotal },
    ]);
  }

  y += 5;

  // ── Trust ─────────────────────────────────────────────────────────────────
  sectionHeader("Trust", C.trust);
  ensureSpace(58);

  fill(doc, C.surface);
  draw(doc, C.trust);
  doc.setLineWidth(1.5);
  doc.roundedRect(MARGIN, y, INNER, 54, 8, 8, "FD");

  text(doc, C.trust);
  bold(doc, 9);
  doc.text("Real Estate — Zillow Zestimate", W / 2, y + 14, { align: "center" });

  text(doc, C.mid);
  normal(doc, 8);
  const addr = profile.trustAddress || "—";
  const addrLines = doc.splitTextToSize(addr, INNER - 20) as string[];
  doc.text(addrLines, W / 2, y + 26, { align: "center" });

  text(doc, C.dark);
  bold(doc, 14);
  doc.text(currency.format(balances.trustValue), W / 2, y + 46, { align: "center" });
  y += 62;

  y += 5;

  // ── Liabilities ───────────────────────────────────────────────────────────
  if (profile.liabilities.length > 0) {
    sectionHeader("Liabilities", C.liability);

    ensureSpace(66);
    const bw = (INNER - (profile.liabilities.length - 1) * 8) / profile.liabilities.length;

    profile.liabilities.forEach((liab, i) => {
      const bal  = balances.liabilityBalances[liab.id] ?? 0;
      const annualInterest = bal * (liab.interestRate / 100);
      const lh   = 62;
      const lx   = MARGIN + i * (bw + 8);

      fill(doc, C.liabBg);
      draw(doc, C.liability);
      doc.setLineWidth(1.5);
      doc.roundedRect(lx, y, bw, lh, 8, 8, "FD");

      text(doc, C.liability);
      bold(doc, 9);
      doc.text(liab.label, lx + bw / 2, y + 13, { align: "center" });

      text(doc, C.mid);
      normal(doc, 7);
      doc.text(`${liab.interestRate}% interest`, lx + bw / 2, y + 24, { align: "center" });

      text(doc, C.dark);
      bold(doc, 12);
      doc.text(currency.format(bal), lx + bw / 2, y + 40, { align: "center" });

      text(doc, C.muted);
      normal(doc, 7);
      doc.text(`Annual: ${currency.format(annualInterest)}`, lx + bw / 2, y + 53, { align: "center" });
    });

    y += 70;

    // Liabilities disclaimer bar
    ensureSpace(26);
    fill(doc, C.liabBg);
    draw(doc, C.liability);
    doc.setLineWidth(0.5);
    doc.roundedRect(MARGIN, y, INNER, 22, 5, 5, "FD");
    text(doc, C.liabText);
    normal(doc, 8);
    doc.text("Liabilities are displayed separately and are NOT subtracted from net worth.", MARGIN + 10, y + 14);
    bold(doc, 8);
    doc.text(currency.format(calculations.liabilitiesTotal), W - MARGIN - 10, y + 14, { align: "right" });
    y += 28;
  }

  y += 6;

  // ── Grand Total Net Worth ─────────────────────────────────────────────────
  ensureSpace(46);
  fill(doc, C.dark);
  doc.roundedRect(MARGIN, y, INNER, 46, 8, 8, "F");

  text(doc, C.white);
  bold(doc, 11);
  doc.text("GRAND TOTAL NET WORTH", MARGIN + 14, y + 17);

  bold(doc, 18);
  doc.text(currency.format(calculations.netWorth), W - MARGIN - 14, y + 30, { align: "right" });

  text(doc, C.muted);
  normal(doc, 7);
  doc.text(
    "= Client 1 Retirement + Client 2 Retirement + Non-Retirement + Trust",
    MARGIN + 14,
    y + 40,
  );

  // ── Footer ────────────────────────────────────────────────────────────────
  text(doc, C.muted);
  normal(doc, 7);
  const allPages = (doc as unknown as { internal: { getNumberOfPages: () => number } }).internal.getNumberOfPages();
  for (let p = 1; p <= allPages; p++) {
    doc.setPage(p);
    doc.text("Generated by AW Client Report Portal", W / 2, 776, { align: "center" });
  }

  doc.save(
    `${profile.primaryName.replace(/\s+/g, "-").toLowerCase()}-tcc-${balances.year}-${balances.quarter}.pdf`,
  );
}
