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

  /* ---------- Theme toggle (persisted across pages via localStorage —
     the <head> inline script in layout.py reads this back before paint on
     every subsequent page load, so navigating pages no longer drops back
     to light mode). ---------- */
  function storageSet(key, val) { try { localStorage.setItem(key, val); } catch (e) {} }
  var themeBtns = document.querySelectorAll("[data-theme-toggle]");
  function setTheme(mode) {
    if (mode === "dark") root.setAttribute("data-theme", "dark");
    else root.removeAttribute("data-theme");
    storageSet("stikko-theme", mode);
  }
  themeBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var isDark = root.getAttribute("data-theme") === "dark";
      setTheme(isDark ? "light" : "dark");
    });
  });

  /* ---------- RTL toggle (persisted the same way; see BODY_DIR_INIT_SCRIPT
     in layout.py for the matching read-back). The icon-mirror CSS keys off
     the [dir="rtl"] ancestor selector directly, so no separate JS-managed
     class is needed to keep the icon in sync with a persisted state. ---------- */
  var dirBtns = document.querySelectorAll("[data-dir-toggle]");
  dirBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var isRtl = document.body.getAttribute("dir") === "rtl";
      var next = isRtl ? "ltr" : "rtl";
      document.body.setAttribute("dir", next);
      root.setAttribute("lang", isRtl ? "en" : "ar");
      storageSet("stikko-dir", next);
    });
  });

  /* ---------- Toast notifications (form submit feedback) ---------- */
  var TOAST_ICONS = {
    success: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.5 2.5L16 9"/></svg>',
    error: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7.5v6M12 16.8h.01"/></svg>'
  };
  function ensureToastStack() {
    var stack = document.querySelector(".toast-stack");
    if (!stack) {
      stack = document.createElement("div");
      stack.className = "toast-stack";
      stack.setAttribute("aria-live", "polite");
      document.body.appendChild(stack);
    }
    return stack;
  }
  function showToast(opts) {
    opts = opts || {};
    var type = opts.type === "error" ? "error" : "success";
    var duration = opts.duration || 4200;
    var stack = ensureToastStack();
    var toast = document.createElement("div");
    toast.className = "toast toast-" + type;
    toast.style.setProperty("--toast-duration", (duration / 1000) + "s");
    toast.innerHTML =
      '<span class="toast-icon">' + (TOAST_ICONS[type] || "") + "</span>" +
      '<span class="toast-body"><strong></strong><span></span></span>' +
      '<button type="button" class="toast-close" aria-label="Dismiss notification">&times;</button>' +
      '<span class="toast-bar"></span>';
    toast.querySelector(".toast-body strong").textContent = opts.title || "";
    toast.querySelector(".toast-body span").textContent = opts.message || "";
    stack.appendChild(toast);
    requestAnimationFrame(function () { toast.classList.add("show"); });
    var timer = setTimeout(remove, duration);
    function remove() {
      clearTimeout(timer);
      toast.classList.remove("show");
      toast.classList.add("hide");
      setTimeout(function () { toast.remove(); }, 350);
    }
    toast.querySelector(".toast-close").addEventListener("click", remove);
  }
  /* Exposed so admin-only dashboard.js (loaded after this file) can reuse
     the same toast system for row actions / modal confirmations instead of
     duplicating it. */
  window.showToast = showToast;

  /* ---------- Mobile nav ---------- */
  var hamburger = document.querySelector(".hamburger");
  var mobileNav = document.querySelector(".mobile-nav");
  var siteHeaderEl = document.querySelector(".site-header");
  if (hamburger && mobileNav) {
    hamburger.addEventListener("click", function () {
      var opening = !mobileNav.classList.contains("open");
      /* The announce bar above the sticky header isn't itself sticky, so the
         combined header height at the top of the page differs from the
         sticky header's own height once scrolled. Measure the header's
         actual bottom edge each time the panel opens so it always sits
         flush beneath both, instead of a fixed CSS offset that only
         matched one scroll position. */
      if (opening && siteHeaderEl) {
        mobileNav.style.top = siteHeaderEl.getBoundingClientRect().bottom + "px";
      }
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

    /* Accordion toggles for nav items with sub-links (e.g. "Home", which
       expands to Home — General Landing / Home — Enterprise & Bulk). A
       toggle button (not a link) so it expands in place instead of
       navigating and closing the whole mobile menu. */
    mobileNav.querySelectorAll(".mobile-nav-toggle").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var group = btn.closest(".mobile-nav-group");
        if (!group) return;
        var opening = !group.classList.contains("open");
        mobileNav.querySelectorAll(".mobile-nav-group.open").forEach(function (g) {
          if (g !== group) {
            g.classList.remove("open");
            var t = g.querySelector(".mobile-nav-toggle");
            if (t) t.setAttribute("aria-expanded", "false");
          }
        });
        group.classList.toggle("open", opening);
        btn.setAttribute("aria-expanded", opening ? "true" : "false");
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

  /* ---------- Generic dashboard-style tab-row — always swaps the active
     button; additionally filters a table's rows when the tab-row carries
     data-filter-scope (admin Orders status tabs, Users role/status tabs).
     A plain tab-row with no scope (e.g. the dashboard's Week/Month/Year
     chart tabs) just gets the active-state swap, unchanged. ---------- */
  document.querySelectorAll(".tab-row").forEach(function (tabs) {
    var scopeSel = tabs.getAttribute("data-filter-scope");
    var table = scopeSel ? document.querySelector(scopeSel) : null;
    var btns = tabs.querySelectorAll("button");
    btns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        btns.forEach(function (b) { b.classList.remove("active"); });
        btn.classList.add("active");
        if (!table) return;
        var filter = btn.getAttribute("data-filter") || "all";
        // If the table is paginated, only rows on the page currently on
        // screen participate — switching a status tab shouldn't reveal rows
        // that belong to a different page.
        var pager = table.closest(".panel") && table.closest(".panel").querySelector("[data-pagination]");
        var currentPage = pager ? (parseInt(pager.getAttribute("data-current-page"), 10) || 1) : null;
        table.querySelectorAll("tbody tr").forEach(function (row) {
          var page = row.getAttribute("data-page");
          var inScope = !page || !pager || parseInt(page, 10) === currentPage;
          var matches = filter === "all" || row.getAttribute("data-status") === filter || row.getAttribute("data-group") === filter;
          row.style.display = (inScope && matches) ? "" : "none";
        });
      });
    });
  });

  /* ---------- Table pagination (admin Orders) ---------- */
  document.querySelectorAll("[data-pagination]").forEach(function (pager) {
    var panel = pager.closest(".panel");
    var table = panel ? panel.querySelector(".data-table") : null;
    if (!table) return;
    var rows = table.querySelectorAll("tbody tr");
    var pageBtns = pager.querySelectorAll("[data-page-btn]");
    var prevBtn = pager.querySelector("[data-page-prev]");
    var nextBtn = pager.querySelector("[data-page-next]");
    var info = pager.querySelector("[data-page-info]");
    var pageSize = parseInt(pager.getAttribute("data-page-size"), 10) || 10;
    var total = parseInt(pager.getAttribute("data-total"), 10) || rows.length;
    var totalPages = pageBtns.length || 1;
    var filterTabs = panel.querySelector(".tab-row[data-filter-scope]");

    function goTo(pageNum) {
      pageNum = Math.max(1, Math.min(totalPages, pageNum));
      pager.setAttribute("data-current-page", pageNum);
      rows.forEach(function (row) {
        var rowPage = parseInt(row.getAttribute("data-page"), 10) || 1;
        row.style.display = (rowPage === pageNum) ? "" : "none";
      });
      pageBtns.forEach(function (b) {
        var isActive = parseInt(b.getAttribute("data-page-btn"), 10) === pageNum;
        b.classList.toggle("btn-primary", isActive);
        b.classList.toggle("btn-ghost", !isActive);
      });
      if (prevBtn) prevBtn.disabled = pageNum === 1;
      if (nextBtn) nextBtn.disabled = pageNum === totalPages;
      if (info) {
        var start = (pageNum - 1) * pageSize + 1;
        var end = Math.min(pageNum * pageSize, total);
        info.textContent = "Showing " + start + "–" + end + " of " + total + " orders";
      }
      // A status filter from a different page no longer applies once the
      // page changes — reset it to "All" so the new page's rows all show.
      if (filterTabs) {
        filterTabs.querySelectorAll("button").forEach(function (b) { b.classList.remove("active"); });
        var allBtn = filterTabs.querySelector('[data-filter="all"]');
        if (allBtn) allBtn.classList.add("active");
      }
    }
    pageBtns.forEach(function (b) {
      b.addEventListener("click", function () { goTo(parseInt(b.getAttribute("data-page-btn"), 10)); });
    });
    if (prevBtn) prevBtn.addEventListener("click", function () {
      goTo((parseInt(pager.getAttribute("data-current-page"), 10) || 1) - 1);
    });
    if (nextBtn) nextBtn.addEventListener("click", function () {
      goTo((parseInt(pager.getAttribute("data-current-page"), 10) || 1) + 1);
    });
    pager.setAttribute("data-current-page", "1");
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
      var successText = "Thanks! Your request has been received — this is a template demo, no data is sent.";
      var invalidText = "Please fill in all required fields correctly.";
      if (note) {
        note.textContent = valid ? successText : invalidText;
        note.style.color = valid ? "var(--success)" : "var(--danger)";
      }
      if (valid) {
        showToast({
          type: "success",
          title: form.getAttribute("data-success-title") || "Success!",
          message: form.getAttribute("data-success-message") || successText
        });
        form.reset();
      } else {
        showToast({ type: "error", title: "Almost there", message: invalidText });
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
