/* ============================================================
   BASTA PLAY · main.js — App controller & router
   Loading, navigation, screens, reward + achievement logic.
   ============================================================ */
(function () {
  "use strict";
  const { $, $$ } = window.UI;
  let activeGame = null; // holds {stop} for cleanup

  /* ---------- Loading screen ---------- */
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

  /* ---------- Boot / bind ---------- */
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
    // ask name once
    if (!localStorage.getItem("basta_named")) askName(); else nav("home");
    window.addEventListener("keydown", globalKeys);
  }

  function askName() {
    UI.modal(`
      <h3>Welcome to Basta Play 👋</h3>
      <p>The premium marketing game experience. What should we call you on the leaderboard?</p>
      <div class="field"><label for="pname">Your name</label>
        <input id="pname" maxlength="18" placeholder="e.g. Basta Pro" value="${UI.esc(Store.get().name === 'Marketer' ? '' : Store.get().name)}"/></div>
      <button class="btn btn--primary btn--block" id="startBtn">Let's Play →</button>`);
    const go = () => {
      const v = ($("#pname").value || "").trim().slice(0, 18) || "Marketer";
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
    UI.modal(`<h3>Reset progress?</h3><p>This clears your XP, coins, achievements and leaderboard scores. Your name and settings stay. This can't be undone.</p>
      <div style="display:flex;gap:10px;flex-wrap:wrap">
        <button class="btn btn--accent" id="doReset">Yes, reset</button>
        <button class="btn btn--ghost" data-close>Cancel</button></div>`);
    $("#doReset").addEventListener("click", () => {
      Store.reset(); Store.seedLeaderboardIfEmpty(); UI.renderHUD(); UI.closeModal();
      UI.toast({ icon: "♻️", title: "Progress reset", desc: "Fresh start — good luck!" });
      nav("home");
    });
  }

  function globalKeys(e) {
    if (e.target.matches("input, textarea")) return;
    if (e.key === "Escape") { if ($("#drawer").classList.contains("open")) toggleDrawer(false); }
    // number keys select options in games
    if (/^[1-9]$/.test(e.key)) {
      const opts = $$(".opts .opt:not(:disabled), .sgrid .scell, .seq .token:not(.placed)");
      const i = parseInt(e.key) - 1;
      if (opts[i]) opts[i].click();
    }
    if (e.key.toLowerCase() === "m") $("#btn-music").click();
    if (e.key.toLowerCase() === "t") $("#btn-theme").click();
  }

  /* ---------- Router ---------- */
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

  /* ---------- HOME ---------- */
  function home(view) {
    const s = Store.get();
    const info = Store.levelInfo(s.xp);
    const dp = window.Games.daily.plan();
    view.innerHTML = `
      <section class="hero">
        <span class="hero__badge"><span class="dot"></span> Bastah Marketing Agency · Premium Play</span>
        <img class="hero__logo" src="${window.LOGO_FULL || 'assets/logo-full.jpeg'}" alt="Basta Marketing Agency logo" />
        <h1 class="hero__title">Play. Learn. <span class="grad">Market Smarter.</span></h1>
        <p class="hero__sub">An interactive marketing game experience — puzzles, memory, reflexes and strategy, wrapped in the Basta brand.</p>
        <p class="hero__ar" dir="rtl">نصنع التجربة ويستمر الأثر</p>
      </section>

      <div class="statstrip stagger">
        <div class="stat"><div class="stat__num c-b">${info.level}</div><div class="stat__lbl">Level</div></div>
        <div class="stat"><div class="stat__num">${s.xp}</div><div class="stat__lbl">Total XP</div></div>
        <div class="stat"><div class="stat__num c-o">${s.coins}</div><div class="stat__lbl">Coins</div></div>
        <div class="stat"><div class="stat__num">${s.streak}🔥</div><div class="stat__lbl">Day Streak</div></div>
      </div>

      <div class="sec-head"><h2>Choose your challenge</h2><span class="pill">${Store.modesPlayedCount()}/4 modes tried</span></div>
      <div class="modes stagger" id="modes"></div>`;

    const wrap = $("#modes");
    // Daily card first
    const daily = document.createElement("button");
    daily.className = "mode mode--daily"; daily.style.setProperty("--tint", "#F97316");
    daily.innerHTML = `
      <div class="mode__ico">📅</div>
      <div class="mode__body">
        <div class="mode__title">Daily Challenge ${dp.played ? "✓" : ""}</div>
        <div class="mode__desc">${dp.played ? "Done for today — come back tomorrow for a new one." : "Today's surprise: <b>" + UI.esc(dp.label) + "</b>. Bonus coins & XP!"}</div>
      </div>
      <div class="mode__cta"><span class="btn ${dp.played ? "btn--ghost" : "btn--accent"}">${dp.played ? "Replay" : "Play Daily"} →</span></div>`;
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
          <span class="mode__tag">${m.tag}${best ? " · best " + best : ""}</span>
          <span class="mode__go">Play <span aria-hidden="true">→</span></span>
        </div>`;
      el.addEventListener("click", () => { Sound.fx("click"); nav("play", m.id); });
      wrap.appendChild(el);
    });
  }

  /* ---------- GAME LAUNCH ---------- */
  function gameHeader(title, sub) {
    return `<button class="backbtn" id="gback">← Menu</button>
      <div class="sec-head" style="margin-top:14px"><h2>${UI.esc(title)}</h2>${sub ? `<span class="pill">${UI.esc(sub)}</span>` : ""}</div>`;
  }

  function startGame(modeId, view, isDaily) {
    Store.markMode(modeId);
    Store.unlock("first_play") && UI.celebrateBadge("first_play");
    Store.touchStreak();
    const game = window.Games[modeId];
    view.innerHTML = gameHeader(game.label, isDaily ? "Daily" : "");
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
    view.innerHTML = gameHeader("Daily Challenge", dp.label);
    const stage = document.createElement("div");
    view.appendChild(stage);
    $("#gback").addEventListener("click", () => { Sound.fx("click"); nav("home"); });
    const handle = window.Games.daily.start(stage, (res) => finishGame(res, view));
    if (handle) activeGame = handle;
  }

  /* ---------- FINISH + REWARDS ---------- */
  function finishGame(res, view) {
    activeGame = null;
    // apply rewards
    UI.grant(res.xp, res.coins);
    if (res.won) { const st = Store.get(); Store.patch({ wins: (st.wins || 0) + 1 }); }
    Store.setBest(res.mode, res.score);
    Store.addScore(res.score, res.mode);
    checkAchievements(res);

    const info = Store.levelInfo(Store.get().xp);
    const won = res.won;
    if (won) { Sound.fx("win"); UI.confetti(160); } else Sound.fx("lose");

    view.innerHTML = `
      <div class="qcard result">
        <div class="result__ico">${won ? "🎉" : "💪"}</div>
        <div class="result__title ${won ? "win" : ""}">${won ? "Great Play!" : "Nice Try!"}</div>
        <div class="result__sub">${UI.esc(res.detail || "")}${res.daily ? " · Daily bonus applied" : ""}</div>
        <div class="result__grid">
          <div class="reward"><div class="reward__v">${res.score}</div><div class="reward__l">Score</div></div>
          <div class="reward"><div class="reward__v xp">+${res.xp}</div><div class="reward__l">XP</div></div>
          <div class="reward"><div class="reward__v coin">+${res.coins}</div><div class="reward__l">Coins</div></div>
        </div>
        <div class="result__cta">
          <button class="btn btn--primary btn--lg" id="again">Play Again</button>
          <button class="btn btn--ghost btn--lg" id="lb">🏆 Leaderboard</button>
          <button class="btn btn--ghost btn--lg" id="menu">Menu</button>
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
    if (res.mode === "puzzle" && res.perfect) pop("puzzle_ace");
    if (res.mode === "memory" && (res.reachedLen || 0) >= 6) pop("memory_pro");
    if (res.mode === "speed" && res.score >= 20) pop("speed_demon");
    if (res.mode === "strategy" && res.perfect) pop("strategist");
    if (res.daily) pop("daily");
    if (s.streak >= 3) pop("streak3");
    if (s.coins >= 100) pop("coin100");
    if (info.level >= 5) pop("level5");
    if (info.level >= 10) pop("level10");
    if (Store.modesPlayedCount() >= 4) pop("allmodes");
    if ((s.wins || 0) >= 10) pop("perfectionist");
  }

  /* ---------- ACHIEVEMENTS ---------- */
  function achievements(view) {
    const s = Store.get();
    const unlocked = BASTA_DATA.ACHIEVEMENTS.filter(a => s.achievements[a.id]).length;
    view.innerHTML = `
      <button class="backbtn" id="b">← Menu</button>
      <div class="sec-head" style="margin-top:14px"><h2>🏅 Achievements</h2><span class="pill">${unlocked}/${BASTA_DATA.ACHIEVEMENTS.length} unlocked</span></div>
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

  /* ---------- LEADERBOARD ---------- */
  function leaderboard(view) {
    const s = Store.get();
    const rows = s.leaderboard.slice().sort((a, b) => b.score - a.score).slice(0, 15);
    view.innerHTML = `
      <button class="backbtn" id="b">← Menu</button>
      <div class="sec-head" style="margin-top:14px"><h2>🏆 Leaderboard</h2><span class="pill">Local · Top ${rows.length}</span></div>
      <div class="lb stagger" id="lb"></div>`;
    $("#b").addEventListener("click", () => nav("home"));
    const box = $("#lb");
    if (!rows.length) { box.innerHTML = `<div class="empty"><div class="empty__ico">🏅</div>No scores yet — play a game!</div>`; return; }
    rows.forEach((r, i) => {
      const el = document.createElement("div");
      el.className = "lb__row" + (r.me ? " me" : "");
      el.innerHTML = `<div class="lb__rank">${i + 1}</div>
        <div class="lb__name">${UI.esc(r.name)}${r.me ? " <span class='lb__lvl'>(you)</span>" : ""}<div class="lb__lvl">Lv ${r.level} · ${UI.esc(r.mode)}</div></div>
        <div class="lb__score">${r.score}</div>`;
      box.appendChild(el);
    });
  }

  /* ---------- STATS ---------- */
  function stats(view) {
    const s = Store.get();
    const info = Store.levelInfo(s.xp);
    const unlocked = BASTA_DATA.ACHIEVEMENTS.filter(a => s.achievements[a.id]).length;
    view.innerHTML = `
      <button class="backbtn" id="b">← Menu</button>
      <div class="sec-head" style="margin-top:14px"><h2>📊 ${UI.esc(s.name)}'s Stats</h2><span class="pill">${UI.rankName(info.level)}</span></div>
      <div class="statstrip stagger" style="grid-template-columns:repeat(3,1fr)">
        <div class="stat"><div class="stat__num c-b">${info.level}</div><div class="stat__lbl">Level</div></div>
        <div class="stat"><div class="stat__num">${s.xp}</div><div class="stat__lbl">Total XP</div></div>
        <div class="stat"><div class="stat__num c-o">${s.coins}</div><div class="stat__lbl">Coins</div></div>
        <div class="stat"><div class="stat__num">${s.wins || 0}</div><div class="stat__lbl">Wins</div></div>
        <div class="stat"><div class="stat__num">${s.streak}</div><div class="stat__lbl">Streak</div></div>
        <div class="stat"><div class="stat__num">${unlocked}</div><div class="stat__lbl">Badges</div></div>
      </div>
      <div class="sec-head"><h2>Best scores</h2></div>
      <div class="statstrip stagger" style="grid-template-columns:repeat(4,1fr)">
        <div class="stat"><div class="stat__num c-b">${s.bests.puzzle || 0}</div><div class="stat__lbl">Puzzle</div></div>
        <div class="stat"><div class="stat__num c-o">${s.bests.memory || 0}</div><div class="stat__lbl">Memory</div></div>
        <div class="stat"><div class="stat__num c-b">${s.bests.speed || 0}</div><div class="stat__lbl">Speed</div></div>
        <div class="stat"><div class="stat__num c-o">${s.bests.strategy || 0}</div><div class="stat__lbl">Strategy</div></div>
      </div>`;
    $("#b").addEventListener("click", () => nav("home"));
  }

  /* ---------- HOW TO PLAY ---------- */
  function howto(view) {
    view.innerHTML = `
      <button class="backbtn" id="b">← Menu</button>
      <div class="sec-head" style="margin-top:14px"><h2>❓ How to Play</h2></div>
      <div class="qcard">
        <ul class="rules">
          <li><b>🧩 Marketing Puzzle</b> — order marketing funnels & pick the best answers. Tap items in sequence, or choose an option (keys 1–4).</li>
          <li><b>🧠 Memory Challenge</b> — watch the brand tiles light up, then repeat the sequence. It grows each round.</li>
          <li><b>⚡ Speed Challenge</b> — tap the requested brand element as fast as you can before 30s runs out. Wrong taps cost a second.</li>
          <li><b>♟️ Strategy Challenge</b> — read the scenario and choose the smartest marketing decision. Learn from the "why".</li>
          <li><b>📅 Daily Challenge</b> — a fresh mode every day with bonus XP & coins.</li>
        </ul>
        <p style="margin-top:12px"><b>Earn:</b> XP raises your level & rank, coins bank up, and badges unlock as you hit milestones. Everything saves automatically on this device.</p>
        <p><b>Shortcuts:</b> number keys pick options · <b>M</b> music · <b>T</b> theme · <b>Esc</b> closes dialogs.</p>
        <button class="btn btn--primary" id="play">Start Playing →</button>
      </div>`;
    $("#b").addEventListener("click", () => nav("home"));
    $("#play").addEventListener("click", () => nav("home"));
  }

  /* ---------- GO ---------- */
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", runLoader);
  else runLoader();
})();
