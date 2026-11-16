// Declarative biome definitions + a generic parallax painter.
// Each biome only references frame names from its own atlas (see art/biomes.mjs and README "Swapping art").
//
// Layer types
//   tile    – frame repeated horizontally at parallax factor f, sitting on the horizon (y above ground)
//   wall    – frame tiled in 2D behind everything above the ground (castle/boss interiors)
//   scatter – seeded random props; y in [yMin, yMax] as a fraction of sky height (or 0 = on the ground)
//   ceiling – scatter hanging from the top edge of the screen
//   single  – one prop at a fixed fraction of the screen (moon, distant castle)

export const GROUND = 32; // ground height in game pixels (two 16px tiles)

const DEFS = {
  title: {
    atlas: 'title',
    sky: [['px_0f', 0.55], ['px_02', 0.85], ['px_0c', 1]],
    layers: [
      { type: 'scatter', frames: ['star_0', 'star_1'], fps: 1.5, f: 0.04, every: 14, yMin: 0.3, yMax: 0.98 },
      { type: 'single', frame: 'moon', f: 0.02, at: 0.56, y: 0.8 },
      { type: 'single', frame: 'castle', f: 0.12, at: 0.76, y: 0, lift: 14 },
      { type: 'tile', frame: 'hills', f: 0.25 },
      { type: 'ground' },
    ],
  },
  forest: {
    atlas: 'forest',
    sky: [['px_21', 0.72], ['px_31', 1]],
    layers: [
      { type: 'scatter', frames: ['cloud', 'cloud_s'], f: 0.12, every: 110, yMin: 0.5, yMax: 0.95 },
      { type: 'tile', frame: 'hills', f: 0.3 },
      { type: 'scatter', frames: ['pine'], f: 0.6, every: 44 },
      { type: 'scatter', frames: ['tree'], f: 0.85, every: 70 },
      { type: 'ground' },
      { type: 'scatter', frames: ['bush'], f: 1, every: 80, below: 1 },
      { type: 'scatter', frames: ['flower_0', 'flower_1'], f: 1, every: 22, below: 1 },
      { type: 'gate', frame: 'gate', offset: 14 },
    ],
  },
  mountain: {
    atlas: 'mountain',
    sky: [['px_0f', 0.3], ['px_0c', 0.7], ['px_1c', 1]],
    layers: [
      { type: 'tile', frame: 'peaks', f: 0.12 },
      { type: 'tile', frame: 'spires', f: 0.4 },
      { type: 'ceiling', frames: ['stalactite', 'stalactite_s'], f: 0.75, every: 26 },
      { type: 'ground' },
      { type: 'scatter', frames: ['rock'], f: 1, every: 120 },
      { type: 'scatter', frames: ['crystal_0', 'crystal_1'], fps: 2, f: 1, every: 60 },
      { type: 'gate', frame: 'gate', offset: -6 },
    ],
  },
  castle: {
    atlas: 'castle',
    sky: [['px_0f', 1]],
    layers: [
      { type: 'wall', frame: 'wall', f: 0.5 },
      { type: 'scatter', frames: ['window'], f: 0.5, every: 96, yMin: 0.38, yMax: 0.42, grid: 48 },
      { type: 'scatter', frames: ['banner'], f: 0.5, every: 140, yMin: 0.6, yMax: 0.62, grid: 48 },
      { type: 'scatter', frames: ['torch_0', 'torch_1'], fps: 6, f: 0.5, every: 72, yMin: 0.16, yMax: 0.18, grid: 24 },
      { type: 'ground' },
      { type: 'gate', frame: 'gate', offset: -4 },
    ],
  },
  boss: {
    atlas: 'boss',
    sky: [['px_0f', 1]],
    layers: [
      { type: 'wall', frame: 'wall', f: 0.4 },
      { type: 'scatter', frames: ['pillar'], f: 0.7, every: 70, grid: 70 },
      { type: 'ground' },
      { type: 'scatter', frames: ['brazier_0', 'brazier_1'], fps: 6, f: 1, every: 90 },
      { type: 'gate', frame: 'gate', offset: -4 },
    ],
  },
};

export class BiomeFactory {
  static def(biome) {
    const d = DEFS[biome];
    if (!d) throw new Error(`Unknown biome "${biome}"`);
    return d;
  }

  /** Seeded prop placement for a zone. Recomputed on resize/re-measure; cheap. */
  static layout(def, atlas, zone, W, H, seed) {
    const span = (Number.isFinite(zone.endX) ? zone.endX : zone.startX + W * 2) - zone.startX;
    const skyH = H - GROUND;
    const rand = mulberry(seed);
    return def.layers.map((layer) => {
      if (layer.type !== 'scatter' && layer.type !== 'ceiling') return null;
      const items = [];
      const extent = span * layer.f + W + 64;
      for (let x = -W; x < extent; x += layer.every * (0.6 + rand() * 0.8)) {
        const lx = layer.grid ? Math.round(x / layer.grid) * layer.grid : Math.round(x);
        const frame = layer.frames[Math.floor(rand() * layer.frames.length)];
        const fh = atlas.frames[frame]?.h ?? 0;
        let y;
        if (layer.type === 'ceiling') y = H - fh + Math.round(rand() * 4);
        else if (layer.yMin != null) y = GROUND + Math.round(skyH * (layer.yMin + rand() * (layer.yMax - layer.yMin)));
        else y = GROUND - (layer.below ?? 0);
        items.push({ lx, y, frame, phase: rand() * 10 });
      }
      return items;
    });
  }

  /**
   * Paint one zone into its batch. camX = world x of the screen's left edge.
   * Everything is clipped to the zone's on-screen stretch [clipL, clipR).
   */
  static draw(def, layout, batch, zone, camX, W, H, t) {
    const clipL = zone.index === 0 ? 0 : Math.max(0, Math.round(zone.startX - camX));
    const clipR = Math.min(W, Number.isFinite(zone.endX) ? Math.round(zone.endX - camX) : W);
    if (clipR <= clipL) return false;
    const clip = { clipL, clipR };
    const rel = camX - zone.startX; // how far the camera has travelled into the zone
    const skyH = H - GROUND;

    let top = H;
    for (const [frame, end] of def.sky) {
      const y = Math.round(H - skyH * end);
      batch.draw(frame, clipL, y, { w: clipR - clipL, h: top - y });
      top = y;
    }
    batch.draw(def.sky.at(-1)[0], clipL, 0, { w: clipR - clipL, h: GROUND + 1 });

    def.layers.forEach((layer, li) => {
      switch (layer.type) {
        case 'tile':
        case 'wall': {
          const f = batch.atlas.frames[layer.frame];
          const off = Math.round(-rel * layer.f);
          const start = off + Math.floor((clipL - off) / f.w) * f.w;
          const rows = layer.type === 'wall' ? Math.ceil(skyH / f.h) : 1;
          for (let r = 0; r < rows; r++)
            for (let x = start; x < clipR; x += f.w) batch.draw(layer.frame, x, GROUND + r * f.h, clip);
          break;
        }
        case 'ground': {
          const off = Math.round(-rel);
          const start = off + Math.floor((clipL - off) / 16) * 16;
          for (let x = start; x < clipR; x += 16) {
            batch.draw('ground_fill', x, 0, clip);
            batch.draw('ground_top', x, 16, clip);
          }
          break;
        }
        case 'scatter':
        case 'ceiling': {
          const shift = Math.round(-rel * layer.f);
          for (const it of layout[li]) {
            const x = it.lx + shift;
            if (x > clipR || x < clipL - 128) continue;
            let frame = it.frame;
            if (layer.fps) frame = layer.frames[Math.floor(t * layer.fps + it.phase) % layer.frames.length];
            batch.draw(frame, x, it.y, clip);
          }
          break;
        }
        case 'single': {
          const f = batch.atlas.frames[layer.frame];
          const x = Math.round(W * layer.at - rel * layer.f);
          const y = layer.y ? Math.round(GROUND + skyH * layer.y - f.h / 2) : GROUND + (layer.lift ?? 0);
          batch.draw(layer.frame, x, y, clip);
          break;
        }
        case 'gate': {
          batch.draw(layer.frame, Math.round(zone.startX - camX + layer.offset), GROUND, clip);
          break;
        }
      }
    });
    return true;
  }
}

function mulberry(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), a | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
