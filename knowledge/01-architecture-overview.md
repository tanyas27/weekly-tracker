---
id: ki-architecture-overview
title: Architecture Overview & Technology Stack
description: Detailed architectural specification of the Weekly Tracker application, including Next.js 16 App Router, React 19 Client Components, font rendering, and layout structure.
type: architecture
category: system-design
tags:
  - nextjs16
  - react19
  - app-router
  - fonts
  - client-components
sources:
  - app/layout.tsx
  - app/page.tsx
  - app/register-sw.tsx
  - package.json
  - tsconfig.json
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

# KI-01: Architecture Overview & Technology Stack

## 1. Executive Summary

**Weekly Tracker** is a client-side progressive web application (PWA) built with **Next.js 16.3.0**, **React 19.2.8**, and **Tailwind CSS v4**. It features an interactive, Studio Ghibli-themed weekly scheduler with glassmorphism UI cards, real-time time line indicators, task drag-and-drop/edit modals, dark/light theme switching, dynamic progress computation, and local storage persistence.

---

## 2. Technology Stack & Versions

| Layer | Technology | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Framework** | Next.js (App Router) | `16.3.0` | React framework, SSR/SSG, routing, & font optimization |
| **UI Library** | React / React DOM | `19.2.8` | Core component architecture and state management |
| **Styling** | Tailwind CSS | `^4.0.0` | Utility-first styling via PostCSS v4 (`@import "tailwindcss"`) |
| **Typography** | `next/font/google` | Built-in | Optimized font loader (`Caveat` handwritten font) |
| **Language** | TypeScript | `^5.0.0` | Type safety and interface contracts |
| **Offline / PWA** | Web Service Worker | Custom (`/sw.js`) | Offline shell caching and PWA installation |

---

## 3. Directory & File Architecture

```
weekly-tracker/
├── app/
│   ├── favicon.ico
│   ├── globals.css         # Tailwind v4 import, theme CSS variables, dark mode settings
│   ├── layout.tsx          # Root layout, Caveat font loader, metadata, RegisterSW component
│   ├── page.tsx            # Primary single-page client component (Home component & scheduler logic)
│   └── register-sw.tsx     # Client-side Service Worker registration component
├── public/
│   ├── bcg.avif             # Background texture/artwork image
│   ├── totoro.jpeg          # Ghibli artwork decoration image
│   ├── manifest.json        # PWA Web App Manifest configuration
│   ├── sw.js                # Cache-first service worker implementation
│   ├── icon.svg             # App SVG icon
│   └── screenshot-*.png/svg # Mobile and desktop app screenshots for PWA installation
├── .vscode/
│   └── settings.json        # Workspace specific settings
├── knowledge/               # Google OKF 0.2 Knowledge Base
│   ├── index.md             # Master Knowledge Index
│   └── ...                  # KI files
├── AGENTS.md                # System & custom AI Agent Instructions
├── package.json             # Dependencies and build scripts
├── next.config.ts           # Next.js configuration
└── tsconfig.json            # TypeScript compiler rules
```

---

## 4. Architectural Patterns & Decisions

### 4.1 Single-Page Architecture (`'use client'`)
The core user interface resides in [app/page.tsx](../app/page.tsx). It operates as a `'use client'` component due to its heavy reliance on interactive state:
- Real-time minute interval tickers (`setInterval`).
- Dynamic time-positioning algorithms (`getCurrentTimePosition`, `getTaskPosition`).
- Overlap detection and offset calculation for tasks occurring simultaneously.
- Client-side browser APIs (`localStorage`, `navigator.serviceWorker`, `window.innerWidth`).

### 4.2 Font Optimization & CSS Variables
Custom typography is handled natively via `next/font/google` in [app/layout.tsx](../app/layout.tsx):
```tsx
const handwritten = Caveat({
  variable: "--font-handwritten",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});
```
The font variable `--font-handwritten` is exposed to Tailwind CSS in [app/globals.css](../app/globals.css) via `@theme inline` mapping:
```css
@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-handwritten: var(--font-handwritten);
}
```

### 4.3 Root Layout Component Structure
The `RootLayout` in [app/layout.tsx](../app/layout.tsx) wraps the entire tree with:
1. PWA viewport settings (`device-width`, `initialScale: 1`).
2. Theme metadata (`themeColor: "#8FA9BA"`).
3. The `<RegisterSW />` component for automatic background service worker setup.
4. Clean HTML structural wrapper setting `font-handwritten` on `<body>`.

---

## 5. System Dependencies & Compatibility Matrix

> [!WARNING]
> **Next.js 16 Compatibility Notice:** Next.js 16 introduces updated APIs and breaking changes compared to earlier versions. Ensure any new route handlers or server functions follow the documentation in `node_modules/next/dist/docs/`.
