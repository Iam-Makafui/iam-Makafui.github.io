/* =========================================================
   Phillip Makafui — Portfolio (v2)
   ========================================================= */
(function () {
  "use strict";

  const root = document.documentElement;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Theme ---------- */
  function setTheme(t) {
    root.setAttribute("data-theme", t);
    try { localStorage.setItem("theme", t); } catch (e) {}
    const meta = $('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", t === "dark" ? "#0b0b0a" : "#f4f2ec");
  }
  $$("[data-theme-toggle]").forEach((b) =>
    b.addEventListener("click", () => setTheme(root.getAttribute("data-theme") === "dark" ? "light" : "dark"))
  );

  /* ---------- Year ---------- */
  $$("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));

  /* ---------- Nav: border on scroll, mobile menu, current section ---------- */
  const nav = $(".nav");
  const onScroll = () => {
    nav.classList.toggle("is-scrolled", window.scrollY > 8);
    if (window.scrollY < 200) $$("#nav-links a").forEach((a) => a.classList.remove("is-current"));
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  const menuBtn = $(".menu-btn");
  const links = $("#nav-links");
  function setMenu(open) {
    menuBtn.setAttribute("aria-expanded", String(open));
    menuBtn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    links.classList.toggle("is-open", open);
  }
  menuBtn.addEventListener("click", () => setMenu(menuBtn.getAttribute("aria-expanded") !== "true"));
  $$("a", links).forEach((a) => a.addEventListener("click", () => setMenu(false)));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") setMenu(false); });
  document.addEventListener("click", (e) => { if (!nav.contains(e.target)) setMenu(false); });

  const navLinks = $$("a", links);
  const secObs = new IntersectionObserver(
    (entries) => entries.forEach((e) => {
      if (e.isIntersecting) navLinks.forEach((a) => a.classList.toggle("is-current", a.hash === "#" + e.target.id));
    }),
    { rootMargin: "-40% 0px -55% 0px" }
  );
  $$("main section[id]").forEach((s) => secObs.observe(s));

  /* ---------- Reveal on scroll ---------- */
  const revealObs = new IntersectionObserver(
    (entries) => entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add("is-in");
      revealObs.unobserve(e.target);
    }),
    { rootMargin: "0px 0px -6% 0px", threshold: 0.05 }
  );
  $$(".reveal").forEach((el) => {
    const sibs = $$(":scope > .reveal", el.parentElement);
    const i = sibs.indexOf(el);
    if (i > 0) el.style.setProperty("--d", Math.min((i % 3) * 0.08 + (el.closest(".hero") ? i * 0.06 : 0), 0.4) + "s");
    revealObs.observe(el);
  });

  /* ---------- Counters ---------- */
  if (!reduced) {
    const countObs = new IntersectionObserver((entries) => entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const el = e.target, to = +el.dataset.count, start = performance.now();
      countObs.unobserve(el);
      const step = (t) => {
        const p = Math.min(1, (t - start) / 1200);
        el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }), { threshold: 0.6 });
    $$("[data-count]").forEach((el) => { el.textContent = "0"; countObs.observe(el); });
  }

  /* ---------- Filters ---------- */
  const empty = $(".empty");
  $$(".filter").forEach((f) =>
    f.addEventListener("click", () => {
      $$(".filter").forEach((x) => x.classList.toggle("is-active", x === f));
      const cat = f.dataset.filter;
      let shown = 0;
      $$(".card, .featured").forEach((c) => {
        const show = cat === "all" || c.dataset.cat.split(" ").includes(cat);
        c.classList.toggle("is-hidden", !show);
        if (show) { shown++; c.classList.add("is-in"); }
      });
      if (empty) empty.hidden = shown > 0;
    })
  );

  /* ---------- Hero: flowing lines (react to the mouse) ---------- */
  (function heroField() {
    const canvas = $(".hero-canvas");
    if (!canvas || reduced) return;
    const ctx = canvas.getContext("2d");
    const hero = $(".hero");
    let w, h, particles = [], running = true, t = 0;
    const mouse = { x: -9999, y: -9999, tx: -9999, ty: -9999 };
    const lerp = (a, b, k) => a + (b - a) * k;
    const accent = () => getComputedStyle(root).getPropertyValue("--accent").trim() || "#c8ff3e";
    let color = accent();
    new MutationObserver(() => { color = accent(); ctx.clearRect(0, 0, w, h); })
      .observe(root, { attributes: true, attributeFilter: ["data-theme"] });

    function spawn(rand) {
      return { x: Math.random() * w, y: Math.random() * h, life: rand ? Math.random() * 200 : 0, max: 120 + Math.random() * 220, s: 0.4 + Math.random() * 1.1 };
    }
    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = hero.clientWidth; h = hero.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      particles = Array.from({ length: Math.round(Math.min(1400, (w * h) / 1100)) }, () => spawn(true));
    }
    const field = (x, y) =>
      Math.sin(x * 0.0016 + t * 0.25) * Math.cos(y * 0.0021 - t * 0.2) * 2.2 + Math.sin((x + y) * 0.0011 + t * 0.15) * 1.3;

    function frame() {
      if (!running) return;
      t += 0.01;
      mouse.x = lerp(mouse.x, mouse.tx, 0.12);
      mouse.y = lerp(mouse.y, mouse.ty, 0.12);
      ctx.globalCompositeOperation = "destination-out";
      ctx.fillStyle = "rgba(0,0,0,0.08)";
      ctx.fillRect(0, 0, w, h);
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      for (const p of particles) {
        const a = field(p.x, p.y), px = p.x, py = p.y;
        let vx = Math.cos(a) * p.s * 1.4, vy = Math.sin(a) * p.s * 1.4;
        const dx = p.x - mouse.x, dy = p.y - mouse.y, d2 = dx * dx + dy * dy;
        if (d2 < 26000) {
          const f = (1 - d2 / 26000) * 4, d = Math.sqrt(d2) || 1;
          vx += (dx / d) * f * 0.6 - (dy / d) * f;
          vy += (dy / d) * f * 0.6 + (dx / d) * f;
        }
        p.x += vx; p.y += vy; p.life++;
        ctx.globalAlpha = Math.max(0, Math.sin((p.life / p.max) * Math.PI)) * 0.55;
        ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(p.x, p.y); ctx.stroke();
        if (p.life > p.max || p.x < -10 || p.x > w + 10 || p.y < -10 || p.y > h + 10) Object.assign(p, spawn(false));
      }
      ctx.globalAlpha = 1;
      requestAnimationFrame(frame);
    }

    hero.addEventListener("pointermove", (e) => {
      const r = hero.getBoundingClientRect();
      mouse.tx = e.clientX - r.left; mouse.ty = e.clientY - r.top;
      if (mouse.x < -1000) { mouse.x = mouse.tx; mouse.y = mouse.ty; }
    });
    hero.addEventListener("pointerleave", () => { mouse.tx = mouse.ty = -9999; });

    const resume = () => { if (!running) { running = true; requestAnimationFrame(frame); } };
    new IntersectionObserver(([e]) => { if (e.isIntersecting) resume(); else running = false; }).observe(hero);
    document.addEventListener("visibilitychange", () => { if (document.hidden) running = false; else resume(); });
    let rt;
    window.addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(resize, 150); });
    resize();
    requestAnimationFrame(frame);
  })();

  /* ---------- Contact form (Formspree, no page reload) ---------- */
  const form = $("[data-form]");
  if (form && window.fetch) {
    const status = $(".form-status", form);
    const btn = $(".btn-send", form);
    const label = $("[data-send-label]", form);
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      status.className = "form-status mono";
      status.textContent = "";
      btn.disabled = true;
      label.textContent = "Sending…";
      try {
        const res = await fetch(form.action, { method: "POST", body: new FormData(form), headers: { Accept: "application/json" } });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error((data.errors && data.errors.map((x) => x.message).join(", ")) || "Something went wrong.");
        }
        form.reset();
        status.classList.add("ok");
        status.textContent = "Message sent. I'll get back to you soon.";
        label.textContent = "Sent ✓";
        setTimeout(() => (label.textContent = "Send message"), 4000);
      } catch (err) {
        status.classList.add("err");
        status.textContent = (err.message || "Could not send.") + " Please try again.";
        label.textContent = "Send message";
      } finally {
        btn.disabled = false;
      }
    });
  }
})();
