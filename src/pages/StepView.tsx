import { Lightbulb } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CodePlayground } from '../components/CodePlayground'
import { Markdown } from '../components/Markdown'
import type { MascotMood } from '../components/Mascot'
import type { Lang } from '../i18n'
import { passesCheck } from '../lessons/checks'
import { pick, type CodeTaskStep, type QuizStep, type RunStep, type Step } from '../lessons/types'

interface Common {
  lang: Lang
  solved: boolean
  onSolved: () => void
  onMood: (mood: MascotMood) => void
}

/** The interactive part of one lesson step (quiz, run, modify, make). */
export function StepView({ step, ...common }: Common & { step: Step }) {
  switch (step.kind) {
    case 'intro':
      return null
    case 'predict':
    case 'investigate':
      return <QuizView step={step} {...common} />
    case 'run':
      return <RunView step={step} {...common} />
    case 'modify':
    case 'make':
      return <TaskView step={step} {...common} />
  }
}

function QuizView({ step, lang, solved, onSolved, onMood }: Common & { step: QuizStep }) {
  const { t } = useTranslation()
  const [picked, setPicked] = useState<number | null>(null)

  const choose = (i: number) => {
    setPicked(i)
    if (i === step.answer) onSolved()
    else onMood('thinking')
  }

  return (
    <div className="space-y-4">
      <CodePlayground initialCode={pick(step.code, lang)} readOnly showRun={false} />
      <div className="grid gap-2" role="radiogroup">
        {step.choices.map((choice, i) => {
          const isRight = i === step.answer
          const state =
            picked === i ? (isRight ? 'right' : 'wrong') : solved && isRight ? 'right' : 'idle'
          return (
            <button
              key={i}
              type="button"
              role="radio"
              aria-checked={picked === i}
              disabled={solved}
              onClick={() => choose(i)}
              className={`rounded-xl px-4 py-3 text-left font-mono text-[15px] ring-2 transition ${
                state === 'right'
                  ? 'bg-emerald-50 ring-emerald-400'
                  : state === 'wrong'
                    ? 'bg-rose-50 ring-rose-300'
                    : 'bg-white ring-slate-200 hover:ring-py-blue'
              }`}
            >
              {choice[lang]}
            </button>
          )
        })}
      </div>
      {picked !== null && !solved && (
        <p className="font-medium text-rose-600">{t('lesson.tryAgain')}</p>
      )}
      {solved && (
        <div className="rounded-xl bg-emerald-50 p-4 text-slate-700 ring-1 ring-emerald-200">
          <Markdown>{step.explain[lang]}</Markdown>
        </div>
      )}
    </div>
  )
}

function RunView({ step, lang, solved, onSolved }: Common & { step: RunStep }) {
  const { t } = useTranslation()
  return (
    <div className="space-y-2">
      <CodePlayground initialCode={pick(step.code, lang)} onResult={(r) => r.ok && onSolved()} />
      {!solved && <p className="text-sm text-slate-500">{t('lesson.runFirst')}</p>}
    </div>
  )
}

function TaskView({ step, lang, solved, onSolved, onMood }: Common & { step: CodeTaskStep }) {
  const { t } = useTranslation()
  const [wrong, setWrong] = useState(false)
  return (
    <div className="space-y-3">
      <CodePlayground
        initialCode={pick(step.code, lang)}
        onResult={(r) => {
          const ok = passesCheck(step.check, { code: r.code, stdout: r.stdout, ok: r.ok })
          setWrong(!ok)
          if (ok) onSolved()
          else onMood('thinking')
        }}
      />
      {wrong && !solved && <p className="font-medium text-rose-600">{t('lesson.tryAgain')}</p>}
      <details className="rounded-xl bg-amber-50 p-3 text-slate-700 ring-1 ring-amber-200">
        <summary className="flex cursor-pointer items-center gap-2 font-semibold text-amber-700">
          <Lightbulb size={16} aria-hidden /> {t('editor.hint')}
        </summary>
        <div className="mt-2">
          <Markdown>{step.hint[lang]}</Markdown>
        </div>
      </details>
    </div>
  )
}
