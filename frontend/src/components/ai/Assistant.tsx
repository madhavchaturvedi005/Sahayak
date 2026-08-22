'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Mic, Send, Square, Volume2, X } from 'lucide-react'
import { useAssistant, type LoginGuide } from '@/context/AssistantContext'
import { useAuth } from '@/context/AuthContext'
import { useRealtimeVoice, type LiveEvent } from '@/hooks/useRealtimeVoice'
import { api } from '@/lib/api'
import { unlockAudio } from '@/lib/voice'

type Msg = {
  role: 'user' | 'assistant'
  text: string
  pending?: boolean
}

const GREETING: Msg = {
  role: 'assistant',
  text: 'Namaste. Tap Speak and tell me what happened. I can sign you in with the demo account, then open the right ministry for your complaint. I never file on the live government portal.',
}

const STARTERS = [
  'Help me sign in with the demo account.',
  'There is no water in my society.',
  'My income tax refund has not come.',
  'They closed my complaint saying visit the office.',
]

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

async function waitForGuide(getGuide: () => LoginGuide | null, tries = 8) {
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
  const { open, setOpen, startVoice, consumeStartVoice, grievanceId, loginGuide, setPendingLodge, pendingLodge } =
    useAssistant()
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Msg[]>([GREETING])
  const [liveHint, setLiveHint] = useState('')
  const scroller = useRef<HTMLDivElement | null>(null)
  const startedVoiceRef = useRef(false)

  const onEvent = useCallback((event: LiveEvent) => {
    if (event.type === 'user' && event.text) {
      setMessages((current) => [...current.filter((m) => !m.pending || m.role === 'assistant'), { role: 'user', text: event.text || '' }])
    }
    if (event.type === 'status' && event.state === 'thinking') {
      setLiveHint('Thinking…')
    }
    if (event.type === 'status' && event.state === 'listening') {
      setLiveHint('Listening… keep talking')
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
        { role: 'assistant', text: event.message || 'OpenAI live voice had a problem.' },
      ])
    }
  }, [])

  const runTool = useCallback(
    async (name: string, args: Record<string, string>) => {
      if (name === 'navigate') {
        const href = args.href || '/desk'
        router.push(href)
        await wait(350)
        return `Opened ${href}.`
      }

      if (name === 'login') {
        const action = args.action || 'open'
        const next = args.next || pendingLodge || '/desk'
        if (action === 'open' || pathname !== '/auth/signin') {
          router.push('/auth/signin')
          await wait(400)
        }
        const guide = await waitForGuide(loginGuide)
        if (action === 'open') {
          return guide
            ? 'Sign-in page is open. OTP tab is ready. Demo mobile 9876543210, OTP 123456. No SMS is sent.'
            : 'Opened Sign In. Ask them to say demo if the form is not ready.'
        }
        if (!guide) return 'Sign-in form is not ready. Ask them to open Sign In or say demo again.'
        if (action === 'set_mobile') {
          guide.setMode('otp')
          guide.setMobile(args.value || '9876543210')
          return `Filled mobile ${args.value || '9876543210'}.`
        }
        if (action === 'set_password') {
          guide.setMode('password')
          guide.setPassword(args.value || 'sahayak')
          return 'Filled the demo password.'
        }
        if (action === 'set_otp') {
          guide.setOtp(args.value || '123456')
          return `Filled OTP ${args.value || '123456'} (mocked, no SMS).`
        }
        if (action === 'request_otp') {
          if (args.value) guide.setMobile(args.value)
          await wait(80)
          return guide.sendOtp()
        }
        if (action === 'verify_otp') {
          if (args.value) guide.setOtp(args.value)
          await wait(80)
          return guide.verifyOtp()
        }
        if (action === 'password_signin') {
          return guide.signInPassword()
        }
        if (action === 'demo_otp') {
          guide.setMode('otp')
          guide.setMobile('9876543210')
          await wait(80)
          const sent = await guide.sendOtp()
          guide.setOtp('123456')
          await wait(80)
          const signed = await guide.verifyOtp()
          router.push(next)
          return `${sent} ${signed} OTP is mocked — no SMS was sent. Next page: ${next}.`
        }
        return 'Unknown login action.'
      }

      if (name === 'route_complaint') {
        const problem = args.problem || ''
        const routing = await api.classify(problem)
        const href = `/grievance/lodge?ministry=${encodeURIComponent(routing.ministry)}&category=${encodeURIComponent(routing.category)}`
        if (!user) {
          setPendingLodge(href)
          router.push('/auth/signin')
          await wait(350)
          return (
            `Not signed in yet. Opened Sign In first. After login I will take them to ${routing.ministry} ` +
            `for “${routing.category}”. ${routing.reason} Typical wait about ${routing.expected_days} days. ` +
            `Demo mobile 9876543210, OTP 123456. No SMS is sent.`
          )
        }
        router.push(href)
        await wait(350)
        return (
          `Opened the lodge form for ${routing.ministry} (${routing.category}). ${routing.reason} ` +
          `Typical wait about ${routing.expected_days} days. ${routing.pendency_pct}% pending beyond 21 days. ` +
          `They still confirm the form. We do not file on the live portal.`
        )
      }

      return 'Unknown tool.'
    },
    [loginGuide, pathname, pendingLodge, router, setPendingLodge, user]
  )

  const { connected, readyMessage, listening, speaking, startMic, stopMic, sendText, interrupt } = useRealtimeVoice({
    enabled: open,
    onEvent,
    grievanceId,
    signedIn: Boolean(user),
    path: pathname,
    onTool: runTool,
  })

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: 'smooth' })
  }, [messages, liveHint, speaking])

  const toggleVoice = useCallback(async () => {
    await unlockAudio()
    if (listening) {
      stopMic()
      setLiveHint('Mic off. Tap Speak to talk again.')
      return
    }
    try {
      await startMic()
      setLiveHint('Live socket is open. Just talk — I will answer when you pause.')
    } catch {
      setMessages((current) => [
        ...current,
        { role: 'assistant', text: 'Microphone permission is needed. Allow the mic, then tap Speak.' },
      ])
    }
  }, [listening, startMic, stopMic])

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
        { role: 'assistant', text: 'Live voice is still connecting. Wait a second and send again.' },
      ])
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        aria-label="Speak with Sahayak"
        onClick={async () => {
          await unlockAudio()
          setOpen(true)
        }}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-full glass-panel py-2 pl-2 pr-4 shadow-glass-lg transition duration-200 ease-calm hover:scale-[1.02]"
      >
        <span className="relative">
          <img src="/avatar.png" alt="" className="h-14 w-14 rounded-full object-cover object-top" />
          <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-success" />
        </span>
        <span className="hidden text-left sm:block">
          <span className="block text-sm font-semibold text-indigo">Sahayak</span>
          <span className="block text-xs text-slate">OpenAI live voice</span>
        </span>
      </button>
    )
  }

  return (
    <aside className="fixed bottom-4 right-4 z-50 flex h-[min(680px,88vh)] w-[min(400px,calc(100vw-1.5rem))] animate-fade-scale flex-col overflow-hidden rounded-panel glass-panel shadow-glass-lg">
      <header className="flex items-start justify-between gap-3 bg-indigo/90 px-4 py-3 text-white">
        <div>
          <p className="text-sm font-semibold">Sahayak</p>
          <p className="text-xs text-white/70">
            <span className={`mr-1.5 inline-block h-2 w-2 rounded-full ${connected ? 'bg-success' : 'bg-amber'}`} />
            {readyMessage}
          </p>
        </div>
        <button
          type="button"
          aria-label="Close assistant"
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
        <button type="button" onClick={toggleVoice} className="relative" aria-label={listening ? 'Stop microphone' : 'Speak'}>
          <img
            src="/avatar.png"
            alt="Sahayak avatar"
            className="h-28 w-28 rounded-full object-cover object-top ring-4 ring-white/60"
          />
          {(listening || speaking) && <span className="absolute inset-0 animate-pulse rounded-full ring-4 ring-amber/50" />}
        </button>
        <p className="mt-2 text-xs font-semibold uppercase tracking-[0.14em] text-amber">
          {listening ? 'Listening live…' : speaking ? 'Speaking…' : connected ? 'OpenAI live' : 'Connecting…'}
        </p>
        {liveHint && <p className="mt-1 px-3 text-center text-xs text-slate">{liveHint}</p>}
      </div>

      <div ref={scroller} className="mt-3 flex-1 space-y-3 overflow-y-auto px-4">
        {messages.map((msg, i) => (
          <div
            key={`${i}-${msg.role}`}
            className={`max-w-[92%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
              msg.role === 'user' ? 'ml-auto bg-indigo text-white' : 'bg-white/70 text-ink'
            }`}
          >
            {msg.text}
            {msg.pending && <span className="ml-1 inline-block animate-pulse">▍</span>}
          </div>
        ))}
        {messages.length <= 1 && (
          <div className="flex flex-wrap gap-2 pb-2">
            {STARTERS.map((item) => (
              <button
                key={item}
                type="button"
                className="rounded-full border border-indigo/15 bg-white/70 px-3 py-1.5 text-left text-xs text-indigo"
                onClick={() => sendTyped(item)}
              >
                {item}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-white/40 p-3">
        <button
          type="button"
          className={`mb-3 flex h-12 w-full items-center justify-center gap-2 rounded-btn text-base font-semibold ${
            listening ? 'bg-attention text-white' : 'btn-primary'
          }`}
          onClick={toggleVoice}
          disabled={!connected}
        >
          {listening ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          {listening ? 'Stop mic' : 'Speak live'}
        </button>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            sendTyped(input)
          }}
        >
          <label className="sr-only" htmlFor="assistant-input">
            Message
          </label>
          <input
            id="assistant-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="field"
            placeholder={connected ? 'Or type — same live session…' : 'Connecting…'}
          />
          <button type="submit" className="btn-secondary h-11 w-11 shrink-0 px-0" aria-label="Send" disabled={!input.trim()}>
            <Send className="h-4 w-4" />
          </button>
          <button
            type="button"
            className={`h-11 w-11 shrink-0 rounded-btn ${speaking ? 'bg-indigo text-white' : 'btn-secondary px-0'}`}
            aria-label="Stop speaking"
            onClick={() => interrupt()}
          >
            <Volume2 className="h-4 w-4" />
          </button>
        </form>
      </div>
    </aside>
  )
}
