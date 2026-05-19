---
name: readme-writer
description: Generate professional README files with architecture decisions, setup instructions, assumptions, tradeoffs, future enhancements, alternative implementation approaches, AI-assisted engineering workflow, and human-in-the-loop philosophy. Use when creating or improving README.md documentation.
disable-model-invocation: true
---

# Skill: README Writer

Generate professional README files that include:
- project overview
- architecture decisions
- setup instructions
- assumptions
- tradeoffs
- future enhancements
- alternative implementation approaches
- AI-assisted engineering workflow
- human-in-the-loop philosophy

Tone:
- concise
- senior-level
- practical
- implementation-focused

## Instructions

When asked to write or improve a README:

1. Inspect the repository structure and key files before drafting.
2. Prioritize clarity over completeness; include what a developer needs to run, understand, and extend the project.
3. Keep sections short and actionable.
4. Avoid marketing language and generic filler.
5. Prefer explicit commands and concrete assumptions.

## Required README Structure

Use this section order unless the user requests otherwise:

1. Project Overview
2. Architecture Decisions
3. Setup Instructions
4. Assumptions
5. Tradeoffs
6. Future Enhancements
7. Alternative Implementation Approaches
8. AI-Assisted Engineering Workflow
9. Human-In-The-Loop Philosophy

## Output Template

````markdown
# <Project Name>

## Project Overview
<1-2 short paragraphs on scope, target users, and core workflow>

## Architecture Decisions
- **Decision:** <what was chosen>
  - **Why:** <reasoning>
  - **Impact:** <tradeoff or consequence>

## Setup Instructions
### Prerequisites
- <tool/version>

### Install
```bash
<install commands>
```

### Run
```bash
<run commands>
```

### Build/Test (Optional)
```bash
<build/test commands>
```

## Assumptions
- <assumption>

## Tradeoffs
- <tradeoff and rationale>

## Future Enhancements
- <next step>

## Alternative Implementation Approaches
- **Approach:** <alternative>
  - **Pros:** <benefits>
  - **Cons:** <costs>

## AI-Assisted Engineering Workflow
- <how AI was used to accelerate delivery>
- <what remained human-led>

## Human-In-The-Loop Philosophy
- <where human review is mandatory>
- <what automation supports but does not finalize>
````

## Quality Checklist

Before finalizing:
- Ensure every required section exists.
- Ensure setup commands are executable and ordered.
- Ensure assumptions and tradeoffs are specific to the project.
- Ensure alternatives are realistic, not theoretical.
- Ensure AI/human responsibilities are clearly separated.
- Keep the README concise and implementation-focused.
