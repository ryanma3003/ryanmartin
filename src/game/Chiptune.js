// Chiptune synth on WebAudio: pulse + triangle + noise channels, like the NES APU.
// Zero audio files (0 KB). Off by default; the AudioContext is only created by the mute-button click.

const n = (name) => {
  // 'A4' → MIDI number; '-' = rest
  if (name === '-') return 0;
  const m = /^([A-G])(#|b)?(\d)$/.exec(name);
  const semis = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
  return 12 * (Number(m[3]) + 1) + semis;
};
const seq = (s) => s.split(/\s+/).filter(Boolean).map(n);
const hz = (midi) => 440 * 2 ** ((midi - 69) / 12);

// Original 16-step loops (lead / bass) per biome.
const SONGS = {
  title: { bpm: 100, lead: seq('E5 - G5 - C6 - B5 - A5 - G5 - E5 - D5 -'), bass: seq('C3 - - - G2 - - - A2 - - - F2 - G2 -') },
  forest: { bpm: 140, lead: seq('E5 G5 A5 G5 E5 D5 C5 D5 E5 E5 G5 A5 C6 A5 G5 E5'), bass: seq('C3 - G2 - A2 - E2 - F2 - C3 - G2 - G2 -') },
  mountain: { bpm: 112, lead: seq('A4 C5 E5 A5 G5 E5 C5 E5 F4 A4 C5 F5 E5 C5 A4 C5'), bass: seq('A2 - - A2 - - E2 - F2 - - F2 - - G2 -') },
  castle: { bpm: 128, lead: seq('D5 F5 A5 F5 D5 C#5 D5 A4 Bb4 D5 F5 D5 A4 C#5 E5 A4'), bass: seq('D2 D2 - D2 D2 - D2 - Bb1 Bb1 - Bb1 A1 A1 - A1') },
  boss: { bpm: 160, lead: seq('E5 E5 F5 E5 D#5 E5 B4 E5 G5 F#5 F5 E5 D#5 E5 B4 -'), bass: seq('E2 E2 E2 F2 E2 E2 E2 F2 E2 E2 E2 F2 G2 F#2 F2 D#2') },
};

export class Chiptune {
  constructor() {
    this.enabled = false;
    this.ctx = null;
    this.song = SONGS.title;
    this._step = 0;
    this._nextAt = 0;
    this._timer = 0;
    this._lastSfx = 0;
    document.addEventListener('visibilitychange', () => {
      if (!this.ctx) return;
      if (document.hidden) this.ctx.suspend();
      else if (this.enabled) this.ctx.resume();
    });
  }

  /** Must be called from a user gesture (click). Returns the new state. */
  toggle() {
    this.enabled = !this.enabled;
    if (this.enabled) {
      if (!this.ctx) this._init();
      this.ctx.resume();
      this._nextAt = this.ctx.currentTime + 0.05;
      this._timer = setInterval(() => this._schedule(), 50);
    } else {
      clearInterval(this._timer);
      this.ctx?.suspend();
    }
    return this.enabled;
  }

  setBiome(biome) {
    const song = SONGS[biome] ?? SONGS.title;
    if (song === this.song) return;
    this.song = song;
    this._step = 0;
  }

  sfx(name) {
    if (!this.enabled) return;
    const t = this.ctx.currentTime;
    if (name !== 'levelup' && name !== 'victory' && t - this._lastSfx < 0.07) return;
    this._lastSfx = t;
    switch (name) {
      case 'hit':
        this._noise(t, 0.12, 0.25);
        this._tone('square', 880, t, 0.1, 0.12, 220);
        break;
      case 'bosshit':
        this._noise(t, 0.2, 0.3);
        this._tone('square', 300, t, 0.15, 0.14, 80);
        break;
      case 'jump':
        this._tone('square', 300, t, 0.14, 0.1, 900);
        break;
      case 'levelup':
        ['C5', 'E5', 'G5', 'C6', 'G5', 'C6'].forEach((note, i) => this._tone('square', hz(n(note)), t + i * 0.08, 0.09, 0.12));
        break;
      case 'victory':
        ['G4', 'C5', 'E5', 'G5', 'E5', 'G5', 'C6'].forEach((note, i) => this._tone('square', hz(n(note)), t + i * 0.12, i === 6 ? 0.6 : 0.11, 0.13));
        ['C3', 'G3', 'C4'].forEach((note, i) => this._tone('triangle', hz(n(note)), t + i * 0.28, 0.3, 0.2));
        break;
    }
  }

  _init() {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    this.ctx = new Ctx({ latencyHint: 'interactive' });
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.35;
    this.master.connect(this.ctx.destination);
    // 25% duty pulse wave, the classic NES lead timbre.
    const N = 32;
    const real = new Float32Array(N);
    const imag = new Float32Array(N);
    for (let k = 1; k < N; k++) imag[k] = (2 / (k * Math.PI)) * Math.sin(k * Math.PI * 0.25);
    this.pulse = this.ctx.createPeriodicWave(real, imag);
    const len = this.ctx.sampleRate * 0.3;
    this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const ch = this.noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) ch[i] = Math.random() * 2 - 1;
  }

  _schedule() {
    const stepDur = 60 / this.song.bpm / 2; // eighth notes
    while (this._nextAt < this.ctx.currentTime + 0.2) {
      const { lead, bass } = this.song;
      const i = this._step % lead.length;
      if (lead[i]) this._tone('pulse', hz(lead[i]), this._nextAt, stepDur * 0.9, 0.05);
      if (bass[i]) this._tone('triangle', hz(bass[i]), this._nextAt, stepDur * 1.6, 0.12);
      this._step++;
      this._nextAt += stepDur;
    }
  }

  _tone(type, freq, at, dur, vol, slideTo) {
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    if (type === 'pulse') o.setPeriodicWave(this.pulse);
    else o.type = type;
    o.frequency.setValueAtTime(freq, at);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, at + dur);
    g.gain.setValueAtTime(vol, at);
    g.gain.setValueAtTime(vol, at + dur * 0.7);
    g.gain.linearRampToValueAtTime(0, at + dur);
    o.connect(g).connect(this.master);
    o.start(at);
    o.stop(at + dur + 0.02);
  }

  _noise(at, dur, vol) {
    const s = this.ctx.createBufferSource();
    s.buffer = this.noiseBuf;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, at);
    g.gain.exponentialRampToValueAtTime(0.001, at + dur);
    s.connect(g).connect(this.master);
    s.start(at);
    s.stop(at + dur);
  }
}
