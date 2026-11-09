#!/usr/bin/env node
// Builds /docs from docs/src/*.md — one static HTML file per page, committed.
//
// Why a generator in a repo that brags about having no build step: the deploy
// still has none (Vercel serves the committed HTML, there is nothing to run),
// but twenty-five pages cannot share a sidebar, a breadcrumb and a prev/next
// strip by hand. Change the nav below, run this once, commit the output.
//
//   node docs/launch/build-docs.mjs
//
// The Markdown subset is deliberately small — headings, paragraphs, lists,
// tables, fenced code, blockquote callouts, and the inline set. It is not a
// Markdown implementation: it is the shape these pages are written in, and a
// construct it does not know is a construct nobody should reach for here.
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..", "..");       // repo root
const SRC = join(ROOT, "docs", "src");
const OUT = join(ROOT, "docs");

// The sidebar, and with it the order of the whole site: the prev/next strip and
// the breadcrumb both read this. A page not listed here is not published.
const NAV = [
  { group: "Start here", pages: [
    "index", "getting-started", "key-concepts", "install", "first-agent", "telegram",
  ]},
  { group: "Core concepts", pages: [
    "agents", "profiles", "worktrees", "secrets", "connected-accounts", "schedules",
    "groups", "accounts", "skills", "quota", "peers", "files",
  ]},
  { group: "Deploy and operate", pages: [
    "docker", "expose", "model-backend", "update",
  ]},
  { group: "Reference", pages: [
    "configuration", "cli", "websocket", "limits",
  ]},
];

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const attr = (s) => esc(s).replace(/"/g, "&quot;");

/* ── inline ────────────────────────────────────────────────────────────────
   Code spans are cut out FIRST and held aside, so a `<div>` or an **inside**
   backticks is never read as markup — that is the one ordering bug every
   hand-rolled renderer ships with. */
function inline(src) {
  const held = [];
  let s = src.replace(/`([^`]+)`/g, (_, code) => {
    held.push(`<code>${esc(code)}</code>`);
    return `\u0000${held.length - 1}\u0000`;
  });
  s = esc(s);
  s = s.replace(/\[\[alpha\]\]/g, '<span class="badge">alpha</span>');
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, text, href) => {
    const ext = /^https?:/.test(href);
    const rel = ext ? ' target="_blank" rel="noopener"' : "";
    return `<a href="${attr(href)}"${rel}>${text}</a>`;
  });
  s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  s = s.replace(/(^|[\s(])\*([^*]+)\*/g, "$1<em>$2</em>");
  s = s.replace(/ -- /g, " — ");
  return s.replace(/\u0000(\d+)\u0000/g, (_, i) => held[Number(i)]);
}

// Ids come from the RAW heading, so the inline markers have to go first or a
// section called "… [[alpha]]" answers to "#…-alpha" and every link to it rots.
const slugify = (s) =>
  s.replace(/\[\[[a-z]+\]\]/g, "").replace(/<[^>]+>/g, "").replace(/&[a-z]+;/g, "").toLowerCase()
   .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/* ── block ─────────────────────────────────────────────────────────────── */
function render(md) {
  const lines = md.split("\n");
  const out = [];
  const toc = [];
  let i = 0;

  const listBlock = (ordered) => {
    // One level of nesting, by two-space indent. Deeper than that and the page
    // wants to be two pages.
    const tag = ordered ? "ol" : "ul";
    out.push(`<${tag}>`);
    let open = false, nested = false;
    const marker = ordered ? /^(\s*)\d+\.\s+(.*)$/ : /^(\s*)[-*]\s+(.*)$/;
    while (i < lines.length) {
      const m = lines[i].match(marker);
      if (!m) {
        // A continuation line keeps the item open: an indented, non-marker line.
        if (open && /^\s{2,}\S/.test(lines[i])) { out.push(" " + inline(lines[i].trim())); i++; continue; }
        break;
      }
      const deep = m[1].length >= 2;
      if (deep && !nested) { out.push(`<${tag}>`); nested = true; }
      else if (!deep && nested) { out.push(`</li></${tag}>`); nested = false; }
      else if (open) out.push("</li>");
      out.push(`<li>${inline(m[2])}`);
      open = true;
      i++;
    }
    if (nested) out.push(`</li></${tag}>`);
    if (open) out.push("</li>");
    out.push(`</${tag}>`);
  };

  while (i < lines.length) {
    const line = lines[i];

    if (!line.trim()) { i++; continue; }

    // fenced code
    if (line.startsWith("```")) {
      const lang = line.slice(3).trim();
      const body = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) body.push(lines[i++]);
      i++;
      out.push(`<pre${lang ? ` class="lang-${attr(lang)}"` : ""}><code>${esc(body.join("\n"))}</code></pre>`);
      continue;
    }

    // headings — h2 and h3 get an id so a section can be linked to
    const h = line.match(/^(#{1,4})\s+(.*)$/);
    if (h) {
      const level = h[1].length;
      const text = inline(h[2]);
      if (level === 1) { out.push(`<h1>${text}</h1>`); i++; continue; }
      const id = slugify(h[2]);
      if (level === 2) toc.push({ id, text });
      out.push(`<h${level} id="${attr(id)}"><a class="anchor" href="#${attr(id)}">${text}</a></h${level}>`);
      i++;
      continue;
    }

    // table
    if (line.startsWith("|") && (lines[i + 1] || "").match(/^\|[\s:|-]+\|$/)) {
      // A cell may contain an escaped pipe (`\|`) — a command list like
      // `/cron on|off|del` is unreadable without one. Hold it aside before the
      // split or the row grows phantom columns.
      const cells = (l) =>
        l.replace(/\\\|/g, "\u0001").replace(/^\||\|$/g, "").split("|")
         .map((c) => c.trim().replace(/\u0001/g, "|"));
      const head = cells(line);
      i += 2;
      const rows = [];
      while (i < lines.length && lines[i].startsWith("|")) rows.push(cells(lines[i++]));
      out.push('<div class="scroll"><table><thead><tr>');
      for (const c of head) out.push(`<th>${inline(c)}</th>`);
      out.push("</tr></thead><tbody>");
      for (const r of rows) {
        out.push("<tr>");
        for (const c of r) out.push(`<td>${inline(c)}</td>`);
        out.push("</tr>");
      }
      out.push("</tbody></table></div>");
      continue;
    }

    // callout
    if (line.startsWith("> ")) {
      const body = [];
      while (i < lines.length && lines[i].startsWith("> ")) body.push(lines[i++].slice(2));
      out.push(`<aside class="note">${inline(body.join(" "))}</aside>`);
      continue;
    }

    if (/^\s*[-*]\s+/.test(line)) { listBlock(false); continue; }
    if (/^\s*\d+\.\s+/.test(line)) { listBlock(true); continue; }

    // paragraph
    const para = [];
    while (i < lines.length && lines[i].trim() && !/^(#{1,4}\s|```|>\s|\s*[-*]\s|\s*\d+\.\s|\|)/.test(lines[i])) {
      para.push(lines[i++].trim());
    }
    out.push(`<p>${inline(para.join(" "))}</p>`);
  }

  return { html: out.join("\n"), toc };
}

/* ── front matter ──────────────────────────────────────────────────────── */
function parse(file) {
  const raw = readFileSync(join(SRC, file), "utf8");
  const m = raw.match(/^---\n([\s\S]*?)\n---\n/);
  const meta = {};
  let body = raw;
  if (m) {
    for (const l of m[1].split("\n")) {
      const kv = l.match(/^([a-z]+):\s*(.*)$/);
      if (kv) meta[kv[1]] = kv[2].trim();
    }
    body = raw.slice(m[0].length);
  }
  return { meta, body };
}

/* ── page shell ────────────────────────────────────────────────────────── */
const MARK = `<svg viewBox="0 0 32 32" aria-hidden="true">
        <g fill="#4b4fc0" stroke="#4b4fc0" stroke-width="1.5" stroke-linecap="round">
          <line x1="13" y1="23" x2="12.6" y2="30.6"/><line x1="11" y1="30.7" x2="14.1" y2="30.7"/>
          <line x1="18.6" y1="23" x2="19" y2="30.6"/><line x1="17.6" y1="30.7" x2="20.7" y2="30.7"/>
          <line x1="21.6" y1="17.2" x2="26" y2="20.4"/>
          <g stroke-width="1"><line x1="13.8" y1="5.4" x2="11.8" y2="2.8"/><circle cx="11.8" cy="2.8" r="1.1" stroke="none"/>
          <line x1="18.2" y1="5.4" x2="20.2" y2="2.8"/><circle cx="20.2" cy="2.8" r="1.1" stroke="none"/></g>
          <circle cx="16" cy="16.2" r="8.4" stroke="none"/>
          <g stroke="none"><circle cx="13.1" cy="7.8" r="2.6" fill="#fff"/><circle cx="18.9" cy="7.8" r="2.6" fill="#fff"/>
          <circle cx="13.4" cy="8.1" r="1.3" fill="#4b4fc0"/><circle cx="19.2" cy="8.1" r="1.3" fill="#4b4fc0"/></g>
        </g>
      </svg>`;

const href = (slug) => (slug === "index" ? "/docs" : `/docs/${slug}`);

function sidebar(current, pages) {
  const out = ['<nav class="side" aria-label="Documentation">'];
  for (const g of NAV) {
    out.push(`<p class="side-group">${esc(g.group)}</p><ul>`);
    for (const slug of g.pages) {
      const p = pages[slug];
      const here = slug === current;
      out.push(
        `<li><a href="${href(slug)}"${here ? ' aria-current="page"' : ""} title="${attr(p.meta.summary || "")}">` +
        `${esc(p.meta.nav || p.meta.title)}${p.meta.alpha === "true" ? '<span class="badge">alpha</span>' : ""}</a></li>`
      );
    }
    out.push("</ul>");
  }
  out.push("</nav>");
  return out.join("\n");
}

function page(slug, pages, flat) {
  const p = pages[slug];
  const pos = flat.indexOf(slug);
  const prev = pos > 0 ? flat[pos - 1] : null;
  const next = pos < flat.length - 1 ? flat[pos + 1] : null;
  const { html } = render(p.body);
  const title = slug === "index"
    ? "shadok-ai documentation"
    : `${p.meta.title} — shadok-ai docs`;
  const canonical = `https://shadok.ai${href(slug)}`;

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${attr(p.meta.summary || "")}">
<link rel="canonical" href="${canonical}">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<meta property="og:type" content="article">
<meta property="og:url" content="${canonical}">
<meta property="og:title" content="${attr(title)}">
<meta property="og:description" content="${attr(p.meta.summary || "")}">
<meta property="og:image" content="https://shadok.ai/og-card.jpg">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="https://shadok.ai/og-card.jpg">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wght@600;700;800&family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600&display=swap">
<link rel="stylesheet" href="/docs/docs.css?v=1">
</head>
<body>

<div class="top">
  <div class="wrap">
    <a class="brand" href="/">
      ${MARK}
      shadok-ai
    </a>
    <nav class="topnav">
      <a class="prod" href="/">The product</a>
      <a class="here" href="/docs">Docs</a>
      <a href="https://github.com/shadok-ai/shadok-ai" target="_blank" rel="noopener">GitHub</a>
    </nav>
  </div>
</div>

<div class="wrap docs">
  <details class="side-sheet">
    <summary>All pages</summary>
    ${sidebar(slug, pages)}
  </details>
  ${sidebar(slug, pages)}

  <article>
    <p class="crumb"><a href="/docs">Docs</a>${slug === "index" ? "" : ` <span>/</span> ${esc(p.meta.group)} <span>/</span> ${esc(p.meta.title)}`}</p>
    ${p.meta.alpha === "true" ? '<p class="alpha-line"><span class="badge">alpha</span> Everything on this page needs the alpha channel — <code>npx shadok-ai@alpha</code>, or the version menu. It is not in the default install yet.</p>' : ""}
${html}
    <nav class="updown">
      ${prev ? `<a class="prev" href="${href(prev)}"><span>Previous</span>${esc(pages[prev].meta.title)}</a>` : "<span></span>"}
      ${next ? `<a class="next" href="${href(next)}"><span>Next</span>${esc(pages[next].meta.title)}</a>` : "<span></span>"}
    </nav>
  </article>
</div>

<footer class="wrap">
  <p><a href="/">shadok-ai</a> — the cockpit for a company that runs on agents.
  <a href="https://github.com/shadok-ai/shadok-ai" target="_blank" rel="noopener">Source</a>,
  AGPL-3.0-only.</p>
  <p>These pages describe the <b>beta</b> channel, which is what <code>npx shadok-ai</code>
  installs. Anything marked <span class="badge">alpha</span> ships on <code>@alpha</code> first.</p>
</footer>

</body>
</html>
`;
}

/* ── run ───────────────────────────────────────────────────────────────── */
const flat = NAV.flatMap((g) => g.pages);
const pages = {};
for (const g of NAV) {
  for (const slug of g.pages) {
    const p = parse(`${slug}.md`);
    p.meta.group = g.group;
    pages[slug] = p;
  }
}

// A source file nobody listed is a page that silently never ships.
const known = new Set(flat.map((s) => `${s}.md`));
for (const f of readdirSync(SRC)) {
  if (f.endsWith(".md") && !known.has(f)) {
    console.error(`! docs/src/${f} is not in NAV — not published`);
    process.exitCode = 1;
  }
}

for (const slug of flat) {
  const file = slug === "index" ? join(OUT, "index.html") : join(OUT, `${slug}.html`);
  writeFileSync(file, page(slug, pages, flat));
  console.log(`  ${file.replace(ROOT + "/", "")}`);
}

/* ── what a crawler is told ────────────────────────────────────────────────
   Both files are written from NAV, for the same reason the sidebar is: a
   sitemap maintained by hand lists the pages that existed the day someone
   remembered it. Written at the repo root, because a sitemap only covers the
   directory it sits in and below — /sitemap.xml may speak for the whole site,
   /docs/sitemap.xml may not.

   No lastmod and no priority on purpose. Google ignores priority and
   changefreq outright, and it only trusts lastmod when a site is consistently
   honest about it — a date stamped at build time would say every page changed
   whenever any page did, which is worse than saying nothing. */
const urls = ["https://shadok.ai/", ...flat.map((s) => "https://shadok.ai" + href(s))];
writeFileSync(
  join(ROOT, "sitemap.xml"),
  '<?xml version="1.0" encoding="UTF-8"?>\n' +
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  urls.map((u) => `  <url><loc>${u}</loc></url>`).join("\n") +
  "\n</urlset>\n"
);

// Everything in this repository is deployed, tooling included, so the two
// directories that are SOURCE rather than page are kept out of the index: the
// Markdown each page is generated from would otherwise compete with the page
// itself, and the launch scripts are not reading material. Disallow is about
// crawling, not secrecy — the repo is public either way.
writeFileSync(
  join(ROOT, "robots.txt"),
  [
    "User-agent: *",
    "Allow: /",
    "Disallow: /docs/src/",
    "Disallow: /docs/launch/",
    "",
    "Sitemap: https://shadok.ai/sitemap.xml",
    "",
  ].join("\n")
);

console.log(`  sitemap.xml (${urls.length} urls)`);
console.log("  robots.txt");
console.log(`${flat.length} pages`);
