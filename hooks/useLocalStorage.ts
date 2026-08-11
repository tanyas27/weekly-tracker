import { useEffect, useState } from 'react'

/**
 * Generic "load after mount, persist on change" state hook. Loading is deferred to a
 * post-mount effect (not the initial render) so server-rendered and first-client-render
 * markup match, avoiding Next.js hydration mismatches for any storage-backed value.
 *
 * `load`/`save` are injected so callers can back this with localStorage (raw or JSON),
 * or any other persistence helper (e.g. the functions in lib/notification-storage.ts)
 * without this hook needing to know the underlying storage key or serialization format.
 */
export function useLocalStorage<T>(defaultValue: T, load: () => T, save: (value: T) => void) {
  const [value, setValue] = useState<T>(defaultValue)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    // Deliberate post-mount sync from an external system (localStorage) to avoid hydration mismatches.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setValue(load())
    setIsLoaded(true)
    // Only run once on mount; `load` is expected to be stable (a module-level function).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (isLoaded) save(value)
    // Skip persisting on the initial (pre-load) render; `save` is expected to be stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, isLoaded])

  return [value, setValue, isLoaded] as const
}
