import en from '../i18n/locales/en.json'
import es from '../i18n/locales/es.json'
import { LANGUAGES } from '../i18n'
import { LESSONS } from '../lessons'

function keys(obj: object, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([k, v]) =>
    v && typeof v === 'object' ? keys(v, `${prefix}${k}.`) : [`${prefix}${k}`],
  )
}

function localizedHoles(value: unknown, path: string): string[] {
  if (!value || typeof value !== 'object') return []
  if (Array.isArray(value)) return value.flatMap((v, i) => localizedHoles(v, `${path}[${i}]`))
  const obj = value as Record<string, unknown>
  const isLocalized = Object.keys(obj).some((k) => (LANGUAGES as readonly string[]).includes(k))
  if (isLocalized) {
    return LANGUAGES.filter((l) => typeof obj[l] !== 'string' || !(obj[l] as string).trim()).map(
      (l) => `${path}.${l}`,
    )
  }
  return Object.entries(obj).flatMap(([k, v]) => localizedHoles(v, `${path}.${k}`))
}

describe('bilingual content', () => {
  it('has the same UI keys in English and Spanish', () => {
    expect(keys(es).sort()).toEqual(keys(en).sort())
  })

  it('has every lesson text in every language', () => {
    for (const lesson of LESSONS) expect(localizedHoles(lesson, lesson.id)).toEqual([])
  })

  it('has valid quiz answers and unique step ids', () => {
    for (const lesson of LESSONS) {
      const ids = lesson.steps.map((s) => s.id)
      expect(new Set(ids).size).toBe(ids.length)
      for (const s of lesson.steps) {
        if (s.kind === 'predict' || s.kind === 'investigate') {
          expect(s.answer).toBeGreaterThanOrEqual(0)
          expect(s.answer).toBeLessThan(s.choices.length)
        }
      }
    }
  })
})
