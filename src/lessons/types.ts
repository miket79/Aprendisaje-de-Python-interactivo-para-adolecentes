import type { Lang } from '../i18n'

/** Text in every supported language. */
export type Localized = Record<Lang, string>

/** Code can be shared by both languages or localized (e.g. print("Hola")). */
export type CodeSource = string | Localized

/**
 * Lesson steps follow PRIMM (Predict → Run → Investigate → Modify → Make),
 * a research-backed sequence for teaching programming to secondary students.
 */
export type StageKind = 'intro' | 'predict' | 'run' | 'investigate' | 'modify' | 'make'

interface BaseStep {
  id: string
  kind: StageKind
  title: Localized
  /** Markdown shown on screen. */
  body: Localized
  /** What the narrator says. Defaults to `body` without Markdown. */
  voice?: Localized
  /** XP for finishing the step. */
  xp?: number
}

export interface IntroStep extends BaseStep {
  kind: 'intro'
}

export interface QuizStep extends BaseStep {
  kind: 'predict' | 'investigate'
  code: CodeSource
  choices: Localized[]
  answer: number
  explain: Localized
}

export interface RunStep extends BaseStep {
  kind: 'run'
  code: CodeSource
}

export interface OutputCheck {
  /** Each string must appear in the output (case-insensitive). */
  outputIncludes?: string[]
  /** Each string must appear in the code itself. */
  codeIncludes?: string[]
  /** Minimum number of non-empty output lines. */
  minLines?: number
  /** Output must differ from each of these (forces the learner to change something). */
  outputNot?: string[]
}

export interface CodeTaskStep extends BaseStep {
  kind: 'modify' | 'make'
  code: CodeSource
  check: OutputCheck
  hint: Localized
}

export type Step = IntroStep | QuizStep | RunStep | CodeTaskStep

export interface Lesson {
  id: string
  day: number
  title: Localized
  summary: Localized
  minutes: number
  steps: Step[]
}

export function pick<T extends string>(value: T | Record<Lang, T>, lang: Lang): T {
  return typeof value === 'string' ? value : value[lang]
}
