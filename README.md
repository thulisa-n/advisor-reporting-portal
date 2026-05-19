# AW Client Report Portal MVP

## Project Overview
This project delivers a demo-ready portal for quarterly financial report preparation. It lets the team maintain client profile data once, enter quarter-specific balances, run automatic calculations with strict PRD rules, preview results, and download SACS and TCC PDFs.

The implementation is intentionally MVP-focused for speed and clarity: local persistence, deterministic calculations, no external financial integrations, and workflow guardrails that block PDF generation when required data is missing.

## Architecture Decisions
- **Decision:** Single-page React + TypeScript app with Tailwind.
  - **Why:** Fast iteration with clean, reusable UI and low complexity.
  - **Impact:** Great for demo quality; not yet split into server/client boundaries.
- **Decision:** Zustand store with localStorage persistence.
  - **Why:** Minimal boilerplate and simple state model for profile/report workflows.
  - **Impact:** Works for assessment scale; not designed for multi-user concurrency.
- **Decision:** Pure utility functions for calculations and validation.
  - **Why:** Keeps business logic testable and separate from UI rendering.
  - **Impact:** Easier to evolve rules without touching components.
- **Decision:** Client-side PDF generation via `jsPDF`.
  - **Why:** Quick, deterministic PDF output path without backend setup.
  - **Impact:** Layout is stable for MVP but not fully pixel-matched to legacy templates.

## Setup Instructions
### Prerequisites
- Node.js 20+ (or current LTS)
- npm 10+

## Live Deployment
- Production URL: `https://advisor-reporting-portal.vercel.app`
- Share this URL with the team for testing and demo review.

### Install
```bash
npm install
```

### Run
```bash
npm run dev
```

### Build/Test (Optional)
```bash
npm run build
npm test
```

## How To Use The App
1. Start the app and open `http://localhost:5173/`.
2. In `Dashboard`, click `Load Demo Data` to preload a realistic client and quarter.
3. Open `Client Profile` to review/edit static client and account structure data.
4. Open `Quarterly Balances` to update balances and watch totals recalculate in real time.
5. Use `Undo` or `Revert to Saved` if any field/account is removed or changed by mistake.
6. Open `Report Preview` to verify totals and business-rule behavior.
7. Download `SACS PDF` and `TCC PDF` once required fields are complete.

## Assumptions
- The MVP runs for a small internal team and can use browser local storage.
- Required-field coverage is based on the PRD's core fields and account structures.
- PDF visual fidelity is "polished and stable" for demo, not exact legacy-template parity.
- Canva export is treated as out-of-scope for this version.

## Tradeoffs
- Prioritized deterministic calculations and workflow completeness over advanced layout templating.
- Kept architecture frontend-only to stay within assessment time expectations.
- Used manual QA checklist artifacts over full automated e2e test suite for speed.
- Focused validations on required field completeness and numeric correctness, not full compliance rules.

## Future Enhancements
- Add backend persistence (SQLite/Postgres) and report history APIs.
- Add exact template matching for SACS/TCC with richer PDF layout engine.
- Add automated e2e checks for preview-to-PDF parity.
- Add optional Canva export and Dropbox report archival.
- Add collaborator workflow metadata (prepared by, reviewer sign-off, approval timestamp).

## Alternative Implementation Approaches
- **Approach:** Python backend for PDF rendering (ReportLab/WeasyPrint) with thin React UI.
  - **Pros:** Strong server-side control for precise report templates and centralized persistence.
  - **Cons:** Higher setup and deployment complexity for a fast MVP.
- **Approach:** No framework frontend (HTML/CSS/JS) with lightweight modules.
  - **Pros:** Minimal dependency footprint and quick static deployment.
  - **Cons:** Lower maintainability as forms, state, and derived calculations grow.

## AI-Assisted Engineering Workflow
- Used architecture and frontend specialist subagents to define structure, data model, and component strategy before implementation.
- Applied feature-building guidance to keep UI and calculations separated and reusable.
- Used QA specialist output to generate a risk-focused smoke/edge-case checklist in `docs/qa-checklist.md`.
- AI accelerated scaffolding and structuring; implementation decisions and rule validation remained human-directed.

## Human-In-The-Loop Philosophy
- Financial correctness and final report acceptance remain human-controlled.
- Automation supports arithmetic, validation prompts, and PDF generation speed.
- Human review is still required before client-facing delivery of quarterly reports.
