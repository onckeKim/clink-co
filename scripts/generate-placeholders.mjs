import { mkdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "public", "images");
const CATEGORY_DIR = join(ROOT, "categories");
const PRODUCT_DIR = join(ROOT, "products");
mkdirSync(CATEGORY_DIR, { recursive: true });
mkdirSync(PRODUCT_DIR, { recursive: true });

const palette = {
  ivory: "#faf7f1",
  linen: "#f3ede2",
  sand: "#e8dfcd",
  stone: "#c9bfa9",
  taupe: "#a9917a",
  clay: "#7a6a56",
  ink: "#17150f",
};

const gradients = [
  [palette.linen, palette.sand],
  [palette.sand, palette.stone],
  [palette.stone, palette.taupe],
  [palette.ivory, palette.stone],
  [palette.taupe, palette.clay],
];

function hashSeed(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}

// A simple, elegant vessel silhouette drawn with paths — reused across
// placeholders, tinted to sit quietly in the background.
function vesselGlyph(cx, cy, scale, opacity) {
  return `
  <g transform="translate(${cx} ${cy}) scale(${scale})" fill="none" stroke="${palette.ink}" stroke-width="2.2" opacity="${opacity}" stroke-linecap="round" stroke-linejoin="round">
    <path d="M -34 -70 L -22 40 C -22 58 22 58 22 40 L 34 -70 Z" />
    <path d="M -34 -70 L 34 -70" />
    <path d="M -28 -50 L 28 -50" />
  </g>`;
}

function wordWrap(text, maxChars) {
  const words = text.split(" ");
  const lines = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxChars && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function categorySvg({ name, width = 900, height = 1100 }) {
  const seed = hashSeed(name);
  const [from, to] = gradients[seed % gradients.length];
  const gradId = `g-${seed}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="${gradId}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${from}" />
      <stop offset="100%" stop-color="${to}" />
    </linearGradient>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#${gradId})" />
  ${vesselGlyph(width / 2, height / 2 - 40, 2.3, 0.16)}
</svg>`;
}

function productSvg({ name, width = 1000, height = 1200, variant = 0 }) {
  const seed = hashSeed(name + variant);
  const [from, to] = gradients[(seed + variant) % gradients.length];
  const gradId = `g-${seed}-${variant}`;
  const lines = wordWrap(name, 16);
  const lineHeight = 34;
  const startY = height - 120 - (lines.length - 1) * lineHeight;
  const textEls = lines
    .map(
      (line, i) =>
        `<text x="${width / 2}" y="${startY + i * lineHeight}" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="30" fill="${palette.ink}" fill-opacity="0.55" letter-spacing="0.5">${escapeXml(line)}</text>`,
    )
    .join("\n  ");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="${gradId}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${from}" />
      <stop offset="100%" stop-color="${to}" />
    </linearGradient>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#${gradId})" />
  ${vesselGlyph(width / 2, height / 2 - 60, 2.8, 0.2)}
  ${textEls}
</svg>`;
}

function escapeXml(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

const categories = [
  "Glassware",
  "Barware",
  "Tableware",
  "Serving",
  "Gift Sets",
  "Entertaining Accents",
];

const categorySlugs = {
  Glassware: "glassware",
  Barware: "barware",
  Tableware: "tableware",
  Serving: "serving",
  "Gift Sets": "gift-sets",
  "Entertaining Accents": "accents",
};

for (const name of categories) {
  const svg = categorySvg({ name });
  writeFileSync(join(CATEGORY_DIR, `${categorySlugs[name]}.svg`), svg, "utf8");
}

const products = [
  "solstice-coupe-glasses",
  "harbor-rocks-glasses",
  "meridian-cocktail-shaker",
  "aldine-decanter",
  "wilder-linen-napkins",
  "hearth-dinner-plates",
  "the-nightcap-gift-set",
  "ember-taper-candles",
  "stonewell-marble-coasters",
  "tidewater-ice-bucket",
  "lowland-wine-glasses",
  "almanac-brass-jigger",
  "gathering-serving-tray",
  "toast-champagne-flutes",
];

const productNames = {
  "solstice-coupe-glasses": "Solstice Coupe Glasses",
  "harbor-rocks-glasses": "Harbor Rocks Glasses",
  "meridian-cocktail-shaker": "Meridian Cocktail Shaker",
  "aldine-decanter": "Aldine Decanter",
  "wilder-linen-napkins": "Wilder Linen Napkins",
  "hearth-dinner-plates": "Hearth Dinner Plates",
  "the-nightcap-gift-set": "The Nightcap Gift Set",
  "ember-taper-candles": "Ember Taper Candles",
  "stonewell-marble-coasters": "Stonewell Marble Coasters",
  "tidewater-ice-bucket": "Tidewater Ice Bucket",
  "lowland-wine-glasses": "Lowland Wine Glasses",
  "almanac-brass-jigger": "Almanac Brass Jigger",
  "gathering-serving-tray": "Gathering Serving Tray",
  "toast-champagne-flutes": "Toast Champagne Flutes",
};

for (const slug of products) {
  const name = productNames[slug];
  for (const variant of [1, 2]) {
    const svg = productSvg({ name, variant });
    writeFileSync(join(PRODUCT_DIR, `${slug}-${variant}.svg`), svg, "utf8");
  }
}

// Hero + lifestyle editorial images
const editorial = [
  { file: "hero-table", label: "The Autumn Edit" },
  { file: "lifestyle-glass", label: "Entertaining, Well" },
  { file: "lifestyle-gift", label: "Gifting" },
];

for (const { file, label } of editorial) {
  const svg = productSvg({ name: label, width: 1800, height: 1100, variant: 9 });
  writeFileSync(join(ROOT, `${file}.svg`), svg, "utf8");
}

console.log("Placeholder SVGs generated.");
