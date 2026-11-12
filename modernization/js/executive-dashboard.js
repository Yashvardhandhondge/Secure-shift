/* =========================================================
   EMDT - executive-dashboard.js
   Submitted / Approved / Rejected plans (Drafts are never shown).
   ========================================================= */
(function () {
  "use strict";
  if (!SS.session.current) return;

  var C = SS.EMC;
  var plans = SS.EM.load("plans").filter(function (p) { return p.status !== "Draft"; });
  var ents = SS.EM.load("enterprises");
  function entName(id) { var e = ents.filter(function (x) { return x.id === id; })[0]; return e ? e.name : id; }
  function n(st) { return plans.filter(function (p) { return p.status === st; }).length; }

  var k = [["clock", "Awaiting Review", n("Submitted"), "Submitted"], ["checkCircle", "Approved Plans", n("Approved"), "Approved"], ["xCircle", "Rejected Plans", n("Rejected"), "Rejected"]];
  SS.$("#kpis").innerHTML = k.map(function (x) {
    return '<button class="card stat" data-kpi="' + x[3] + '" style="cursor:pointer;text-align:left;font:inherit;width:100%"><div class="stat-icon">' + SS.icon(x[0]) +
           '</div><div><div class="stat-label">' + x[1] + '</div><div class="stat-value">' + x[2] + "</div></div></button>";
  }).join("");
  SS.$("#f-ent").innerHTML += ents.map(function (e) { return '<option value="' + e.id + '">' + SS.esc(e.name) + "</option>"; }).join("");

  var table = SS.ui.table({
    el: "#plans-table", rows: [], pageSize: 6, unit: "plans",
    onRowClick: function (r) { SS.go("modernization/review-plan.html?id=" + r.id); },
    columns: [
      { label: "Plan", render: function (r) { return "<b>" + SS.esc(r.name) + '</b><div class="small muted">' + r.id + " · " + SS.esc(entName(r.ent)) + "</div>"; } },
      { label: "Strategy", key: "strategy" },
      { label: "Risk", render: function (r) { return r.snapshot.mr + " " + SS.ui.badge(r.snapshot.mrLevel); } },
      { label: "Effort", render: function (r) { return r.snapshot.effort + " wk"; } },
      { label: "Cost", render: function (r) { return C.lakh(r.snapshot.cost); } },
      { label: "Submitted By", render: function (r) { return SS.esc(r.by) + '<div class="small muted">' + r.submitted + "</div>"; } },
      { label: "Status", render: function (r) { return SS.ui.badge(r.status); } },
      { label: "Action", render: function (r) { return '<a class="btn btn-outline btn-sm" href="review-plan.html?id=' + r.id + '">' + (r.status === "Submitted" ? "Review" : "View") + "</a>"; } }
    ]
  });

  function apply() {
    var st = SS.$("#f-status").value, rk = SS.$("#f-risk").value, en = SS.$("#f-ent").value;
    var rows = plans.filter(function (p) { return (!st || p.status === st) && (!rk || p.snapshot.mrLevel === rk) && (!en || p.ent === en); });
    SS.$("#showing").textContent = "Showing: " + (st || "All") + " plans" + (rk ? " · " + rk + " risk" : "") + " (" + rows.length + ")";
    table.update(rows);
  }
  SS.$("#filter-form").addEventListener("submit", function (e) { e.preventDefault(); apply(); });
  SS.$("#btn-clear").addEventListener("click", function () { SS.$("#f-status").value = "Submitted"; SS.$("#f-risk").value = ""; SS.$("#f-ent").value = ""; apply(); });
  SS.$$("[data-kpi]").forEach(function (b) { b.addEventListener("click", function () { SS.$("#f-status").value = b.getAttribute("data-kpi"); apply(); }); });
  apply();
})();
