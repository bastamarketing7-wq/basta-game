/* ============================================================
   BASTA PLAY · storage.js
   LocalStorage persistence + XP/level/coins progression.
   Exposes window.Store
   ============================================================ */
(function () {
  "use strict";
  const KEY = "basta_play_v1";

  const DEFAULT = {
    name: "مسوّق",
    xp: 0,
    coins: 0,
    wins: 0,
    streak: 0,
    lastPlayed: null,     // YYYY-MM-DD
    dailyDate: null,      // last completed daily
    theme: "dark",
    sound: true,
    music: false,
    achievements: {},     // id -> true
    playedModes: {},      // id -> true
    bests: { puzzle: 0, memory: 0, speed: 0, strategy: 0 },
    leaderboard: []       // [{name, score, level, mode, ts}]
  };

  let state = load();

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return { ...DEFAULT };
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT, ...parsed,
        bests: { ...DEFAULT.bests, ...(parsed.bests || {}) },
        achievements: { ...(parsed.achievements || {}) },
        playedModes: { ...(parsed.playedModes || {}) },
        leaderboard: Array.isArray(parsed.leaderboard) ? parsed.leaderboard : []
      };
    } catch (e) {
      return { ...DEFAULT };
    }
  }

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
  }

  function reset() {
    const keepName = state.name;
    const theme = state.theme, sound = state.sound, music = state.music;
    state = { ...DEFAULT, name: keepName, theme, sound, music };
    save();
  }

  /* ---------- Progression ---------- */
  // XP needed to advance FROM `level` to the next.
  function need(level) { return 100 + (level - 1) * 60; }

  function levelInfo(totalXp) {
    let level = 1, remain = totalXp;
    while (remain >= need(level)) { remain -= need(level); level++; }
    const n = need(level);
    return { level, into: remain, need: n, pct: Math.min(100, Math.round((remain / n) * 100)) };
  }

  function get() { return state; }
  function patch(obj) { Object.assign(state, obj); save(); }

  function addXp(amount) {
    const before = levelInfo(state.xp).level;
    state.xp += Math.max(0, Math.round(amount));
    const after = levelInfo(state.xp).level;
    save();
    return { leveledUp: after > before, from: before, to: after };
  }
  function addCoins(n) { state.coins = Math.max(0, state.coins + Math.round(n)); save(); }

  function unlock(id) {
    if (state.achievements[id]) return false;
    state.achievements[id] = true; save(); return true;
  }
  function has(id) { return !!state.achievements[id]; }

  function markMode(id) {
    if (!state.playedModes[id]) { state.playedModes[id] = true; save(); }
  }
  function modesPlayedCount() { return ["puzzle", "memory", "speed", "strategy"].filter(m => state.playedModes[m]).length; }

  function setBest(mode, value) {
    if (value > (state.bests[mode] || 0)) { state.bests[mode] = value; save(); return true; }
    return false;
  }

  /* ---------- Daily streak ---------- */
  function todayStr() {
    const d = new Date();
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }
  function touchStreak() {
    const t = todayStr();
    if (state.lastPlayed === t) return state.streak;
    const y = new Date(); y.setDate(y.getDate() - 1);
    const yest = y.getFullYear() + "-" + String(y.getMonth() + 1).padStart(2, "0") + "-" + String(y.getDate()).padStart(2, "0");
    state.streak = (state.lastPlayed === yest) ? state.streak + 1 : 1;
    state.lastPlayed = t; save();
    return state.streak;
  }

  /* ---------- Leaderboard (local) ---------- */
  function seedLeaderboardIfEmpty() {
    if (state.leaderboard.length) return;
    // Seed with agency-flavoured local rivals so the board never looks empty.
    state.leaderboard = [
      { name: "شبح الاستوديو", score: 940, level: 9, mode: "strategy", ts: 0, bot: true },
      { name: "رحّالة البكسل", score: 820, level: 8, mode: "speed",    ts: 0, bot: true },
      { name: "ناسخ الأفكار",  score: 705, level: 7, mode: "puzzle",   ts: 0, bot: true },
      { name: "بومة النموّ",   score: 610, level: 6, mode: "memory",   ts: 0, bot: true },
      { name: "ثعلب العلامة",  score: 480, level: 5, mode: "strategy", ts: 0, bot: true },
      { name: "حوت النيون",    score: 350, level: 4, mode: "speed",    ts: 0, bot: true }
    ];
    save();
  }
  function addScore(score, mode) {
    const lvl = levelInfo(state.xp).level;
    state.leaderboard.push({ name: state.name || "أنت", score, level: lvl, mode, ts: Date.now(), me: true });
    // keep only best "me" entries + bots; cap 30
    state.leaderboard.sort((a, b) => b.score - a.score);
    state.leaderboard = state.leaderboard.slice(0, 30);
    save();
  }

  window.Store = {
    get, patch, save, reset, load,
    levelInfo, addXp, addCoins, unlock, has,
    markMode, modesPlayedCount, setBest,
    touchStreak, todayStr,
    seedLeaderboardIfEmpty, addScore
  };
})();
