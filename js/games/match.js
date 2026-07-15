/* ============================================================
   BASTA PLAY · games/match.js — لعبة المطابقة (Match Pairs)
   اقلب البطاقات وطابِق أزواج العناصر التسويقية. window.Games.match
   ============================================================ */
(function () {
  "use strict";
  window.Games = window.Games || {};
  const { $ } = window.UI;

  function shuffle(arr, rnd) {
    const a = arr.slice(); rnd = rnd || Math.random;
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }

  window.Games.match = {
    label: "لعبة المطابقة",
    start(mount, done, opts) {
      opts = opts || {};
      const rnd = opts.rnd || Math.random;
      const PAIRS = opts.pairs || 8;                 // 8 أزواج = 16 بطاقة
      const pool = shuffle(BASTA_DATA.MATCH_ICONS, rnd).slice(0, PAIRS);
      let deck = shuffle(pool.concat(pool).map((c, i) => ({ ...c, uid: i })), rnd);

      let first = null, lock = false, matched = 0, moves = 0, time = 0, alive = true, timer = null;

      function shell() {
        mount.innerHTML = `
          <div class="gscreen">
            <div class="gtop">
              <span class="chip chip--timer" id="mtime">⏱ 0ث</span>
              <div class="gtop__spacer"></div>
              <span class="chip">الحركات <b id="mmoves" style="margin-inline-start:4px">0</b></span>
              <span class="chip chip--score">الأزواج <b id="mpairs" style="margin-inline-start:4px">0/${PAIRS}</b></span>
            </div>
            <div class="progressbar"><span id="mbar" style="width:0%"></span></div>
            <p class="qcard__hint" style="text-align:center;margin-bottom:14px">اقلب بطاقتين وطابِق العنصر نفسه ✨</p>
            <div class="match-grid" id="mgridw"></div>
          </div>`;
        const g = $("#mgridw");
        const cols = PAIRS <= 6 ? 3 : 4;
        g.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
        deck.forEach((card) => {
          const el = document.createElement("button");
          el.className = "mcard"; el.type = "button"; el.dataset.uid = card.uid; el.dataset.icon = card.icon;
          el.setAttribute("aria-label", "بطاقة");
          el.innerHTML = `
            <div class="mcard__inner">
              <div class="mcard__face mcard__back">بسطة</div>
              <div class="mcard__face mcard__front" style="background:${card.grad}">
                <span class="mcard__ico">${card.icon}</span>
                <span class="mcard__name">${card.name}</span>
              </div>
            </div>`;
          el.addEventListener("click", () => flip(el, card));
          g.appendChild(el);
        });
      }

      function flip(el, card) {
        if (!alive || lock || el.classList.contains("flip") || el.classList.contains("done")) return;
        el.classList.add("flip"); Sound.fx("tap");
        if (!first) { first = { el, card }; return; }
        // second card
        moves++; $("#mmoves").textContent = moves;
        lock = true;
        if (first.card.icon === card.icon) {
          setTimeout(() => {
            first.el.classList.add("done"); el.classList.add("done");
            first.el.classList.add("pulse"); el.classList.add("pulse");
            Sound.fx("correct");
            matched++;
            $("#mpairs").textContent = matched + "/" + PAIRS;
            $("#mbar").style.width = (matched / PAIRS * 100) + "%";
            first = null; lock = false;
            if (matched === PAIRS) finish();
          }, 380);
        } else {
          Sound.fx("wrong");
          const a = first.el;
          setTimeout(() => { a.classList.remove("flip"); el.classList.remove("flip"); first = null; lock = false; }, 780);
        }
      }

      function tick() { time++; const t = $("#mtime"); if (t) t.textContent = "⏱ " + time + "ث"; }

      function finish() {
        alive = false; clearInterval(timer);
        // نقاط أعلى كلما قلّت الحركات والوقت
        const perfectMoves = PAIRS;                       // الحدّ الأدنى النظري
        const eff = Math.max(0, 1 - (moves - perfectMoves) / (PAIRS * 2));
        const timeBonus = Math.max(0, 1 - time / (PAIRS * 8));
        const score = Math.round(200 + eff * 500 + timeBonus * 300);
        const perfect = moves <= perfectMoves + 2;
        Sound.fx("win");
        done({
          mode: "match", won: true, perfect,
          score,
          xp: 40 + Math.round(eff * 60) + Math.round(timeBonus * 40),
          coins: 15 + Math.round(eff * 25),
          detail: `${PAIRS} أزواج في ${moves} حركة · ${time}ث`
        });
      }

      shell();
      timer = setInterval(() => { if (alive) tick(); }, 1000);
      return { stop() { alive = false; clearInterval(timer); } };
    }
  };
})();
