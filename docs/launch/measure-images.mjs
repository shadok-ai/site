// Every picture's drawn ratio over its natural ratio, at phone and desktop
// width. Anything but 1.00 is a stretched screenshot — which happens the
// moment a CSS width meets an untouched height ATTRIBUTE.
//
//   node measure-images.mjs
// A static import cannot take a variable, and this file has to run from a
// repo with no node_modules: PLAYWRIGHT points at an installed copy.
const { chromium } = await import(process.env.PLAYWRIGHT || 'playwright');
const b = await chromium.launch();
for (const vp of [{ width: 390, height: 844 }, { width: 1440, height: 900 }]) {
  const p = await b.newPage({ viewport: vp, deviceScaleFactor: 1 });
  await p.goto((process.env.SITE_URL || 'http://localhost:8099/'), { waitUntil: 'networkidle' });
  await p.waitForTimeout(1200);
  const rows = await p.evaluate(() => [...document.images].filter((i) => i.naturalWidth)
    .map((i) => ({ src: i.currentSrc.split('/').pop(),
      skew: +((i.clientWidth / i.clientHeight) / (i.naturalWidth / i.naturalHeight)).toFixed(3),
      box: Math.round(i.clientWidth) + 'x' + Math.round(i.clientHeight) })));
  console.log('—', vp.width + 'px:', rows.filter((r) => Math.abs(r.skew - 1) > 0.02).map((r) => r.src + ' ' + r.skew).join(', ') || 'every picture at its own ratio');
  await p.close();
}
await b.close();
