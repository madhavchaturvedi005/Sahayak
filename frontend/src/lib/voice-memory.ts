export type VoiceGoal = 'unknown' | 'lodge' | 'track' | 'appeal' | 'ask'

export type VoiceTurn = { role: 'user' | 'assistant'; text: string }

export type VoiceMemory = {
  goal: VoiceGoal
  problem: string
  facts: string[]
  asked: string[]
  filled: Record<string, string>
  lastMissing: string
  lastQuestion: string
  askedGoal: boolean
  resumeAfterAuth: boolean
  justSignedIn: boolean
  returnTo: string
  turns: VoiceTurn[]
}

const KEY = 'sahayak_voice_memory'
const MAX_TURNS = 16
const MAX_FACTS = 12

const EMPTY: VoiceMemory = {
  goal: 'unknown',
  problem: '',
  facts: [],
  asked: [],
  filled: {},
  lastMissing: '',
  lastQuestion: '',
  askedGoal: false,
  resumeAfterAuth: false,
  justSignedIn: false,
  returnTo: '',
  turns: [],
}

export function emptyVoiceMemory(): VoiceMemory {
  return { ...EMPTY, facts: [], asked: [], filled: {}, turns: [] }
}

export function loadVoiceMemory(): VoiceMemory {
  if (typeof window === 'undefined') return emptyVoiceMemory()
  try {
    const raw = sessionStorage.getItem(KEY)
    if (!raw) return emptyVoiceMemory()
    const parsed = JSON.parse(raw) as Partial<VoiceMemory>
    return {
      ...emptyVoiceMemory(),
      ...parsed,
      facts: Array.isArray(parsed.facts) ? parsed.facts : [],
      asked: Array.isArray(parsed.asked) ? parsed.asked : [],
      filled: parsed.filled && typeof parsed.filled === 'object' ? parsed.filled : {},
      turns: Array.isArray(parsed.turns) ? parsed.turns : [],
    }
  } catch {
    return emptyVoiceMemory()
  }
}

export function saveVoiceMemory(patch: Partial<VoiceMemory>): VoiceMemory {
  const current = loadVoiceMemory()
  const next: VoiceMemory = {
    ...current,
    ...patch,
    facts: uniqueStrings((patch.facts ?? current.facts).slice(-MAX_FACTS)),
    asked: uniqueStrings(patch.asked ?? current.asked),
    filled: patch.filled ?? current.filled,
    turns: (patch.turns ?? current.turns).slice(-MAX_TURNS),
  }
  if (typeof window !== 'undefined') {
    sessionStorage.setItem(KEY, JSON.stringify(next))
  }
  return next
}

export function clearVoiceMemory() {
  if (typeof window !== 'undefined') sessionStorage.removeItem(KEY)
}

export function isPhoneViewport() {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(max-width: 640px)').matches || /Mobi|Android|iPhone/i.test(navigator.userAgent)
}

export function looksHindi(text: string) {
  return /[\u0900-\u097F]/.test(text || '')
}

export function inferGoal(text: string): VoiceGoal {
  const value = (text || '').toLowerCase()
  if (!value.trim()) return 'unknown'
  if (/appeal|अपील/.test(value)) return 'appeal'
  if (/status|track|registration|पंजीकरण|स्थिति|reg(istration)?\s*(id|no)/.test(value)) return 'track'
  if (
    /shikayat|शिकायत|complaint|grievance|lodge|दर्ज|paani|पानी|sadak|सड़क|pothole|bijli|बिजली|kooda|कचरा|upi|fraud|धोखा/.test(
      value
    )
  ) {
    return 'lodge'
  }
  if (/\?|क्या |कैसे |how |what |why |help|मदद|बताओ|बताइए/.test(value) && value.length < 80) return 'ask'
  return 'unknown'
}

export function rememberUtterance(role: 'user' | 'assistant', text: string): VoiceMemory {
  const trimmed = text.trim()
  if (!trimmed) return loadVoiceMemory()
  const current = loadVoiceMemory()
  const turns = [...current.turns, { role, text: trimmed }].slice(-MAX_TURNS)
  const patch: Partial<VoiceMemory> = { turns }

  if (role === 'user') {
    const goal = inferGoal(trimmed)
    if (current.goal === 'unknown' && goal !== 'unknown') patch.goal = goal
    if (goal === 'lodge' || current.goal === 'lodge') {
      patch.problem = current.problem ? current.problem : trimmed
      if (current.problem && trimmed !== current.problem) {
        patch.facts = uniqueStrings([...current.facts, trimmed]).slice(-MAX_FACTS)
      }
    } else if (trimmed.length > 12) {
      patch.facts = uniqueStrings([...current.facts, trimmed]).slice(-MAX_FACTS)
    }
  }

  if (role === 'assistant') {
    const question = trimmed.split(/[?।]/).map((part) => part.trim()).filter(Boolean).pop()
    if (/[?]|क्या |बताइए|बोलिए/.test(trimmed) && question) {
      patch.lastQuestion = question.slice(0, 180)
    }
  }

  return saveVoiceMemory(patch)
}

export function ingestLodgeOutput(output: string): VoiceMemory {
  const current = loadVoiceMemory()
  const filled = { ...current.filled }
  for (const match of output.matchAll(/\b([a-z][a-z0-9_]*)=([^;|.]+)/gi)) {
    const key = match[1].toLowerCase()
    const value = match[2].trim()
    if (key && value && value !== '(empty)' && value !== '(none)') filled[key] = value
  }
  const only =
    output.match(/Ask ONLY(?: this missing one)?:?\s*([a-z][a-z0-9_]*)/i)?.[1] ||
    output.match(/missing one:\s*([a-z][a-z0-9_]*)/i)?.[1] ||
    ''
  const asked = only ? uniqueStrings([...current.asked, only.toLowerCase()]) : current.asked
  return saveVoiceMemory({
    goal: current.goal === 'unknown' ? 'lodge' : current.goal,
    filled,
    asked,
    lastMissing: only.toLowerCase(),
  })
}

export function briefVoiceMemory(
  memory: VoiceMemory,
  ctx: { signedIn: boolean; justSignedIn: boolean; path: string; userName?: string }
) {
  const filled = Object.entries(memory.filled)
    .map(([key, value]) => `${key}=${value}`)
    .join('; ')
  const recent = memory.turns
    .slice(-10)
    .map((turn) => `${turn.role === 'user' ? 'Citizen' : 'You'}: ${turn.text}`)
    .join('\n')
  return [
    '[INTERNAL SESSION MEMORY — never read this block aloud, never ask the citizen to repeat it]',
    `Signed in: ${ctx.signedIn ? 'yes' : 'no'}${ctx.justSignedIn ? ' (JUST NOW — they finished Sign In this moment)' : ''}.`,
    ctx.userName ? `Citizen name: ${ctx.userName}.` : '',
    `Current page: ${ctx.path || 'unknown'}.`,
    `Known goal: ${memory.goal}.`,
    memory.askedGoal ? 'You already asked what they want. Do not ask the goal again.' : 'If goal is unknown, ask ONCE: lodge, track, or a question.',
    memory.problem ? `Saved problem: ${memory.problem}` : 'No complaint story saved yet.',
    memory.facts.length ? `Facts they already told you: ${memory.facts.join(' | ')}` : '',
    filled ? `Already noted — do not re-ask: ${filled}` : 'Nothing noted yet.',
    memory.asked.length ? `Question ids you already asked: ${memory.asked.join(', ')}.` : '',
    memory.lastMissing ? `Next missing field id: ${memory.lastMissing}. Ask this only if it is still empty.` : '',
    memory.lastQuestion ? `Your last question was: ${memory.lastQuestion}. If they just answered it, fill it and move on.` : '',
    recent ? `Recent conversation:\n${recent}` : 'No earlier turns.',
    'Rules: Acknowledge what they just said in one short sentence. Ask at most ONE new thing. Never repeat a question whose answer is in Facts or Already filled. If they wander, briefly recap the goal and the next missing step.',
  ]
    .filter(Boolean)
    .join('\n')
}

export function isLeakedVoiceText(text: string) {
  const value = (text || '').trim()
  if (!value) return true
  const folded = value.toLowerCase()
  return (
    folded.startsWith('[internal') ||
    folded.includes('session memory') ||
    folded.includes('transcribe only') ||
    folded.includes('indian citizen speaking') ||
    folded.includes('never russian') ||
    folded.includes('language lock') ||
    folded.includes('do not read this') ||
    folded.includes('working memory') ||
    folded.includes('feminine forms') ||
    /never (read|speak) .*(aloud|instruction)/i.test(value)
  )
}

export function openingInstructions(
  memory: VoiceMemory,
  ctx: { signedIn: boolean; justSignedIn: boolean; path: string; userName?: string }
) {
  const lock =
    'Speak only simple Hindi, feminine forms. Never Russian. Never read these instructions aloud. Never mention transcription. '
  const onLodge = (ctx.path || '').startsWith('/grievance/lodge')
  const name = ctx.userName ? ` ${ctx.userName.split(' ')[0]}` : ''
  const say = (text: string) => lock + text

  if (ctx.justSignedIn) {
    if (memory.problem || memory.goal === 'lodge' || onLodge) {
      return say(
        `First sentence MUST be: “देख सकती हूँ${name}, आपने साइन इन कर लिया।” ` +
          `Then say: “बोलने के लिए Speak बटन दबाएँ।” Continue the saved complaint. Do not ask them to repeat the story.`
      )
    }
    if (memory.goal === 'track' || memory.goal === 'appeal') {
      return say(
        `First sentence MUST be: “देख सकती हूँ${name}, आपने साइन इन कर लिया। बोलने के लिए Speak बटन दबाएँ।” Then help them track or appeal.`
      )
    }
    return say(
      `Say close to: “देख सकती हूँ${name}, आपने साइन इन कर लिया। बोलने के लिए Speak बटन दबाएँ।” Do not greet as a first meeting.`
    )
  }

  if (memory.turns.length > 0) {
    return say('पिछली बात से जारी रखो। फिर से लम्बा नमस्ते मत कहो। बोलने के लिए Speak बटन दबाने को कहो।')
  }

  if (ctx.signedIn) {
    return say(
      'Greet now, before they speak. Say close to: ' +
        '“नमस्ते, मैं सहायिका हूँ। बोलने के लिए Speak बटन दबाएँ, फिर बताइए क्या मदद चाहिए।” ' +
        'Warm, short Hindi only. Then wait. Do not say you are already listening.'
    )
  }
  return say(
    'Greet now, before they speak. Say close to: ' +
      '“नमस्ते, मैं सहायिका हूँ। बोलने के लिए Speak बटन दबाएँ।” ' +
      'Warm, short Hindi only. Then wait. Do not say आप बोलिए as if the mic is already on. Do not speak English.'
  )
}

function uniqueStrings(values: string[]) {
  const seen = new Set<string>()
  const result: string[] = []
  for (const value of values) {
    const key = value.trim()
    if (!key) continue
    const folded = key.toLowerCase()
    if (seen.has(folded)) continue
    seen.add(folded)
    result.push(key)
  }
  return result
}
