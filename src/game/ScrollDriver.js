// Native scroll → game state. Never touches scrolling itself (no scroll-jacking): it only reads
// window.scrollY once per animation frame and maps it onto a continuous world.
//
//   worldX = scrollY × WORLD_SPEED      (one CSS pixel of scroll = WORLD_SPEED game pixels of walking)
//
// Sections tagged [data-biome] become zones; consecutive sections with the same biome merge into one.

export const WORLD_SPEED = 0.5;

export class ScrollDriver {
  constructor(root = document) {
    this.sections = [...root.querySelectorAll('[data-biome]')];
    this.zones = [];
    this.y = 0;
    this.maxY = 1;
    this.vh = innerHeight;
    this.lastMoveAt = -1e9; // performance.now() seconds of the last scroll change
    this._scrollSubs = new Set();
    this._measureSubs = new Set();
    this._raf = 0;
    this._measureTimer = 0;
    this._width = innerWidth;

    this._onScroll = () => {
      if (!this._raf) this._raf = requestAnimationFrame(() => this._tick());
    };
    addEventListener('scroll', this._onScroll, { passive: true });
    addEventListener('resize', () => this._queueMeasure());
    // Content height changes (web font swap, images, <details>) shift every trigger point.
    new ResizeObserver(() => this._queueMeasure()).observe(document.body);
    this.measure();
  }

  /** Called on every scroll frame with the driver. */
  onScroll(fn) {
    this._scrollSubs.add(fn);
    return () => this._scrollSubs.delete(fn);
  }

  /** Called after layout was re-measured (resize, font load…). */
  onMeasure(fn) {
    this._measureSubs.add(fn);
    return () => this._measureSubs.delete(fn);
  }

  get worldX() {
    return this.y * WORLD_SPEED;
  }

  get progress() {
    return Math.min(1, this.y / this.maxY);
  }

  /** Zone containing scroll position y. */
  zoneAt(y = this.y) {
    let z = this.zones[0];
    for (const zone of this.zones) if (y >= zone.startY) z = zone;
    return z;
  }

  /** Section (for its HUD label) at scroll position y. */
  sectionAt(y = this.y) {
    let s = this.sectionStarts[0];
    for (const entry of this.sectionStarts) if (y >= entry.startY) s = entry;
    return s;
  }

  zoneOf(el) {
    const section = el.closest('[data-biome]');
    return this.zones.find((z) => z.sections.includes(section)) ?? this.zones[0];
  }

  /** Local progress 0→1 through the current zone. */
  zoneProgress(y = this.y) {
    const z = this.zoneAt(y);
    return Math.min(1, Math.max(0, (y - z.startY) / Math.max(1, z.endY - z.startY)));
  }

  isMoving(nowSec, window = 0.2) {
    return nowSec - this.lastMoveAt < window;
  }

  measure() {
    this.vh = innerHeight;
    this.maxY = Math.max(1, document.documentElement.scrollHeight - this.vh);
    const sy = scrollY;
    // A section "starts" when its top reaches the middle of the viewport.
    this.sectionStarts = this.sections.map((el, i) => ({
      el,
      biome: el.dataset.biome,
      name: el.dataset.zone ?? el.dataset.biome.toUpperCase(),
      startY: i === 0 ? 0 : clamp(el.getBoundingClientRect().top + sy - this.vh * 0.5, 0, this.maxY),
    }));
    const zones = [];
    for (const s of this.sectionStarts) {
      const prev = zones.at(-1);
      if (prev && prev.biome === s.biome) prev.sections.push(s.el);
      else zones.push({ index: zones.length, biome: s.biome, name: s.name, sections: [s.el], startY: s.startY });
    }
    zones.forEach((z, i) => {
      z.endY = Math.max(z.startY + 1, i + 1 < zones.length ? zones[i + 1].startY : this.maxY);
      z.startX = z.startY * WORLD_SPEED;
      z.endX = z.endY * WORLD_SPEED;
    });
    zones.at(-1).endX = Infinity; // the last room extends past the end of the page
    this.zones = zones;
    this.y = Math.min(sy, this.maxY);
    for (const fn of this._measureSubs) fn(this);
    for (const fn of this._scrollSubs) fn(this);
  }

  _queueMeasure() {
    clearTimeout(this._measureTimer);
    this._measureTimer = setTimeout(() => {
      // Mobile URL-bar show/hide only changes height slightly; ignore unless width or a big jump changed.
      if (innerWidth === this._width && Math.abs(innerHeight - this.vh) < 120 && document.documentElement.scrollHeight - this.vh === this.maxY) return;
      this._width = innerWidth;
      this.measure();
    }, 150);
  }

  _tick() {
    this._raf = 0;
    const y = Math.min(scrollY, this.maxY);
    if (y === this.y) return;
    this.y = y;
    this.lastMoveAt = performance.now() / 1000;
    for (const fn of this._scrollSubs) fn(this);
  }
}

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
