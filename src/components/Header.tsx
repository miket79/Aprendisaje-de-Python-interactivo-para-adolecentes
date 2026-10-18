import { Download, Flame, Star, Volume2, VolumeX } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { installApp, useInstall } from '../pwa/install'
import { useProgress } from '../store/progress'
import { LanguageToggle } from './LanguageToggle'

export function Header() {
  const { t } = useTranslation()
  const { xp, streak, voiceOn, toggleVoice } = useProgress()
  const canInstall = useInstall((s) => s.deferred !== null && !s.installed)
  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-sky-50/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3">
        <Link to="/" className="mr-auto flex items-center gap-2 text-lg font-bold text-slate-900">
          <img src={`${import.meta.env.BASE_URL}favicon.svg`} alt="" className="h-8 w-8" />
          {t('app.title')}
        </Link>
        <span className="hidden items-center gap-1 rounded-full bg-white px-3 py-1 text-sm font-semibold text-amber-600 shadow-sm sm:flex">
          <Star size={16} aria-hidden /> {t('home.xp', { xp })}
        </span>
        {streak > 0 && (
          <span className="hidden items-center gap-1 rounded-full bg-white px-3 py-1 text-sm font-semibold text-orange-600 shadow-sm sm:flex">
            <Flame size={16} aria-hidden /> {t('home.streak', { count: streak })}
          </span>
        )}
        {canInstall && (
          <button
            type="button"
            onClick={() => void installApp()}
            title={t('pwa.installHint')}
            className="flex items-center gap-1 rounded-full bg-py-yellow px-3 py-1.5 text-sm font-semibold text-slate-900 shadow-sm hover:brightness-105"
          >
            <Download size={16} aria-hidden /> {t('pwa.install')}
          </button>
        )}
        <button
          type="button"
          onClick={toggleVoice}
          aria-pressed={voiceOn}
          aria-label={voiceOn ? t('nav.voiceOn') : t('nav.voiceOff')}
          title={voiceOn ? t('nav.voiceOn') : t('nav.voiceOff')}
          className="rounded-full bg-white p-2 text-slate-700 shadow-sm ring-1 ring-slate-200 hover:text-slate-900"
        >
          {voiceOn ? <Volume2 size={18} /> : <VolumeX size={18} />}
        </button>
        <LanguageToggle />
      </div>
    </header>
  )
}
