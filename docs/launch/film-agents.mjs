// Films the agents column as a burst of 2x screenshots. Playwright's own
// recorder films at CSS size, and 264px of column blown up on a page is mush.
//
//   OUT=./frames node film-agents.mjs      (then ffmpeg, see README)
// A static import cannot take a variable, and this file has to run from a
// repo with no node_modules: PLAYWRIGHT points at an installed copy.
const { chromium } = await import(process.env.PLAYWRIGHT || 'playwright');
const OUT = (process.env.OUT || '.');
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2, colorScheme: 'light' });
await p.addInitScript(() => { localStorage.setItem('cp.mode','light'); localStorage.setItem('shadok.tourSeen','1'); });
await p.goto((process.env.MIRROR_URL || 'http://localhost:3899'), { waitUntil: 'networkidle' });
await p.waitForTimeout(2500);
await p.locator('.rail-name', { hasText: /^Tech$/ }).click();
await p.waitForTimeout(1500);
const box = await (await p.$('#tabbar')).boundingBox();
const clip = { x: box.x + 6, y: box.y + 4, width: box.width - 12, height: 250 };
// 2x screenshots beat Playwright's own recorder here: it films at CSS size, and
// 264px of column blown up on a page is mush.
for (let i = 0; i < 72; i++) {
  await p.screenshot({ path: `${OUT}/f${String(i).padStart(3, '0')}.png`, clip });
  await p.waitForTimeout(110);
}
console.log('frames taken');
await b.close();
