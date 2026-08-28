export type InferQuestion = {
  id: string
  label: string
  type: 'choice' | 'text'
  options?: string[]
  options_hi?: string[]
}

const ALIASES: Record<string, string[]> = {
  'No supply': ['no supply', 'no water', 'not coming', 'pani nahi', 'paani nahi', 'pani nai', 'nahi aa', 'nahi aa raha', 'dry tap', 'band hai', 'water is not', 'aapurti nahi', 'supply nahi'],
  'Dirty / smelly water': ['dirty', 'smelly', 'ganda', 'gandha', 'smell', 'badbu', 'yellow water', 'gandu pani', 'gandha pani', 'badbu dar'],
  'Leak or burst pipe': ['leak', 'burst', 'pipe', 'nal toot', 'pipeline', 'ris raha', 'phati pipe', 'tooti pipe'],
  'Tanker did not come': ['tanker nahi', 'tanker did not', 'tanker nai', 'tanker nahi aaya'],
  Today: ['today', 'aaj', 'this morning', 'subah se', 'aaj se', 'aaj hi', 'आज', 'आज से', 'आज ही'],
  '2–7 days': ['few days', '2-7', '2–7', 'kai din', 'kuch din', 'do din', 'teen din', '2 din', '3 din', '4 din', '5 din', 'several days', 'do teen', 'pichle kuch', 'paanch din', 'panch din', 'char din'],
  'More than a week': ['week', 'hafta', 'hafton', 'more than a week', 'ek hafte', '10 din', '15 din', 'ek saptah'],
  'More than a month': ['month', 'mahine', 'mahina', 'months', 'ek mahine'],
  'Only my house': ['only my house', 'mera ghar', 'sirf ghar', 'only me', 'my house only', 'apne ghar', 'keval mera'],
  'This gali / street': ['gali', 'street', 'lane', 'mohalla', 'is gali', 'this street', 'yeh gali'],
  'The whole village or ward': ['whole village', 'pura gaon', 'poora gaon', 'sara ward', 'whole ward', 'poora ward', 'gaon bhar', 'sabke yahan', 'poora gaon'],
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

export function matchChoice(options: string[] | undefined, value: string, optionsHi?: string[]) {
  const needle = normalize(value)
  if (!needle) return value
  const exact = options?.find((option) => normalize(option) === needle)
  if (exact) return exact
  const contains = options?.find((option) => normalize(option).includes(needle) || needle.includes(normalize(option)))
  if (contains) return contains
  if (optionsHi?.length && options?.length) {
    const idx = optionsHi.findIndex((label) => {
      const n = normalize(label)
      return Boolean(n) && (n === needle || needle.includes(n) || n.includes(needle))
    })
    if (idx >= 0) return options[idx]
  }
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
  for (let i = 0; i < (question.options || []).length; i += 1) {
    const option = question.options?.[i] || ''
    const hindi = question.options_hi?.[i] || ''
    const hints = [normalize(option), normalize(hindi), ...(ALIASES[option] || [])].filter(Boolean)
    const hits = hints.filter((hint) => hint.length > 1 && text.includes(hint)).length
    if (hits > score) {
      score = hits
      best = option
    }
  }
  if (question.id === 'days' && !best) {
    const n = parseDayCount(text)
    if (n != null) {
      if (n <= 1) return question.options?.find((option) => /today|hours/i.test(option)) || ''
      if (n <= 7) return question.options?.find((option) => /2–7|2-7|few|1–2|1-2/i.test(option)) || ''
      if (n <= 21) return question.options?.find((option) => /week/i.test(option)) || ''
      return question.options?.find((option) => /month/i.test(option)) || ''
    }
  }
  return score > 0 ? best : ''
}

const HINDI_DAYS: Record<string, number> = {
  ek: 1,
  do: 2,
  teen: 3,
  char: 4,
  paanch: 5,
  panch: 5,
  che: 6,
  saat: 7,
  aath: 8,
  nau: 9,
  das: 10,
  एक: 1,
  दो: 2,
  तीन: 3,
  चार: 4,
  पाँच: 5,
  पांच: 5,
  छह: 6,
  सात: 7,
  आठ: 8,
  नौ: 9,
  दस: 10,
}

function parseDayCount(text: string) {
  const numeric = text.match(/\b(\d+)\s*(din|day|दिन)/)
  if (numeric) return Number(numeric[1])
  for (const [word, n] of Object.entries(HINDI_DAYS)) {
    if (text.includes(`${word} din`) || text.includes(`${word} दिन`) || text.includes(`${word} day`)) return n
  }
  if (/आज|aaj se|aaj hi/.test(text)) return 1
  if (/हफ्ते|हफ्ता|saptah|hafta/.test(text)) return 10
  if (/महीने|mahine/.test(text)) return 30
  return null
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
