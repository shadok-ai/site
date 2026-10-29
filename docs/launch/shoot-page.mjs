// Renders shadok.ai itself: first screen, full page, phone. Serve the repo
// first (python3 -m http.server 8099) and set SITE_URL to point elsewhere.
//
//   OUT=./shots node shoot-page.mjs
// A static import cannot take a variable, and this file has to run from a
// repo with no node_modules: PLAYWRIGHT points at an installed copy.
const { chromium } = await import(process.env.PLAYWRIGHT || 'playwright');
const OUT = (process.env.OUT || '.');
const b = await chromium.launch();
const page = await b.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
const errs = [];
page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
page.on('requestfailed', (r) => errs.push('failed: ' + r.url()));
await page.goto((process.env.SITE_URL || 'http://localhost:8099/'), { waitUntil: 'networkidle' });
await page.waitForTimeout(1200);
await page.screenshot({ path: `${OUT}/page-top.png` });
await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
await page.waitForTimeout(1500);
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(800);
await page.screenshot({ path: `${OUT}/page-full.png`, fullPage: true });
const m = await page.newPage ? null : null;
const phone = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
await phone.goto((process.env.SITE_URL || 'http://localhost:8099/'), { waitUntil: 'networkidle' });
await phone.waitForTimeout(1200);
await phone.screenshot({ path: `${OUT}/page-phone.png` });
console.log('errors:', JSON.stringify(errs.slice(0, 5)));
const h = await page.evaluate(() => document.body.scrollHeight);
console.log('page height:', h);
await b.close();
