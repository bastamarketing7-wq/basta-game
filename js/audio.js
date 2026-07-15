/* ============================================================
   BASTA PLAY · audio.js
   Synthesized sound effects + ambient background music via
   the Web Audio API — no external audio files. Exposes window.Sound
   ============================================================ */
(function () {
  "use strict";
  let ctx = null;
  let master = null;
  let musicGain = null;
  let musicOn = false;
  let musicTimer = null;
  let sfxOn = true;

  function ensure() {
    if (ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.9;
    master.connect(ctx.destination);
    musicGain = ctx.createGain();
    musicGain.gain.value = 0.0;
    musicGain.connect(master);
  }

  function resume() { if (ctx && ctx.state === "suspended") ctx.resume(); }

  // Single tone
  function tone(freq, dur, type, when, vol, glideTo) {
    if (!ctx) return;
    const t0 = ctx.currentTime + (when || 0);
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type || "sine";
    osc.frequency.setValueAtTime(freq, t0);
    if (glideTo) osc.frequency.exponentialRampToValueAtTime(glideTo, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol || 0.25, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g); g.connect(master);
    osc.start(t0); osc.stop(t0 + dur + 0.02);
  }

  const FX = {
    click:   () => tone(520, 0.07, "triangle", 0, 0.16),
    tap:     () => tone(660, 0.06, "sine", 0, 0.14),
    correct: () => { tone(660, 0.12, "sine", 0, 0.2); tone(880, 0.16, "sine", 0.09, 0.2); },
    wrong:   () => { tone(200, 0.22, "sawtooth", 0, 0.18, 120); },
    coin:    () => { tone(988, 0.08, "square", 0, 0.14); tone(1319, 0.12, "square", 0.06, 0.14); },
    level:   () => { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.18, "triangle", i * 0.09, 0.2)); },
    win:     () => { [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, 0.22, "sine", i * 0.1, 0.22)); },
    lose:    () => { [392, 330, 262].forEach((f, i) => tone(f, 0.24, "sawtooth", i * 0.12, 0.16)); },
    tick:    () => tone(1200, 0.04, "sine", 0, 0.08),
    reveal:  () => tone(440, 0.1, "sine", 0, 0.12, 720),
    badge:   () => { [659, 988, 1319].forEach((f, i) => tone(f, 0.2, "triangle", i * 0.08, 0.2)); }
  };

  function fx(name) {
    if (!sfxOn) return;
    ensure(); resume();
    if (FX[name]) FX[name]();
  }

  /* ---------- Ambient music ----------
     A gentle, evolving arpeggio in the brand's mood (blue/orange = calm/warm). */
  const SCALE = [261.63, 329.63, 392.0, 523.25, 659.25, 784.0];
  let step = 0;
  function loopMusic() {
    if (!musicOn || !ctx) return;
    const now = ctx.currentTime;
    // bass pad
    const padOsc = ctx.createOscillator();
    const padG = ctx.createGain();
    padOsc.type = "sine";
    padOsc.frequency.value = 130.81;
    padG.gain.setValueAtTime(0.0001, now);
    padG.gain.linearRampToValueAtTime(0.05, now + 0.6);
    padG.gain.linearRampToValueAtTime(0.0001, now + 1.8);
    padOsc.connect(padG); padG.connect(musicGain);
    padOsc.start(now); padOsc.stop(now + 2);

    // arpeggio note
    const f = SCALE[step % SCALE.length];
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "triangle";
    o.frequency.value = f;
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(0.09, now + 0.05);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.9);
    o.connect(g); g.connect(musicGain);
    o.start(now); o.stop(now + 1);
    step++;
    musicTimer = setTimeout(loopMusic, 460);
  }

  function setMusic(on) {
    ensure(); resume();
    musicOn = on;
    if (!musicGain) return musicOn;
    if (on) {
      musicGain.gain.cancelScheduledValues(ctx.currentTime);
      musicGain.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.8);
      clearTimeout(musicTimer);
      loopMusic();
    } else {
      musicGain.gain.linearRampToValueAtTime(0.0, ctx.currentTime + 0.4);
      clearTimeout(musicTimer);
    }
    return musicOn;
  }
  function toggleMusic() { return setMusic(!musicOn); }
  function setSfx(on) { sfxOn = on; }
  function isMusicOn() { return musicOn; }

  // Unlock audio on first user gesture (autoplay policies)
  function primeOnGesture() {
    const kick = () => { ensure(); resume(); window.removeEventListener("pointerdown", kick); window.removeEventListener("keydown", kick); };
    window.addEventListener("pointerdown", kick, { once: false });
    window.addEventListener("keydown", kick, { once: false });
  }

  window.Sound = { fx, setMusic, toggleMusic, isMusicOn, setSfx, primeOnGesture };
})();
