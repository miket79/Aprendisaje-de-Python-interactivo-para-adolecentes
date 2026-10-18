import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next } from 'react-i18next'
import en from './locales/en.json'
import es from './locales/es.json'

export const LANGUAGES = ['en', 'es'] as const
export type Lang = (typeof LANGUAGES)[number]

export const LANGUAGE_LABELS: Record<Lang, string> = { en: 'English', es: 'Español' }

/** Speech-synthesis locale used for the browser fallback voice. */
export const SPEECH_LOCALE: Record<Lang, string> = { en: 'en-US', es: 'es-US' }

export function toLang(value: string | undefined): Lang {
  return value?.startsWith('es') ? 'es' : 'en'
}

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: { en: { translation: en }, es: { translation: es } },
    // English first (project preference). Spanish only when the learner picks it
    // or opens the app with ?lang=es. The choice is remembered on this device.
    fallbackLng: 'en',
    supportedLngs: [...LANGUAGES],
    nonExplicitSupportedLngs: true,
    detection: {
      order: ['querystring', 'localStorage'],
      lookupQuerystring: 'lang',
      lookupLocalStorage: 'pq-lang',
      caches: ['localStorage'],
    },
    interpolation: { escapeValue: false },
  })

const syncHtmlLang = (lng: string) => {
  if (typeof document !== 'undefined') document.documentElement.lang = toLang(lng)
}
syncHtmlLang(i18n.language)
i18n.on('languageChanged', syncHtmlLang)

export default i18n
