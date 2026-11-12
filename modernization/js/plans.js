/* =========================================================
   EMDT - plans.js  (modernization/plans.html)
   Architect's list of plans. View every plan, Edit only Drafts.
   ========================================================= */
(function () {
  "use strict";
  var s = SS.session.current;
  if (!s) return;

  var plans = SS.EM.load("plans").filter(function (p) { return p.by === s.name; });
  function n(st) { return plans.filter(function (p) { return p.status === st; }).length; }
  var k = [["file", "Draft", n("Draft"), "Draft"], ["clock", "Submitted", n("Submitted"), "Submitted"],
           ["checkCircle", "Approved", n("Approved"), "Approved"], ["xCircle", "Rejected", n("Rejected"), "Rejected"]];
  SS.$("#kpis").innerHTML = k.map(function (x) {
    return '<button class="card stat" data-kpi="' + x[3] + '" style="cursor:pointer;text-align:left;font:inherit;width:100%"><div class="stat-icon">' + SS.icon(x[0]) +
           '</div><div><div class="stat-label">' + x[1] + '</div><div class="stat-value">' + x[2] + "</div></div></button>";
  }).join("");

  var table = SS.ui.table({ el: "#plan-table", rows: [], pageSize: 8, unit: "plans",
    onRowClick: function (r) { SS.go("modernization/create-plan.html?plan=" + r.id); },
    columns: [
      { label: "Plan ID", render: function (r) { return '<span class="mono small">' + r.id + "</span>"; } },
      { label: "Plan Name", render: function (r) { return "<b>" + SS.esc(r.name) + "</b>"; } },
      { label: "Application", key: "appName" },
      { label: "Strategy", key: "strategy" },
      { label: "Status", render: function (r) { return SS.ui.badge(r.status); } },
      { label: "Date", render: function (r) { return r.submitted || r.created; } },
      { label: "Executive Comment", render: function (r) { return '<span class="small">' + SS.esc(r.execComment || "-") + "</span>"; } },
      { label: "Action", render: function (r) {
        return '<span class="row" style="gap:4px"><a class="btn btn-outline btn-sm" href="create-plan.html?plan=' + r.id + '">View</a>' +
          (r.status === "Draft" ? '<a class="btn btn-sm" href="create-plan.html?plan=' + r.id + '&edit=1" data-edit="' + r.id + '">Edit</a>' : "") + "</span>"; } }
    ] });

  function apply() {
    var q = SS.$("#f-search").value.trim().toLowerCase(), st = SS.$("#f-status").value;
    table.update(plans.filter(function (p) {
      return (!q || (p.name + " " + p.appName + " " + p.id).toLowerCase().indexOf(q) > -1) && (!st || p.status === st);
    }));
  }
  SS.$("#f-search").addEventListener("input", apply);
  SS.$("#f-status").addEventListener("change", apply);
  SS.$$("[data-kpi]").forEach(function (b) { b.addEventListener("click", function () { SS.$("#f-status").value = b.getAttribute("data-kpi"); apply(); }); });
  apply();
})();
