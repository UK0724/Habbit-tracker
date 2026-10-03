// Renders every Pulse brand asset from one mark definition ("rising check":
// a tick whose tail climbs into growth, ending in an amber streak dot).
// Run from the repo root: node mobile/scripts/generate-brand.cjs
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("playwright-core");

const root = path.resolve(__dirname, "../..");
const mobileAssets = path.join(root, "mobile/assets");
const webPublic = path.join(root, "client/public");

// Mark geometry on a 64-unit grid.
const TICK = "14,34 25,45 36,30 42,36 51,19";
const DOT = { cx: 51, cy: 19, r: 4.5 };
const GRADIENT = [
  ["0", "#7c3aed"],
  ["0.55", "#4f46e5"],
  ["1", "#c026d3"]
];

const gradientDefs = (id) =>
  `<defs><linearGradient id="${id}" x1="0" y1="1" x2="1" y2="0">${GRADIENT.map(
    ([offset, color]) => `<stop offset="${offset}" stop-color="${color}"/>`
  ).join("")}</linearGradient></defs>`;

/** The mark scaled to `scale` of a 64 grid and centred. */
const mark = ({ scale, tick = "#ffffff", dot = "#fbbf24" }) => {
  const offset = (64 - 64 * scale) / 2;
  return `<g transform="translate(${offset} ${offset}) scale(${scale})"><polyline points="${TICK}" fill="none" stroke="${tick}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/><circle cx="${DOT.cx}" cy="${DOT.cy}" r="${DOT.r}" fill="${dot}"/></g>`;
};

const svg = (body, id = "g") =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">${gradientDefs(id)}${body}</svg>`;

const variants = {
  // Launcher / Play icon: full bleed (Play and launchers apply their own mask).
  full: svg(`<rect width="64" height="64" fill="url(#g)"/>${mark({ scale: 1 })}`),
  // Adaptive foreground: mark inside the 66% safe zone over the gradient.
  adaptive: svg(`<rect width="64" height="64" fill="url(#g)"/>${mark({ scale: 0.72 })}`),
  // Rounded tile for splash screens, favicons and in-app logos.
  tile: svg(`<rect width="64" height="64" rx="15" fill="url(#g)"/>${mark({ scale: 1 })}`),
  // Themed (monochrome) and notification icons: alpha only, single colour.
  mono: svg(mark({ scale: 0.72, tick: "#ffffff", dot: "#ffffff" })),
  notification: svg(mark({ scale: 0.9, tick: "#ffffff", dot: "#ffffff" }))
};

const outputs = [
  ["full", 1024, path.join(mobileAssets, "icon.png")],
  ["adaptive", 1024, path.join(mobileAssets, "adaptive-icon.png")],
  ["mono", 1024, path.join(mobileAssets, "monochrome-icon.png")],
  ["tile", 1024, path.join(mobileAssets, "splash-icon.png")],
  ["notification", 96, path.join(mobileAssets, "notification-icon.png")],
  ["tile", 48, path.join(mobileAssets, "favicon.png")]
];

(async () => {
  fs.writeFileSync(path.join(mobileAssets, "brand-icon.svg"), variants.tile);
  fs.writeFileSync(path.join(mobileAssets, "brand-adaptive.svg"), variants.adaptive);
  fs.writeFileSync(path.join(webPublic, "icon.svg"), variants.tile);
  // Maskable web icon: full bleed with the mark in the safe zone.
  fs.writeFileSync(path.join(webPublic, "icon-maskable.svg"), variants.adaptive);

  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    for (const [variant, size, file] of outputs) {
      await page.setViewportSize({ width: size, height: size });
      await page.setContent(
        `<html><body style="margin:0;background:transparent">${variants[variant].replace(
          "<svg ",
          `<svg width="${size}" height="${size}" `
        )}</body></html>`
      );
      await page.screenshot({ path: file, omitBackground: true, clip: { x: 0, y: 0, width: size, height: size } });
      console.log(`wrote ${path.relative(root, file)} (${size}px)`);
    }
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
