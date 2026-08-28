'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { realtimeSocketUrl } from '@/lib/utils'

export type LiveAction = { type: string; href?: string; label?: string }

export type LiveEvent = {
  type: string
  text?: string
  reply?: string
  language?: string
  message?: string
  state?: string
  openai?: boolean
  voice?: boolean
  realtime?: boolean
  action?: LiveAction
}

type Options = {
  enabled: boolean
  onEvent: (event: LiveEvent) => void
  grievanceId?: string
  signedIn?: boolean
  path?: string
  language?: string
  justSignedIn?: boolean
  citizenName?: string
  memoryBrief?: string
  openingInstructions?: string
  onTool?: (name: string, args: Record<string, string>) => Promise<string>
  onGreetingDone?: () => void
}

function downsample(input: Float32Array, fromRate: number, toRate: number) {
  if (fromRate === toRate) return input
  const ratio = fromRate / toRate
  const length = Math.max(1, Math.round(input.length / ratio))
  const output = new Float32Array(length)
  for (let i = 0; i < length; i += 1) {
    const position = i * ratio
    const left = Math.floor(position)
    const right = Math.min(left + 1, input.length - 1)
    const mix = position - left
    output[i] = input[left] * (1 - mix) + input[right] * mix
  }
  return output
}

function floatToBase64Pcm16(input: Float32Array) {
  const pcm = new Int16Array(input.length)
  for (let i = 0; i < input.length; i += 1) {
    const sample = Math.max(-1, Math.min(1, input[i]))
    pcm[i] = sample < 0 ? sample * 0x8000 : sample * 0x7fff
  }
  const bytes = new Uint8Array(pcm.buffer)
  let binary = ''
  const step = 0x8000
  for (let i = 0; i < bytes.length; i += step) {
    binary += String.fromCharCode(...bytes.subarray(i, i + step))
  }
  return btoa(binary)
}

function base64ToInt16(value: string) {
  const binary = atob(value)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)
  return new Int16Array(bytes.buffer)
}

function isBenignCancel(message: string) {
  return /no active response|cancellation failed/i.test(message)
}

class PcmPlayer {
  ctx: AudioContext | null = null
  gain: GainNode | null = null
  next = 0
  generation = 0
  sources = new Set<AudioBufferSourceNode>()
  onDrain: (() => void) | null = null
  drainTimer = 0

  async unlock() {
    if (!this.ctx) {
      this.ctx = new AudioContext({ sampleRate: 24000 })
      this.gain = this.ctx.createGain()
      this.gain.connect(this.ctx.destination)
    }
    if (this.ctx.state === 'suspended') await this.ctx.resume()
  }

  stop() {
    this.generation += 1
    if (this.drainTimer) window.clearTimeout(this.drainTimer)
    this.drainTimer = 0
    for (const source of this.sources) {
      try {
        source.stop()
      } catch {
        /* already stopped */
      }
      try {
        source.disconnect()
      } catch {
        /* already disconnected */
      }
    }
    this.sources.clear()
    this.next = this.ctx?.currentTime || 0
    if (typeof window !== 'undefined') window.speechSynthesis?.cancel()
  }

  // True while audio is actually scheduled/playing through the speakers. Used to
  // gate the mic so she never hears herself — decoupled from any state flag so a
  // desynced flag can never deadlock the microphone.
  isPlaying() {
    if (this.sources.size > 0) return true
    if (this.ctx && this.ctx.currentTime + 0.03 < this.next) return true
    return false
  }

  private markDrain() {
    if (this.sources.size > 0 || !this.ctx) return
    if (this.ctx.currentTime + 0.04 < this.next) return
    this.onDrain?.()
  }

  async push(base64: string) {
    const generation = this.generation
    await this.unlock()
    if (!this.ctx || !this.gain || generation !== this.generation) return
    const pcm = base64ToInt16(base64)
    const floats = new Float32Array(pcm.length)
    for (let i = 0; i < pcm.length; i += 1) floats[i] = pcm[i] / 0x8000
    const buffer = this.ctx.createBuffer(1, floats.length, 24000)
    buffer.copyToChannel(floats, 0)
    const source = this.ctx.createBufferSource()
    source.buffer = buffer
    source.connect(this.gain)
    source.onended = () => {
      this.sources.delete(source)
      this.markDrain()
    }
    const start = Math.max(this.ctx.currentTime, this.next)
    this.sources.add(source)
    source.start(start)
    this.next = start + buffer.duration
    if (this.drainTimer) window.clearTimeout(this.drainTimer)
    const waitMs = Math.max(80, Math.round((this.next - this.ctx.currentTime) * 1000) + 60)
    this.drainTimer = window.setTimeout(() => {
      if (generation !== this.generation) return
      this.markDrain()
    }, waitMs)
  }
}

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

// AudioWorklet that buffers ~2048 samples and posts them to the main thread.
// Runs off the main thread so capture stays smooth even during React renders.
const CAPTURE_WORKLET = `
class SahayakCapture extends AudioWorkletProcessor {
  constructor() { super(); this._buf = []; this._count = 0 }
  process(inputs) {
    const ch = inputs[0] && inputs[0][0]
    if (ch && ch.length) {
      this._buf.push(ch.slice(0))
      this._count += ch.length
      if (this._count >= 2048) {
        const merged = new Float32Array(this._count)
        let o = 0
        for (const c of this._buf) { merged.set(c, o); o += c.length }
        this.port.postMessage(merged, [merged.buffer])
        this._buf = []; this._count = 0
      }
    }
    return true
  }
}
registerProcessor('sahayak-capture', SahayakCapture)
`

function isActiveResponseError(message: string) {
  return /already has an active response/i.test(message)
}

// Lightweight diagnostics. Enable in the browser console with:
//   localStorage.setItem('sahayakDebug', '1')  then reload.
function vlog(...args: unknown[]) {
  try {
    if (typeof window !== 'undefined' && window.localStorage?.getItem('sahayakDebug') === '1') {
      // eslint-disable-next-line no-console
      console.debug('[Sahayak]', ...args)
    }
  } catch {
    /* ignore */
  }
}

export function useRealtimeVoice({
  enabled,
  onEvent,
  grievanceId,
  signedIn,
  path,
  language,
  justSignedIn,
  citizenName,
  memoryBrief,
  openingInstructions,
  onTool,
  onGreetingDone,
}: Options) {
  const [connected, setConnected] = useState(false)
  const [liveReady, setLiveReady] = useState(false)
  const [readyMessage, setReadyMessage] = useState('Connecting…')
  const [listening, setListening] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const socketRef = useRef<WebSocket | null>(null)
  const onEventRef = useRef(onEvent)
  const onToolRef = useRef(onTool)
  const onGreetingDoneRef = useRef(onGreetingDone)
  const sessionRef = useRef({
    signedIn: Boolean(signedIn),
    path: path || '',
    language: language || 'hi',
    justSignedIn: Boolean(justSignedIn),
    citizenName: citizenName || '',
    memoryBrief: memoryBrief || '',
    openingInstructions: openingInstructions || '',
  })
  const playerRef = useRef(new PcmPlayer())
  const streamRef = useRef<MediaStream | null>(null)
  const processorRef = useRef<ScriptProcessorNode | null>(null)
  const workletRef = useRef<AudioWorkletNode | null>(null)
  const captureCtxRef = useRef<AudioContext | null>(null)
  const listeningRef = useRef(false)
  const wantMicRef = useRef(false)
  const speakingRef = useRef(false)
  // Half-duplex: ignore mic input until this timestamp (set right after she stops
  // speaking) so the tail/echo of her own voice is never captured as user speech.
  const micCooldownUntilRef = useRef(0)
  // Timestamp of the last audio chunk RECEIVED from the model. The mic gate is
  // driven purely off this (self-expiring) so it can never deadlock.
  const lastAudioAtRef = useRef(0)
  const lastFrameLogRef = useRef(0)
  const pendingCallsRef = useRef(0)
  const seenCallsRef = useRef(new Set<string>())
  const turnDoneRef = useRef(false)
  // Response queue — the server allows only ONE active response at a time. We
  // track it here and defer any extra response.create so we never hit the
  // "Conversation already has an active response" error (the main cause of freezes).
  const activeResponseRef = useRef(false)
  const queuedResponseRef = useRef<Record<string, unknown> | null>(null)
  const lastResponsePayloadRef = useRef<Record<string, unknown> | null>(null)
  // Timestamp when the current response started, used by the stuck-response
  // watchdog so a lost response.done can never freeze the session forever.
  const responseStartedAtRef = useRef(0)
  const activeResponseIdRef = useRef('')
  const turnGenRef = useRef(0)
  const modelDoneRef = useRef(true)
  const greetingPendingRef = useRef(false)
  const greetedRef = useRef(false)
  const lastPageRef = useRef('')
  // Set when user signs in mid-session so we can trigger a response after the
  // model finishes its current turn and the lodge form has mounted.
  const postSignInPendingRef = useRef(false)

  useEffect(() => {
    onEventRef.current = onEvent
  }, [onEvent])

  useEffect(() => {
    onToolRef.current = onTool
  }, [onTool])

  useEffect(() => {
    onGreetingDoneRef.current = onGreetingDone
  }, [onGreetingDone])

  useEffect(() => {
    const wasSignedIn = sessionRef.current.signedIn
    sessionRef.current = {
      signedIn: Boolean(signedIn),
      path: path || '',
      language: language || 'hi',
      justSignedIn: Boolean(justSignedIn),
      citizenName: citizenName || '',
      memoryBrief: memoryBrief || '',
      openingInstructions: openingInstructions || '',
    }
    // When the user signs in mid-session, mark that we need a post-sign-in trigger.
    if (!wasSignedIn && Boolean(signedIn) && Boolean(justSignedIn)) {
      postSignInPendingRef.current = true
    }
  }, [signedIn, path, language, justSignedIn, citizenName, memoryBrief, openingInstructions])

  const sendEvent = useCallback((payload: Record<string, unknown>) => {
    const socket = socketRef.current
    if (!socket || socket.readyState !== WebSocket.OPEN) return false
    socket.send(JSON.stringify(payload))
    return true
  }, [])

  const setSpeakingNow = useCallback((next: boolean) => {
    // When she stops speaking, keep the mic closed for a brief cooldown so the
    // tail/echo of her voice is never captured as user speech.
    if (speakingRef.current && !next) {
      micCooldownUntilRef.current = performance.now() + 160
    }
    speakingRef.current = next
    setSpeaking(next)
  }, [])

  // Send a response.create, but only one at a time. If a response is already
  // in flight, defer this one and fire it when the current response finishes.
  const enqueueResponse = useCallback(
    (payload?: Record<string, unknown>) => {
      const event = payload || { type: 'response.create' }
      if (activeResponseRef.current) {
        queuedResponseRef.current = event
        return
      }
      // Only mark active if the send actually left the socket.
      if (!sendEvent(event)) return
      activeResponseRef.current = true
      lastResponsePayloadRef.current = event
      responseStartedAtRef.current = performance.now()
    },
    [sendEvent]
  )

  const flushQueuedResponse = useCallback(() => {
    const queued = queuedResponseRef.current
    queuedResponseRef.current = null
    if (queued) {
      activeResponseRef.current = true
      lastResponsePayloadRef.current = queued
      sendEvent(queued)
    }
  }, [sendEvent])

  const bargeIn = useCallback(() => {
    turnGenRef.current += 1
    turnDoneRef.current = false
    pendingCallsRef.current = 0
    modelDoneRef.current = true
    queuedResponseRef.current = null
    playerRef.current.stop()
    if (activeResponseRef.current) {
      // Keep activeResponseRef true; response.cancelled will clear it and flush
      // any queued response, so a follow-up (e.g. typed text) fires cleanly.
      sendEvent({ type: 'response.cancel' })
    }
    activeResponseIdRef.current = ''
    setSpeakingNow(false)
  }, [sendEvent, setSpeakingNow])

  const releaseMicHardware = useCallback(() => {
    listeningRef.current = false
    setListening(false)
    const processor = processorRef.current
    if (processor) processor.onaudioprocess = null
    processor?.disconnect()
    processorRef.current = null
    const node = workletRef.current
    if (node) {
      node.port.onmessage = null
      node.disconnect()
    }
    workletRef.current = null
    const ctx = captureCtxRef.current
    captureCtxRef.current = null
    void ctx?.close().catch(() => undefined)
    streamRef.current?.getTracks().forEach((track) => {
      track.stop()
      track.enabled = false
    })
    streamRef.current = null
  }, [])

  const stopMic = useCallback(() => {
    wantMicRef.current = false
    sendEvent({ type: 'input_audio_buffer.clear' })
    releaseMicHardware()
  }, [releaseMicHardware, sendEvent])

  const startMic = useCallback(async () => {
    wantMicRef.current = true
    if (listeningRef.current) return
    await playerRef.current.unlock()
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: 1 },
    })
    if (!wantMicRef.current) {
      stream.getTracks().forEach((track) => track.stop())
      return
    }
    const ctx = new AudioContext()
    const source = ctx.createMediaStreamSource(stream)

    // Half-duplex gate, driven purely by when audio last ARRIVED from the model.
    // Chunks stream continuously for the whole spoken turn, so the gate stays shut
    // during her speech and self-opens ~350ms after the last chunk. Because it is
    // time-based it can NEVER deadlock, even if a state flag or the player desyncs.
    const handleFrame = (samples: Float32Array) => {
      if (!listeningRef.current || !wantMicRef.current) return
      const now = performance.now()
      const sinceAudio = now - lastAudioAtRef.current
      // Cover the short playback tail after the last chunk, but only briefly.
      if (sinceAudio < 260 || (sinceAudio < 900 && playerRef.current.isPlaying())) {
        if (now - lastFrameLogRef.current > 2000) {
          lastFrameLogRef.current = now
          vlog('mic gated (she is speaking)')
        }
        return
      }
      if (now < micCooldownUntilRef.current) return
      const down = downsample(samples, ctx.sampleRate, 24000)
      sendEvent({ type: 'input_audio_buffer.append', audio: floatToBase64Pcm16(down) })
      if (now - lastFrameLogRef.current > 2000) {
        lastFrameLogRef.current = now
        vlog('mic → sending audio frames')
      }
    }

    let usingWorklet = false
    try {
      if (ctx.audioWorklet) {
        const blob = new Blob([CAPTURE_WORKLET], { type: 'application/javascript' })
        const url = URL.createObjectURL(blob)
        await ctx.audioWorklet.addModule(url)
        URL.revokeObjectURL(url)
        if (!wantMicRef.current) {
          stream.getTracks().forEach((track) => track.stop())
          await ctx.close().catch(() => undefined)
          return
        }
        const node = new AudioWorkletNode(ctx, 'sahayak-capture')
        node.port.onmessage = (event) => handleFrame(event.data as Float32Array)
        source.connect(node)
        workletRef.current = node
        usingWorklet = true
      }
    } catch {
      usingWorklet = false
    }

    if (!usingWorklet) {
      // Fallback for older browsers.
      const processor = ctx.createScriptProcessor(4096, 1, 1)
      const mute = ctx.createGain()
      mute.gain.value = 0
      processor.onaudioprocess = (event) => handleFrame(event.inputBuffer.getChannelData(0))
      source.connect(processor)
      processor.connect(mute)
      mute.connect(ctx.destination)
      processorRef.current = processor
    }

    streamRef.current = stream
    captureCtxRef.current = ctx
    listeningRef.current = true
    setListening(true)
  }, [sendEvent])

  useEffect(() => {
    if (!enabled) {
      stopMic()
      playerRef.current.stop()
      socketRef.current?.close()
      socketRef.current = null
      setConnected(false)
      setLiveReady(false)
      setSpeakingNow(false)
      activeResponseRef.current = false
      queuedResponseRef.current = null
      pendingCallsRef.current = 0
      turnDoneRef.current = false
      modelDoneRef.current = true
      greetedRef.current = false
      greetingPendingRef.current = false
      lastPageRef.current = ''
      postSignInPendingRef.current = false
      return
    }

    let cancelled = false
    let hangTimer = 0
    let reconnectTimer = 0
    let greetingTimer = 0
    let attempts = 0

    // Watchdog: if a response is marked active but never finishes (a lost
    // response.done, a dropped tool turn, etc.), clear it so the queue keeps
    // flowing instead of freezing forever.
    const watchdog = window.setInterval(() => {
      // Mobile browsers suspend AudioContexts on navigation/visibility changes,
      // which silently kills mic capture — resume them so the mic keeps flowing.
      const cap = captureCtxRef.current
      if (cap && cap.state === 'suspended') void cap.resume().catch(() => undefined)
      const play = playerRef.current.ctx
      if (play && play.state === 'suspended') void play.resume().catch(() => undefined)
      if (
        activeResponseRef.current &&
        responseStartedAtRef.current &&
        performance.now() - responseStartedAtRef.current > 15000 &&
        playerRef.current.sources.size === 0 &&
        pendingCallsRef.current === 0
      ) {
        activeResponseRef.current = false
        responseStartedAtRef.current = 0
        modelDoneRef.current = true
        setSpeakingNow(false)
        if (greetingPendingRef.current) finishGreeting()
        flushQueuedResponse()
        onEventRef.current({ type: 'status', state: listeningRef.current ? 'listening' : 'idle' })
      }
    }, 1500)

    // Mobile suspends audio on tab switches / navigation; resume immediately when
    // the page regains focus so the mic never silently dies after a page change.
    const resumeContexts = () => {
      const cap = captureCtxRef.current
      if (cap && cap.state === 'suspended') void cap.resume().catch(() => undefined)
      const play = playerRef.current.ctx
      if (play && play.state === 'suspended') void play.resume().catch(() => undefined)
    }
    document.addEventListener('visibilitychange', resumeContexts)
    window.addEventListener('focus', resumeContexts)

    const finishGreeting = () => {
      if (!greetingPendingRef.current) return
      greetingPendingRef.current = false
      greetedRef.current = true
      setLiveReady(true)
      onGreetingDoneRef.current?.()
    }

    const openSession = () => {
      const session = sessionRef.current
      lastPageRef.current = session.path
      greetingPendingRef.current = true
      setLiveReady(false)
      enqueueResponse({
        type: 'response.create',
        response: {
          instructions:
            session.openingInstructions ||
            'Speak only simple Hindi. Say: “नमस्ते, मैं सहायिका हूँ। बोलने के लिए Speak बटन दबाएँ।” Never Russian. Then wait. Do not read instructions aloud.',
        },
      })
      window.clearTimeout(greetingTimer)
      greetingTimer = window.setTimeout(finishGreeting, 8000)
    }

    playerRef.current.onDrain = () => {
      if (!modelDoneRef.current) return
      setSpeakingNow(false)
    }

    const attach = (socket: WebSocket) => {
    socketRef.current = socket
    hangTimer = window.setTimeout(() => {
      if (cancelled || socketRef.current !== socket) return
      setReadyMessage('Taking too long. Close the panel and try again.')
      onEventRef.current({
        type: 'error',
        message: 'Voice did not become ready. Close Sahayak and open it again.',
      })
    }, 22000)

    socket.onopen = () => {
      if (cancelled) return
      setReadyMessage('Connecting…')
    }

    socket.onmessage = (event) => {
      let payload: Record<string, unknown>
      try {
        payload = JSON.parse(event.data)
      } catch {
        return
      }
      const type = String(payload.type || '')
      if (type === 'status' && payload.state === 'connecting') {
        setReadyMessage(String(payload.message || 'Connecting…'))
        return
      }
      if (type === 'ready') {
        window.clearTimeout(hangTimer)
        attempts = 0
        seenCallsRef.current.clear()
        pendingCallsRef.current = 0
        turnDoneRef.current = false
        activeResponseRef.current = false
        queuedResponseRef.current = null
        setConnected(true)
        setReadyMessage(String(payload.message || 'Connected'))
        onEventRef.current({ type: 'ready', realtime: true, voice: true, openai: true, message: String(payload.message || '') })
        window.setTimeout(() => {
          if (cancelled || socketRef.current !== socket) return
          openSession()
        }, 280)
        return
      }
      if (type === 'error') {
        const detail =
          (payload.error as { message?: string } | undefined)?.message ||
          String(payload.message || 'Voice had a problem.')
        if (isBenignCancel(detail)) return
        // A response was already active when we sent one — remember it and retry
        // when the active one finishes. Never surface this to the user.
        if (isActiveResponseError(detail)) {
          activeResponseRef.current = true
          if (lastResponsePayloadRef.current) queuedResponseRef.current = lastResponsePayloadRef.current
          return
        }
        const clean = /openai/i.test(detail) ? 'Voice had a problem. Close Sahayak and try again.' : detail
        setReadyMessage(clean)
        onEventRef.current({ type: 'error', message: clean })
        return
      }
      if (type === 'input_audio_buffer.speech_started') {
        vlog('server: speech_started (heard the user)')
        // Mic is half-duplex (closed while she speaks), so this only fires for
        // genuine user speech. Interrupt any lingering audio and start listening.
        if (!listeningRef.current || !wantMicRef.current || greetingPendingRef.current) {
          sendEvent({ type: 'input_audio_buffer.clear' })
          return
        }
        if (speakingRef.current) bargeIn()
        onEventRef.current({ type: 'status', state: 'listening' })
      }
      if (type === 'input_audio_buffer.speech_stopped') {
        if (!listeningRef.current) return
        onEventRef.current({ type: 'status', state: 'thinking' })
      }
      if (type === 'conversation.item.input_audio_transcription.completed') {
        const text = String(payload.transcript || '').trim()
        if (
          text &&
          !/^\[internal/i.test(text) &&
          !/indian citizen speaking|transcribe only|never russian|language lock|session memory/i.test(text)
        ) {
          vlog('user said:', text)
          onEventRef.current({ type: 'user', text })
        }
      }
      if (type === 'response.audio_transcript.delta' || type === 'response.output_audio_transcript.delta') {
        const text = String(payload.delta || '')
        if (text) onEventRef.current({ type: 'token', text })
      }
      if (type === 'response.audio_transcript.done' || type === 'response.output_audio_transcript.done') {
        const text = String(payload.transcript || '').trim()
        if (
          text &&
          !/indian citizen speaking|transcribe only|never russian|language lock|session memory|feminine forms/i.test(text)
        ) {
          onEventRef.current({ type: 'done', reply: text, language: 'hi' })
        }
      }
      if (type === 'response.created') {
        const response = payload.response as { id?: string } | undefined
        const id = String(response?.id || payload.response_id || '')
        vlog('server: response.created', id)
        activeResponseRef.current = true
        activeResponseIdRef.current = id
        responseStartedAtRef.current = performance.now()
      }
      if (type === 'response.audio.delta' || type === 'response.output_audio.delta') {
        const audio = String(payload.delta || '')
        const responseId = String(payload.response_id || '')
        if (
          audio &&
          (!responseId || !activeResponseIdRef.current || responseId === activeResponseIdRef.current)
        ) {
          activeResponseRef.current = true
          modelDoneRef.current = false
          lastAudioAtRef.current = performance.now()
          setSpeakingNow(true)
          void playerRef.current.push(audio)
        }
      }
      if (type === 'response.function_call_arguments.done' || type === 'response.output_item.done') {
        const item = (payload.item as Record<string, unknown> | undefined) || payload
        const name = String(item.name || '')
        const callId = String(item.call_id || '')
        const rawArgs = item.arguments
        if (name && callId && rawArgs != null && !seenCallsRef.current.has(callId)) {
          vlog('tool call →', name, rawArgs)
          seenCallsRef.current.add(callId)
          pendingCallsRef.current += 1
          const toolGen = turnGenRef.current
          void (async () => {
            let parsed: Record<string, string> = {}
            try {
              parsed = JSON.parse(String(rawArgs || '{}')) as Record<string, string>
            } catch {
              parsed = {}
            }
            let output = 'ok'
            try {
              output =
                (await Promise.race([
                  onToolRef.current?.(name, parsed) || Promise.resolve('ok'),
                  wait(12000).then(
                    () =>
                      'Tool took too long. Continue with what you already know. Do not repeat the last question.'
                  ),
                ])) || 'ok'
            } catch (err) {
              output = err instanceof Error ? err.message : 'Tool failed'
            }
            sendEvent({
              type: 'conversation.item.create',
              item: { type: 'function_call_output', call_id: callId, output },
            })
            pendingCallsRef.current = Math.max(0, pendingCallsRef.current - 1)
            if (pendingCallsRef.current === 0 && toolGen === turnGenRef.current) {
              turnDoneRef.current = false
              // Enqueue regardless of whether response.done has arrived yet.
              // If activeResponseRef is still true (response.done hasn't fired),
              // enqueueResponse queues it; flushQueuedResponse in response.done
              // then sends it. If response.done already fired, it sends immediately.
              // This eliminates the race where tool completes before response.done
              // and the queue is never flushed.
              enqueueResponse()
            }
          })()
        }
      }
      if (type === 'response.done' || type === 'response.cancelled') {
        vlog('server:', type, 'pendingCalls=', pendingCallsRef.current)
        activeResponseRef.current = false
        responseStartedAtRef.current = 0
        if (type === 'response.cancelled') {
          pendingCallsRef.current = 0
          turnDoneRef.current = false
          modelDoneRef.current = true
          if (greetingPendingRef.current) finishGreeting()
          flushQueuedResponse()
          onEventRef.current({ type: 'status', state: listeningRef.current ? 'listening' : 'idle' })
          return
        }
        modelDoneRef.current = true
        if (pendingCallsRef.current > 0) {
          // Tools still running — their completion handlers will call enqueueResponse
          // once pendingCalls reaches 0. Mark turnDone so the old path also works.
          turnDoneRef.current = true
          if (playerRef.current.sources.size === 0) setSpeakingNow(false)
          // Still flush any pre-queued response so a previously-queued event isn't lost.
          flushQueuedResponse()
          return
        }
        if (greetingPendingRef.current) finishGreeting()
        if (playerRef.current.sources.size === 0) {
          setSpeakingNow(false)
          onEventRef.current({ type: 'status', state: listeningRef.current ? 'listening' : 'idle' })
        }
        // After sign-in mid-session: fire a clean response so she continues.
        if (postSignInPendingRef.current) {
          postSignInPendingRef.current = false
          window.setTimeout(() => {
            if (pendingCallsRef.current === 0) enqueueResponse()
          }, 1200)
          return
        }
        flushQueuedResponse()
      }
    }

    socket.onerror = () => {
      setReadyMessage('Connection lost')
    }

    socket.onclose = () => {
      if (cancelled) return
      setConnected(false)
      window.clearTimeout(hangTimer)
      if (attempts >= 4) {
        setReadyMessage('Live voice disconnected')
        return
      }
      attempts += 1
      setReadyMessage('Reconnecting…')
      reconnectTimer = window.setTimeout(connect, 700 * attempts)
    }
    }

    const connect = () => {
      if (cancelled) return
      const session = sessionRef.current
      const next = new WebSocket(
        realtimeSocketUrl({
          registrationId: grievanceId,
          signedIn: session.signedIn,
          path: session.path,
          lang: session.language,
          justSignedIn: session.justSignedIn,
          citizenName: session.citizenName,
        })
      )
      attach(next)
    }

    connect()

    return () => {
      cancelled = true
      window.clearInterval(watchdog)
      document.removeEventListener('visibilitychange', resumeContexts)
      window.removeEventListener('focus', resumeContexts)
      window.clearTimeout(hangTimer)
      window.clearTimeout(reconnectTimer)
      window.clearTimeout(greetingTimer)
      playerRef.current.onDrain = null
      const socket = socketRef.current
      socketRef.current = null
      socket?.close()
      releaseMicHardware()
    }
  }, [bargeIn, enabled, enqueueResponse, flushQueuedResponse, grievanceId, releaseMicHardware, sendEvent, setSpeakingNow, startMic, stopMic])

  const sendText = useCallback(
    (text: string) => {
      const trimmed = text.trim()
      if (!trimmed) return false
      // If she is mid-sentence, cancel first. The queue then fires our reply once
      // the cancellation lands, so there is no "active response" race.
      if (speakingRef.current || activeResponseRef.current) bargeIn()
      const ok = sendEvent({
        type: 'conversation.item.create',
        item: {
          type: 'message',
          role: 'user',
          content: [{ type: 'input_text', text: trimmed }],
        },
      })
      if (ok) enqueueResponse()
      return ok
    },
    [bargeIn, enqueueResponse, sendEvent]
  )

  const interrupt = useCallback(() => {
    bargeIn()
  }, [bargeIn])

  // Inject an internal (not user-visible) context message and optionally prompt
  // her to respond. Used for signals like sign-in success or a photo attachment.
  const sendContext = useCallback(
    (text: string, respond = true) => {
      const ok = sendEvent({
        type: 'conversation.item.create',
        item: { type: 'message', role: 'user', content: [{ type: 'input_text', text }] },
      })
      if (ok && respond) enqueueResponse()
      return ok
    },
    [enqueueResponse, sendEvent]
  )

  useEffect(() => {
    if (!enabled || !connected) return
    const nextPath = path || ''
    if (!nextPath || nextPath === lastPageRef.current) return
    lastPageRef.current = nextPath
    const session = sessionRef.current
    const afterSignIn = session.justSignedIn
    const extras = afterSignIn
      ? ' User JUST signed in. Do NOT re-ask the problem — it is in the memory below. Call route_complaint or lodge directly. Fill the form from saved context.'
      : ''
    sendEvent({
      type: 'conversation.item.create',
      item: {
        type: 'message',
        role: 'user',
        content: [
          {
            type: 'input_text',
            text: `[CONTEXT] Page is now ${nextPath}. Signed in: ${session.signedIn ? 'yes' : 'no'}.${extras} Do not read this aloud. Continue the same goal. Do not restart or re-ask filled fields.`,
          },
        ],
      },
    })
    // Note: the response.done handler fires the actual response.create after sign-in
    // (postSignInPendingRef), so we don't need to trigger it here.
  }, [connected, enabled, path, sendEvent, signedIn])

  return { connected, liveReady, readyMessage, listening, speaking, startMic, stopMic, sendText, sendContext, interrupt }
}
