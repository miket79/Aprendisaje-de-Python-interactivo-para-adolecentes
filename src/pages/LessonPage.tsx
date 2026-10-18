import confetti from 'canvas-confetti'
import { ArrowLeft, ArrowRight, Pause, Volume2 } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router'
import { stripMarkdown, useVoiceOver, voiceUrl } from '../audio/useVoiceOver'
import { Markdown } from '../components/Markdown'
import { Mascot, type MascotMood } from '../components/Mascot'
import { toLang } from '../i18n'
import { getLesson } from '../lessons'
import { useProgress } from '../store/progress'
import { StepView } from './StepView'

export default function LessonPage() {
  const { day } = useParams()
  const lesson = getLesson(Number(day))
  const { t } = useTranslation()

  if (!lesson) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="text-lg">{t('lesson.notFound')}</p>
        <Link to="/" className="mt-4 inline-block font-semibold text-py-blue underline">
          {t('lesson.backToMap')}
        </Link>
      </main>
    )
  }
  return <LessonPlayer key={lesson.id} lessonId={lesson.id} day={lesson.day} />
}

function LessonPlayer({ lessonId, day }: { lessonId: string; day: number }) {
  const lesson = getLesson(day)!
  const { t, i18n } = useTranslation()
  const lang = toLang(i18n.resolvedLanguage)
  const { voiceOn, completeStep } = useProgress()
  const { play, stop, speaking } = useVoiceOver()

  const [index, setIndex] = useState(0)
  const [solvedSteps, setSolvedSteps] = useState<Set<string>>(new Set())
  const [mood, setMood] = useState<MascotMood>('happy')
  const [toast, setToast] = useState<string | null>(null)
  const [finished, setFinished] = useState(false)

  const step = lesson.steps[index]
  const isLast = index === lesson.steps.length - 1
  const solved = step.kind === 'intro' || solvedSteps.has(step.id)
  const narration = step.voice?.[lang] ?? stripMarkdown(step.body[lang])
  const totalXp = lesson.steps.reduce((sum, s) => sum + (s.xp ?? 10), 0)

  const speak = () => play(voiceUrl(lang, lessonId, step.id), narration, lang)

  // Narrate each step automatically when voice is on (and when the language changes).
  useEffect(() => {
    if (voiceOn) speak()
    else stop()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, lang, voiceOn])

  useEffect(() => {
    if (!toast) return
    const id = setTimeout(() => setToast(null), 1800)
    return () => clearTimeout(id)
  }, [toast])

  const award = (stepId: string, xp: number) => {
    if (completeStep(lessonId, stepId, xp)) setToast(t('lesson.correct', { xp }))
  }

  const handleSolved = () => {
    setSolvedSteps((prev) => new Set(prev).add(step.id))
    setMood('cheer')
    award(step.id, step.xp ?? 10)
    void confetti({
      particleCount: 60,
      spread: 70,
      origin: { y: 0.7 },
      disableForReducedMotion: true,
    })
    setTimeout(() => setMood('happy'), 1600)
  }

  const goNext = () => {
    if (step.kind === 'intro') award(step.id, step.xp ?? 5)
    if (isLast) {
      stop()
      setFinished(true)
      setMood('cheer')
      void confetti({
        particleCount: 160,
        spread: 100,
        origin: { y: 0.6 },
        disableForReducedMotion: true,
      })
      return
    }
    setMood('happy')
    setIndex((i) => i + 1)
  }

  if (finished) {
    return (
      <main className="mx-auto flex max-w-3xl flex-col items-center px-4 py-16 text-center">
        <Mascot mood="cheer" className="h-56 w-auto" />
        <h1 className="mt-6 text-3xl font-bold">{t('lesson.done', { xp: totalXp })}</h1>
        <Link
          to="/"
          className="mt-8 rounded-xl bg-py-blue px-6 py-3 font-semibold text-white shadow hover:brightness-110"
        >
          {t('lesson.backToMap')}
        </Link>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-5xl px-4 pb-24 pt-6">
      {/* progress */}
      <div className="mb-6 flex items-center gap-3">
        <Link
          to="/"
          aria-label={t('lesson.backToMap')}
          className="rounded-full p-2 text-slate-500 hover:bg-white"
        >
          <ArrowLeft size={20} />
        </Link>
        <div
          className="h-3 flex-1 overflow-hidden rounded-full bg-white ring-1 ring-slate-200"
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={lesson.steps.length}
          aria-valuenow={index + 1}
          aria-label={t('lesson.progress', { current: index + 1, total: lesson.steps.length })}
        >
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-py-blue to-sky-400"
            animate={{ width: `${((index + (solved ? 1 : 0.5)) / lesson.steps.length) * 100}%` }}
          />
        </div>
        <span className="text-sm text-slate-500">
          {t('lesson.progress', { current: index + 1, total: lesson.steps.length })}
        </span>
      </div>

      <div className="grid gap-6 md:grid-cols-[220px_1fr]">
        {/* guide */}
        <aside className="flex flex-row items-center gap-4 md:flex-col md:items-stretch">
          <div className="rounded-3xl bg-gradient-to-b from-amber-100 to-orange-200 p-4 shadow-inner">
            <Mascot talking={speaking} mood={mood} className="mx-auto h-36 w-auto md:h-52" />
          </div>
          <button
            type="button"
            onClick={() => (speaking ? stop() : speak())}
            className="flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2 font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200 hover:text-slate-900"
          >
            {speaking ? <Pause size={18} aria-hidden /> : <Volume2 size={18} aria-hidden />}
            {speaking ? t('lesson.stop') : t('lesson.listen')}
          </button>
        </aside>

        {/* step */}
        <AnimatePresence mode="wait">
          <motion.section
            key={`${step.id}-${lang}`}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.25 }}
            className="space-y-5"
          >
            <span className="inline-block rounded-full bg-py-yellow px-3 py-1 text-xs font-bold uppercase tracking-wider text-slate-900">
              {t(`lesson.stages.${step.kind}`)}
            </span>
            <h1 className="text-3xl font-bold text-slate-900">{step.title[lang]}</h1>
            <div className="text-lg leading-relaxed text-slate-700">
              <Markdown>{step.body[lang]}</Markdown>
            </div>
            <StepView
              step={step}
              lang={lang}
              solved={solved}
              onSolved={handleSolved}
              onMood={setMood}
            />
            <div className="flex justify-between pt-2">
              <button
                type="button"
                onClick={() => setIndex((i) => Math.max(0, i - 1))}
                disabled={index === 0}
                className="flex items-center gap-1 rounded-xl px-4 py-2 font-semibold text-slate-600 hover:bg-white disabled:invisible"
              >
                <ArrowLeft size={18} aria-hidden /> {t('lesson.back')}
              </button>
              <button
                type="button"
                onClick={goNext}
                disabled={!solved}
                className="flex items-center gap-1 rounded-xl bg-py-blue px-6 py-3 font-semibold text-white shadow hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isLast ? t('lesson.finish') : t('lesson.next')}{' '}
                <ArrowRight size={18} aria-hidden />
              </button>
            </div>
          </motion.section>
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {toast && (
          <motion.div
            role="status"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-emerald-500 px-5 py-2 font-semibold text-white shadow-lg"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  )
}
