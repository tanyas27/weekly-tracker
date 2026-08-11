---
id: ki-development-ops-workflow
title: Development, Build & Operations Workflow
description: Tooling, dependency rules, build scripts, TypeScript settings, Tailwind v4 setup, and Next.js 16 dev environment requirements for Weekly Tracker.
type: devops
category: operations
tags:
  - build-scripts
  - yarn
  - tailwind-v4
  - typescript
  - eslint
  - nextjs16
sources:
  - package.json
  - postcss.config.mjs
  - eslint.config.mjs
  - tsconfig.json
  - AGENTS.md
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

# KI-05: Development, Build & Operations Workflow

## 1. Package Management & Dependency Policy

### 1.1 Preferred Package Manager
- **Yarn (v1.22.22)** is the primary package manager for this workspace.

> [!WARNING]
> **Lockfile Synchronization Notice:** Both `yarn.lock` and `package-lock.json` exist in the repository root. When adding or updating dependencies, use `yarn add <package>` to update `yarn.lock`. Do not mix package manager invocations.

---

## 2. Available Scripts

Defined in [package.json](../package.json):

```bash
# Start Next.js development server (hot-reloading enabled)
yarn dev

# Compile production build bundle
yarn build

# Start production server (runs compiled .next build)
yarn start

# Execute ESLint validation check
yarn lint
```

---

## 3. Styling Infrastructure (Tailwind CSS v4)

Tailwind CSS v4 is integrated via PostCSS:
- **`postcss.config.mjs`**: Specifies `@tailwindcss/postcss` plugin:
```javascript
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
export default config;
```
- **`app/globals.css`**: Utilizes the modern CSS directive `@import "tailwindcss";` without legacy `@tailwind utilities;` or `tailwind.config.js`.

---

## 4. TypeScript & Linting Configuration

### 4.1 TypeScript (`tsconfig.json`)
Configured for Next.js App Router:
- `target`: `ES2017`
- `moduleResolution`: `bundler`
- `jsx`: `preserve` with Next.js TypeScript plugin enabled.
- Path aliases: `@/*` mapped to `./*`.

### 4.2 ESLint (`eslint.config.mjs`)
Uses the modern ESLint flat config format leveraging `next/core-web-vitals` rules:
```javascript
import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({ baseDirectory: __dirname });
const eslintConfig = [...compat.extends("next/core-web-vitals", "next/typescript")];

export default eslintConfig;
```

---

## 5. Next.js 16 Version-Specific Directives

> [!CAUTION]
> **Next.js 16 Agent Rule:** Next.js 16 contains breaking changes compared to earlier major versions. Prior to introducing new API routes, dynamic server functions, or layout patterns, AI agents must inspect documentation in `node_modules/next/dist/docs/`.
