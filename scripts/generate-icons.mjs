import sharp from "sharp";
import { mkdir, writeFile } from "fs/promises";
import { join } from "path";

const ICONS_DIR = join(process.cwd(), "public", "icons");
const BG = "#0f172a";
const ACCENT = "#22d3ee";
const WHITE = "#ffffff";

async function createIcon(size, maskable = false) {
  const padding = maskable ? size * 0.1 : 0;
  const innerSize = size - padding * 2;
  const svg = maskable
    ? `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="${BG}"/>
  <circle cx="${size/2}" cy="${size/2}" r="${innerSize/2 - padding}" fill="${ACCENT}"/>
  <text x="${size/2}" y="${size/2}" font-family="Arial" font-size="${size*0.4}" font-weight="bold" fill="${WHITE}" text-anchor="middle" dominant-baseline="central">Q</text>
</svg>`
    : `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="${BG}"/>
  <circle cx="${size/2}" cy="${size/2}" r="${innerSize/2 - padding}" fill="none" stroke="${ACCENT}" stroke-width="${Math.max(4, size*0.02)}"/>
  <text x="${size/2}" y="${size/2}" font-family="Arial" font-size="${size*0.36}" font-weight="bold" fill="${WHITE}" text-anchor="middle" dominant-baseline="central">Q</text>
</svg>`;

  return sharp(Buffer.from(svg))
    .png()
    .toBuffer();
}

async function main() {
  await mkdir(ICONS_DIR, { recursive: true });

  const icons = [
    { name: "icon-192.png", size: 192, maskable: false },
    { name: "icon-512.png", size: 512, maskable: false },
    { name: "icon-512-maskable.png", size: 512, maskable: true },
    { name: "apple-touch-icon.png", size: 180, maskable: false },
  ];

  for (const { name, size, maskable } of icons) {
    const buffer = await createIcon(size, maskable);
    await writeFile(join(ICONS_DIR, name), buffer);
    console.log(`Created ${name}`);
  }
}

main().catch(console.error);
