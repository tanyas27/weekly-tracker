---
id: ki-ui-ux-design-system
title: UI/UX & Design System Guidelines
description: Architectural and visual documentation of the Studio Ghibli aesthetic, glassmorphism UI tokens, responsive layouts, typography, and theme engines.
type: design-system
category: ui-ux
tags:
  - glassmorphism
  - ghibli-aesthetic
  - typography
  - dark-mode
  - responsive-design
  - sticky-notes
sources:
  - app/globals.css
  - app/layout.tsx
  - app/page.tsx
  - public/bcg.avif
  - public/totoro.jpeg
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

# KI-03: UI/UX & Design System Guidelines

## 1. Design Aesthetics & Visual Identity

The **Weekly Tracker** design system centers on a **hand-crafted, cozy Studio Ghibli aesthetic** combined with modern **glassmorphism web design**.

### 1.1 Key Aesthetic Characteristics
- **Background Texture**: Fixed full-viewport artwork overlay ([public/bcg.avif](../public/bcg.avif)) with adjustable opacity (Light: `0.7`, Dark: `0.3`).
- **Ghibli Companion Illustration**: Fixed bottom-left Totoro companion image ([public/totoro.jpeg](../public/totoro.jpeg)) styled with circular clipping and smooth opacity blend.
- **Dual Typography Strategy**: Google Fonts `Outfit` and `Nunito` applied as the primary base UI typography for maximum clarity across all headers, panels, drawers, toasts, and controls, while Google Font `Caveat` (`--font-handwritten`) is preserved specifically for sticky note task titles ([components/TaskCard.tsx](../components/TaskCard.tsx)) to maintain the authentic paper planner aesthetic.
- **Glassmorphism Panels**: Semi-transparent frosted glass containers (`backdrop-blur-md`) with soft light borders (`border-white/40` or `border-white/10`).
- **Playful Sticky Notes**: Tasks feature subtle random rotations (`-rotate-1`, `rotate-1`, `-rotate-2`, `rotate-2`) mimicking physical adhesive notes.

---

## 2. Color Palette & Theme Tokens

### 2.1 Theme Backgrounds
```css
/* Light Mode */
Background: #E8E6DC (Warm paper cream)
Card Surfaces: rgba(255, 255, 255, 0.40) with backdrop-blur-md
Text Main: #171717 / gray-900

/* Dark Mode */
Background: #1a1a1a (Deep charcoal slate)
Card Surfaces: rgba(31, 41, 55, 0.70) with backdrop-blur-md
Text Main: #ffffff / gray-100
```

### 2.2 Sticky-Note Task Colors (`COLORS`)

| Class | Hex Code | Visual Tone |
| :--- | :--- | :--- |
| `bg-[#FFF9C4]` | `#FFF9C4` | Soft Vanilla |
| `bg-[#FFE082]` | `#FFE082` | Warm Canary |
| `bg-[#FFCC80]` | `#FFCC80` | Sunlit Peach |
| `bg-[#FFAB91]` | `#FFAB91` | Warm Salmon |
| `bg-[#E1BEE7]` | `#E1BEE7` | Lavender Mist |
| `bg-[#F48FB1]` | `#F48FB1` | Pastel Pink |
| `bg-[#90CAF9]` | `#90CAF9` | Sky Blue |
| `bg-[#B39DDB]` | `#B39DDB` | Soft Violet |
| `bg-[#64B5F6]` | `#64B5F6` | Azure Blue |
| `bg-[#A5D6A7]` | `#A5D6A7` | Meadow Green |
| `bg-[#C5E1A5]` | `#C5E1A5` | Sage Green |
| `bg-[#E6EE9C]` | `#E6EE9C` | Lime Yellow |

---

## 3. Responsive Schedule Layout Architecture

### 3.1 Mobile vs. Desktop View Modes

```
+-----------------------------------------------------------------------+
|  DESKTOP VIEW (>= md: 768px)                                           |
|  Displays all 7 days side-by-side in a 7-column time grid             |
+----+--------+--------+--------+--------+--------+--------+------------+
|Time| MON 10 | TUE 11 | WED 12 | THU 13 | FRI 14 | SAT 15 | SUN 16     |
+----+--------+--------+--------+--------+--------+--------+------------+
|07:0| [Task] |        | [Task] |        |        |        |            |
|08:0|        | [Task] |        |        | [Task] |        |            |
+----+--------+--------+--------+--------+--------+--------+------------+

+-----------------------------------------------------------------------+
|  MOBILE VIEW (< md: 768px)                                            |
|  Single selected day column with quick prev/next navigation controls  |
+----+------------------------------------------------------------------+
|Time|< MON 10 > (Swipe / Button Navigation)                            |
+----+------------------------------------------------------------------+
|07:0| [Task]                                                           |
|08:0|                                                                  |
+----+------------------------------------------------------------------+
```

### 3.2 Dynamic Task Positioning & Overlap Resolution Math
Tasks are absolutely positioned within day containers:
```typescript
// Height & Top Offset Math (80px per hourly slot)
const startOffset = (startHour - 7) * 80;
// Minimum height of 46px ensures 0.25h and 0.5h short events render comfortably without clipping
const height = Math.max((duration * 80) - 8, 46);

// Overlap Side-by-Side Equal Column Math
// When N tasks overlap in time on the same day, split column width equally (100% / N)
const colWidthPercent = 100 / totalOverlaps;
const leftPercent = overlapIndex * colWidthPercent;
// Left position: calc(leftPercent% + 2px)
// Card width: calc(colWidthPercent% - 4px)

// Hover elevation: hover:z-50 hover:scale-105 elevates hovered task card to top layer
```

---

## 4. Key UI Components & Interactions

### 4.1 Circular SVG Overall Progress Indicator
Located in the header panel. Renders an SVG progress ring driven by `progressPercentage`:
```tsx
<svg className="w-10 h-10 transform -rotate-90">
  <circle cx="20" cy="20" r="16" fill="none" strokeWidth="3" ... />
  <circle
    cx="20" cy="20" r="16" fill="none" strokeWidth="3"
    strokeDasharray={`${(progressPercentage / 100) * 100.53} 100.53`}
    strokeLinecap="round"
  />
</svg>
```

### 4.2 Real-time Current Hour Marker
If the current time falls within `07:00 AM` to `12:00 AM`, an animated glowing red indicator line (`currentTimeTop`) with a pulsing endpoint dot spans across the current day column.

### 4.3 Task Modal (Add/Edit)
Glassmorphism modal dialog backdrop (`bg-black/30 backdrop-blur-sm`) featuring:
- Input for task name with autofocus.
- Day selection pills (`MON`..`SUN`) allowing multi-day selection.
- Time input (`startTime`) and numeric stepper for duration in quarter-hour increments (`step="0.25"`).
- Color selector pills representing `COLORS`.
- Delete button (when editing existing tasks).

### 4.5 Notification Center & Toast Glassmorphism Architecture
- **`isDark` Prop Propagation**: NotificationDrawer and ToastContainer explicitly consume the `isDark` boolean state from `app/page.tsx` rather than relying on system OS `@media (prefers-color-scheme: dark)` overrides.
- **Unified Theme Color Palette Standard**: Avoided clashing brown (`amber-700/800/900`) and harsh red (`red-600`) text/border accents. Integrated clean theme tokens matching the main application layout: sleek minimal water-blue glass pill badge (`bg-sky-500/15 border-sky-400/35 text-sky-900` light / `bg-sky-400/20 border-sky-400/35 text-sky-300` dark with `{unreadCount} new` label) for refined unread notifications, soft sky blue (`text-blue-400`/`bg-blue-500`) for dark mode active states, glass white buttons for read badges, and subtle muted grays for secondary action links.
- **Clean Sans Typography Standard**: Replaced script/handwritten fonts in notification headers and toast alerts with crisp, modern sans-serif headings (`text-xl font-bold tracking-tight text-gray-900 dark:text-gray-100`) for high readability.
- **Ultra-Translucent Light Theme**: Crystal sheer glass sheet (`bg-white/30 backdrop-blur-2xl backdrop-saturate-150 border-l border-white/50 shadow-[0_8px_32px_0_rgba(0,0,0,0.12)]`), frosted glass unread cards (`bg-white/50 border-white/70 backdrop-blur-md shadow-sm`), read cards (`bg-white/20 opacity-70`).
- **Ultra-Translucent Dark Theme**: Crystal sheer dark sheet (`bg-black/40 backdrop-blur-2xl backdrop-saturate-150 border-l border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.5)]`), translucent dark unread cards (`bg-white/10 border-white/15 backdrop-blur-md shadow-md`), read cards (`bg-white/5 opacity-60`).
- **Sheer Glass Toast Cards**: Ultra-translucent floating glass toasts (`bg-white/40 backdrop-blur-2xl border-white/60` in Light mode; `bg-black/50 backdrop-blur-2xl border-white/15` in Dark mode).


