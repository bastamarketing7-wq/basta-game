/* ============================================================
   BASTA PLAY · games/memory.js — Memory Challenge
   Watch a brand-tile sequence, reproduce it. window.Games.memory
   ============================================================ */
(function () {
  "use strict";
  window.Games = window.Games || {};
  const { $ } = window.UI;

  window.Games.memory = {
    label: "تحدّي الذاكرة",
    start(mount, done, opts) {
      opts = opts || {};
      const rnd = opts.rnd || Math.random;
      const TILES = BASTA_DATA.MEMORY_TILES;
      let seq = [];
      let input = [];
      let round = 1;
      let accepting = false;
      let alive = true;
      const startLen = opts.startLen || 3;

      function shell() {
        mount.innerHTML = `
          <div class="gscreen speedwrap">
            <div class="gtop">
              <span class="chip chip--score">الجولة ${round}</span>
              <div class="gtop__spacer"></div>
              <span class="chip">الطول ${seq.length || startLen}</span>
            </div>
            <p class="qcard__hint" id="mstatus" style="text-align:center;margin-bottom:14px">راقب جيداً…</p>
            <div class="mgrid" id="mgrid"></div>
          </div>`;
        const grid = $("#mgrid");
        grid.style.gridTemplateColumns = "repeat(3, 1fr)";
        TILES.forEach((t, i) => {
          const b = document.createElement("button");
          b.className = "mtile"; b.type = "button"; b.dataset.i = i;
          b.style.setProperty("--grad", t.grad);
          b.style.setProperty("--glow", t.glow);
          b.setAttribute("aria-label", t.label);
          b.innerHTML = `<span class="mtile__ico">${t.icon}</span>`;
          b.addEventListener("click", () => tap(i, b));
          grid.appendChild(b);
        });
      }

      function status(msg) { const s = $("#mstatus"); if (s) s.textContent = msg; }

      function nextRound() {
        input = [];
        seq.push(Math.floor(rnd() * TILES.length));
        shell();
        status("راقب جيداً…");
        playback();
      }

      function playback() {
        accepting = false;
        let i = 0;
        const gap = Math.max(360, 620 - seq.length * 20);
        const iv = setInterval(() => {
          if (!alive) { clearInterval(iv); return; }
          if (i > 0) unlight(seq[i - 1]);
          if (i >= seq.length) {
            clearInterval(iv);
            setTimeout(() => { if (alive) { accepting = true; status("دورك — أعِد التسلسل"); } }, 260);
            return;
          }
          light(seq[i]); Sound.fx("reveal");
          i++;
        }, gap);
      }

      function light(i) { const el = mount.querySelector(`.mtile[data-i="${i}"]`); if (el) el.classList.add("lit"); }
      function unlight(i) { const el = mount.querySelector(`.mtile[data-i="${i}"]`); if (el) el.classList.remove("lit"); }

      function tap(i, el) {
        if (!accepting || !alive) return;
        el.classList.add("lit"); Sound.fx("tap");
        setTimeout(() => el.classList.remove("lit"), 180);
        input.push(i);
        const pos = input.length - 1;
        if (input[pos] !== seq[pos]) return fail(el);
        el.classList.add("ok"); setTimeout(() => el.classList.remove("ok"), 380);
        if (input.length === seq.length) {
          accepting = false;
          Sound.fx("correct");
          round++;
          status("ممتاز! الجولة التالية…");
          setTimeout(() => { if (alive) nextRound(); }, 820);
        }
      }

      function fail(el) {
        accepting = false; alive = false;
        el.classList.add("err"); Sound.fx("lose");
        status("انكسر التسلسل!");
        // reveal correct next tile briefly
        setTimeout(finish, 900);
      }

      function finish() {
        const reached = seq.length - (alive ? 0 : 1); // last shown length successfully repeated
        const level = Math.max(0, reached);
        const won = level >= startLen + 1;
        done({
          mode: "memory", won,
          score: level * 60,
          level,
          reachedLen: level,
          xp: level * 18,
          coins: level * 5,
          detail: `تذكّرت تسلسلاً من ${level}`
        });
      }

      nextRound();

      // return a stop hook for router cleanup
      return { stop() { alive = false; } };
    }
  };
})();
