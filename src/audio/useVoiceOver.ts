import { Howl } from 'howler'
import { useCallback, useEffect, useRef, useState } from 'react'
import { SPEECH_LOCALE, type Lang } from '../i18n'

/** Where the voice-over tool (tools/tts) writes each clip. */
export function voiceUrl(lang: Lang, lessonId: string, stepId: string) {
  return `${import.meta.env.BASE_URL}audio/${lang}/${lessonId}/${stepId}.mp3`
}

/**
 * Plays pre-generated voice-over clips. If a clip hasn't been generated yet,
 * falls back to the browser's built-in speech so the lesson still talks.
 * `speaking` drives the mascot's mouth animation.
 */
export function useVoiceOver() {
  const [speaking, setSpeaking] = useState(false)
  const howl = useRef<Howl | null>(null)

  const stop = useCallback(() => {
    howl.current?.unload()
    howl.current = null
    if (typeof speechSynthesis !== 'undefined') speechSynthesis.cancel()
    setSpeaking(false)
  }, [])

  const speakWithBrowser = useCallback((text: string, lang: Lang) => {
    if (typeof speechSynthesis === 'undefined') return
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = SPEECH_LOCALE[lang]
    utterance.rate = 1
    utterance.onstart = () => setSpeaking(true)
    utterance.onend = () => setSpeaking(false)
    utterance.onerror = () => setSpeaking(false)
    speechSynthesis.speak(utterance)
  }, [])

  const play = useCallback(
    (src: string, fallbackText: string, lang: Lang) => {
      stop()
      const sound = new Howl({
        src: [src],
        format: ['mp3'],
        onplay: () => setSpeaking(true),
        onend: () => setSpeaking(false),
        onstop: () => setSpeaking(false),
        onloaderror: () => {
          if (howl.current === sound) speakWithBrowser(fallbackText, lang)
        },
        onplayerror: () => setSpeaking(false),
      })
      howl.current = sound
      sound.play()
    },
    [stop, speakWithBrowser],
  )

  useEffect(() => stop, [stop])

  return { play, stop, speaking }
}

/** Turns lesson Markdown into plain text for speech. */
export function stripMarkdown(md: string): string {
  return md
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]*)`/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/^\s*(?:[-*]|\d+\.)\s+/gm, '')
    .replace(/\s+/g, ' ')
    .trim()
}
