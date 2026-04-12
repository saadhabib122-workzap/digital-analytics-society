/**
 * review_screenshot.js — Takes full-page screenshots of all site pages for design review
 * Usage: node tools/review_screenshot.js
 */
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const pages = [
  { name: 'index', file: 'index.html' },
  { name: 'about', file: 'about.html' },
  { name: 'events', file: 'events.html' },
  { name: 'community', file: 'community.html' },
  { name: 'publishing', file: 'publishing.html' },
  { name: 'membership', file: 'membership.html' },
];

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  fs.mkdirSync('.tmp', { recursive: true });

  for (const pageInfo of pages) {
    const pg = await browser.newPage();
    await pg.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });

    const filePath = path.resolve(pageInfo.file).replace(/\\/g, '/');
    await pg.goto('file:///' + filePath, { waitUntil: 'networkidle0' });

    // Force all reveals visible and counters populated
    await pg.evaluate(() => {
      document.querySelectorAll('.reveal').forEach(el => el.classList.add('visible'));
      document.querySelectorAll('[data-count]').forEach(el => {
        const t = parseInt(el.dataset.count);
        const s = el.dataset.suffix || '';
        el.textContent = t >= 1000 ? (t / 1000).toFixed(1) + 'K' + s : t + s;
      });
    });

    await new Promise(r => setTimeout(r, 500));

    const outPath = `.tmp/page_${pageInfo.name}.png`;
    await pg.screenshot({ path: outPath, fullPage: true });
    console.log(`captured: ${outPath}`);
    await pg.close();
  }

  await browser.close();
  console.log('All page screenshots saved to .tmp/');
})();
