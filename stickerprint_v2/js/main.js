/*!
  StickerCraft — main.js
  Shared front-end interactions: theme, RTL, nav, reveal-on-scroll,
  3D tilt, counters, FAQ accordion, blog filter, forms, countdown.
  Vanilla JS — zero dependencies.
========================================================================== */
(function () {
  "use strict";

  var root = document.documentElement;

  /* ---------- Page loader ---------- */
  window.addEventListener("load", function () {
    var loader = document.querySelector(".page-loader");
    if (loader) setTimeout(function () { loader.classList.add("done"); }, 250);
  });

  /* ---------- Theme toggle (session-memory; no persistence by design) ---------- */
  var themeBtns = document.querySelectorAll("[data-theme-toggle]");
  function setTheme(mode) {
    if (mode === "dark") root.setAttribute("data-theme", "dark");
    else root.removeAttribute("data-theme");
  }
  themeBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var isDark = root.getAttribute("data-theme") === "dark";
      setTheme(isDark ? "light" : "dark");
    });
  });

  /* ---------- RTL toggle ---------- */
  var dirBtns = document.querySelectorAll("[data-dir-toggle]");
  dirBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var isRtl = document.body.getAttribute("dir") === "rtl";
      document.body.setAttribute("dir", isRtl ? "ltr" : "rtl");
      root.setAttribute("lang", isRtl ? "en" : "ar");
      btn.classList.toggle("is-rtl", !isRtl);
    });
  });

  /* ---------- Mobile nav ---------- */
  var hamburger = document.querySelector(".hamburger");
  var mobileNav = document.querySelector(".mobile-nav");
  if (hamburger && mobileNav) {
    hamburger.addEventListener("click", function () {
      hamburger.classList.toggle("active");
      mobileNav.classList.toggle("open");
      document.body.style.overflow = mobileNav.classList.contains("open") ? "hidden" : "";
    });
    mobileNav.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        hamburger.classList.remove("active");
        mobileNav.classList.remove("open");
        document.body.style.overflow = "";
      });
    });
  }

  /* ---------- Admin sidebar toggle (mobile) ---------- */
  var sidebarToggle = document.querySelector("[data-sidebar-toggle]");
  var sidebar = document.querySelector(".admin-sidebar");
  if (sidebarToggle && sidebar) {
    sidebarToggle.addEventListener("click", function () { sidebar.classList.toggle("open"); });
    document.addEventListener("click", function (e) {
      if (window.innerWidth <= 1080 && sidebar.classList.contains("open") &&
          !sidebar.contains(e.target) && e.target !== sidebarToggle && !sidebarToggle.contains(e.target)) {
        sidebar.classList.remove("open");
      }
    });
  }

  /* ---------- Header scroll state ---------- */
  var header = document.querySelector(".site-header");
  if (header) {
    var onScroll = function () {
      header.style.boxShadow = window.scrollY > 12 ? "var(--shadow-md)" : "none";
    };
    document.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ---------- Back to top ---------- */
  var backTop = document.querySelector(".back-to-top");
  if (backTop) {
    document.addEventListener("scroll", function () {
      backTop.classList.toggle("show", window.scrollY > 500);
    }, { passive: true });
    backTop.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  /* ---------- Reveal on scroll ---------- */
  var revealEls = document.querySelectorAll(".reveal, .reveal-scale, .reveal-left, .reveal-right");
  if ("IntersectionObserver" in window && revealEls.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -40px 0px" });
    revealEls.forEach(function (el, i) {
      el.style.setProperty("--i", i % 6);
      io.observe(el);
    });
  } else {
    revealEls.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---------- 3D tilt cards ---------- */
  document.querySelectorAll(".tilt-wrap").forEach(function (wrap) {
    var el = wrap.querySelector(".tilt-el") || wrap;
    wrap.addEventListener("mousemove", function (e) {
      var r = wrap.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width - 0.5;
      var y = (e.clientY - r.top) / r.height - 0.5;
      el.style.transform = "rotateY(" + (x * 14) + "deg) rotateX(" + (y * -14) + "deg) translateZ(10px)";
    });
    wrap.addEventListener("mouseleave", function () {
      el.style.transform = "rotateY(0) rotateX(0) translateZ(0)";
    });
  });

  /* ---------- Cursor glow ---------- */
  var glow = document.querySelector(".glow-cursor");
  if (glow && window.matchMedia("(hover:hover)").matches) {
    document.addEventListener("mousemove", function (e) {
      glow.style.left = e.clientX + "px";
      glow.style.top = e.clientY + "px";
    });
  }

  /* ---------- Animated counters ---------- */
  var counters = document.querySelectorAll("[data-count]");
  if (counters.length && "IntersectionObserver" in window) {
    var counterIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var target = parseFloat(el.getAttribute("data-count"));
        var suffix = el.getAttribute("data-suffix") || "";
        var dur = 1600, start = null;
        function step(ts) {
          if (!start) start = ts;
          var p = Math.min((ts - start) / dur, 1);
          var eased = 1 - Math.pow(1 - p, 3);
          var val = target * eased;
          el.textContent = (target % 1 === 0 ? Math.floor(val) : val.toFixed(1)) + suffix;
          if (p < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
        counterIO.unobserve(el);
      });
    }, { threshold: 0.5 });
    counters.forEach(function (el) { counterIO.observe(el); });
  }

  /* ---------- FAQ accordion ---------- */
  document.querySelectorAll(".faq-item").forEach(function (item) {
    var q = item.querySelector(".faq-q");
    var a = item.querySelector(".faq-a");
    if (!q || !a) return;
    q.addEventListener("click", function () {
      var isOpen = item.classList.contains("open");
      item.closest(".faq-list, .faq-group, body")
        .querySelectorAll(".faq-item.open").forEach(function (openItem) {
          if (openItem !== item) {
            openItem.classList.remove("open");
            openItem.querySelector(".faq-a").style.maxHeight = null;
          }
        });
      item.classList.toggle("open", !isOpen);
      a.style.maxHeight = !isOpen ? a.scrollHeight + "px" : null;
    });
  });

  /* ---------- Blog filter / search ---------- */
  var blogFilters = document.querySelectorAll("[data-blog-filter]");
  var blogCards = document.querySelectorAll("[data-blog-cat]");
  blogFilters.forEach(function (btn) {
    btn.addEventListener("click", function () {
      blogFilters.forEach(function (b) { b.classList.remove("active"); });
      btn.classList.add("active");
      var cat = btn.getAttribute("data-blog-filter");
      blogCards.forEach(function (card) {
        var show = cat === "all" || card.getAttribute("data-blog-cat") === cat;
        card.style.display = show ? "" : "none";
      });
    });
  });
  var blogSearch = document.querySelector("[data-blog-search]");
  if (blogSearch) {
    blogSearch.addEventListener("input", function () {
      var term = blogSearch.value.trim().toLowerCase();
      blogCards.forEach(function (card) {
        var text = card.textContent.toLowerCase();
        card.style.display = text.indexOf(term) > -1 ? "" : "none";
      });
    });
  }

  /* ---------- Password visibility toggle ---------- */
  document.querySelectorAll("[data-pw-toggle]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var input = document.querySelector(btn.getAttribute("data-pw-toggle"));
      if (!input) return;
      input.type = input.type === "password" ? "text" : "password";
      btn.classList.toggle("is-visible");
    });
  });

  /* ---------- Auth tabs ---------- */
  function activateAuthTab(tabs, target) {
    tabs.querySelectorAll("button").forEach(function (b) {
      b.classList.toggle("active", b.getAttribute("data-tab-target") === target);
    });
    document.querySelectorAll("[data-tab-panel]").forEach(function (panel) {
      panel.style.display = panel.getAttribute("data-tab-panel") === target ? "" : "none";
    });
  }
  document.querySelectorAll(".auth-tabs").forEach(function (tabs) {
    tabs.querySelectorAll("button").forEach(function (btn) {
      btn.addEventListener("click", function () {
        activateAuthTab(tabs, btn.getAttribute("data-tab-target"));
      });
    });
  });
  /* Deep-link support: login.html?tab=register jumps straight to the Register panel
     (used by the header's separate Login / Register buttons). */
  var authTabsEl = document.querySelector(".auth-tabs");
  if (authTabsEl) {
    var authParams = new URLSearchParams(window.location.search);
    if (authParams.get("tab") === "register") activateAuthTab(authTabsEl, "register");
  }

  /* ---------- Generic dashboard-style tab-row ---------- */
  document.querySelectorAll(".tab-row").forEach(function (tabs) {
    var btns = tabs.querySelectorAll("button");
    btns.forEach(function (btn) {
      btn.addEventListener("click", function () { btns.forEach(function (b) { b.classList.remove("active"); }); btn.classList.add("active"); });
    });
  });

  /* ---------- Countdown (coming soon) ---------- */
  var countdown = document.querySelector("[data-countdown]");
  if (countdown) {
    var target = new Date(countdown.getAttribute("data-countdown")).getTime();
    var dEl = countdown.querySelector("[data-d]"), hEl = countdown.querySelector("[data-h]"),
        mEl = countdown.querySelector("[data-m]"), sEl = countdown.querySelector("[data-s]");
    function tick() {
      var diff = Math.max(target - Date.now(), 0);
      var d = Math.floor(diff / 864e5), h = Math.floor(diff / 36e5) % 24,
          m = Math.floor(diff / 6e4) % 60, s = Math.floor(diff / 1e3) % 60;
      if (dEl) dEl.textContent = String(d).padStart(2, "0");
      if (hEl) hEl.textContent = String(h).padStart(2, "0");
      if (mEl) mEl.textContent = String(m).padStart(2, "0");
      if (sEl) sEl.textContent = String(s).padStart(2, "0");
    }
    tick();
    setInterval(tick, 1000);
  }

  /* ---------- Upload drop zone ---------- */
  var dropZone = document.querySelector("[data-dropzone]");
  if (dropZone) {
    var fileInput = dropZone.querySelector("input[type=file]");
    var fileList = document.querySelector("[data-file-list]");
    ["dragenter", "dragover"].forEach(function (evt) {
      dropZone.addEventListener(evt, function (e) { e.preventDefault(); dropZone.classList.add("drag"); });
    });
    ["dragleave", "drop"].forEach(function (evt) {
      dropZone.addEventListener(evt, function (e) { e.preventDefault(); dropZone.classList.remove("drag"); });
    });
    function renderFiles(files) {
      if (!fileList) return;
      fileList.innerHTML = "";
      Array.prototype.forEach.call(files, function (f) {
        var li = document.createElement("li");
        li.textContent = f.name + "  (" + (f.size / 1024).toFixed(0) + " KB)";
        fileList.appendChild(li);
      });
    }
    dropZone.addEventListener("drop", function (e) {
      if (e.dataTransfer.files.length) renderFiles(e.dataTransfer.files);
    });
    if (fileInput) fileInput.addEventListener("change", function () { renderFiles(fileInput.files); });
    dropZone.addEventListener("click", function (e) {
      if (e.target === dropZone || e.target.closest(".upload-cta")) fileInput && fileInput.click();
    });
  }

  /* ---------- Basic form validation feedback (demo only, no submission) ---------- */
  document.querySelectorAll("form[data-demo-form]").forEach(function (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var note = form.querySelector("[data-form-note]");
      var valid = form.checkValidity();
      if (note) {
        note.textContent = valid ? "Thanks! Your request has been received — this is a template demo, no data is sent." : "Please fill in all required fields correctly.";
        note.style.color = valid ? "var(--success)" : "var(--danger)";
      }
    });
  });

  /* ---------- Inbox demo interaction ---------- */
  document.querySelectorAll(".inbox-item").forEach(function (item) {
    item.addEventListener("click", function () {
      document.querySelectorAll(".inbox-item").forEach(function (i) { i.classList.remove("active"); });
      item.classList.add("active");
      item.classList.remove("unread");
    });
  });

  /* ---------- Range slider for bulk pricing calc ---------- */
  document.querySelectorAll("[data-qty-range]").forEach(function (range) {
    var out = document.querySelector(range.getAttribute("data-qty-range"));
    var priceOut = document.querySelector(range.getAttribute("data-price-out") || "");
    var basePrice = parseFloat(range.getAttribute("data-base-price") || "0.85");
    function update() {
      var qty = parseInt(range.value, 10);
      if (out) out.textContent = qty.toLocaleString();
      if (priceOut) {
        var tierMult = qty >= 5000 ? 0.45 : qty >= 1000 ? 0.6 : qty >= 500 ? 0.75 : qty >= 100 ? 0.9 : 1;
        var unit = basePrice * tierMult;
        priceOut.textContent = "$" + unit.toFixed(2) + " / unit · $" + (unit * qty).toFixed(2) + " total";
      }
    }
    range.addEventListener("input", update);
    update();
  });
})();
