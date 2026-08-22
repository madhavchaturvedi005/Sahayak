export const ABOUT_CPGRAMS =
  'Centralized Public Grievance Redress and Monitoring System (CPGRAMS) is an online platform available to the citizens 24x7 to lodge their grievances to the public authorities on any subject related to service delivery. It is a single portal connected to all the Ministries/Departments of Government of India and States. Every Ministry and State have role-based access to this system. CPGRAMS is also accessible to the citizens through standalone mobile application downloadable through Google Play Store and mobile application integrated with UMANG.'

export const EXCLUSIONS = [
  'RTI Matters',
  'Court related / Subjudice matters',
  'Religious matters',
  'Grievances of Government employees concerning their service matters including disciplinary proceedings etc. (except those covered under DoPT OM No. 11013/08/2013-Estt.(A)-III dated 31.08.2015)',
]

export const NOTE_DPG =
  'If you are not satisfied with the redressal of your grievance, you may take it up with the Directorate of Public Grievances (DPG), Cabinet Secretariat.'

export const NOTE_CSC =
  'Government is not charging any fee from the public for lodging of grievances on this portal. Money, if any, paid for this purpose is going only to M/s CSC e-Governance Services India Limited.'

export const EMAIL_DISCLAIMER =
  'Any Grievance sent by email will not be attended to / entertained. Please lodge your grievance on this portal.'

export const NIC_CREDIT =
  'This site is designed, developed & hosted by National Informatics Centre, Ministry of Electronics & Information Technology, Government of India. The content is owned by Department of Administrative Reforms & Public Grievances.'

export const SLIDES = [
  {
    title: 'Lodge a grievance by voice',
    hindi: 'अब शिकायत सिर्फ आवाज़ से दर्ज करें',
    body: 'Sahayak listens in your own language, then helps you describe the problem before you lodge.',
    tag: 'Voice',
    image: '/banners/01-voice.png',
    href: '/desk/lodge',
    action: 'Start lodging',
    points: ['Speak in Hindi, English, or mixed', 'Sahayak drafts the subject and department', 'You review before anything is saved'],
  },
  {
    title: 'One portal. Every department.',
    hindi: 'एक पोर्टल, सभी विभाग',
    body: 'CPGRAMS connects you to Ministries and Departments of the Government of India and the States.',
    tag: '24×7 portal',
    image: '/banners/02-portal.png',
    href: '/desk/lodge',
    action: 'Choose a department',
    points: ['Central and state departments on one desk', 'Routing reason is shown, not hidden', 'You can override the suggested ministry'],
  },
  {
    title: 'Track, remind, and appeal',
    hindi: 'स्थिति देखें, अनुस्मारक भेजें, अपील करें',
    body: 'View status, send a reminder, rate a reply, or escalate to the nodal authority — the same paths as today, calmer to use.',
    tag: 'Follow up',
    image: '/banners/03-track.png',
    href: '/status',
    action: 'Track a grievance',
    points: ['Use your registration number', 'Send a reminder if the file is silent', '1 or 2 stars opens the appeal path'],
  },
  {
    title: 'Honest timelines, not silence',
    hindi: 'वास्तविक समयसीमा',
    body: 'Sahayak shows typical disposal time and pendency for the department you are about to file with.',
    tag: 'Expectation setting',
    image: '/banners/04-timelines.png',
    href: '/desk',
    action: 'See typical times',
    points: ['Typical days before you file', 'Share of cases pending beyond 21 days', 'No fake “resolved in 48 hours” promise'],
  },
  {
    title: 'You file. We prepare.',
    hindi: 'आप दर्ज करें, हम तैयार करें',
    body: 'Sahayak never submits on pgportal.gov.in. You leave with a clean summary and a copy-all handoff.',
    tag: 'Handoff',
    image: '/banners/05-handoff.png',
    href: '/desk/lodge',
    action: 'Prepare a summary',
    points: ['This is a companion, not the live portal', 'Copy the draft and file officially yourself', 'Nothing is sent to NIC from here'],
  },
  {
    title: 'Was the reply a real resolution?',
    hindi: 'क्या जवाब वास्तव में समाधान था?',
    body: 'Paste a closure reply. Sahayak checks whether it addressed your complaint, and drafts an appeal if it did not.',
    tag: 'Resolution check',
    image: '/banners/06-resolution.png',
    href: '/help#resolution',
    action: 'Check a reply',
    points: ['Compare the complaint to the speaking order', 'See what is still missing', 'Walk away with an appeal draft'],
  },
  {
    title: 'Multilingual by design',
    hindi: 'बहुभाषी सहायता',
    body: 'Describe the problem in Hindi, English, or a regional language. The form stays in plain language.',
    tag: 'Language',
    image: '/banners/07-language.png',
    href: '/desk/lodge',
    action: 'Describe the problem',
    points: ['Hindi, English, or Hinglish is fine', 'Voice and text use the same live chat', 'Official labels stay in plain words'],
  },
  {
    title: 'Optional AI. Full manual path.',
    hindi: 'एआई वैकल्पिक है',
    body: 'The assistant sits in the corner. Every official function still works if you never open it.',
    tag: 'Your choice',
    image: '/banners/08-optional.png',
    href: '/desk/lodge',
    action: 'Use the manual path',
    points: ['Lodge, track, remind, rate — no AI required', 'The avatar never blocks a form', 'Open it only when you want help'],
  },
]

export const MINISTRIES = [
  'Department of Financial Services',
  'Ministry of Labour and Employment',
  'Department of Revenue',
  'Department of Posts',
  'Department of Telecommunications',
  'Ministry of Home Affairs',
  'Ministry of Housing and Urban Affairs',
  'Department of Personnel and Training',
  'Ministry of Health & Family Welfare',
  'Ministry of External Affairs',
  "Department of Pension & Pensioners' Welfare",
  'Ministry of Railways',
  'Unique Identification Authority of India',
  'Ministry of Power',
  'Department of Administrative Reforms & Public Grievances',
  'Department of Agriculture & Farmers Welfare',
]

export const CATEGORIES = [
  'Water supply / civic amenities',
  'Passport / consular services',
  'Income tax / GST',
  'Pension / retirement benefits',
  'Rail services',
  'Aadhaar services',
  'Banking / insurance',
  'Power supply',
  'Public health services',
  'Telecom services',
  'General public grievance',
  'Labour / employment',
  'Postal services',
  'Home affairs',
  'Farmers welfare / PM-KISAN',
]

export const FALLBACK_NEWS = [
  {
    id: 'n1',
    published_on: '2024-08-23',
    title: 'Comprehensive Guidelines for Handling the Public Grievances',
    href: 'https://pgportal.gov.in',
    size_label: 'PDF - 2.14 MB',
  },
  {
    id: 'n2',
    published_on: '2022-07-27',
    title: 'Strengthening of Machinery for Redressal of Public Grievance (CPGRAMS)',
    href: 'https://pgportal.gov.in',
    size_label: 'PDF - 1.05 MB',
  },
]

export const FAQS = [
  {
    q: 'How do I lodge a public grievance?',
    a: 'Sign in, open Grievance → Lodge Public Grievance, pick a department, describe the problem, review the summary, then copy it onto pgportal.gov.in. Sahayak does not file on the live portal.',
  },
  {
    q: 'Why was my email ignored?',
    a: 'CPGRAMS does not entertain grievances sent by email. Please lodge them on this portal or the official pgportal.gov.in site.',
  },
  {
    q: 'What does Under Process mean?',
    a: 'The grievance has been registered and forwarded to the concerned department. Typical disposal time is shown on the status card using public disposal data.',
  },
  {
    q: 'How do I find my registration number?',
    a: 'It is issued when you confirm a grievance (format PMOPG/… or PENPG/…). You can also look it up after signing in.',
  },
  {
    q: 'Is there a fee?',
    a: 'Government does not charge a fee to lodge a grievance. Money paid at a CSC, if any, goes only to M/s CSC e-Governance Services India Limited.',
  },
  {
    q: 'How do I appeal?',
    a: 'If you are unsatisfied, use View Status → Appeal Status or Nodal Authority for Appeal. You can also paste the department reply into the assistant to draft a sharper appeal.',
  },
]
