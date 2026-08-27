export type InferQuestion = {
  id: string
  label: string
  type: 'choice' | 'text'
  options?: string[]
}

const ALIASES: Record<string, string[]> = {
  'No supply': ['no supply', 'no water', 'not coming', 'pani nahi', 'paani nahi', 'pani nai', 'nahi aa', 'nahi aa raha', 'dry tap', 'band hai', 'water is not'],
  'Dirty / smelly water': ['dirty', 'smelly', 'ganda', 'gandha', 'smell', 'badbu', 'yellow water', 'gandu pani'],
  'Leak or burst pipe': ['leak', 'burst', 'pipe', 'nal toot', 'pipeline', 'ris raha'],
  'Tanker did not come': ['tanker nahi', 'tanker did not', 'tanker nai'],
  Today: ['today', 'aaj', 'this morning', 'subah se', 'aaj se'],
  '2–7 days': ['few days', '2-7', '2–7', 'kai din', 'kuch din', 'do din', 'teen din', '2 din', '3 din', '4 din', '5 din', 'several days', 'do teen', 'pichle kuch'],
  'More than a week': ['week', 'hafta', 'hafton', 'more than a week', 'ek hafte', '10 din', '15 din'],
  'More than a month': ['month', 'mahine', 'mahina', 'months'],
  'Only my house': ['only my house', 'mera ghar', 'sirf ghar', 'only me', 'my house only', 'apne ghar'],
  'This gali / street': ['gali', 'street', 'lane', 'mohalla', 'is gali', 'this street'],
  'The whole village or ward': ['whole village', 'pura gaon', 'poora gaon', 'sara ward', 'whole ward', 'poora ward', 'gaon bhar', 'sabke yahan'],
  'Municipal tap': ['municipal tap', 'nal', 'tap', 'pipeline tap', 'jal board'],
  'Handpump / borewell': ['handpump', 'hand pump', 'borewell', 'boring', 'boring ka'],
  Tanker: ['tanker'],
  Unknown: ['unknown', 'pata nahi', 'nahi pata'],
  'Blocked right now': ['blocked', 'jam', 'band sadak', 'road block'],
  'Deep potholes': ['pothole', 'gaddha', 'gadhe', 'broken road'],
  'A few days': ['few days', 'kai din', 'kuch din'],
  Weeks: ['week', 'hafte', 'hafta'],
  Months: ['month', 'mahine'],
  Hours: ['hours', 'ghante', 'subah se', 'kal raat'],
  '1–2 days': ['1-2', '1–2', 'do din', 'kal se', '1 din', '2 din'],
}

function normalize(value: string) {
  return value
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function matchChoice(options: string[] | undefined, value: string) {
  const needle = normalize(value)
  if (!needle) return value
  const exact = options?.find((option) => normalize(option) === needle)
  if (exact) return exact
  const contains = options?.find((option) => normalize(option).includes(needle) || needle.includes(normalize(option)))
  if (contains) return contains
  if (!options?.length) return value
  for (const option of options) {
    const hints = ALIASES[option] || []
    if (hints.some((hint) => needle.includes(hint) || hint.includes(needle))) return option
  }
  return value
}

export function inferFromSpeech(questions: InferQuestion[], spoken: string) {
  const text = normalize(spoken)
  const answers: Record<string, string> = {}
  if (!text) return { answers, notes: '' }

  for (const question of questions) {
    if (question.type === 'choice' && question.options?.length) {
      const picked = pickOption(question, text)
      if (picked) answers[question.id] = picked
      continue
    }
    if (question.id === 'story' && text.length > 8) {
      answers.story = spoken.trim()
    }
  }

  return { answers, notes: spoken.trim() }
}

function pickOption(question: InferQuestion, text: string) {
  let best = ''
  let score = 0
  for (const option of question.options || []) {
    const hints = [normalize(option), ...(ALIASES[option] || [])]
    const hits = hints.filter((hint) => hint.length > 2 && text.includes(hint)).length
    if (hits > score) {
      score = hits
      best = option
    }
  }
  if (question.id === 'days' && !best) {
    if (/\b(\d+)\s*(din|day)/.test(text)) {
      const n = Number(text.match(/\b(\d+)\s*(din|day)/)?.[1] || 0)
      if (n <= 1) return question.options?.find((option) => /today|hours/i.test(option)) || ''
      if (n <= 7) return question.options?.find((option) => /2–7|2-7|few|1–2|1-2/i.test(option)) || ''
      if (n <= 21) return question.options?.find((option) => /week/i.test(option)) || ''
      return question.options?.find((option) => /month/i.test(option)) || ''
    }
  }
  return score > 0 ? best : ''
}

export function parseAnswerBag(args: Record<string, string>) {
  const bag: Record<string, string> = {}
  if (args.answers) {
    try {
      const parsed = JSON.parse(args.answers) as Record<string, unknown>
      for (const [key, value] of Object.entries(parsed || {})) {
        if (value != null && String(value).trim()) bag[key] = String(value)
      }
    } catch {
      for (const part of args.answers.split(/[;|,]/)) {
        const [key, ...rest] = part.split(/[:=]/)
        if (key && rest.length) bag[key.trim()] = rest.join(':').trim()
      }
    }
  }
  for (const [key, value] of Object.entries(args)) {
    if (['action', 'answers', 'playbook', 'problem', 'question', 'field', 'step', 'name', 'mobile', 'role'].includes(key)) {
      continue
    }
    if (value?.trim()) bag[key] = value
  }
  if (args.question && (args.value || args.answer)) {
    bag[args.question] = args.value || args.answer
  }
  return bag
}
