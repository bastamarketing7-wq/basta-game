/* ============================================================
   BASTA PLAY · games/rapid.js — سرعة المعرفة (صح / خطأ)
   عبارات تسويقية سريعة ضدّ الساعة. window.Games.rapid
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

  window.Games.rapid = {
    label: "سرعة المعرفة",
    start(mount, done, opts) {
      opts = opts || {};
      const rnd = opts.rnd || Math.random;
      const DURATION = opts.time || 30;
      const deck = shuffle(BASTA_DATA.TF, rnd);
      let i = 0, score = 0, streak = 0, best = 0, timeLeft = DURATION, alive = true, timer = null;

      function shell() {
        mount.innerHTML = `
          <div class="gscreen speedwrap">
            <div class="gtop">
              <span class="chip chip--timer" id="rtimer">⏱ ${DURATION}ث</span>
              <div class="gtop__spacer"></div>
              <span class="chip chip--score" id="rscore">النقاط 0</span>
            </div>
            <div class="progressbar"><span id="rbar" style="width:100%"></span></div>
            <div class="tf-card" id="tfcard"></div>
            <div class="tf-btns">
              <button class="btn tf-true" id="btnTrue">✔ صح</button>
              <button class="btn tf-false" id="btnFalse">✘ خطأ</button>
            </div>
            <p class="tf-streak" id="rstreak"></p>
          </div>`;
        $("#btnTrue").addEventListener("click", () => answer(true));
        $("#btnFalse").addEventListener("click", () => answer(false));
        showCard();
      }

      function showCard() {
        const item = deck[i % deck.length];
        const c = $("#tfcard");
        c.className = "tf-card";
        c.innerHTML = `<span class="tf-card__q">${esc(item.s)}</span>`;
      }

      function answer(val) {
        if (!alive) return;
        const item = deck[i % deck.length];
        const c = $("#tfcard");
        if (val === item.t) {
          score++; streak++; best = Math.max(best, streak);
          Sound.fx("correct");
          c.classList.add("tf-ok");
          $("#rscore").textContent = "النقاط " + score;
          $("#rstreak").textContent = streak >= 3 ? "🔥 سلسلة " + streak : "";
        } else {
          streak = 0; Sound.fx("wrong");
          c.classList.add("tf-no");
          timeLeft = Math.max(0, timeLeft - 2);
          const chip = $("#rtimer"); chip.classList.add("warn"); setTimeout(() => chip.classList.remove("warn"), 400);
          $("#rstreak").textContent = "";
        }
        i++;
        setTimeout(() => { if (alive) showCard(); }, 240);
      }

      function tick() {
        timeLeft--;
        const chip = $("#rtimer"); if (chip) chip.textContent = "⏱ " + timeLeft + "ث";
        const bar = $("#rbar"); if (bar) bar.style.width = (timeLeft / DURATION * 100) + "%";
        if (timeLeft <= 5 && timeLeft > 0) Sound.fx("tick");
        if (timeLeft <= 0) finish();
      }

      function finish() {
        alive = false; clearInterval(timer); Sound.fx(score >= 10 ? "win" : "lose");
        done({
          mode: "rapid", won: score >= 10,
          score: score * 10 + best * 5,
          xp: score * 12 + best * 4,
          coins: score * 4,
          detail: `${score} إجابة صحيحة · أطول سلسلة ${best}`
        });
      }

      shell();
      timer = setInterval(() => { if (alive) tick(); }, 1000);
      return { stop() { alive = false; clearInterval(timer); } };
    }
  };
})();
