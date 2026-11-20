import { PNG } from "pngjs";
import { mkdirSync, writeFileSync } from "node:fs";

/** Generates the PWA icons locally with no external image tooling. */
function makeIcon(size) {
  const png = new PNG({ width: size, height: size });
  const cx = size / 2;
  const cy = size / 2;
  const radius = size * 0.22;
  const corner = size * 0.22;

  const inRoundedRect = (x, y) => {
    const dx = Math.max(corner - x, 0, x - (size - corner));
    const dy = Math.max(corner - y, 0, y - (size - corner));
    return dx * dx + dy * dy <= corner * corner;
  };

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (size * y + x) * 4;
      if (!inRoundedRect(x, y)) {
        png.data[i + 3] = 0;
        continue;
      }
      // Blue background with a subtle vertical gradient.
      png.data[i] = 30 + (y / size) * 18;
      png.data[i + 1] = 58 + (y / size) * 16;
      png.data[i + 2] = 138 + (y / size) * 12;
      png.data[i + 3] = 255;

      // White map pin: circle + tapered tip.
      const pinCy = cy - size * 0.06;
      const inCircle = (x - cx) ** 2 + (y - pinCy) ** 2 <= radius * radius;
      const tipY = cy + size * 0.28;
      const inTip =
        y >= pinCy &&
        y <= tipY &&
        Math.abs(x - cx) <= radius * (1 - (y - pinCy) / (tipY - pinCy)) + size * 0.01;
      if (inCircle || inTip) {
        png.data[i] = 255;
        png.data[i + 1] = 255;
        png.data[i + 2] = 255;
      }
      // Inner hole makes it read as a location pin.
      if ((x - cx) ** 2 + (y - pinCy) ** 2 <= (radius * 0.38) ** 2) {
        png.data[i] = 16;
        png.data[i + 1] = 185;
        png.data[i + 2] = 129;
      }
    }
  }
  return PNG.sync.write(png);
}

mkdirSync("public", { recursive: true });
for (const size of [192, 512]) {
  writeFileSync(`public/icon-${size}.png`, makeIcon(size));
  console.log(`public/icon-${size}.png`);
}
