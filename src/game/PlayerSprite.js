// The hero. Pose is derived from distance walked (scroll), not from time, so the walk cycle
// matches scroll speed exactly and stops the moment scrolling stops.
const FRAME_W = 40; // see art/core.mjs HERO_FRAME
const BODY_X = 10; // body's left edge inside the frame
const BODY_W = 16;
const STRIDE = 5; // game pixels per walk-cycle step
const CYCLE = ['walk1', 'idle', 'walk2', 'idle'];
export const MAX_LEVEL = 6;

export class PlayerSprite {
  constructor() {
    this.level = 1;
    this.facing = 1;
    this.walked = 0;
    this.lastX = null;
    this.movingUntil = 0;
    this.attackUntil = 0;
    this.flashUntil = 0;
  }

  /** Feed the hero's world x every frame. */
  update(worldX, t) {
    if (this.lastX !== null) {
      const dx = worldX - this.lastX;
      if (Math.abs(dx) > 0.01) {
        this.walked += Math.abs(dx);
        this.facing = dx > 0 ? 1 : -1;
        this.movingUntil = t + 0.15;
      }
    }
    this.lastX = worldX;
  }

  attack(t) {
    this.attackUntil = t + 0.22;
  }

  levelUp(t) {
    this.flashUntil = t + 1.0;
  }

  busy(t) {
    return t < this.flashUntil || t < this.attackUntil || t < this.movingUntil;
  }

  /** cx = screen x of the body's centre, y = feet. */
  draw(batch, cx, y, t, still) {
    let pose = 'idle';
    if (!still) {
      if (t < this.attackUntil) pose = 'attack';
      else if (t < this.movingUntil) pose = CYCLE[Math.floor(this.walked / STRIDE) % CYCLE.length];
    }
    const flip = this.facing < 0 && !still;
    const bodyLeft = flip ? FRAME_W - BODY_X - BODY_W : BODY_X;
    const x = Math.round(cx - BODY_W / 2 - bodyLeft);
    const flashing = !still && t < this.flashUntil;
    batch.draw('shadow', Math.round(cx - 6), y - 1, { alpha: 0.35 });
    batch.draw(`hero_${Math.min(this.level, MAX_LEVEL)}_${pose}`, x, y, {
      flip,
      flash: flashing && Math.floor(t * 16) % 2 ? 1 : 0,
    });
    if (flashing) {
      // Level-up sparkles orbiting the hero.
      const k = (this.flashUntil - t) / 1.0;
      for (let i = 0; i < 6; i++) {
        const a = t * 7 + (i * Math.PI) / 3;
        const r = 10 + (1 - k) * 22;
        batch.draw('spark', Math.round(cx + Math.cos(a) * r - 2), Math.round(y + 14 + Math.sin(a) * r * 0.8), { alpha: k > 0.15 ? 1 : 0.5 });
      }
    }
  }
}
