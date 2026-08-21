/**
 * Publishes a REAL welcome blog post and removes the placeholder team members,
 * via the Payload REST API. Run locally:  node scripts/update-content.mjs
 * Env overrides: SITE, ADMIN_EMAIL, ADMIN_PASSWORD.
 */
const BASE = process.env.SITE || "https://amico.mondocare.co.za";
const EMAIL = process.env.ADMIN_EMAIL || "admin@amicomotors.co.za";
const PASSWORD = process.env.ADMIN_PASSWORD || "ChangeMe123!";

const text = (t) => ({ type: "text", detail: 0, format: 0, mode: "normal", style: "", text: t, version: 1 });
const pr = (t) => ({ type: "paragraph", format: "", indent: 0, version: 1, direction: "ltr", textFormat: 0, textStyle: "", children: [text(t)] });
const hd = (t, tag = "h2") => ({ type: "heading", tag, format: "", indent: 0, version: 1, direction: "ltr", children: [text(t)] });
const state = (blocks) => ({ root: { type: "root", format: "", indent: 0, version: 1, direction: "ltr", children: blocks } });

const welcome = [
  pr("Welcome, and thank you for stopping by. We are excited to launch our new website, built to make finding your next car simple, quick and honest, the same way we like to do business in person."),
  pr("Amico Motors has been helping people across Pretoria drive away in quality used vehicles, backed by friendly advice and easy bank finance. Our new site brings all of that online, so you can browse, compare and enquire whenever it suits you, day or night."),
  hd("Browse our full stock online"),
  pr("Every vehicle on our floor is now on the website, with photos, prices and the key details. You can filter by make, model, price and body type to quickly find the cars that fit what you are looking for and your budget."),
  hd("Work out your monthly repayment"),
  pr("Found something you like? Use our finance calculator to get an instant estimate of what your monthly instalment could look like. It is a guide to help you plan. We work with most major banks and will help you apply for finance that suits you."),
  hd("Trade in your current car"),
  pr("Thinking of trading in? Tell us about your current vehicle and we will help you put its value towards your next one, so you can upgrade with less out of pocket."),
  hd("Enquire in a few clicks"),
  pr("When you are ready, send an enquiry, book a test drive, or message us on WhatsApp straight from any vehicle page. We will get back to you quickly, with no pressure and no pushy sales talk."),
  hd("Come and see us"),
  pr("You are always welcome to visit us at 505 Swemmer Street, Gezina, Pretoria, or call us on (012) 335-1640. Whether you are buying your first car or your next one, we would love to help you find the right one, not just any car."),
  pr("Take a look around, and welcome to Amico Motors."),
];

async function api(path, opts = {}) {
  const r = await fetch(`${BASE}${path}`, opts);
  const d = await r.json().catch(() => ({}));
  return { status: r.status, ok: r.ok, d };
}

const { d: loginD, ok } = await api("/api/users/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
});
if (!ok || !loginD.token) throw new Error("login failed: " + JSON.stringify(loginD).slice(0, 200));
const auth = { Authorization: `JWT ${loginD.token}` };
console.log("logged in.");

// --- Welcome post: update the existing (placeholder) post in place ---
const { d: posts } = await api("/api/posts?limit=50&depth=0", { headers: auth });
const target =
  posts.docs?.find((p) => /welcome/i.test(p.title) || /placeholder/i.test(p.title)) || posts.docs?.[0];
if (!target) {
  console.log("no post found to update; skipping post.");
} else {
  const res = await api(`/api/posts/${target.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...auth },
    body: JSON.stringify({
      title: "Welcome to the new Amico Motors website",
      slug: "welcome-to-the-new-amico-motors-website",
      excerpt:
        "We have launched a brand new website to make finding your next quality used car in Pretoria easier than ever. Here is what you can do on it.",
      author: "Amico Motors",
      publishedDate: "2026-08-21T08:00:00.000Z",
      _status: "published",
      content: state(welcome),
    }),
  });
  console.log(`welcome post: [${res.status}] ${res.d?.doc?.id ? "published OK" : JSON.stringify(res.d).slice(0, 200)}`);
}

// --- Remove placeholder team members (no fabricated people on the site) ---
const { d: team } = await api("/api/team?limit=100&depth=0", { headers: auth });
let removed = 0;
for (const m of team.docs ?? []) {
  const res = await api(`/api/team/${m.id}`, { method: "DELETE", headers: auth });
  if (res.ok) removed++;
  console.log(`team delete "${m.name}": [${res.status}]`);
}
console.log(`removed ${removed} placeholder team member(s).`);
console.log("done.");
