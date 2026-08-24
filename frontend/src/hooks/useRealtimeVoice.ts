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
  onTool?: (name: string, args: Record<string, string>) => Promise<string>
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
    source.onended = () => this.sources.delete(source)
    const start = Math.max(this.ctx.currentTime, this.next)
    this.sources.add(source)
    source.start(start)
    this.next = start + buffer.duration
  }
}

export function useRealtimeVoice({ enabled, onEvent, grievanceId, signedIn, path, language, onTool }: Options) {
  const [connected, setConnected] = useState(false)
  const [readyMessage, setReadyMessage] = useState('Connecting…')
  const [listening, setListening] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const socketRef = useRef<WebSocket | null>(null)
  const onEventRef = useRef(onEvent)
  const onToolRef = useRef(onTool)
  const playerRef = useRef(new PcmPlayer())
  const streamRef = useRef<MediaStream | null>(null)
  const processorRef = useRef<ScriptProcessorNode | null>(null)
  const captureCtxRef = useRef<AudioContext | null>(null)
  const listeningRef = useRef(false)
  const pendingCallsRef = useRef(0)
  const seenCallsRef = useRef(new Set<string>())
  const turnDoneRef = useRef(false)
  const responseActiveRef = useRef(false)
  const activeResponseIdRef = useRef('')
  const turnGenRef = useRef(0)

  useEffect(() => {
    onEventRef.current = onEvent
  }, [onEvent])

  useEffect(() => {
    onToolRef.current = onTool
  }, [onTool])

  const sendEvent = useCallback((payload: Record<string, unknown>) => {
    const socket = socketRef.current
    if (!socket || socket.readyState !== WebSocket.OPEN) return false
    socket.send(JSON.stringify(payload))
    return true
  }, [])

  const bargeIn = useCallback(() => {
    turnGenRef.current += 1
    turnDoneRef.current = false
    playerRef.current.stop()
    if (responseActiveRef.current) {
      sendEvent({ type: 'response.cancel' })
    }
    responseActiveRef.current = false
    activeResponseIdRef.current = ''
    setSpeaking(false)
  }, [sendEvent])

  const stopMic = useCallback(() => {
    listeningRef.current = false
    setListening(false)
    processorRef.current?.disconnect()
    processorRef.current = null
    captureCtxRef.current?.close().catch(() => undefined)
    captureCtxRef.current = null
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
  }, [])

  const startMic = useCallback(async () => {
    if (listeningRef.current) return
    await playerRef.current.unlock()
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, channelCount: 1 },
    })
    const ctx = new AudioContext()
    const source = ctx.createMediaStreamSource(stream)
    const processor = ctx.createScriptProcessor(4096, 1, 1)
    const mute = ctx.createGain()
    mute.gain.value = 0
    processor.onaudioprocess = (event) => {
      if (!listeningRef.current) return
      const down = downsample(event.inputBuffer.getChannelData(0), ctx.sampleRate, 24000)
      sendEvent({ type: 'input_audio_buffer.append', audio: floatToBase64Pcm16(down) })
    }
    source.connect(processor)
    processor.connect(mute)
    mute.connect(ctx.destination)
    streamRef.current = stream
    captureCtxRef.current = ctx
    processorRef.current = processor
    listeningRef.current = true
    setListening(true)
  }, [sendEvent])

  useEffect(() => {
    if (!enabled) {
      stopMic()
      socketRef.current?.close()
      socketRef.current = null
      setConnected(false)
      return
    }

    let cancelled = false
    const socket = new WebSocket(
      realtimeSocketUrl({ registrationId: grievanceId, signedIn, path, lang: language })
    )
    socketRef.current = socket
    const hangTimer = window.setTimeout(() => {
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
        setConnected(true)
        setReadyMessage(String(payload.message || 'Connected'))
        onEventRef.current({ type: 'ready', realtime: true, voice: true, openai: true, message: String(payload.message || '') })
        if ((language || '').toLowerCase().startsWith('hi')) {
          window.setTimeout(() => {
            if (cancelled || socketRef.current !== socket) return
            sendEvent({
              type: 'response.create',
              response: {
                instructions:
                  'Greet now in simple Hindi, before the citizen speaks. Say close to: नमस्ते। बोलिए, क्या हुआ? मैं साइन इन खोल सकती हूँ, फिर शिकायत इसी पोर्टल पर दर्ज कर दूँगी। Do not speak English in this greeting.',
              },
            })
          }, 400)
        }
        return
      }
      if (type === 'error') {
        const detail =
          (payload.error as { message?: string } | undefined)?.message ||
          String(payload.message || 'Voice had a problem.')
        if (isBenignCancel(detail)) return
        const clean = /openai/i.test(detail) ? 'Voice had a problem. Close Sahayak and try again.' : detail
        setReadyMessage(clean)
        onEventRef.current({ type: 'error', message: clean })
        return
      }
      if (type === 'input_audio_buffer.speech_started') {
        bargeIn()
        onEventRef.current({ type: 'status', state: 'listening' })
      }
      if (type === 'input_audio_buffer.speech_stopped') {
        onEventRef.current({ type: 'status', state: 'thinking' })
      }
      if (type === 'conversation.item.input_audio_transcription.completed') {
        const text = String(payload.transcript || '')
        if (text) onEventRef.current({ type: 'user', text })
      }
      if (type === 'response.audio_transcript.delta' || type === 'response.output_audio_transcript.delta') {
        const text = String(payload.delta || '')
        if (text) onEventRef.current({ type: 'token', text })
      }
      if (type === 'response.audio_transcript.done' || type === 'response.output_audio_transcript.done') {
        const text = String(payload.transcript || '')
        if (text) onEventRef.current({ type: 'done', reply: text, language: 'en' })
      }
      if (type === 'response.created') {
        const response = payload.response as { id?: string } | undefined
        const id = String(response?.id || payload.response_id || '')
        responseActiveRef.current = true
        activeResponseIdRef.current = id
      }
      if (type === 'response.audio.delta' || type === 'response.output_audio.delta') {
        const audio = String(payload.delta || '')
        const responseId = String(payload.response_id || '')
        if (
          audio &&
          (!responseId || !activeResponseIdRef.current || responseId === activeResponseIdRef.current)
        ) {
          responseActiveRef.current = true
          setSpeaking(true)
          void playerRef.current.push(audio)
        }
      }
      if (type === 'response.function_call_arguments.done' || type === 'response.output_item.done') {
        const item = (payload.item as Record<string, unknown> | undefined) || payload
        const name = String(item.name || '')
        const callId = String(item.call_id || '')
        const rawArgs = item.arguments
        if (name && callId && rawArgs != null && !seenCallsRef.current.has(callId)) {
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
              output = (await onToolRef.current?.(name, parsed)) || 'ok'
            } catch (err) {
              output = err instanceof Error ? err.message : 'Tool failed'
            }
            if (toolGen !== turnGenRef.current) return
            sendEvent({
              type: 'conversation.item.create',
              item: { type: 'function_call_output', call_id: callId, output },
            })
            pendingCallsRef.current = Math.max(0, pendingCallsRef.current - 1)
            if (pendingCallsRef.current === 0 && turnDoneRef.current && toolGen === turnGenRef.current) {
              turnDoneRef.current = false
              sendEvent({ type: 'response.create' })
            }
          })()
        }
      }
      if (type === 'response.done' || type === 'response.cancelled') {
        responseActiveRef.current = false
        if (type === 'response.done' && pendingCallsRef.current > 0) {
          turnDoneRef.current = true
          return
        }
        setSpeaking(false)
        onEventRef.current({ type: 'status', state: 'idle' })
      }
    }

    socket.onerror = () => {
      setReadyMessage('Connection lost')
    }

    socket.onclose = () => {
      if (cancelled) return
      setConnected(false)
      setReadyMessage('Live voice disconnected')
      stopMic()
    }

    return () => {
      cancelled = true
      window.clearTimeout(hangTimer)
      stopMic()
      socket.close()
    }
  }, [bargeIn, enabled, grievanceId, language, sendEvent, stopMic])

  const sendText = useCallback(
    (text: string) => {
      const trimmed = text.trim()
      if (!trimmed) return false
      bargeIn()
      const ok = sendEvent({
        type: 'conversation.item.create',
        item: {
          type: 'message',
          role: 'user',
          content: [{ type: 'input_text', text: trimmed }],
        },
      })
      if (ok) sendEvent({ type: 'response.create' })
      return ok
    },
    [bargeIn, sendEvent]
  )

  const interrupt = useCallback(() => {
    bargeIn()
  }, [bargeIn])

  return { connected, readyMessage, listening, speaking, startMic, stopMic, sendText, interrupt }
}
