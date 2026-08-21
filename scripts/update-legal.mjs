/**
 * Pushes real Privacy (POPIA) + Terms content into the live CMS pages via the
 * Payload REST API. Run locally:  node scripts/update-legal.mjs
 * Env overrides: SITE, ADMIN_EMAIL, ADMIN_PASSWORD.
 */
const BASE = process.env.SITE || "https://amico.mondocare.co.za";
const EMAIL = process.env.ADMIN_EMAIL || "admin@amicomotors.co.za";
const PASSWORD = process.env.ADMIN_PASSWORD || "ChangeMe123!";

// --- Lexical editor-state builders (match Payload's richText format) ---
const text = (t) => ({ type: "text", detail: 0, format: 0, mode: "normal", style: "", text: t, version: 1 });
const p = (t) => ({ type: "paragraph", format: "", indent: 0, version: 1, direction: "ltr", textFormat: 0, textStyle: "", children: [text(t)] });
const h = (t, tag = "h2") => ({ type: "heading", tag, format: "", indent: 0, version: 1, direction: "ltr", children: [text(t)] });
const li = (t, i) => ({ type: "listitem", value: i + 1, format: "", indent: 0, version: 1, direction: "ltr", children: [text(t)] });
const ul = (items) => ({ type: "list", listType: "bullet", tag: "ul", start: 1, format: "", indent: 0, version: 1, direction: "ltr", children: items.map(li) });
const state = (blocks) => ({ root: { type: "root", format: "", indent: 0, version: 1, direction: "ltr", children: blocks } });

const privacy = [
  p("Amico Motors (trading as SA Multi Franchise Group) respects your privacy and is committed to protecting your personal information. This policy explains what we collect, why we collect it, how we use and protect it, and the rights you have under the Protection of Personal Information Act, 2013 (POPIA)."),
  h("Who we are"),
  p("Amico Motors is a used vehicle dealership at 505 Swemmer Street, Gezina, Pretoria. For any privacy question, or to exercise your rights, contact us on (012) 335-1640 or amelda@amicomotors.co.za. Amico Motors is the responsible party for the personal information described here."),
  h("Information we collect"),
  p("We collect the information you give us when you enquire about a vehicle, book a test drive, apply for finance, request a trade-in valuation, or contact us. This can include your name, phone number, email address, the vehicle you are interested in, and details of a vehicle you want to trade in. When you apply for vehicle finance we may also collect the information the bank requires, such as your identity number, employment and income details, and supporting documents."),
  p("We may also collect limited technical information when you use our website, such as your browser type and the pages you visit, to keep the site working and to improve it."),
  h("How we use your information"),
  ul([
    "Respond to your enquiries and provide the information or vehicle you asked about.",
    "Arrange and submit vehicle finance applications to banks and registered credit providers on your behalf.",
    "Assess and process trade-in valuations.",
    "Communicate with you about your enquiry, a booking, or a transaction.",
    "Send you marketing about vehicles and offers, where you have agreed to receive it.",
    "Meet our legal, tax and regulatory obligations.",
  ]),
  h("Sharing your information"),
  p("To arrange finance, we share the information you provide with banks and registered credit providers so they can assess your application. We may also share information with service providers who help us run our business, and with authorities where the law requires it. We do not sell your personal information."),
  h("Direct marketing"),
  p("We only send you marketing if you have agreed to receive it. You can opt out at any time by replying to any message, or by contacting us on the details above, and we will stop."),
  h("How we protect your information"),
  p("We take reasonable steps to keep your personal information safe and to prevent unauthorised access, loss or misuse. We keep your information only for as long as we need it for the purposes described here, or for as long as the law requires."),
  h("Your rights under POPIA"),
  ul([
    "Ask what personal information we hold about you and request a copy.",
    "Ask us to correct or update information that is wrong or out of date.",
    "Ask us to delete information we no longer have a reason to keep.",
    "Object to our processing of your information, or withdraw consent you have given.",
    "Lodge a complaint with the Information Regulator of South Africa.",
  ]),
  p("To exercise any of these rights, contact us on (012) 335-1640 or amelda@amicomotors.co.za."),
  h("The Information Regulator"),
  p("If you are not satisfied with how we have handled your information, you may contact the Information Regulator (South Africa) at enquiries@inforegulator.org.za or complaints.IR@inforegulator.org.za."),
  h("Changes to this policy"),
  p("We may update this policy from time to time. The latest version will always be on this page. Last updated August 2026."),
];

const terms = [
  p("These terms apply to your use of the Amico Motors website and to enquiries and dealings with Amico Motors (trading as SA Multi Franchise Group). By using this website you agree to these terms."),
  h("Our vehicle listings"),
  p("We are a used vehicle dealership. We describe every vehicle as accurately as we can, but listings, specifications, prices and availability can change and may contain errors. A listing is an invitation to enquire, not a binding offer. Please confirm the details, condition and price of any vehicle with us before you buy."),
  h("Pricing and availability"),
  p("Prices are shown in South African Rand and may change without notice. A vehicle is only reserved once agreed with us in writing. Additional costs, such as licensing and on-the-road fees, may apply and will be confirmed before any sale."),
  h("Vehicle finance"),
  p("Amico Motors helps you apply for finance through banks and registered credit providers. We are not the credit provider and we do not approve finance. All finance is subject to the bank's approval, terms and interest rate. Any figure from our finance calculator is an estimate for guidance only. It is not a quote or an offer of finance."),
  h("Trade-ins"),
  p("Any trade-in figure we give before we see the vehicle is an estimate. The final value depends on a physical inspection of the vehicle, its condition, mileage and documentation."),
  h("Used vehicles and your consumer rights"),
  p("Our vehicles are pre-owned and are sold based on their condition at the time of sale. We encourage you to inspect a vehicle, and to arrange your own inspection, before you buy. Nothing in these terms takes away any right you have under the Consumer Protection Act."),
  h("Use of this website"),
  p("The content on this website, including text, images and the Amico Motors name and logo, belongs to Amico Motors or its licensors. You may not copy or reuse it without our permission. We work to keep the site accurate and available, but we do not guarantee it will always be error free or uninterrupted."),
  h("Our liability"),
  p("To the extent the law allows, Amico Motors is not liable for any loss arising from your use of this website or from reliance on information on it. This does not limit any liability that cannot be excluded by law."),
  h("Governing law"),
  p("These terms are governed by the laws of South Africa."),
  h("Contact us"),
  p("Amico Motors, 505 Swemmer Street, Gezina, Pretoria. Phone (012) 335-1640. Email amelda@amicomotors.co.za. Last updated August 2026."),
];

async function login() {
  const r = await fetch(`${BASE}/api/users/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok || !d.token) throw new Error(`login failed [${r.status}]: ${JSON.stringify(d).slice(0, 200)}`);
  return d.token;
}

async function updatePage(slug, subheading, blocks, token) {
  const getR = await fetch(`${BASE}/api/pages?where[slug][equals]=${slug}&limit=1&depth=0`, {
    headers: { Authorization: `JWT ${token}` },
  });
  const getD = await getR.json();
  const doc = getD.docs?.[0];
  if (!doc) throw new Error(`page not found: ${slug}`);
  const hero = { heading: doc.hero?.heading ?? undefined, subheading };
  const r = await fetch(`${BASE}/api/pages/${doc.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `JWT ${token}` },
    body: JSON.stringify({ hero, content: state(blocks) }),
  });
  const d = await r.json().catch(() => ({}));
  console.log(`${slug}: [${r.status}] ${d?.doc?.id ? "updated OK" : JSON.stringify(d).slice(0, 200)}`);
}

const token = await login();
console.log("logged in, updating pages...");
await updatePage("privacy", "How Amico Motors collects, uses and protects your personal information under POPIA.", privacy, token);
await updatePage("terms", "The terms that apply when you use this website and deal with Amico Motors.", terms, token);
console.log("done.");
