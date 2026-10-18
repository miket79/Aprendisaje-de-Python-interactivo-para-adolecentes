import { useTranslation } from 'react-i18next'
import { LANGUAGES, toLang } from '../i18n'

/** EN | ES switch. The choice is remembered on this device. */
export function LanguageToggle() {
  const { t, i18n } = useTranslation()
  const current = toLang(i18n.resolvedLanguage)
  return (
    <div
      role="group"
      aria-label={t('nav.language')}
      className="flex rounded-full bg-white/70 p-1 shadow-sm ring-1 ring-slate-200"
    >
      {LANGUAGES.map((lng) => (
        <button
          key={lng}
          type="button"
          aria-pressed={current === lng}
          onClick={() => void i18n.changeLanguage(lng)}
          className={`rounded-full px-3 py-1 text-sm font-semibold uppercase transition ${
            current === lng ? 'bg-py-blue text-white' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          {lng}
        </button>
      ))}
    </div>
  )
}
