// Owns the biome zones: lazy atlas loading as sections approach, disposal once they are far away,
// and drawing scenery + enemies (alive, dying, gone) every frame.
import { SpriteBatch } from './SpriteBatch.js';
import { BiomeFactory, GROUND } from './BiomeFactory.js';

const LOAD_MARGIN = '150% 0px'; // start loading ~1.5 screens before a section scrolls in
const KEEP_MARGIN = '400% 0px'; // dispose once a section is >4 screens away (hysteresis avoids thrash)
const BATCH_CAPACITY = 1536;
const DEATH = 0.75; // seconds: blink → collapse → poof
const BOSS_DEATH = 1.8;
const ENEMY_AHEAD = 14; // enemies stand this far in front of the hero's centre when they fall

export class SceneManager {
  constructor({ assets, driver, prog, scene, onReady }) {
    this.assets = assets;
    this.driver = driver;
    this.prog = prog;
    this.scene = scene;
    this.onReady = onReady;
    this.W = 0;
    this.H = 0;
    this.dying = new Map(); // enemy id → death start time
    this.bossFlashUntil = 0;
    this.slots = driver.zones.map((zone) => ({ zone, def: BiomeFactory.def(zone.biome), state: 'idle', near: new Set(), kept: new Set() }));

    this._loadIO = new IntersectionObserver((entries) => this._observe(entries, 'near'), { rootMargin: LOAD_MARGIN });
    this._keepIO = new IntersectionObserver((entries) => this._observe(entries, 'kept'), { rootMargin: KEEP_MARGIN });
    for (const slot of this.slots)
      for (const el of slot.zone.sections) {
        this._loadIO.observe(el);
        this._keepIO.observe(el);
      }
    driver.onMeasure(() => {
      this.slots.forEach((slot, i) => (slot.zone = driver.zones[i]));
      this.relayout();
    });
  }

  _observe(entries, set) {
    for (const entry of entries) {
      const slot = this.slots.find((s) => s.zone.sections.includes(entry.target));
      if (!slot) continue;
      if (entry.isIntersecting) slot[set].add(entry.target);
      else slot[set].delete(entry.target);
      if (slot.near.size) this._ensure(slot);
      else if (!slot.kept.size) this._release(slot);
    }
  }

  _ensure(slot) {
    if (slot.state !== 'idle') return;
    slot.state = 'loading';
    this.assets.load(slot.def.atlas).then(
      (atlas) => {
        if (slot.state !== 'loading') return this.assets.release(slot.def.atlas); // released while loading
        slot.batch = new SpriteBatch(atlas, BATCH_CAPACITY, slot.zone.index);
        this.scene.add(slot.batch.mesh);
        slot.state = 'ready';
        this._layout(slot);
        this.onReady?.();
      },
      (err) => {
        console.warn(`[game] atlas ${slot.def.atlas} failed`, err);
        slot.state = 'idle';
      },
    );
  }

  _release(slot) {
    if (slot.state === 'loading') {
      slot.state = 'idle';
      return;
    }
    if (slot.state !== 'ready') return;
    this.scene.remove(slot.batch.mesh);
    slot.batch.dispose();
    slot.batch = null;
    slot.layout = null;
    slot.state = 'idle';
    this.assets.release(slot.def.atlas);
  }

  resize(W, H) {
    this.W = W;
    this.H = H;
    this.relayout();
  }

  relayout() {
    for (const slot of this.slots) if (slot.state === 'ready') this._layout(slot);
  }

  _layout(slot) {
    if (!this.W) return;
    slot.layout = BiomeFactory.layout(slot.def, slot.batch.atlas, slot.zone, this.W, this.H, 1000 + slot.zone.index * 77);
  }

  /** Loaded atlases (for diagnostics). */
  get loaded() {
    return this.slots.filter((s) => s.state === 'ready').map((s) => s.def.atlas);
  }

  onDefeat(enemy, t) {
    this.dying.set(enemy.id, t);
  }

  onRevive(enemy) {
    this.dying.delete(enemy.id);
  }

  onBossHit(t) {
    this.bossFlashUntil = t + 0.25;
  }

  /** True while something is animating independently of scroll. */
  busy(t) {
    for (const start of this.dying.values()) if (t - start < BOSS_DEATH) return true;
    return t < this.bossFlashUntil;
  }

  /** Enemy centre in world x (hero world x = scrollY × WORLD_SPEED, so triggerX is where the hero stands). */
  enemyX(e) {
    if (e.isBoss) return e.triggerX + 40;
    if (e.kind === 'spikes') return e.triggerX;
    return e.triggerX + ENEMY_AHEAD;
  }

  /** Height the hero must jump to clear any spikes near heroWorldX. */
  jumpHeight(heroWorldX) {
    let h = 0;
    for (const e of this.prog.enemies) {
      if (e.kind !== 'spikes') continue;
      const d = (this.enemyX(e) - heroWorldX) / 18;
      if (d > -1 && d < 1) h = Math.max(h, Math.round(24 * (1 - d * d)));
    }
    return h;
  }

  /**
   * camX: world x of the screen's left edge.
   * `still` = reduced-motion static scene (no ambient animation, no death sequences).
   */
  draw(core, camX, t, still) {
    const { W, H } = this;
    const at = still ? 0 : t;
    for (const slot of this.slots) {
      if (slot.state !== 'ready') continue;
      const b = slot.batch;
      b.begin();
      if (BiomeFactory.draw(slot.def, slot.layout, b, slot.zone, camX, W, H, at)) this._drawEnemies(slot, b, core, camX, t, still);
      b.end();
    }
  }

  _drawEnemies(slot, b, core, camX, t, still) {
    const W = this.W;
    for (const e of this.prog.enemies) {
      if (e.zone !== slot.zone) continue;
      const scale = e.isBoss ? 2 : 1;
      const frame = b.atlas.frames[`${e.kind}_0`];
      if (!frame) continue;
      const w = frame.w * scale;
      const x = Math.round(this.enemyX(e) - camX - w / 2);
      if (x > W || x + w < 0) continue;
      let y = GROUND;
      if (e.kind === 'bat') y += 18 + (still ? 0 : Math.round(Math.sin(t * 4 + e.id) * 3));
      const anim = still ? 0 : Math.floor(t * (e.kind === 'bat' ? 6 : 3) + e.id) % 2;

      if (!e.defeated) {
        const hit = e.isBoss && t < this.bossFlashUntil && Math.floor(t * 20) % 2;
        b.draw(`${e.kind}_${anim}`, x, y, { scale, flash: hit ? 1 : 0 });
        continue;
      }
      if (e.kind === 'spikes') {
        b.draw('spikes_0', x, y); // obstacles stay; the hero simply jumped them
        continue;
      }
      const start = this.dying.get(e.id);
      if (start === undefined || still) continue;
      const dur = e.isBoss ? BOSS_DEATH : DEATH;
      const k = (t - start) / dur;
      if (k >= 1) {
        this.dying.delete(e.id);
        continue;
      }
      // 0–55%: blink white, 55–80%: collapse in 4 steps, 40–100%: poof.
      if (k < 0.55) {
        if (Math.floor(k * 24) % 2 === 0) b.draw(`${e.kind}_0`, x, y, { scale, flash: 1 });
      } else if (k < 0.8) {
        const sy = 1 - Math.ceil(((k - 0.55) / 0.25) * 4) / 4;
        b.draw(`${e.kind}_0`, x, y, { scale, sy: Math.max(sy, 0.25) });
      }
      if (k > 0.4) {
        const p = Math.min(2, Math.floor(((k - 0.4) / 0.6) * 3));
        const puffs = e.isBoss ? [[0, 0], [-20, 18], [22, 30], [-6, 50], [16, 6]] : [[0, 0]];
        for (const [dx, dy] of puffs) core.draw(`poof_${p}`, Math.round(x + w / 2 - 8 + dx), y + dy + Math.round(frame.h * scale * 0.3));
      }
    }
  }

  dispose() {
    this._loadIO.disconnect();
    this._keepIO.disconnect();
    for (const slot of this.slots) this._release(slot);
  }
}
