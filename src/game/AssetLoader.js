// Loads one PNG-8 sprite atlas per biome on demand and frees it again (ref-counted).
import { Texture, NearestFilter, SRGBColorSpace } from 'three/webgpu';
import manifest from '../assets/atlases/manifest.json';

// Hashed URLs for every atlas, resolved at build time; the files themselves are fetched lazily.
const URLS = import.meta.glob('../assets/atlases/*.png', { query: '?url', import: 'default', eager: true });
const urlFor = (name) => URLS[`../assets/atlases/${name}.png`];

/**
 * @typedef {{u:number, v:number, uw:number, vh:number, w:number, h:number}} Frame  UVs are top-left origin (flipY = false).
 * @typedef {{name:string, texture:Texture, frames:Record<string, Frame>}} Atlas
 */
export class AssetLoader {
  constructor() {
    /** @type {Map<string, {refs:number, promise:Promise<Atlas>, atlas?:Atlas}>} */
    this.cache = new Map();
  }

  /** @returns {Promise<Atlas>} */
  load(name) {
    let entry = this.cache.get(name);
    if (!entry) {
      entry = { refs: 0, promise: null };
      entry.promise = this._fetch(name).then((atlas) => (entry.atlas = atlas));
      this.cache.set(name, entry);
    }
    entry.refs++;
    return entry.promise;
  }

  /** Drop a reference; the GPU texture is disposed when nobody uses the atlas any more. */
  release(name) {
    const entry = this.cache.get(name);
    if (!entry || --entry.refs > 0) return;
    this.cache.delete(name);
    entry.promise.then((atlas) => atlas.texture.dispose(), () => {});
  }

  async _fetch(name) {
    const meta = manifest[name];
    if (!meta) throw new Error(`Unknown atlas "${name}"`);
    const img = new Image();
    img.decoding = 'async';
    img.src = urlFor(name);
    await img.decode();
    const texture = new Texture(img);
    texture.magFilter = NearestFilter;
    texture.minFilter = NearestFilter;
    texture.generateMipmaps = false;
    texture.flipY = false;
    texture.colorSpace = SRGBColorSpace;
    texture.needsUpdate = true;
    const frames = {};
    for (const [key, [x, y, w, h]] of Object.entries(meta.frames)) {
      // Solid swatches get stretched over large areas; sample their inner texels only to avoid edge bleed.
      const inset = key.startsWith('px_') ? 1 : 0;
      frames[key] = { u: (x + inset) / meta.w, v: (y + inset) / meta.h, uw: (w - inset * 2) / meta.w, vh: (h - inset * 2) / meta.h, w, h };
    }
    return { name, texture, frames };
  }
}
