import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

/**
 * Version of the responsibility notice. Change it whenever the notice text
 * changes, so every device is asked to accept the new version.
 */
export const TERMS_VERSION = '2026-10-18'

interface TermsState {
  acceptedVersion: string | null
  acceptedAt: string | null
  /** Notice reopened from the "Responsibility notice" link (not persisted). */
  viewing: boolean
  accept: () => void
  show: () => void
  hide: () => void
}

export const useTerms = create<TermsState>()(
  persist(
    (set) => ({
      acceptedVersion: null,
      acceptedAt: null,
      viewing: false,
      accept: () =>
        set({
          acceptedVersion: TERMS_VERSION,
          acceptedAt: new Date().toISOString(),
          viewing: false,
        }),
      show: () => set({ viewing: true }),
      hide: () => set({ viewing: false }),
    }),
    {
      name: 'pq-terms',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: ({ acceptedVersion, acceptedAt }) => ({ acceptedVersion, acceptedAt }),
    },
  ),
)

export const hasAcceptedCurrentTerms = (s: Pick<TermsState, 'acceptedVersion'>) =>
  s.acceptedVersion === TERMS_VERSION
