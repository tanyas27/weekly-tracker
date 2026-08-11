---
id: ki-index
title: Knowledge Base Index & Catalog (OKF 0.2)
description: Master index and navigation catalog for Weekly Tracker repository following Google Open Knowledge Format (OKF) 0.2 standard.
type: catalog
category: governance
tags:
  - index
  - catalog
  - okf-v0.2
  - ai-guidelines
sources:
  - README.md
  - package.json
  - AGENTS.md
  - app/page.tsx
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

# Weekly Tracker Knowledge Base (Google OKF 0.2 Standard)

Welcome to the official **Weekly Tracker** Knowledge Base. This directory contains curated, machine-readable, and human-verifiable knowledge artifacts conforming strictly to **Google Open Knowledge Format (OKF) v0.2**.

---

## 🤖 AI Agent Directive (MANDATORY FOR ALL AI WORKFLOWS)

> [!IMPORTANT]
> **ATTENTION ALL AI AGENTS:** Before reading, generating, or modifying code in this repository, you **MUST** consult this `knowledge/` directory:
> 1. Read [index.md](index.md) to locate relevant domains.
> 2. Read the specific Knowledge Item (KI) corresponding to your task.
> 3. Enforce all architectural constraints defined in [06-ai-agent-guidelines.md](06-ai-agent-guidelines.md).
> 4. Do not break existing data models, CSS themes, offline service worker capabilities, or Next.js 16 conventions.

---

## 🗂️ Knowledge Item Catalog

| ID | Title | Domain / Type | Key Topics | Source Files | Trust Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **KI-01** | [Architecture Overview](01-architecture-overview.md) | `architecture` | Next.js 16 App Router, React 19, Client Components, Geist & Caveat fonts | [layout.tsx](../app/layout.tsx), [page.tsx](../app/page.tsx) | `verified` |
| **KI-02** | [Data Models & State](02-data-models-and-state.md) | `data-model` | `Task`, `StoredTask`, `localStorage` persistence, day grouping, migrations | [page.tsx](../app/page.tsx) | `verified` |
| **KI-03** | [UI/UX & Design System](03-ui-ux-design-system.md) | `design-system` | Studio Ghibli aesthetic, glassmorphism, responsive schedule grid, dark/light themes | [globals.css](../app/globals.css), [page.tsx](../app/page.tsx) | `verified` |
| **KI-04** | [PWA & Offline Service Worker](04-pwa-and-offline.md) | `pwa` | Web App Manifest, Service Worker cache-first strategies, standalone display | [sw.js](../public/sw.js), [manifest.json](../public/manifest.json), [register-sw.tsx](../app/register-sw.tsx) | `verified` |
| **KI-05** | [Dev Ops & Workflow](05-development-ops-workflow.md) | `devops` | Yarn vs npm scripts, Tailwind v4 configuration, ESLint, Next.js 16 agent rules | [package.json](../package.json), [tsconfig.json](../tsconfig.json) | `verified` |
| **KI-06** | [AI Agent Guidelines](06-ai-agent-guidelines.md) | `guidelines` | Safety rules, design preservation, code conventions, state mutation guidelines | [AGENTS.md](../AGENTS.md) | `verified` |

---

## 🛡️ OKF v0.2 Specification Standards Compliance

This knowledge repository enforces the 5 core **Trust Signals** defined in Google OKF 0.2:

1. **`sources` (Provenance):** Direct references to source code files and configuration schemas.
2. **`generated` (Trust):** Authoring agent name, model identifier, and generation timestamp.
3. **`verified` (Verification):** Human review status, verifier name, and verification date.
4. **`stale_after` (Freshness):** Expiration date for automatic re-validation of knowledge validity.
5. **`status` (Lifecycle):** Lifecycle stage (`active`, `draft`, `deprecated`).

---

## 📜 Audit Trail

Refer to [logs.md](logs.md) for the complete version update history and provenance logs of this knowledge base.
