'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Mic, Send, Square, Volume2, X } from 'lucide-react'
import { useAssistant, type LodgeGuide } from '@/context/AssistantContext'
import { useAuth } from '@/context/AuthContext'
import { useRealtimeVoice, type LiveEvent } from '@/hooks/useRealtimeVoice'
import { useLanguage } from '@/context/LanguageContext'
import { api } from '@/lib/api'
import { unlockAudio } from '@/lib/voice'

type Msg = {
  role: 'user' | 'assistant'
  text: string
  pending?: boolean
}

function greetingFor(lang: string): Msg {
  return {
    role: 'assistant',
    text:
      lang === 'hi'
        ? 'नमस्ते। बोलिए, क्या हुआ? मैं साइन इन खोल सकती हूँ, फिर शिकायत इसी पोर्टल पर दर्ज कर दूँगी।'
        : 'Namaste. Tap Speak and tell me what happened. I can take you to Sign In, then lodge your grievance on this portal.',
  }
}

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

async function waitForGuide(getGuide: () => LodgeGuide | null, tries = 8) {
  for (let i = 0; i < tries; i += 1) {
    const guide = getGuide()
    if (guide) return guide
    await wait(250)
  }
  return null
}

export function Assistant() {
  const router = useRouter()
  const pathname = usePathname()
  const { user } = useAuth()
  const { lang, t } = useLanguage()
  const {
    open,
    setOpen,
    startVoice,
    consumeStartVoice,
    grievanceId,
    lodgeGuide,
    setPendingLodge,
    pendingLodge,
    activity,
  } = useAssistant()
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Msg[]>([greetingFor('en')])
  const [liveHint, setLiveHint] = useState('')
  const scroller = useRef<HTMLDivElement | null>(null)
  const startedVoiceRef = useRef(false)

  const onEvent = useCallback((event: LiveEvent) => {
    if (event.type === 'user' && event.text) {
      setMessages((current) => [...current.filter((m) => !m.pending || m.role === 'assistant'), { role: 'user', text: event.text || '' }])
    }
    if (event.type === 'status' && event.state === 'thinking') {
      setLiveHint(t('thinking'))
    }
    if (event.type === 'status' && event.state === 'listening') {
      setLiveHint(t('listenHint'))
    }
    if (event.type === 'status' && event.state === 'idle') {
      setLiveHint('')
      setMessages((current) => current.map((m) => ({ ...m, pending: false })))
    }
    if (event.type === 'token' && event.text) {
      setLiveHint('')
      setMessages((current) => {
        const last = current[current.length - 1]
        if (last?.role === 'assistant' && last.pending) {
          return [...current.slice(0, -1), { ...last, text: last.text + event.text }]
        }
        return [...current, { role: 'assistant', text: event.text || '', pending: true }]
      })
    }
    if (event.type === 'done' && event.reply) {
      setMessages((current) => {
        const last = current[current.length - 1]
        if (last?.role === 'assistant' && last.pending) {
          return [...current.slice(0, -1), { role: 'assistant', text: event.reply || last.text }]
        }
        if (last?.role === 'assistant' && last.text === event.reply) return current
        return [...current, { role: 'assistant', text: event.reply || '' }]
      })
    }
    if (event.type === 'error') {
      setLiveHint('')
      setMessages((current) => [
        ...current.filter((m) => !m.pending),
        { role: 'assistant', text: event.message || t('voiceProblem') },
      ])
    }
  }, [t])

  const runTool = useCallback(
    async (name: string, args: Record<string, string>) => {
      if (name === 'navigate') {
        const href = args.href || '/desk'
        router.push(href)
        await wait(350)
        return `Opened ${href}.`
      }

      if (name === 'login') {
        setPendingLodge(args.next || pendingLodge || '/desk/lodge')
        router.push('/auth/signin')
        await wait(350)
        return 'Opened Sign In. Do not fill mobile, password, or OTP. The citizen signs in themselves. After they sign in, continue lodging.'
      }

      if (name === 'route_complaint') {
        const problem = args.problem || ''
        const routing = await api.classify(problem)
        const params = new URLSearchParams({
          ministry: routing.ministry,
          category: routing.category,
          problem,
        })
        if (routing.playbook_id) params.set('playbook', routing.playbook_id)
        if (['true', '1', 'yes'].includes(String(args.helper || '').toLowerCase())) {
          params.set('helper', '1')
        }
        const href = `/grievance/lodge?${params.toString()}`
        if (!user) {
          setPendingLodge(href)
          router.push('/auth/signin')
          await wait(350)
          return (
            `Not signed in. Opened Sign In. Do not fill their credentials. After they sign in, continue lodging ` +
            `for ${routing.ministry}.`
          )
        }
        router.push(href)
        const guide = await waitForGuide(lodgeGuide, 16)
        if (guide) {
          if (user.name || user.mobile) {
            await guide.apply('set_who', { name: user.name || '', mobile: user.mobile || '', role: 'self' })
          }
          const filled = await guide.apply('set_playbook', {
            playbook: routing.playbook_id || 'general',
            problem,
          })
          return (
            `Lodge form is open and I am filling it. ${routing.reason} Typical wait ${routing.expected_days} days. ${filled} ` +
            `Keep asking and calling lodge. Do not tell them to type the remaining fields.`
          )
        }
        return 'Opened lodge. Call lodge snapshot once the form is ready, then keep filling it yourself.'
      }

      if (name === 'lodge') {
        if (!pathname.startsWith('/grievance/lodge')) {
          router.push('/grievance/lodge')
          await wait(400)
        }
        const guide = await waitForGuide(lodgeGuide, 16)
        if (!guide) return 'Lodge form is not ready. Call route_complaint first, then lodge again.'
        const flat = {} as Record<string, string>
        for (const [key, value] of Object.entries(args || {})) {
          if (value == null) continue
          flat[key] = String(value)
        }
        return guide.apply(flat.action || 'snapshot', flat)
      }

      return 'Unknown tool.'
    },
    [lodgeGuide, pathname, pendingLodge, router, setPendingLodge, user]
  )

  const { connected, readyMessage, listening, speaking, startMic, stopMic, sendText, interrupt } = useRealtimeVoice({
    enabled: open,
    onEvent,
    grievanceId,
    signedIn: Boolean(user),
    path: pathname,
    language: lang,
    onTool: runTool,
  })

  useEffect(() => {
    setMessages((current) => {
      if (current.length > 1) return current
      return [greetingFor(lang)]
    })
  }, [lang])

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: 'smooth' })
  }, [messages, liveHint, speaking, activity])

  const toggleVoice = useCallback(async () => {
    await unlockAudio()
    if (listening) {
      stopMic()
      setLiveHint(t('micOff'))
      return
    }
    try {
      await startMic()
      setLiveHint(t('liveOpen'))
    } catch {
      setMessages((current) => [...current, { role: 'assistant', text: t('micNeed') }])
    }
  }, [listening, startMic, stopMic, t])

  useEffect(() => {
    if (!open) {
      startedVoiceRef.current = false
      return
    }
    if (!startVoice || startedVoiceRef.current || !connected) return
    startedVoiceRef.current = true
    consumeStartVoice()
    void toggleVoice()
  }, [open, startVoice, connected, consumeStartVoice, toggleVoice])

  function sendTyped(text: string) {
    const trimmed = text.trim()
    if (!trimmed) return
    setInput('')
    setMessages((current) => [...current, { role: 'user', text: trimmed }])
    if (!sendText(trimmed)) {
      setMessages((current) => [
        ...current,
        { role: 'assistant', text: t('stillConnecting') },
      ])
    }
  }

  if (pathname.startsWith('/admin')) return null

  if (!open) {
    return (
      <button
        type="button"
        aria-label={t('speakAria')}
        onClick={async () => {
          await unlockAudio()
          setOpen(true)
        }}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-full border border-white/50 bg-white/40 py-2 pl-2 pr-4 shadow-glass-lg backdrop-blur-2xl backdrop-saturate-150 transition duration-200 ease-calm hover:scale-[1.02]"
      >
        <span className="relative">
          <img src="/avatar.png" alt="" className="h-14 w-14 rounded-full object-cover object-top" />
          <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-success" />
        </span>
        <span className="hidden text-left sm:block">
          <span className="block text-sm font-semibold text-indigo">Sahayak</span>
          <span className="block text-xs text-slate">{t('speakToLodge')}</span>
        </span>
      </button>
    )
  }

  return (
    <aside className="fixed bottom-4 right-4 z-50 flex h-[min(680px,88vh)] w-[min(400px,calc(100vw-1.5rem))] animate-fade-scale flex-col overflow-hidden rounded-panel border border-white/50 bg-white/35 shadow-glass-lg backdrop-blur-2xl backdrop-saturate-150">
      <header className="flex items-start justify-between gap-3 bg-indigo/70 px-4 py-3 text-white backdrop-blur-xl">
        <div>
          <p className="text-sm font-semibold">Sahayak</p>
          <p className="flex items-center gap-2 text-xs text-white/70">
            <span className={`h-2.5 w-2.5 rounded-full ${connected ? 'bg-success' : 'bg-amber'}`} />
            {connected ? t('connected') : t('connecting')}
          </p>
        </div>
        <button
          type="button"
          aria-label={t('closeAssistant')}
          onClick={() => {
            stopMic()
            setOpen(false)
          }}
          className="rounded-lg p-2 hover:bg-white/10"
        >
          <X className="h-4 w-4" />
        </button>
      </header>

      <div className="flex flex-col items-center px-4 pt-4">
        <button type="button" onClick={toggleVoice} className="relative" aria-label={listening ? t('stopMic') : t('speak')}>
          <img
            src="/avatar.png"
            alt="Sahayak avatar"
            className="h-28 w-28 rounded-full object-cover object-top ring-4 ring-white/60"
          />
          {(listening || speaking) && <span className="absolute inset-0 animate-pulse rounded-full ring-4 ring-amber/50" />}
        </button>
        <p className="mt-2 text-xs font-semibold uppercase tracking-[0.14em] text-amber">
          {listening ? t('listening') : speaking ? t('speaking') : connected ? t('ready') : t('connecting')}
        </p>
        {liveHint && <p className="mt-1 px-3 text-center text-xs text-slate">{liveHint}</p>}
        {activity && <p className="mt-1 px-3 text-center text-xs font-medium text-indigo">{activity}</p>}
      </div>

      <div ref={scroller} className="mt-3 flex-1 space-y-3 overflow-y-auto px-4">
        {messages.map((msg, i) => (
          <div
            key={`${i}-${msg.role}`}
            className={`max-w-[92%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
              msg.role === 'user' ? 'ml-auto bg-indigo/85 text-white backdrop-blur-md' : 'bg-white/45 text-ink backdrop-blur-md'
            }`}
          >
            {msg.text}
            {msg.pending && <span className="ml-1 inline-block animate-pulse">▍</span>}
          </div>
        ))}
        {messages.length <= 1 && (
          <div className="flex flex-wrap gap-2 pb-2">
            {[t(lang === 'hi' ? 'starter1Hi' : 'starter1'), t(lang === 'hi' ? 'starter2Hi' : 'starter2'), t(lang === 'hi' ? 'starter3Hi' : 'starter3'), t(lang === 'hi' ? 'starter4Hi' : 'starter4')].map((item) => (
              <button
                key={item}
                type="button"
                className="rounded-full border border-indigo/15 bg-white/45 px-3 py-1.5 text-left text-xs text-indigo backdrop-blur-md"
                onClick={() => sendTyped(item)}
              >
                {item}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-white/35 bg-white/20 p-3 backdrop-blur-md">
        <button
          type="button"
          className={`mb-3 flex h-12 w-full items-center justify-center gap-2 rounded-btn text-base font-semibold ${
            listening ? 'bg-attention text-white' : 'btn-primary'
          }`}
          onClick={toggleVoice}
          disabled={!connected}
        >
          {listening ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          {listening ? t('stopMic') : t('speakLive')}
        </button>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            sendTyped(input)
          }}
        >
          <label className="sr-only" htmlFor="assistant-input">
            {t('message')}
          </label>
          <input
            id="assistant-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="field"
            placeholder={connected ? t('orType') : t('connecting')}
          />
          <button type="submit" className="btn-secondary h-11 w-11 shrink-0 px-0" aria-label={t('send')} disabled={!input.trim()}>
            <Send className="h-4 w-4" />
          </button>
          <button
            type="button"
            className={`h-11 w-11 shrink-0 rounded-btn ${speaking ? 'bg-indigo text-white' : 'btn-secondary px-0'}`}
            aria-label={t('stopSpeaking')}
            onClick={() => interrupt()}
          >
            <Volume2 className="h-4 w-4" />
          </button>
        </form>
      </div>
    </aside>
  )
}
