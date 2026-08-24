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

export const ABOUT_CPGRAMS_HI =
  'केंद्रीकृत लोक शिकायत निवारण और निगरानी प्रणाली (सीपीग्राम्स) नागरिकों के लिए चौबीसों घंटे उपलब्ध ऑनलाइन मंच है, जहाँ सेवा वितरण से जुड़े किसी भी विषय पर लोक प्राधिकारियों के समक्ष शिकायत दर्ज की जा सकती है। यह एक पोर्टल भारत सरकार और राज्यों के सभी मंत्रालयों/विभागों से जुड़ा है। प्रत्येक मंत्रालय और राज्य की भूमिका के अनुसार पहुँच है। सीपीग्राम्स गूगल प्ले स्टोर के ऐप और उमंग से भी उपलब्ध है।'

export const EXCLUSIONS_HI = [
  'आरटीआई संबंधी मामले',
  'न्यायालय / विचाराधीन मामले',
  'धार्मिक मामले',
  'सरकारी कर्मचारियों की सेवा संबंधी शिकायतें, अनुशासनिक कार्यवाही सहित (डीओपीटी कार्यालय ज्ञापन संख्या 11013/08/2013-Estt.(A)-III दिनांक 31.08.2015 के अंतर्गत आने वाले मामलों को छोड़कर)',
]

export const NOTE_DPG_HI =
  'यदि आप अपनी शिकायत के निवारण से संतुष्ट नहीं हैं, तो इसे लोक शिकायत निदेशालय (डीपीजी), मंत्रिमंडल सचिवालय के पास ले जा सकते हैं।'

export const NOTE_CSC_HI =
  'इस पोर्टल पर शिकायत दर्ज करने के लिए सरकार जनता से कोई शुल्क नहीं लेती। यदि कोई राशि दी गई है तो वह केवल मेसर्स सीएससी ई-गवर्नेंस सर्विसेज इंडिया लिमिटेड को जाती है।'

export const EMAIL_DISCLAIMER_HI =
  'ईमेल से भेजी गई किसी भी शिकायत पर कार्रवाई नहीं होगी। कृपया अपनी शिकायत इसी पोर्टल पर दर्ज करें।'

export const NIC_CREDIT_HI =
  'यह साइट राष्ट्रीय सूचना विज्ञान केंद्र, इलेक्ट्रॉनिकी और सूचना प्रौद्योगिकी मंत्रालय, भारत सरकार द्वारा डिज़ाइन, विकसित और होस्ट की गई है। सामग्री प्रशासनिक सुधार और लोक शिकायत विभाग की है।'

export const SLIDES = [
  {
    title: 'Lodge a grievance by voice',
    titleHi: 'अब शिकायत सिर्फ आवाज़ से दर्ज करें',
    body: 'Sahayak listens in your own language, then helps you describe the problem before you lodge it here.',
    bodyHi: 'सहायिका आपकी भाषा सुनती है, समस्या समझने में मदद करती है, फिर शिकायत यहीं दर्ज होती है।',
    tag: 'Voice',
    tagHi: 'आवाज़',
    image: '/banners/01-voice.png',
    href: '/desk/lodge',
    action: 'Start lodging',
    actionHi: 'दर्ज करना शुरू करें',
    points: ['Speak in Hindi, English, or mixed', 'Sahayak drafts the subject and department', 'You review before anything is saved'],
    pointsHi: ['हिन्दी, अंग्रेज़ी या मिला-जुला बोलें', 'सहायिका विषय और विभाग लिखती है', 'सेव से पहले आप जाँचते हैं'],
  },
  {
    title: 'One portal. Every department.',
    titleHi: 'एक पोर्टल, सभी विभाग',
    body: 'CPGRAMS connects you to Ministries and Departments of the Government of India and the States.',
    bodyHi: 'सीपीग्राम्स आपको भारत सरकार और राज्यों के मंत्रालयों व विभागों से जोड़ता है।',
    tag: '24×7 portal',
    tagHi: '24×7 पोर्टल',
    image: '/banners/02-portal.png',
    href: '/desk/lodge',
    action: 'Choose a department',
    actionHi: 'विभाग चुनें',
    points: ['Central and state departments on one desk', 'Routing reason is shown, not hidden', 'You can override the suggested ministry'],
    pointsHi: ['केंद्र और राज्य के विभाग एक डेस्क पर', 'भेजने का कारण छिपा नहीं रहता', 'सुझाया मंत्रालय बदल सकते हैं'],
  },
  {
    title: 'Track, remind, and appeal',
    titleHi: 'स्थिति देखें, अनुस्मारक भेजें, अपील करें',
    body: 'View status, send a reminder, rate a reply, or escalate to the nodal authority — the same paths as today, calmer to use.',
    bodyHi: 'स्थिति देखें, अनुस्मारक भेजें, जवाब का मूल्यांकन करें, या नोडल प्राधिकारी तक ले जाएँ।',
    tag: 'Follow up',
    tagHi: 'आगे बढ़ाएँ',
    image: '/banners/03-track.png',
    href: '/status',
    action: 'Track a grievance',
    actionHi: 'शिकायत ट्रैक करें',
    points: ['Use your registration number', 'Send a reminder if the file is silent', '1 or 2 stars opens the appeal path'],
    pointsHi: ['अपनी पंजीकरण संख्या इस्तेमाल करें', 'फाइल चुप हो तो अनुस्मारक भेजें', '1 या 2 स्टार से अपील खुलती है'],
  },
  {
    title: 'Honest timelines, not silence',
    titleHi: 'वास्तविक समयसीमा',
    body: 'Sahayak shows typical disposal time and pendency for the department you are about to file with.',
    bodyHi: 'जिस विभाग में दर्ज करने जा रहे हैं, उसका सामान्य निपटान समय और लंबित प्रतिशत दिखता है।',
    tag: 'Expectation setting',
    tagHi: 'समय की जानकारी',
    image: '/banners/04-timelines.png',
    href: '/desk',
    action: 'See typical times',
    actionHi: 'सामान्य समय देखें',
    points: ['Typical days before you file', 'Share of cases pending beyond 21 days', 'No fake “resolved in 48 hours” promise'],
    pointsHi: ['दर्ज करने से पहले सामान्य दिन', '21 दिनों से आगे लंबित हिस्सेदारी', 'झूठा “48 घंटे में हल” नहीं'],
  },
  {
    title: 'Lodge on this portal',
    titleHi: 'इसी पोर्टल पर दर्ज करें',
    body: 'Fill the form and submit it here. A registration number is issued at once for tracking.',
    bodyHi: 'फॉर्म भरें और यहीं जमा करें। ट्रैकिंग के लिए पंजीकरण संख्या तुरंत मिलती है।',
    tag: 'Lodge',
    tagHi: 'दर्ज करें',
    image: '/banners/05-handoff.png',
    href: '/desk/lodge',
    action: 'Lodge a grievance',
    actionHi: 'शिकायत दर्ज करें',
    points: ['Submit on this CPGRAMS portal', 'Note your registration number', 'Track, remind, and appeal from your desk'],
    pointsHi: ['इसी सीपीग्राम्स पोर्टल पर जमा करें', 'पंजीकरण संख्या संभालें', 'डेस्क से ट्रैक, अनुस्मारक और अपील'],
  },
  {
    title: 'Was the reply a real resolution?',
    titleHi: 'क्या जवाब वास्तव में समाधान था?',
    body: 'Paste a closure reply. Sahayak checks whether it addressed your complaint, and drafts an appeal if it did not.',
    bodyHi: 'बंद करने का जवाब चिपकाएँ। सहायिका देखती है कि शिकायत हल हुई या नहीं, नहीं हुई तो अपील का मसौदा देती है।',
    tag: 'Resolution check',
    tagHi: 'समाधान जाँच',
    image: '/banners/06-resolution.png',
    href: '/help#resolution',
    action: 'Check a reply',
    actionHi: 'जवाब जाँचें',
    points: ['Compare the complaint to the speaking order', 'See what is still missing', 'Walk away with an appeal draft'],
    pointsHi: ['शिकायत और बोलते आदेश की तुलना', 'जो अभी भी छूटा है वह देखें', 'अपील मसौदा साथ लेकर जाएँ'],
  },
  {
    title: 'Multilingual by design',
    titleHi: 'बहुभाषी सहायता',
    body: 'Describe the problem in Hindi, English, or a regional language. The form stays in plain language.',
    bodyHi: 'समस्या हिन्दी, अंग्रेज़ी या क्षेत्रीय भाषा में बताएँ। फॉर्म सरल भाषा में रहता है।',
    tag: 'Language',
    tagHi: 'भाषा',
    image: '/banners/07-language.png',
    href: '/desk/lodge',
    action: 'Describe the problem',
    actionHi: 'समस्या बताएँ',
    points: ['Hindi, English, or Hinglish is fine', 'Voice and text use the same live chat', 'Official labels stay in plain words'],
    pointsHi: ['हिन्दी, अंग्रेज़ी या हिंग्लिश ठीक है', 'आवाज़ और लेख एक ही लाइव चैट में', 'आधिकारिक लेबल सादे शब्दों में'],
  },
  {
    title: 'Optional AI. Full manual path.',
    titleHi: 'एआई वैकल्पिक है',
    body: 'The assistant sits in the corner. Every official function still works if you never open it.',
    bodyHi: 'सहायिका कोने में बैठती है। बिना उसे खोले भी हर आधिकारिक काम चलता है।',
    tag: 'Your choice',
    tagHi: 'आपकी पसंद',
    image: '/banners/08-optional.png',
    href: '/desk/lodge',
    action: 'Use the manual path',
    actionHi: 'खुद फॉर्म भरें',
    points: ['Lodge, track, remind, rate — no AI required', 'The avatar never blocks a form', 'Open it only when you want help'],
    pointsHi: ['दर्ज, ट्रैक, अनुस्मारक, मूल्यांकन — एआई जरूरी नहीं', 'अवतार फॉर्म नहीं रोकता', 'मदद चाहिए तभी खोलें'],
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
  'Ministry of Electronics and Information Technology',
  'Ministry of Road Transport and Highways',
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
  'Cyber / digital fraud',
  'Road / transport',
  'Sanitation / waste',
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
    qHi: 'सार्वजनिक शिकायत कैसे दर्ज करूँ?',
    a: 'Sign in, open Grievance → Lodge Public Grievance, describe the problem, review the details, and submit. A registration number is issued on this portal.',
    aHi: 'साइन इन करें, शिकायत → सार्वजनिक शिकायत दर्ज करें खोलें, समस्या लिखें, विवरण जाँचें और जमा करें। पंजीकरण संख्या इसी पोर्टल पर जारी होती है।',
  },
  {
    q: 'Why was my email ignored?',
    qHi: 'मेरा ईमेल क्यों नहीं देखा गया?',
    a: 'CPGRAMS does not entertain grievances sent by email. Please lodge them on this portal.',
    aHi: 'सीपीग्राम्स ईमेल से आई शिकायतों पर कार्रवाई नहीं करता। कृपया उन्हें इसी पोर्टल पर दर्ज करें।',
  },
  {
    q: 'What does Under Process mean?',
    qHi: 'प्रक्रियाधीन का क्या अर्थ है?',
    a: 'The grievance has been registered and forwarded to the concerned department. Typical disposal time is shown on the status card using public disposal data.',
    aHi: 'शिकायत पंजीकृत होकर संबंधित विभाग को भेज दी गई है। स्थिति कार्ड पर सामान्य निपटान समय सार्वजनिक आँकड़ों से दिखता है।',
  },
  {
    q: 'How do I find my registration number?',
    qHi: 'अपनी पंजीकरण संख्या कैसे देखूँ?',
    a: 'It is issued when you confirm a grievance (format PMOPG/… or PENPG/…). You can also look it up after signing in.',
    aHi: 'शिकायत पुष्टि होते ही जारी होती है (रूप PMOPG/… या PENPG/…)। साइन इन के बाद भी देख सकते हैं।',
  },
  {
    q: 'Is there a fee?',
    qHi: 'क्या कोई शुल्क है?',
    a: 'Government does not charge a fee to lodge a grievance. Money paid at a CSC, if any, goes only to M/s CSC e-Governance Services India Limited.',
    aHi: 'शिकायत दर्ज करने के लिए सरकार शुल्क नहीं लेती। सीएससी पर दी गई राशि, यदि कोई हो, केवल मेसर्स सीएससी ई-गवर्नेंस सर्विसेज इंडिया लिमिटेड को जाती है।',
  },
  {
    q: 'How do I appeal?',
    qHi: 'अपील कैसे करूँ?',
    a: 'If you are unsatisfied, use View Status → Appeal Status or Nodal Authority for Appeal. You can also paste the department reply into the assistant to draft a sharper appeal.',
    aHi: 'यदि संतुष्ट नहीं हैं तो स्थिति देखें → अपील स्थिति या अपील हेतु नोडल प्राधिकारी इस्तेमाल करें। विभागीय जवाब सहायिका में चिपकाकर तेज़ अपील मसौदा भी बन सकता है।',
  },
]
