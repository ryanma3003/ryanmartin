// NES status bar + overlays (DOM, not canvas: crisp at any size and works without a GPU).
// Writes to the DOM only when a value actually changed, and only from the scroll rAF.

const TOAST_MS = 1700;
const BANNER_MS = 2000;
const MAX_FLYING = 6;

export class HUD {
  constructor(prog, { reducedMotion }) {
    this.prog = prog;
    this.reducedMotion = reducedMotion; // MediaQueryList
    this.root = document.getElementById('hud');
    this.el = {
      lv: document.getElementById('hud-lv'),
      xp: document.getElementById('hud-xp'),
      xpFill: document.getElementById('hud-xpfill'),
      kills: document.getElementById('hud-kills'),
      zone: document.getElementById('hud-zone'),
      toast: document.getElementById('toast'),
      banner: document.getElementById('levelup'),
      bossPanel: document.querySelector('.boss-panel'),
    };
    this._last = {};
    this._flying = 0;
    this._toastTimer = 0;
    this._bannerTimer = 0;
    /** Maps an enemy to viewport CSS coordinates; replaced by the engine once the canvas runs. */
    this.project = () => ({ x: innerWidth * 0.6, y: innerHeight * 0.8 });
    prog.on('change', () => this.render());
    this.render();
  }

  _set(key, value, apply) {
    if (this._last[key] === value) return;
    this._last[key] = value;
    apply(value);
  }

  render() {
    const p = this.prog;
    const zoneName = p.driver.sectionAt().name;
    this._set('lv', p.level, (v) => {
      this.el.lv.textContent = v;
      this.root.style.setProperty('--lv', Math.min(v, 6));
    });
    this._set('xp', p.xp, (v) => (this.el.xp.textContent = v));
    this._set('xpFill', Math.round(p.levelProgress * 100) / 100, (v) => this.el.xpFill.style.setProperty('--xp', v));
    this._set('kills', p.kills, (v) => (this.el.kills.textContent = `${v}/${p.total}`));
    this._set('zone', zoneName, (v) => (this.el.zone.textContent = v));
    this._set('biome', p.zone.biome, (v) => (document.documentElement.dataset.biome = v));
    if (this.el.bossPanel) this._set('boss', Math.round(p.bossHp * 50) / 50, (v) => this.el.bossPanel.style.setProperty('--boss-hp', v));
  }

  defeat(enemy) {
    const verb = enemy.kind === 'spikes' ? 'CLEARED' : enemy.isBoss ? 'BOSS DEFEATED' : 'DEFEATED';
    this.el.toast.innerHTML = '';
    const em = document.createElement('em');
    em.textContent = `${verb}:`;
    this.el.toast.append(em, ` ${enemy.label} `, Object.assign(document.createElement('em'), { textContent: `+${enemy.xp}XP` }));
    this.el.toast.classList.add('is-on');
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => this.el.toast.classList.remove('is-on'), TOAST_MS);
    this._flyXP(enemy);
  }

  levelUp({ level, zone, victory }) {
    const b = this.el.banner;
    b.textContent = '';
    b.append(victory ? 'VICTORY!' : `LEVEL UP! LV ${level}`);
    const small = document.createElement('small');
    small.textContent = victory ? `LV ${level} · THE FINAL CHALLENGE FALLS` : `ENTERING ${zone.name}`;
    b.append(small);
    b.classList.remove('is-on');
    void b.offsetWidth; // restart the CSS flash
    b.classList.add('is-on');
    clearTimeout(this._bannerTimer);
    this._bannerTimer = setTimeout(() => b.classList.remove('is-on'), BANNER_MS);
  }

  /** "+120XP" sprite that arcs from the defeated enemy into the XP bar. */
  _flyXP(enemy) {
    if (this.reducedMotion.matches || this._flying >= MAX_FLYING) return;
    const from = this.project(enemy);
    if (!from) return;
    const to = this.el.xpFill.parentElement.getBoundingClientRect();
    const el = document.createElement('span');
    el.className = 'xp-fly';
    el.textContent = `+${enemy.xp}`;
    document.body.append(el);
    this._flying++;
    const mid = { x: (from.x + to.left) / 2, y: Math.min(from.y, to.top) - 60 };
    const anim = el.animate(
      [
        { transform: `translate(${from.x}px, ${from.y}px)` },
        { transform: `translate(${mid.x}px, ${mid.y}px)`, offset: 0.45 },
        { transform: `translate(${to.left + to.width / 2}px, ${to.top}px) scale(.6)` },
      ],
      { duration: 750, easing: 'steps(14, end)' },
    );
    anim.onfinish = anim.oncancel = () => {
      el.remove();
      this._flying--;
    };
  }
}
