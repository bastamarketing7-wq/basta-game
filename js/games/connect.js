/* ============================================================
   BASTA PLAY · games/connect.js — وصل المصطلحات
   صِل كل مصطلح بتعريفه الصحيح. window.Games.connect
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

  window.Games.connect = {
    label: "وصل المصطلحات",
    start(mount, done, opts) {
      opts = opts || {};
      const rnd = opts.rnd || Math.random;
      const N = opts.count || 5;
      const pairs = shuffle(BASTA_DATA.TERMS, rnd).slice(0, N).map((p, i) => ({ ...p, id: i }));
      const terms = shuffle(pairs, rnd);
      const defs = shuffle(pairs, rnd);
      let selTerm = null, selDef = null, matched = 0, wrong = 0, lock = false;

      function shell() {
        mount.innerHTML = `
          <div class="gscreen">
            <div class="gtop">
              <span class="chip">وصل المصطلحات</span>
              <div class="gtop__spacer"></div>
              <span class="chip chip--score">${matched}/${N} ✓</span>
            </div>
            <div class="progressbar"><span id="cbar" style="width:0%"></span></div>
            <p class="qcard__hint" style="text-align:center;margin-bottom:14px">اختر مصطلحاً ثم تعريفه الصحيح 🔗</p>
            <div class="connect">
              <div class="connect__col" id="colT">
                <div class="connect__lbl">المصطلح</div>
              </div>
              <div class="connect__col" id="colD">
                <div class="connect__lbl">التعريف</div>
              </div>
            </div>
          </div>`;
        const colT = $("#colT"), colD = $("#colD");
        terms.forEach(p => {
          const b = document.createElement("button");
          b.className = "conn-item"; b.type = "button"; b.dataset.id = p.id; b.dataset.side = "t";
          b.textContent = p.term;
          b.addEventListener("click", () => pick(b, "t"));
          colT.appendChild(b);
        });
        defs.forEach(p => {
          const b = document.createElement("button");
          b.className = "conn-item conn-item--def"; b.type = "button"; b.dataset.id = p.id; b.dataset.side = "d";
          b.textContent = p.def;
          b.addEventListener("click", () => pick(b, "d"));
          colD.appendChild(b);
        });
      }

      function clearSel() {
        mount.querySelectorAll(".conn-item.sel").forEach(e => e.classList.remove("sel"));
        selTerm = null; selDef = null;
      }

      function pick(el, side) {
        if (lock || el.classList.contains("done")) return;
        Sound.fx("tap");
        if (side === "t") {
          mount.querySelectorAll('[data-side="t"].sel').forEach(e => e.classList.remove("sel"));
          selTerm = el; el.classList.add("sel");
        } else {
          mount.querySelectorAll('[data-side="d"].sel').forEach(e => e.classList.remove("sel"));
          selDef = el; el.classList.add("sel");
        }
        if (selTerm && selDef) evaluate();
      }

      function evaluate() {
        lock = true;
        const t = selTerm, d = selDef;
        if (t.dataset.id === d.dataset.id) {
          t.classList.add("done"); d.classList.add("done");
          t.classList.remove("sel"); d.classList.remove("sel");
          Sound.fx("correct");
          matched++;
          const chip = mount.querySelector(".chip--score"); if (chip) chip.textContent = `${matched}/${N} ✓`;
          $("#cbar").style.width = (matched / N * 100) + "%";
          selTerm = null; selDef = null; lock = false;
          if (matched === N) setTimeout(finish, 500);
        } else {
          wrong++;
          t.classList.add("err"); d.classList.add("err");
          Sound.fx("wrong");
          setTimeout(() => { t.classList.remove("err", "sel"); d.classList.remove("err", "sel"); selTerm = null; selDef = null; lock = false; }, 640);
        }
      }

      function finish() {
        Sound.fx("win");
        const perfect = wrong === 0;
        const score = Math.max(120, N * 120 - wrong * 30);
        done({
          mode: "connect", won: true, perfect,
          score,
          xp: 40 + (perfect ? 40 : 0) + Math.max(0, N * 6 - wrong * 4),
          coins: 14 + (perfect ? 16 : 0),
          detail: perfect ? `وصلٌ مثالي — ${N} مصطلحات بلا خطأ` : `${N} مصطلحات · ${wrong} محاولات خاطئة`
        });
      }

      shell();
    }
  };
})();
