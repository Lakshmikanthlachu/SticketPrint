/*!
  StickerCraft Admin — dashboard.js
  Small admin-only interactions layered on top of main.js
========================================================================== */
(function () {
  "use strict";

  /* Select-all checkbox in data tables */
  document.querySelectorAll(".data-table thead input[type=checkbox]").forEach(function (master) {
    master.addEventListener("change", function () {
      var table = master.closest("table");
      table.querySelectorAll("tbody input[type=checkbox]").forEach(function (cb) { cb.checked = master.checked; });
    });
  });

  /* Quick client-side search across visible data tables */
  var adminSearch = document.querySelector(".admin-search input");
  if (adminSearch) {
    adminSearch.addEventListener("input", function () {
      var term = adminSearch.value.trim().toLowerCase();
      document.querySelectorAll(".data-table tbody tr").forEach(function (row) {
        row.style.display = row.textContent.toLowerCase().indexOf(term) > -1 ? "" : "none";
      });
      document.querySelectorAll(".inbox-item").forEach(function (item) {
        item.style.display = item.textContent.toLowerCase().indexOf(term) > -1 ? "" : "none";
      });
    });
  }

  /* ------------------------------------------------------------------
     Small icon set matching icons.py's outline style, for markup this
     file generates at runtime (new table rows, row-action buttons) where
     the server-rendered icon library isn't reachable.
  ------------------------------------------------------------------ */
  var ROW_ICONS = {
    eye: '<path d="M2 12s3.8-7 10-7 10 7 10 7-3.8 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/>',
    edit: '<path d="M4 20l4.5-1 10-10-3.5-3.5-10 10L4 20z"/><path d="M14 6.5l3.5 3.5"/>',
    trash: '<path d="M4 7h16"/><path d="M9 7V4.5A1.5 1.5 0 0 1 10.5 3h3A1.5 1.5 0 0 1 15 4.5V7"/><path d="M6 7l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13"/>'
  };
  function rowIcon(name) {
    return '<svg class="icon icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
      'stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      (ROW_ICONS[name] || "") + "</svg>";
  }
  function rowActionsHtml() {
    return '<div class="row-actions"><button type="button" title="View">' + rowIcon("eye") +
      '</button><button type="button" title="Edit">' + rowIcon("edit") +
      '</button><button type="button" title="Delete">' + rowIcon("trash") + "</button></div>";
  }
  function escAttr(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;"); }
  function escHtml(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
  function toast(opts) { if (window.showToast) window.showToast(opts); }

  /* ------------------------------------------------------------------
     Generic modal (view / edit / delete-confirm / create forms all reuse
     this single overlay). Built once, content swapped per open() call.
  ------------------------------------------------------------------ */
  function ensureModal() {
    var overlay = document.querySelector(".modal-overlay");
    if (overlay) return overlay;
    overlay = document.createElement("div");
    overlay.className = "modal-overlay";
    overlay.innerHTML =
      '<div class="modal" role="dialog" aria-modal="true">' +
      '<div class="modal-head"><h3></h3><button type="button" class="modal-close" aria-label="Close">&times;</button></div>' +
      '<div class="modal-body"></div>' +
      '<div class="modal-foot"></div>' +
      "</div>";
    document.body.appendChild(overlay);
    overlay.addEventListener("click", function (e) { if (e.target === overlay) closeModal(); });
    overlay.querySelector(".modal-close").addEventListener("click", closeModal);
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && overlay.classList.contains("show")) closeModal();
    });
    return overlay;
  }
  function closeModal() {
    var overlay = document.querySelector(".modal-overlay");
    if (overlay) overlay.classList.remove("show");
  }
  function openModal(opts) {
    var overlay = ensureModal();
    overlay.querySelector(".modal").classList.toggle("modal-danger", !!opts.danger);
    overlay.querySelector(".modal-head h3").textContent = opts.title || "";
    var body = overlay.querySelector(".modal-body");
    body.innerHTML = opts.body || "";
    var foot = overlay.querySelector(".modal-foot");
    foot.innerHTML = "";
    (opts.actions || []).forEach(function (a) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn btn-sm " + (a.cls || "btn-ghost");
      btn.textContent = a.label;
      btn.addEventListener("click", function () {
        if (a.onClick) a.onClick(body);
        if (a.close !== false) closeModal();
      });
      foot.appendChild(btn);
    });
    requestAnimationFrame(function () { overlay.classList.add("show"); });
    var focusable = body.querySelector("input, select, textarea");
    setTimeout(function () { if (focusable) focusable.focus(); }, 60);
    return body;
  }

  function fieldOptions(values, current, labels) {
    return values.map(function (v, i) {
      return '<option value="' + escAttr(v) + '"' + (v === current ? " selected" : "") + ">" +
        escHtml((labels && labels[i]) || v) + "</option>";
    }).join("");
  }
  function capitalize(s) { s = String(s || ""); return s.charAt(0).toUpperCase() + s.slice(1); }

  /* ------------------------------------------------------------------
     Row actions — View / Edit / Delete — for the Users and Orders admin
     tables. Delegated at the table level so rows created later (Invite
     User / New Order) automatically pick up working actions too.
  ------------------------------------------------------------------ */
  function readRowData(table, row) {
    if (table.id === "usersTable") {
      var nameEl = row.querySelector(".row-avatar strong");
      /* NOT ".row-avatar span" — that also matches the avatar ".av" span
         itself (first in document order), which would silently grab the
         wrong element. The email lives in the span *inside* the wrapping
         div next to <strong>, so scope one level deeper. */
      var emailEl = row.querySelector(".row-avatar div span");
      var chip = row.querySelector(".status-chip");
      return {
        kind: "user",
        name: nameEl ? nameEl.textContent.trim() : "",
        email: emailEl ? emailEl.textContent.trim() : "",
        role: row.children[2] ? row.children[2].textContent.trim() : "",
        status: chip ? chip.textContent.trim() : "",
        statusValue: row.getAttribute("data-status") || "active",
        date: row.children[4] ? row.children[4].textContent.trim() : ""
      };
    }
    if (table.id === "ordersTable") {
      var chip2 = row.querySelector(".status-chip");
      return {
        kind: "order",
        id: row.children[1] ? row.children[1].textContent.trim() : "",
        customer: row.children[2] ? row.children[2].textContent.trim() : "",
        product: row.children[3] ? row.children[3].textContent.trim() : "",
        qty: row.children[4] ? row.children[4].textContent.trim() : "",
        amount: row.children[5] ? row.children[5].textContent.trim() : "",
        status: chip2 ? chip2.textContent.trim() : "",
        statusValue: row.getAttribute("data-status") || "pending",
        date: row.children[7] ? row.children[7].textContent.trim() : ""
      };
    }
    return null;
  }

  function openViewModal(data) {
    var rows = data.kind === "user"
      ? [["Name", escHtml(data.name)], ["Email", escHtml(data.email)], ["Role", escHtml(data.role)],
         ["Status", '<span class="status-chip ' + data.statusValue + '">' + escHtml(data.status) + "</span>"],
         ["Joined", escHtml(data.date)]]
      : [["Order ID", escHtml(data.id)], ["Customer", escHtml(data.customer)], ["Product", escHtml(data.product)],
         ["Quantity", escHtml(data.qty)], ["Amount", escHtml(data.amount)],
         ["Status", '<span class="status-chip ' + data.statusValue + '">' + escHtml(data.status) + "</span>"],
         ["Date", escHtml(data.date)]];
    var body = '<dl class="modal-view-grid">' + rows.map(function (r) {
      return "<dt>" + r[0] + "</dt><dd>" + r[1] + "</dd>";
    }).join("") + "</dl>";
    openModal({ title: data.kind === "user" ? "User Details" : "Order Details", body: body,
      actions: [{ label: "Close", cls: "btn-ghost" }] });
  }

  function openEditModal(table, row, data) {
    var isUser = data.kind === "user";
    var body = isUser
      ? '<form class="grid gap-md" data-edit-form>' +
        '<div class="field"><label>Full Name</label><input type="text" name="name" value="' + escAttr(data.name) + '" required></div>' +
        '<div class="field"><label>Email</label><input type="email" name="email" value="' + escAttr(data.email) + '" required></div>' +
        '<div class="field"><label>Role</label><select name="role">' +
          fieldOptions(["Customer", "Studio Admin", "Production Lead", "Designer", "Operations"], data.role) +
        '</select></div>' +
        '<div class="field"><label>Status</label><select name="status">' +
          fieldOptions(["active", "pending", "blocked"], data.statusValue, ["Active", "Pending", "Blocked"]) +
        "</select></div></form>"
      : '<form class="grid gap-md" data-edit-form>' +
        '<div class="field"><label>Customer</label><input type="text" name="customer" value="' + escAttr(data.customer) + '" required></div>' +
        '<div class="field"><label>Product</label><input type="text" name="product" value="' + escAttr(data.product) + '" required></div>' +
        '<div class="grid grid-2 gap-md">' +
        '<div class="field"><label>Quantity</label><input type="text" name="qty" value="' + escAttr(data.qty) + '"></div>' +
        '<div class="field"><label>Amount</label><input type="text" name="amount" value="' + escAttr(data.amount) + '"></div>' +
        "</div>" +
        '<div class="field"><label>Status</label><select name="status">' +
          fieldOptions(["paid", "pending", "failed"], data.statusValue, ["Paid", "Pending", "Failed"]) +
        "</select></div></form>";

    var body_el = openModal({
      title: isUser ? "Edit User" : "Edit Order",
      body: body,
      actions: [
        { label: "Cancel", cls: "btn-ghost" },
        {
          label: "Save Changes", cls: "btn-primary", close: false, onClick: function (b) {
            var form = b.querySelector("[data-edit-form]");
            if (!form.reportValidity()) return;
            var f = form;
            if (isUser) {
              row.querySelector(".row-avatar strong").textContent = f.name.value.trim();
              row.querySelector(".row-avatar div span").textContent = f.email.value.trim();
              row.children[2].textContent = f.role.value;
              var chip = row.querySelector(".status-chip");
              chip.className = "status-chip " + f.status.value;
              chip.textContent = capitalize(f.status.value);
              row.setAttribute("data-status", f.status.value);
              row.setAttribute("data-group", f.role.value === "Customer" ? "customer" : "team");
              toast({ title: "User updated", message: f.name.value.trim() + "'s details have been saved." });
            } else {
              row.children[2].textContent = f.customer.value.trim();
              row.children[3].textContent = f.product.value.trim();
              row.children[4].textContent = f.qty.value.trim();
              row.children[5].textContent = f.amount.value.trim();
              var chip2 = row.querySelector(".status-chip");
              chip2.className = "status-chip " + f.status.value;
              chip2.textContent = capitalize(f.status.value);
              row.setAttribute("data-status", f.status.value);
              toast({ title: "Order updated", message: data.id + " has been saved." });
            }
            closeModal();
          }
        }
      ]
    });
    body_el.querySelector("form").addEventListener("submit", function (e) { e.preventDefault(); });
  }

  function openDeleteModal(table, row, data) {
    var label = data.kind === "user" ? (data.name || "this user") : (data.id || "this order");
    openModal({
      title: data.kind === "user" ? "Delete User" : "Delete Order",
      danger: true,
      body: "<p>Are you sure you want to delete <strong>" + escHtml(label) + "</strong>? This can&rsquo;t be undone.</p>",
      actions: [
        { label: "Cancel", cls: "btn-ghost" },
        {
          label: "Delete", cls: "btn-danger", onClick: function () {
            row.style.transition = "opacity .25s ease, transform .25s ease";
            row.style.opacity = "0";
            row.style.transform = "translateX(10px)";
            setTimeout(function () { row.remove(); }, 220);
            toast({ title: data.kind === "user" ? "User deleted" : "Order deleted", message: label + " has been removed." });
          }
        }
      ]
    });
  }

  document.querySelectorAll(".data-table").forEach(function (table) {
    table.addEventListener("click", function (e) {
      var btn = e.target.closest(".row-actions button");
      if (!btn || !table.contains(btn)) return;
      var row = btn.closest("tr");
      var data = readRowData(table, row);
      if (!data) return;
      var action = btn.getAttribute("title");
      if (action === "View") openViewModal(data);
      else if (action === "Edit") openEditModal(table, row, data);
      else if (action === "Delete") openDeleteModal(table, row, data);
    });
  });

  /* ------------------------------------------------------------------
     "New Order" (Orders page) and "Invite User" (Users page) — create a
     real row at the top of the table, wired into the same row-actions
     delegation above for free.
  ------------------------------------------------------------------ */
  function bumpPaginationTotal(tableEl, delta) {
    var panel = tableEl.closest(".panel");
    var pager = panel && panel.querySelector("[data-pagination]");
    if (!pager) return;
    var total = (parseInt(pager.getAttribute("data-total"), 10) || 0) + delta;
    pager.setAttribute("data-total", total);
    var info = pager.querySelector("[data-page-info]");
    if (info) {
      var m = info.textContent.match(/(\d+)\D+(\d+) of \d+/);
      if (m) {
        var end = Math.min(parseInt(m[2], 10) + delta, total);
        info.textContent = "Showing " + m[1] + "–" + end + " of " + total + " orders";
      }
    }
  }

  var newOrderBtn = document.querySelector("[data-new-order-btn]");
  if (newOrderBtn) {
    newOrderBtn.addEventListener("click", function () {
      var products = ["Die-Cut Stickers", "Product Labels", "Barcode Stickers", "Wall Decals", "Promotional Stickers"];
      var body = openModal({
        title: "New Order",
        body: '<form class="grid gap-md" data-new-order-form>' +
          '<div class="field"><label>Customer</label><input type="text" name="customer" placeholder="e.g. Marlowe &amp; Co." required></div>' +
          '<div class="field"><label>Product</label><select name="product">' + fieldOptions(products, products[0]) + "</select></div>" +
          '<div class="grid grid-2 gap-md">' +
          '<div class="field"><label>Quantity</label><input type="text" name="qty" placeholder="e.g. 1,000 pcs" required></div>' +
          '<div class="field"><label>Amount</label><input type="text" name="amount" placeholder="e.g. $250.00" required></div>' +
          "</div>" +
          '<div class="field"><label>Status</label><select name="status">' +
            fieldOptions(["pending", "paid", "failed"], "pending", ["Pending", "Paid", "Failed"]) +
          "</select></div></form>",
        actions: [
          { label: "Cancel", cls: "btn-ghost" },
          {
            label: "Create Order", cls: "btn-primary", close: false, onClick: function (b) {
              var f = b.querySelector("[data-new-order-form]");
              if (!f.reportValidity()) return;
              var table = document.getElementById("ordersTable");
              var ids = Array.from(table.querySelectorAll("tbody tr td strong")).map(function (el) {
                var mm = el.textContent.match(/(\d+)/); return mm ? parseInt(mm[1], 10) : 0;
              });
              var newId = "#ST-" + ((ids.length ? Math.max.apply(null, ids) : 10482) + 1);
              var today = new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
              var status = f.status.value;
              var tr = document.createElement("tr");
              tr.setAttribute("data-status", status);
              tr.setAttribute("data-page", "1");
              tr.innerHTML =
                "<td><input type=\"checkbox\"></td><td><strong>" + escHtml(newId) + "</strong></td>" +
                "<td>" + escHtml(f.customer.value.trim()) + "</td><td>" + escHtml(f.product.value) + "</td>" +
                "<td>" + escHtml(f.qty.value.trim()) + "</td><td>" + escHtml(f.amount.value.trim()) + "</td>" +
                '<td><span class="status-chip ' + status + '">' + capitalize(status) + "</span></td>" +
                "<td>" + today + "</td><td>" + rowActionsHtml() + "</td>";
              tr.style.background = "var(--primary-50, var(--surface-2))";
              table.querySelector("tbody").prepend(tr);
              bumpPaginationTotal(table, 1);
              closeModal();
              toast({ title: "Order created!", message: newId + " has been added to the top of the list." });
            }
          }
        ]
      });
      body.querySelector("form").addEventListener("submit", function (e) { e.preventDefault(); });
    });
  }

  var inviteBtn = document.querySelector("[data-invite-user-btn]");
  if (inviteBtn) {
    inviteBtn.addEventListener("click", function () {
      var roles = ["Customer", "Studio Admin", "Production Lead", "Designer", "Operations"];
      var body = openModal({
        title: "Invite User",
        body: '<form class="grid gap-md" data-invite-form>' +
          '<div class="field"><label>Full Name</label><input type="text" name="name" placeholder="e.g. Jordan Blake" required></div>' +
          '<div class="field"><label>Email</label><input type="email" name="email" placeholder="name@example.com" required></div>' +
          '<div class="field"><label>Role</label><select name="role">' + fieldOptions(roles, roles[0]) + "</select></div>" +
          '<div class="field"><label>Status</label><select name="status">' +
            fieldOptions(["active", "pending"], "pending", ["Active", "Pending"]) +
          "</select></div></form>",
        actions: [
          { label: "Cancel", cls: "btn-ghost" },
          {
            label: "Send Invite", cls: "btn-primary", close: false, onClick: function (b) {
              var f = b.querySelector("[data-invite-form]");
              if (!f.reportValidity()) return;
              var name = f.name.value.trim();
              var initials = name.split(/\s+/).map(function (p) { return p[0] || ""; }).slice(0, 2).join("").toUpperCase();
              var hues = ["#4B39EF", "#FF5A3C", "#0DA6A0", "#F0A500", "#C084FC", "#38BDF8", "#34D399", "#F472B6"];
              var hue = hues[name.length % hues.length];
              var today = new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
              var role = f.role.value, status = f.status.value;
              var table = document.getElementById("usersTable");
              var tr = document.createElement("tr");
              tr.setAttribute("data-status", status);
              tr.setAttribute("data-group", role === "Customer" ? "customer" : "team");
              tr.innerHTML =
                '<td><input type="checkbox"></td>' +
                '<td><div class="row-avatar"><span class="av" style="width:36px;height:36px;">' +
                '<span style="display:flex;align-items:center;justify-content:center;width:100%;height:100%;background:' + hue + ';color:#fff;font-weight:700;font-size:.8rem;">' + escHtml(initials) + "</span></span>" +
                "<div><strong>" + escHtml(name) + "</strong><span>" + escHtml(f.email.value.trim()) + "</span></div></div></td>" +
                "<td>" + escHtml(role) + '</td><td><span class="status-chip ' + status + '">' + capitalize(status) + "</span></td>" +
                "<td>" + today + "</td><td>" + rowActionsHtml() + "</td>";
              tr.style.background = "var(--primary-50, var(--surface-2))";
              table.querySelector("tbody").prepend(tr);
              closeModal();
              toast({ title: "User invited!", message: name + " has been added to the team list." });
            }
          }
        ]
      });
      body.querySelector("form").addEventListener("submit", function (e) { e.preventDefault(); });
    });
  }

  /* ------------------------------------------------------------------
     Orders "Filter" button — an advanced filter (status + customer +
     date range) that searches every page at once, layered on top of the
     existing per-page status tabs in main.js rather than replacing them.
  ------------------------------------------------------------------ */
  var ordersFilterBtn = document.querySelector("[data-orders-filter-btn]");
  if (ordersFilterBtn) {
    ordersFilterBtn.addEventListener("click", function () {
      var table = document.getElementById("ordersTable");
      var customers = Array.from(new Set(Array.from(table.querySelectorAll("tbody tr")).map(function (r) {
        return r.children[2].textContent.trim();
      }))).sort();
      var body = openModal({
        title: "Filter Orders",
        body: '<form class="grid gap-md" data-orders-filter-form>' +
          '<div class="field"><label>Status</label><select name="status">' +
            fieldOptions(["all", "paid", "pending", "failed"], "all", ["All statuses", "Paid", "Pending", "Failed"]) +
          "</select></div>" +
          '<div class="field"><label>Customer</label><select name="customer"><option value="all">All customers</option>' +
            customers.map(function (c) { return '<option value="' + escAttr(c) + '">' + escHtml(c) + "</option>"; }).join("") +
          "</select></div>" +
          '<div class="grid grid-2 gap-md">' +
          '<div class="field"><label>From</label><input type="date" name="from"></div>' +
          '<div class="field"><label>To</label><input type="date" name="to"></div>' +
          "</div></form>",
        actions: [
          { label: "Cancel", cls: "btn-ghost" },
          {
            label: "Apply Filter", cls: "btn-primary", onClick: function (b) {
              var f = b.querySelector("[data-orders-filter-form]");
              var status = f.status.value, customer = f.customer.value;
              var fromD = f.from.value ? new Date(f.from.value) : null;
              var toD = f.to.value ? new Date(f.to.value) : null;
              var rows = table.querySelectorAll("tbody tr");
              var count = 0;
              rows.forEach(function (row) {
                var rowDate = new Date(row.children[7].textContent.trim());
                var ok = true;
                if (status !== "all" && row.getAttribute("data-status") !== status) ok = false;
                if (customer !== "all" && row.children[2].textContent.trim() !== customer) ok = false;
                if (fromD && rowDate < fromD) ok = false;
                if (toD && rowDate > toD) ok = false;
                row.style.display = ok ? "" : "none";
                if (ok) count++;
              });
              var panel = table.closest(".panel");
              var pager = panel.querySelector("[data-pagination]");
              var tabRow = panel.querySelector(".tab-row[data-filter-scope]");
              if (pager) pager.style.display = "none";
              if (tabRow) tabRow.style.display = "none";
              showFilterBanner(panel, table, count, rows.length);
              toast({ title: "Filter applied", message: count + " of " + rows.length + " orders match your filter." });
            }
          }
        ]
      });
    });
  }
  function showFilterBanner(panel, table, count, totalRows) {
    var banner = panel.querySelector("[data-filter-banner]");
    if (!banner) {
      banner = document.createElement("div");
      banner.setAttribute("data-filter-banner", "1");
      banner.className = "flex-between mt-md";
      banner.style.cssText = "font-size:.85rem;color:var(--text-muted);flex-wrap:wrap;gap:12px;";
      panel.querySelector(".table-wrap").insertAdjacentElement("afterend", banner);
    }
    banner.innerHTML = "<span>Showing " + count + " of " + totalRows + " orders matching your filter</span>" +
      '<button type="button" class="btn btn-ghost btn-sm" data-clear-filter>Clear Filter</button>';
    banner.style.display = "flex";
    banner.querySelector("[data-clear-filter]").addEventListener("click", function () {
      banner.style.display = "none";
      var tabRow = panel.querySelector(".tab-row[data-filter-scope]");
      var pager = panel.querySelector("[data-pagination]");
      if (tabRow) tabRow.style.display = "";
      /* Un-hide everything first — rows created after the pager was set up
         (New Order) aren't in its internal row list, so its own goTo()
         can't restore them; this guarantees nothing stays stuck hidden. */
      table.querySelectorAll("tbody tr").forEach(function (row) { row.style.display = ""; });
      if (pager) {
        pager.style.display = "";
        var pageBtn1 = pager.querySelector('[data-page-btn="1"]');
        if (pageBtn1) pageBtn1.click();
      }
    });
  }
})();
