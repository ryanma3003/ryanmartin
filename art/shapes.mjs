// Procedural building blocks shared by the biome atlases.
import { Pix, T, rng } from './lib.mjs';

const K = 0x0f;

/** 16×16 ground tile: `top` rows of surface colour over a speckled fill. */
export function groundTile({ top, topHi, fill, speck, topRows = 4, seed = 1 }) {
  const r = rng(seed);
  const p = new Pix(16, 16).rect(0, 0, 16, 16, fill);
  for (let i = 0; i < 14; i++) p.set(Math.floor(r() * 16), topRows + 1 + Math.floor(r() * (15 - topRows)), speck);
  if (top != null) {
    p.rect(0, 0, 16, topRows, top);
    for (let x = 0; x < 16; x++) if (r() < 0.45) p.set(x, topRows, top); // ragged edge
    if (topHi != null) for (let x = 0; x < 16; x += 3) p.set(x + Math.floor(r() * 2), 0, topHi);
  }
  return p;
}

/** Brick tile (w×h) with offset rows. */
export function brickTile(w, h, brick, mortar, hi, rowH = 8) {
  const p = new Pix(w, h).rect(0, 0, w, h, brick);
  for (let y = 0; y < h; y += rowH) {
    p.rect(0, y + rowH - 1, w, 1, mortar);
    const off = (y / rowH) % 2 ? w / 4 : 0;
    for (let x = off; x < w + off; x += w / 2) {
      p.rect(x % w, y, 1, rowH - 1, mortar);
      if (hi != null) p.rect((x + 1) % w, y, w / 2 - 2, 1, hi);
    }
  }
  return p;
}

/** Tileable strip of rounded hills. */
export function hills(w, h, fill, line, hi, seed = 3) {
  const r = rng(seed);
  const p = new Pix(w, h);
  const humps = 3;
  for (let i = 0; i < humps; i++) {
    const cx = (i + 0.5) * (w / humps) + (r() - 0.5) * 10;
    const rx = w / humps / 1.4 + r() * 8;
    const ry = h * (0.55 + r() * 0.45);
    p.ellipse(cx, h, rx, ry, fill);
  }
  p.rect(0, h - 3, w, 3, fill);
  const o = p.clone().outline(line);
  for (let i = 0; i < o.data.length; i++) if (p.data[i] === T && o.data[i] === line && Math.floor(i / w) > 0) p.data[i] = line;
  if (hi != null) for (let i = 0; i < 10; i++) p.set(Math.floor(r() * w), h - 2 - Math.floor(r() * (h * 0.4)), hi);
  return p;
}

/** Tileable jagged mountain range with optional snow caps. */
export function mountains(w, h, fill, shade, snow, seed = 7) {
  const r = rng(seed);
  const p = new Pix(w, h);
  const peaks = [];
  for (let i = 0; i < 3; i++) peaks.push({ x: (i + 0.5) * (w / 3) + (r() - 0.5) * 12, top: Math.floor(r() * h * 0.35) });
  const topAt = (x) => {
    let top = h;
    for (const pk of peaks) for (const off of [-w, 0, w]) top = Math.min(top, pk.top + Math.abs(x - pk.x - off) * 1.1);
    return top;
  };
  for (let x = 0; x < w; x++) {
    const top = topAt(x);
    const lit = topAt(x + 1) < top; // left-facing slopes catch the light
    for (let y = Math.max(0, Math.floor(top)); y < h; y++) {
      let c = lit ? fill : shade;
      if (snow != null && top < h * 0.5 && y < top + 5 + ((x * 7) % 3)) c = snow;
      p.set(x, y, c);
    }
  }
  return p;
}

export function cloud(w, h, fill, line) {
  const p = new Pix(w, h);
  p.ellipse(w * 0.3, h * 0.62, w * 0.22, h * 0.36, fill);
  p.ellipse(w * 0.55, h * 0.45, w * 0.26, h * 0.42, fill);
  p.ellipse(w * 0.76, h * 0.64, w * 0.2, h * 0.33, fill);
  p.rect(Math.floor(w * 0.12), Math.floor(h * 0.62), Math.floor(w * 0.78), Math.ceil(h * 0.3), fill);
  return trimOutline(p, line);
}

export function tree(w, h, leaf, leafHi, trunk, line) {
  const p = new Pix(w, h);
  const tw = 6;
  p.rect(w / 2 - tw / 2, h * 0.55, tw, h * 0.45, trunk);
  p.ellipse(w / 2, h * 0.32, w * 0.46, h * 0.3, leaf);
  p.ellipse(w * 0.3, h * 0.5, w * 0.25, h * 0.15, leaf);
  p.ellipse(w * 0.7, h * 0.5, w * 0.25, h * 0.15, leaf);
  p.ellipse(w * 0.42, h * 0.22, w * 0.16, h * 0.1, leafHi);
  return trimOutline(p, line);
}

export function bush(w, h, fill, hi, line) {
  const p = new Pix(w, h);
  p.ellipse(w * 0.3, h, w * 0.28, h * 0.8, fill);
  p.ellipse(w * 0.62, h, w * 0.34, h * 0.95, fill);
  p.ellipse(w * 0.55, h * 0.45, w * 0.1, h * 0.12, hi);
  return trimOutline(p, line);
}

/** Outline inside the bounds: draws the border on the sprite's own edge pixels so it never overflows. */
export function trimOutline(p, line) {
  const src = p.clone();
  for (let y = 0; y < p.h; y++)
    for (let x = 0; x < p.w; x++)
      if (src.get(x, y) !== T && [src.get(x - 1, y), src.get(x + 1, y), src.get(x, y - 1), src.get(x, y + 1)].some((n) => n === T) && y < p.h - 1)
        p.set(x, y, line);
  return p;
}

export function flame(step, outer = 0x16, mid = 0x27, core = 0x28) {
  const rows = step
    ? ['...O....', '..OO..O.', '.OMMO.O.', '.OMMMOO.', 'OMMCMMO.', 'OMCCCMO.', '.OMCCMO.', '..OOOO..']
    : ['....O...', '.O..OO..', '.O.OMMO.', '.OOMMMO.', '.OMMCMMO', '.OMCCCMO', '.OMCCMO.', '..OOOO..'];
  return Pix.rows(rows, { O: outer, M: mid, C: core });
}

export { K };
