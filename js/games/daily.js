/* ============================================================
   BASTA PLAY · games/daily.js — Daily Challenge
   Deterministic pick of a mode + seed per calendar day.
   window.Games.daily
   ============================================================ */
(function () {
  "use strict";
  window.Games = window.Games || {};

  function dateSeed() {
    const t = Store.todayStr(); // YYYY-MM-DD
    let h = 2166136261;
    for (let i = 0; i < t.length; i++) { h ^= t.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }

  window.Games.daily = {
    label: "Daily Challenge",
    // Returns {modeId, rnd, played} so the router can show/lock it.
    plan() {
      const seed = dateSeed();
      const rnd = BASTA_DATA.seededRandom(seed);
      const modeIds = ["quiz", "connect", "order", "rapid", "strategy"];
      const modeId = modeIds[Math.floor(rnd() * modeIds.length)];
      const played = Store.get().dailyDate === Store.todayStr();
      return { modeId, seed, played, label: window.Games[modeId].label };
    },
    start(mount, done) {
      const plan = this.plan();
      const rnd = BASTA_DATA.seededRandom(plan.seed);
      // Wrap the chosen game; daily gives a coin bonus on completion.
      window.Games[plan.modeId].start(mount, (res) => {
        res.daily = true;
        res.coins = Math.round(res.coins * 1.5) + 25; // bonus
        res.xp = Math.round(res.xp * 1.5);
        res.detail = "يومي · " + res.detail;
        Store.patch({ dailyDate: Store.todayStr() });
        done(res);
      }, { rnd, count: 5, time: 30, startLen: 3 });
    }
  };
})();
