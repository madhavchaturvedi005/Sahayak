'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { ArrowRight, MapPin, Droplets, Route, Trash2, ShieldAlert, Zap, Wheat, Receipt, Landmark, Radio, Train, Heart, HelpCircle, Loader2, Briefcase, Mail, Building2, Share2 } from 'lucide-react'
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
import { printGrievance } from '@/lib/print'

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

const PLAYBOOK_ICONS: Record<string, React.ReactNode> = {
  water: <Droplets className="h-5 w-5 shrink-0 text-sky-500" />,
  road: <Route className="h-5 w-5 shrink-0 text-amber-600" />,
  waste: <Trash2 className="h-5 w-5 shrink-0 text-green-600" />,
  cyber: <ShieldAlert className="h-5 w-5 shrink-0 text-red-500" />,
  power: <Zap className="h-5 w-5 shrink-0 text-yellow-500" />,
  pmkisan: <Wheat className="h-5 w-5 shrink-0 text-lime-600" />,
  income_tax: <Receipt className="h-5 w-5 shrink-0 text-orange-500" />,
  banking: <Landmark className="h-5 w-5 shrink-0 text-blue-600" />,
  telecom: <Radio className="h-5 w-5 shrink-0 text-purple-500" />,
  railway: <Train className="h-5 w-5 shrink-0 text-indigo-600" />,
  health: <Heart className="h-5 w-5 shrink-0 text-rose-500" />,
  labour: <Briefcase className="h-5 w-5 shrink-0 text-teal-600" />,
  posts: <Mail className="h-5 w-5 shrink-0 text-blue-500" />,
  home_affairs: <Building2 className="h-5 w-5 shrink-0 text-slate-600" />,
  general: <HelpCircle className="h-5 w-5 shrink-0 text-slate-400" />,
}

const FALLBACK: Playbook[] = [
  {
    id: 'water',
    title: 'Water is not coming',
    title_hi: 'पानी नहीं आ रहा',
    blurb: 'Dry tap, dirty supply, or a broken pipeline.',
    blurb_hi: 'सूखा नल, गंदा पानी, या टूटी पाइपलाइन।',
    ministry: 'Ministry of Housing and Urban Affairs',
    category: 'Water supply / civic amenities',
    needs_photo: true,
    photo_prompt: 'Take a photo of the dry tap, tanker, or the broken pipe.',
    doc_prompt: 'Never upload Aadhaar, PAN, or OTP.',
    questions: [
      { id: 'kind', label: 'What is wrong with the water?', label_hi: 'पानी में क्या समस्या है?', type: 'choice', options: ['No supply', 'Dirty / smelly water', 'Leak or burst pipe', 'Tanker did not come'], options_hi: ['आपूर्ति नहीं', 'गंदा / बदबूदार पानी', 'रिसाव या फटी पाइप', 'टैंकर नहीं आया'] },
      { id: 'days', label: 'How long has this been going on?', label_hi: 'यह कब से हो रहा है?', type: 'choice', options: ['Today', '2–7 days', 'More than a week', 'More than a month'], options_hi: ['आज', '2–7 दिन', 'एक सप्ताह से अधिक', 'एक महीने से अधिक'] },
      { id: 'spread', label: 'Who is affected?', label_hi: 'किस पर असर है?', type: 'choice', options: ['Only my house', 'This gali / street', 'The whole village or ward'], options_hi: ['केवल मेरा घर', 'यह गली / सड़क', 'पूरा गाँव या वार्ड'] },
      { id: 'source', label: 'Do you know the source?', label_hi: 'स्रोत पता है?', type: 'choice', options: ['Municipal tap', 'Handpump / borewell', 'Tanker', 'Unknown'], options_hi: ['नगरपालिका नल', 'हैंडपंप / बोरवेल', 'टैंकर', 'अज्ञात'] },
    ],
  },
  {
    id: 'road',
    title: 'Road is blocked or broken',
    title_hi: 'सड़क बंद या टूटी है',
    blurb: 'Jam, potholes, a fallen tree, or a cut that no one filled.',
    blurb_hi: 'जाम, गड्ढे, गिरा पेड़, या खोदी गई सड़क।',
    ministry: 'Ministry of Road Transport and Highways',
    category: 'Road / transport',
    needs_photo: true,
    photo_prompt: 'Photograph the blockage or the broken stretch.',
    doc_prompt: 'Never upload Aadhaar, PAN, or OTP.',
    questions: [
      { id: 'kind', label: 'What is wrong with the road?', label_hi: 'सड़क में क्या समस्या है?', type: 'choice', options: ['Blocked right now', 'Deep potholes', 'Broken culvert / bridge', 'No work after digging'], options_hi: ['अभी बंद है', 'गहरे गड्ढे', 'टूटा पुलिया / पुल', 'खोदने के बाद काम नहीं'] },
      { id: 'days', label: 'Since when?', label_hi: 'कब से?', type: 'choice', options: ['Today', 'A few days', 'Weeks', 'Months'], options_hi: ['आज', 'कुछ दिन', 'सप्ताह', 'महीने'] },
      { id: 'traffic', label: 'What cannot pass?', label_hi: 'क्या नहीं निकल पा रहा?', type: 'choice', options: ['Two-wheelers only struggling', 'Cars and jeeps', 'Buses and trucks', 'Ambulance / school also stuck'], options_hi: ['केवल दोपहिया मुश्किल से', 'कार और जीप', 'बस और ट्रक', 'एम्बुलेंस / स्कूल भी फँसे'] },
    ],
  },
  {
    id: 'waste',
    title: 'Garbage, drain, or river waste',
    title_hi: 'कचरा, नाला या नदी का कचरा',
    blurb: 'Dump, nala, or waste near homes.',
    blurb_hi: 'घरों के पास ढेर, नाला या कचरा।',
    ministry: 'Ministry of Housing and Urban Affairs',
    category: 'Sanitation / waste',
    needs_photo: true,
    photo_prompt: 'Photograph the dump, nala, or river edge.',
    doc_prompt: 'Never upload Aadhaar, PAN, or OTP.',
    questions: [
      { id: 'type', label: 'What kind of waste is it?', label_hi: 'यह किस तरह का कचरा है?', type: 'choice', options: ['Household dump', 'Drain / sewage', 'Industrial waste', 'River weed or floating waste'], options_hi: ['घरेलू ढेर', 'नाला / सीवेज', 'औद्योगिक कचरा', 'नदी की घास या तैरता कचरा'] },
      { id: 'affect', label: 'How is it hurting people nearby?', label_hi: 'आसपास के लोगों को क्या नुकसान?', type: 'choice', options: ['Foul smell', 'Mosquitoes', 'Spreading illness', 'Bad air', 'Not affecting homes yet'], options_hi: ['दुर्गंध', 'मच्छर', 'बीमारी फैल रही', 'खराब हवा', 'अभी घरों पर असर नहीं'] },
      { id: 'distance', label: 'How close is it to houses?', label_hi: 'घरों से कितनी दूरी?', type: 'choice', options: ['0–100 metres', '100–500 metres', 'More than 500 metres'], options_hi: ['0–100 मीटर', '100–500 मीटर', '500 मीटर से अधिक'] },
      { id: 'source', label: 'Is the source known?', label_hi: 'स्रोत पता है?', type: 'text', hint: 'Factory name, market, or write Unknown.', hint_hi: 'कारखाने का नाम, बाज़ार, या अज्ञात।' },
    ],
  },
  {
    id: 'cyber',
    title: 'Cyber fraud or online cheat',
    title_hi: 'साइबर धोखा या ऑनलाइन ठगी',
    blurb: 'UPI scam, fake call, hacked account.',
    blurb_hi: 'यूपीआई ठगी, फर्जी कॉल, हैक खाता।',
    ministry: 'Ministry of Electronics and Information Technology',
    category: 'Cyber / digital fraud',
    needs_photo: true,
    photo_prompt: 'Screenshot the fraud message. Hide any OTP or PIN.',
    doc_prompt: 'Never upload Aadhaar, PAN, OTP, or full card number.',
    questions: [
      { id: 'kind', label: 'What kind of cheat was this?', label_hi: 'किस तरह की ठगी?', type: 'choice', options: ['UPI / payment fraud', 'Fake call or WhatsApp', 'Hacked social or email', 'Job / KYC phishing'], options_hi: ['यूपीआई / भुगतान ठगी', 'फर्जी कॉल या व्हाट्सऐप', 'हैक सोशल या ईमेल', 'नौकरी / केवाईसी फिशिंग'] },
      { id: 'when', label: 'When did it happen?', label_hi: 'यह कब हुआ?', type: 'text', hint: 'Date and roughly the time.' },
      { id: 'amount', label: 'Money lost, if any', label_hi: 'कितना पैसा गया?', type: 'text', hint: 'Amount in rupees, or write None.' },
      { id: 'channel', label: 'How did they reach you?', label_hi: 'वे आप तक कैसे पहुँचे?', type: 'text', hint: 'App name or a phone number. Not your password.' },
      { id: 'reported', label: 'Have you already told the bank or cybercrime.gov.in?', label_hi: 'क्या बैंक या cybercrime.gov.in को बता चुके हैं?', type: 'choice', options: ['Not yet', 'Told the bank', 'Filed on cybercrime.gov.in', 'Both'], options_hi: ['अभी नहीं', 'बैंक को बताया', 'cybercrime.gov.in पर दर्ज', 'दोनों'] },
    ],
  },
  {
    id: 'power',
    title: 'Electricity is out',
    title_hi: 'बिजली गई हुई है',
    blurb: 'No bijli, dangerous wires, or a wrong bill.',
    blurb_hi: 'बिजली नहीं, खतरनाक तार, या गलत बिल।',
    ministry: 'Ministry of Power',
    category: 'Power supply',
    needs_photo: true,
    photo_prompt: 'Photo of the dark street, the fallen wire, or the bill.',
    doc_prompt: 'Never upload Aadhaar or PAN.',
    questions: [
      { id: 'kind', label: 'What is the power problem?', label_hi: 'बिजली की क्या समस्या?', type: 'choice', options: ['No supply', 'Voltage too low / high', 'Fallen or hanging wire', 'Wrong bill'], options_hi: ['आपूर्ति नहीं', 'वोल्टेज कम / अधिक', 'गिरा या लटकता तार', 'गलत बिल'] },
      { id: 'days', label: 'Since when?', label_hi: 'कब से?', type: 'choice', options: ['Hours', '1–2 days', 'More than a week'], options_hi: ['घंटे', '1–2 दिन', 'एक सप्ताह से अधिक'] },
      { id: 'spread', label: 'Who is without power?', label_hi: 'किसके पास बिजली नहीं?', type: 'choice', options: ['Only my house', 'This street', 'The whole village'], options_hi: ['केवल मेरा घर', 'यह सड़क', 'पूरा गाँव'] },
    ],
  },
  {
    id: 'pmkisan',
    title: 'PM-KISAN instalment stopped',
    title_hi: 'पीएम-किसान किस्त रुकी',
    blurb: 'Instalment not received, registration rejected, or wrong bank details.',
    blurb_hi: 'किस्त नहीं आई, पंजीकरण रद्द, या गलत बैंक।',
    ministry: 'Department of Agriculture & Farmers Welfare',
    category: 'Farmers welfare / PM-KISAN',
    needs_photo: false,
    photo_prompt: 'Optional: screenshot of PM-KISAN portal or SMS showing stopped payment.',
    doc_prompt: 'Optional: bank passbook page. Never Aadhaar number or OTP.',
    questions: [
      { id: 'kind', label: 'What is the problem?', label_hi: 'क्या समस्या है?', type: 'choice', options: ['Instalment stopped after a few payments', 'Never received any instalment', 'Registration rejected or pending', 'Wrong bank account linked'], options_hi: ['कुछ किस्तों के बाद रुक गई', 'कोई किस्त नहीं मिली', 'पंजीकरण रद्द या लंबित', 'गलत बैंक खाता जुड़ा'] },
      { id: 'since', label: 'Since when have payments stopped?', label_hi: 'किस्त कब से रुकी?', type: 'choice', options: ['Last 1 instalment', '2–3 instalments', 'More than 4 instalments', 'Never started'], options_hi: ['पिछली 1 किस्त से', '2–3 किस्तें', '4 से अधिक किस्तें', 'कभी शुरू नहीं'] },
      { id: 'registered', label: 'Is the mobile linked to Aadhaar registered on PM-KISAN portal?', label_hi: 'क्या आधार से जुड़ा मोबाइल पीएम-किसान पोर्टल पर दर्ज है?', type: 'choice', options: ['Yes', 'Not sure', 'No'], options_hi: ['हाँ', 'पता नहीं', 'नहीं'] },
    ],
  },
  {
    id: 'income_tax',
    title: 'Income tax refund or PAN issue',
    title_hi: 'आयकर रिफंड या पैन समस्या',
    blurb: 'Refund not received, PAN not issued, wrong demand notice.',
    blurb_hi: 'रिफंड नहीं मिला, पैन नहीं आया, गलत माँग नोटिस।',
    ministry: 'Central Board of Direct Taxes',
    category: 'Income tax / GST',
    needs_photo: false,
    photo_prompt: 'Screenshot of the e-filing portal showing the error or wrong demand.',
    doc_prompt: 'Optional: ITR acknowledgement. Never OTP or password.',
    questions: [
      { id: 'kind', label: 'What is the problem?', label_hi: 'क्या समस्या है?', type: 'choice', options: ['Refund not received', 'Wrong demand notice', 'PAN not issued / error', 'Technical error on portal'], options_hi: ['रिफंड नहीं मिला', 'गलत माँग नोटिस', 'पैन जारी नहीं / गड़बड़ी', 'पोर्टल पर तकनीकी समस्या'] },
      { id: 'year', label: 'Which assessment year?', label_hi: 'कौन सा मूल्यांकन वर्ष?', type: 'text', hint: 'e.g. AY 2024-25', hint_hi: 'उदा. AY 2024-25' },
      { id: 'amount', label: 'Refund or demand amount (if known)', label_hi: 'रिफंड या माँग राशि', type: 'text', hint: 'Amount in rupees, or write Unknown.' },
    ],
  },
  {
    id: 'banking',
    title: 'Bank, PF withdrawal, or pension delay',
    title_hi: 'बैंक, पीएफ निकासी या पेंशन देरी',
    blurb: 'PF not settled, pension stopped, banking fraud, or account access problem.',
    blurb_hi: 'पीएफ नहीं मिला, पेंशन रुकी, बैंकिंग धोखा, या खाता बंद।',
    ministry: 'Department of Financial Services',
    category: 'Banking / insurance',
    needs_photo: false,
    photo_prompt: 'Optional: passbook page, bank statement, or pension slip.',
    doc_prompt: 'Optional: passbook or bank statement. Never OTP, PIN, or full account number.',
    questions: [
      { id: 'kind', label: 'What is the problem?', label_hi: 'क्या समस्या है?', type: 'choice', options: ['PF withdrawal pending', 'Pension stopped or delayed', 'Unauthorised debit / fraud', 'Account blocked or KYC problem', 'Bank staff harassment'], options_hi: ['पीएफ निकासी लंबित', 'पेंशन रुकी या देरी', 'अनधिकृत डेबिट / धोखा', 'खाता बंद या केवाईसी समस्या', 'बैंक कर्मचारी का दुर्व्यवहार'] },
      { id: 'since', label: 'How long has this been pending?', label_hi: 'यह कब से लंबित है?', type: 'choice', options: ['Less than 1 month', '1–3 months', '3–6 months', 'More than 6 months'], options_hi: ['1 महीने से कम', '1–3 महीने', '3–6 महीने', '6 महीने से अधिक'] },
      { id: 'amount', label: 'Approximate amount involved', label_hi: 'अनुमानित राशि', type: 'text', hint: 'In rupees, or write Unknown.' },
    ],
  },
  {
    id: 'telecom',
    title: 'Mobile, broadband, or SIM problem',
    title_hi: 'मोबाइल, ब्रॉडबैंड या सिम समस्या',
    blurb: 'No signal, can\'t port number, broadband down, or wrong bill.',
    blurb_hi: 'नेटवर्क नहीं, नंबर पोर्ट नहीं, ब्रॉडबैंड बंद, या गलत बिल।',
    ministry: 'Department of Telecommunications',
    category: 'Telecom services',
    needs_photo: false,
    photo_prompt: 'Optional: screenshot of the error or the wrong bill.',
    doc_prompt: 'Optional: a copy of the bill. Never OTP or password.',
    questions: [
      { id: 'kind', label: 'What is the problem?', label_hi: 'क्या समस्या है?', type: 'choice', options: ['No signal or call drops', 'Broadband / internet down', 'Number portability stuck', 'Wrong bill or overcharge', 'SIM blocked or not activated'], options_hi: ['नेटवर्क नहीं या कॉल ड्रॉप', 'ब्रॉडबैंड / इंटरनेट बंद', 'नंबर पोर्ट अटका', 'गलत बिल या ओवरचार्ज', 'सिम बंद या सक्रिय नहीं'] },
      { id: 'operator', label: 'Which telecom operator?', label_hi: 'कौन सी टेलीकॉम कंपनी?', type: 'choice', options: ['Jio', 'Airtel', 'BSNL', 'Vi (Vodafone Idea)', 'Other'], options_hi: ['जियो', 'एयरटेल', 'बीएसएनएल', 'Vi (वोडाफोन आइडिया)', 'अन्य'] },
      { id: 'days', label: 'Since when?', label_hi: 'कब से?', type: 'choice', options: ['Today', 'A few days', 'A week', 'More than a month'], options_hi: ['आज', 'कुछ दिन', 'एक सप्ताह', 'एक महीने से अधिक'] },
    ],
  },
  {
    id: 'railway',
    title: 'Railway service complaint',
    title_hi: 'रेलवे सेवा शिकायत',
    blurb: 'Train delay, ticket refund, dirty coach, station, or staff.',
    blurb_hi: 'ट्रेन लेट, टिकट रिफंड, गंदा कोच, स्टेशन, या कर्मचारी।',
    ministry: 'Ministry of Railways',
    category: 'Rail services',
    needs_photo: true,
    photo_prompt: 'Photo of the coach condition, station issue, or a screenshot of the booking.',
    doc_prompt: 'Optional: PNR or ticket screenshot. Never OTP or full card number.',
    questions: [
      { id: 'kind', label: 'What is the problem?', label_hi: 'क्या समस्या है?', type: 'choice', options: ['Train significantly delayed', 'Ticket refund not received', 'Dirty or broken coach / toilet', 'Station facility missing', 'Staff misbehaviour'], options_hi: ['ट्रेन काफी लेट', 'टिकट रिफंड नहीं मिला', 'गंदा या टूटा कोच / शौचालय', 'स्टेशन सुविधा गायब', 'कर्मचारी का दुर्व्यवहार'] },
      { id: 'train', label: 'Train name or number (if relevant)', label_hi: 'ट्रेन का नाम या नंबर', type: 'text', hint: 'e.g. 12051 or Deccan Queen' },
      { id: 'date', label: 'Date of travel / incident', label_hi: 'यात्रा / घटना की तारीख', type: 'text', hint: 'DD/MM/YYYY' },
    ],
  },
  {
    id: 'health',
    title: 'Hospital or health scheme problem',
    title_hi: 'अस्पताल या स्वास्थ्य योजना समस्या',
    blurb: 'Ayushman card rejected, medicine unavailable, or doctor absent.',
    blurb_hi: 'आयुष्मान कार्ड अस्वीकार, दवा नहीं, या डॉक्टर अनुपस्थित।',
    ministry: 'Ministry of Health & Family Welfare',
    category: 'Public health services',
    needs_photo: false,
    photo_prompt: 'Optional: photo of closed facility or a notice on the door.',
    doc_prompt: 'Optional: Ayushman card or prescription. Never Aadhaar or OTP.',
    questions: [
      { id: 'kind', label: 'What is the problem?', label_hi: 'क्या समस्या है?', type: 'choice', options: ['Ayushman / PMJAY card rejected', 'Medicine not available at PHC', 'Doctor / ANM absent', 'Treatment refused', 'Dirty / broken facility'], options_hi: ['आयुष्मान / PMJAY कार्ड अस्वीकार', 'PHC पर दवा नहीं', 'डॉक्टर / ANM अनुपस्थित', 'इलाज से मना', 'गंदी / टूटी सुविधा'] },
      { id: 'facility', label: 'Name of the hospital or health centre', label_hi: 'अस्पताल या स्वास्थ्य केंद्र का नाम', type: 'text', hint: 'e.g. PHC Nashik, District Hospital Pune' },
      { id: 'since', label: 'Is this a one-time event or ongoing?', label_hi: 'एक बार की घटना या लगातार?', type: 'choice', options: ['One-time incident', 'Happens regularly', 'Ongoing for weeks'], options_hi: ['एक बार की घटना', 'नियमित होता है', 'हफ्तों से जारी'] },
    ],
  },
  {
    id: 'labour',
    title: 'Labour, MGNREGA, or ESI issue',
    title_hi: 'श्रम, मनरेगा, या ESI समस्या',
    blurb: 'MGNREGA wages unpaid, ESI denied, or labour law violation.',
    blurb_hi: 'मनरेगा मजदूरी नहीं मिली, ESI से मना, या श्रम कानून उल्लंघन।',
    ministry: 'Ministry of Labour and Employment',
    category: 'Labour / employment',
    needs_photo: false,
    photo_prompt: 'Optional: job card, wage slip, or ESI card.',
    doc_prompt: 'Optional: job card or ESI card. Never Aadhaar or OTP.',
    questions: [
      { id: 'kind', label: 'What is the problem?', label_hi: 'क्या समस्या है?', type: 'choice', options: ['MGNREGA wages not paid', 'MGNREGA work not provided', 'ESI medical benefit denied', 'ESI claim or card issue', 'Labour law violation by employer', 'Provident Fund / EPFO issue'], options_hi: ['मनरेगा मजदूरी नहीं मिली', 'मनरेगा काम नहीं मिला', 'ESI चिकित्सा लाभ से मना', 'ESI दावा या कार्ड समस्या', 'नियोक्ता द्वारा श्रम कानून उल्लंघन', 'प्रोविडेंट फंड / EPFO समस्या'] },
      { id: 'since', label: 'How long has this been pending?', label_hi: 'यह कब से लंबित है?', type: 'choice', options: ['Less than 1 month', '1–3 months', '3–6 months', 'More than 6 months'], options_hi: ['1 महीने से कम', '1–3 महीने', '3–6 महीने', '6 महीने से अधिक'] },
      { id: 'employer', label: 'Name of employer or contractor (if relevant)', label_hi: 'नियोक्ता या ठेकेदार का नाम', type: 'text', hint: 'Company or contractor name, or write Not applicable.' },
    ],
  },
  {
    id: 'posts',
    title: 'Post office or postal service',
    title_hi: 'पोस्ट ऑफिस या डाक सेवा',
    blurb: 'Speed post not delivered, parcel lost, or savings account issue.',
    blurb_hi: 'स्पीड पोस्ट नहीं मिला, पार्सल खोया, या बचत खाता समस्या।',
    ministry: 'Department of Posts',
    category: 'Postal services',
    needs_photo: false,
    photo_prompt: 'Optional: screenshot of tracking page or the receipt.',
    doc_prompt: 'Optional: postal receipt or tracking ID. Never OTP.',
    questions: [
      { id: 'kind', label: 'What is the problem?', label_hi: 'क्या समस्या है?', type: 'choice', options: ['Speed post / registered mail not delivered', 'Parcel lost or damaged', 'Post office not functioning / closed', 'India Post Payments Bank (IPPB) issue', 'Postal Life Insurance (PLI) claim', 'Savings / RD account issue'], options_hi: ['स्पीड पोस्ट / पंजीकृत डाक नहीं मिली', 'पार्सल खोया या क्षतिग्रस्त', 'पोस्ट ऑफिस काम नहीं कर रहा', 'India Post पेमेंट्स बैंक (IPPB) समस्या', 'डाक जीवन बीमा (PLI) दावा', 'बचत / RD खाता समस्या'] },
      { id: 'tracking', label: 'Tracking ID or consignment number', label_hi: 'ट्रैकिंग ID या कंसाइनमेंट नंबर', type: 'text', hint: 'e.g. EW123456789IN, or write Not available.' },
      { id: 'since', label: 'Since when?', label_hi: 'कब से?', type: 'choice', options: ['Less than a week', '1–2 weeks', 'More than a month'], options_hi: ['एक सप्ताह से कम', '1–2 सप्ताह', 'एक महीने से अधिक'] },
    ],
  },
  {
    id: 'home_affairs',
    title: 'Passport, police, or home affairs',
    title_hi: 'पासपोर्ट, पुलिस, या गृह मामले',
    blurb: 'Passport delay, police inaction, FIR not filed, or citizenship issue.',
    blurb_hi: 'पासपोर्ट देरी, पुलिस निष्क्रियता, FIR दर्ज नहीं, या नागरिकता समस्या।',
    ministry: 'Ministry of Home Affairs',
    category: 'Home affairs',
    needs_photo: false,
    photo_prompt: 'Optional: photo of any relevant notice or document.',
    doc_prompt: 'Optional: acknowledgement slip. Never Aadhaar or OTP.',
    questions: [
      { id: 'kind', label: 'What is the problem?', label_hi: 'क्या समस्या है?', type: 'choice', options: ['Passport not issued or delayed', 'Police not taking FIR', 'Police inaction on complaint', 'Police harassment or misconduct', 'Citizenship / NRC document issue', 'Visa or OCI card issue'], options_hi: ['पासपोर्ट जारी नहीं या देरी', 'पुलिस FIR नहीं ले रही', 'शिकायत पर पुलिस कार्रवाई नहीं', 'पुलिस उत्पीड़न या दुर्व्यवहार', 'नागरिकता / NRC दस्तावेज़ समस्या', 'वीज़ा या OCI कार्ड समस्या'] },
      { id: 'since', label: 'Since when?', label_hi: 'कब से?', type: 'choice', options: ['Less than 1 month', '1–3 months', 'More than 3 months'], options_hi: ['1 महीने से कम', '1–3 महीने', '3 महीने से अधिक'] },
      { id: 'tried', label: 'Have you approached the concerned office already?', label_hi: 'क्या आप संबंधित कार्यालय में पहले जा चुके हैं?', type: 'choice', options: ['Yes, but no result', 'Not yet', 'Approached multiple times'], options_hi: ['हाँ, लेकिन कोई नतीजा नहीं', 'अभी नहीं', 'कई बार जा चुके हैं'] },
    ],
  },
  {
    id: 'general',
    title: 'Other / describe your problem',
    title_hi: 'अन्य / अपनी समस्या बताएँ',
    blurb: 'Type your problem and AI will find the right department.',
    blurb_hi: 'अपनी समस्या लिखें, AI सही विभाग ढूँढेगा।',
    ministry: '',
    category: '',
    needs_photo: false,
    photo_prompt: 'A photo helps if the problem can be seen.',
    doc_prompt: 'Never upload Aadhaar, PAN, or OTP.',
    questions: [{ id: 'story', label: 'Describe your problem in plain words', label_hi: 'अपनी समस्या सादे शब्दों में बताएँ', type: 'text', hint: 'What happened, when, and what you want done.', hint_hi: 'क्या हुआ, कब, और आप क्या चाहते हैं।' }],
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
  const [extraNotes, setExtraNotes] = useState('')
  const [othersText, setOthersText] = useState('')
  const [othersDetecting, setOthersDetecting] = useState(false)
  const [othersDetected, setOthersDetected] = useState('')
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

  async function detectOthers() {
    const text = othersText.trim()
    if (!text) return
    setOthersDetecting(true)
    setOthersDetected('')
    try {
      const res = await api.classify(text)
      setRouting(res)
      const detectedId = res.playbook_id && res.playbook_id !== 'general' ? res.playbook_id : 'general'
      const matched = playbooks.find((item) => item.id === detectedId) || playbooks[playbooks.length - 1]
      setAnswers((current) => ({ ...current, story: text }))
      setExtraNotes((current) => current || text)
      update('ministry', res.ministry)
      update('category', res.category)
      setOthersDetected(matched.title)
      setPlaybookId(matched.id)
      setStep(3)
    } catch {
      setOthersDetected('')
      setPlaybookId('general')
      setAnswers((current) => ({ ...current, story: text }))
      setStep(3)
    } finally {
      setOthersDetecting(false)
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
          if (missing[0]) next = `Do NOT re-ask filled fields. If they just answered ${missing[0].split(':')[0]}, call lodge set_answers — do not ask again. Otherwise ask only this missing one, then lodge set_answer: ${missing[0]}.`
          else if (!placeReady) next = 'Answers are done. SAY a location permission will appear; if they Allow you will fill village and district. Then call lodge request_location.'
          else if (state.playbook.needs_photo && state.evidence.length === 0) next = 'SAY you are opening the camera for a photo of the problem. Then call lodge open_camera.'
          else next = 'Call lodge classify_and_confirm, then lodge submit if the department looks right.'
          return [
            `WORKING MEMORY. Do not read this aloud.`,
            `Step ${state.step} of ${state.lastStep}.`,
            `Playbook ${state.playbook.id} (${state.playbook.title}).`,
            `Citizen ${state.form.name || '(empty)'} / ${state.form.mobile || '(empty)'}.`,
            `Place ${[state.form.village, state.form.district].filter(Boolean).join(', ') || '(empty)'}.`,
            `Photos: ${state.evidence.length}.`,
            `Notes: ${state.extraNotes || '(none)'}.`,
            filled.length ? `Already filled — never ask these again: ${filled.join('; ')}` : 'No playbook answers yet.',
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
          if (!chosen) return `Unknown playbook ${id}. Use water, road, waste, cyber, power, pmkisan, income_tax, banking, telecom, railway, health, labour, posts, home_affairs, or general.`
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
              next[question.id] = matchChoice(question.options, raw, question.options_hi)
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
              next[question.id] = matchChoice(question.options, raw, question.options_hi)
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
          <button type="button" className="btn-primary mt-6" disabled={!whoReady} onClick={() => setStep(playbookId ? 3 : 2)}>
            {t('continue')}
          </button>
        </GlassCard>
      )}

      {step === 2 && publicFlow && (
        <GlassCard>
          <h2 className="mb-2 text-[22px] font-semibold">{t('kindOfProblem')}</h2>
          <p className="mb-4 text-sm leading-relaxed text-slate">{t('kindOfProblemBody')}</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {playbooks.filter((item) => item.id !== 'general').map((item) => (
              <button
                key={item.id}
                type="button"
                id={`pack-${item.id}`}
                data-sahayak-field={item.id === playbookId ? 'playbook' : undefined}
                className={`flex items-start gap-3 rounded-card border px-4 py-3 text-left transition-colors ${
                  playbookId === item.id ? 'border-indigo bg-indigo/5' : 'border-line bg-white/70 hover:border-indigo/40 hover:bg-indigo/3'
                } ${actingField === 'playbook' && playbookId === item.id ? 'ring-4 ring-amber/35' : ''}`}
                onClick={() => pickPlaybook(item.id)}
              >
                <span className="mt-0.5">{PLAYBOOK_ICONS[item.id]}</span>
                <span>
                  <span className="block font-semibold leading-snug text-ink">{hi && item.title_hi ? item.title_hi : item.title}</span>
                  <span className="mt-0.5 block text-xs text-slate">{hi && item.blurb_hi ? item.blurb_hi : item.blurb}</span>
                </span>
              </button>
            ))}
          </div>

          {/* Others / AI detect card */}
          <div className={`mt-2 rounded-card border transition-colors ${playbookId === 'general' ? 'border-indigo bg-indigo/5' : 'border-line bg-white/70'}`}>
            <button
              type="button"
              className="flex w-full items-start gap-3 px-4 py-3 text-left"
              onClick={() => setPlaybookId((current) => current === 'general' ? '' : 'general')}
            >
              <span className="mt-0.5">{PLAYBOOK_ICONS['general']}</span>
              <span>
                <span className="block font-semibold leading-snug text-ink">
                  {hi ? 'अन्य / अपनी समस्या बताएँ' : 'Other / describe your problem'}
                </span>
                <span className="mt-0.5 block text-xs text-slate">
                  {hi ? 'अपनी समस्या लिखें, AI सही विभाग ढूँढेगा।' : 'Type your problem and AI will find the right department.'}
                </span>
              </span>
            </button>
            {playbookId === 'general' && (
              <div className="border-t border-line px-4 pb-4 pt-3">
                <textarea
                  className="field min-h-[80px] text-sm"
                  placeholder={hi ? 'अपनी समस्या यहाँ लिखें…' : 'Describe your problem here…'}
                  value={othersText}
                  onChange={(e) => setOthersText(e.target.value)}
                  autoFocus
                />
                <button
                  type="button"
                  className="btn-primary mt-3 flex items-center gap-2"
                  disabled={othersText.trim().length < 10 || othersDetecting}
                  onClick={detectOthers}
                >
                  {othersDetecting ? (
                    <><Loader2 className="h-4 w-4 animate-spin" />{hi ? 'विभाग ढूँढा जा रहा है…' : 'Finding the right department…'}</>
                  ) : (
                    <>{hi ? 'AI से विभाग पहचानें' : 'Let AI detect the department'}<ArrowRight className="h-4 w-4" /></>
                  )}
                </button>
              </div>
            )}
          </div>

          <button type="button" className="btn-secondary mt-4" onClick={() => setStep(1)}>
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
          <h2 className="mb-2 text-[22px] font-semibold flex items-center gap-2">
            {PLAYBOOK_ICONS[playbook.id]}
            <span>3. {hi && playbook.title_hi ? playbook.title_hi : playbook.title}</span>
          </h2>
          {othersDetected && othersDetected !== playbook.title && (
            <div className="mb-4 flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700 border border-green-200">
              <span className="font-medium">{hi ? 'AI ने पहचाना:' : 'AI matched to:'}</span>
              <span>{hi && playbook.title_hi ? playbook.title_hi : playbook.title}</span>
              <button type="button" className="ml-auto text-xs underline opacity-70" onClick={() => { setOthersDetected(''); setPlaybookId('general'); setStep(2); }}>
                {hi ? 'बदलें' : 'Change'}
              </button>
            </div>
          )}
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
            <Link href={`/status/${result.registration_id}`} className="btn-primary">
              {t('viewStatus')}
            </Link>
            <button
              type="button"
              className="btn-secondary flex items-center gap-2"
              onClick={() => {
                const url = `${window.location.origin}/back/${result.registration_id}`
                if (navigator.share) {
                  navigator.share({ title: result.subject, text: hi ? `मेरी शिकायत का समर्थन करें: ${result.subject}` : `Support my grievance: ${result.subject}`, url })
                } else {
                  navigator.clipboard.writeText(url).then(() => alert(hi ? 'लिंक कॉपी हो गया!' : 'Link copied!'))
                }
              }}
            >
              <Share2 className="h-4 w-4" />
              {hi ? 'शेयर करें' : 'Share'}
            </button>
            <Link href="/desk" className="btn-secondary">
              {t('grievanceDashboard')}
            </Link>
            <button type="button" className="btn-secondary" onClick={() => printGrievance(result, lang)}>
              {t('printAck')}
            </button>
          </div>
        </GlassCard>
      )}
    </div>
  )
}
