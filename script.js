/* =========================================================
   Phillip Makafui — Portfolio interactions
   ========================================================= */
(function () {
  "use strict";

  const root = document.documentElement;
  const body = document.body;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const lerp = (a, b, t) => a + (b - a) * t;

  /* ---------- Theme ---------- */
  function setTheme(t) {
    root.setAttribute("data-theme", t);
    try { localStorage.setItem("theme", t); } catch (e) {}
    const meta = $('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", t === "dark" ? "#0b0b0a" : "#f1eee6");
    $$("[data-theme-label]").forEach((el) => (el.textContent = t === "dark" ? "Light theme" : "Dark theme"));
  }
  function toggleTheme() {
    setTheme(root.getAttribute("data-theme") === "dark" ? "light" : "dark");
  }
  setTheme(root.getAttribute("data-theme") || "dark");
  $$("[data-theme-toggle]").forEach((b) => b.addEventListener("click", toggleTheme));

  /* ---------- Year ---------- */
  $$("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));

  /* ---------- Split text into characters ---------- */
  $$(".split").forEach((el) => {
    const text = el.textContent;
    el.textContent = "";
    el.setAttribute("aria-hidden", "true");
    [...text].forEach((c, i) => {
      const s = document.createElement("span");
      s.className = "ch";
      s.textContent = c === " " ? " " : c;
      s.style.transitionDelay = i * 0.035 + "s";
      el.appendChild(s);
    });
  });
  // Contact title reads naturally for screen readers
  const ct = $(".contact-title");
  if (ct) ct.setAttribute("aria-label", "Let's build something real.");

  /* ---------- Loader ---------- */
  const loader = $(".loader");
  const countEl = $("[data-loader-count]");
  const barEl = $(".loader-bar span");
  body.classList.add("is-loading");

  function finishLoading() {
    loader && loader.classList.add("is-done");
    body.classList.remove("is-loading");
    setTimeout(() => {
      body.classList.add("is-ready");
      $$(".hero .reveal").forEach((el) => el.classList.add("is-in"));
    }, 250);
    setTimeout(() => loader && loader.remove(), 1400);
  }

  if (reduced || !loader) {
    finishLoading();
  } else {
    let n = 0;
    let loaded = document.readyState === "complete";
    window.addEventListener("load", () => (loaded = true));
    const tick = () => {
      const target = loaded ? 100 : 86;
      n = Math.min(target, n + Math.max(1, (target - n) * 0.08));
      const v = Math.floor(n);
      countEl.textContent = String(v).padStart(2, "0");
      barEl.style.width = v + "%";
      if (v >= 100) setTimeout(finishLoading, 200);
      else requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    // Safety: never hold the page longer than 3.5s
    setTimeout(() => { loaded = true; }, 3500);
  }

  /* ---------- Clock (Accra) ---------- */
  const clock = $("[data-clock]");
  if (clock) {
    const fmt = new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false, timeZone: "Africa/Accra",
    });
    const upd = () => (clock.textContent = fmt.format(new Date()));
    upd();
    setInterval(upd, 1000);
  }

  /* ---------- Nav: scrolled / hide on scroll ---------- */
  const nav = $(".nav");
  const progress = $(".progress span");
  let lastY = window.scrollY;
  function onScroll() {
    const y = window.scrollY;
    nav.classList.toggle("is-scrolled", y > 20);
    if (!menuOpen) nav.classList.toggle("is-hidden", y > lastY && y > 400);
    lastY = y;
    const h = document.documentElement.scrollHeight - window.innerHeight;
    if (progress) progress.style.transform = `scaleX(${h > 0 ? y / h : 0})`;
  }
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ---------- Mobile menu ---------- */
  const menuBtn = $(".menu-btn");
  const menu = $("#mobile-menu");
  let menuOpen = false;
  function setMenu(open) {
    menuOpen = open;
    menuBtn.setAttribute("aria-expanded", String(open));
    if (open) {
      menu.hidden = false;
      requestAnimationFrame(() => menu.classList.add("is-open"));
      body.style.overflow = "hidden";
      nav.classList.remove("is-hidden");
    } else {
      menu.classList.remove("is-open");
      body.style.overflow = "";
      setTimeout(() => { if (!menuOpen) menu.hidden = true; }, 800);
    }
  }
  menuBtn && menuBtn.addEventListener("click", () => setMenu(!menuOpen));
  $$("#mobile-menu a").forEach((a) => a.addEventListener("click", () => setMenu(false)));

  /* ---------- Current section in nav ---------- */
  const navLinks = $$(".nav-links a");
  const sectionObs = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        navLinks.forEach((a) => a.classList.toggle("is-current", a.getAttribute("href") === "#" + e.target.id));
      });
    },
    { rootMargin: "-45% 0px -50% 0px" }
  );
  $$("main section[id]").forEach((s) => sectionObs.observe(s));

  /* ---------- Reveal on scroll ---------- */
  const revealObs = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add("is-in");
        revealObs.unobserve(e.target);
      });
    },
    { rootMargin: "0px 0px -8% 0px", threshold: 0.05 }
  );
  // stagger siblings
  $$(".reveal").forEach((el) => {
    const sibs = $$(":scope > .reveal", el.parentElement);
    const i = sibs.indexOf(el);
    if (i > 0) el.style.setProperty("--d", Math.min(i * 0.07, 0.5) + "s");
    revealObs.observe(el);
  });
  $$(".contact-title .split").forEach((el) => revealObs.observe(el));

  /* ---------- Counters ---------- */
  const countObs = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const el = e.target;
        const to = parseInt(el.dataset.count, 10);
        countObs.unobserve(el);
        if (reduced) { el.textContent = to; return; }
        const dur = 1600;
        const start = performance.now();
        const step = (t) => {
          const p = Math.min(1, (t - start) / dur);
          const eased = 1 - Math.pow(1 - p, 4);
          el.textContent = Math.round(to * eased);
          if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      });
    },
    { threshold: 0.6 }
  );
  $$("[data-count]").forEach((el) => countObs.observe(el));

  /* ---------- Hero canvas: flowing particle field ---------- */
  (function heroField() {
    const canvas = $(".hero-canvas");
    if (!canvas || reduced) return;
    const ctx = canvas.getContext("2d");
    const hero = $(".hero");
    let w, h, dpr, particles = [], running = true, t = 0;
    const mouse = { x: -9999, y: -9999, tx: -9999, ty: -9999 };

    function color() {
      return getComputedStyle(root).getPropertyValue("--accent").trim() || "#c8ff3e";
    }
    let accent = color();
    new MutationObserver(() => (accent = color())).observe(root, { attributes: true, attributeFilter: ["data-theme"] });

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = hero.clientWidth;
      h = hero.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.round(Math.min(1400, (w * h) / 1100));
      particles = Array.from({ length: count }, () => spawn(true));
    }
    function spawn(randomAge) {
      return {
        x: Math.random() * w,
        y: Math.random() * h,
        px: 0, py: 0,
        life: randomAge ? Math.random() * 200 : 0,
        max: 120 + Math.random() * 220,
        s: 0.4 + Math.random() * 1.1,
      };
    }
    // cheap smooth pseudo-noise
    function field(x, y) {
      const s = 0.0016;
      return (
        Math.sin(x * s + t * 0.25) * Math.cos(y * s * 1.3 - t * 0.2) * 2.2 +
        Math.sin((x + y) * s * 0.7 + t * 0.15) * 1.3
      );
    }

    function frame() {
      if (!running) return;
      t += 0.01;
      mouse.x = lerp(mouse.x, mouse.tx, 0.12);
      mouse.y = lerp(mouse.y, mouse.ty, 0.12);

      ctx.globalCompositeOperation = "destination-out";
      ctx.fillStyle = "rgba(0,0,0,0.08)";
      ctx.fillRect(0, 0, w, h);
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = accent;
      ctx.lineWidth = 1;

      for (const p of particles) {
        p.px = p.x; p.py = p.y;
        const a = field(p.x, p.y);
        let vx = Math.cos(a) * p.s * 1.4;
        let vy = Math.sin(a) * p.s * 1.4;

        const dx = p.x - mouse.x, dy = p.y - mouse.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < 26000) {
          const f = (1 - d2 / 26000) * 4;
          const d = Math.sqrt(d2) || 1;
          // swirl around cursor
          vx += (dx / d) * f * 0.6 - (dy / d) * f;
          vy += (dy / d) * f * 0.6 + (dx / d) * f;
        }
        p.x += vx; p.y += vy; p.life++;

        const fade = Math.sin((p.life / p.max) * Math.PI);
        ctx.globalAlpha = Math.max(0, fade) * 0.55;
        ctx.beginPath();
        ctx.moveTo(p.px, p.py);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();

        if (p.life > p.max || p.x < -10 || p.x > w + 10 || p.y < -10 || p.y > h + 10) {
          Object.assign(p, spawn(false));
        }
      }
      ctx.globalAlpha = 1;
      requestAnimationFrame(frame);
    }

    hero.addEventListener("pointermove", (e) => {
      const r = hero.getBoundingClientRect();
      mouse.tx = e.clientX - r.left;
      mouse.ty = e.clientY - r.top;
      if (mouse.x < -1000) { mouse.x = mouse.tx; mouse.y = mouse.ty; }
    });
    hero.addEventListener("pointerleave", () => { mouse.tx = mouse.ty = -9999; });

    new IntersectionObserver(([e]) => {
      const was = running;
      running = e.isIntersecting && !document.hidden;
      if (running && !was) requestAnimationFrame(frame);
    }).observe(hero);
    document.addEventListener("visibilitychange", () => {
      const was = running;
      running = !document.hidden;
      if (running && !was) requestAnimationFrame(frame);
    });

    let rt;
    window.addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(resize, 150); });
    resize();
    requestAnimationFrame(frame);
  })();

  /* ---------- Custom cursor ---------- */
  const cursor = $(".cursor");
  const dot = $(".cursor-dot");
  const pos = { x: innerWidth / 2, y: innerHeight / 2, cx: innerWidth / 2, cy: innerHeight / 2 };
  if (finePointer && !reduced) {
    body.classList.add("has-cursor");
    window.addEventListener("pointermove", (e) => {
      pos.x = e.clientX; pos.y = e.clientY;
      dot.style.transform = `translate(${pos.x}px, ${pos.y}px)`;
    });
    (function loop() {
      pos.cx = lerp(pos.cx, pos.x, 0.18);
      pos.cy = lerp(pos.cy, pos.y, 0.18);
      cursor.style.transform = `translate(${pos.cx}px, ${pos.cy}px)`;
      requestAnimationFrame(loop);
    })();
    document.addEventListener("pointerover", (e) => {
      const view = e.target.closest(".project-row, .featured-visual");
      const hov = e.target.closest("a, button, input, textarea, .tool");
      cursor.classList.toggle("is-view", !!view);
      cursor.classList.toggle("is-hover", !view && !!hov);
      if (view) $(".cursor-label").textContent = view.classList.contains("featured-visual") ? "TowGo" : "Open";
    });
    document.addEventListener("pointerleave", () => body.classList.remove("has-cursor"));
    document.addEventListener("pointerenter", () => body.classList.add("has-cursor"));
  }

  /* ---------- Magnetic buttons ---------- */
  if (finePointer && !reduced) {
    $$(".magnetic").forEach((el) => {
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        const x = e.clientX - r.left - r.width / 2;
        const y = e.clientY - r.top - r.height / 2;
        el.style.transform = `translate(${x * 0.25}px, ${y * 0.35}px)`;
      });
      el.addEventListener("pointerleave", () => (el.style.transform = ""));
    });
  }

  /* ---------- Tilt (featured + tools) ---------- */
  if (finePointer && !reduced) {
    const fv = $("[data-tilt]");
    if (fv) {
      const frame = $(".featured-frame", fv);
      fv.addEventListener("pointermove", (e) => {
        const r = fv.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        frame.style.setProperty("--ry", (px - 0.5) * 10 + "deg");
        frame.style.setProperty("--rx", (0.5 - py) * 8 + "deg");
        frame.style.setProperty("--mx", px * 100 + "%");
        frame.style.setProperty("--my", py * 100 + "%");
      });
      fv.addEventListener("pointerleave", () => {
        frame.style.setProperty("--rx", "0deg");
        frame.style.setProperty("--ry", "0deg");
      });
    }
    $$("[data-tilt-sm]").forEach((el) => {
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        el.style.setProperty("--ry", (px - 0.5) * 14 + "deg");
        el.style.setProperty("--rx", (0.5 - py) * 14 + "deg");
        el.style.setProperty("--mx", px * 100 + "%");
        el.style.setProperty("--my", py * 100 + "%");
      });
      el.addEventListener("pointerleave", () => {
        el.style.setProperty("--rx", "0deg");
        el.style.setProperty("--ry", "0deg");
      });
    });
  }

  /* ---------- Work: accordion ---------- */
  function openProject(li, scroll) {
    const isOpen = li.classList.contains("is-open");
    $$(".project.is-open").forEach((p) => {
      if (p !== li) {
        p.classList.remove("is-open");
        $(".project-row", p).setAttribute("aria-expanded", "false");
      }
    });
    li.classList.toggle("is-open", !isOpen);
    $(".project-row", li).setAttribute("aria-expanded", String(!isOpen));
    if (scroll && !isOpen) setTimeout(() => li.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" }), 80);
  }
  $$(".project-row").forEach((btn) =>
    btn.addEventListener("click", () => {
      openProject(btn.closest(".project"));
      hidePreview();
    })
  );

  /* ---------- Work: filters ---------- */
  $$(".filter").forEach((f) =>
    f.addEventListener("click", () => {
      $$(".filter").forEach((x) => x.classList.toggle("is-active", x === f));
      const cat = f.dataset.filter;
      $$(".project").forEach((p) => {
        const show = cat === "all" || p.dataset.cat.split(" ").includes(cat);
        p.classList.toggle("is-hidden", !show);
      });
    })
  );

  /* ---------- Work: floating preview ---------- */
  const preview = $(".preview");
  const previewImg = $(".preview img");
  const pv = { x: 0, y: 0, cx: 0, cy: 0, on: false };
  function hidePreview() { pv.on = false; preview.classList.remove("is-on"); }
  if (finePointer && preview) {
    $$(".project").forEach((li) => {
      const row = $(".project-row", li);
      row.addEventListener("pointerenter", (e) => {
        if (li.classList.contains("is-open")) return;
        const src = li.dataset.img;
        if (previewImg.getAttribute("src") !== src) previewImg.src = src;
        preview.style.setProperty("--rot", (Math.random() * 8 - 4).toFixed(1) + "deg");
        if (!pv.on) { pv.cx = e.clientX; pv.cy = e.clientY; }
        pv.on = true;
        preview.classList.add("is-on");
      });
      row.addEventListener("pointerleave", hidePreview);
    });
    window.addEventListener("pointermove", (e) => { pv.x = e.clientX; pv.y = e.clientY; });
    (function loop() {
      pv.cx = lerp(pv.cx, pv.x, 0.12);
      pv.cy = lerp(pv.cy, pv.y, 0.12);
      preview.style.transform = `translate(${pv.cx}px, ${pv.cy}px)`;
      requestAnimationFrame(loop);
    })();
    window.addEventListener("scroll", () => { if (pv.on && !document.elementFromPoint(pv.x, pv.y)?.closest(".project-row")) hidePreview(); }, { passive: true });
  }

  /* ---------- Testimonials slider ---------- */
  (function slider() {
    const quotes = $$(".quote");
    if (!quotes.length) return;
    const cur = $("[data-slide-current]");
    const bar = $(".slider-bar span");
    let i = 0, timer;

    // split quote words for blur-in
    quotes.forEach((q) => {
      const bq = $("blockquote", q);
      const words = bq.textContent.trim().split(/\s+/);
      bq.setAttribute("aria-label", bq.textContent.trim());
      bq.innerHTML = words
        .map((w, k) => `<span class="w" aria-hidden="true" style="transition-delay:${(k * 0.025).toFixed(3)}s">${w}</span>`)
        .join(" ");
    });

    function go(n) {
      quotes[i].classList.remove("is-active");
      i = (n + quotes.length) % quotes.length;
      quotes[i].classList.add("is-active");
      cur.textContent = String(i + 1).padStart(2, "0");
      restart();
    }
    function restart() {
      clearTimeout(timer);
      if (reduced) return;
      bar.classList.remove("is-running");
      void bar.offsetWidth;
      bar.classList.add("is-running");
      timer = setTimeout(() => go(i + 1), 7000);
    }
    $('[data-slide="prev"]').addEventListener("click", () => go(i - 1));
    $('[data-slide="next"]').addEventListener("click", () => go(i + 1));

    // start only when visible
    const words = $("#words");
    new IntersectionObserver(([e]) => {
      if (e.isIntersecting) restart();
      else { clearTimeout(timer); bar.classList.remove("is-running"); }
    }, { threshold: 0.3 }).observe(words);

    // swipe
    let sx = null;
    const list = $(".quotes");
    list.addEventListener("touchstart", (e) => (sx = e.touches[0].clientX), { passive: true });
    list.addEventListener("touchend", (e) => {
      if (sx === null) return;
      const dx = e.changedTouches[0].clientX - sx;
      if (Math.abs(dx) > 50) go(i + (dx < 0 ? 1 : -1));
      sx = null;
    });
  })();

  /* ---------- Contact form (Formspree, no page reload) ---------- */
  const form = $("[data-form]");
  if (form) {
    const status = $(".form-status", form);
    const btn = $(".btn-send", form);
    const label = $("[data-send-label]", form);
    form.addEventListener("submit", async (e) => {
      if (!window.fetch) return; // fall back to normal POST
      e.preventDefault();
      status.className = "form-status mono";
      status.textContent = "";
      btn.disabled = true;
      label.textContent = "Sending…";
      try {
        const res = await fetch(form.action, {
          method: "POST",
          body: new FormData(form),
          headers: { Accept: "application/json" },
        });
        if (res.ok) {
          form.reset();
          status.classList.add("ok");
          status.textContent = "Message sent. I'll get back to you soon.";
          label.textContent = "Sent ✓";
          setTimeout(() => (label.textContent = "Send message"), 4000);
        } else {
          const data = await res.json().catch(() => ({}));
          throw new Error((data.errors && data.errors.map((x) => x.message).join(", ")) || "Something went wrong.");
        }
      } catch (err) {
        status.classList.add("err");
        status.textContent = (err.message || "Could not send") + " Please try again.";
        label.textContent = "Send message";
      } finally {
        btn.disabled = false;
      }
    });
  }

  /* ---------- Command palette (⌘K / Ctrl+K) ---------- */
  (function palette() {
    const pal = $(".palette");
    const input = $(".palette-search input");
    const list = $(".palette-list");
    let items = [], active = 0, lastFocus = null;

    const go = (sel) => () => {
      const el = $(sel);
      el && el.scrollIntoView({ behavior: reduced ? "auto" : "smooth" });
    };
    const commands = [
      { g: "Go to", label: "Home", hint: "top", run: go("#top") },
      { g: "Go to", label: "Featured — TowGo", hint: "01", run: go("#towgo") },
      { g: "Go to", label: "Selected work", hint: "02", run: go("#work") },
      { g: "Go to", label: "Toolkit", hint: "03", run: go("#toolkit") },
      { g: "Go to", label: "Testimonials", hint: "04", run: go("#words") },
      { g: "Go to", label: "Contact", hint: "05", run: () => { go("#contact")(); setTimeout(() => $("#name").focus({ preventScroll: true }), 700); } },
      ...$$(".project").map((li) => ({
        g: "Projects",
        label: $(".p-title", li).textContent,
        hint: $(".p-meta", li).textContent,
        run: () => {
          $$(".filter")[0].click();
          if (!li.classList.contains("is-open")) openProject(li, true);
          else li.scrollIntoView({ behavior: "smooth", block: "start" });
        },
      })),
      { g: "Actions", label: "Toggle dark / light theme", hint: "T", run: toggleTheme },
      { g: "Actions", label: "Open GitHub", hint: "↗", run: () => window.open("https://github.com/Iam-Makafui", "_blank", "noopener") },
      { g: "Actions", label: "Open LinkedIn", hint: "↗", run: () => window.open("https://www.linkedin.com/in/phillip-makafui-317490192", "_blank", "noopener") },
      { g: "Actions", label: "Open X / Twitter", hint: "↗", run: () => window.open("https://x.com/IamMakafui", "_blank", "noopener") },
    ];

    function render(q) {
      q = q.trim().toLowerCase();
      items = commands.filter((c) => !q || (c.label + " " + c.hint + " " + c.g).toLowerCase().includes(q));
      active = 0;
      list.innerHTML = "";
      if (!items.length) {
        list.innerHTML = '<li class="palette-empty">No matches.</li>';
        return;
      }
      let group = "";
      items.forEach((c, idx) => {
        if (c.g !== group) {
          group = c.g;
          const h = document.createElement("li");
          h.className = "palette-group";
          h.textContent = group;
          h.setAttribute("role", "presentation");
          list.appendChild(h);
        }
        const li = document.createElement("li");
        li.className = "palette-item" + (idx === 0 ? " is-active" : "");
        li.setAttribute("role", "option");
        li.dataset.idx = idx;
        li.innerHTML = `<span></span><small></small>`;
        li.firstChild.textContent = c.label;
        li.lastChild.textContent = c.hint;
        li.addEventListener("pointermove", () => setActive(idx));
        li.addEventListener("click", () => exec(idx));
        list.appendChild(li);
      });
    }
    function setActive(n) {
      active = (n + items.length) % items.length;
      $$(".palette-item", list).forEach((el) => el.classList.toggle("is-active", +el.dataset.idx === active));
      const el = $(`.palette-item[data-idx="${active}"]`, list);
      el && el.scrollIntoView({ block: "nearest" });
    }
    function exec(n) {
      const c = items[n];
      close();
      c && setTimeout(c.run, 60);
    }
    function open() {
      lastFocus = document.activeElement;
      pal.hidden = false;
      input.value = "";
      render("");
      setTimeout(() => input.focus(), 10);
    }
    function close() {
      pal.hidden = true;
      lastFocus && lastFocus.focus && lastFocus.focus({ preventScroll: true });
    }

    input.addEventListener("input", () => render(input.value));
    input.addEventListener("keydown", (e) => {
      if (e.key === "ArrowDown") { e.preventDefault(); setActive(active + 1); }
      else if (e.key === "ArrowUp") { e.preventDefault(); setActive(active - 1); }
      else if (e.key === "Enter") { e.preventDefault(); exec(active); }
    });
    $$("[data-palette-open]").forEach((b) => b.addEventListener("click", open));
    $$("[data-palette-close]").forEach((b) => b.addEventListener("click", close));
    document.addEventListener("keydown", (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        pal.hidden ? open() : close();
      } else if (e.key === "Escape") {
        if (!pal.hidden) close();
        else if (menuOpen) setMenu(false);
      }
    });

    // Show the right shortcut label
    const isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
    $$(".kbd-btn .mono").forEach((el) => (el.textContent = isMac ? "⌘K" : "Ctrl K"));
  })();

  onScroll();
})();
