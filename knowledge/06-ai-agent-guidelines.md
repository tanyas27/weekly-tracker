---
id: ki-ai-agent-guidelines
title: AI Agent Execution Guidelines & Operational Rules
description: Comprehensive rules, safety standards, architectural invariants, and OKF v0.2 consultation protocols for all AI agents working on Weekly Tracker.
type: guidelines
category: governance
tags:
  - ai-guidelines
  - system-prompt
  - okf-v0.2
  - code-safety
  - design-invariants
sources:
  - AGENTS.md
  - knowledge/index.md
generated:
  agent: Antigravity AI
  model: Gemini 3.6 Flash
  timestamp: 2026-08-10T20:28:32+05:30
verified:
  by: daman
  date: 2026-08-10
  status: verified
stale_after: 2027-02-10
status: active
---

# KI-06: AI Agent Execution Guidelines & Operational Rules

## 1. Core Mandate: Mandatory OKF 0.2 Consultation

Every AI assistant (Antigravity, Claude, Gemini, Cursor, Copilot) operating in this repository **MUST** adhere to the following workflow before undertaking any task:

1. **Step 1: Read the Knowledge Index**: Inspect [index.md](index.md) to locate relevant domain documentation.
2. **Step 2: Read Target Knowledge Items**: Consult specific KIs (`KI-01` through `KI-05`) for technical details on architecture, data schemas, design tokens, or PWA mechanics.
3. **Step 3: Preserve System Invariants**: Execute code modifications without violating the design system, breaking local storage schema, or ignoring Next.js 16 deprecations.
4. **Step 4: Maintain Knowledge Currency**: If code changes affect existing data models, UI components, or PWA configuration, update the corresponding KI file, update its YAML frontmatter timestamp, and add an entry to [logs.md](logs.md).

---

## 2. Inviolable Architectural Rules

### 2.1 Design & Visual Identity Invariants
> [!CAUTION]
> **NEVER DEGRADE DESIGN AESTHETICS:** The Studio Ghibli visual identity (warm pastel colors, Totoro companion illustration, handwritten `Caveat` font, glassmorphism cards, and paper planner feel) is a core feature of this application. 
- Do **NOT** replace custom HSL/Hex sticky note colors with generic Bootstrap/Tailwind utility colors.
- Do **NOT** remove frosted glass `backdrop-blur-md` styling or background textures.
- Do **NOT** simplify responsive layout behavior down to plain unstyled tables.

### 2.2 Data Model & Persistence Safety
- **LocalStorage Backward Compatibility**: Always maintain the deserialization transformation in `getInitialTasks()` that converts legacy single-day task records (`day`) into array format (`days`).
- **Idempotent Updates**: Ensure state changes properly trigger `localStorage.setItem('weeklyTasks', ...)` and `localStorage.setItem('theme', ...)`.

### 2.3 Next.js 16 Compliance
- Inspect `node_modules/next/dist/docs/` prior to adding Server Actions or modifying App Router APIs.
- Preserve the auto-generated block in [AGENTS.md](../AGENTS.md).

---

## 3. Pre-Commit Verification Checklist for AI Agents

Before declaring any coding task complete, AI agents must run:
- [ ] `yarn lint` - Ensure ESLint validation passes cleanly.
- [ ] `yarn build` - Confirm Next.js production build completes without TypeScript or compilation errors.
- [ ] Check YAML frontmatter on any created/modified files in `knowledge/`.
