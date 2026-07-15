/* ============================================================
   BASTA PLAY · games/quiz.js — بنك الأسئلة (اختيار من متعدّد)
   window.Games.quiz
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

  window.Games.quiz = {
    label: "بنك الأسئلة",
    start(mount, done, opts) {
      opts = opts || {};
      const rnd = opts.rnd || Math.random;
      const rounds = shuffle(BASTA_DATA.QBANK, rnd).slice(0, opts.count || 6);
      let idx = 0, correct = 0;

      function render() {
        const item = rounds[idx];
        // اخلط الخيارات مع تتبّع الإجابة الصحيحة
        const opt = shuffle(item.options.map((t, i) => ({ t, ok: i === item.answer })), rnd);
        const pct = Math.round((idx / rounds.length) * 100);
        mount.innerHTML = `
          <div class="gscreen">
            <div class="gtop">
              <span class="chip">سؤال ${idx + 1}/${rounds.length}</span>
              <div class="gtop__spacer"></div>
              <span class="chip chip--score">✓ ${correct}</span>
            </div>
            <div class="progressbar"><span style="width:${pct}%"></span></div>
            <div class="qcard">
              <div class="cat-tag">${esc(item.cat)}</div>
              <div class="qcard__q">${esc(item.q)}</div>
              <div class="opts" id="opts" style="margin-top:16px"></div>
              <div id="why"></div>
            </div>
          </div>`;
        const box = $("#opts");
        opt.forEach((o, i) => {
          const b = document.createElement("button");
          b.className = "opt"; b.type = "button";
          b.innerHTML = `<span class="opt__key">${String.fromCharCode(65 + i)}</span><span>${esc(o.t)}</span>`;
          b.addEventListener("click", () => choose(o, b, box, item));
          box.appendChild(b);
        });
      }

      function choose(o, btn, box, item) {
        const btns = box.querySelectorAll(".opt");
        btns.forEach(b => b.disabled = true);
        if (o.ok) { btn.classList.add("correct"); correct++; Sound.fx("correct"); }
        else {
          btn.classList.add("wrong"); Sound.fx("wrong");
          btns.forEach(b => { if (b.querySelector("span:last-child").textContent === item.options[item.answer]) b.classList.add("correct"); });
        }
        const why = $("#why");
        why.innerHTML = `<div class="whybox"><strong style="color:var(--orange)">الشرح:</strong> ${esc(item.why)}
          <div style="margin-top:12px"><button class="btn btn--primary" id="nextQ">${idx + 1 < rounds.length ? "التالي ←" : "عرض النتيجة ←"}</button></div></div>`;
        $("#nextQ").addEventListener("click", () => { Sound.fx("click"); next(); });
      }

      function next() {
        idx++;
        if (idx >= rounds.length) return finish();
        render();
      }

      function finish() {
        const perfect = correct === rounds.length;
        done({
          mode: "quiz", won: correct >= Math.ceil(rounds.length * 0.6), perfect,
          score: correct * 100 + (perfect ? 60 : 0),
          xp: correct * 24 + (perfect ? 40 : 0),
          coins: correct * 6 + (perfect ? 20 : 0),
          detail: `${correct} من ${rounds.length} إجابات صحيحة`
        });
      }

      render();
    }
  };
})();
