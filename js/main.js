/* ============================================================
   BASTA PLAY · main.js — متحكّم التطبيق والموجّه
   التحميل، التنقّل، الشاشات، منطق المكافآت والأوسمة.
   ============================================================ */
(function () {
  "use strict";
  const { $, $$ } = window.UI;
  let activeGame = null; // يحمل {stop} للتنظيف

  const MODE_AR = { quiz: "بنك الأسئلة", connect: "وصل المصطلحات", order: "رتّب المراحل", rapid: "سرعة المعرفة", strategy: "تحدّي الاستراتيجية", daily: "التحدّي اليومي" };

  /* ---------- شاشة التحميل ---------- */
  function runLoader() {
    const loader = $("#loader"), fill = $(".loader__fill"), pct = $(".loader__pct"), app = $("#app");
    let p = 0;
    const iv = setInterval(() => {
      p += Math.random() * 16 + 6;
      if (p >= 100) { p = 100; clearInterval(iv); setTimeout(boot, 350); }
      if (fill) fill.style.width = p + "%";
      if (pct) pct.textContent = Math.floor(p) + "%";
    }, 180);
    function boot() {
      loader.classList.add("done");
      app.hidden = false;
      setTimeout(() => { loader.remove(); }, 650);
      init();
    }
  }

  /* ---------- الإقلاع والربط ---------- */
  function init() {
    const s = Store.get();
    Store.seedLeaderboardIfEmpty();
    UI.applyTheme(s.theme);
    UI.renderHUD();
    UI.attachRipples();
    Sound.primeOnGesture();
    Sound.setSfx(s.sound);
    bindChrome();
    if (s.music) { $("#btn-music").setAttribute("aria-pressed", "true"); }
    if (!localStorage.getItem("basta_named")) askName(); else nav("home");
    window.addEventListener("keydown", globalKeys);
  }

  function askName() {
    UI.modal(`
      <h3>أهلاً بك في بسطة بلاي 👋</h3>
      <p>تجربة الألعاب التسويقية المميّزة. بأي اسم نناديك في قائمة المتصدّرين؟</p>
      <div class="field"><label for="pname">اسمك</label>
        <input id="pname" maxlength="18" placeholder="مثال: بسطة برو" value="${UI.esc(Store.get().name === 'مسوّق' ? '' : Store.get().name)}"/></div>
      <button class="btn btn--primary btn--block" id="startBtn">لنبدأ اللعب ←</button>`);
    const go = () => {
      const v = ($("#pname").value || "").trim().slice(0, 18) || "مسوّق";
      Store.patch({ name: v });
      localStorage.setItem("basta_named", "1");
      UI.closeModal(); UI.renderHUD(); Sound.fx("win"); UI.confetti(80);
      nav("home");
    };
    $("#startBtn").addEventListener("click", go);
    $("#pname").addEventListener("keydown", e => { if (e.key === "Enter") go(); });
  }

  function bindChrome() {
    $("#brand-home").addEventListener("click", () => nav("home"));
    $("#btn-menu").addEventListener("click", () => toggleDrawer(true));
    $("#drawer-close").addEventListener("click", () => toggleDrawer(false));
    $("#scrim").addEventListener("click", () => toggleDrawer(false));
    $$(".drawer__link").forEach(b => b.addEventListener("click", () => { toggleDrawer(false); nav(b.dataset.nav); }));
    $("#btn-reset").addEventListener("click", confirmReset);

    $("#btn-theme").addEventListener("click", () => {
      const cur = Store.get().theme === "light" ? "dark" : "light";
      Store.patch({ theme: cur }); UI.applyTheme(cur); Sound.fx("click");
    });
    const bs = $("#btn-sound");
    bs.addEventListener("click", () => {
      const on = !(Store.get().sound);
      Store.patch({ sound: on }); Sound.setSfx(on);
      bs.setAttribute("aria-pressed", String(on)); if (on) Sound.fx("click");
    });
    bs.setAttribute("aria-pressed", String(Store.get().sound));
    const bm = $("#btn-music");
    bm.addEventListener("click", () => {
      const on = Sound.toggleMusic();
      Store.patch({ music: on });
      bm.setAttribute("aria-pressed", String(on)); Sound.fx("click");
    });
  }

  function toggleDrawer(open) {
    const d = $("#drawer"), sc = $("#scrim");
    d.classList.toggle("open", open);
    d.setAttribute("aria-hidden", String(!open));
    sc.hidden = !open;
    if (open) Sound.fx("click");
  }

  function confirmReset() {
    UI.modal(`<h3>تصفير التقدّم؟</h3><p>سيؤدّي هذا إلى مسح خبرتك وعملاتك وأوسمتك ونقاطك في المتصدّرين. يبقى اسمك وإعداداتك كما هي. لا يمكن التراجع عن هذا.</p>
      <div style="display:flex;gap:10px;flex-wrap:wrap">
        <button class="btn btn--accent" id="doReset">نعم، صفّر</button>
        <button class="btn btn--ghost" data-close>إلغاء</button></div>`);
    $("#doReset").addEventListener("click", () => {
      Store.reset(); Store.seedLeaderboardIfEmpty(); UI.renderHUD(); UI.closeModal();
      UI.toast({ icon: "♻️", title: "تم تصفير التقدّم", desc: "بداية جديدة — بالتوفيق!" });
      nav("home");
    });
  }

  function globalKeys(e) {
    if (e.target.matches("input, textarea")) return;
    if (e.key === "Escape") { if ($("#drawer").classList.contains("open")) toggleDrawer(false); }
    // أرقام لاختيار الخيارات في الألعاب
    if (/^[1-9]$/.test(e.key)) {
      const opts = $$(".opts .opt:not(:disabled), .sgrid .scell, .seq .token:not(.placed)");
      const i = parseInt(e.key) - 1;
      if (opts[i]) opts[i].click();
    }
    if (e.key.toLowerCase() === "m") $("#btn-music").click();
    if (e.key.toLowerCase() === "t") $("#btn-theme").click();
  }

  /* ---------- الموجّه ---------- */
  function stopActive() { if (activeGame && activeGame.stop) { try { activeGame.stop(); } catch (e) {} } activeGame = null; }

  function nav(route, arg) {
    stopActive();
    const view = $("#view");
    view.classList.add("view-out");
    setTimeout(() => {
      view.classList.remove("view-out");
      view.scrollTop = 0; window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
      const map = { home: home, achievements: achievements, leaderboard: leaderboard, stats: stats, how: howto };
      if (map[route]) map[route](view);
      else if (route === "play") startGame(arg, view);
      else if (route === "daily") startDaily(view);
      else home(view);
      view.focus({ preventScroll: true });
    }, 130);
  }
  window.__navBasta = nav;

  /* ---------- الرئيسية ---------- */
  function home(view) {
    const s = Store.get();
    const info = Store.levelInfo(s.xp);
    const dp = window.Games.daily.plan();
    view.innerHTML = `
      <section class="hero">
        <span class="hero__badge"><span class="dot"></span> بسطة للتسويق · تجربة مميّزة</span>
        <img class="hero__logo" src="${window.LOGO_FULL || 'assets/logo-full.jpeg'}" alt="شعار وكالة بسطة للتسويق" />
        <h1 class="hero__title">العب. تعلّم. <span class="grad">سوّق بذكاء.</span></h1>
        <p class="hero__sub">تجربة تسويقية تفاعلية — ألغاز وذاكرة وسرعة واستراتيجية، بروح علامة بسطة.</p>
        <p class="hero__ar" dir="rtl">نصنع التجربة ويستمر الأثر</p>
      </section>

      <div class="statstrip stagger">
        <div class="stat"><div class="stat__num c-b">${info.level}</div><div class="stat__lbl">المستوى</div></div>
        <div class="stat"><div class="stat__num">${s.xp}</div><div class="stat__lbl">إجمالي الخبرة</div></div>
        <div class="stat"><div class="stat__num c-o">${s.coins}</div><div class="stat__lbl">العملات</div></div>
        <div class="stat"><div class="stat__num">${s.streak}🔥</div><div class="stat__lbl">سلسلة الأيام</div></div>
      </div>

      <div class="sec-head"><h2>اختر تحدّيك</h2><span class="pill">${Store.modesPlayedCount()}/${Store.modesTotal()} أوضاع جُرّبت</span></div>
      <div class="modes stagger" id="modes"></div>`;

    const wrap = $("#modes");
    const daily = document.createElement("button");
    daily.className = "mode mode--daily"; daily.style.setProperty("--tint", "#F97316");
    daily.innerHTML = `
      <div class="mode__ico">📅</div>
      <div class="mode__body">
        <div class="mode__title">التحدّي اليومي ${dp.played ? "✓" : ""}</div>
        <div class="mode__desc">${dp.played ? "انتهيت اليوم — عُد غداً لتحدٍّ جديد." : "مفاجأة اليوم: <b>" + UI.esc(MODE_AR[dp.modeId]) + "</b>. عملات وخبرة إضافية!"}</div>
      </div>
      <div class="mode__cta"><span class="btn ${dp.played ? "btn--ghost" : "btn--accent"}">${dp.played ? "أعِد اللعب" : "العب اليومي"} ←</span></div>`;
    daily.addEventListener("click", () => { Sound.fx("click"); startDaily(view); });
    wrap.appendChild(daily);

    BASTA_DATA.MODES.forEach(m => {
      const best = s.bests[m.id] || 0;
      const el = document.createElement("button");
      el.className = "mode"; el.style.setProperty("--tint", m.tint);
      el.innerHTML = `
        <div class="mode__ico">${m.icon}</div>
        <div class="mode__title">${m.title}</div>
        <div class="mode__desc">${m.desc}</div>
        <div class="mode__foot">
          <span class="mode__tag">${m.tag}${best ? " · الأفضل " + best : ""}</span>
          <span class="mode__go">العب <span aria-hidden="true">←</span></span>
        </div>`;
      el.addEventListener("click", () => { Sound.fx("click"); nav("play", m.id); });
      wrap.appendChild(el);
    });
  }

  /* ---------- تشغيل الألعاب ---------- */
  function gameHeader(title, sub) {
    return `<button class="backbtn" id="gback">القائمة ⟲</button>
      <div class="sec-head" style="margin-top:14px"><h2>${UI.esc(title)}</h2>${sub ? `<span class="pill">${UI.esc(sub)}</span>` : ""}</div>`;
  }

  function startGame(modeId, view, isDaily) {
    Store.markMode(modeId);
    Store.unlock("first_play") && UI.celebrateBadge("first_play");
    Store.touchStreak();
    const game = window.Games[modeId];
    view.innerHTML = gameHeader(game.label, isDaily ? "يومي" : "");
    const stage = document.createElement("div");
    view.appendChild(stage);
    $("#gback").addEventListener("click", () => { Sound.fx("click"); nav("home"); });
    const handle = game.start(stage, (res) => finishGame(res, view), isDaily ? undefined : { count: 5, time: 30, startLen: 3 });
    if (handle) activeGame = handle;
  }

  function startDaily(view) {
    const dp = window.Games.daily.plan();
    Store.markMode(dp.modeId);
    Store.unlock("first_play") && UI.celebrateBadge("first_play");
    Store.touchStreak();
    view.innerHTML = gameHeader("التحدّي اليومي", MODE_AR[dp.modeId]);
    const stage = document.createElement("div");
    view.appendChild(stage);
    $("#gback").addEventListener("click", () => { Sound.fx("click"); nav("home"); });
    const handle = window.Games.daily.start(stage, (res) => finishGame(res, view));
    if (handle) activeGame = handle;
  }

  /* ---------- الإنهاء والمكافآت ---------- */
  function finishGame(res, view) {
    activeGame = null;
    UI.grant(res.xp, res.coins);
    if (res.won) { const st = Store.get(); Store.patch({ wins: (st.wins || 0) + 1 }); }
    Store.setBest(res.mode, res.score);
    Store.addScore(res.score, res.mode);
    checkAchievements(res);

    const won = res.won;
    if (won) { Sound.fx("win"); UI.confetti(160); } else Sound.fx("lose");

    view.innerHTML = `
      <div class="qcard result">
        <div class="result__ico">${won ? "🎉" : "💪"}</div>
        <div class="result__title ${won ? "win" : ""}">${won ? "أداء رائع!" : "محاولة جيّدة!"}</div>
        <div class="result__sub">${UI.esc(res.detail || "")}${res.daily ? " · مكافأة يومية مُضافة" : ""}</div>
        <div class="result__grid">
          <div class="reward"><div class="reward__v">${res.score}</div><div class="reward__l">النقاط</div></div>
          <div class="reward"><div class="reward__v xp">+${res.xp}</div><div class="reward__l">خبرة</div></div>
          <div class="reward"><div class="reward__v coin">+${res.coins}</div><div class="reward__l">عملات</div></div>
        </div>
        <div class="result__cta">
          <button class="btn btn--primary btn--lg" id="again">العب مرّة أخرى</button>
          <button class="btn btn--ghost btn--lg" id="lb">🏆 المتصدّرون</button>
          <button class="btn btn--ghost btn--lg" id="menu">القائمة</button>
        </div>
      </div>`;
    $("#again").addEventListener("click", () => { Sound.fx("click"); res.daily ? startDaily(view) : nav("play", res.mode); });
    $("#lb").addEventListener("click", () => { Sound.fx("click"); nav("leaderboard"); });
    $("#menu").addEventListener("click", () => { Sound.fx("click"); nav("home"); });
  }

  function checkAchievements(res) {
    const s = Store.get();
    const info = Store.levelInfo(s.xp);
    const pop = (id) => { if (Store.unlock(id)) UI.celebrateBadge(id); };
    if (res.mode === "quiz" && res.perfect) pop("quiz_ace");
    if (res.mode === "connect" && res.perfect) pop("connect_pro");
    if (res.mode === "order" && res.perfect) pop("order_pro");
    if (res.mode === "rapid" && res.score >= 150) pop("rapid_demon");
    if (res.mode === "strategy" && res.perfect) pop("strategist");
    if (res.daily) pop("daily");
    if (s.streak >= 3) pop("streak3");
    if (s.coins >= 100) pop("coin100");
    if (info.level >= 5) pop("level5");
    if (info.level >= 10) pop("level10");
    if (Store.modesPlayedCount() >= Store.modesTotal()) pop("allmodes");
    if ((s.wins || 0) >= 15) pop("expert");
  }

  /* ---------- الأوسمة ---------- */
  function achievements(view) {
    const s = Store.get();
    const unlocked = BASTA_DATA.ACHIEVEMENTS.filter(a => s.achievements[a.id]).length;
    view.innerHTML = `
      <button class="backbtn" id="b">القائمة ⟲</button>
      <div class="sec-head" style="margin-top:14px"><h2>🏅 الأوسمة</h2><span class="pill">${unlocked}/${BASTA_DATA.ACHIEVEMENTS.length} مفتوحة</span></div>
      <div class="badge-grid stagger" id="bg"></div>`;
    $("#b").addEventListener("click", () => nav("home"));
    const bg = $("#bg");
    BASTA_DATA.ACHIEVEMENTS.forEach(a => {
      const on = !!s.achievements[a.id];
      const el = document.createElement("div");
      el.className = "badge " + (on ? "unlocked" : "locked");
      el.innerHTML = `${on ? "" : '<span class="badge__lock">🔒</span>'}
        <div class="badge__ico">${a.icon}</div>
        <div class="badge__name">${a.name}</div>
        <div class="badge__desc">${a.desc}</div>`;
      bg.appendChild(el);
    });
  }

  /* ---------- المتصدّرون ---------- */
  function leaderboard(view) {
    const s = Store.get();
    const rows = s.leaderboard.slice().sort((a, b) => b.score - a.score).slice(0, 15);
    view.innerHTML = `
      <button class="backbtn" id="b">القائمة ⟲</button>
      <div class="sec-head" style="margin-top:14px"><h2>🏆 المتصدّرون</h2><span class="pill">محلي · أفضل ${rows.length}</span></div>
      <div class="lb stagger" id="lb"></div>`;
    $("#b").addEventListener("click", () => nav("home"));
    const box = $("#lb");
    if (!rows.length) { box.innerHTML = `<div class="empty"><div class="empty__ico">🏅</div>لا نقاط بعد — العب جولة!</div>`; return; }
    rows.forEach((r, i) => {
      const el = document.createElement("div");
      el.className = "lb__row" + (r.me ? " me" : "");
      el.innerHTML = `<div class="lb__rank">${i + 1}</div>
        <div class="lb__name">${UI.esc(r.name)}${r.me ? " <span class='lb__lvl'>(أنت)</span>" : ""}<div class="lb__lvl">مستوى ${r.level} · ${UI.esc(MODE_AR[r.mode] || r.mode)}</div></div>
        <div class="lb__score">${r.score}</div>`;
      box.appendChild(el);
    });
  }

  /* ---------- الإحصائيات ---------- */
  function stats(view) {
    const s = Store.get();
    const info = Store.levelInfo(s.xp);
    const unlocked = BASTA_DATA.ACHIEVEMENTS.filter(a => s.achievements[a.id]).length;
    view.innerHTML = `
      <button class="backbtn" id="b">القائمة ⟲</button>
      <div class="sec-head" style="margin-top:14px"><h2>📊 إحصائيات ${UI.esc(s.name)}</h2><span class="pill">${UI.rankName(info.level)}</span></div>
      <div class="statstrip stagger" style="grid-template-columns:repeat(3,1fr)">
        <div class="stat"><div class="stat__num c-b">${info.level}</div><div class="stat__lbl">المستوى</div></div>
        <div class="stat"><div class="stat__num">${s.xp}</div><div class="stat__lbl">إجمالي الخبرة</div></div>
        <div class="stat"><div class="stat__num c-o">${s.coins}</div><div class="stat__lbl">العملات</div></div>
        <div class="stat"><div class="stat__num">${s.wins || 0}</div><div class="stat__lbl">الانتصارات</div></div>
        <div class="stat"><div class="stat__num">${s.streak}</div><div class="stat__lbl">السلسلة</div></div>
        <div class="stat"><div class="stat__num">${unlocked}</div><div class="stat__lbl">الأوسمة</div></div>
      </div>
      <div class="sec-head"><h2>أفضل النقاط</h2></div>
      <div class="statstrip stagger" style="grid-template-columns:repeat(auto-fit,minmax(84px,1fr))">
        <div class="stat"><div class="stat__num c-b">${s.bests.quiz || 0}</div><div class="stat__lbl">الأسئلة</div></div>
        <div class="stat"><div class="stat__num c-o">${s.bests.connect || 0}</div><div class="stat__lbl">الوصل</div></div>
        <div class="stat"><div class="stat__num c-b">${s.bests.order || 0}</div><div class="stat__lbl">الترتيب</div></div>
        <div class="stat"><div class="stat__num c-o">${s.bests.rapid || 0}</div><div class="stat__lbl">السرعة</div></div>
        <div class="stat"><div class="stat__num c-b">${s.bests.strategy || 0}</div><div class="stat__lbl">الاستراتيجية</div></div>
      </div>`;
    $("#b").addEventListener("click", () => nav("home"));
  }

  /* ---------- كيف تلعب ---------- */
  function howto(view) {
    view.innerHTML = `
      <button class="backbtn" id="b">القائمة ⟲</button>
      <div class="sec-head" style="margin-top:14px"><h2>❓ كيف تلعب</h2></div>
      <div class="qcard">
        <ul class="rules">
          <li><b>🎓 بنك الأسئلة</b> — عشرات الأسئلة المتخصّصة في التسويق مع شرح لكل إجابة. اختر الإجابة (الأرقام 1–4).</li>
          <li><b>🔗 وصل المصطلحات</b> — اختر مصطلحاً ثم تعريفه الصحيح حتى تكتمل كل الأزواج بلا خطأ.</li>
          <li><b>🧱 رتّب المراحل</b> — أعِد ترتيب مراحل القمع والحملات والاستراتيجيات في تسلسلها الصحيح.</li>
          <li><b>⚡ سرعة المعرفة</b> — صحّ أم خطأ؟ عبارات تسويقية سريعة قبل انتهاء الوقت. الخطأ يُكلّفك ثانيتين.</li>
          <li><b>♟️ تحدّي الاستراتيجية</b> — اقرأ السيناريو واختر القرار التسويقي الأذكى، وتعلّم من «السبب».</li>
          <li><b>📅 التحدّي اليومي</b> — وضع جديد كل يوم مع خبرة وعملات إضافية.</li>
        </ul>
        <p style="margin-top:12px"><b>تكسب:</b> الخبرة ترفع مستواك ورتبتك، والعملات تتراكم، والأوسمة تُفتح مع كل إنجاز. كل شيء يُحفظ تلقائياً على جهازك.</p>
        <p><b>اختصارات:</b> الأرقام تختار الإجابات · <b>M</b> الموسيقى · <b>T</b> السمة · <b>Esc</b> يغلق النوافذ.</p>
        <button class="btn btn--primary" id="play">ابدأ اللعب ←</button>
      </div>`;
    $("#b").addEventListener("click", () => nav("home"));
    $("#play").addEventListener("click", () => nav("home"));
  }

  /* ---------- انطلاق ---------- */
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", runLoader);
  else runLoader();
})();
