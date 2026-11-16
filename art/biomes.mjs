// Biome atlases: title, forest, mountain, castle, boss. One PNG-8 per biome, lazy-loaded at runtime.
// Frame names here are the contract with src/game/BiomeFactory.js — keep them when swapping art.
import { Pix, T, rng, swatch } from './lib.mjs';
import { groundTile, brickTile, hills, mountains, cloud, tree, bush, trimOutline, flame } from './shapes.mjs';

const K = 0x0f;
const sw = (...cs) => Object.fromEntries(cs.map((c) => [`px_${c.toString(16).padStart(2, '0')}`, swatch(c)]));
const anim = (name, f0, f1 = f0.bob()) => ({ [`${name}_0`]: f0, [`${name}_1`]: f1 });

// ------------------------------------------------------------------ TITLE (night, castle on the horizon)
export function title() {
  const moon = new Pix(18, 18).ellipse(9, 9, 8, 8, 0x38).ellipse(6, 6, 2, 2, 0x37).ellipse(12, 11, 2.5, 2, 0x37).ellipse(7, 13, 1.5, 1.5, 0x37);
  const castle = new Pix(72, 48);
  const C = 0x0c, W = 0x28;
  castle.rect(8, 24, 56, 24, C);
  for (const [x, w, top] of [[2, 12, 10], [28, 16, 0], [58, 12, 10]]) {
    castle.rect(x, top + 6, w, 48 - top, C);
    for (let i = 0; i < w; i += 4) castle.rect(x + i, top + 2, 2, 4, C);
    castle.rect(x + w / 2 - 1, top + 12, 2, 3, W);
  }
  for (let i = 8; i < 64; i += 4) castle.rect(i, 20, 2, 4, C);
  castle.rect(31, 36, 10, 12, K).rect(33, 34, 6, 2, K);
  for (const x of [14, 22, 46, 54]) castle.rect(x, 30, 2, 3, W);
  castle.rect(35, 0, 1, 2, 0x16).rect(36, 0, 3, 1, 0x16);
  return {
    star_0: Pix.rows(['.W.', 'WWW', '.W.'], { W: 0x30 }),
    star_1: Pix.rows(['...', '.W.', '...'], { W: 0x10 }),
    moon,
    castle,
    hills: hills(96, 26, 0x0b, K, 0x0a, 11),
    ground_top: groundTile({ top: 0x0a, topHi: 0x1a, fill: 0x08, speck: 0x07, seed: 2 }),
    ground_fill: groundTile({ fill: 0x08, speck: 0x07, seed: 5 }),
    ...sw(0x0f, 0x02, 0x0c, 0x01),
  };
}

// ------------------------------------------------------------------ FOREST (day)
const SLIME = [
  '................',
  '......KKKK......',
  '....KKGGGGKK....',
  '...KGGWGGGGGK...',
  '..KGGWWGGGGGGK..',
  '..KGGGGGGGGGGK..',
  '.KGGGKGGGKGGGGK.',
  '.KGGGKGGGKGGGGK.',
  '.KgGGGGGGGGGGgK.',
  '.KggGGGGGGGGggK.',
  '..KggggggggggK..',
  '...KKKKKKKKKK...',
];
const MUSHROOM = [
  '.....KKKKKK.....',
  '...KKRRWWRRKK...',
  '..KRRRWWWWRRRK..',
  '.KRWWRRRRRRWWRK.',
  '.KRWWRRRRRRWWRK.',
  'KRRRRRRWWRRRRRRK',
  'KRRRRRWWWWRRRRRK',
  'KKKKKKKKKKKKKKKK',
  '...KSSSSSSSSK...',
  '...KSKSSSSKSK...',
  '...KSKSSSSKSK...',
  '...KSSSSSSSSK...',
  '....KSSSSSSK....',
  '...KKKKKKKKKK...',
  '..KBBBK..KBBBK..',
  '..KKKKK..KKKKK..',
];
export function forest() {
  const slime = Pix.rows(SLIME, { K, G: 0x2a, g: 0x1a, W: 0x30 });
  const slime1 = new Pix(16, 12).blit(slime, 0, 0);
  for (let y = 1; y < 6; y++) for (let x = 0; x < 16; x++) slime1.set(x, y, slime.get(x, y + 1)); // squish
  slime1.rect(0, 0, 16, 1, T);
  const mush = Pix.rows(MUSHROOM, { K, R: 0x16, W: 0x30, S: 0x37, B: 0x07 });
  const flower = (c) => Pix.rows(['.C.', 'CYC', '.C.', '.G.', 'GG.', '.G.'], { C: c, Y: 0x28, G: 0x1a });
  const sign = Pix.rows([
    'KKKKKKKKKKKKKKKK',
    'KWWWWWWWWWWWWWWK',
    'KWkWkWWkkWWkkWWK',
    'KWWWWWWWWWWWWWWK',
    'KWWkkWkWWkkWkWWK',
    'KWWWWWWWWWWWWWWK',
    'KKKKKKKKKKKKKKKK',
    '......KWWK......', '......KWkK......', '......KWWK......', '......KWkK......',
    '......KWWK......', '......KWkK......', '......KWWK......', '......KKKK......',
  ], { K, W: 0x27, k: 0x17 });
  return {
    ...anim('slime', slime, slime1),
    ...anim('mushroom', mush),
    cloud: cloud(40, 16, 0x30, 0x31),
    cloud_s: cloud(24, 11, 0x30, 0x31),
    hills: hills(112, 30, 0x1a, 0x0a, 0x2a, 4),
    tree: tree(32, 48, 0x1a, 0x2a, 0x07, K),
    pine: trimOutline(new Pix(20, 44).rect(8, 34, 4, 10, 0x07).ellipse(10, 30, 9, 5, 0x0a).ellipse(10, 21, 7, 5, 0x0a).ellipse(10, 12, 5, 5, 0x0a).ellipse(10, 5, 3, 4, 0x0a), K),
    bush: bush(28, 12, 0x1a, 0x2a, K),
    flower_0: flower(0x25),
    flower_1: flower(0x30),
    gate: sign,
    ground_top: groundTile({ top: 0x2a, topHi: 0x39, fill: 0x17, speck: 0x07, seed: 9 }),
    ground_fill: groundTile({ fill: 0x17, speck: 0x07, seed: 12 }),
    ...sw(0x21, 0x31, 0x22),
  };
}

// ------------------------------------------------------------------ MOUNTAIN / CAVE
const BAT_UP = [
  'K..............K',
  'KK............KK',
  'KPK....KK....KPK',
  'KPPK..KPPK..KPPK',
  '.KPPKKPPPPKKPPK.',
  '..KPPPPRPRPPPK..',
  '...KKPPPPPPKK...',
  '.....KPPPPK.....',
  '......KKKK......',
];
const BAT_DOWN = [
  '......KKKK......',
  '.....KPPPPK.....',
  '..KKKPRPPRPKKK..',
  '.KPPPPPPPPPPPPK.',
  'KPPKKPPPPPPKKPPK',
  'KPK..KKPPKK..KPK',
  'KK.....KK.....KK',
  'K..............K',
  '................',
];
const GOLEM = [
  '....................',
  '......KKKKKKKK......',
  '....KKRRRRRRRRKK....',
  '...KRRrRRRRRRrRRK...',
  '..KRRRRRRRRRRRRRRK..',
  '..KRRKKRRRRRRKKRRK..',
  '..KRRYYRRRRRRYYRRK..',
  '..KRRRRRRRRRRRRRRK..',
  '...KRRRKKKKKKRRRK...',
  '.KKKRRRRRRRRRRRRKKK.',
  'KRRRKRRrRRRRrRRKRRRK',
  'KRRRKRRRRRRRRRRKRRRK',
  'KRRRKRRRRRRRRRRKRRRK',
  'KRRKKRRRrRRRRRRKKRRK',
  '.KK.KRRRRRRRRRRK.KK.',
  '....KRRRRRRRRRRK....',
  '....KRRRKKKKRRRK....',
  '....KRRRK..KRRRK....',
  '...KRRRRK..KRRRRK...',
  '...KKKKKK..KKKKKK...',
];
const DRAGON = [
  '                  KK',
  '                 KGGK',
  '       K        KGGGGKK',
  '      KWK      KGGGYGGGK',
  '     KWWWK    KGGGGGGKKK',
  '    KWWWWWK  KGGGGGGK',
  '   KWWWWWWWKKGGGGGK',
  '  KGGWWWWWWGGGGGGK',
  ' KGGGGGGGGGGGGGGK',
  'KGGGGLLLLLLGGGGK',
  'KGGGLLLLLLLLGGGK',
  ' KGGGLLLLLLGGGK',
  '  KKGGGKKGGGKK',
  '   KGGK  KGGK',
  '   KKKK  KKKK',
];
export function mountain() {
  const crystal = (glow) => Pix.rows(['...K...', '..KCK..', '.KCcCK.', '.KCcCK.', 'KCCcCCK', 'KCCcCCK', 'KCCCCCK', '.KKKKK.'], { K, C: glow ? 0x3c : 0x2c, c: glow ? 0x30 : 0x3c });
  const stalactite = (w, h) => {
    const p = new Pix(w, h);
    for (let y = 0; y < h; y++) {
      const half = Math.max(0, Math.round((w / 2) * (1 - y / h)));
      p.rect(w / 2 - half, y, half * 2, 1, y % 5 === 2 ? 0x10 : 0x00);
    }
    return trimOutline(p, K);
  };
  const cave = new Pix(56, 64);
  cave.ellipse(28, 64, 28, 60, 0x08).ellipse(28, 64, 18, 44, K);
  for (let i = 0; i < 6; i++) cave.rect(6 + i * 8, 14 + (i % 3) * 6, 3, 2, 0x07);
  const dragon = Pix.rows(DRAGON, { K, G: 0x1a, W: 0x2a, L: 0x38, Y: 0x16 }).flipX();
  return {
    ...anim('bat', Pix.rows(BAT_UP, { K, P: 0x04, R: 0x16 }), Pix.rows(BAT_DOWN, { K, P: 0x04, R: 0x16 })),
    ...anim('golem', Pix.rows(GOLEM, { K, R: 0x00, r: 0x10, Y: 0x28 })),
    ...anim('dragon', dragon),
    peaks: mountains(128, 60, 0x2d, 0x00, 0x30, 21),
    spires: mountains(96, 70, 0x08, 0x0f, null, 33),
    stalactite: stalactite(10, 22),
    stalactite_s: stalactite(6, 12),
    crystal_0: crystal(false),
    crystal_1: crystal(true),
    rock: trimOutline(new Pix(18, 10).ellipse(9, 10, 9, 9, 0x00).ellipse(6, 5, 2, 2, 0x10), K),
    gate: cave,
    ground_top: groundTile({ top: 0x00, topHi: 0x10, fill: 0x2d, speck: 0x0f, seed: 31, topRows: 3 }),
    ground_fill: groundTile({ fill: 0x2d, speck: 0x00, seed: 32 }),
    ...sw(0x0c, 0x1c, 0x0f, 0x2c),
  };
}

// ------------------------------------------------------------------ CASTLE
const KNIGHT = [
  'S.....KKKK......',
  'SS...KGGGGK.....',
  'W...KGgGGGGK....',
  'W...KKKKKKGK....',
  'W...KGGGGGGK....',
  'W....KGGGGK.....',
  'W..KKKRRRRKKK...',
  'W.KGGKRRRRKGGK..',
  'WKGGGKRYYRKGGK..',
  'WKGGGKRRRRKGGK..',
  'KGKKKRRRRKKGGK..',
  '.KKKKKKKKKKKKK..',
  '....KGGGGGGK....',
  '....KGGKKGGK....',
  '....KGGKKGGK....',
  '...KKKKK.KKKKK..',
];
export function castle() {
  const knight = (G, g, R) => Pix.rows(KNIGHT, { K, G, g, R, Y: 0x28, S: 0x30, W: 0x07 });
  const torch = (step) => new Pix(8, 20).blit(flame(step), 0, 0).rect(3, 8, 2, 8, 0x07).rect(1, 15, 6, 2, 0x00).rect(2, 17, 4, 1, K);
  const window = new Pix(16, 26).ellipse(8, 8, 8, 8, K).rect(0, 8, 16, 18, K);
  window.ellipse(8, 9, 6, 6, 0x02).rect(2, 9, 12, 15, 0x02).rect(7, 3, 2, 21, K).rect(2, 13, 12, 2, K).ellipse(11, 6, 1.5, 1.5, 0x38);
  const banner = new Pix(14, 30).rect(0, 0, 14, 2, 0x28).rect(1, 2, 12, 22, 0x06);
  for (let y = 24; y < 30; y++) banner.rect(1 + (y - 24), y, 12 - (y - 24) * 2, 1, 0x06);
  banner.rect(5, 8, 4, 4, 0x28).rect(6, 7, 2, 6, 0x28).rect(4, 9, 6, 2, 0x28);
  trimOutline(banner, K);
  const spikes = new Pix(16, 9);
  for (let i = 0; i < 4; i++) for (let y = 0; y < 7; y++) spikes.rect(i * 4 + 2 - Math.floor(y / 3.5), y, 1 + Math.floor(y / 3.5) * 2 - (y < 2 ? 0 : 0), 1, y < 2 ? 0x30 : 0x10);
  spikes.rect(0, 7, 16, 2, 0x00);
  trimOutline(spikes, K);
  const portcullis = new Pix(40, 56).rect(0, 0, 40, 56, 0x00).rect(4, 6, 32, 50, K);
  for (let x = 6; x < 36; x += 5) portcullis.rect(x, 6, 2, 46, 0x2d);
  for (let y = 12; y < 52; y += 8) portcullis.rect(4, y, 32, 1, 0x2d);
  for (let x = 0; x < 40; x += 8) portcullis.rect(x, 0, 4, 3, 0x10);
  return {
    ...anim('knight', knight(0x10, 0x30, 0x16)),
    ...anim('darkknight', knight(0x00, 0x10, 0x04)),
    spikes_0: spikes,
    spikes_1: spikes,
    wall: brickTile(32, 32, 0x2d, K, 0x00),
    window,
    banner,
    torch_0: torch(0),
    torch_1: torch(1),
    gate: portcullis,
    ground_top: brickTile(16, 16, 0x10, K, 0x30),
    ground_fill: brickTile(16, 16, 0x00, K, 0x2d),
    ...sw(0x0f, 0x2d, 0x00),
  };
}

// ------------------------------------------------------------------ BOSS ROOM
const BOSS_HALF = [
  'K...........',
  'KK..........',
  'KHK.........',
  'KHHK....KKKK',
  '.KHHK.KKPPPP',
  '..KHHKPPPPPP',
  '...KKPPPPPPP',
  '...KPPPPPPPP',
  '..KPPPKKKPPP',
  '..KPPKYYYKPP',
  '..KPPKYRYKPP',
  '..KPPPKKKPPP',
  '..KPPPPPPPPP',
  '...KPPPPPPPP',
  '...KPPKWKWKW',
  '...KPPPKKKKK',
  '....KPPPPPPP',
  '.KKKKKPPPPPP',
  'KPPPPKKPPPPP',
  'KPPPPPKPPPPP',
  'KPPKPPKPPpPP',
  'KPK.KPKPPpPP',
  'KK..KKKPPpPP',
  '....KKKKKKKK',
];
export function boss() {
  const legend = { K, H: 0x30, P: 0x05, p: 0x15, Y: 0x28, R: 0x16, W: 0x30 };
  const b0 = Pix.mirrored(BOSS_HALF, legend);
  const b1 = Pix.mirrored(BOSS_HALF.map((r, i) => (i >= 9 && i <= 10 ? r.replace(/Y/g, 'R') : r)), legend).bob(4);
  const pillar = new Pix(18, 72).rect(2, 6, 14, 60, 0x00).rect(4, 6, 3, 60, 0x10).rect(0, 0, 18, 6, 0x2d).rect(0, 66, 18, 6, 0x2d);
  trimOutline(pillar, K);
  const brazier = (step) => new Pix(16, 24).blit(flame(step, 0x14, 0x24, 0x34), 4, 0).rect(2, 8, 12, 4, 0x28).rect(4, 12, 8, 2, 0x18).rect(7, 14, 2, 8, 0x18).rect(4, 22, 8, 2, 0x18);
  const door = new Pix(40, 56).ellipse(20, 20, 20, 20, 0x08).rect(0, 20, 40, 36, 0x08);
  door.ellipse(20, 21, 16, 16, 0x07).rect(4, 21, 32, 35, 0x07).rect(19, 5, 2, 51, 0x08);
  for (let y = 24; y < 56; y += 10) door.rect(4, y, 32, 2, 0x0f);
  door.rect(15, 32, 2, 4, 0x28).rect(23, 32, 2, 4, 0x28);
  trimOutline(door, K);
  return {
    boss_0: b0,
    boss_1: b1,
    wall: brickTile(32, 32, 0x03, K, 0x13),
    pillar,
    brazier_0: brazier(0),
    brazier_1: brazier(1),
    gate: door,
    ground_top: brickTile(16, 16, 0x05, K, 0x15),
    ground_fill: brickTile(16, 16, 0x07, K, 0x05),
    ...sw(0x0f, 0x03, 0x04),
  };
}
