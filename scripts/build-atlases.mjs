#!/usr/bin/env node
// Regenerates src/assets/atlases/*.png (PNG-8, NES palette only) + manifest.json from the art/ sources.
//   node scripts/build-atlases.mjs            → write atlases
//   node scripts/build-atlases.mjs --preview  → also write 4× upscaled previews to atlas-preview/
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { pack, encodePNG8, Pix } from '../art/lib.mjs';
import * as core from '../art/core.mjs';
import * as biomes from '../art/biomes.mjs';

const OUT = fileURLToPath(new URL('../src/assets/atlases/', import.meta.url));
const PREVIEW = fileURLToPath(new URL('../atlas-preview/', import.meta.url));
const preview = process.argv.includes('--preview');

const sources = {
  core: core.build(),
  title: biomes.title(),
  forest: biomes.forest(),
  mountain: biomes.mountain(),
  castle: biomes.castle(),
  boss: biomes.boss(),
};

mkdirSync(OUT, { recursive: true });
if (preview) mkdirSync(PREVIEW, { recursive: true });

const manifest = {};
for (const [name, sprites] of Object.entries(sources)) {
  const { pix, frames } = pack(sprites);
  const png = encodePNG8(pix);
  writeFileSync(`${OUT}${name}.png`, png);
  manifest[name] = { w: pix.w, h: pix.h, frames };
  console.log(`${name.padEnd(9)} ${pix.w}×${pix.h}  ${Object.keys(frames).length} frames  ${png.length} B`);
  if (preview) {
    const s = 4;
    const big = new Pix(pix.w * s, pix.h * s);
    for (let y = 0; y < big.h; y++) for (let x = 0; x < big.w; x++) big.data[y * big.w + x] = pix.data[Math.floor(y / s) * pix.w + Math.floor(x / s)];
    for (let i = 0; i < big.data.length; i++) if (big.data[i] === -1) big.data[i] = ((i % big.w >> 3) + (Math.floor(i / big.w) >> 3)) % 2 ? 0x10 : 0x20;
    writeFileSync(`${PREVIEW}${name}.png`, encodePNG8(big));
  }
}
writeFileSync(`${OUT}manifest.json`, JSON.stringify(manifest, null, 1) + '\n');
