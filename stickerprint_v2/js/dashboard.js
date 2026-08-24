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
})();
