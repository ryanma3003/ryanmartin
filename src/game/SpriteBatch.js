// One atlas → one InstancedMesh → one draw call. Sprites are re-submitted every frame (immediate mode);
// only the visible ones are written, so the buffers stay tiny.
import { InstancedMesh, PlaneGeometry, MeshBasicNodeMaterial, InstancedBufferAttribute, DynamicDrawUsage } from 'three/webgpu';
import { texture, uv, instancedDynamicBufferAttribute, vec2, vec3, mix } from 'three/tsl';

// Shared by every batch: a unit quad with its origin at the bottom-left corner.
let quad = null;
const sharedQuad = () => (quad ??= new PlaneGeometry(1, 1).translate(0.5, 0.5, 0));

export class SpriteBatch {
  /** @param {import('./AssetLoader.js').Atlas} atlas */
  constructor(atlas, capacity, renderOrder = 0) {
    this.atlas = atlas;
    this.capacity = capacity;
    this.n = 0;
    this.rectAttr = new InstancedBufferAttribute(new Float32Array(capacity * 4), 4).setUsage(DynamicDrawUsage);
    this.fxAttr = new InstancedBufferAttribute(new Float32Array(capacity * 4), 4).setUsage(DynamicDrawUsage);

    // TSL: per-instance atlas rect + effects (x = white flash, y = alpha, z = mirror).
    const rect = instancedDynamicBufferAttribute(this.rectAttr);
    const fx = instancedDynamicBufferAttribute(this.fxAttr);
    const q = uv();
    const lx = mix(q.x, q.x.oneMinus(), fx.z);
    const st = vec2(rect.x.add(lx.mul(rect.z)), rect.y.add(q.y.oneMinus().mul(rect.w)));
    const texel = texture(atlas.texture, st);
    const material = new MeshBasicNodeMaterial({ transparent: true, depthTest: false, depthWrite: false });
    material.colorNode = mix(texel.rgb, vec3(1), fx.x);
    material.opacityNode = texel.a.mul(fx.y);
    material.alphaTest = 0.01;

    this.mesh = new InstancedMesh(sharedQuad(), material, capacity);
    this.mesh.instanceMatrix.setUsage(DynamicDrawUsage);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = renderOrder;
    this.mesh.count = 0;
    this.matrices = this.mesh.instanceMatrix.array;
  }

  begin() {
    this.n = 0;
  }

  /**
   * Queue a sprite. x/y = bottom-left in game pixels.
   * opts: w/h override size (stretch), scale, sy (vertical squash), flip, flash 0..1, alpha 0..1, clipL/clipR (screen-space x).
   */
  draw(frameName, x, y, opts) {
    const f = this.atlas.frames[frameName];
    if (!f || this.n >= this.capacity) return;
    const scale = opts?.scale ?? 1;
    let w = (opts?.w ?? f.w) * scale;
    const h = (opts?.h ?? f.h) * scale * (opts?.sy ?? 1);
    let u = f.u;
    let uw = f.uw;
    const flip = opts?.flip ? 1 : 0;
    // Horizontal clipping keeps each biome inside its own stretch of the world.
    const cl = opts?.clipL ?? -Infinity;
    const cr = opts?.clipR ?? Infinity;
    if (x >= cr || x + w <= cl || h <= 0) return;
    if (x < cl || x + w > cr) {
      const a = Math.max(0, cl - x) / w;
      const b = Math.max(0, x + w - cr) / w;
      u += (flip ? b : a) * uw;
      uw *= 1 - a - b;
      x += a * w;
      w *= 1 - a - b;
    }
    const i = this.n++;
    const m = this.matrices;
    const o = i * 16;
    m[o] = w; m[o + 1] = 0; m[o + 2] = 0; m[o + 3] = 0;
    m[o + 4] = 0; m[o + 5] = h; m[o + 6] = 0; m[o + 7] = 0;
    m[o + 8] = 0; m[o + 9] = 0; m[o + 10] = 1; m[o + 11] = 0;
    m[o + 12] = x; m[o + 13] = y; m[o + 14] = 0; m[o + 15] = 1;
    const r = this.rectAttr.array;
    r[i * 4] = u;
    r[i * 4 + 1] = f.v;
    r[i * 4 + 2] = uw;
    r[i * 4 + 3] = f.vh;
    const e = this.fxAttr.array;
    e[i * 4] = opts?.flash ?? 0;
    e[i * 4 + 1] = opts?.alpha ?? 1;
    e[i * 4 + 2] = flip;
    e[i * 4 + 3] = 0;
  }

  end() {
    const n = this.n;
    this.mesh.count = n;
    this.mesh.visible = n > 0;
    if (!n) return;
    for (const [attr, size] of [[this.mesh.instanceMatrix, 16], [this.rectAttr, 4], [this.fxAttr, 4]]) {
      attr.clearUpdateRanges();
      attr.addUpdateRange(0, n * size);
      attr.needsUpdate = true;
    }
  }

  dispose() {
    this.mesh.material.dispose();
    this.mesh.dispose();
  }
}
