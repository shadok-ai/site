// Build the Open Graph card: 1200x630 JPEG, the ratio X, LinkedIn and Slack
// actually render (1.91:1).
//
//   node make-og-card.mjs <poster.webp> <out.jpg>
//
// The card is a shared link's entire first impression, and it is seen with no
// page around it. So it says the name, the one-line claim and shows the product
// — a bare screenshot crop would say none of that. It is drawn as HTML and
// screenshotted, so it stays in the page's own palette without a design tool.
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
    background: #08090D; color: #F5F0E6; overflow: hidden; position: relative;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
    display: flex; align-items: center;
  }
  /* The same warm light the page puts behind the screen. */
  .glow {
    position: absolute; right: -6%; top: 50%; width: 900px; height: 900px;
    transform: translateY(-50%); border-radius: 50%; pointer-events: none;
    background: radial-gradient(circle, rgba(245,165,36,.20), transparent 62%);
  }
  .copy { position: relative; width: 620px; padding: 0 0 0 76px; }
  .mark {
    font-size: 27px; font-weight: 700; letter-spacing: -.01em;
    color: #F5A524; margin-bottom: 34px;
  }
  /* Three lines, and the first one must not wrap: the break has to land after
     "Codes." or the headline reads as four unbalanced fragments. */
  h1 {
    font-size: 58px; line-height: 1.08; font-weight: 800; letter-spacing: -.035em;
    white-space: nowrap;
  }
  h1 .dim { color: #656B80; }
  p {
    margin-top: 30px; font-size: 25px; line-height: 1.45; color: #8B93A6;
    max-width: 545px;
  }
  code {
    display: inline-block; margin-top: 34px; font-size: 25px;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace; color: #F5F0E6;
    background: #12141C; border: 1px solid #23273A; border-radius: 9px;
    padding: 11px 20px;
  }
  code b { color: #F5A524; font-weight: 400; }
  /* The screenshot bleeds off the right edge: it reads as a window onto
     something larger, and the crop never has to be complete to be legible. */
  .shot {
    position: absolute; right: -108px; top: 50%; transform: translateY(-50%);
    width: 700px; border-radius: 14px; border: 1px solid #23273A;
    box-shadow: 0 40px 120px rgba(0,0,0,.7), 0 0 90px rgba(245,165,36,.13);
  }
</style>
<div class="glow"></div>
<img class="shot" src="${shot}" alt="">
<div class="copy">
  <div class="mark">shadok-ai</div>
  <h1>Many Claude Codes.<br>One cockpit.<br><span class="dim">And it wrote itself.</span></h1>
  <p>Real Claude Code sessions running side by side, each in its own git worktree.</p>
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
