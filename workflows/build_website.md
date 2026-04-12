# Workflow: Build & Polish Website

## Objective
Build, review, and polish a frontend HTML page to a production-ready standard.

## Required Inputs
- Brand guidelines (colors, fonts, logo)
- Community/organisation context
- Any existing assets in `brand_assests/`

## Tools Used
- `tools/screenshot.js` — single-page screenshot
- `tools/review_screenshot.js` — multi-section review screenshots

## Process

### Step 1 — Build
Write `index.html` with full HTML/CSS/JS. Follow brand guidelines exactly:
- Colors, fonts, and logo from brand assets
- Sections: Hero, About, Pillars/Features, Stats, Publishing, Membership, CTA, Footer

### Step 2 — Pass 1 Screenshot (Review)
Run the review tool to capture every major section at full resolution:
```
node tools/review_screenshot.js
```
Screenshots are saved to `.tmp/section_<id>.png` and `.tmp/full_review.png`.

Read each screenshot and log issues by section:
- Contrast problems (text invisible on background)
- Spacing/padding too tight or too loose
- Elements clipping or overflowing
- Counters/animations that need JS fixes

### Step 3 — Polish
Fix every logged issue directly in `index.html`. Common fixes:
- `color` values that blend into background (e.g. `#E8E8E8` on `#F7F7F5`)
- Low-opacity text on dark backgrounds
- `scroll-margin-top: 68px` on all sections for fixed-nav anchor accuracy
- Padding/gap increases for breathing room

### Step 4 — Pass 2 Screenshot (Verify)
Re-run the review tool on the same sections. Confirm each issue is resolved.
```
node tools/review_screenshot.js
```
Only mark complete when all sections pass visual inspection.

## Edge Cases
- **Canvas/animation not in screenshot**: Expected. The static screenshot won't show JS animations — verify those manually in browser.
- **Reveal animations hiding content**: The review tool forces `.reveal.visible` and populates `[data-count]` before screenshotting — so off-screen content will still appear.
- **Google Fonts not loading in file:// context**: If fonts fall back to system fonts in screenshots, test by running a local server instead.

## Expected Output
- `index.html` — production-ready, visually polished
- `.tmp/full_review.png` — final full-page screenshot for records
- `.tmp/section_*.png` — per-section screenshots from pass 2
