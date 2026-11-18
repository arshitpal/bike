/* ==========================================================================
   Diamond Automobile Service Center — Interactions
   Frontend only. No data is sent anywhere except the WhatsApp handoff
   that the visitor triggers and confirms themselves.
   ========================================================================== */
(function () {
  "use strict";

  const CFG = window.SITE_CONFIG || {};
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const hasGSAP = typeof window.gsap !== "undefined" && typeof window.ScrollTrigger !== "undefined";

  /* ---------- Config-driven content ---------- */
  function applyConfig() {
    const wa = (CFG.whatsapp || "").replace(/\D/g, "");
    if (wa) {
      $$("a[data-wa]").forEach((a) => {
        const url = new URL(a.href);
        a.href = `https://wa.me/${wa}${url.search}`;
      });
    }
    const addr = $('[data-config="address"]');
    if (addr && CFG.address) addr.textContent = CFG.address;
    const hours = $('[data-config="hours"]');
    if (hours && CFG.hours) hours.textContent = CFG.hours;

    if (CFG.mapQuery) {
      const ph = $("[data-map-placeholder]");
      if (ph) {
        const iframe = document.createElement("iframe");
        iframe.title = "Workshop location on Google Maps";
        iframe.loading = "lazy";
        iframe.referrerPolicy = "no-referrer-when-downgrade";
        iframe.src = `https://www.google.com/maps?q=${encodeURIComponent(CFG.mapQuery)}&output=embed`;
        const link = document.createElement("a");
        link.className = "btn btn--ghost btn--sm";
        link.style.marginTop = "12px";
        link.href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(CFG.mapQuery)}`;
        link.target = "_blank";
        link.rel = "noopener";
        link.textContent = "Open in Google Maps";
        ph.replaceWith(iframe);
        iframe.after(link);
      }
    }
    $$("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));
  }

  /* ---------- Loader ---------- */
  function hideLoader(cb) {
    const loader = $(".loader");
    const seen = (() => { try { return sessionStorage.getItem("dasc-loaded"); } catch (e) { return null; } })();
    const delay = reduceMotion || seen ? 0 : 1100;
    try { sessionStorage.setItem("dasc-loaded", "1"); } catch (e) { /* storage unavailable */ }
    setTimeout(() => {
      if (loader) loader.classList.add("is-done");
      cb && cb();
    }, delay);
  }

  /* ---------- Header: solid on scroll, hide on scroll down ---------- */
  function initHeader() {
    const header = $(".header");
    const mbar = $(".mbar");
    let lastY = window.scrollY;
    let ticking = false;

    const update = () => {
      const y = window.scrollY;
      header.classList.toggle("is-solid", y > 40);
      const menuOpen = document.body.classList.contains("menu-open");
      if (!menuOpen) header.classList.toggle("is-hidden", y > lastY && y > 640);
      if (mbar) mbar.classList.toggle("is-visible", y > window.innerHeight * 0.6);
      lastY = y;
      ticking = false;
    };
    window.addEventListener("scroll", () => {
      if (!ticking) { requestAnimationFrame(update); ticking = true; }
    }, { passive: true });
    update();

    // Reveal header when anything inside it receives keyboard focus
    header.addEventListener("focusin", () => header.classList.remove("is-hidden"));
  }

  /* ---------- Active section indicator ---------- */
  function initActiveNav() {
    const links = $$(".nav__link");
    const mlinks = $$(".mmenu__list a");
    const indicator = $(".nav__indicator");
    const nav = $(".nav");
    const ids = ["home", "services", "about", "brands", "contact"];
    const sections = ids.map((id) => document.getElementById(id)).filter(Boolean);

    const moveIndicator = (link) => {
      if (!indicator || !link || !nav) return;
      const nr = nav.getBoundingClientRect();
      const lr = link.getBoundingClientRect();
      indicator.style.width = `${lr.width}px`;
      indicator.style.transform = `translateX(${lr.left - nr.left}px)`;
      indicator.style.opacity = "1";
    };

    const setActive = (id) => {
      links.forEach((l) => {
        const on = l.getAttribute("href") === `#${id}`;
        l.classList.toggle("is-active", on);
        if (on) { l.setAttribute("aria-current", "true"); moveIndicator(l); }
        else l.removeAttribute("aria-current");
      });
      mlinks.forEach((l) => l.classList.toggle("is-active", l.getAttribute("href") === `#${id}`));
    };

    // Gallery sits between brands and contact; treat it as part of brands.
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) setActive(e.target.id); });
    }, { rootMargin: "-45% 0px -50% 0px" });
    sections.forEach((s) => io.observe(s));

    window.addEventListener("resize", () => moveIndicator($(".nav__link.is-active")));
    document.fonts && document.fonts.ready.then(() => moveIndicator($(".nav__link.is-active")));
  }

  /* ---------- Mobile menu ---------- */
  function initMenu() {
    const btn = $(".burger");
    const menu = $("#mobile-menu");
    if (!btn || !menu) return;

    const focusables = () => $$("a, button", menu);
    const open = () => {
      menu.removeAttribute("inert");
      menu.setAttribute("aria-hidden", "false");
      menu.classList.add("is-open");
      btn.setAttribute("aria-expanded", "true");
      btn.setAttribute("aria-label", "Close menu");
      document.body.classList.add("menu-open");
      $(".header").classList.remove("is-hidden");
      setTimeout(() => focusables()[0] && focusables()[0].focus(), 300);
    };
    const close = (returnFocus = true) => {
      menu.classList.remove("is-open");
      menu.setAttribute("aria-hidden", "true");
      menu.setAttribute("inert", "");
      btn.setAttribute("aria-expanded", "false");
      btn.setAttribute("aria-label", "Open menu");
      document.body.classList.remove("menu-open");
      if (returnFocus) btn.focus();
    };

    btn.addEventListener("click", () => (menu.classList.contains("is-open") ? close() : open()));
    menu.addEventListener("click", (e) => { if (e.target.closest("a")) close(false); });
    document.addEventListener("keydown", (e) => {
      if (!menu.classList.contains("is-open")) return;
      if (e.key === "Escape") close();
      if (e.key === "Tab") {
        // keep focus within burger + menu
        const items = [btn, ...focusables()];
        const first = items[0], last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
    window.matchMedia("(min-width: 1024px)").addEventListener("change", (m) => {
      if (m.matches && menu.classList.contains("is-open")) close(false);
    });
  }

  /* ---------- Services: image swap + preselect service ---------- */
  function initServices() {
    const rows = $$(".svc");
    const imgs = $$("[data-svc-img]");
    const tagN = $(".services__tag-n");
    const tagT = $(".services__tag-t");
    let current = 0;

    const activate = (i) => {
      if (i === current) return;
      current = i;
      rows.forEach((r) => r.classList.toggle("is-active", +r.dataset.svc === i));
      imgs.forEach((im) => im.classList.toggle("is-on", +im.dataset.svcImg === i));
      if (tagN) tagN.textContent = String(i + 1).padStart(2, "0");
      if (tagT) tagT.textContent = $(".svc__title", rows[i]).textContent;
    };

    rows.forEach((row) => {
      const i = +row.dataset.svc;
      row.addEventListener("mouseenter", () => activate(i));
      row.addEventListener("focusin", () => activate(i));
    });
    rows[0] && rows[0].classList.add("is-active");

    // On scroll (desktop sticky layout), follow the row in the middle of the viewport
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((e) => { if (e.isIntersecting) activate(+e.target.dataset.svc); });
      }, { rootMargin: "-48% 0px -48% 0px" });
      rows.forEach((r) => io.observe(r));
    }

    // "Book this" arrows preselect the service in the booking form
    $$("[data-service]").forEach((a) => {
      a.addEventListener("click", () => {
        const sel = $("#f-service");
        if (!sel) return;
        const opt = Array.from(sel.options).find((o) => o.value === a.dataset.service || o.text === a.dataset.service);
        if (opt) { sel.value = opt.value; sel.dispatchEvent(new Event("change")); }
        setTimeout(() => $("#f-name") && $("#f-name").focus({ preventScroll: true }), 700);
      });
    });
  }

  /* ---------- Booking form → WhatsApp handoff ---------- */
  function initBooking() {
    const form = $("#booking-form");
    if (!form) return;
    const done = $("#booking-done");
    const retry = $("#wa-retry");
    const resetBtn = $("#booking-reset");
    const dateInput = $("#f-date");

    // Earliest selectable date = today (local time)
    const todayISO = (() => {
      const d = new Date();
      d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
      return d.toISOString().slice(0, 10);
    })();
    if (dateInput) dateInput.min = todayISO;

    const normalisePhone = (v) => {
      let d = (v || "").replace(/\D/g, "");
      if (d.length === 12 && d.startsWith("91")) d = d.slice(2);
      if (d.length === 11 && d.startsWith("0")) d = d.slice(1);
      return d;
    };

    const rules = {
      name: (v) => (v.trim().length < 2 ? "Please enter your name." : /^[\p{L}\s.'-]+$/u.test(v.trim()) ? "" : "Please use letters only."),
      phone: (v) => (!v.trim() ? "Please enter your phone number." : /^[6-9]\d{9}$/.test(normalisePhone(v)) ? "" : "Enter a valid 10-digit mobile number."),
      brand: (v) => (v ? "" : "Please choose your vehicle brand."),
      service: (v) => (v ? "" : "Please choose the service you need."),
      date: (v) => (!v || v >= todayISO ? "" : "Please choose today or a future date.")
    };

    const showError = (name, msg) => {
      const input = form.elements[name];
      const field = input.closest(".field");
      const err = $(`#e-${name}`);
      field.classList.toggle("has-error", !!msg);
      input.setAttribute("aria-invalid", msg ? "true" : "false");
      if (err) err.textContent = msg;
    };
    const validateField = (name) => {
      const msg = rules[name](form.elements[name].value);
      showError(name, msg);
      return !msg;
    };

    // Validate on blur; once a field has errored, re-validate as the user types
    Object.keys(rules).forEach((name) => {
      const el = form.elements[name];
      el.addEventListener("blur", () => { if (el.value) validateField(name); });
      el.addEventListener("input", () => { if (el.getAttribute("aria-invalid") === "true") validateField(name); });
      el.addEventListener("change", () => { if (el.getAttribute("aria-invalid") === "true") validateField(name); });
    });

    const formatDate = (iso) => {
      if (!iso) return "";
      const [y, m, d] = iso.split("-").map(Number);
      return new Date(y, m - 1, d).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
    };

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const invalid = Object.keys(rules).filter((n) => !validateField(n));
      if (invalid.length) {
        form.elements[invalid[0]].focus();
        return;
      }
      const f = form.elements;
      const vehicle = [f.brand.value, f.model.value.trim()].filter(Boolean).join(" ");
      const lines = [
        `Hello ${CFG.businessName || "Diamond Automobile Service Center"}, I'd like to book a service.`,
        "",
        `*Name:* ${f.name.value.trim()}`,
        `*Phone:* ${normalisePhone(f.phone.value)}`,
        `*Vehicle:* ${vehicle}`,
        `*Service:* ${f.service.value}`
      ];
      if (f.date.value) lines.push(`*Preferred date:* ${formatDate(f.date.value)}`);
      if (f.message.value.trim()) lines.push(`*Details:* ${f.message.value.trim()}`);

      const wa = (CFG.whatsapp || "918265981050").replace(/\D/g, "");
      const url = `https://wa.me/${wa}?text=${encodeURIComponent(lines.join("\n"))}`;
      retry.href = url;
      window.open(url, "_blank", "noopener");

      form.hidden = true;
      done.hidden = false;
      done.focus();
    });

    resetBtn && resetBtn.addEventListener("click", () => {
      form.reset();
      Object.keys(rules).forEach((n) => showError(n, ""));
      done.hidden = true;
      form.hidden = false;
      form.elements.name.focus();
    });
  }

  /* ---------- Gallery lightbox ---------- */
  function initLightbox() {
    const dlg = $("#lightbox");
    const items = $$(".g-item");
    if (!dlg || !items.length || typeof dlg.showModal !== "function") return;
    const img = $(".lightbox__img", dlg);
    const cap = $(".lightbox__cap", dlg);
    let idx = 0;
    let opener = null;

    const show = (i) => {
      idx = (i + items.length) % items.length;
      const src = $("img", items[idx]);
      img.src = src.dataset.full || src.currentSrc || src.src;
      img.alt = src.alt;
      cap.textContent = $(".g-item__cap", items[idx]).textContent;
      // restart entrance animation
      img.style.animation = "none"; void img.offsetWidth; img.style.animation = "";
    };
    items.forEach((it, i) => it.addEventListener("click", () => {
      opener = it;
      show(i);
      dlg.showModal();
      document.body.classList.add("menu-open");
    }));
    $(".lightbox__close", dlg).addEventListener("click", () => dlg.close());
    $(".lightbox__nav--prev", dlg).addEventListener("click", () => show(idx - 1));
    $(".lightbox__nav--next", dlg).addEventListener("click", () => show(idx + 1));
    dlg.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") show(idx - 1);
      if (e.key === "ArrowRight") show(idx + 1);
    });
    dlg.addEventListener("click", (e) => { if (e.target === dlg) dlg.close(); });
    dlg.addEventListener("close", () => {
      document.body.classList.remove("menu-open");
      opener && opener.focus();
    });
  }

  /* ---------- Custom cursor + magnetic buttons (desktop only) ---------- */
  function initPointerFX() {
    if (!finePointer || reduceMotion) return;

    document.documentElement.classList.add("has-cursor");
    const cursor = $(".cursor");
    const dot = $(".cursor__dot");
    const ring = $(".cursor__ring");
    let mx = -100, my = -100, rx = -100, ry = -100;

    window.addEventListener("pointermove", (e) => {
      mx = e.clientX; my = e.clientY;
      dot.style.transform = `translate3d(${mx}px, ${my}px, 0)`;
    }, { passive: true });
    const loop = () => {
      rx += (mx - rx) * 0.18;
      ry += (my - ry) * 0.18;
      ring.style.transform = `translate3d(${rx}px, ${ry}px, 0)`;
      requestAnimationFrame(loop);
    };
    loop();

    const hoverSel = "a, button, .svc, .g-item, input, select, textarea, label";
    document.addEventListener("pointerover", (e) => { if (e.target.closest(hoverSel)) cursor.classList.add("is-hover"); });
    document.addEventListener("pointerout", (e) => { if (e.target.closest(hoverSel)) cursor.classList.remove("is-hover"); });
    document.addEventListener("mouseleave", () => cursor.classList.add("is-hidden"));
    document.addEventListener("mouseenter", () => cursor.classList.remove("is-hidden"));

    // Magnetic pull on primary CTAs
    $$("[data-magnetic]").forEach((el) => {
      const strength = 0.28;
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - (r.left + r.width / 2)) * strength;
        const y = (e.clientY - (r.top + r.height / 2)) * strength;
        el.style.transform = `translate(${x}px, ${y}px)`;
      });
      el.addEventListener("pointerleave", () => {
        el.style.transition = "transform 500ms cubic-bezier(.16,1,.3,1)";
        el.style.transform = "";
        setTimeout(() => (el.style.transition = ""), 500);
      });
    });
  }

  /* ---------- GSAP motion ---------- */
  function initMotion() {
    if (!hasGSAP || reduceMotion) return false;
    const { gsap, ScrollTrigger } = window;
    gsap.registerPlugin(ScrollTrigger);
    document.documentElement.classList.add("gsap-ready");

    // Hide hero pieces immediately (the loader is covering them)
    gsap.set("[data-hero]", { autoAlpha: 0, y: 24 });
    gsap.set(".hero__title .line > span", { autoAlpha: 1, yPercent: 110 });
    gsap.set(".hero__img", { scale: 1.18 });

    const heroIntro = () => {
      const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
      tl.to(".hero__img", { scale: 1, duration: 2.2, ease: "power3.out" }, 0)
        .to(".hero__eyebrow", { autoAlpha: 1, y: 0, duration: 0.9 }, 0.15)
        .to(".hero__title .line > span", { yPercent: 0, duration: 1.2, stagger: 0.11 }, 0.2)
        .from(".hero__rail", { scaleY: 0, transformOrigin: "top", duration: 1.2, ease: "power4.inOut" }, 0.2)
        .to(".hero__lead", { autoAlpha: 1, y: 0, duration: 0.9 }, 0.65)
        .to(".hero__ctas", { autoAlpha: 1, y: 0, duration: 0.9 }, 0.75)
        .to(".hero__bar", { autoAlpha: 1, y: 0, duration: 0.9 }, 0.9);
    };

    // Hero parallax (background only)
    gsap.to(".hero__media", {
      yPercent: 12, ease: "none",
      scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true }
    });
    gsap.to(".hero__content", {
      autoAlpha: 0.2, y: -40, ease: "none",
      scrollTrigger: { trigger: ".hero", start: "40% top", end: "bottom top", scrub: true }
    });

    // Section titles: line-by-line mask reveal
    $$("[data-split]").forEach((title) => {
      gsap.from($$(".line > span", title), {
        yPercent: 110, duration: 1.1, ease: "expo.out", stagger: 0.1,
        scrollTrigger: { trigger: title, start: "top 85%", toggleActions: "play none none none" }
      });
    });

    // Generic fade-up reveals, batched for performance
    gsap.set("[data-reveal]", { autoAlpha: 0, y: 32 });
    ScrollTrigger.batch("[data-reveal]", {
      start: "top 88%",
      once: false,
      onEnter: (batch) => gsap.to(batch, { autoAlpha: 1, y: 0, duration: 0.9, ease: "power3.out", stagger: 0.08, overwrite: true })
    });

    // Image reveals: clip wipe + settle
    $$("[data-reveal-img]").forEach((el) => {
      const img = $("img", el);
      const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: "top 85%", toggleActions: "play none none none" } });
      tl.fromTo(el, { clipPath: "inset(100% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.2, ease: "expo.inOut" })
        .from(img, { scale: 1.25, duration: 1.6, ease: "expo.out" }, 0.1)
        .set(el, { clearProps: "clipPath" });
    });

    // Parallax accents
    gsap.fromTo(".brands__ghost", { xPercent: 5 }, {
      xPercent: -25, ease: "none",
      scrollTrigger: { trigger: ".brands", start: "top bottom", end: "bottom top", scrub: 0.5 }
    });
    gsap.fromTo(".why__photo img", { yPercent: -6 }, {
      yPercent: 6, ease: "none",
      scrollTrigger: { trigger: ".why", start: "top bottom", end: "bottom top", scrub: true }
    });
    gsap.fromTo(".footer__word", { yPercent: 40 }, {
      yPercent: 0, ease: "none",
      scrollTrigger: { trigger: ".footer", start: "top bottom", end: "bottom bottom", scrub: true }
    });

    // Brand tiles: slight stagger scale-in
    gsap.from(".brand-tile__logo", {
      scale: 0.7, autoAlpha: 0, duration: 1, ease: "back.out(1.6)", stagger: 0.1,
      scrollTrigger: { trigger: ".brand-grid", start: "top 80%", toggleActions: "play none none none" }
    });

    // Recalculate after fonts/images settle
    window.addEventListener("load", () => ScrollTrigger.refresh());
    return heroIntro;
  }

  /* ---------- Boot ---------- */
  function boot() {
    applyConfig();
    initHeader();
    initActiveNav();
    initMenu();
    initServices();
    initBooking();
    initLightbox();
    initPointerFX();
    const heroIntro = initMotion();
    hideLoader(() => { if (typeof heroIntro === "function") heroIntro(); });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
