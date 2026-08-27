'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { ArrowRight, MapPin } from 'lucide-react'
import { api, type ClassifyResult, type Grievance, type NearbyGrievance } from '@/lib/api'
import { CATEGORIES, MINISTRIES } from '@/lib/content'
import { useLanguage } from '@/context/LanguageContext'
import { CATEGORY_HI, MINISTRY_HI, RELATION_HI, translateLookup } from '@/lib/i18n'
import { useAuth } from '@/context/AuthContext'
import { useAssistant } from '@/context/AssistantContext'
import { GlassCard } from '@/components/ui/GlassCard'
import { EvidenceCapture, type EvidenceCaptureHandle, type EvidenceFile } from '@/components/grievance/EvidenceCapture'
import { RaiseVerifyPanel } from '@/components/grievance/RaiseVerifyPanel'
import { inferFromSpeech, matchChoice, parseAnswerBag } from '@/lib/playbook-infer'

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

async function reversePlace(lat: number, lng: number) {
  try {
    return await api.reversePlace(lat, lng)
  } catch {
    return { village: '', ward: '', district: '', street: '' }
  }
}

type PlaybookQuestion = {
  label_hi?: string
  options_hi?: string[]
  hint_hi?: string
  id: string
  label: string
  type: 'choice' | 'text'
  options?: string[]
  hint?: string
}

type Playbook = {
  id: string
  title: string
  title_hi?: string
  blurb: string
  blurb_hi?: string
  ministry: string
  category: string
  needs_photo: boolean
  photo_prompt: string
  photo_prompt_hi?: string
  doc_prompt: string
  doc_prompt_hi?: string
  questions: PlaybookQuestion[]
}

const FALLBACK: Playbook[] = [
  {
    id: 'water',
    title: 'Water is not coming',
    blurb: 'Dry tap, dirty supply, or a broken pipeline.',
    ministry: 'Ministry of Housing and Urban Affairs',
    category: 'Water supply / civic amenities',
    needs_photo: true,
    photo_prompt: 'Take a photo of the dry tap, tanker, or the broken pipe.',
    doc_prompt: 'Never upload Aadhaar, PAN, or OTP.',
    questions: [
      { id: 'kind', label: 'What is wrong with the water?', type: 'choice', options: ['No supply', 'Dirty / smelly water', 'Leak or burst pipe', 'Tanker did not come'] },
      { id: 'days', label: 'How long has this been going on?', type: 'choice', options: ['Today', '2–7 days', 'More than a week', 'More than a month'] },
      { id: 'spread', label: 'Who is affected?', type: 'choice', options: ['Only my house', 'This gali / street', 'The whole village or ward'] },
      { id: 'source', label: 'Do you know the source?', type: 'choice', options: ['Municipal tap', 'Handpump / borewell', 'Tanker', 'Unknown'] },
    ],
  },
  {
    id: 'road',
    title: 'Road is blocked or broken',
    blurb: 'Jam, potholes, a fallen tree, or a cut that no one filled.',
    ministry: 'Ministry of Road Transport and Highways',
    category: 'Road / transport',
    needs_photo: true,
    photo_prompt: 'Photograph the blockage or the broken stretch.',
    doc_prompt: 'Never upload Aadhaar, PAN, or OTP.',
    questions: [
      { id: 'kind', label: 'What is wrong with the road?', type: 'choice', options: ['Blocked right now', 'Deep potholes', 'Broken culvert / bridge', 'No work after digging'] },
      { id: 'days', label: 'Since when?', type: 'choice', options: ['Today', 'A few days', 'Weeks', 'Months'] },
      { id: 'traffic', label: 'What cannot pass?', type: 'choice', options: ['Two-wheelers only struggling', 'Cars and jeeps', 'Buses and trucks', 'Ambulance / school also stuck'] },
    ],
  },
  {
    id: 'waste',
    title: 'Garbage, drain, or river waste',
    blurb: 'Dump, nala, or waste near homes.',
    ministry: 'Ministry of Housing and Urban Affairs',
    category: 'Sanitation / waste',
    needs_photo: true,
    photo_prompt: 'Photograph the dump, nala, or river edge.',
    doc_prompt: 'Never upload Aadhaar, PAN, or OTP.',
    questions: [
      { id: 'type', label: 'What kind of waste is it?', type: 'choice', options: ['Household dump', 'Drain / sewage', 'Industrial waste', 'River weed or floating waste'] },
      { id: 'affect', label: 'How is it hurting people nearby?', type: 'choice', options: ['Foul smell', 'Mosquitoes', 'Spreading illness', 'Bad air', 'Not affecting homes yet'] },
      { id: 'distance', label: 'How close is it to houses?', type: 'choice', options: ['0–100 metres', '100–500 metres', 'More than 500 metres'] },
      { id: 'source', label: 'Is the source known?', type: 'text', hint: 'Factory name, market, or write Unknown.' },
    ],
  },
  {
    id: 'cyber',
    title: 'Cyber fraud or online cheat',
    blurb: 'UPI scam, fake call, hacked account.',
    ministry: 'Ministry of Electronics and Information Technology',
    category: 'Cyber / digital fraud',
    needs_photo: true,
    photo_prompt: 'Screenshot the fraud message. Hide any OTP or PIN.',
    doc_prompt: 'Never upload Aadhaar, PAN, OTP, or full card number.',
    questions: [
      { id: 'kind', label: 'What kind of cheat was this?', type: 'choice', options: ['UPI / payment fraud', 'Fake call or WhatsApp', 'Hacked social or email', 'Job / KYC phishing'] },
      { id: 'when', label: 'When did it happen?', type: 'text', hint: 'Date and roughly the time.' },
      { id: 'amount', label: 'Money lost, if any', type: 'text', hint: 'Amount in rupees, or write None.' },
      { id: 'channel', label: 'How did they reach you?', type: 'text', hint: 'App name or a phone number. Not your password.' },
      { id: 'reported', label: 'Have you already told the bank or cybercrime.gov.in?', type: 'choice', options: ['Not yet', 'Told the bank', 'Filed on cybercrime.gov.in', 'Both'] },
    ],
  },
  {
    id: 'power',
    title: 'Electricity is out',
    blurb: 'No bijli, dangerous wires, or a wrong bill.',
    ministry: 'Ministry of Power',
    category: 'Power supply',
    needs_photo: true,
    photo_prompt: 'Photo of the dark street, the fallen wire, or the bill.',
    doc_prompt: 'Never upload Aadhaar or PAN.',
    questions: [
      { id: 'kind', label: 'What is the power problem?', type: 'choice', options: ['No supply', 'Voltage too low / high', 'Fallen or hanging wire', 'Wrong bill'] },
      { id: 'days', label: 'Since when?', type: 'choice', options: ['Hours', '1–2 days', 'More than a week'] },
      { id: 'spread', label: 'Who is without power?', type: 'choice', options: ['Only my house', 'This street', 'The whole village'] },
    ],
  },
  {
    id: 'general',
    title: 'Something else',
    blurb: 'Any other department.',
    ministry: '',
    category: '',
    needs_photo: false,
    photo_prompt: 'A photo helps if the problem can be seen.',
    doc_prompt: 'Never upload Aadhaar, PAN, or OTP.',
    questions: [{ id: 'story', label: 'Tell the problem in plain words', type: 'text' }],
  },
]

export function LodgeForm({ kind }: { kind: 'public' | 'pension' }) {
  const { user } = useAuth()
  const { lang, t } = useLanguage()
  const hi = lang === 'hi'
  const { registerLodgeGuide, setActivity } = useAssistant()
  const params = useSearchParams()
  const evidenceRef = useRef<EvidenceCaptureHandle | null>(null)
  const [actingField, setActingField] = useState('')
  const [actingNote, setActingNote] = useState('')
  const publicFlow = kind === 'public'
  const lastStep = publicFlow ? 7 : 4
  const [step, setStep] = useState(1)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [geoHint, setGeoHint] = useState('')
  const [playbooks, setPlaybooks] = useState<Playbook[]>(FALLBACK)
  const [playbookId, setPlaybookId] = useState(params.get('playbook') || (publicFlow ? '' : 'general'))
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [evidence, setEvidence] = useState<EvidenceFile[]>([])
  const [routing, setRouting] = useState<ClassifyResult | null>(null)
  const [result, setResult] = useState<Grievance | null>(null)
  const [nearby, setNearby] = useState<NearbyGrievance[]>([])
  const [shareLocation, setShareLocation] = useState(false)
  const [consentOk, setConsentOk] = useState(params.get('helper') !== '1')
  const [collectOpen, setCollectOpen] = useState(false)
  const [extraNotes, setExtraNotes] = useState('')
  const [form, setForm] = useState({
    filer_role: params.get('helper') === '1' ? 'helper' : 'self',
    helper_name: user?.name || '',
    helper_relation: 'CSC / family',
    name: user?.name || '',
    mobile: user?.mobile || '',
    village: '',
    ward: '',
    district: '',
    street: '',
    latitude: '' as string,
    longitude: '' as string,
    ministry:
      kind === 'pension' ? "Department of Pension & Pensioners' Welfare" : params.get('ministry') || '',
    category: kind === 'pension' ? 'Pension / retirement benefits' : params.get('category') || '',
    subject: '',
    description: params.get('problem') || '',
  })

  const playbook = useMemo(
    () => playbooks.find((item) => item.id === playbookId) || playbooks[playbooks.length - 1],
    [playbookId, playbooks]
  )
  const progress = useMemo(() => (step / lastStep) * 100, [lastStep, step])

  useEffect(() => {
    if (!publicFlow) return
    api
      .playbooks()
      .then((rows) => {
        if (rows.length) setPlaybooks(rows)
      })
      .catch(() => undefined)
  }, [publicFlow])

  useEffect(() => {
    if (!publicFlow) return
    const ministry = params.get('ministry') || ''
    const category = params.get('category') || ''
    const problem = params.get('problem') || ''
    const book = params.get('playbook') || ''
    if (book) setPlaybookId(book)
    if (problem) {
      setForm((current) => ({ ...current, description: current.description || problem }))
      setAnswers((current) => ({ ...current, story: current.story || problem }))
      setExtraNotes((current) => current || problem)
    }
    if (ministry || category) {
      setForm((current) => ({
        ...current,
        ministry: ministry || current.ministry,
        category: category || current.category,
      }))
    }
  }, [params, publicFlow])

  useEffect(() => {
    if (!publicFlow || !playbookId) return
    const spoken = form.description || extraNotes
    if (!spoken) return
    const inferred = inferFromSpeech(playbook.questions, spoken)
    if (!Object.keys(inferred.answers).length) return
    setAnswers((current) => {
      const next = { ...current }
      let changed = false
      for (const [id, value] of Object.entries(inferred.answers)) {
        if (!(next[id] || '').trim()) {
          next[id] = value
          changed = true
        }
      }
      return changed ? next : current
    })
  }, [publicFlow, playbookId, playbook, form.description, extraNotes])

  function update(key: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function pickPlaybook(id: string) {
    const chosen = playbooks.find((item) => item.id === id)
    setPlaybookId(id)
    if (chosen?.ministry) update('ministry', chosen.ministry)
    if (chosen?.category) update('category', chosen.category)
    const spoken = form.description || extraNotes
    if (chosen && spoken) {
      const inferred = inferFromSpeech(chosen.questions, spoken)
      setAnswers((current) => ({ ...inferred.answers, ...current }))
      if (inferred.notes) setExtraNotes((current) => current || inferred.notes)
    }
    setStep(3)
  }

  function mark(field: string, note: string) {
    setActingField(field)
    setActingNote(note)
    setActivity(note)
    window.setTimeout(() => {
      const node =
        document.getElementById(field) ||
        document.getElementById(`pack-${field}`) ||
        document.querySelector(`[data-sahayak-field="${field}"]`)
      node?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 80)
    window.setTimeout(() => {
      setActingField((current) => (current === field ? '' : current))
    }, 2800)
  }

  function fieldClass(id: string) {
    return actingField === id ? 'field ring-4 ring-amber/35 border-amber' : 'field'
  }

  async function locate(): Promise<string> {
    setStep(publicFlow ? 4 : step)
    setShareLocation(true)
    mark('village', 'Sahayak is asking for location permission…')
    setGeoHint(t('geoAsk'))
    if (!navigator.geolocation) {
      setGeoHint(t('geoNoBrowser'))
      return 'No geolocation on this device. Ask the citizen for village and district, then call lodge set_field.'
    }
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = pos.coords.latitude.toFixed(6)
          const lng = pos.coords.longitude.toFixed(6)
          update('latitude', lat)
          update('longitude', lng)
          mark('district', 'Pin received. Filling village and district…')
          try {
            const place = await reversePlace(Number(lat), Number(lng))
            if (place.village) update('village', place.village)
            if (place.ward) update('ward', place.ward)
            if (place.district) update('district', place.district)
            if (place.street) update('street', place.street)
            const line = [place.street, place.village, place.ward, place.district].filter(Boolean).join(', ')
            setGeoHint(line ? t('geoFilled', { line }) : t('geoSaved', { lat, lng }))
            try {
              const matches = await api.nearby({
                lat: Number(lat),
                lon: Number(lng),
                playbook_id: playbookId || undefined,
                village: place.village,
                ward: place.ward,
              })
              setNearby(matches)
            } catch {
              setNearby([])
            }
            resolve(
              line
                ? `Filled location from the pin: ${line}. Coordinates ${lat}, ${lng}. Next SAY you are opening the camera for a photo of the problem, then call lodge open_camera.`
                : `Pin saved ${lat}, ${lng}. Ask village name if the address looks empty, then set_field. Do not tell them to type it themselves.`
            )
          } catch {
            setGeoHint(t('geoSaved', { lat, lng }))
            resolve(`Pin saved ${lat}, ${lng}. Address lookup failed. Ask village and district, then set_field. Do not tell them to type it themselves.`)
          }
        },
        () => {
          setShareLocation(false)
          setGeoHint(t('geoDenied'))
          resolve('Permission denied. Ask village and district out loud, then call lodge set_field for each. Do not tell them to type the form themselves.')
        },
        { enableHighAccuracy: true, timeout: 14000 }
      )
    })
  }

  async function suggest() {
    setBusy(true)
    setError('')
    try {
      const text = [form.subject, form.description, playbook.title, ...Object.values(answers)].join(' ')
      const res = await api.classify(text)
      setRouting(res)
      if (!form.ministry) update('ministry', res.ministry)
      if (!form.category) update('category', res.category)
      if (res.playbook_id && !playbookId) setPlaybookId(res.playbook_id)
      setStep(publicFlow ? 6 : 3)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not classify')
    } finally {
      setBusy(false)
    }
  }

  function packedDescription() {
    const lines = [playbook.title + '.']
    for (const question of playbook.questions) {
      const value = answers[question.id]
      if (value) lines.push(`${question.label}: ${value}`)
    }
    if (form.description && !answers.story) lines.push(form.description)
    if (extraNotes && extraNotes !== form.description) lines.push(`More they said: ${extraNotes}`)
    const place = [form.street, form.village, form.ward && `Ward ${form.ward}`, form.district].filter(Boolean).join(', ')
    if (place) lines.push(`Place: ${place}.`)
    if (form.latitude && form.longitude) lines.push(`Pin: ${form.latitude}, ${form.longitude}.`)
    if (form.filer_role === 'helper') {
      lines.push(
        `Filed with help from ${form.helper_name || 'a helper'} (${form.helper_relation}) for ${form.name}.`
      )
    }
    return lines.join('\n')
  }

  function impactScopeFromAnswers() {
    const spread = (answers.spread || answers.affect || answers.traffic || '').toLowerCase()
    if (spread.includes('village') || spread.includes('ward') || spread.includes('whole')) return 'village'
    if (spread.includes('gali') || spread.includes('street') || spread.includes('ambulance') || spread.includes('buses'))
      return 'street'
    return 'self'
  }

  async function submit() {
    setBusy(true)
    setError('')
    try {
      const description = packedDescription()
      const created = await api.createGrievance({
        kind,
        name: form.name,
        mobile: form.mobile,
        ministry: form.ministry,
        category: form.category,
        subject: form.subject || `${playbook.title}${form.village ? ` — ${form.village}` : ''}`,
        description,
        playbook_id: playbook.id,
        village: form.village,
        ward: form.ward,
        district: form.district,
        street: form.street,
        latitude: form.latitude || null,
        longitude: form.longitude || null,
        filer_role: form.filer_role,
        helper_name: form.filer_role === 'helper' ? form.helper_name : '',
        helper_relation: form.filer_role === 'helper' ? form.helper_relation : '',
        consent_capture:
          form.filer_role === 'helper' && consentOk
            ? `Verbal consent: citizen asked ${form.helper_name || 'helper'} (${form.helper_relation}) to file`
            : '',
        impact_scope: impactScopeFromAnswers(),
        answers,
        evidence,
      })
      setResult(created)
      setStep(lastStep)
      const community = impactScopeFromAnswers() !== 'self'
      setCollectOpen(community)
      return created.registration_id
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save grievance')
      return ''
    } finally {
      setBusy(false)
    }
  }

  const live = useRef({
    form,
    answers,
    playbook,
    playbooks,
    playbookId,
    step,
    publicFlow,
    lastStep,
    user,
    result,
    evidence,
    extraNotes,
  })
  live.current = { form, answers, playbook, playbooks, playbookId, step, publicFlow, lastStep, user, result, evidence, extraNotes }
  const locateRef = useRef(locate)
  const suggestRef = useRef(suggest)
  const submitRef = useRef(submit)
  locateRef.current = locate
  suggestRef.current = suggest
  submitRef.current = submit

  useEffect(() => {
    registerLodgeGuide({
      apply: async (action, args) => {
        const state = live.current
        if (action === 'snapshot') {
          const filled = state.playbook.questions
            .filter((q) => (state.answers[q.id] || '').trim())
            .map((q) => `${q.id}=${state.answers[q.id]}`)
          const missing = state.playbook.questions
            .filter((q) => !(state.answers[q.id] || '').trim())
            .map((q) => `${q.id}: ${q.label}${q.options ? ` Options: ${q.options.join(' | ')}` : ''}`)
          const placeReady = Boolean(state.form.village && state.form.district)
          let next = 'Ask the next missing thing, then call lodge to fill it. Never tell them to type on the form.'
          if (missing[0]) next = `Do NOT re-ask filled fields. Ask only this missing one, then lodge set_answer: ${missing[0]}.`
          else if (!placeReady) next = 'Answers are done. SAY a location permission will appear; if they Allow you will fill village and district. Then call lodge request_location.'
          else if (state.playbook.needs_photo && state.evidence.length === 0) next = 'SAY you are opening the camera for a photo of the problem. Then call lodge open_camera.'
          else next = 'Call lodge classify_and_confirm, then lodge submit if the department looks right.'
          return [
            `Step ${state.step} of ${state.lastStep}.`,
            `Playbook ${state.playbook.id} (${state.playbook.title}).`,
            `Citizen ${state.form.name || '(empty)'} / ${state.form.mobile || '(empty)'}.`,
            `Place ${[state.form.village, state.form.district].filter(Boolean).join(', ') || '(empty)'}.`,
            `Photos: ${state.evidence.length}.`,
            `Notes: ${state.extraNotes || '(none)'}.`,
            filled.length ? `Already filled — do not ask again: ${filled.join('; ')}` : 'No playbook answers yet.',
            missing.length ? `Still need: ${missing.join('; ')}` : 'Playbook answers are filled.',
            next,
          ].join(' ')
        }
        if (action === 'set_who') {
          if (args.role === 'helper' || args.filer_role === 'helper') update('filer_role', 'helper')
          if (args.role === 'self' || args.filer_role === 'self') update('filer_role', 'self')
          if (args.name) {
            update('name', args.name)
            mark('name', `Filling the name: ${args.name}`)
          }
          if (args.mobile) {
            update('mobile', args.mobile)
            mark('mobile', `Filling the mobile: ${args.mobile}`)
          }
          if (args.helper_name) update('helper_name', args.helper_name)
          if (args.helper_relation) update('helper_relation', args.helper_relation)
          setStep(1)
          return `Filled who is filing. Name ${args.name || state.form.name}. Next ask the problem if you do not have it, then set_playbook.`
        }
        if (action === 'set_playbook') {
          const id = (args.playbook || args.id || args.value || '').toLowerCase()
          const chosen = state.playbooks.find((item) => item.id === id) || state.playbooks.find((item) => item.title.toLowerCase().includes(id))
          if (!chosen) return `Unknown playbook ${id}. Use water, road, waste, cyber, power, or general.`
          setPlaybookId(chosen.id)
          if (chosen.ministry) update('ministry', chosen.ministry)
          if (chosen.category) update('category', chosen.category)
          const spoken = args.problem || args.notes || state.form.description || state.extraNotes
          const inferred = inferFromSpeech(chosen.questions, spoken)
          const merged = { ...inferred.answers, ...parseAnswerBag(args) }
          if (spoken) {
            update('description', spoken)
            setExtraNotes((current) => current || spoken)
            merged.story = merged.story || spoken
          }
          const applied: string[] = []
          setAnswers((current) => {
            const next = { ...current }
            for (const question of chosen.questions) {
              const raw = merged[question.id]
              if (!raw) continue
              next[question.id] = matchChoice(question.options, raw)
              applied.push(`${question.id}=${next[question.id]}`)
            }
            return next
          })
          if (state.publicFlow) setStep(2)
          mark('playbook', `Opening ${chosen.title}`)
          if (state.publicFlow) await wait(800)
          setStep(state.publicFlow ? 3 : 2)
          const still = chosen.questions.filter((item) => !String(merged[item.id] || '').trim())
          if (!still.length) {
            setStep(4)
            return `Opened ${chosen.title}. Already filled from what they said: ${applied.join('; ')}. Do not re-ask those. All questions done. SAY a location permission is coming, then lodge request_location.`
          }
          return `Opened ${chosen.title}. Already filled from what they said — do not ask again: ${applied.join('; ') || 'none yet'}. Extra words are in the notes box. Ask ONLY this missing one: ${still[0].id} — ${still[0].label}${still[0].options ? ` Options: ${still[0].options.join(', ')}` : ''}. If they answer several things at once, call lodge set_answers with every id.`
        }
        if (action === 'set_notes') {
          const notes = args.notes || args.value || args.problem || ''
          if (!notes.trim()) return 'No extra notes given.'
          setExtraNotes((current) => (current && current.includes(notes) ? current : [current, notes].filter(Boolean).join('\n')))
          if (!state.form.description) update('description', notes)
          mark('extra-notes', 'Saving extra things they said')
          setStep(state.publicFlow ? 3 : 2)
          return `Saved extra notes. Do not re-ask that. Continue only with missing playbook fields.`
        }
        if (action === 'set_answer' || action === 'set_answers') {
          const book = state.playbook
          const bag = parseAnswerBag(args)
          if (args.notes) {
            setExtraNotes((current) => (current && current.includes(args.notes) ? current : [current, args.notes].filter(Boolean).join('\n')))
          }
          const applied: string[] = []
          setAnswers((current) => {
            const next = { ...current }
            for (const question of book.questions) {
              const raw = bag[question.id]
              if (!raw) continue
              next[question.id] = matchChoice(question.options, raw)
              applied.push(`${question.id}=${next[question.id]}`)
            }
            return next
          })
          if (applied[0]) mark(applied[0].split('=')[0], `Filling ${applied.length} answer${applied.length > 1 ? 's' : ''} they already said`)
          setStep(state.publicFlow ? 3 : 2)
          const still = book.questions.filter((item) => {
            const filled = bag[item.id] || state.answers[item.id]
            return !String(filled || '').trim()
          })
          if (!still.length) {
            setStep(4)
            return `Filled ${applied.join('; ')}. All questions done. SAY a location permission is coming, then lodge request_location.`
          }
          if (!applied.length) return `Nothing matched. Ask only: ${still[0].id} — ${still[0].label}.`
          return `Filled ${applied.join('; ')} together. Extra talk goes in notes. Do not re-ask filled fields. Ask ONLY: ${still[0].id} — ${still[0].label}${still[0].options ? ` Options: ${still[0].options.join(', ')}` : ''}.`
        }
        if (action === 'set_field') {
          const field = (args.field || args.id || '') as keyof typeof state.form
          const value = args.value || ''
          if (!field || !(field in state.form)) return `Unknown field ${String(field)}.`
          if (['village', 'ward', 'district', 'street', 'latitude', 'longitude'].includes(String(field))) setStep(4)
          update(field, value)
          mark(String(field), `Filling ${String(field)}`)
          const village = field === 'village' ? value : state.form.village
          const district = field === 'district' ? value : state.form.district
          if (village && district && ['village', 'ward', 'district', 'street'].includes(String(field))) {
            return `Filled ${String(field)} with ${value}. Place is ready. SAY you are opening the camera for a photo of the problem, then call lodge open_camera.`
          }
          return `Filled ${String(field)} with ${value} on the form. Ask the next missing place field if needed, then set_field. Do not tell them to type it.`
        }
        if (action === 'request_location') {
          return locateRef.current()
        }
        if (action === 'open_camera') {
          setStep(5)
          mark('photo', 'Opening the camera for a photo of the problem')
          window.setTimeout(() => evidenceRef.current?.openCamera(), 250)
          return 'Camera picker opened. Wait for them to take the photo. Then classify_and_confirm.'
        }
        if (action === 'goto') {
          const next = Number(args.step || args.value || 0)
          if (next >= 1 && next <= state.lastStep) setStep(next)
          return `Showing step ${next}.`
        }
        if (action === 'classify_and_confirm') {
          await suggestRef.current()
          return 'Department suggestion is on the page. If it looks right, call lodge submit. Do not tell them to pick the ministry themselves unless they want to change it.'
        }
        if (action === 'submit') {
          const registration = await submitRef.current()
          return registration
            ? `Grievance registered on this portal. Registration number ${registration}. They can view status here.`
            : 'Submit did not finish. Ask them to tap Submit grievance, or try lodge submit again.'
        }
        return `Unknown lodge action ${action}.`
      },
    })
    return () => {
      registerLodgeGuide(null)
      setActivity('')
    }
  }, [registerLodgeGuide, setActivity])

  const summary = result
    ? [
        `Registration: ${result.registration_id}`,
        `Name: ${result.name}`,
        `Mobile: ${result.mobile}`,
        result.filer_role === 'helper' ? `Helper: ${result.helper_name} (${result.helper_relation})` : '',
        `Department: ${result.ministry}`,
        `Category: ${result.category}`,
        `Subject: ${result.subject}`,
        [result.street, result.village, result.ward, result.district].filter(Boolean).join(', '),
        result.latitude && result.longitude ? `Pin: ${result.latitude}, ${result.longitude}` : '',
        '',
        result.description,
      ]
        .filter((line) => line !== '')
        .join('\n')
    : ''

  const whoReady =
    form.name.length >= 2 &&
    form.mobile.length >= 10 &&
    (form.filer_role === 'self' || (form.helper_name.length >= 2 && consentOk))
  const detailsReady = playbook.questions.every((question) => (answers[question.id] || '').trim().length > 1)
  const placeReady = form.village.length > 1 && form.district.length > 1
  const communitySpread = impactScopeFromAnswers() !== 'self'

  return (
    <div className="w-full space-y-6 pb-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber">
          {kind === 'public' ? t('lodgePublicKind') : t('lodgePensionKind')}
        </p>
        <h1 className="mt-2 text-[32px] font-bold">
          {kind === 'public' ? t('lodgePublic') : t('lodgePension')}
        </h1>
        <p className="mt-2 text-slate">{t('lodgeLead')}</p>
      </div>

      <div className="h-1 overflow-hidden rounded-full bg-indigo/10">
        <div className="h-full bg-indigo transition-all duration-300 ease-calm" style={{ width: `${progress}%` }} />
      </div>

      {actingNote && (
        <p className="rounded-card bg-amber/15 px-4 py-3 text-sm font-medium text-indigo">{actingNote}</p>
      )}

      {error && <p className="text-sm text-attention">{error}</p>}

      {step === 1 && (
        <GlassCard>
          <h2 className="mb-2 text-[22px] font-semibold">{t('whoFor')}</h2>
          <p className="mb-6 text-sm leading-relaxed text-slate">{t('whoForBody')}</p>
          <div className="mb-6 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              className={`rounded-card border px-4 py-3 text-left ${form.filer_role === 'self' ? 'border-indigo bg-indigo/5' : 'border-line bg-white/70'}`}
              onClick={() => {
                update('filer_role', 'self')
                setConsentOk(true)
              }}
            >
              <span className="block font-semibold text-indigo">{t('iAmCitizen')}</span>
              <span className="mt-1 block text-sm text-slate">{t('iAmCitizenBody')}</span>
            </button>
            <button
              type="button"
              className={`rounded-card border px-4 py-3 text-left ${form.filer_role === 'helper' ? 'border-indigo bg-indigo/5' : 'border-line bg-white/70'}`}
              onClick={() => {
                update('filer_role', 'helper')
                setConsentOk(false)
              }}
            >
              <span className="block font-semibold text-indigo">{t('iAmHelping')}</span>
              <span className="mt-1 block text-sm text-slate">{t('iAmHelpingBody')}</span>
            </button>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="label" htmlFor="name">
                {form.filer_role === 'helper' ? t('citizenFullName') : t('fullName')}
              </label>
              <input id="name" className={fieldClass('name')} value={form.name} onChange={(e) => update('name', e.target.value)} />
            </div>
            <div>
              <label className="label" htmlFor="mobile">
                {form.filer_role === 'helper' ? t('citizenMobile') : t('mobileNumber')}
              </label>
              <input
                id="mobile"
                className={fieldClass('mobile')}
                inputMode="numeric"
                value={form.mobile}
                onChange={(e) => update('mobile', e.target.value)}
              />
            </div>
          </div>
          {form.filer_role === 'helper' && (
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <label className="label" htmlFor="helper_name">
                  {t('helperName')}
                </label>
                <input
                  id="helper_name"
                  className="field"
                  value={form.helper_name}
                  onChange={(e) => update('helper_name', e.target.value)}
                />
              </div>
              <div>
                <label className="label" htmlFor="helper_relation">
                  {t('howYouKnow')}
                </label>
                <select
                  id="helper_relation"
                  className="field"
                  value={form.helper_relation}
                  onChange={(e) => update('helper_relation', e.target.value)}
                >
                  {Object.keys(RELATION_HI).map((value) => (
                    <option key={value} value={value}>
                      {translateLookup(RELATION_HI, value, lang)}
                    </option>
                  ))}
                </select>
              </div>
              <label className="md:col-span-2 flex items-start gap-3 rounded-card bg-indigo/5 px-4 py-3 text-sm">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4"
                  checked={consentOk}
                  onChange={(e) => setConsentOk(e.target.checked)}
                />
                <span>
                  {hi
                    ? 'नागरिक ने मौखिक सहमति दी है कि मैं उनकी ओर से यह शिकायत दर्ज करूँ। ट्रैकिंग उनके मोबाइल पर रहेगी।'
                    : 'The citizen gave verbal consent for me to file on their behalf. Tracking stays on their mobile.'}
                </span>
              </label>
            </div>
          )}
          <button type="button" className="btn-primary mt-6" disabled={!whoReady} onClick={() => setStep(2)}>
            {t('continue')}
          </button>
        </GlassCard>
      )}

      {step === 2 && publicFlow && (
        <GlassCard>
          <h2 className="mb-2 text-[22px] font-semibold">{t('kindOfProblem')}</h2>
          <p className="mb-6 text-sm leading-relaxed text-slate">{t('kindOfProblemBody')}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {playbooks.map((item) => (
              <button
                key={item.id}
                type="button"
                id={`pack-${item.id}`}
                data-sahayak-field={item.id === playbookId ? 'playbook' : undefined}
                className={`rounded-card border px-4 py-3 text-left ${
                  playbookId === item.id ? 'border-indigo bg-indigo/5' : 'border-line bg-white/70'
                } ${actingField === 'playbook' && playbookId === item.id ? 'ring-4 ring-amber/35' : ''}`}
                onClick={() => pickPlaybook(item.id)}
              >
                <span className="block font-semibold text-indigo">{hi && item.title_hi ? item.title_hi : item.title}</span>
                <span className="mt-1 block text-sm text-slate">{hi && item.blurb_hi ? item.blurb_hi : item.blurb}</span>
              </button>
            ))}
          </div>
          <button type="button" className="btn-secondary mt-6" onClick={() => setStep(1)}>
            {t('back')}
          </button>
        </GlassCard>
      )}

      {step === 2 && !publicFlow && (
        <GlassCard>
          <h2 className="mb-6 text-[22px] font-semibold">{t('describeProblem')}</h2>
          <label className="label" htmlFor="subject">
            {t('subject')}
          </label>
          <input id="subject" className="field mb-4" value={form.subject} onChange={(e) => update('subject', e.target.value)} />
          <label className="label" htmlFor="description">
            {t('description')}
          </label>
          <textarea
            id="description"
            className="field min-h-40"
            value={form.description}
            onChange={(e) => update('description', e.target.value)}
          />
          <div className="mt-6 flex gap-3">
            <button type="button" className="btn-secondary" onClick={() => setStep(1)}>
              {t('back')}
            </button>
            <button
              type="button"
              className="btn-primary"
              disabled={form.subject.length < 8 || form.description.length < 20 || busy}
              onClick={suggest}
            >
              {busy ? t('reading') : t('suggestDepartment')}
            </button>
          </div>
        </GlassCard>
      )}

      {step === 3 && publicFlow && (
        <GlassCard>
          <h2 className="mb-2 text-[22px] font-semibold">3. {hi && playbook.title_hi ? playbook.title_hi : playbook.title}</h2>
          <p className="mb-6 text-sm text-slate">{t('answerOwnWords')}</p>
          <div className="space-y-5">
            {playbook.questions.map((question) => (
              <div key={question.id}>
                <label className="label" htmlFor={question.id}>
                  {hi && question.label_hi ? question.label_hi : question.label}
                </label>
                {question.type === 'choice' ? (
                  <div className="flex flex-wrap gap-2">
                    {(question.options || []).map((option, index) => (
                      <button
                        key={option}
                        type="button"
                        className={`rounded-full border px-3 py-2 text-sm ${
                          answers[question.id] === option ? 'border-indigo bg-indigo text-white' : 'border-line bg-white/80 text-indigo'
                        } ${actingField === question.id && answers[question.id] === option ? 'ring-4 ring-amber/35' : ''}`}
                        onClick={() => setAnswers((current) => ({ ...current, [question.id]: option }))}
                      >
                        {hi && question.options_hi?.[index] ? question.options_hi[index] : option}
                      </button>
                    ))}
                  </div>
                ) : (
                  <textarea
                    id={question.id}
                    className={`${fieldClass(question.id)} min-h-24`}
                    placeholder={hi && question.hint_hi ? question.hint_hi : question.hint}
                    value={answers[question.id] || ''}
                    onChange={(e) => setAnswers((current) => ({ ...current, [question.id]: e.target.value }))}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="mt-6">
            <label className="label" htmlFor="extra-notes">
              {t('extraNotes')}
            </label>
            <textarea
              id="extra-notes"
              data-sahayak-field="extra-notes"
              className={`${fieldClass('extra-notes')} min-h-28`}
              placeholder={t('extraNotesHint')}
              value={extraNotes}
              onChange={(e) => setExtraNotes(e.target.value)}
            />
          </div>
          <div className="mt-6 flex gap-3">
            <button type="button" className="btn-secondary" onClick={() => setStep(2)}>
              {t('back')}
            </button>
            <button type="button" className="btn-primary" disabled={!detailsReady} onClick={() => setStep(4)}>
              {t('continue')}
            </button>
          </div>
        </GlassCard>
      )}

      {step === 4 && publicFlow && (
        <GlassCard>
          <h2 className="mb-2 text-[22px] font-semibold">{t('villageWard')}</h2>
          <p className="mb-6 text-sm leading-relaxed text-slate">{t('villageWardBody')}</p>

          <div className="flex items-center justify-between gap-4 rounded-card border border-line bg-white/80 px-4 py-3">
            <div className="min-w-0">
              <p className="font-semibold text-indigo">{t('shareLocation')}</p>
              <p className="mt-0.5 text-sm text-slate">{t('shareLocationHint')}</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={shareLocation}
              className={`relative h-8 w-14 shrink-0 rounded-full transition ${shareLocation ? 'bg-indigo' : 'bg-line'}`}
              onClick={() => {
                if (shareLocation) {
                  setShareLocation(false)
                  return
                }
                setShareLocation(true)
                locate()
              }}
            >
              <span
                className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow-sm transition ${
                  shareLocation ? 'left-7' : 'left-1'
                }`}
              />
            </button>
          </div>

          {shareLocation && (
            <div className="mt-4 rounded-card bg-indigo/5 px-4 py-3">
              <p className="flex items-start gap-2 text-sm text-indigo">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  {geoHint || t('geoAsk')}
                  {form.latitude && form.longitude ? (
                    <>
                      <br />
                      <span className="text-slate">{t('pinLabel', { lat: form.latitude, lng: form.longitude })}</span>
                    </>
                  ) : null}
                </span>
              </p>
            </div>
          )}

          {nearby.length > 0 && (
            <div className="mt-6">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber">Jan Samarthan</p>
              <h3 className="mt-1 text-lg font-semibold text-indigo">{t('issuesNearYou')}</h3>
              <p className="mt-1 text-sm text-slate">{t('issuesNearYouBody')}</p>
              <ul className="mt-4 space-y-3">
                {nearby.slice(0, 4).map((item) => {
                  const query = new URLSearchParams({
                    id: item.registration_id,
                    mode: item.distance_m != null && item.distance_m <= 150 ? 'onsite' : 'remote',
                  })
                  return (
                    <li
                      key={item.registration_id}
                      className="flex flex-wrap items-start justify-between gap-3 rounded-card border border-line bg-white/80 px-4 py-3"
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-indigo">{item.subject}</p>
                        <p className="mt-1 text-sm text-slate">
                          {[item.village, item.ward, item.district].filter(Boolean).join(', ') || '—'}
                          {item.distance_m != null ? ` · ${item.distance_m} m` : ''}
                          {` · ${hi ? 'समर्थन' : 'Backed'} ${item.backer_count}`}
                        </p>
                      </div>
                      <Link href={`/nearby/raise?${query.toString()}`} className="btn-primary shrink-0">
                        {hi ? 'बढ़ाएँ' : 'Raise'}
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}

          <p className="mb-3 mt-6 text-sm font-semibold text-indigo">{t('typeThePlace')}</p>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="label" htmlFor="village">
                {t('villageLocality')}
              </label>
              <input id="village" className={fieldClass('village')} value={form.village} onChange={(e) => update('village', e.target.value)} />
            </div>
            <div>
              <label className="label" htmlFor="ward">
                {t('wardPanchayat')}
              </label>
              <input id="ward" className={fieldClass('ward')} value={form.ward} onChange={(e) => update('ward', e.target.value)} />
            </div>
            <div>
              <label className="label" htmlFor="district">
                {t('district')}
              </label>
              <input id="district" className={fieldClass('district')} value={form.district} onChange={(e) => update('district', e.target.value)} />
            </div>
            <div>
              <label className="label" htmlFor="street">
                {t('streetLandmark')}
              </label>
              <input id="street" className={fieldClass('street')} value={form.street} onChange={(e) => update('street', e.target.value)} />
            </div>
          </div>
          <div className="mt-6 flex gap-3">
            <button type="button" className="btn-secondary" onClick={() => setStep(3)}>
              {t('back')}
            </button>
            <button type="button" className="btn-primary" disabled={!placeReady} onClick={() => setStep(5)}>
              {t('continue')}
            </button>
          </div>
        </GlassCard>
      )}

      {step === 5 && publicFlow && (
        <GlassCard>
          <h2 id="photo" data-sahayak-field="photo" className="mb-6 text-[22px] font-semibold">
            {t('photoOfProblem')}
          </h2>
          <EvidenceCapture
            ref={evidenceRef}
            items={evidence}
            onChange={setEvidence}
            photoPrompt={hi && playbook.photo_prompt_hi ? playbook.photo_prompt_hi : playbook.photo_prompt}
            docPrompt={hi && playbook.doc_prompt_hi ? playbook.doc_prompt_hi : playbook.doc_prompt}
            needPhoto={playbook.needs_photo}
          />
          <div className="mt-6 flex gap-3">
            <button type="button" className="btn-secondary" onClick={() => setStep(4)}>
              {t('back')}
            </button>
            <button
              type="button"
              className="btn-primary"
              disabled={busy || (playbook.needs_photo && evidence.length === 0)}
              onClick={suggest}
            >
              {busy ? t('reading') : t('suggestDepartment')}
            </button>
          </div>
        </GlassCard>
      )}

      {((step === 6 && publicFlow) || (step === 3 && !publicFlow)) && (
        <GlassCard>
          <h2 className="mb-6 text-[22px] font-semibold">{publicFlow ? '6' : '3'}. {t('departmentExpectations')}</h2>
          {routing && (
            <div className="mb-6 rounded-card bg-indigo/5 p-4 text-sm leading-relaxed">
              <p className="font-semibold text-indigo">{t('suggestedBecause')}</p>
              <p className="mt-1 text-ink">{routing.reason}</p>
              <p className="mt-3 text-slate">
                {t('similarDays', { days: routing.expected_days, pct: routing.pendency_pct })}
              </p>
            </div>
          )}
          <label className="label" htmlFor="ministry">
            {t('ministryDept')}
          </label>
          <select id="ministry" className="field mb-4" value={form.ministry} onChange={(e) => update('ministry', e.target.value)}>
            <option value="">{t('selectMinistry')}</option>
            {MINISTRIES.map((m) => (
              <option key={m} value={m}>
                {translateLookup(MINISTRY_HI, m, lang)}
              </option>
            ))}
          </select>
          <label className="label" htmlFor="category">
            {t('category')}
          </label>
          <select id="category" className="field" value={form.category} onChange={(e) => update('category', e.target.value)}>
            <option value="">{t('selectCategory')}</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {translateLookup(CATEGORY_HI, c, lang)}
              </option>
            ))}
          </select>
          <div className="mt-6 flex gap-3">
            <button type="button" className="btn-secondary" onClick={() => setStep(publicFlow ? 5 : 2)}>
              {t('back')}
            </button>
            <button type="button" className="btn-primary" disabled={!form.ministry || !form.category || busy} onClick={submit}>
              {t('submitGrievance')}
            </button>
          </div>
        </GlassCard>
      )}

      {step === lastStep && result && (
        <GlassCard>
          <div className="mx-auto max-w-2xl text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/15 text-success">
              <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="2.2">
                <circle cx="12" cy="12" r="9" />
                <path d="m8.5 12.5 2.4 2.4 4.6-5.2" />
              </svg>
            </div>
            <p className="mt-4 text-xs font-semibold uppercase tracking-[0.16em] text-success">CPGRAMS</p>
            <h2 className="mt-2 text-[28px] font-bold text-indigo">{t('registeredOk')}</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate">{t('registeredOkBody')}</p>
            <div className="mt-6 rounded-card border border-indigo/15 bg-indigo/5 px-4 py-5">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate">{t('registrationNumber')}</p>
              <p className="mt-2 text-2xl font-bold tracking-wide text-indigo">{result.registration_id}</p>
            </div>
          </div>
          {result.evidence?.length ? (
            <div className="mt-6 grid grid-cols-3 gap-3">
              {result.evidence.map((item, index) =>
                item.data_url ? (
                  <img key={index} src={item.data_url} alt="" className="h-24 w-full rounded-card object-cover" />
                ) : null
              )}
            </div>
          ) : null}
          <dl className="mt-6 grid gap-3 rounded-card bg-white/55 p-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs uppercase tracking-[0.12em] text-slate">{t('name')}</dt>
              <dd className="mt-1 font-medium text-indigo">{result.name}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-[0.12em] text-slate">{t('mobile')}</dt>
              <dd className="mt-1 font-medium text-indigo">{result.mobile}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs uppercase tracking-[0.12em] text-slate">{t('ministryDept')}</dt>
              <dd className="mt-1 font-medium text-indigo">{translateLookup(MINISTRY_HI, result.ministry, lang)}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs uppercase tracking-[0.12em] text-slate">{t('subject')}</dt>
              <dd className="mt-1 font-medium text-indigo">{result.subject}</dd>
            </div>
            {result.assigned_name ? (
              <div className="sm:col-span-2">
                <dt className="text-xs uppercase tracking-[0.12em] text-slate">{t('assignedTo')}</dt>
                <dd className="mt-1 font-medium text-indigo">
                  {result.assigned_name}
                  {result.assigned_title ? ` · ${result.assigned_title}` : ''}
                </dd>
              </div>
            ) : null}
          </dl>
          <pre className="mt-4 whitespace-pre-wrap rounded-card bg-white/70 p-4 text-sm leading-relaxed text-ink/90">{summary}</pre>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href={`/status/${encodeURIComponent(result.registration_id)}`} className="btn-primary">
              {t('viewStatus')}
            </Link>
            <Link href={`/back/${encodeURIComponent(result.registration_id)}`} className="btn-secondary">
              {hi ? 'प्रभावित लोगों को जोड़ें' : 'Add affected people'}
            </Link>
            <Link href="/desk" className="btn-secondary">
              {t('grievanceDashboard')}
            </Link>
            <button type="button" className="btn-secondary" onClick={() => window.print()}>
              {t('printAck')}
            </button>
          </div>
          {(collectOpen || communitySpread) && (
            <div className="mt-8">
              <RaiseVerifyPanel
                registrationId={result.registration_id}
                mode="remote"
                defaultName=""
                defaultMobile=""
                defaultVillage={result.village}
                defaultWard={result.ward}
              />
            </div>
          )}
        </GlassCard>
      )}
    </div>
  )
}
