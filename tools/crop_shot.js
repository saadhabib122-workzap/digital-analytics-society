const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const pg = await browser.newPage();
  await pg.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1.5 });
  const filePath = path.resolve('index.html').replace(/\\/g, '/');
  await pg.goto('file:///' + filePath, { waitUntil: 'networkidle0' });
  await pg.evaluate(() => {
    document.querySelectorAll('.reveal').forEach(el => el.classList.add('visible'));
    document.querySelectorAll('[data-count]').forEach(el => {
      const t = parseInt(el.dataset.count), s = el.dataset.suffix || '';
      el.textContent = t >= 1000 ? (t/1000).toFixed(1)+'K'+s : t+s;
    });
  });
  await new Promise(r => setTimeout(r, 400));
  fs.mkdirSync('.tmp', { recursive: true });
  const el = await pg.$('.pub-books');
  if (el) await el.screenshot({ path: '.tmp/pub_books.png' });
  await browser.close();
  console.log('done');
})();
