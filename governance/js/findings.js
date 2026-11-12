/* =========================================================
   Governance - findings.js  (governance/findings.html)
   ========================================================= */
(function () {
  "use strict";
  if (!SS.session.current) return;

  var findings = SS.GOV.load("findings");

  var people = findings.map(function (f) { return f.identity; }).filter(function (v, i, a) { return a.indexOf(v) === i; });
  SS.$("#f-identity").innerHTML += people.map(function (p) {
    var idt = SS.GOV.byId(p); return '<option value="' + SS.esc(p) + '">' + SS.esc(idt ? idt.name : p) + "</option>"; }).join("");

  function renderCards() {
    var open = findings.filter(function (f) { return f.status === "Open"; });
    var count = function (c) { return open.filter(function (f) { return f.category === c; }).length; };
    var cards = [
      ["alert", "Total Findings", open.length, ""], ["trash", "Delete Actions", count("Delete"), "Delete"],
      ["network", "Network (NSG)", count("Network"), "Network"], ["key", "Key Vault", count("Key Vault"), "Key Vault"],
      ["users", "Role Assignment", count("Role Assignment"), "Role Assignment"]
    ];
    SS.$("#summary-cards").innerHTML = cards.map(function (c) {
      return '<button class="card stat" data-cat="' + c[3] + '" style="cursor:pointer;text-align:left;font:inherit;width:100%"><div class="stat-icon">' + SS.icon(c[0]) +
             '</div><div><div class="stat-label">' + c[1] + '</div><div class="stat-value">' + c[2] + "</div></div></button>";
    }).join("");
    SS.$$("[data-cat]").forEach(function (b) {
      b.addEventListener("click", function () { SS.$("#f-category").value = b.getAttribute("data-cat"); apply(); });
    });
  }

  var table = SS.ui.table({
    el: "#f-table", rows: [], pageSize: 6, unit: "findings",
    columns: [
      { label: "Identity", render: function (r) { var i = SS.GOV.byId(r.identity); return i ? SS.GOV.identityCell(i) : SS.esc(r.identity); } },
      { label: "Unused High-Risk Action", render: function (r) { return '<span class="mono small">' + SS.esc(r.action) + "</span>"; } },
      { label: "Category", key: "category" },
      { label: "Last Used", key: "lastUsed" },
      { label: "Current Role", key: "role" },
      { label: "Severity", render: function (r) { return SS.ui.badge(r.severity); } },
      { label: "Action", render: function (r) {
        return '<a class="btn btn-outline btn-sm" href="identity-detail.html?id=' + encodeURIComponent(r.identity) + '">View Identity</a>'; } }
    ]
  });


  function filtered() {
    var c = SS.$("#f-category").value, i = SS.$("#f-identity").value, s = SS.$("#f-severity").value;
    return findings.filter(function (f) {
      return (!c || f.category === c) && (!i || f.identity === i) && (!s || f.severity === s);
    });
  }
  function apply() { table.update(filtered()); }

  ["#f-category", "#f-identity", "#f-severity"].forEach(function (s) { SS.$(s).addEventListener("change", apply); });
  SS.$("#btn-clear").addEventListener("click", function () {
    SS.$("#f-category").value = ""; SS.$("#f-identity").value = ""; SS.$("#f-severity").value = ""; apply();
  });
  SS.$("#btn-export").addEventListener("click", function () {
    SS.ui.download("high-risk-findings.csv", SS.ui.csv(filtered(), [
      { label: "Identity", key: "identity" }, { label: "Action", key: "action" }, { label: "Category", key: "category" },
      { label: "Last Used", key: "lastUsed" }, { label: "Role", key: "role" }, { label: "Severity", key: "severity" }
    ]), "text/csv");
  });

  renderCards();
  apply();
})();
