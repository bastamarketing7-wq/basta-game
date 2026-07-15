/* ============================================================
   BASTA PLAY · games/strategy.js — Strategy Challenge
   Pick the smartest marketing decision. window.Games.strategy
   ============================================================ */
(function () {
  "use strict";
  window.Games = window.Games || {};
  const { $, esc } = window.UI;

  function shuffle(arr, rnd) {
    const a = arr.slice(); rnd = rnd || Math.random;
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }

  window.Games.strategy = {
    label: "تحدّي الاستراتيجية",
    start(mount, done, opts) {
      opts = opts || {};
      const rnd = opts.rnd || Math.random;
      const rounds = shuffle(BASTA_DATA.STRATEGY, rnd).slice(0, opts.count || 5);
      let idx = 0, points = 0, maxPoints = 0, aces = 0;

      function render() {
        const s = rounds[idx];
        const pct = Math.round((idx / rounds.length) * 100);
        mount.innerHTML = `
          <div class="gscreen">
            <div class="gtop">
              <span class="chip">السيناريو ${idx + 1}/${rounds.length}</span>
              <div class="gtop__spacer"></div>
              <span class="chip chip--score">${points} نقطة</span>
            </div>
            <div class="progressbar"><span style="width:${pct}%"></span></div>
            <div class="qcard">
              <div class="qcard__hint" style="margin-bottom:8px">📋 ${esc(s.context)}</div>
              <div class="qcard__q">${esc(s.scenario)}</div>
              <div class="opts" id="opts" style="margin-top:16px"></div>
              <div id="why"></div>
            </div>
          </div>`;
        const box = $("#opts");
        const order = shuffle(s.options.map((o, i) => ({ o, i })), rnd);
        const bestPts = Math.max(...s.options.map(o => o.pts));
        order.forEach(({ o }, i) => {
          const b = document.createElement("button");
          b.className = "opt"; b.type = "button";
          b.innerHTML = `<span class="opt__key">${String.fromCharCode(65 + i)}</span><span>${esc(o.t)}</span>`;
          b.addEventListener("click", () => pick(o, b, box, s, bestPts));
          box.appendChild(b);
        });
      }

      function pick(o, btn, box, s, bestPts) {
        box.querySelectorAll(".opt").forEach(b => b.disabled = true);
        points += o.pts; maxPoints += bestPts;
        if (o.pts === bestPts) { btn.classList.add("correct"); aces++; Sound.fx("correct"); }
        else if (o.pts === 0) { btn.classList.add("wrong"); Sound.fx("wrong"); }
        else { btn.classList.add("correct"); btn.style.borderColor = "var(--orange)"; Sound.fx("tap"); }
        // reveal best if not chosen
        if (o.pts !== bestPts) {
          const bestOpt = s.options.find(x => x.pts === bestPts);
          box.querySelectorAll(".opt").forEach(b => {
            if (b.querySelector("span:last-child").textContent === bestOpt.t) b.classList.add("correct");
          });
        }
        const why = $("#why");
        why.innerHTML = `<div class="qcard" style="margin-top:14px;background:var(--glass-2)">
          <strong style="color:var(--orange)">السبب:</strong> ${esc(o.why)}
          <div style="margin-top:12px"><button class="btn btn--primary" id="nextS">التالي ←</button></div></div>`;
        $("#nextS").addEventListener("click", () => { Sound.fx("click"); next(); });
      }

      function next() {
        idx++;
        if (idx >= rounds.length) return finish();
        render();
      }

      function finish() {
        const ratio = maxPoints ? points / maxPoints : 0;
        const perfect = aces === rounds.length;
        done({
          mode: "strategy", won: ratio >= 0.6, perfect,
          score: Math.round(points * 40),
          points, maxPoints, aces,
          xp: points * 10 + (perfect ? 40 : 0),
          coins: points * 3 + (perfect ? 15 : 0),
          detail: `${points}/${maxPoints} نقطة استراتيجية · ${aces} قرار مثالي`
        });
      }

      render();
    }
  };
})();
