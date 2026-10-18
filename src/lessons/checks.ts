import type { OutputCheck } from './types'

export interface CheckInput {
  code: string
  stdout: string
  ok: boolean
}

/** Returns true when the learner's run satisfies every rule in `check`. */
export function passesCheck(check: OutputCheck, { code, stdout, ok }: CheckInput): boolean {
  if (!ok) return false
  const out = stdout.toLowerCase()
  const lines = stdout.split('\n').filter((l) => l.trim() !== '')

  if (check.outputIncludes?.some((s) => !out.includes(s.toLowerCase()))) return false
  if (check.codeIncludes?.some((s) => !code.includes(s))) return false
  if (check.minLines !== undefined && lines.length < check.minLines) return false
  if (check.outputNot?.some((s) => stdout.trim() === s.trim())) return false
  return lines.length > 0
}
