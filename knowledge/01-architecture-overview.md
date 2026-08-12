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
  timestamp: 2026-08-11T21:58:00+05:30
verified:
  by: daman
  date: 2026-08-11
  status: verified
stale_after: 2027-02-11
status: active
---

# KI-01: Architecture Overview & Technology Stack

## 1. Executive Summary

**DailyForest** (formerly Weekly Tracker) is an SEO-optimized, progressive web application (PWA) built with **Next.js 16.3.0**, **React 19.2.8**, and **Tailwind CSS v4**. It features a server-rendered SEO landing page, structured Schema.org JSON-LD data, dynamic Open Graph images, AI discoverability via `llms.txt`, and an interactive Studio Ghibli-themed weekly scheduler with shareable multi-tenant calendar routing (`/c/[calendarId]`).

---

## 2. Technology Stack & Versions

| Layer | Technology | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Framework** | Next.js (App Router) | `16.3.0` | React framework, SSR/SSG, routing, metadata API & `next/og` |
| **UI Library** | React / React DOM | `19.2.8` | Core component architecture and state management |
| **Styling** | Tailwind CSS | `^4.0.0` | Utility-first styling via PostCSS v4 (`@import "tailwindcss"`) |
| **Typography** | `next/font/google` | Built-in | Optimized font loader (`Outfit`, `Nunito`, `Caveat` handwritten font) |
| **Language** | TypeScript | `^5.0.0` | Type safety and interface contracts |
| **SEO & Discoverability** | Schema.org JSON-LD | Custom | Rich snippets (`Organization`, `WebSite`, `WebApplication`, `Breadcrumbs`) |
| **Offline / PWA** | Web Service Worker | Custom (`/sw.js`) | Offline shell caching and PWA installation |

---

## 3. Directory & File Architecture

```
weekly-tracker/
├── app/
│   ├── c/
│   │   ├── [calendarId]/    # Calendar workspace routes
│   │   │   ├── layout.tsx   # Calendar metadata & noindex rule
│   │   │   ├── opengraph-image.tsx # Dynamic shared calendar OG image
│   │   │   └── page.tsx     # Single-planner interactive scheduler client component
│   │   └── new/
│   │       └── page.tsx     # Calendar ID generator server component (redirects to /c/{id})
│   ├── favicon.ico
│   ├── globals.css         # Tailwind v4 import, theme CSS variables, dark mode settings
│   ├── layout.tsx          # Root layout, font loader, site-wide SEO metadataBase & defaults
│   ├── opengraph-image.tsx # Root landing page OG image (1200x630)
│   ├── twitter-image.tsx   # Twitter summary_large_image card
│   ├── page.tsx            # Server-rendered DailyForest SEO landing page
│   ├── robots.ts           # Crawl control rules (allows /, disallows /c/ & /api/)
│   ├── sitemap.ts          # XML sitemap generator
│   └── register-sw.tsx     # Client-side Service Worker registration component
├── components/
│   ├── JsonLd.tsx          # Schema.org structured data component
│   └── ...                 # UI components
├── public/
│   ├── llms.txt            # AI model discoverability documentation
│   ├── manifest.json       # DailyForest PWA Web App Manifest
│   ├── sw.js               # Cache-first service worker implementation
│   └── ...                 # Artwork & screenshot assets
```

---

## 4. Architectural Patterns & Decisions

### 4.1 Hybrid Server/Client Architecture
- **Root Landing Page (`app/page.tsx`)**: Fully server-rendered for optimal LCP performance, indexing, and SEO meta tags.
- **Calendar Workspace (`app/c/[calendarId]/page.tsx`)**: Interactive `'use client'` component operating with local state, SSE stream updates, and passcode protection.
- **Generator Route (`app/c/new/page.tsx`)**: Server-side redirect producing cryptographically random nanoid calendar tokens.
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
