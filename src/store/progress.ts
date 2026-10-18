import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

/**
 * Learner progress, saved only in this browser (localStorage).
 * No accounts and no personal data leave the device: privacy-friendly by design.
 */
interface ProgressState {
  xp: number
  streak: number
  lastActiveDay: string | null
  /** lessonId -> finished step ids */
  completed: Record<string, string[]>
  voiceOn: boolean
  /** Awards XP once per step. Returns true if it was new. */
  completeStep: (lessonId: string, stepId: string, xp: number) => boolean
  toggleVoice: () => void
  reset: () => void
}

export function localDay(date = new Date()): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** Streak rule: same day = unchanged, next day = +1, any gap = back to 1. */
export function nextStreak(lastDay: string | null, today: string, streak: number): number {
  if (lastDay === today) return Math.max(streak, 1)
  if (!lastDay) return 1
  const diffDays = Math.round(
    (Date.parse(`${today}T12:00:00`) - Date.parse(`${lastDay}T12:00:00`)) / 86_400_000,
  )
  return diffDays === 1 ? streak + 1 : 1
}

const initial = { xp: 0, streak: 0, lastActiveDay: null, completed: {}, voiceOn: true }

export const useProgress = create<ProgressState>()(
  persist(
    (set, get) => ({
      ...initial,
      completeStep: (lessonId, stepId, xp) => {
        const done = get().completed[lessonId] ?? []
        if (done.includes(stepId)) return false
        const today = localDay()
        set((s) => ({
          xp: s.xp + xp,
          streak: nextStreak(s.lastActiveDay, today, s.streak),
          lastActiveDay: today,
          completed: { ...s.completed, [lessonId]: [...done, stepId] },
        }))
        return true
      },
      toggleVoice: () => set((s) => ({ voiceOn: !s.voiceOn })),
      reset: () => set(initial),
    }),
    { name: 'pq-progress', version: 1, storage: createJSONStorage(() => localStorage) },
  ),
)
