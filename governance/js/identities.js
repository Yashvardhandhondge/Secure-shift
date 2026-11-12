/* =========================================================
   Governance - identities.js  (governance/identities.html)
   Search + filter + export identities table.
   ========================================================= */
(function () {
  "use strict";
  if (!SS.session.current) return;

  var all = SS.GOV.identities.slice().sort(function (a, b) { return b.score - a.score; });
  SS.$("#f-company").innerHTML = SS.GOV.load("companies").map(function (c) { return "<option>" + SS.esc(c.name) + "</option>"; }).join("");

  var table = SS.ui.table({
    el: "#id-table", rows: all, pageSize: 8, unit: "identities",
    onRowClick: function (r) { SS.go("governance/identity-detail.html?id=" + encodeURIComponent(r.id)); },
    columns: [
      { label: "Identity", render: function (r) { return SS.GOV.identityCell(r); } },
      { label: "Type", key: "type" },
      { label: "Current Role", key: "role" },
      { label: "Scope", key: "scope" },
      { label: "Granted", right: true, render: function (r) { return SS.fmt(r.granted); } },
      { label: "Used", right: true, render: function (r) { return SS.fmt(r.used); } },
      { label: "Score", render: function (r) { return SS.ui.scorebar(r.score); } },
      { label: "Risk", render: function (r) { return SS.ui.badge(SS.GOV.riskOf(r.score)); } },
      { label: "Action", render: function (r) {
        return '<a class="btn btn-outline btn-sm" href="identity-detail.html?id=' + encodeURIComponent(r.id) + '">View</a>'; } }
    ]
  });

  function filtered() {
    var q = SS.$("#f-search").value.trim().toLowerCase();
    var type = SS.$("#f-type").value;
    var risk = SS.$("#f-score").value;
    var company = SS.$("#f-company").value;
    // only Northwind has identity-level sample data
    if (company !== "Northwind Traders") return [];
    return all.filter(function (r) {
      return (!q || (r.name + " " + r.id + " " + r.role + " " + r.scope).toLowerCase().indexOf(q) > -1) &&
             (!type || r.type === type) && (!risk || SS.GOV.riskOf(r.score) === risk);
    });
  }
  function apply() { table.update(filtered()); }

  ["#f-search"].forEach(function (s) { SS.$(s).addEventListener("input", apply); });
  ["#f-type", "#f-score", "#f-company"].forEach(function (s) { SS.$(s).addEventListener("change", function () {
    apply();
    if (s === "#f-company" && SS.$(s).value !== "Northwind Traders") SS.ui.toast("Sample identity data is available for Northwind Traders only", "info");
  }); });
  SS.$("#btn-clear").addEventListener("click", function () {
    SS.$("#f-search").value = ""; SS.$("#f-type").value = ""; SS.$("#f-score").value = ""; SS.$("#f-company").selectedIndex = 0;
    apply();
  });
  SS.$("#btn-export").addEventListener("click", function () {
    var rows = filtered().map(function (r) { var c = Object.assign({}, r); c.risk = SS.GOV.riskOf(r.score); return c; });
    SS.ui.download("identities-export.csv", SS.ui.csv(rows, [
      { label: "Name", key: "name" }, { label: "User Name", key: "id" }, { label: "Type", key: "type" }, { label: "Role", key: "role" }, { label: "Scope", key: "scope" },
      { label: "Granted", key: "granted" }, { label: "Used", key: "used" }, { label: "Score", key: "score" }, { label: "Risk", key: "risk" }
    ]), "text/csv");
  });
})();
