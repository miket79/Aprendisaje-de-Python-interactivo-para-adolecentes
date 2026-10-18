import { CheckCircle2, Lock, PlayCircle } from 'lucide-react'
import { motion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { Mascot } from '../components/Mascot'
import { toLang } from '../i18n'
import { CURRICULUM } from '../lessons/curriculum'
import { getLesson } from '../lessons'
import { useProgress } from '../store/progress'
import { useTerms } from '../store/terms'

export function HomePage() {
  const { t, i18n } = useTranslation()
  const lang = toLang(i18n.resolvedLanguage)
  const completed = useProgress((s) => s.completed)
  const showTerms = useTerms((s) => s.show)

  return (
    <main className="mx-auto max-w-5xl px-4 pb-16 pt-8">
      <section className="mb-10 flex flex-col items-center gap-6 sm:flex-row">
        <Mascot className="h-40 w-auto shrink-0" />
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            {t('app.title')}
          </h1>
          <p className="mt-2 text-xl text-slate-600">{t('app.tagline')}</p>
        </div>
      </section>

      <ol className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {CURRICULUM.map((info, i) => {
          const lesson = getLesson(info.day)
          const done = lesson ? (completed[lesson.id]?.length ?? 0) : 0
          const total = lesson?.steps.length ?? 0
          const finished = lesson !== undefined && done >= total
          const label = finished
            ? t('home.review')
            : done > 0
              ? t('home.continue')
              : t('home.start')
          const card = (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.02, 0.4) }}
              className={`flex h-full flex-col rounded-2xl p-4 shadow-sm ring-1 transition ${
                lesson
                  ? 'bg-white ring-slate-200 hover:-translate-y-0.5 hover:shadow-md'
                  : 'bg-slate-100/70 text-slate-400 ring-slate-200'
              }`}
            >
              <span className="text-xs font-semibold uppercase tracking-wider text-py-blue">
                {t('home.day', { n: info.day })}
              </span>
              <span className={`mt-1 font-semibold ${lesson ? 'text-slate-900' : ''}`}>
                {info.title[lang]}
              </span>
              <span className="mt-auto flex items-center gap-1 pt-3 text-sm">
                {lesson ? (
                  finished ? (
                    <>
                      <CheckCircle2 size={16} className="text-emerald-500" aria-hidden /> {label}
                    </>
                  ) : (
                    <>
                      <PlayCircle size={16} className="text-py-blue" aria-hidden /> {label}
                    </>
                  )
                ) : (
                  <>
                    <Lock size={14} aria-hidden /> {t('home.soon')}
                  </>
                )}
              </span>
              {lesson && done > 0 && (
                <span className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <span
                    className="block h-full bg-emerald-400"
                    style={{ width: `${(done / total) * 100}%` }}
                  />
                </span>
              )}
            </motion.div>
          )
          return (
            <li key={info.day}>
              {lesson ? (
                <Link
                  to={`/day/${info.day}`}
                  className="block h-full rounded-2xl focus-visible:outline-3 focus-visible:outline-py-blue"
                >
                  {card}
                </Link>
              ) : (
                card
              )}
            </li>
          )
        })}
      </ol>

      <footer className="mt-12 space-y-2 text-center text-sm text-slate-500">
        <p>
          {t('home.credit')}{' '}
          <a
            className="underline hover:text-slate-700"
            href="https://github.com/Asabeneh/30-Days-Of-Python"
            target="_blank"
            rel="noreferrer"
          >
            github.com/Asabeneh/30-Days-Of-Python
          </a>
        </p>
        <button type="button" onClick={showTerms} className="underline hover:text-slate-700">
          {t('terms.link')}
        </button>
      </footer>
    </main>
  )
}
