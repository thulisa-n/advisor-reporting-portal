# QA Checklist - Financial Workflow MVP

## Scope
This checklist covers MVP-critical flows:
- Client profile management
- Quarterly balance entry
- Real-time calculations
- Required-field validation
- Report preview
- PDF downloads for SACS/TCC

Critical business rules under test:
- Liabilities are **not** subtracted from net worth.
- Trust is **not** included in non-retirement total.
- Calculations update in real time.
- Missing required fields block PDF generation.

---

## 1) Prioritized Smoke Test Suite

Run in order (P0 first).

### P0 - Must pass for demo
- [ ] **SMK-01: Create client profile**
  - Steps: Create a new client with all required fields, save, reload app.
  - Expected: Client persists and reopens with the same values.
- [ ] **SMK-02: Enter quarterly balances**
  - Steps: Enter valid numeric balances for retirement, non-retirement, trust, liabilities for a quarter.
  - Expected: Save succeeds; data is retained on refresh/reopen.
- [ ] **SMK-03: Net worth rule (liabilities excluded)**
  - Steps: Set retirement = 100, non-retirement = 200, trust = 300, liabilities = 999.
  - Expected: Net worth remains based on asset logic only; changing liabilities does not reduce displayed net worth.
- [ ] **SMK-04: Non-retirement rule (trust excluded)**
  - Steps: Set non-retirement = 200, trust = 300.
  - Expected: Non-retirement total/report field shows 200 only; trust appears separately.
- [ ] **SMK-05: Real-time recalculation**
  - Steps: Edit one balance field digit-by-digit.
  - Expected: Totals and derived values refresh immediately after each change without manual refresh.
- [ ] **SMK-06: Required-field PDF gate**
  - Steps: Leave one required field empty and attempt SACS and TCC PDF download.
  - Expected: Clear validation errors shown; PDF generation blocked.
- [ ] **SMK-07: Successful SACS PDF**
  - Steps: Complete required fields and download SACS PDF.
  - Expected: File downloads, opens, and matches on-screen preview totals/labels.
- [ ] **SMK-08: Successful TCC PDF**
  - Steps: Complete required fields and download TCC PDF.
  - Expected: File downloads, opens, and matches on-screen preview totals/labels.

### P1 - High-value confidence
- [ ] **SMK-09: Multi-quarter consistency**
  - Steps: Enter two+ quarters with distinct values and switch between them.
  - Expected: Quarter-specific values and totals remain isolated and accurate.
- [ ] **SMK-10: Edit-after-preview**
  - Steps: Open report preview, then change source balances.
  - Expected: Preview updates to latest values before PDF export.
- [ ] **SMK-11: Decimal handling**
  - Steps: Enter decimal amounts (for example 100.25).
  - Expected: Correct rounding/formatting in UI and PDF; no precision drift in totals.

### P2 - Nice for final sweep
- [ ] **SMK-12: Browser refresh resilience**
  - Steps: Refresh during data entry and after save.
  - Expected: No corrupt state; last saved data remains correct.
- [ ] **SMK-13: Download file naming**
  - Steps: Download both report types.
  - Expected: Filenames are distinguishable (SACS vs TCC) and not misleading.

---

## 2) High-Risk Edge Cases

Prioritize these for targeted regression checks:

- [ ] **EC-01: Zero values**
  - All balances set to 0; verify totals show 0 (not blank, NaN, or validation error unless field truly required and empty).
- [ ] **EC-02: Very large values**
  - Use high values (for example 999999999.99); verify no overflow/truncation and PDFs remain readable.
- [ ] **EC-03: Negative input attempt**
  - Enter negatives where not allowed; verify validation blocks or normalizes per business rules.
- [ ] **EC-04: Non-numeric input**
  - Paste text/symbols into numeric fields; verify sanitization and user-friendly validation.
- [ ] **EC-05: Partial required data**
  - Complete profile but omit one required quarter field; ensure error pinpoints the missing field before PDF.
- [ ] **EC-06: Rapid typing / backspacing**
  - Quickly type/delete values; ensure real-time totals never show stale or impossible intermediate states.
- [ ] **EC-07: Trust/non-retirement cross-contamination**
  - Change trust repeatedly while monitoring non-retirement total; ensure no leakage.
- [ ] **EC-08: Liability net-worth contamination**
  - Change liabilities repeatedly while monitoring net worth; ensure net worth does not decrease due to liabilities.
- [ ] **EC-09: Quarter switching race**
  - Edit Q1, immediately switch to Q2 and back; ensure no value bleed across quarters.
- [ ] **EC-10: Preview/PDF mismatch**
  - Generate PDF immediately after last input edit; confirm exported totals equal latest on-screen preview.

---

## 3) Validation Checklist for Report Correctness (SACS/TCC)

Use this before sign-off:

- [ ] Client identity fields in report match profile exactly (name, key identifiers).
- [ ] Report period/quarter label matches selected quarter.
- [ ] Retirement amount in report equals entered retirement value.
- [ ] Non-retirement amount excludes trust value.
- [ ] Trust is displayed in its own section/field (not merged into non-retirement).
- [ ] Net worth follows implemented PRD rule and is not reduced by liabilities.
- [ ] Liabilities are displayed correctly where expected, without net-worth subtraction impact.
- [ ] Currency formatting is consistent across UI preview and PDF (symbols, commas, decimals).
- [ ] Totals in report preview equal totals in downloaded PDF.
- [ ] SACS template fields render in correct labels/sections.
- [ ] TCC template fields render in correct labels/sections.
- [ ] No blank required fields appear in final PDF.
- [ ] Validation messages are clear, field-specific, and actionable.
- [ ] Generated PDF is readable (no clipped text, overlapping sections, or broken layout).

---

## 4) Concise Manual Test Script (Demo Day)

Estimated runtime: 8-12 minutes.

1. **Create client**
   - Add a new client with complete required profile fields and save.
2. **Enter baseline quarter data**
   - Input: retirement = 100, non-retirement = 200, trust = 300, liabilities = 400.
3. **Verify live rules instantly**
   - Confirm totals update while typing.
   - Confirm non-retirement remains 200 (trust excluded).
   - Change liabilities (400 -> 900) and confirm net worth does not decrease from liability change.
4. **Attempt invalid export**
   - Clear one required field and try SACS PDF download.
   - Confirm export blocked with clear missing-field validation.
5. **Restore valid data and preview**
   - Re-enter required field; open report preview and validate key totals/sections.
6. **Download both PDFs**
   - Download SACS and TCC.
   - Open files and confirm values/layout match preview.
7. **Quick quarter switch sanity**
   - Switch to another quarter, enter different values, switch back.
   - Confirm original quarter values remain unchanged.
8. **Demo pass/fail gate**
   - Pass if all critical rules and both PDF paths succeed without mismatch.

---

## Assumptions, Tradeoffs, and Follow-ups

- **Assumptions**
  - Required field definitions are already agreed in product/UI.
  - Net worth display/export follows current PRD rule set.
- **Tradeoffs (time-boxed MVP)**
  - Focused on high-risk functional correctness over exhaustive cross-browser matrix.
  - Manual validation prioritized for demo speed; automation can follow after MVP lock.
- **Future improvements**
  - Add automated end-to-end tests for SACS/TCC export parity.
  - Add deterministic snapshot checks for report preview vs PDF values.
  - Add property-based tests for numeric edge ranges and formatting behavior.
