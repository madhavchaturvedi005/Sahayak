import type { Grievance } from './api'

type Lang = 'en' | 'hi'

const LABELS: Record<Lang, Record<string, string>> = {
  en: {
    title: 'CPGRAMS — Grievance Acknowledgement',
    subtitle: 'Please keep this acknowledgement for your records.',
    regId: 'Registration ID',
    status: 'Status',
    subject: 'Subject',
    department: 'Ministry / Department',
    category: 'Category',
    filedBy: 'Filed by',
    assigned: 'Assigned to',
    beingAssigned: 'Being assigned',
    expected: 'Expected resolution',
    days: 'days',
    filedOn: 'Filed on',
    place: 'Location',
    details: 'Complaint details',
    evidence: 'Attached photos',
    footer: 'This is a system-generated acknowledgement from CPGRAMS.',
  },
  hi: {
    title: 'CPGRAMS — शिकायत पावती',
    subtitle: 'कृपया यह पावती अपने पास सुरक्षित रखें।',
    regId: 'पंजीकरण संख्या',
    status: 'स्थिति',
    subject: 'विषय',
    department: 'मंत्रालय / विभाग',
    category: 'श्रेणी',
    filedBy: 'शिकायतकर्ता',
    assigned: 'सौंपी गई',
    beingAssigned: 'सौंपी जा रही है',
    expected: 'अनुमानित समाधान',
    days: 'दिन',
    filedOn: 'दर्ज तिथि',
    place: 'स्थान',
    details: 'शिकायत विवरण',
    evidence: 'संलग्न फ़ोटो',
    footer: 'यह CPGRAMS द्वारा स्वतः तैयार की गई पावती है।',
  },
}

function esc(value: unknown): string {
  return String(value ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] || c))
}

// Opens a clean, print-only acknowledgement in a new window — no site chrome,
// nav, or glass backgrounds. Used by both the lodge form and the chat assistant.
export function printGrievance(g: Grievance, lang: Lang = 'en') {
  const L = LABELS[lang] || LABELS.en
  const place = [g.street, g.village, g.ward && `Ward ${g.ward}`, g.district].filter(Boolean).join(', ')
  const assignee = [g.assigned_name, g.assigned_title].filter(Boolean).join(' — ') || L.beingAssigned
  const created = g.created_at ? new Date(g.created_at).toLocaleString() : ''

  const rows: [string, string][] = [
    [L.status, g.status],
    [L.subject, g.subject],
    [L.department, g.ministry],
    [L.category, g.category],
    [L.filedBy, `${g.name}${g.mobile ? ` (${g.mobile})` : ''}`],
    [L.assigned, assignee],
    [L.expected, `${g.expected_days} ${L.days}`],
    [L.place, place],
    [L.filedOn, created],
  ]

  const rowsHtml = rows
    .filter(([, v]) => v)
    .map(
      ([k, v]) =>
        `<tr><th>${esc(k)}</th><td>${esc(v)}</td></tr>`
    )
    .join('')

  const photos = (g.evidence || [])
    .filter((e) => e && e.data_url)
    .map((e) => `<img src="${esc(e.data_url)}" alt="" />`)
    .join('')

  const photosHtml = photos
    ? `<h2>${esc(L.evidence)}</h2><div class="photos">${photos}</div>`
    : ''

  const html = `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(g.registration_id)} — ${esc(L.title)}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; color: #111827; margin: 0; padding: 32px; background: #fff; }
  .sheet { max-width: 720px; margin: 0 auto; }
  .brand { display: flex; align-items: center; gap: 10px; border-bottom: 3px solid #4338ca; padding-bottom: 14px; }
  .brand .badge { width: 40px; height: 40px; border-radius: 10px; background: #4338ca; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 18px; }
  h1 { font-size: 19px; margin: 0; color: #1e1b4b; }
  .subtitle { color: #6b7280; margin: 4px 0 0; font-size: 13px; }
  .regbox { margin: 22px 0; border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px 20px; background: #f5f3ff; text-align: center; }
  .regbox .label { font-size: 11px; letter-spacing: .14em; text-transform: uppercase; color: #6b7280; font-weight: 700; }
  .regbox .value { font-size: 26px; font-weight: 800; color: #4338ca; letter-spacing: .04em; margin-top: 4px; }
  table { width: 100%; border-collapse: collapse; border: 1px solid #e5e7eb; border-radius: 10px; overflow: hidden; }
  th, td { text-align: left; padding: 10px 16px; font-size: 14px; vertical-align: top; border-bottom: 1px solid #f1f1f4; }
  th { width: 42%; color: #4b5563; font-weight: 600; background: #fafafa; white-space: nowrap; }
  td { color: #111827; }
  tr:last-child th, tr:last-child td { border-bottom: 0; }
  h2 { font-size: 14px; margin: 24px 0 8px; color: #1e1b4b; }
  .details { white-space: pre-wrap; line-height: 1.6; background: #fafafa; border: 1px solid #eef0f4; padding: 14px 16px; border-radius: 10px; font-size: 14px; }
  .photos { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
  .photos img { width: 100%; height: 130px; object-fit: cover; border-radius: 10px; border: 1px solid #e5e7eb; }
  .foot { margin-top: 28px; padding-top: 14px; border-top: 1px solid #e5e7eb; color: #9ca3af; font-size: 12px; text-align: center; }
  @media print { body { padding: 0; } .sheet { max-width: 100%; } }
</style>
</head>
<body>
  <div class="sheet">
    <div class="brand">
      <div class="badge">C</div>
      <div>
        <h1>${esc(L.title)}</h1>
        <p class="subtitle">${esc(L.subtitle)}</p>
      </div>
    </div>
    <div class="regbox">
      <div class="label">${esc(L.regId)}</div>
      <div class="value">${esc(g.registration_id)}</div>
    </div>
    <table>${rowsHtml}</table>
    <h2>${esc(L.details)}</h2>
    <div class="details">${esc(g.description || g.subject)}</div>
    ${photosHtml}
    <p class="foot">${esc(L.footer)}</p>
  </div>
  <script>window.addEventListener('load', function () { setTimeout(function () { window.focus(); window.print(); }, 300); });</script>
</body>
</html>`

  const win = window.open('', '_blank', 'width=760,height=900')
  if (!win) return
  win.document.open()
  win.document.write(html)
  win.document.close()
}
