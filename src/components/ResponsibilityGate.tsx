import { ExternalLink, ShieldCheck } from 'lucide-react'
import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { toLang } from '../i18n'
import { hasAcceptedCurrentTerms, useTerms } from '../store/terms'
import { LanguageToggle } from './LanguageToggle'
import { Markdown } from './Markdown'
import { Mascot } from './Mascot'

export const ORIGINAL_REPO = 'https://github.com/Asabeneh/30-Days-Of-Python'

/**
 * Shows the personal-responsibility notice about the 30 Days Of Python content.
 * Nothing else renders until the learner accepts the current version.
 * The answer is stored only in this browser (see src/store/terms.ts).
 */
export function ResponsibilityGate({ children }: { children: ReactNode }) {
  const accepted = useTerms(hasAcceptedCurrentTerms)
  const viewing = useTerms((s) => s.viewing)

  if (!accepted) return <ResponsibilityDialog mode="required" />
  return (
    <>
      <div inert={viewing}>{children}</div>
      {viewing && <ResponsibilityDialog mode="review" />}
    </>
  )
}

function ResponsibilityDialog({ mode }: { mode: 'required' | 'review' }) {
  const { t, i18n } = useTranslation()
  const lang = toLang(i18n.resolvedLanguage)
  const accept = useTerms((s) => s.accept)
  const hide = useTerms((s) => s.hide)
  const acceptedAt = useTerms((s) => s.acceptedAt)
  const [checked, setChecked] = useState(false)
  const [declined, setDeclined] = useState(false)
  const titleId = useId()
  const checkId = useId()
  const heading = useRef<HTMLHeadingElement>(null)

  // Move focus into the dialog so keyboard and screen-reader users start here.
  useEffect(() => heading.current?.focus(), [declined])

  useEffect(() => {
    if (mode !== 'review') return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && hide()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [mode, hide])

  const originalLink = (
    <a
      href={ORIGINAL_REPO}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1 font-semibold text-py-blue underline"
    >
      {t('terms.original')} <ExternalLink size={14} aria-hidden />
    </a>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/60 p-4 backdrop-blur-sm sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="my-auto w-full max-w-xl rounded-3xl bg-white p-6 text-slate-700 shadow-2xl sm:p-8"
      >
        <div className="mb-4 flex items-center justify-between gap-4">
          <Mascot className="h-16 w-auto" mood={declined ? 'thinking' : 'happy'} />
          <LanguageToggle />
        </div>

        {declined ? (
          <div className="space-y-4">
            <h2
              id={titleId}
              ref={heading}
              tabIndex={-1}
              className="text-2xl font-bold text-slate-900 outline-none"
            >
              {t('terms.declinedTitle')}
            </h2>
            <p>{t('terms.declinedBody')}</p>
            <p>{originalLink}</p>
            <button
              type="button"
              onClick={() => setDeclined(false)}
              className="rounded-xl bg-py-blue px-5 py-3 font-semibold text-white shadow hover:brightness-110"
            >
              {t('terms.reviewAgain')}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <h2
              id={titleId}
              ref={heading}
              tabIndex={-1}
              className="flex items-center gap-2 text-2xl font-bold text-slate-900 outline-none"
            >
              <ShieldCheck className="text-py-blue" aria-hidden /> {t('terms.title')}
            </h2>
            <div className="leading-relaxed">
              <Markdown>{t('terms.body')}</Markdown>
            </div>
            <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900 ring-1 ring-amber-200">
              {t('terms.minors')}
            </p>
            <p className="text-sm">{originalLink}</p>

            {mode === 'review' ? (
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4">
                {acceptedAt && (
                  <span className="text-sm text-slate-500">
                    {t('terms.acceptedOn', {
                      date: new Date(acceptedAt).toLocaleDateString(
                        lang === 'es' ? 'es-US' : 'en-US',
                        {
                          dateStyle: 'long',
                        },
                      ),
                    })}
                  </span>
                )}
                <button
                  type="button"
                  onClick={hide}
                  className="ml-auto rounded-xl bg-py-blue px-5 py-3 font-semibold text-white shadow hover:brightness-110"
                >
                  {t('terms.close')}
                </button>
              </div>
            ) : (
              <div className="space-y-4 border-t border-slate-200 pt-4">
                <label
                  htmlFor={checkId}
                  className="flex cursor-pointer items-start gap-3 font-medium text-slate-900"
                >
                  <input
                    id={checkId}
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => setChecked(e.target.checked)}
                    className="mt-1 h-5 w-5 shrink-0 accent-py-blue"
                  />
                  {t('terms.checkbox')}
                </label>
                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => setDeclined(true)}
                    className="rounded-xl px-5 py-3 font-semibold text-slate-600 ring-1 ring-slate-300 hover:bg-slate-50"
                  >
                    {t('terms.decline')}
                  </button>
                  <button
                    type="button"
                    onClick={accept}
                    disabled={!checked}
                    className="rounded-xl bg-py-blue px-5 py-3 font-semibold text-white shadow hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {t('terms.accept')}
                  </button>
                </div>
                <p className="text-xs text-slate-500">{t('terms.savedLocally')}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
