/* ============================================================
   BASTA PLAY · games/speed.js — Speed Challenge
   React fast: tap the target brand element. window.Games.speed
   ============================================================ */
(function () {
  "use strict";
  window.Games = window.Games || {};
  const { $, esc } = window.UI;

  window.Games.speed = {
    label: "Speed Challenge",
    start(mount, done, opts) {
      opts = opts || {};
      const rnd = opts.rnd || Math.random;
      const EL = BASTA_DATA.SPEED_ELEMENTS;
      const DURATION = opts.time || 30;
      let score = 0, misses = 0, best = 0;
      let timeLeft = DURATION;
      let target = null;
      let alive = true;
      let timer = null;

      function shell() {
        mount.innerHTML = `
          <div class="gscreen speedwrap">
            <div class="gtop">
              <span class="chip chip--timer" id="stimer">⏱ ${DURATION}s</span>
              <div class="gtop__spacer"></div>
              <span class="chip chip--score" id="sscore">Score 0</span>
            </div>
            <div class="progressbar"><span id="sbar" style="width:100%"></span></div>
            <div class="speed-target" id="starget"></div>
            <div class="sgrid" id="sgrid"></div>
          </div>`;
      }

      function newTarget() {
        target = EL[Math.floor(rnd() * EL.length)];
        // Build 9 cells, ensure at least one target
        const cells = [];
        const targetPos = Math.floor(rnd() * 9);
        for (let i = 0; i < 9; i++) {
          cells.push(i === targetPos ? target : EL[Math.floor(rnd() * EL.length)]);
        }
        const grid = $("#sgrid"); grid.innerHTML = "";
        cells.forEach((c) => {
          const b = document.createElement("button");
          b.className = "scell"; b.type = "button";
          b.style.background = c.color;
          b.innerHTML = `<span>${c.icon}</span>`;
          b.setAttribute("aria-label", c.name);
          b.addEventListener("click", () => hit(c, b));
          grid.appendChild(b);
        });
        const st = $("#starget");
        st.innerHTML = `Tap the <b style="background:${target.color}">${esc(target.name)}</b>`;
      }

      function hit(c, b) {
        if (!alive) return;
        if (c.icon === target.icon && c.color === target.color) {
          score++; Sound.fx("correct");
          b.classList.add("hit");
          $("#sscore").textContent = "Score " + score;
          newTarget();
        } else {
          misses++; Sound.fx("wrong");
          b.classList.add("miss");
          timeLeft = Math.max(0, timeLeft - 1); // penalty
          const chip = $("#stimer"); chip.classList.add("warn"); setTimeout(() => chip.classList.remove("warn"), 400);
          setTimeout(() => b.classList.remove("miss"), 350);
        }
      }

      function tick() {
        timeLeft--;
        const chip = $("#stimer"); if (chip) chip.textContent = "⏱ " + timeLeft + "s";
        const bar = $("#sbar"); if (bar) bar.style.width = (timeLeft / DURATION * 100) + "%";
        if (timeLeft <= 5 && timeLeft > 0) Sound.fx("tick");
        if (timeLeft <= 0) return finish();
      }

      function finish() {
        alive = false; clearInterval(timer); Sound.fx(score >= 10 ? "win" : "lose");
        done({
          mode: "speed", won: score >= 10,
          score, misses,
          xp: score * 12,
          coins: score * 4,
          detail: `${score} correct taps · ${misses} misses`
        });
      }

      shell(); newTarget();
      timer = setInterval(() => { if (alive) tick(); }, 1000);

      return { stop() { alive = false; clearInterval(timer); } };
    }
  };
})();
