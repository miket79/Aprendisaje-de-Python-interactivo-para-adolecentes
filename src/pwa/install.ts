import { create } from 'zustand'

/** Chrome/Edge event that lets us show our own "Install app" button. */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

interface InstallState {
  deferred: BeforeInstallPromptEvent | null
  installed: boolean
}

const isStandalone = () =>
  typeof window !== 'undefined' &&
  (window.matchMedia?.('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true)

export const useInstall = create<InstallState>()(() => ({
  deferred: null,
  installed: isStandalone(),
}))

// Listen as early as possible: the browser can fire this before React renders.
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    useInstall.setState({ deferred: e as BeforeInstallPromptEvent })
  })
  window.addEventListener('appinstalled', () =>
    useInstall.setState({ deferred: null, installed: true }),
  )
}

/** Shows the browser's install dialog. Returns true if the learner installed the app. */
export async function installApp(): Promise<boolean> {
  const { deferred } = useInstall.getState()
  if (!deferred) return false
  await deferred.prompt()
  const { outcome } = await deferred.userChoice
  useInstall.setState({ deferred: null })
  return outcome === 'accepted'
}
