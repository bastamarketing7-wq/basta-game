/* ============================================================
   BASTA PLAY · games/puzzle.js — Marketing Puzzle
   Order sequences & pick best answers. window.Games.puzzle
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

  window.Games.puzzle = {
    label: "Marketing Puzzle",
    start(mount, done, opts) {
      opts = opts || {};
      const rnd = opts.rnd || Math.random;
      const pool = shuffle(BASTA_DATA.PUZZLES, rnd);
      const rounds = pool.slice(0, opts.count || 5);
      let idx = 0, correct = 0;

      function render() {
        const p = rounds[idx];
        const pct = Math.round((idx / rounds.length) * 100);
        mount.innerHTML = `
          <div class="gscreen">
            <div class="gtop">
              <span class="chip">Puzzle ${idx + 1}/${rounds.length}</span>
              <div class="gtop__spacer"></div>
              <span class="chip chip--score">✓ ${correct}</span>
            </div>
            <div class="progressbar"><span style="width:${pct}%"></span></div>
            <div class="qcard" id="qc"></div>
          </div>`;
        if (p.type === "order") renderOrder(p); else renderQuiz(p);
      }

      function renderQuiz(p) {
        const qc = $("#qc");
        qc.innerHTML = `
          <div class="qcard__q">${esc(p.q)}</div>
          <div class="qcard__hint">💡 ${esc(p.hint)}</div>
          <div class="opts" id="opts"></div>`;
        const box = $("#opts");
        p.options.forEach((o, i) => {
          const b = document.createElement("button");
          b.className = "opt"; b.type = "button";
          b.innerHTML = `<span class="opt__key">${String.fromCharCode(65 + i)}</span><span>${esc(o)}</span>`;
          b.addEventListener("click", () => choose(i, p, box));
          box.appendChild(b);
        });
      }

      function choose(i, p, box) {
        const btns = box.querySelectorAll(".opt");
        btns.forEach(b => b.disabled = true);
        if (i === p.answer) {
          btns[i].classList.add("correct"); correct++; Sound.fx("correct");
        } else {
          btns[i].classList.add("wrong"); btns[p.answer].classList.add("correct"); Sound.fx("wrong");
        }
        setTimeout(next, 850);
      }

      function renderOrder(p) {
        const qc = $("#qc");
        const shuffled = shuffle(p.items, rnd);
        // avoid an already-correct shuffle
        if (shuffled.join() === p.items.join() && p.items.length > 1) shuffled.reverse();
        const placed = [];
        qc.innerHTML = `
          <div class="qcard__q">${esc(p.q)}</div>
          <div class="qcard__hint">💡 ${esc(p.hint)} — tap items in order.</div>
          <div class="seq__slot-lbl">Your sequence</div>
          <div class="slots" id="slots" aria-live="polite"></div>
          <div class="seq__slot-lbl">Choices</div>
          <div class="seq" id="bank"></div>`;
        const bank = $("#bank"), slots = $("#slots");

        shuffled.forEach((label, i) => {
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
            chip.addEventListener("click", () => { // undo
              const li = placed.indexOf(label);
              if (li > -1) placed.splice(li, 1);
              chip.remove(); t.classList.remove("placed");
              renumber();
            });
            slots.appendChild(chip);
            if (placed.length === p.items.length) check(p, slots, bank);
          });
          bank.appendChild(t);
        });

        function renumber() { slots.querySelectorAll(".num").forEach((n, i) => n.textContent = i + 1); }
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
        setTimeout(next, 1100);
      }

      function next() {
        idx++;
        if (idx >= rounds.length) return finish();
        render();
      }

      function finish() {
        const perfect = correct === rounds.length;
        const score = correct * 100 + (perfect ? 50 : 0);
        done({
          mode: "puzzle", won: correct >= Math.ceil(rounds.length / 2),
          perfect, score, correct, total: rounds.length,
          xp: correct * 22 + (perfect ? 40 : 0),
          coins: correct * 6 + (perfect ? 20 : 0),
          detail: `${correct}/${rounds.length} puzzles solved`
        });
      }

      render();
    }
  };
})();
