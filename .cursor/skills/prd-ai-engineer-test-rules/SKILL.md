---
name: prd-ai-engineer-test-rules
description: Applies PRD AI Engineer Test engineering standards, MVP priorities, UI constraints, and calculation rules for a fast demo-ready build. Use when implementing, reviewing, or planning work for this assessment.
---

# PRD AI Engineer Test — Engineering Rules

## Objective
Build a fast, clean, demo-ready MVP that demonstrates:
- product understanding
- engineering judgment
- rapid execution
- maintainable architecture
- AI-assisted development workflow

This is NOT a production-scale system.

Optimize for:
- clarity
- speed
- clean UX
- maintainability
- demo quality
- thoughtful tradeoffs

---

# Engineering Standards

Always:
- prefer readability over cleverness
- use modular reusable components
- keep logic simple
- avoid premature optimization
- separate UI from calculations
- generate concise documentation
- use descriptive naming
- create maintainable folder structures

---

# UI Standards

The UI should feel:
- professional
- financial-dashboard inspired
- clean
- minimal
- trustworthy
- easy for non-technical users

Use:
- Tailwind CSS
- cards
- spacing
- subtle shadows
- consistent typography

Avoid:
- flashy animations
- unnecessary complexity
- cluttered layouts

---

# Product Constraints

This assessment has:
- a strict 2-hour implementation expectation
- no need for production authentication
- no need for real integrations
- no need for advanced infrastructure

Prioritize:
1. core workflow
2. calculations
3. polished demo experience
4. PDF generation
5. thoughtful documentation

---

# Functional Priorities

Core MVP:
- client profile management
- quarterly balance entry
- automatic calculations
- report preview
- PDF generation

Nice-to-have:
- Canva export
- report history
- Dropbox sync

Out of scope:
- production auth
- real financial integrations
- enterprise infrastructure

---

# Calculation Rules

Always follow PRD rules exactly:
- liabilities are NOT subtracted from net worth
- trust is NOT included in non-retirement total
- calculations update in real time
- missing required fields must be flagged

---

# Human-In-The-Loop Philosophy

This system supports human-reviewed financial workflows.

Automation assists with:
- calculations
- formatting
- report generation
- workflow acceleration

Final financial validation remains human-controlled.

---

# AI-Assisted Development Workflow

Use AI to:
- scaffold components
- generate forms
- structure architecture
- create reusable utilities
- generate documentation
- accelerate development

Human responsibilities:
- architecture decisions
- business logic validation
- final review
- implementation approval
- UX judgment

---

# Documentation Requirements

Always document:
- assumptions
- tradeoffs
- future improvements
- alternative approaches
- limitations caused by time constraints

---

# Code Quality

Prefer:
- reusable components
- utility functions
- simple state management
- clean separation of concerns

Avoid:
- giant files
- duplicated code
- deeply nested logic
- magic numbers
