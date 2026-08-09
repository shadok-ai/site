// Records the launch demo against a shadok-ai instance, driving the cockpit
// through the same actions a user would: read the agent's question, answer it,
// look at the diff. Committed so the GIF can be regenerated when the UI moves —
// an asset nobody can rebuild rots.
//
// It does NOT stage the agents: create them first (see docs/launch/README.md),
// and leave the agent you want filmed with a question pending. Scripting the
// staging too would mean filming whatever an agent happened to do that day.
//
// Never point this at port 3789: that is the live cockpit, and taking it over
// kills sibling agents mid-work. Start a second instance on a free port, from
// its own directory — channels are persisted per launch directory and tmux
// sessions outlive the server, so same-directory means same agents.
//
//   NODE_PATH=$HOME/projects/aibrowser/node_modules \
//     SHADOK_URL=http://localhost:3899 FILMED=3 node docs/launch/capture-demo.mjs
//
// Playwright is deliberately NOT a dependency of this repo: it would cost every
// contributor a browser download for an asset rebuilt a few times a year. It is
// borrowed through NODE_PATH, which ESM ignores — hence createRequire.
import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const URL = process.env.SHADOK_URL ?? "http://localhost:3899";
const OUT = process.env.OUT ?? "docs/launch/raw";
/** Index of the agent tab to film; the others are only ever seen in the sidebar. */
const FILMED = Number(process.env.FILMED ?? 3);
/** Sibling tabs to put to work off-camera, so the LEDs move during the take. */
const BUSY = (process.env.BUSY ?? "1,2").split(",").filter(Boolean).map(Number);

if (URL.includes(":3789")) {
  // The one mistake here that costs somebody else's work rather than the take.
  console.error("refusing to record against 3789 — that is the live cockpit");
  process.exit(1);
}

mkdirSync(OUT, { recursive: true });
const t0 = Date.now();
const mark = (l) =>
  console.log(`t+${String(Math.round((Date.now() - t0) / 1000)).padStart(3)}s  ${l}`);

const browser = await chromium.launch();

// 1280x800 keeps the GIF readable once scaled to the 900px GitHub renders a
// README image at, without the text turning to mush at 256 colours.
const rec = await browser.newContext({
  viewport: { width: 1280, height: 800 },
  deviceScaleFactor: 1,
  recordVideo: { dir: OUT, size: { width: 1280, height: 800 } },
});
const page = await rec.newPage();
await page.goto(URL, { waitUntil: "networkidle" });
await page.waitForTimeout(1000);
await page.locator("#ungrouped > *").nth(FILMED).click();
await page.waitForTimeout(2000);
mark("on the filmed agent");

// A second context drives the siblings, so their work is real and concurrent
// rather than a tab switch in the middle of the take.
const side = await browser.newContext({ viewport: { width: 1100, height: 700 } });
const sp = await side.newPage();
await sp.goto(URL, { waitUntil: "networkidle" });
await sp.waitForTimeout(700);
// The siblings are decoration: their LEDs move in the corner of the frame.
// Never let them kill the take — that is what happened the first time.
for (const i of BUSY) {
  try {
    await sp.locator("#ungrouped > *").nth(i).click();
    await sp.waitForTimeout(1500);
    await sp.click("#promptInput", { timeout: 5000 });
    // Real keystrokes, not fill(): fill sets the value without firing the app's
    // input handler, so #sendBtn stays disabled and nothing is ever sent —
    // silently, which cost a whole staging round.
    await sp
      .locator("#promptInput")
      .pressSequentially("Summarise what this file guarantees, in five bullet points.", { delay: 4 });
    await sp.waitForTimeout(400);
    await sp.click("#sendBtn", { timeout: 8000 });
    await sp.waitForTimeout(800);
  } catch (e) {
    mark(`sibling ${i} not driven (${String(e.message).split("\n")[0].slice(0, 40)}) — take continues`);
  }
}
mark("siblings handled");

await page.waitForTimeout(4500); // let a viewer read the question

// Only *visible* buttons are dialog options: the transcript also holds the
// collapsed "▸ N operations" disclosures, and clicking one of those instead
// wasted a take.
const opts = page.locator("#transcripts button:visible");
const n = await opts.count();
mark(`${n} dialog options visible`);
if (n === 0) mark("NO DIALOG PENDING — the take is unusable, stage one first");
else {
  await opts.nth(0).click();
  mark("answered");
}

await page.waitForTimeout(9000); // a beat of visible work
await page.click("#moreBtn");
await page.waitForTimeout(700);
await page.click("#toggleDiff");
mark("diff panel open");
await page.waitForTimeout(6500);

// Last beat: the engine room. The chat cannot express everything, so a channel
// can show the raw TUI — filming it is the honest answer to "but is that really
// Claude Code?".
await page.click("#moreBtn");
await page.waitForTimeout(600);
await page.click("#toggleDiff"); // close the diff
await page.waitForTimeout(900);
// The filmed agent, not a sibling: a sibling may still be sitting on Claude
// Code's "do you trust this folder?" prompt, and filming a session that never
// started is the worst frame in the take.
await page.click("#chanTerm");
mark("terminal mode");
await page.waitForTimeout(7000);

await rec.close(); // flushes the .webm
await side.close();
await browser.close();
mark(`done — raw video under ${OUT}/`);
