import { RefreshCw, WifiOff, X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import { useRegisterSW } from 'virtual:pwa-register/react'

/**
 * Registers the service worker that caches the whole app (including Python)
 * so it works offline, and tells the learner when it's ready or updated.
 * Updates wait for a click, so nobody loses their place mid-lesson.
 */
export function PwaStatus() {
  const { t } = useTranslation()
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW()

  const close = () => {
    setOfflineReady(false)
    setNeedRefresh(false)
  }
  const visible = offlineReady || needRefresh

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          role="status"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 30 }}
          className="fixed bottom-4 left-4 z-40 flex max-w-sm items-center gap-3 rounded-2xl bg-slate-900 px-4 py-3 text-sm text-white shadow-xl"
        >
          {needRefresh ? (
            <RefreshCw size={18} className="shrink-0 text-sky-300" aria-hidden />
          ) : (
            <WifiOff size={18} className="shrink-0 text-emerald-300" aria-hidden />
          )}
          <span className="flex-1">
            {needRefresh ? t('pwa.updateAvailable') : t('pwa.offlineReady')}
          </span>
          {needRefresh && (
            <button
              type="button"
              onClick={() => void updateServiceWorker(true)}
              className="rounded-lg bg-sky-500 px-3 py-1 font-semibold hover:bg-sky-400"
            >
              {t('pwa.update')}
            </button>
          )}
          <button
            type="button"
            onClick={close}
            aria-label={t('pwa.dismiss')}
            className="rounded-lg p-1 hover:bg-white/10"
          >
            <X size={16} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
