import day01 from '../content/lessons/day-01.json'
import type { Lesson } from './types'

/** Lesson content lives in src/content/lessons/*.json (also read by the voice-over tool). */
export const LESSONS: Lesson[] = [day01 as Lesson]

export function getLesson(day: number): Lesson | undefined {
  return LESSONS.find((l) => l.day === day)
}
