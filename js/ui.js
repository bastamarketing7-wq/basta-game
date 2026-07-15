/* ============================================================
   BASTA PLAY · ui.js
   Theme, HUD, toasts, confetti, modal, ripple, transitions.
   Exposes window.UI
   ============================================================ */
(function () {
  "use strict";
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));

  /* ---------- Theme ---------- */
  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", theme === "light" ? "#eef2fb" : "#1E5BD6");
  }

  /* ---------- HUD ---------- */
  function renderHUD() {
    const s = Store.get();
    const info = Store.levelInfo(s.xp);
    setText("#hud-level", info.level);
    setText("#hud-xp", info.into + "/" + info.need);
    const fill = $("#hud-xpfill"); if (fill) fill.style.width = info.pct + "%";
    animateNumber("#hud-coins", s.coins);
    // drawer profile
    setText("#drawer-name", s.name || "Marketer");
    setText("#drawer-rank", rankName(info.level));
    const ava = $("#drawer-avatar"); if (ava) ava.textContent = (s.name || "B").trim().charAt(0).toUpperCase();
  }

  function rankName(level) {
    const R = BASTA_DATA.RANKS;
    let name = R[0].name;
    for (const r of R) if (level >= r.min) name = r.name;
    return name;
  }

  function setText(sel, v) { const el = $(sel); if (el) el.textContent = v; }

  function animateNumber(sel, to) {
    const el = $(sel); if (!el) return;
    const from = parseInt(el.textContent.replace(/\D/g, "")) || 0;
    if (from === to) { el.textContent = to; return; }
    const dur = 500, start = performance.now();
    function tick(now) {
      const p = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(from + (to - from) * eased);
      if (p < 1) requestAnimationFrame(tick); else { el.textContent = to; el.classList.add("flash-up"); setTimeout(() => el.classList.remove("flash-up"), 500); }
    }
    requestAnimationFrame(tick);
  }

  /* ---------- Toasts ---------- */
  function toast(opts) {
    const { title = "", desc = "", icon = "✨", kind = "" } = opts || {};
    const root = $("#toasts"); if (!root) return;
    const el = document.createElement("div");
    el.className = "toast" + (kind ? " toast--" + kind : "");
    el.innerHTML = `<div class="toast__ico">${icon}</div><div><div class="toast__t">${esc(title)}</div>${desc ? `<div class="toast__d">${esc(desc)}</div>` : ""}</div>`;
    root.appendChild(el);
    setTimeout(() => { el.classList.add("out"); setTimeout(() => el.remove(), 320); }, opts.ms || 2600);
  }

  function esc(s) { return String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])); }

  /* ---------- Confetti ---------- */
  const canvas = $("#confetti");
  const cx = canvas ? canvas.getContext("2d") : null;
  let parts = [], raf = null;
  const COLORS = ["#1E5BD6", "#F97316", "#ffffff", "#4d82e6", "#fb8f42"];

  function sizeCanvas() {
    if (!canvas) return;
    canvas.width = window.innerWidth * devicePixelRatio;
    canvas.height = window.innerHeight * devicePixelRatio;
  }
  window.addEventListener("resize", sizeCanvas);
  sizeCanvas();

  function confetti(count) {
    if (!cx) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const n = count || 130;
    for (let i = 0; i < n; i++) {
      parts.push({
        x: Math.random() * canvas.width,
        y: -20 * devicePixelRatio,
        vx: (Math.random() - 0.5) * 6 * devicePixelRatio,
        vy: (Math.random() * 3 + 2) * devicePixelRatio,
        g: 0.12 * devicePixelRatio,
        size: (Math.random() * 7 + 4) * devicePixelRatio,
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.3,
        color: COLORS[(Math.random() * COLORS.length) | 0],
        life: 1
      });
    }
    if (!raf) raf = requestAnimationFrame(step);
  }

  function step() {
    cx.clearRect(0, 0, canvas.width, canvas.height);
    for (const p of parts) {
      p.vy += p.g; p.x += p.vx; p.y += p.vy; p.rot += p.vr;
      p.life -= 0.004;
      cx.save();
      cx.translate(p.x, p.y); cx.rotate(p.rot);
      cx.globalAlpha = Math.max(0, p.life);
      cx.fillStyle = p.color;
      cx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      cx.restore();
    }
    parts = parts.filter(p => p.life > 0 && p.y < canvas.height + 40);
    if (parts.length) raf = requestAnimationFrame(step);
    else { cx.clearRect(0, 0, canvas.width, canvas.height); raf = null; }
  }

  /* ---------- Modal ---------- */
  let lastFocus = null;
  function modal(html) {
    const root = $("#modal-root"); const body = $("#modal-body");
    if (!root || !body) return;
    lastFocus = document.activeElement;
    body.innerHTML = html;
    root.hidden = false;
    document.body.style.overflow = "hidden";
    const focusable = body.querySelector("button, input, a, [tabindex]");
    if (focusable) setTimeout(() => focusable.focus(), 60);
  }
  function closeModal() {
    const root = $("#modal-root");
    if (!root) return;
    root.hidden = true;
    document.body.style.overflow = "";
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  document.addEventListener("click", (e) => {
    if (e.target.closest("[data-close]")) closeModal();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") { const r = $("#modal-root"); if (r && !r.hidden) closeModal(); }
  });

  /* ---------- Ripple ---------- */
  function attachRipples() {
    document.addEventListener("pointerdown", (e) => {
      const t = e.target.closest(".btn, .mode, .opt, .token, .mtile, .scell, .icon-btn, .drawer__link, .backbtn");
      if (!t) return;
      if (getComputedStyle(t).position === "static") t.style.position = "relative";
      const rect = t.getBoundingClientRect();
      const r = document.createElement("span");
      r.className = "ripple";
      const size = Math.max(rect.width, rect.height);
      r.style.width = r.style.height = size + "px";
      r.style.left = (e.clientX - rect.left - size / 2) + "px";
      r.style.top = (e.clientY - rect.top - size / 2) + "px";
      t.appendChild(r);
      setTimeout(() => r.remove(), 620);
    });
  }

  /* ---------- Reward flow: apply XP/coins, level-up + achievements ---------- */
  function grant(xp, coins) {
    if (coins) { Store.addCoins(coins); Sound.fx("coin"); }
    let lv = null;
    if (xp) { lv = Store.addXp(xp); }
    renderHUD();
    if (lv && lv.leveledUp) {
      Sound.fx("level");
      confetti(90);
      toast({ icon: "⭐", title: "ترقية مستوى!", desc: "وصلت إلى المستوى " + lv.to + " · " + rankName(lv.to), kind: "xp", ms: 3200 });
    }
    return lv;
  }

  function celebrateBadge(id) {
    const a = BASTA_DATA.ACHIEVEMENTS.find(x => x.id === id);
    if (!a) return;
    Sound.fx("badge");
    confetti(120);
    toast({ icon: a.icon, title: "وسام جديد!", desc: a.name + " — " + a.desc, kind: "badge", ms: 3600 });
  }

  window.UI = {
    applyTheme, renderHUD, rankName, toast, confetti, modal, closeModal,
    attachRipples, grant, celebrateBadge, animateNumber, esc, $, $$
  };
})();
