// Generates PWA icons, favicons and the social preview from the uploaded brand SVGs.
// Run with: npm run icons
import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const brand = path.join(root, "public/brand");
const out = path.join(root, "public/icons");
await mkdir(out, { recursive: true });

const icon = await readFile(path.join(brand, "campus-path-icon.svg"));
const lightLogo = await readFile(path.join(brand, "campus-path-logo-light.svg"));
const NAVY = { r: 11, g: 31, b: 58, alpha: 1 };

async function plain(size, name) {
  await sharp(icon, { density: 384 }).resize(size, size).png().toFile(path.join(out, name));
}

async function fullBleed(size, name) {
  const art = Math.round(size * 0.8);
  const offset = Math.round((size - art) / 2);
  await sharp({ create: { width: size, height: size, channels: 4, background: NAVY } })
    .composite([
      {
        input: await sharp(icon, { density: 384 }).resize(art, art).toBuffer(),
        left: offset,
        top: offset,
      },
    ])
    .png()
    .toFile(path.join(out, name));
}

await plain(192, "icon-192.png");
await plain(512, "icon-512.png");
await fullBleed(192, "icon-maskable-192.png");
await fullBleed(512, "icon-maskable-512.png");
await fullBleed(180, "apple-touch-icon.png");
await plain(32, "favicon-32.png");
await plain(16, "favicon-16.png");

// Social preview: navy background, white rounded card, light-background logo on top.
const card = Buffer.from(
  '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630"><rect x="200" y="150" width="800" height="330" rx="36" fill="#FFFFFF"/></svg>',
);
const logo = await sharp(lightLogo, { density: 384 }).resize(700).toBuffer();
await sharp({ create: { width: 1200, height: 630, channels: 4, background: NAVY } })
  .composite([
    { input: card, left: 0, top: 0 },
    { input: logo, left: 250, top: 223 },
  ])
  .png()
  .toFile(path.join(root, "public/og-image.png"));

console.log("Wrote public/icons/* and public/og-image.png");
