import { useEffect, useSyncExternalStore } from 'react'
import { python } from './runner'

/** React access to the shared Python runtime. Starts loading Python on first use. */
export function usePython() {
  const status = useSyncExternalStore(
    (cb) => python.subscribe(cb),
    () => python.getStatus(),
  )
  useEffect(() => {
    void python.preload().catch(() => {})
  }, [])
  return { status, run: python.run.bind(python) }
}
