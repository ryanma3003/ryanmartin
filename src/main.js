import './styles.css';
import { ScrollDriver } from './game/ScrollDriver.js';
import { Progression } from './game/Progression.js';
import { HUD } from './game/HUD.js';
import { Chiptune } from './game/Chiptune.js';

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const driver = new ScrollDriver();
const prog = new Progression(driver);
const hud = new HUD(prog, { reducedMotion });
const audio = new Chiptune();

// ---------------------------------------------------------------- sound toggle (off until the user opts in)
const muteBtn = document.getElementById('mute');
const muteLabel = document.getElementById('mute-label');
muteBtn.addEventListener('click', () => {
  const on = audio.toggle();
  muteBtn.setAttribute('aria-pressed', String(on));
  muteLabel.textContent = on ? 'SOUND ON' : 'SOUND OFF';
});

// ---------------------------------------------------------------- game events → HUD + audio
prog.on('defeat', (e) => {
  hud.defeat(e);
  audio.sfx(e.isBoss ? 'victory' : e.kind === 'spikes' ? 'jump' : 'hit');
});
prog.on('bosshit', () => audio.sfx('bosshit'));
prog.on('levelup', (info) => {
  hud.levelUp(info);
  if (!info.victory) audio.sfx('levelup');
});
prog.on('zone', (zone) => audio.setBiome(zone.biome));
audio.setBiome(prog.zone.biome);

// Close the MAP menu after picking a destination.
const map = document.querySelector('.hud-map');
map?.addEventListener('click', (ev) => {
  if (ev.target.closest('a')) map.open = false;
});

// ---------------------------------------------------------------- GPU canvas: lazy, on first sign of life
// The résumé is fully usable before (and without) this. three.js (~230 KB gz) is only fetched once the
// visitor moves, taps, types or scrolls, so the first paint is pure HTML and the main thread stays idle.
function bootEngine() {
  import('./game/GameEngine.js')
    .then(({ GameEngine }) => GameEngine.create({ driver, prog, hud, reducedMotion, container: document.getElementById('stage') }))
    .then((engine) => {
      document.documentElement.dataset.renderer = engine.backendName;
      if (new URLSearchParams(location.search).has('debug')) window.__game = engine;
    })
    .catch((err) => {
      // No WebGPU and no WebGL2 (or init failed): keep the CSS biome backdrops; content is unaffected.
      console.warn('[game] canvas disabled:', err);
      document.documentElement.dataset.renderer = 'none';
    });
}
const BOOT_EVENTS = ['pointermove', 'pointerdown', 'keydown', 'wheel', 'touchstart', 'scroll'];
function bootOnce() {
  for (const type of BOOT_EVENTS) removeEventListener(type, bootOnce);
  bootEngine();
}
for (const type of BOOT_EVENTS) addEventListener(type, bootOnce, { passive: true });
