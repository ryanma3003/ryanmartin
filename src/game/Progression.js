// Game rules, independent of rendering (works even when no GPU canvas is available).
// Every [data-enemy] element is a career milestone. It is "defeated" once the reader scrolls it into view,
// i.e. once the hero walks past its trigger point. Everything is derived from scroll position, so scrolling
// back up revives enemies and the state always matches the page.
import { WORLD_SPEED } from './ScrollDriver.js';

const MIN_GAP_WORLD = 30; // game pixels between enemies so sprites never overlap
const TRIGGER_AT = 0.62; // milestone triggers when its top reaches 62% of the viewport height
const BOSS_HITS = 12;

export class Progression {
  constructor(driver, root = document) {
    this.driver = driver;
    this.enemies = [...root.querySelectorAll('[data-enemy]')].map((el, id) => ({
      id,
      el,
      kind: el.dataset.enemy,
      xp: Number(el.dataset.xp) || 0,
      label: el.dataset.label || el.dataset.enemy,
      isBoss: el.dataset.enemy === 'boss',
      zone: null,
      triggerY: 0,
      triggerX: 0,
      defeated: false,
    }));
    this.boss = this.enemies.find((e) => e.isBoss) ?? null;
    this.total = this.enemies.length;
    this.level = 1;
    this.xp = 0;
    this.kills = 0;
    this.zone = null;
    this.bossHp = 1;
    this._bossHits = 0;
    this._subs = {};
    this._ready = false;

    driver.onMeasure(() => this.layout());
    driver.onScroll(() => this.update());
    this.layout();
  }

  on(type, fn) {
    (this._subs[type] ??= new Set()).add(fn);
  }

  _emit(type, payload) {
    for (const fn of this._subs[type] ?? []) fn(payload, this);
  }

  layout() {
    const d = this.driver;
    const sy = scrollY;
    const gapY = MIN_GAP_WORLD / WORLD_SPEED;
    let prev = -Infinity;
    for (const e of this.enemies) {
      e.zone = d.zoneOf(e.el);
      if (e.isBoss) continue;
      const top = e.el.getBoundingClientRect().top + sy;
      let t = Math.max(top - d.vh * TRIGGER_AT, e.zone.startY + gapY, prev + gapY);
      e.triggerY = Math.min(t, d.maxY - 4);
      prev = e.triggerY;
    }
    if (this.boss) this.boss.triggerY = d.maxY - 2;
    for (const e of this.enemies) e.triggerX = e.triggerY * WORLD_SPEED;
    this.update(true); // re-sync silently: no animations for layout-only changes
  }

  update(silent = !this._ready) {
    const d = this.driver;
    const y = d.y;
    let xp = 0;
    let kills = 0;
    for (const e of this.enemies) {
      const defeated = y >= e.triggerY;
      if (defeated !== e.defeated) {
        e.defeated = defeated;
        e.el.classList.toggle('is-defeated', defeated);
        if (!silent) this._emit(defeated ? 'defeat' : 'revive', e);
      }
      if (defeated) {
        xp += e.xp;
        kills++;
      }
    }
    this.xp = xp;
    this.kills = kills;

    const zone = d.zoneAt(y);
    if (zone !== this.zone) {
      this.zone = zone;
      this._emit('zone', zone);
    }
    const level = zone.index + 1 + (this.boss?.defeated ? 1 : 0);
    if (level > this.level && !silent) this._emit('levelup', { level, zone, victory: !!this.boss?.defeated });
    this.level = level;

    // Boss HP drains as you advance through the boss room; every 1/BOSS_HITS is a hit.
    if (this.boss) {
      const bz = this.boss.zone;
      const p = bz && zone === bz ? Math.min(1, Math.max(0, (y - bz.startY) / Math.max(1, this.boss.triggerY - bz.startY))) : zone.index > (bz?.index ?? 0) ? 1 : 0;
      this.bossHp = this.boss.defeated ? 0 : 1 - p;
      const hits = Math.floor(p * BOSS_HITS);
      if (hits > this._bossHits && !silent && !this.boss.defeated) this._emit('bosshit', this.boss);
      this._bossHits = hits;
    }

    this._ready = true;
    this._emit('change', this);
  }

  /** XP-bar fill: scroll depth through the current level's zone. */
  get levelProgress() {
    return this.boss?.defeated ? 1 : this.driver.zoneProgress();
  }
}
