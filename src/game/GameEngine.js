// Renderer lifecycle + frame loop.
// three.js WebGPURenderer: WebGPU when available, automatic WebGL2 backend otherwise (add ?webgl to force it).
// Renders a tiny internal framebuffer (~480×270) and lets CSS upscale it with nearest-neighbour.
import { WebGPURenderer, Scene, OrthographicCamera, UnsignedByteType } from 'three/webgpu';
import { AssetLoader } from './AssetLoader.js';
import { SpriteBatch } from './SpriteBatch.js';
import { SceneManager } from './SceneManager.js';
import { PlayerSprite } from './PlayerSprite.js';
import { GROUND } from './BiomeFactory.js';

const IDLE_FPS = 8; // ambient animation (torches, stars) when nothing moves
const TARGET_H = 270;
const TARGET_PORTRAIT_W = 200;

export class GameEngine {
  static async create(opts) {
    const engine = new GameEngine(opts);
    await engine._init();
    return engine;
  }

  constructor({ driver, prog, hud, reducedMotion, container }) {
    this.driver = driver;
    this.prog = prog;
    this.hud = hud;
    this.reducedMotion = reducedMotion;
    this.container = container;
    this.scene = new Scene();
    this.camera = new OrthographicCamera(0, 1, 1, 0, -1, 1);
    this.player = new PlayerSprite();
    this.assets = new AssetLoader();
    this.W = 0;
    this.H = 0;
    this.scale = 1;
    this.anchor = 0;
    this._raf = 0;
    this._lastRender = -1;
    this._dirty = true;
    this._recovering = false;
  }

  get backendName() {
    return this.renderer?.backend?.isWebGPUBackend ? 'webgpu' : 'webgl2';
  }

  async _init() {
    await this._createRenderer();
    this.coreAtlas = await this.assets.load('core');
    this.core = new SpriteBatch(this.coreAtlas, 128, 100);
    this.scene.add(this.core.mesh);
    this.scenes = new SceneManager({ assets: this.assets, driver: this.driver, prog: this.prog, scene: this.scene, onReady: () => this.wake() });
    this.player.level = this.prog.level;

    new ResizeObserver(() => this._resize()).observe(this.container);
    this._resize();

    const now = () => performance.now() / 1000;
    this.prog.on('defeat', (e) => {
      this.scenes.onDefeat(e, now());
      if (e.kind !== 'spikes') this.player.attack(now());
      this.wake();
    });
    this.prog.on('revive', (e) => this.scenes.onRevive(e));
    this.prog.on('bosshit', () => {
      this.scenes.onBossHit(now());
      this.player.attack(now());
    });
    this.prog.on('levelup', () => this.player.levelUp(now()));
    this.prog.on('change', () => this.wake());
    this.hud.project = (e) => this._project(e);

    document.addEventListener('visibilitychange', () => (document.hidden ? this.stop() : this.start()));
    this.reducedMotion.addEventListener('change', () => this.wake());
    this.start();
  }

  async _createRenderer() {
    const canvas = document.createElement('canvas');
    const forceWebGL = new URLSearchParams(location.search).has('webgl');
    const renderer = new WebGPURenderer({
      canvas,
      antialias: false,
      alpha: false,
      forceWebGL,
      powerPreference: 'low-power',
      outputBufferType: UnsignedByteType, // 8-bit is plenty for a 54-colour palette, halves buffer memory
    });
    await renderer.init();
    renderer.setPixelRatio(1); // DPR is irrelevant: we upscale a tiny buffer ourselves
    renderer.setClearColor(0x000000, 1);
    renderer.onDeviceLost = (info) => this._recover(info);
    this.renderer = renderer;
    this.container.replaceChildren(canvas);
    this._stillKey = null;
    if (this.W) this._applySize();
  }

  /** GPU device / WebGL context lost: rebuild the renderer, keep scene, atlases and game state. */
  async _recover(info) {
    if (this._recovering || info?.reason === 'destroyed') return;
    this._recovering = true;
    console.warn('[game] GPU context lost, rebuilding renderer:', info?.message);
    this.stop();
    const old = this.renderer;
    old.onDeviceLost = () => {};
    try {
      old.dispose();
    } catch {}
    for (const entry of this.assets.cache.values()) entry.atlas && (entry.atlas.texture.needsUpdate = true);
    try {
      await this._createRenderer();
      this._recovering = false;
      this.start();
    } catch (err) {
      console.warn('[game] renderer could not be restored; continuing without canvas', err);
      this.container.replaceChildren();
      document.documentElement.dataset.renderer = 'none';
    }
  }

  _resize() {
    const cssW = this.container.clientWidth;
    const cssH = this.container.clientHeight;
    if (!cssW || !cssH) return;
    // Integer upscale factor so every game pixel is an exact square of CSS pixels.
    this.scale = Math.max(1, Math.round(Math.min(cssW / TARGET_PORTRAIT_W, cssH / TARGET_H)));
    this.W = Math.ceil(cssW / this.scale);
    this.H = Math.ceil(cssH / this.scale);
    this.anchor = Math.round(this.W * (this.W > this.H * 1.1 ? 0.64 : 0.5));
    this._applySize();
    this.scenes.resize(this.W, this.H);
    this.wake();
  }

  _applySize() {
    const { W, H, scale } = this;
    this.renderer.setSize(W, H, false);
    Object.assign(this.renderer.domElement.style, { width: `${W * scale}px`, height: `${H * scale}px` });
    this.camera.right = W;
    this.camera.top = H;
    this.camera.updateProjectionMatrix();
  }

  _project(e) {
    if (!this.W) return null;
    const x = (this.scenes.enemyX(e) - this._camX()) * this.scale;
    if (x < 0 || x > innerWidth) return null;
    return { x, y: (this.H - GROUND - 24) * this.scale };
  }

  /** World x of the screen's left edge: the hero (world x = scroll × speed) stands at `anchor`. */
  _camX() {
    return Math.round(this.driver.worldX) - this.anchor;
  }

  wake() {
    this._dirty = true;
    this.start(); // reduced motion has no loop: schedule a single frame
  }

  start() {
    if (this._raf || document.hidden || this._recovering) return;
    this._raf = requestAnimationFrame((ts) => this._frame(ts));
  }

  stop() {
    cancelAnimationFrame(this._raf);
    this._raf = 0;
  }

  _frame(ts) {
    this._raf = 0;
    const t = ts / 1000;
    const still = this.reducedMotion.matches;
    if (still) {
      // Static scene: redraw only when the tableau would differ, then sleep (no loop at all).
      const key = `${this.driver.zoneAt().index}|${this.W}x${this.H}|${this.scenes.loaded.length}|${this.prog.level}`;
      if (key !== this._stillKey) this._render(t, true);
      this._stillKey = key;
      return;
    }
    this._stillKey = null;
    this._raf = requestAnimationFrame((n) => this._frame(n));
    const active = this._dirty || this.driver.isMoving(t) || this.player.busy(t) || this.scenes.busy(t);
    if (!active && t - this._lastRender < 1 / IDLE_FPS) return; // idle: throttle ambient animation
    this._render(t, false);
  }

  _render(t, still) {
    this._dirty = false;
    this._lastRender = t;
    // Reduced motion: the camera snaps to the start of the current zone, so each section shows one static tableau.
    const camX = still ? Math.round(Math.max(0, this.driver.zoneAt().startX)) : this._camX();
    const heroWorld = camX + this.anchor;
    this.player.level = this.prog.level;
    this.player.update(heroWorld, t);

    this.core.begin();
    this.scenes.draw(this.core, camX, t, still);
    const jump = still ? 0 : this.scenes.jumpHeight(heroWorld);
    this.player.draw(this.core, this.anchor, GROUND + jump, t, still);
    if (!still && this.player.flashUntil - t > 0.8) this.core.draw('px_30', 0, 0, { w: this.W, h: this.H, alpha: 0.55 }); // level-up screen flash
    this.core.end();

    this.renderer.render(this.scene, this.camera);
  }
}
