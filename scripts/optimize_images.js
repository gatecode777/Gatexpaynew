// Re-encodes referenced raster assets in place (same path, smaller bytes). Run: node scripts/optimize_images.js <file...>
const sharp = require("sharp");
const fs = require("fs");
const MAX_W = 1600; // next/image deviceSizes tops out at 1440
(async () => {
  let before = 0, after = 0;
  for (const f of process.argv.slice(2)) {
    const buf = fs.readFileSync(f);
    const img = sharp(buf).rotate().resize({ width: MAX_W, withoutEnlargement: true });
    const ext = f.toLowerCase().split(".").pop();
    const out = ext === "png"
      ? await img.png({ palette: true, quality: 85, effort: 8, compressionLevel: 9 }).toBuffer()
      : await img.jpeg({ quality: 80, mozjpeg: true }).toBuffer();
    before += buf.length;
    if (out.length < buf.length) { fs.writeFileSync(f, out); after += out.length; } else after += buf.length;
  }
  console.log(`before ${(before/1e6).toFixed(1)}MB after ${(after/1e6).toFixed(1)}MB`);
})();
