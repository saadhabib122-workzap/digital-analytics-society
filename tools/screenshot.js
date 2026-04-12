/**
 * screenshot.js — Takes a screenshot of a URL or local HTML file using Puppeteer
 *
 * Usage:
 *   node tools/screenshot.js <url_or_path> [output_path]
 *
 * Examples:
 *   node tools/screenshot.js https://example.com
 *   node tools/screenshot.js ./index.html .tmp/preview.png
 */

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

async function takeScreenshot(target, outputPath) {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  // Support local file paths
  const url = target.startsWith('http') ? target : `file:///${path.resolve(target).replace(/\\/g, '/')}`;
  await page.goto(url, { waitUntil: 'networkidle2' });

  const out = outputPath || path.join('.tmp', `screenshot-${Date.now()}.png`);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  await page.screenshot({ path: out, fullPage: true });
  await browser.close();

  console.log(`Screenshot saved to: ${out}`);
  return out;
}

const [,, target, output] = process.argv;
if (!target) {
  console.error('Usage: node tools/screenshot.js <url_or_path> [output_path]');
  process.exit(1);
}

takeScreenshot(target, output).catch(err => {
  console.error(err);
  process.exit(1);
});
