---
id: ki-pwa-and-offline
title: PWA Architecture, Offline Caching & Service Worker
description: Architectural documentation for Progressive Web App (PWA) features, Service Worker caching strategies, web application manifest, and client registration.
type: pwa
category: infrastructure
tags:
  - pwa
  - service-worker
  - offline
  - web-manifest
  - caching
sources:
  - public/sw.js
  - public/manifest.json
  - app/register-sw.tsx
  - app/layout.tsx
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

# KI-04: PWA Architecture, Offline Caching & Service Worker

## 1. Overview

**DailyForest** (formerly Weekly Tracker) is configured as a standalone **Progressive Web App (PWA)** capable of being installed on iOS, Android, and Desktop operating systems. It provides offline capabilities via a dedicated Service Worker caching shell assets and network-first navigation fallback.

---

## 2. PWA Web Manifest Configuration (`public/manifest.json`)

The Web App Manifest located at [public/manifest.json](../public/manifest.json) specifies the metadata for native platform installation:

```json
{
  "name": "DailyForest — Daily & Weekly Planner",
  "short_name": "DailyForest",
  "description": "Plan your day and week beautifully. A free, open-source planner with shareable calendars, time-blocking, and offline support.",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#E8E6DC",
  "theme_color": "#2D5F3E",
  "orientation": "portrait-primary",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any" },
    { "src": "/icon-maskable.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ],
  "screenshots": [
    { "src": "/screenshot-mobile.png", "sizes": "390x844", "type": "image/png", "form_factor": "narrow", "label": "DailyForest - Mobile View" },
    { "src": "/screenshot-desktop.png", "sizes": "1920x1080", "type": "image/png", "form_factor": "wide", "label": "DailyForest - Desktop View" }
  ]
}
```

---

## 3. Service Worker Implementation (`public/sw.js`)

The service worker in [public/sw.js](../public/sw.js) handles offline shell caching and cache version invalidation.

### 3.1 Cache Lifecycle Events

1. **Install (`CACHE_NAME = 'weekly-tracker-v1'`):** Pre-caches the root document `/` and `/manifest.json`.
```javascript
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});
```

2. **Fetch Interception (Network First for Navigations, Cache First for Assets):** Page navigations (`mode === 'navigate'`) use Network-First strategy so normal reloads fetch fresh server HTML; assets use Cache-First with offline fallback.
```javascript
self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
          }
          return response;
        })
        .catch(() => caches.match(event.request).then((res) => res || caches.match('/')))
    );
    return;
  }
  event.respondWith(
    caches.match(event.request).then((response) => response || fetch(event.request))
  );
});
```

3. **Activate (Cache Cleanup):** Deletes outdated cache instances when `CACHE_NAME` version string changes.

---

## 4. Client-Side Service Worker Registration (`app/register-sw.tsx`)

Service worker registration is handled safely inside a client component rendered in [app/layout.tsx](../app/layout.tsx). In development (`NODE_ENV === 'development'`), active service workers are automatically unregistered to prevent stale cache interference:

```tsx
'use client'
import { useEffect } from 'react'

export default function RegisterSW() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      if (process.env.NODE_ENV === 'development') {
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          for (const registration of registrations) {
            registration.unregister()
          }
        })
      } else {
        window.addEventListener('load', () => {
          navigator.serviceWorker.register('/sw.js')
        })
      }
    }
  }, [])
  return null
}
```


---

## 5. iOS & Android Native Web App Metadata

Configured in `metadata` in [app/layout.tsx](../app/layout.tsx):
- `appleWebApp`: Enables native iOS web application mode (`capable: true`, `statusBarStyle: "default"`).
- `viewport`: Restricts scale zooming to maintain app-like responsiveness (`initialScale: 1`, `maximumScale: 1`).
