'use client'

import { useEffect } from 'react'

export default function RegisterSW() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      if (process.env.NODE_ENV === 'development') {
        // Unregister service worker in development mode to prevent stale page caching
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          for (const registration of registrations) {
            registration.unregister()
          }
        })
      } else {
        let refreshing = false

        // Proactively purge legacy caches directly from window context
        if ('caches' in window) {
          caches.keys().then((keys) => {
            keys.forEach((key) => {
              if (key !== 'dailyforest-v4') {
                caches.delete(key)
              }
            })
          })
        }

        // Automatically reload the page once the new Service Worker activates and takes control
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          if (!refreshing) {
            refreshing = true
            window.location.reload()
          }
        })

        let currentRegistration: ServiceWorkerRegistration | null = null

        const registerAndCheck = async () => {
          try {
            currentRegistration = await navigator.serviceWorker.register('/sw.js')

            if (currentRegistration.waiting) {
              currentRegistration.waiting.postMessage({ type: 'SKIP_WAITING' })
            }

            currentRegistration.addEventListener('updatefound', () => {
              const newWorker = currentRegistration?.installing
              if (newWorker) {
                newWorker.addEventListener('statechange', () => {
                  if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    newWorker.postMessage({ type: 'SKIP_WAITING' })
                  }
                })
              }
            })

            // Proactively check for byte updates to sw.js on PWA launch
            currentRegistration.update().catch(() => {})
          } catch (error) {
            console.error('SW registration failed: ', error)
          }
        }

        // Re-check for updates whenever the PWA is resumed/focused
        const handleVisibilityChange = () => {
          if (document.visibilityState === 'visible' && currentRegistration) {
            currentRegistration.update().catch(() => {})
          }
        }

        document.addEventListener('visibilitychange', handleVisibilityChange)

        if (document.readyState === 'complete') {
          registerAndCheck()
        } else {
          window.addEventListener('load', registerAndCheck)
        }

        return () => {
          window.removeEventListener('load', registerAndCheck)
          document.removeEventListener('visibilitychange', handleVisibilityChange)
        }
      }
    }
  }, [])

  return null
}

