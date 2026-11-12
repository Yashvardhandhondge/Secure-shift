/* =========================================================
   EMDT - architect-dashboard.js
   Enterprise list + overall dashboard for the Architect.
   ========================================================= */
(function () {
  "use strict";
  var s = SS.session.current;
  if (!s) return;

  var C = SS.EMC;
  var ents = SS.EM.load("enterprises");
  var apps = SS.EM.load("apps");
  var assessments = SS.EM.load("assessments");
  var sims = SS.EM.load("simulations");
  var plans = SS.EM.load("plans");
  function appName(id) { var a = apps.filter(function (x) { return x.id === id; })[0]; return a ? a.name : id; }
  function isAssessed(id) { return assessments.some(function (x) { return x.app === id; }); }

  var k = [
    ["building", "Enterprises", ents.length],
    ["grid", "Applications", apps.length],
    ["clipboard", "Assessed Applications", apps.filter(function (a) { return isAssessed(a.id); }).length],
    ["map", "Submitted Plans", plans.filter(function (p) { return p.status === "Submitted"; }).length]
  ];
  SS.$("#kpis").innerHTML = k.map(function (x) {
    return '<div class="card stat"><div class="stat-icon">' + SS.icon(x[0]) + '</div><div><div class="stat-label">' + x[1] + '</div><div class="stat-value">' + x[2] + "</div></div></div>";
  }).join("");

  var rows = ents.map(function (e) {
    var list = apps.filter(function (a) { return a.ent === e.id; });
    var r = C.entEmsi(e);
    return { id: e.id, name: e.name, industry: e.industry, category: r ? r.category : "Not classified", emsi: r ? r.score : null,
             apps: list.length, assessed: list.filter(function (a) { return isAssessed(a.id); }).length,
             plans: plans.filter(function (p) { return p.ent === e.id; }).length };
  });
  SS.ui.table({ el: "#ent-table", rows: rows, paging: false,
    onRowClick: function (r) { SS.go("modernization/applications.html?ent=" + r.id); },
    columns: [
      { label: "Enterprise", render: function (r) { return "<b>" + SS.esc(r.name) + '</b><div class="small muted">' + r.id + " · " + r.industry + "</div>"; } },
      { label: "Category", render: function (r) { return r.emsi === null ? '<span class="badge badge-soft">Not classified</span>' : '<span class="badge">' + r.category + "</span> <span class='small muted'>EMSI " + r.emsi.toFixed(2) + "</span>"; } },
      { label: "Applications", right: true, key: "apps" },
      { label: "Assessed", right: true, render: function (r) { return r.assessed + " / " + r.apps; } },
      { label: "Pending", right: true, render: function (r) { return r.apps - r.assessed; } },
      { label: "Plans", right: true, key: "plans" },
      { label: "Action", render: function (r) { return '<a class="btn btn-outline btn-sm" href="applications.html?ent=' + r.id + '">Open Applications</a>'; } }
    ] });

  SS.ui.table({ el: "#assess-table", rows: assessments.slice(0, 5), paging: false, empty: "No assessments yet.",
    onRowClick: function (r) { SS.go("modernization/assessments.html?app=" + r.app); },
    columns: [
      { label: "Application", render: function (r) { return "<b>" + SS.esc(appName(r.app)) + "</b>"; } },
      { label: "Technical Debt", render: function (r) { return SS.ui.scorebar(r.td); } },
      { label: "Governance Risk", render: function (r) { return SS.ui.scorebar(r.gr); } },
      { label: "Date", key: "date" }
    ] });

  SS.ui.table({ el: "#sim-table", rows: sims.slice(0, 5), paging: false, empty: "No simulations yet.",
    columns: [
      { label: "ID", key: "id" },
      { label: "Application", render: function (r) { return "<b>" + SS.esc(r.appName) + "</b>"; } },
      { label: "Strategy", key: "strategy" },
      { label: "Risk", render: function (r) { return r.mr + " " + SS.ui.badge(r.mrLevel); } },
      { label: "Effort", render: function (r) { return r.effort + " wk"; } }
    ] });

  SS.ui.table({ el: "#plan-table", rows: plans.filter(function (p) { return p.by === s.name; }).slice(0, 5), paging: false, empty: "No plans yet.",
    onRowClick: function (r) { SS.go("modernization/create-plan.html?plan=" + r.id); },
    columns: [
      { label: "Plan", render: function (r) { return "<b>" + SS.esc(r.name) + '</b><div class="small muted">' + r.id + "</div>"; } },
      { label: "Strategy", key: "strategy" },
      { label: "Status", render: function (r) { return SS.ui.badge(r.status); } },
      { label: "Executive Comment", render: function (r) { return '<span class="small">' + SS.esc(r.execComment || "-") + "</span>"; } }
    ] });
})();
