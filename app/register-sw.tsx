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
        const registerAndCheck = async () => {
          try {
            const registration = await navigator.serviceWorker.register('/sw.js')
            // Proactively check for byte updates to sw.js on PWA launch
            registration.update()
          } catch (error) {
            console.error('SW registration failed: ', error)
          }
        }

        if (document.readyState === 'complete') {
          registerAndCheck()
        } else {
          window.addEventListener('load', registerAndCheck)
          return () => window.removeEventListener('load', registerAndCheck)
        }
      }
    }
  }, [])

  return null
}

