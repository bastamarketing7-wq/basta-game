/* ============================================================
   BASTA PLAY · games/order.js — رتّب المراحل
   أعِد ترتيب التسلسلات التسويقية. window.Games.order
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

  window.Games.order = {
    label: "رتّب المراحل",
    start(mount, done, opts) {
      opts = opts || {};
      const rnd = opts.rnd || Math.random;
      const rounds = shuffle(BASTA_DATA.ORDERS, rnd).slice(0, opts.count || 4);
      let idx = 0, correct = 0;

      function render() {
        const p = rounds[idx];
        const pct = Math.round((idx / rounds.length) * 100);
        mount.innerHTML = `
          <div class="gscreen">
            <div class="gtop">
              <span class="chip">مرحلة ${idx + 1}/${rounds.length}</span>
              <div class="gtop__spacer"></div>
              <span class="chip chip--score">✓ ${correct}</span>
            </div>
            <div class="progressbar"><span style="width:${pct}%"></span></div>
            <div class="qcard">
              <div class="qcard__q">${esc(p.q)}</div>
              <div class="qcard__hint">💡 ${esc(p.hint)} — اضغط العناصر بالترتيب.</div>
              <div class="seq__slot-lbl">ترتيبك</div>
              <div class="slots" id="slots" aria-live="polite"></div>
              <div class="seq__slot-lbl">الخيارات</div>
              <div class="seq" id="bank"></div>
            </div>
          </div>`;
        const bank = $("#bank"), slots = $("#slots");
        let shuffled = shuffle(p.items, rnd);
        if (shuffled.join() === p.items.join() && p.items.length > 1) shuffled.reverse();
        const placed = [];

        shuffled.forEach((label) => {
          const t = document.createElement("button");
          t.className = "token answer"; t.type = "button"; t.dataset.label = label;
          t.innerHTML = `<span>${esc(label)}</span>`;
          t.addEventListener("click", () => {
            if (t.classList.contains("placed")) return;
            t.classList.add("placed"); Sound.fx("tap");
            placed.push(label);
            const chip = document.createElement("button");
            chip.className = "token"; chip.type = "button";
            chip.innerHTML = `<span class="num">${placed.length}</span><span>${esc(label)}</span>`;
            chip.addEventListener("click", () => {
              const li = placed.indexOf(label);
              if (li > -1) placed.splice(li, 1);
              chip.remove(); t.classList.remove("placed");
              slots.querySelectorAll(".num").forEach((n, i) => n.textContent = i + 1);
            });
            slots.appendChild(chip);
            if (placed.length === p.items.length) check(p, slots, bank);
          });
          bank.appendChild(t);
        });
      }

      function check(p, slots, bank) {
        const placed = Array.from(slots.querySelectorAll(".token")).map(c => c.querySelector("span:last-child").textContent);
        const ok = placed.join() === p.items.join();
        slots.querySelectorAll(".token").forEach((c, i) => {
          c.classList.add(placed[i] === p.items[i] ? "correct" : "wrong");
          c.disabled = true;
        });
        bank.querySelectorAll(".token").forEach(t => t.disabled = true);
        if (ok) { correct++; Sound.fx("win"); } else Sound.fx("wrong");
        setTimeout(next, 1150);
      }

      function next() {
        idx++;
        if (idx >= rounds.length) return finish();
        render();
      }

      function finish() {
        const perfect = correct === rounds.length;
        done({
          mode: "order", won: correct >= Math.ceil(rounds.length / 2), perfect,
          score: correct * 130 + (perfect ? 50 : 0),
          xp: correct * 26 + (perfect ? 40 : 0),
          coins: correct * 7 + (perfect ? 18 : 0),
          detail: `${correct} من ${rounds.length} مراحل صحيحة`
        });
      }

      render();
    }
  };
})();
