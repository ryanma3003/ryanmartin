// CORE atlas — always loaded. Hero (6 levels × 4 poses), death poof, XP spark, flash swatches.
import { Pix, T, swatch } from './lib.mjs';

export const HERO_FRAME = { w: 40, h: 28, bodyX: 10, bodyY: 10 };

const K = 0x0f;

// Per-level loadout: tunic, shade, pants, boots/belt, helmet, cape, sword.
const LEVELS = [
  { T: 0x18, t: 0x08, P: 0x08, B: 0x07 },
  { T: 0x1a, t: 0x0a, P: 0x08, B: 0x07, sword: { len: 6, w: 1, blade: 0x17, hi: 0x27, guard: 0x07 } },
  { T: 0x12, t: 0x02, P: 0x08, B: 0x07, helm: [0x10, 0x30], sword: { len: 8, w: 1, blade: 0x10, hi: 0x30, guard: 0x07 } },
  { T: 0x10, t: 0x00, P: 0x00, B: 0x2d, helm: [0x10, 0x30], pauldron: true, sword: { len: 10, w: 2, blade: 0x10, hi: 0x30, guard: 0x00 } },
  { T: 0x10, t: 0x00, P: 0x00, B: 0x2d, helm: [0x10, 0x30], pauldron: true, plume: 0x16, cape: [0x16, 0x06], sword: { len: 12, w: 2, blade: 0x10, hi: 0x30, guard: 0x28 } },
  { T: 0x28, t: 0x18, P: 0x00, B: 0x07, helm: [0x28, 0x38], pauldron: true, crown: true, cape: [0x13, 0x03], sword: { len: 14, w: 2, blade: 0x2c, hi: 0x3c, guard: 0x28 } },
];

const HEAD = [
  '.....KKKKKK.....',
  '....KHHHHHHK....',
  '...KHHHHHHHHK...',
  '...KHHSSSSSSK...',
  '...KHSSSSKSSK...',
  '...KHSSSSSSSK...',
  '....KSSSSSSK....',
];
const HELM = [
  '.....KKKKKK.....',
  '....KGGGGGGK....',
  '...KGgGGGGGGK...',
  '...KGGSSSSSSK...',
];
const TORSO = [
  '....KKTTTTKK....',
  '...KTTTTTTTTK...',
  '...KTtTTTTTTK...',
  '...KBBBBBBBBK...',
  '...KTTTTTTTTK...',
  '....KTTTTTTK....',
];
const LEGS = {
  idle: [
    '....KPPKKPPK....',
    '....KPPKKPPK....',
    '....KPPKKPPK....',
    '...KBBBKKBBBBK..',
    '...KKKKKKKKKKK..',
  ],
  walk1: [
    '....KPPKKPPK....',
    '...KPPK..KPPK...',
    '..KPPK....KPPK..',
    '.KBBBK....KBBBK.',
    '.KKKKK....KKKKK.',
  ],
  walk2: [
    '....KPPKKPPK....',
    '.....KPPPPK.....',
    '.....KPPPPK.....',
    '.....KBBBBBK....',
    '.....KKKKKKK....',
  ],
};
const ARM_IDLE = ['KTK.', 'KTK.', 'KSSK', '.KK.'];
const ARM_ATTACK = ['.KKKKK', 'KTTSSK', '.KKKKK'];
const PAULDRON = ['.KKK.', 'KGGgK', 'KGGGK', '.KKK.'];
const CAPE = [
  '....KKK',
  '...KCCK',
  '..KCCCK',
  '..KCCcK',
  '.KCCCcK',
  '.KCCCcK',
  'KCCCCcK',
  'KCCCcK.',
  'KKKKK..',
];
const CROWN = ['Y..YY..Y', 'YYYYYYYY', 'YRYYYYRY'];

/** Upright sword: tip at the top, grip at the bottom. */
function swordUp({ len, w, blade, hi, guard }) {
  const gw = w + 2;
  const p = new Pix(gw + 2, len + 4);
  const bx = 1 + Math.floor((gw - w) / 2);
  p.rect(bx, 1, w, len, blade);
  p.set(bx, 1, hi); // tip glint
  if (w > 1) p.rect(bx, 2, 1, len - 1, hi);
  p.rect(1, len + 1, gw, 1, guard);
  p.rect(bx, len + 2, w, 1, 0x07);
  return p.outline(K);
}

const rotCW = (p) => {
  const r = new Pix(p.h, p.w);
  for (let y = 0; y < p.h; y++) for (let x = 0; x < p.w; x++) r.set(p.h - 1 - y, x, p.get(x, y));
  return r;
};

function heroFrame(lv, pose) {
  const L = LEVELS[lv];
  const { w, h, bodyX: bx, bodyY: by } = HERO_FRAME;
  const f = new Pix(w, h);
  const legend = { K, H: 0x08, S: 0x36, T: L.T, t: L.t, P: L.P, B: L.B, G: L.helm?.[0] ?? 0, g: L.helm?.[1] ?? 0, C: L.cape?.[0] ?? 0, c: L.cape?.[1] ?? 0, Y: 0x28, R: 0x16 };
  const legs = pose === 'attack' ? 'walk1' : pose;

  if (L.cape) {
    let cape = Pix.rows(CAPE, legend);
    if (pose === 'walk1' || pose === 'attack') cape = Pix.rows(CAPE.map((r, i) => (i > 4 ? r.slice(1) + '.' : r)), legend); // flutter
    f.blit(cape, bx - 2, by + 6);
  }
  // Sword drawn before the arm so the hand covers the grip.
  if (L.sword && pose !== 'attack') {
    const s = swordUp(L.sword);
    f.blit(s, bx + 14 - Math.floor(s.w / 2), by + 9 - (s.h - 2));
  }
  f.blit(Pix.rows(HEAD, legend), bx, by);
  if (L.helm) f.blit(Pix.rows(HELM, legend), bx, by);
  if (L.plume) f.rect(bx + 6, by - 2, 3, 2, L.plume).rect(bx + 5, by - 1, 1, 1, K).rect(bx + 9, by - 1, 1, 1, K);
  if (L.crown) f.blit(Pix.rows(CROWN, legend), bx + 4, by - 3);
  f.blit(Pix.rows([...TORSO, ...LEGS[legs]], legend), bx, by + 7);
  if (L.pauldron) f.blit(Pix.rows(PAULDRON, legend), bx + 1, by + 7);
  if (pose === 'attack') {
    if (L.sword) {
      const s = rotCW(swordUp(L.sword));
      f.blit(s, bx + 16, by + 8 - Math.floor(s.h / 2));
    }
    f.blit(Pix.rows(ARM_ATTACK, legend), bx + 11, by + 7);
  } else {
    f.blit(Pix.rows(ARM_IDLE, legend), bx + 12, by + 8);
  }
  return f;
}

function poof(step) {
  const p = new Pix(16, 16);
  if (step === 0) p.ellipse(8, 8, 4, 4, 0x30).ellipse(8, 8, 2, 2, 0x10);
  if (step === 1) p.ellipse(8, 8, 7, 7, 0x30).ellipse(8, 8, 4.5, 4.5, T).ellipse(8, 8, 2, 2, 0x10);
  if (step === 2)
    for (const [x, y] of [[1, 3], [12, 1], [14, 10], [3, 13], [8, 7], [7, 14], [0, 8], [13, 15]]) p.rect(x, y, 2, 2, step === 2 && (x + y) % 3 ? 0x10 : 0x30);
  return p;
}

export function build() {
  const sprites = {};
  for (let lv = 0; lv < LEVELS.length; lv++)
    for (const pose of ['idle', 'walk1', 'walk2', 'attack']) sprites[`hero_${lv + 1}_${pose}`] = heroFrame(lv, pose);
  for (let i = 0; i < 3; i++) sprites[`poof_${i}`] = poof(i);
  sprites.spark = Pix.rows(['..Y..', '.YWY.', 'YWWWY', '.YWY.', '..Y..'], { Y: 0x28, W: 0x30 });
  sprites.shadow = Pix.rows(['.KKKKKKKKKK.', 'KKKKKKKKKKKK'], { K: 0x0d });
  for (const c of [0x30, 0x0f, 0x28, 0x16]) sprites[`px_${c.toString(16).padStart(2, '0')}`] = swatch(c);
  return sprites;
}
