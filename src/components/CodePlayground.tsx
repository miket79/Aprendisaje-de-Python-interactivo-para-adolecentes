import { python } from '@codemirror/lang-python'
import CodeMirror from '@uiw/react-codemirror'
import { Play, RotateCcw } from 'lucide-react'
import { useState, type KeyboardEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { errorType, type RunResult } from '../python/runner'
import { usePython } from '../python/usePython'

const EXTENSIONS = [python()]

export interface PlaygroundResult extends RunResult {
  code: string
}

interface Props {
  initialCode: string
  readOnly?: boolean
  showRun?: boolean
  onResult?: (result: PlaygroundResult) => void
}

/** Code editor + Run button + output console. Ctrl/Cmd+Enter also runs. */
export function CodePlayground({ initialCode, readOnly = false, showRun = true, onResult }: Props) {
  const { t, i18n } = useTranslation()
  const { status, run } = usePython()
  const [code, setCode] = useState(initialCode)
  const [live, setLive] = useState('')
  const [result, setResult] = useState<RunResult | null>(null)
  const [loadFailed, setLoadFailed] = useState(false)

  const busy = status === 'loading' || status === 'running'

  const handleRun = async () => {
    if (busy) return
    setLive('')
    setResult(null)
    setLoadFailed(false)
    let r: RunResult
    try {
      r = await run(code, { onStdout: (text) => setLive((prev) => prev + text + '\n') })
    } catch {
      setLoadFailed(true) // Python couldn't start; the learner can simply try again
      return
    }
    setResult(r)
    onResult?.({ ...r, code })
  }
  // Ctrl/Cmd+Enter runs the code. Captured before CodeMirror sees the key.
  const onKeyDownCapture = (e: KeyboardEvent) => {
    if (showRun && e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      e.stopPropagation()
      void handleRun()
    }
  }

  const type = result?.error ? errorType(result.error) : null
  const friendly = type && i18n.exists(`errors.${type}`) ? t(`errors.${type}`) : t('errors.generic')
  const output = result ? result.stdout : live

  return (
    <div
      className="overflow-hidden rounded-2xl bg-white shadow-md ring-1 ring-slate-200"
      onKeyDownCapture={onKeyDownCapture}
    >
      <CodeMirror
        value={code}
        onChange={setCode}
        readOnly={readOnly}
        editable={!readOnly}
        extensions={EXTENSIONS}
        basicSetup={{ foldGutter: false, highlightActiveLine: !readOnly }}
        minHeight="5.5rem"
        aria-label={t('editor.label')}
        className="text-[15px]"
      />
      {showRun && (
        <div className="flex items-center gap-2 border-t border-slate-200 bg-slate-50 px-3 py-2">
          <button
            type="button"
            onClick={() => void handleRun()}
            disabled={busy}
            className="flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 font-semibold text-white shadow hover:bg-emerald-600 disabled:cursor-wait disabled:opacity-60"
          >
            <Play size={16} aria-hidden />
            {status === 'loading'
              ? t('editor.loading')
              : status === 'running'
                ? t('editor.running')
                : t('editor.run')}
          </button>
          {!readOnly && (
            <button
              type="button"
              onClick={() => {
                setCode(initialCode)
                setResult(null)
                setLive('')
              }}
              className="flex items-center gap-1 rounded-xl px-3 py-2 text-sm text-slate-600 hover:bg-slate-200"
            >
              <RotateCcw size={14} aria-hidden /> {t('editor.reset')}
            </button>
          )}
          <kbd className="ml-auto hidden text-xs text-slate-400 sm:block">Ctrl/⌘ + Enter</kbd>
        </div>
      )}
      {showRun && (
        <div
          className="border-t border-slate-800 bg-slate-900 px-4 py-3 font-mono text-sm text-slate-100"
          aria-live="polite"
        >
          <div className="mb-1 text-xs uppercase tracking-wider text-slate-400">
            {t('editor.output')}
          </div>
          <pre className="whitespace-pre-wrap" data-testid="output">
            {output ||
              (!result?.error && !result?.timedOut && (
                <span className="text-slate-500">{t('editor.empty')}</span>
              ))}
          </pre>
          {result?.error && (
            <>
              <pre className="mt-2 whitespace-pre-wrap text-rose-300">{result.error}</pre>
              <p className="mt-2 rounded-lg bg-rose-500/15 p-2 font-sans text-rose-100">
                <strong>{t('errors.intro')}</strong> {friendly}
              </p>
            </>
          )}
          {loadFailed && <p className="mt-2 font-sans text-amber-300">{t('editor.loadError')}</p>}
          {result?.timedOut && (
            <p className="mt-2 font-sans text-amber-300">{t('editor.timeout')}</p>
          )}
        </div>
      )}
    </div>
  )
}
