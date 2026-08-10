// Check the share card against a SERVED page, not the source.
//
//   node docs/launch/check-meta.mjs https://shadok-ai.vercel.app/
//
// A relative og:image looks fine in an editor and shows a grey rectangle in
// Slack; an absolute one that points at a host nobody deployed to looks fine
// too. The only way to know is to fetch the page and then fetch what it claims.
const base = process.argv[2];
if (!base) {
  console.error("usage: check-meta.mjs <url of the deployed page>");
  process.exit(2);
}

const fails = [];
const notes = [];
const fail = (m) => fails.push(m);
const ok = (m) => notes.push(m);

const page = await fetch(base, { redirect: "follow" });
if (!page.ok) {
  console.error(`${base} → HTTP ${page.status}. Nothing is deployed there.`);
  process.exit(1);
}
const html = await page.text();

const meta = (attr, name) => {
  const re = new RegExp(`<meta[^>]*${attr}=["']${name}["'][^>]*>`, "i");
  const tag = html.match(re);
  if (!tag) return null;
  const v = tag[0].match(/content=["']([^"']*)["']/i);
  return v ? v[1] : null;
};

const REQUIRED = [
  ["property", "og:type"],
  ["property", "og:url"],
  ["property", "og:title"],
  ["property", "og:description"],
  ["property", "og:image"],
  ["property", "og:image:alt"],
  ["name", "twitter:card"],
  ["name", "twitter:title"],
  ["name", "twitter:description"],
  ["name", "twitter:image"],
];
const got = {};
for (const [attr, name] of REQUIRED) {
  const v = meta(attr, name);
  got[name] = v;
  if (!v) fail(`missing <meta ${attr}="${name}">`);
}

if (got["twitter:card"] && got["twitter:card"] !== "summary_large_image") {
  fail(`twitter:card is "${got["twitter:card"]}", expected summary_large_image`);
}
if (got["og:title"] && got["og:title"].length < 12) {
  fail(`og:title is too thin to be a headline: "${got["og:title"]}"`);
}

// Run against a local server and the absolute URLs point at production, which
// may not exist yet. Everything except "the production host answers" can still
// be checked, by fetching the same path from the server in front of us.
const local = /^(127\.0\.0\.1|localhost|\[::1\])$/.test(new URL(base).hostname);
if (local) notes.push("dry run against a local server — production host not checked");
const reachable = (u) => (local ? new URL(new URL(u).pathname, base).href : u);

// The card image: absolute, reachable, an image, and small enough that X
// (5 MB) and LinkedIn (same) will take it.
for (const key of ["og:image", "twitter:image"]) {
  const url = got[key];
  if (!url) continue;
  if (!/^https?:\/\//i.test(url)) {
    fail(`${key} is relative ("${url}") — many crawlers will not resolve it`);
    continue;
  }
  const r = await fetch(reachable(url), { redirect: "follow" });
  if (!r.ok) { fail(`${key} → HTTP ${r.status} at ${url}`); continue; }
  const type = r.headers.get("content-type") || "";
  const size = Number(r.headers.get("content-length") || (await r.arrayBuffer()).byteLength);
  if (!/^image\//.test(type)) fail(`${key} is served as ${type}, not an image`);
  if (/gif/.test(type)) fail(`${key} is a GIF — X renders card images as stills`);
  if (size > 1_000_000) fail(`${key} is ${(size / 1024 / 1024).toFixed(2)} MB — keep it under 1 MB`);
  else ok(`${key} → ${(size / 1024).toFixed(1)} KB ${type}`);
}

const canonical = (html.match(/<link[^>]*rel=["']canonical["'][^>]*>/i) || [""])[0]
  .match(/href=["']([^"']*)["']/i);
if (!canonical) fail("no <link rel=canonical>");
else if (got["og:url"] && canonical[1].replace(/\/$/, "") !== got["og:url"].replace(/\/$/, "")) {
  fail(`canonical (${canonical[1]}) and og:url (${got["og:url"]}) disagree`);
}

// An og:url pointing at a different host than the page being checked is the
// symptom of a deploy that landed on an alias nobody updated the tags for.
if (!local && got["og:url"] && new URL(got["og:url"]).host !== new URL(base).host) {
  fail(`og:url host (${new URL(got["og:url"]).host}) is not the host serving this page (${new URL(base).host})`);
}

for (const n of notes) console.log(`  ok    ${n}`);
for (const f of fails) console.log(`  FAIL  ${f}`);
console.log(fails.length ? `\n${fails.length} problem(s) with the share card.` : "\nShare card is sound.");
process.exit(fails.length ? 1 : 0);
