// Films the agents column of the mirror, in real time.
//
//   OUT=./frames node film-agents.mjs       → frames + frames.ffconcat
//   (then ffmpeg, see README)
//
// Two failed approaches are worth naming, because both LOOK fine until you
// watch the result:
//
//   - Playwright's own recorder films at CSS size. 264px of column blown up on
//     a page is mush.
//   - A loop of page.screenshot() seems to film at the interval you ask for. It
//     does not: each shot costs 150-400ms on top of the wait, the frames land
//     at an irregular 2-3 per second, and encoding them at a flat 9fps plays
//     the cockpit back at three times life speed AND judders, because the real
//     gaps between frames were never equal.
//
// So: CDP screencast. Frames arrive as the page paints them, at the device
// scale factor (2x here), each stamped with the time it was painted. Those
// stamps become the durations in an ffconcat file, which is what makes the clip
// run at the speed the cockpit actually runs at.
const { chromium } = await import(process.env.PLAYWRIGHT || 'playwright');
import fs from 'node:fs';
import path from 'node:path';

const OUT = process.env.OUT || '.';
const URL = process.env.MIRROR_URL || 'http://localhost:3899';
const GROUP = process.env.GROUP || 'Tech';
const SECONDS = Number(process.env.SECONDS || 10);
const SCALE = 2;

fs.mkdirSync(OUT, { recursive: true });
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 940 }, deviceScaleFactor: SCALE, colorScheme: 'light' });
await p.addInitScript(() => {
  localStorage.setItem('cp.mode', 'light');
  localStorage.setItem('shadok.tourSeen', '1');
});
await p.goto(URL, { waitUntil: 'networkidle' });
await p.waitForTimeout(2500);
await p.locator('.rail-name', { hasText: new RegExp(`^${GROUP}$`) }).click();
await p.waitForTimeout(1500);

const box = await (await p.$('#tabbar')).boundingBox();
const crop = {
  x: Math.round((box.x + 6) * SCALE), y: Math.round((box.y + 4) * SCALE),
  w: Math.round((box.width - 12) * SCALE), h: Math.round(250 * SCALE),
};

const frames = [];
const client = await p.context().newCDPSession(p);
client.on('Page.screencastFrame', async (f) => {
  frames.push({ t: f.metadata.timestamp, data: f.data });
  await client.send('Page.screencastFrameAck', { sessionId: f.sessionId }).catch(() => {});
});
await client.send('Page.startScreencast', { format: 'png', everyNthFrame: 1 });

// What the rows were actually doing: a film of two idle agents looks exactly
// like a film of a working one until you read the classes.
const seen = new Map();
const until = Date.now() + SECONDS * 1000;
while (Date.now() < until) {
  for (const c of await p.$$eval('#tabbar .tab', (l) => l.map((e) => e.className)))
    seen.set(c, (seen.get(c) || 0) + 1);
  await p.waitForTimeout(400);
}
await client.send('Page.stopScreencast');
await b.close();

if (!frames.length) { console.error('no frames captured'); process.exit(1); }
const t0 = frames[0].t;
let lines = ['ffconcat version 1.0'];
frames.forEach((f, i) => {
  const name = `f${String(i).padStart(4, '0')}.png`;
  fs.writeFileSync(path.join(OUT, name), Buffer.from(f.data, 'base64'));
  const next = frames[i + 1] ? frames[i + 1].t : f.t + 0.1;
  lines.push(`file ${name}`, `duration ${(next - f.t).toFixed(3)}`);
});
lines.push(`file f${String(frames.length - 1).padStart(4, '0')}.png`);  // ffconcat drops the last frame without this
fs.writeFileSync(path.join(OUT, 'frames.ffconcat'), lines.join('\n') + '\n');

const span = frames[frames.length - 1].t - t0;
console.log(`${frames.length} frames over ${span.toFixed(1)}s — ${(frames.length / span).toFixed(1)}/s`);
console.log(`crop=${crop.w}:${crop.h}:${crop.x}:${crop.y}`);
for (const [cls, n] of [...seen].sort((a, b) => b[1] - a[1])) console.log(`  ${n}\t${cls}`);
if (![...seen.keys()].some((c) => c.includes('working')))
  console.log('  NOTE: nothing was working while this filmed — the clip shows idle rows.');
