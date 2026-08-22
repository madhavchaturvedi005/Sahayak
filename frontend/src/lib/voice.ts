import { api } from '@/lib/api'

type SpeechWindow = Window & {
  SpeechRecognition?: new () => BrowserRecognition
  webkitSpeechRecognition?: new () => BrowserRecognition
}

type BrowserRecognition = {
  lang: string
  continuous: boolean
  interimResults: boolean
  start: () => void
  stop: () => void
  abort: () => void
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null
  onerror: ((event: { error?: string }) => void) | null
  onend: (() => void) | null
}

let audioUnlocked = false

export async function unlockAudio() {
  if (typeof window === 'undefined' || audioUnlocked) return
  try {
    window.speechSynthesis?.cancel()
    const silent = new SpeechSynthesisUtterance(' ')
    silent.volume = 0
    window.speechSynthesis?.speak(silent)
    window.speechSynthesis?.cancel()
  } catch {
    /* ignore */
  }
  try {
    const Ctx = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (Ctx) {
      const ctx = new Ctx()
      await ctx.resume()
      const buffer = ctx.createBuffer(1, 1, 22050)
      const source = ctx.createBufferSource()
      source.buffer = buffer
      source.connect(ctx.destination)
      source.start(0)
    }
  } catch {
    /* ignore */
  }
  audioUnlocked = true
}

function recognitionCtor() {
  if (typeof window === 'undefined') return null
  const w = window as SpeechWindow
  return w.SpeechRecognition || w.webkitSpeechRecognition || null
}

function pickRecorderType() {
  if (typeof MediaRecorder === 'undefined' || !MediaRecorder.isTypeSupported) return ''
  return ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg'].find((type) => MediaRecorder.isTypeSupported(type)) || ''
}

export function canListen() {
  return Boolean(recognitionCtor() || (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia))
}

export function startListening(onPartial?: (text: string) => void) {
  const Recognition = recognitionCtor()
  if (Recognition) {
    const rec = new Recognition()
    rec.lang = navigator.language?.startsWith('hi') ? 'hi-IN' : 'en-IN'
    rec.continuous = true
    rec.interimResults = true
    let finalText = ''
    let finished: (value: { text: string; language: string }) => void = () => undefined
    const done = new Promise<{ text: string; language: string }>((resolve) => {
      finished = resolve
    })

    rec.onresult = (event) => {
      let interim = ''
      let nextFinal = ''
      for (let i = 0; i < event.results.length; i += 1) {
        const row = event.results[i] as unknown as { isFinal?: boolean; 0?: { transcript: string } }
        const piece = row[0]?.transcript || ''
        if (row.isFinal) nextFinal += `${piece} `
        else interim += piece
      }
      finalText = (nextFinal || finalText || interim).trim()
      onPartial?.(finalText || interim)
    }
    const settle = () => finished({ text: finalText.trim(), language: rec.lang.startsWith('hi') ? 'hi' : 'en' })
    rec.onerror = settle
    rec.onend = settle
    rec.start()

    return {
      stop: async () => {
        try {
          rec.stop()
        } catch {
          rec.abort()
        }
        return done
      },
    }
  }

  return startRecorderListen(onPartial)
}

function startRecorderListen(onPartial?: (text: string) => void) {
  let recorder: MediaRecorder | null = null
  let stream: MediaStream | null = null
  const chunks: Blob[] = []
  let stopped: (blob: Blob) => void = () => undefined
  const blobReady = new Promise<Blob>((resolve) => {
    stopped = resolve
  })

  const boot = navigator.mediaDevices.getUserMedia({ audio: true }).then((media) => {
    stream = media
    const mime = pickRecorderType()
    recorder = mime ? new MediaRecorder(media, { mimeType: mime }) : new MediaRecorder(media)
    recorder.ondataavailable = (event) => {
      if (event.data.size) chunks.push(event.data)
    }
    recorder.onstop = () => {
      stream?.getTracks().forEach((track) => track.stop())
      stopped(new Blob(chunks, { type: recorder?.mimeType || 'audio/webm' }))
    }
    recorder.start()
    onPartial?.('Listening…')
  })

  return {
    stop: async () => {
      await boot
      if (recorder && recorder.state !== 'inactive') recorder.stop()
      else stream?.getTracks().forEach((track) => track.stop())
      const blob = await blobReady
      if (!blob.size) return { text: '', language: 'en' }
      const result = await api.transcribe(blob)
      return { text: result.text, language: result.language || 'en' }
    },
  }
}

function browserSpeak(text: string, lang: string) {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    throw new Error('This browser cannot speak the reply.')
  }
  window.speechSynthesis.cancel()
  const utter = new SpeechSynthesisUtterance(text)
  utter.lang = lang.startsWith('hi') ? 'hi-IN' : 'en-IN'
  const voices = window.speechSynthesis.getVoices()
  const match =
    voices.find((voice) => voice.lang.toLowerCase().startsWith(utter.lang.toLowerCase())) ||
    voices.find((voice) => voice.lang.toLowerCase().startsWith(lang.slice(0, 2)))
  if (match) utter.voice = match
  window.speechSynthesis.speak(utter)
  return new Promise<void>((resolve) => {
    utter.onend = () => resolve()
    utter.onerror = () => resolve()
    window.setTimeout(resolve, Math.min(20000, 800 + text.length * 60))
  })
}

export async function speakReply(text: string, language: string, audioEl: HTMLAudioElement) {
  try {
    const blob = await api.speak(text, language)
    const url = URL.createObjectURL(blob)
    audioEl.pause()
    audioEl.src = url
    await audioEl.play()
    await new Promise<void>((resolve) => {
      audioEl.onended = () => {
        URL.revokeObjectURL(url)
        resolve()
      }
      audioEl.onerror = () => {
        URL.revokeObjectURL(url)
        resolve()
      }
    })
  } catch {
    await browserSpeak(text, language)
  }
}
