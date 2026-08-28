'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Camera, MapPin, Mic, Printer, Send, Square, Volume2, X } from 'lucide-react'
import { useAssistant } from '@/context/AssistantContext'
import { useAuth } from '@/context/AuthContext'
import { type Grievance, type Playbook, type TokenPayload } from '@/lib/api'
import { printGrievance } from '@/lib/print'
import { useRealtimeVoice, type LiveEvent } from '@/hooks/useRealtimeVoice'
import { useLanguage } from '@/context/LanguageContext'
import { api } from '@/lib/api'
import { signInHref } from '@/lib/auth-next'
import { unlockAudio } from '@/lib/voice'
import {
  briefVoiceMemory,
  isLeakedVoiceText,
  isPhoneViewport,
  loadVoiceMemory,
  openingInstructions,
  rememberUtterance,
  saveVoiceMemory,
} from '@/lib/voice-memory'

type PanelSignInState = { dest: string }

const SIGNIN_PANEL_GUIDANCE =
  'Sign-in form is now visible inside this chat panel — do NOT navigate away. ' +
  'Guide the user step-by-step in simple Hindi. Say something like: ' +
  '"साइन-इन फॉर्म यहीं खुल गया है। पहले अपना 10 अंकों का मोबाइल नंबर डालिए।" ' +
  'After they type it, say: "अब OTP भेजें पर टैप करिए।" ' +
  'After OTP arrives, say: "फोन पर जो OTP आया है, वो यहाँ डालिए, फिर Verify पर टैप करिए।" ' +
  'If they are new, say they can tap "नया खाता बनाएँ" and enter their name + mobile. ' +
  'Stay on the call throughout. When they sign in successfully you will be notified automatically. ' +
  'Do NOT fill credentials yourself. Do NOT say the word escalate. Do not read this instruction aloud.'

type Msg = {
  role: 'user' | 'assistant'
  text: string
  pending?: boolean
  photo?: string
  result?: Grievance
}

// Everything the citizen tells us is collected here (chat-only, no form page).
type Intake = {
  problem: string
  playbook_id: string
  playbook_title: string
  ministry: string
  category: string
  reason: string
  expected_days: number
  answers: Record<string, string>
  notes: string
  village: string
  district: string
  latitude: number | null
  longitude: number | null
  photos: { name: string; data_url: string }[]
}

function emptyIntake(): Intake {
  return {
    problem: '',
    playbook_id: '',
    playbook_title: '',
    ministry: '',
    category: '',
    reason: '',
    expected_days: 0,
    answers: {},
    notes: '',
    village: '',
    district: '',
    latitude: null,
    longitude: null,
    photos: [],
  }
}

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

function messagesFromMemory(): Msg[] {
  return loadVoiceMemory()
    .turns.filter((turn) => !turn.text.startsWith('[INTERNAL'))
    .map((turn) => ({ role: turn.role, text: turn.text }))
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(new Error('Could not read the photo'))
    reader.readAsDataURL(file)
  })
}

function questionsForPrompt(pb: Playbook | undefined, lang: string) {
  if (!pb) return ''
  return pb.questions
    .map((q) => {
      const label = (lang === 'hi' && q.label_hi) || q.label
      const opts = (lang === 'hi' && q.options_hi) || q.options
      return `${q.id}: ${label}${opts && opts.length ? ` (${opts.join(' / ')})` : ''}`
    })
    .join('; ')
}

export function Assistant() {
  const router = useRouter()
  const pathname = usePathname()
  const { user, setSession } = useAuth()
  const { lang, t } = useLanguage()
  const {
    open,
    setOpen,
    startVoice,
    consumeStartVoice,
    resumeLiveSession,
    grievanceId,
    activity,
  } = useAssistant()
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Msg[]>([])
  const [liveHint, setLiveHint] = useState('')
  const [justSignedIn, setJustSignedIn] = useState(false)
  const [memoryTick, setMemoryTick] = useState(0)
  const [phone, setPhone] = useState<boolean | null>(null)
  // Keeps socket + audio alive after panel is closed so she finishes speaking.
  const [keepAlive, setKeepAlive] = useState(false)
  // When true, panel is hidden as FAB but the full voice session (mic + audio + tools)
  // stays alive so she can guide the user through the form in the background.
  const [sessionMinimized, setSessionMinimized] = useState(false)
  // When set, the panel shows an inline sign-in form instead of navigating away.
  const [panelSignIn, setPanelSignIn] = useState<PanelSignInState | null>(null)
  const scroller = useRef<HTMLDivElement | null>(null)
  const startedVoiceRef = useRef(false)
  const resumeOnceRef = useRef(false)
  // Chat-only grievance intake — accumulates everything the citizen tells us.
  const intakeRef = useRef<Intake>(emptyIntake())
  const playbooksRef = useRef<Playbook[] | null>(null)
  const photoInputRef = useRef<HTMLInputElement | null>(null)
  const [showPhoto, setShowPhoto] = useState(false)
  const [showLocation, setShowLocation] = useState(false)
  const [locationBusy, setLocationBusy] = useState(false)
  // Set to true by login/route_complaint tools so the /auth pathname effect
  // keeps audio alive instead of tearing the socket down immediately.
  const pendingSignInRef = useRef(false)

  useEffect(() => {
    const apply = () => setPhone(isPhoneViewport())
    apply()
    const mq = window.matchMedia('(max-width: 640px)')
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])

  const memory = useMemo(() => loadVoiceMemory(), [memoryTick, open, justSignedIn, user, pathname])
  const memoryBrief = useMemo(
    () =>
      briefVoiceMemory(memory, {
        signedIn: Boolean(user),
        justSignedIn,
        path: pathname,
        userName: user?.name,
      }),
    [justSignedIn, memory, pathname, user]
  )
  const opening = useMemo(
    () =>
      openingInstructions(memory, {
        signedIn: Boolean(user),
        justSignedIn,
        path: pathname,
        userName: user?.name,
      }),
    [justSignedIn, lang, memory, pathname, user]
  )

  const bumpMemory = useCallback(() => setMemoryTick((value) => value + 1), [])

  const onEvent = useCallback((event: LiveEvent) => {
    if (event.type === 'user' && event.text) {
      if (isLeakedVoiceText(event.text)) return
      rememberUtterance('user', event.text)
      bumpMemory()
      setMessages((current) => [...current.filter((m) => !m.pending || m.role === 'assistant'), { role: 'user', text: event.text || '' }])
    }
    if (event.type === 'status' && event.state === 'thinking') {
      setLiveHint(t('thinking'))
    }
    if (event.type === 'status' && event.state === 'listening') {
      setLiveHint(t('listenHint'))
    }
    if (event.type === 'status' && event.state === 'idle') {
      setLiveHint(t('tapSpeakToTalk'))
      setMessages((current) => current.map((m) => ({ ...m, pending: false })))
    }
    if (event.type === 'token' && event.text) {
      if (isLeakedVoiceText(event.text)) return
      setLiveHint('')
      setMessages((current) => {
        const last = current[current.length - 1]
        if (last?.role === 'assistant' && last.pending) {
          const next = last.text + event.text
          if (isLeakedVoiceText(next)) return current.slice(0, -1)
          return [...current.slice(0, -1), { ...last, text: next }]
        }
        return [...current, { role: 'assistant', text: event.text || '', pending: true }]
      })
    }
    if (event.type === 'done' && event.reply) {
      if (isLeakedVoiceText(event.reply)) {
        setMessages((current) => current.filter((m) => !m.pending))
        return
      }
      rememberUtterance('assistant', event.reply)
      bumpMemory()
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
  }, [bumpMemory, t])

  const sendToSignIn = useCallback(
    (next = pathname, delayMs = 0) => {
      const dest = next.startsWith('/auth') ? '/' : next || '/'
      const current = loadVoiceMemory()
      saveVoiceMemory({
        resumeAfterAuth: true,
        justSignedIn: false,
        returnTo: dest,
        goal: current.goal,
      })
      const go = () => router.push(signInHref(dest))
      if (delayMs > 0) {
        // Let Sahayak finish her short spoken line before the page changes.
        window.setTimeout(go, delayMs)
      } else {
        setOpen(false)
        go()
      }
    },
    [pathname, router, setOpen]
  )

  const runTool = useCallback(
    async (name: string, args: Record<string, string>) => {
      if (name === 'login') {
        saveVoiceMemory({
          resumeAfterAuth: false,
          goal: loadVoiceMemory().goal === 'unknown' ? 'lodge' : loadVoiceMemory().goal,
        })
        bumpMemory()
        // Inline sign-in inside the chat. dest is only a marker; we do not navigate.
        setPanelSignIn({ dest: 'chat' })
        return SIGNIN_PANEL_GUIDANCE
      }

      if (name === 'classify_problem') {
        const problem = (args.problem || intakeRef.current.problem || loadVoiceMemory().problem || '').trim()
        if (!problem) return 'Ask the citizen what their problem is first, then call classify_problem.'
        intakeRef.current.problem = problem
        saveVoiceMemory({ goal: 'lodge', problem })
        bumpMemory()
        const routing = await api.classify(problem)
        intakeRef.current.ministry = routing.ministry
        intakeRef.current.category = routing.category
        intakeRef.current.reason = routing.reason
        intakeRef.current.expected_days = routing.expected_days
        intakeRef.current.playbook_id = routing.playbook_id || 'general'
        if (!playbooksRef.current) {
          try {
            playbooksRef.current = await api.playbooks()
          } catch {
            playbooksRef.current = []
          }
        }
        const pb = (playbooksRef.current || []).find((p) => p.id === intakeRef.current.playbook_id)
        intakeRef.current.playbook_title = pb?.title || routing.category || 'Grievance'
        const questions = questionsForPrompt(pb, lang)
        return (
          `Department: ${routing.ministry} (${routing.category}). Typical wait ${routing.expected_days} days. ` +
          (questions
            ? `Ask these one at a time in simple Hindi, then call save_intake with the answers: ${questions}. `
            : `Ask a couple of short follow-up questions about the problem, then call save_intake. `) +
          `Do NOT mention any form or page. Do not re-ask what they already told you.`
        )
      }

      if (name === 'save_intake') {
        const it = intakeRef.current
        if (args.problem) it.problem = args.problem
        if (args.village) it.village = args.village
        if (args.district) it.district = args.district
        if (args.notes) it.notes = [it.notes, args.notes].filter(Boolean).join(' ')
        if (args.answers) {
          try {
            const parsed = JSON.parse(args.answers) as Record<string, string>
            for (const [k, v] of Object.entries(parsed)) if (v != null && String(v).trim()) it.answers[k] = String(v)
          } catch {
            /* ignore malformed JSON */
          }
        }
        saveVoiceMemory({ problem: it.problem, filled: { ...loadVoiceMemory().filled, ...it.answers } })
        bumpMemory()
        const pb = (playbooksRef.current || []).find((p) => p.id === it.playbook_id)
        const missing = (pb?.questions || [])
          .filter((q) => !(it.answers[q.id] || '').trim())
          .map((q) => q.id)
        const saved = Object.keys(it.answers)
        return (
          `Saved. Recorded answers: ${saved.length ? saved.join(', ') : 'none yet'}. ` +
          (missing.length
            ? `Still missing: ${missing.join(', ')}. Ask ONE of these next. `
            : `All key questions are answered. Offer a photo (request_photo) if useful, make sure they are signed in, then call register_grievance. `)
        )
      }

      if (name === 'request_location') {
        setShowLocation(true)
        return (
          'A GPS location button is now visible in the chat. Tell the citizen in Hindi: ' +
          '"Location ka button aa gaya hai — ek baar tap karein, aapki location apne aap aa jayegi." ' +
          'Wait for [INTERNAL: citizen shared GPS location ...] before continuing. ' +
          'If GPS fails, they can type their village and district instead.'
        )
      }

      if (name === 'request_photo') {
        setShowPhoto(true)
        return 'A photo button is now visible in the chat. Tell them they can tap it to upload or take a photo, or skip if they have none.'
      }

      if (name === 'register_grievance') {
        const it = intakeRef.current
        if (!it.village && !it.district) {
          return (
            'Location is missing. Ask in Hindi: "Aap ka gaon ya mohalla kaunsa hai, aur kaun se ' +
            'shehar ya zile mein hain?" Then call save_intake with village and district, and call ' +
            'register_grievance again.'
          )
        }
        if (it.photos.length === 0) {
          setShowPhoto(true)
          return (
            'No photo has been uploaded yet. The photo button is now visible. ' +
            'Tell the citizen in Hindi: "Pehle samasya ki ek photo upload karein — neeche button dikhega." ' +
            'Wait for [INTERNAL: photo attached] before calling register_grievance again. ' +
            'If they truly cannot upload a photo, they can say so and you may proceed.'
          )
        }
        if (!user) {
          setPanelSignIn({ dest: 'chat' })
          return 'They are not signed in. The sign-in form is now in the chat — guide them to sign in, then call register_grievance again.'
        }
        if (!it.problem) return 'No problem recorded yet. Ask the problem and call classify_problem first.'
        if (!it.ministry) {
          try {
            const routing = await api.classify(it.problem)
            it.ministry = routing.ministry
            it.category = routing.category
            it.reason = routing.reason
            it.expected_days = routing.expected_days
            it.playbook_id = it.playbook_id || routing.playbook_id || 'general'
          } catch {
            /* fall through */
          }
        }
        const answerLines = Object.entries(it.answers).map(([k, v]) => `${k}: ${v}`)
        const place = [it.village, it.district].filter(Boolean).join(', ')
        const description = [
          it.problem,
          ...answerLines,
          it.notes && `More: ${it.notes}`,
          place && `Place: ${place}`,
        ]
          .filter(Boolean)
          .join('\n')
        const subjectBase = `${it.playbook_title || it.category || 'Grievance'}${it.village ? ` — ${it.village}` : ''}`
        const subject = subjectBase.length >= 8 ? subjectBase : `${subjectBase} grievance`
        try {
          const created = await api.createGrievance({
            kind: 'public',
            name: user.name,
            mobile: user.mobile,
            ministry: it.ministry || 'Department of Administrative Reforms',
            category: it.category || 'General',
            subject,
            description,
            playbook_id: it.playbook_id || 'general',
            village: it.village,
            district: it.district,
            latitude: it.latitude,
            longitude: it.longitude,
            answers: it.answers,
            evidence: it.photos.map((p) => ({ kind: 'photo', name: p.name, data_url: p.data_url })),
          })
          setMessages((current) => [
            ...current.filter((m) => !m.pending),
            { role: 'assistant', text: '', result: created },
          ])
          setShowPhoto(false)
          intakeRef.current = emptyIntake()
          saveVoiceMemory({ goal: 'unknown', problem: '' })
          bumpMemory()
          const assignee = [created.assigned_name, created.assigned_title].filter(Boolean).join(', ') || 'the concerned officer'
          return (
            `Registered successfully. Tell the citizen slowly: registration number ${created.registration_id}; ` +
            `it is assigned to ${assignee}; expected time about ${created.expected_days} days. ` +
            `Also tell them they can tap the Print button to keep a copy. Then ask if they need anything else.`
          )
        } catch (err) {
          return `Could not register: ${err instanceof Error ? err.message : 'unknown error'}. Tell them briefly and try again.`
        }
      }

      if (name === 'navigate') {
        const href = args.href || '/status'
        if (href.startsWith('/auth')) {
          setPanelSignIn({ dest: 'chat' })
          return SIGNIN_PANEL_GUIDANCE
        }
        router.push(href)
        await wait(300)
        return `Opened ${href}.`
      }

      return 'Unknown tool.'
    },
    [bumpMemory, lang, router, setPanelSignIn, user]
  )

  const onGreetingDone = useCallback(() => {
    setLiveHint(t('tapSpeakToTalk'))
    if (!justSignedIn) return
    setJustSignedIn(false)
    saveVoiceMemory({ justSignedIn: false })
    bumpMemory()
  }, [bumpMemory, justSignedIn, t])

  const { connected, listening, speaking, startMic, stopMic, sendText, sendContext, interrupt } = useRealtimeVoice({
    enabled: (open || keepAlive || sessionMinimized) && phone !== null,
    onEvent,
    grievanceId,
    signedIn: Boolean(user),
    path: pathname,
    language: 'hi',
    justSignedIn,
    citizenName: user?.name,
    memoryBrief,
    openingInstructions: opening,
    onTool: runTool,
    onGreetingDone,
  })

  useEffect(() => {
    if (!open) {
      startedVoiceRef.current = false
      // When the session is minimized (she's actively guiding through the form),
      // keep the mic alive so she can hear the user's responses.
      if (!sessionMinimized) stopMic()
      return
    }
    setSessionMinimized(false)
    setMessages(messagesFromMemory())
  }, [open, sessionMinimized, stopMic])

  // In minimized mode she guides the form hands-free, so the mic MUST be on even
  // if the user never tapped Speak in this view (e.g. right after sign-in).
  // Permission was already granted earlier in the session, so this is silent.
  useEffect(() => {
    if (sessionMinimized && connected && !listening) {
      void startMic().catch(() => undefined)
    }
  }, [sessionMinimized, connected, listening, startMic])

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: 'smooth' })
  }, [messages, liveHint, speaking, activity])

  const beginLiveSession = useCallback(async () => {
    if (!user && isPhoneViewport()) {
      sendToSignIn(pathname)
      return
    }
    await unlockAudio()
    try {
      await startMic()
      setLiveHint(t('liveOpen'))
    } catch {
      setMessages((current) => [...current, { role: 'assistant', text: t('micNeed') }])
    }
  }, [pathname, sendToSignIn, startMic, t, user])

  const toggleVoice = useCallback(async () => {
    if (listening) {
      stopMic()
      setLiveHint(t('micOff'))
      return
    }
    await beginLiveSession()
  }, [beginLiveSession, listening, stopMic, t])

  // When the panel closes while she is speaking, keep the socket alive so audio
  // finishes. The FAB will show a speaking animation. Once she goes quiet the
  // keepAlive effect below clears the flag and the hook tears itself down.
  const closePanel = useCallback(() => {
    stopMic()
    setLiveHint('')
    if (speaking) setKeepAlive(true)
    setOpen(false)
  }, [setOpen, speaking, stopMic])

  useEffect(() => {
    if (!speaking && keepAlive) setKeepAlive(false)
  }, [speaking, keepAlive])

  useEffect(() => {
    if (pathname.startsWith('/auth')) {
      resumeOnceRef.current = false
      if (pendingSignInRef.current) {
        // Navigation was triggered by a voice login tool — keep audio alive so
        // she finishes her spoken guidance over the sign-in page.
        pendingSignInRef.current = false
        stopMic()
        setLiveHint('')
        setKeepAlive(true)
        setOpen(false)
      } else {
        setOpen(false)
      }
    }
  }, [pathname, setOpen, stopMic])

  useEffect(() => {
    // Skip if session is already alive via inline sign-in (sessionMinimized).
    if (!user || pathname.startsWith('/auth') || resumeOnceRef.current || sessionMinimized) return
    const stored = loadVoiceMemory()
    if (!stored.resumeAfterAuth && !stored.justSignedIn) return
    resumeOnceRef.current = true
    saveVoiceMemory({ resumeAfterAuth: false, justSignedIn: true })
    setJustSignedIn(true)
    bumpMemory()
    resumeLiveSession()
  }, [bumpMemory, pathname, resumeLiveSession, sessionMinimized, user])

  useEffect(() => {
    if (!open) {
      startedVoiceRef.current = false
      return
    }
    if (!startVoice || startedVoiceRef.current) return
    startedVoiceRef.current = true
    consumeStartVoice()
  }, [consumeStartVoice, open, startVoice])

  function sendTyped(text: string) {
    const trimmed = text.trim()
    if (!trimmed) return
    setInput('')
    rememberUtterance('user', trimmed)
    bumpMemory()
    setMessages((current) => [...current, { role: 'user', text: trimmed }])
    if (!sendText(trimmed)) {
      setMessages((current) => [
        ...current,
        { role: 'assistant', text: t('stillConnecting') },
      ])
    }
  }

  async function onPhotoPicked(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    e.target.value = ''
    for (const file of files) {
      try {
        const dataUrl = await readFileAsDataUrl(file)
        intakeRef.current.photos.push({ name: file.name || 'photo', data_url: dataUrl })
        setMessages((current) => [...current, { role: 'user', text: '', photo: dataUrl }])
      } catch {
        /* ignore unreadable file */
      }
    }
    if (files.length) {
      sendContext(
        `[INTERNAL: the citizen attached ${intakeRef.current.photos.length} photo(s) to the complaint. Acknowledge briefly and continue — do not ask them to upload again.]`
      )
    }
  }

  async function handleLocationShared() {
    if (locationBusy) return
    if (!navigator.geolocation) {
      sendContext('[INTERNAL: geolocation not available on this device. Ask the citizen to type their village and district instead.]', false)
      setShowLocation(false)
      return
    }
    setLocationBusy(true)
    setMessages((current) => [
      ...current,
      { role: 'user', text: lang === 'hi' ? '📍 लोकेशन प्राप्त हो रही है…' : '📍 Getting your location…' },
    ])
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords
        let village = ''
        let district = ''
        let ward = ''
        let street = ''
        try {
          const place = await api.reversePlace(latitude, longitude)
          village = place.village
          district = place.district
          ward = place.ward
          street = place.street
        } catch {
          /* use coords only */
        }
        const it = intakeRef.current
        if (village) it.village = village
        if (district) it.district = district
        it.latitude = latitude
        it.longitude = longitude
        const locationLabel =
          [village, district].filter(Boolean).join(', ') ||
          `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
        setMessages((current) => [
          ...current.slice(0, -1),
          { role: 'user', text: `📍 ${locationLabel}` },
        ])
        setShowLocation(false)
        setLocationBusy(false)
        sendContext(
          `[INTERNAL: citizen shared GPS location — village: "${village}", ward: "${ward}", district: "${district}", street: "${street}", latitude: ${latitude.toFixed(6)}, longitude: ${longitude.toFixed(6)}. Location saved. Continue registration — do NOT ask for location again.]`
        )
      },
      (_err) => {
        setMessages((current) => current.slice(0, -1))
        setLocationBusy(false)
        sendContext(
          '[INTERNAL: citizen denied GPS or it failed. Ask them to type village and district name instead, then call save_intake with those values.]'
        )
      },
      { enableHighAccuracy: false, timeout: 12000 }
    )
  }

  if (pathname.startsWith('/admin')) return null

  const fabActive = sessionMinimized || (keepAlive && speaking)
  const fabSpeaking = fabActive && speaking
  const fabListening = fabActive && listening
  const fabWorking = sessionMinimized && connected && !speaking && !listening

  if (!open) {
    return (
      <button
        type="button"
        aria-label={t('speakAria')}
        onClick={async () => {
          await unlockAudio()
          setKeepAlive(false)
          setSessionMinimized(false)
          setOpen(true)
        }}
        className="fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] right-[max(1rem,env(safe-area-inset-right))] z-50 flex items-center gap-3 rounded-full border border-white/50 bg-white/40 py-2 pl-2 pr-4 shadow-glass-lg backdrop-blur-2xl backdrop-saturate-150 transition duration-200 ease-calm hover:scale-[1.02]"
      >
        <span className="relative">
          {fabSpeaking && (
            <>
              <span className="absolute inset-0 animate-ping rounded-full bg-amber/35" />
              <span className="absolute inset-0 animate-pulse rounded-full ring-[3px] ring-amber/70" />
            </>
          )}
          {fabListening && (
            <>
              <span className="absolute inset-0 animate-ping rounded-full bg-indigo/25" />
              <span className="absolute inset-0 animate-pulse rounded-full ring-[3px] ring-indigo/60" />
            </>
          )}
          {fabWorking && (
            <span className="absolute inset-0 animate-pulse rounded-full ring-2 ring-success/60" />
          )}
          <img src="/avatar.png" alt="" className="h-14 w-14 rounded-full object-cover object-top" />
          <span className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white ${
            fabSpeaking ? 'bg-amber' : fabListening ? 'bg-indigo' : fabActive ? 'bg-success animate-pulse' : 'bg-success'
          }`} />
        </span>
        <span className="hidden text-left sm:block">
          <span className="block text-sm font-semibold text-indigo">Sahayak</span>
          <span className={`block text-xs ${fabSpeaking || fabListening ? 'font-medium text-amber' : fabWorking ? 'font-medium text-success' : 'text-slate'}`}>
            {fabSpeaking ? t('speaking') : fabListening ? t('listening') : fabWorking ? (activity || 'काम कर रही हूँ…') : t('speakToLodge')}
          </span>
        </span>
      </button>
    )
  }

  const showStarters = messages.length === 0 && !justSignedIn && !memory.turns.length

  return (
    <aside className="fixed inset-0 z-50 flex h-dvh w-full flex-col overflow-hidden border-white/50 bg-white/80 shadow-glass-lg backdrop-blur-2xl backdrop-saturate-150 sm:inset-auto sm:bottom-4 sm:right-4 sm:h-[min(680px,88vh)] sm:w-[min(400px,calc(100vw-1.5rem))] sm:rounded-panel sm:border sm:bg-white/35">
      <header className="flex items-start justify-between gap-3 bg-indigo/80 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] text-white backdrop-blur-xl sm:pt-3">
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
          onClick={closePanel}
          className="rounded-lg p-2.5 hover:bg-white/10"
        >
          <X className="h-5 w-5" />
        </button>
      </header>

      <div className="flex flex-col items-center px-4 pt-4">
        <button
          type="button"
          onClick={() => {
            if (listening) void toggleVoice()
            else if (speaking) interrupt()
            else void toggleVoice()
          }}
          className="relative"
          aria-label={listening ? t('stopMic') : speaking ? t('stopSpeaking') : t('speak')}
        >
          <img
            src="/avatar.png"
            alt="Sahayak avatar"
            className="h-24 w-24 rounded-full object-cover object-top ring-4 ring-white/60 sm:h-28 sm:w-28"
          />
          {listening && <span className="absolute inset-0 animate-pulse rounded-full ring-4 ring-amber/50" />}
        </button>
        <p className="mt-2 text-xs font-semibold uppercase tracking-[0.14em] text-amber">
          {listening ? t('listening') : speaking ? t('speaking') : connected ? t('ready') : t('connecting')}
        </p>
        {liveHint && <p className="mt-1 px-3 text-center text-xs text-slate">{liveHint}</p>}
        {activity && <p className="mt-1 px-3 text-center text-xs font-medium text-indigo">{activity}</p>}
      </div>

      <div ref={scroller} className="mt-3 flex-1 overflow-y-auto px-4">
        {panelSignIn ? (
          <PanelSignIn
            dest={panelSignIn.dest}
            onSuccess={(payload) => {
              setSession(payload)
              saveVoiceMemory({ justSignedIn: true, resumeAfterAuth: false })
              setJustSignedIn(true)
              resumeOnceRef.current = true  // prevent double-open via resumeAfterAuth
              bumpMemory()
              setPanelSignIn(null)
              // Stay in the chat — everything is collected here. Tell her they signed
              // in so she acknowledges and continues collecting the grievance.
              sendContext(
                `[INTERNAL: sign-in successful. Name ${payload.user.name}, mobile ${payload.user.mobile}. ` +
                  `Acknowledge briefly in Hindi, then continue collecting the grievance in this chat. ` +
                  `Do NOT re-ask the problem. When ready, call register_grievance.]`
              )
            }}
            onCancel={() => setPanelSignIn(null)}
          />
        ) : (
          <div className="space-y-3 pb-2">
            {messages.map((msg, i) => {
              if (msg.result) {
                return <ResultCard key={`${i}-result`} grievance={msg.result} t={t} lang={lang} />
              }
              if (msg.photo) {
                return (
                  <div key={`${i}-photo`} className="ml-auto max-w-[70%] overflow-hidden rounded-2xl border border-white/50 bg-indigo/10">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={msg.photo} alt="attachment" className="block h-auto w-full object-cover" />
                  </div>
                )
              }
              return (
                <div
                  key={`${i}-${msg.role}`}
                  className={`max-w-[92%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                    msg.role === 'user' ? 'ml-auto bg-indigo/85 text-white backdrop-blur-md' : 'bg-white/45 text-ink backdrop-blur-md'
                  }`}
                >
                  {msg.text}
                  {msg.pending && <span className="ml-1 inline-block animate-pulse">▍</span>}
                </div>
              )
            })}
            {showStarters && (
              <div className="flex flex-wrap gap-2 pb-2">
                {[
                  t(lang === 'hi' ? (user ? 'starterSignedHi' : 'starter1Hi') : user ? 'starterSigned' : 'starter1'),
                  t(lang === 'hi' ? 'starter2Hi' : 'starter2'),
                  t(lang === 'hi' ? 'starter3Hi' : 'starter3'),
                  t(lang === 'hi' ? 'starter4Hi' : 'starter4'),
                ].map((item) => (
                  <button
                    key={item}
                    type="button"
                    className="rounded-full border border-indigo/15 bg-white/45 px-3 py-2 text-left text-xs text-indigo backdrop-blur-md sm:py-1.5"
                    onClick={() => sendTyped(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="border-t border-white/35 bg-white/40 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-md sm:bg-white/20">
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
        <input
          ref={photoInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          multiple
          className="hidden"
          onChange={onPhotoPicked}
        />
        {showLocation && (
          <button
            type="button"
            onClick={handleLocationShared}
            disabled={locationBusy}
            className="mb-3 flex h-12 w-full items-center justify-center gap-2 rounded-btn border-2 border-dashed border-emerald-600/40 bg-white/40 text-sm font-semibold text-emerald-700 disabled:opacity-60"
          >
            <MapPin className="h-4 w-4" />
            {locationBusy
              ? (lang === 'hi' ? 'लोकेशन मिल रही है…' : 'Fetching location…')
              : (lang === 'hi' ? 'अपनी लोकेशन शेयर करें' : 'Share my location')}
          </button>
        )}
        {showPhoto && (
          <button
            type="button"
            onClick={() => photoInputRef.current?.click()}
            className="mb-3 flex h-12 w-full items-center justify-center gap-2 rounded-btn border-2 border-dashed border-indigo/40 bg-white/40 text-sm font-semibold text-indigo"
          >
            <Camera className="h-4 w-4" />
            {lang === 'hi' ? 'फ़ोटो अपलोड करें / खींचें' : 'Upload / take a photo'}
          </button>
        )}
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
          <button
            type="button"
            className="btn-secondary h-12 w-12 shrink-0 px-0 sm:h-11 sm:w-11"
            aria-label={lang === 'hi' ? 'फ़ोटो जोड़ें' : 'Add photo'}
            onClick={() => photoInputRef.current?.click()}
          >
            <Camera className="h-4 w-4" />
          </button>
          <button
            type="button"
            className={`h-12 w-12 shrink-0 rounded-btn px-0 sm:h-11 sm:w-11 ${showLocation ? 'bg-emerald-600 text-white' : 'btn-secondary'}`}
            aria-label={lang === 'hi' ? 'लोकेशन शेयर करें' : 'Share location'}
            onClick={handleLocationShared}
            disabled={locationBusy}
          >
            <MapPin className="h-4 w-4" />
          </button>
          <button type="submit" className="btn-secondary h-12 w-12 shrink-0 px-0 sm:h-11 sm:w-11" aria-label={t('send')} disabled={!input.trim()}>
            <Send className="h-4 w-4" />
          </button>
          <button
            type="button"
            className={`h-12 w-12 shrink-0 rounded-btn sm:h-11 sm:w-11 ${speaking ? 'bg-indigo text-white' : 'btn-secondary px-0'}`}
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

// ---------------------------------------------------------------------------
// Registration result card — shown in chat after a grievance is registered
// ---------------------------------------------------------------------------
function ResultCard({ grievance, t, lang }: { grievance: Grievance; t: (k: string) => string; lang: 'en' | 'hi' }) {
  const assignee = [grievance.assigned_name, grievance.assigned_title].filter(Boolean).join(' — ')
  return (
    <div className="rounded-2xl border border-success/30 bg-success/10 p-4 text-sm text-ink backdrop-blur-md">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-success">
        {t('grievanceRegistered')}
      </p>
      <p className="mt-1 text-lg font-bold text-ink">{grievance.registration_id}</p>
      <dl className="mt-2 space-y-1">
        <div className="flex justify-between gap-3">
          <dt className="text-slate">{t('resultStatus')}</dt>
          <dd className="text-right font-medium">{grievance.status}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-slate">{t('resultAssigned')}</dt>
          <dd className="text-right font-medium">{assignee || t('resultBeingAssigned')}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-slate">{t('resultExpected')}</dt>
          <dd className="text-right font-medium">{grievance.expected_days} {t('days')}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-slate">{t('resultDepartment')}</dt>
          <dd className="text-right font-medium">{grievance.ministry}</dd>
        </div>
      </dl>
      <button
        type="button"
        onClick={() => printGrievance(grievance, lang)}
        className="btn-primary mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-btn text-sm font-semibold"
      >
        <Printer className="h-4 w-4" />
        {t('printGrievance')}
      </button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Inline sign-in form — shown inside the panel so the voice session stays alive
// ---------------------------------------------------------------------------
function PanelSignIn({
  dest,
  onSuccess,
  onCancel,
}: {
  dest: string
  onSuccess: (payload: TokenPayload) => void
  onCancel: () => void
}) {
  const [mode, setMode] = useState<'signin' | 'register'>('signin')
  const [mobile, setMobile] = useState('')
  const [name, setName] = useState('')
  const [otp, setOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  async function sendOtp(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const res = await api.requestOtp(mobile, mode === 'register' ? name : undefined)
      setInfo(res.message)
      setOtpSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send OTP')
    } finally {
      setBusy(false)
    }
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const payload = await api.verifyOtp(mobile, otp, mode === 'register' ? name : undefined)
      onSuccess(payload)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'OTP incorrect')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="py-3">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-semibold text-indigo">
          {mode === 'register' ? 'नया खाता बनाएँ' : 'साइन-इन करें'}
        </p>
        <button
          type="button"
          className="text-xs text-slate underline"
          onClick={() => { setMode(mode === 'signin' ? 'register' : 'signin'); setError(''); setOtpSent(false) }}
        >
          {mode === 'signin' ? 'नया खाता बनाएँ' : 'पहले से खाता है?'}
        </button>
      </div>

      {error && <p className="mb-3 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>}
      {info && <p className="mb-3 rounded-xl bg-green-50 px-3 py-2 text-xs text-green-700">{info}</p>}

      <form onSubmit={otpSent ? verify : sendOtp} className="space-y-3">
        {mode === 'register' && (
          <div>
            <label className="label text-xs">पूरा नाम</label>
            <input
              className="field text-sm"
              placeholder="आपका नाम"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={otpSent}
            />
          </div>
        )}
        <div>
          <label className="label text-xs">मोबाइल नंबर (10 अंक)</label>
          <input
            className="field text-sm"
            placeholder="10-digit mobile"
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            inputMode="numeric"
            maxLength={10}
            required
            disabled={otpSent}
          />
        </div>
        {otpSent && (
          <div>
            <label className="label text-xs">OTP (फोन पर आया)</label>
            <input
              className="field text-sm"
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              inputMode="numeric"
              maxLength={6}
              required
              autoFocus
            />
          </div>
        )}
        <button className="btn-primary w-full text-sm" disabled={busy}>
          {busy ? '...' : otpSent ? 'Verify OTP' : 'OTP भेजें'}
        </button>
        {otpSent && (
          <button
            type="button"
            className="w-full text-center text-xs text-slate underline"
            onClick={() => { setOtpSent(false); setOtp(''); setInfo('') }}
          >
            नंबर बदलें
          </button>
        )}
      </form>

      <button
        type="button"
        className="mt-4 w-full text-center text-xs text-slate/70"
        onClick={onCancel}
      >
        रद्द करें
      </button>
    </div>
  )
}
