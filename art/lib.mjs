// Tiny pixel-art toolkit used by scripts/build-atlases.mjs (Node only, never shipped to the browser).
// Pixels store NES palette indices (0x00–0x3F); -1 = transparent.
import { deflateSync } from 'node:zlib';
import { NES_PALETTE } from '../src/game/palette.js';

export const T = -1;

export class Pix {
  constructor(w, h) {
    this.w = w;
    this.h = h;
    this.data = new Int16Array(w * h).fill(T);
  }

  /** Build from ASCII rows. `legend` maps characters → NES index; '.' and ' ' are transparent. Rows are right-padded. */
  static rows(rows, legend) {
    const w = Math.max(...rows.map((r) => r.length));
    const p = new Pix(w, rows.length);
    rows.forEach((row, y) => {
      for (let x = 0; x < row.length; x++) {
        const ch = row[x];
        if (ch === '.' || ch === ' ') continue;
        if (!(ch in legend)) throw new Error(`Unknown legend char "${ch}" in row ${y}: ${row}`);
        p.set(x, y, legend[ch]);
      }
    });
    return p;
  }

  /** Rows describing the left half; the right half is the mirror image. */
  static mirrored(halfRows, legend) {
    return Pix.rows(halfRows.map((r) => r + [...r].reverse().join('')), legend);
  }

  get(x, y) {
    return x < 0 || y < 0 || x >= this.w || y >= this.h ? T : this.data[y * this.w + x];
  }

  set(x, y, c) {
    if (x >= 0 && y >= 0 && x < this.w && y < this.h) this.data[y * this.w + x] = c;
    return this;
  }

  rect(x, y, w, h, c) {
    for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) this.set(i, j, c);
    return this;
  }

  ellipse(cx, cy, rx, ry, c) {
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++)
      for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
        const dx = (x + 0.5 - cx) / rx;
        const dy = (y + 0.5 - cy) / ry;
        if (dx * dx + dy * dy <= 1) this.set(x, y, c);
      }
    return this;
  }

  /** Copy opaque pixels of `src` onto this, optionally recolouring via {fromIndex: toIndex}. */
  blit(src, dx, dy, recolor = null) {
    for (let y = 0; y < src.h; y++)
      for (let x = 0; x < src.w; x++) {
        let c = src.data[y * src.w + x];
        if (c === T) continue;
        if (recolor && c in recolor) c = recolor[c];
        this.set(dx + x, dy + y, c);
      }
    return this;
  }

  /** Paint `c` on every transparent pixel that touches an opaque one (4-neighbourhood). */
  outline(c) {
    const src = this.clone();
    for (let y = 0; y < this.h; y++)
      for (let x = 0; x < this.w; x++)
        if (src.get(x, y) === T && [src.get(x - 1, y), src.get(x + 1, y), src.get(x, y - 1), src.get(x, y + 1)].some((n) => n !== T))
          this.set(x, y, c);
    return this;
  }

  recolor(map) {
    for (let i = 0; i < this.data.length; i++) if (this.data[i] in map) this.data[i] = map[this.data[i]];
    return this;
  }

  clone() {
    const p = new Pix(this.w, this.h);
    p.data.set(this.data);
    return p;
  }

  flipX() {
    const p = new Pix(this.w, this.h);
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) p.set(this.w - 1 - x, y, this.get(x, y));
    return p;
  }

  /** Walk-cycle helper: shift every row except the last `keep` rows down by one pixel (body bob). */
  bob(keep = 2) {
    const p = new Pix(this.w, this.h);
    for (let y = 0; y < this.h - keep; y++) for (let x = 0; x < this.w; x++) p.set(x, y + 1, this.get(x, y));
    for (let y = this.h - keep; y < this.h; y++) for (let x = 0; x < this.w; x++) p.set(x, y, this.get(x, y));
    return p;
  }
}

/** Deterministic PRNG so regenerated atlases are byte-identical. */
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A 4×4 solid block; sampled at its centre for sky bands and flashes. */
export const swatch = (c) => new Pix(4, 4).rect(0, 0, 4, 4, c);

/** Shelf-pack sprites into one atlas. Returns { pix, frames: {name: [x, y, w, h]} }. */
export function pack(sprites, width = 256, pad = 1) {
  const entries = Object.entries(sprites).sort((a, b) => b[1].h - a[1].h || b[1].w - a[1].w);
  const frames = {};
  let x = pad, y = pad, shelf = 0;
  for (const [name, s] of entries) {
    if (s.w + pad * 2 > width) throw new Error(`${name} is wider than the atlas`);
    if (x + s.w + pad > width) {
      x = pad;
      y += shelf + pad;
      shelf = 0;
    }
    frames[name] = [x, y, s.w, s.h];
    x += s.w + pad;
    shelf = Math.max(shelf, s.h);
  }
  const pix = new Pix(width, y + shelf + pad);
  for (const [name, [fx, fy]] of Object.entries(frames)) pix.blit(sprites[name], fx, fy);
  return { pix, frames };
}

// ---------------------------------------------------------------- PNG-8 (indexed colour) encoder
const CRC_TABLE = new Uint32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = (buf) => {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
const chunk = (type, data) => {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, 'ascii');
  data.copy(out, 8);
  out.writeUInt32BE(crc32(out.subarray(4, 8 + data.length)), 8 + data.length);
  return out;
};

/** Encode as an indexed PNG whose PLTE holds only the NES colours actually used (slot 0 = transparent). */
export function encodePNG8(pix) {
  const used = [...new Set(pix.data)].filter((c) => c !== T).sort((a, b) => a - b);
  if (used.length > 255) throw new Error('Too many colours for PNG-8');
  const slot = new Map(used.map((c, i) => [c, i + 1]));
  const plte = Buffer.alloc((used.length + 1) * 3);
  used.forEach((c, i) => {
    const hex = NES_PALETTE[c];
    if (!hex) throw new Error(`Not an NES palette index: ${c}`);
    plte.writeUIntBE(parseInt(hex.slice(1), 16), (i + 1) * 3, 3);
  });
  const raw = Buffer.alloc((pix.w + 1) * pix.h);
  for (let y = 0; y < pix.h; y++) {
    raw[y * (pix.w + 1)] = 0; // filter: none
    for (let x = 0; x < pix.w; x++) {
      const c = pix.data[y * pix.w + x];
      raw[y * (pix.w + 1) + 1 + x] = c === T ? 0 : slot.get(c);
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(pix.w, 0);
  ihdr.writeUInt32BE(pix.h, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 3; // colour type: indexed
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('PLTE', plte),
    chunk('tRNS', Buffer.from([0])),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}
