// Build the Open Graph card: 1200x630 JPEG, the ratio X, LinkedIn and Slack
// actually render (1.91:1).
//
//   node make-og-card.mjs <poster.webp> <out.jpg>
//
// The card is a shared link's entire first impression, and it is seen with no
// page around it. So it says the name, the one-line claim and shows the product
// — a bare screenshot crop would say none of that. It is drawn as HTML and
// screenshotted, so it stays in the page's own palette without a design tool.
//
// LIGHT, since the page became light: a dark card opening onto a white page
// reads as the wrong link.
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";

const require = createRequire(import.meta.url);
let chromium;
try {
  ({ chromium } = require("playwright"));
} catch {
  // Not a dependency of this repo — the page has no build step and no
  // node_modules. Borrow a Playwright that is already installed.
  const borrowed = process.env.PLAYWRIGHT_FROM ||
    `${process.env.HOME}/projects/aibrowser/`;
  ({ chromium } = createRequire(borrowed)("playwright"));
}

const poster = path.resolve(process.argv[2] || "demo-poster.webp");
const out = path.resolve(process.argv[3] || "og-card.jpg");
const shot = `data:image/webp;base64,${fs.readFileSync(poster).toString("base64")}`;

const html = `<!doctype html><meta charset="utf-8"><style>
  * { box-sizing: border-box; margin: 0; }
  html, body { width: 1200px; height: 630px; }
  body {
    background: #ffffff; color: #11131a; overflow: hidden; position: relative;
    font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
    display: flex; align-items: center;
  }
  /* The page's own accent, barely there — enough to stop the card reading as a
     screenshot someone pasted on white. */
  .glow {
    position: absolute; right: -8%; top: 50%; width: 980px; height: 980px;
    transform: translateY(-50%); border-radius: 50%; pointer-events: none;
    background: radial-gradient(circle, rgba(91,95,199,.16), transparent 62%);
  }
  .copy { position: relative; width: 600px; padding: 0 0 0 72px; }
  .mark { display: flex; align-items: center; gap: 12px; margin-bottom: 36px; }
  .mark svg { width: 34px; height: 34px; }
  .mark span { font-size: 27px; font-weight: 700; letter-spacing: -.01em; }
  /* Two lines, and the break has to land after "work." — the claim is the
     contrast between the two halves. */
  h1 {
    /* 54px, not more: at 62 the first line ran under the screenshot, and a
       headline sitting on a picture reads as a rendering bug. */
    font-size: 54px; line-height: 1.07; font-weight: 800; letter-spacing: -.038em;
    white-space: nowrap;
  }
  h1 .dim { color: #6b7180; }
  p { margin-top: 26px; font-size: 24px; line-height: 1.45; color: #454a57; max-width: 560px; }
  code {
    display: inline-block; margin-top: 32px; font-size: 25px;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace; color: #11131a;
    background: #f6f7f9; border: 1px solid #e3e6ec; border-radius: 9px;
    padding: 11px 20px;
  }
  code b { color: #6b7180; font-weight: 400; }
  /* The screenshot bleeds off the right edge: it reads as a window onto
     something larger, and the crop never has to be complete to be legible. */
  .shot {
    position: absolute; right: -120px; top: 50%; transform: translateY(-50%);
    width: 660px; border-radius: 14px; border: 1px solid #e3e6ec;
    box-shadow: 0 30px 90px rgba(17,19,26,.18);
  }
</style>
<div class="glow"></div>
<img class="shot" src="${shot}" alt="">
<div class="copy">
  <div class="mark">
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <g fill="#5b5fc7" stroke="#5b5fc7" stroke-width="1.5" stroke-linecap="round">
        <line x1="13" y1="23" x2="12.6" y2="30.6"/><line x1="11" y1="30.7" x2="14.1" y2="30.7"/>
        <line x1="18.6" y1="23" x2="19" y2="30.6"/><line x1="17.6" y1="30.7" x2="20.7" y2="30.7"/>
        <line x1="21.6" y1="17.2" x2="26" y2="20.4"/>
        <g stroke-width="1"><line x1="13.8" y1="5.4" x2="11.8" y2="2.8"/><circle cx="11.8" cy="2.8" r="1.1" stroke="none"/>
        <line x1="18.2" y1="5.4" x2="20.2" y2="2.8"/><circle cx="20.2" cy="2.8" r="1.1" stroke="none"/></g>
        <circle cx="16" cy="16.2" r="8.4" stroke="none"/>
        <g stroke="none"><circle cx="13.1" cy="7.8" r="2.6" fill="#fff"/><circle cx="18.9" cy="7.8" r="2.6" fill="#fff"/>
        <circle cx="13.4" cy="8.1" r="1.3" fill="#5b5fc7"/><circle cx="19.2" cy="8.1" r="1.3" fill="#5b5fc7"/></g>
      </g>
    </svg>
    <span>shadok-ai</span>
  </div>
  <h1>Your agents do the work.<br><span class="dim">You keep the controls.</span></h1>
  <p>Every Claude Code session your company runs, behind one page.</p>
  <code><b>$</b> npx shadok-ai</code>
</div>`;

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1200, height: 630 },
  deviceScaleFactor: 1,
});
await page.setContent(html, { waitUntil: "load" });
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: out, type: "jpeg", quality: 90 });
await browser.close();

const size = fs.statSync(out).size;
console.log(`${path.basename(out)} — ${(size / 1024).toFixed(1)} KB, 1200x630`);
// X caps card images at 5 MB and LinkedIn at the same; anything near that is a
// mistake, not a limit to ride.
if (size > 1_000_000) {
  console.error("og card is over 1 MB — lower the quality or the shot width");
  process.exit(1);
}
