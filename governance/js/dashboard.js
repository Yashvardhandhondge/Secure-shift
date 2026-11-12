/* =========================================================
   Governance - dashboard.js  (governance/dashboard.html)
   ========================================================= */
(function () {
  "use strict";
  var s = SS.session.current;
  if (!s) return;

  var analyses = SS.GOV.load("analyses");
  var latest = analyses[0];
  var ids = SS.GOV.identities;
  var findings = SS.GOV.load("findings").filter(function (f) { return f.status === "Open"; });
  var roles = SS.GOV.load("roles");

  SS.$("#welcome").textContent = "Welcome back, " + s.name;
  SS.$("#status-title").textContent = "Latest analysis complete - " + latest.company;
  SS.$("#status-sub").textContent = latest.identities + " identities analysed from " + (latest.days || 90) + " days of Activity Log (" + (latest.period || "") + ") · " + latest.id + " · " + latest.date;

  SS.$("#k-total").textContent = latest.identities;
  SS.$("#k-avg").textContent = latest.avg;
  SS.$("#k-risk").textContent = findings.length;
  SS.$("#k-pending-roles").textContent = roles.filter(function (r) { return !r.reviewed; }).length;
  SS.$("#k-period").textContent = (latest.period || "Last 90 days") + " (" + (latest.days || 90) + " days)";

  /* trend chart with range switch */
  function drawTrend() {
    var t = SS.$("#trend-range").value === "12" ? SS.GOV.trend12 : SS.GOV.trend;
    SS.ui.lineChart(SS.$("#trend-chart"), t.labels, t.values, { max: 100 });
  }
  SS.$("#trend-range").addEventListener("change", drawTrend);
  drawTrend();

  /* risk donut */
  var high = ids.filter(function (i) { return i.score >= 70; }).length;
  var med = ids.filter(function (i) { return i.score >= 40 && i.score < 70; }).length;
  SS.ui.donut(SS.$("#risk-donut"), [
    { label: "High (70-100)", value: high }, { label: "Medium (40-69)", value: med }, { label: "Low (0-39)", value: ids.length - high - med }
  ], "Identities");

  /* top table */
  var top = ids.slice().sort(function (a, b) { return b.score - a.score; }).slice(0, 5);
  SS.ui.table({
    el: "#top-table", rows: top, paging: false,
    onRowClick: function (r) { SS.go("governance/identity-detail.html?id=" + encodeURIComponent(r.id)); },
    columns: [
      { label: "Identity", render: function (r) { return SS.GOV.identityCell(r); } },
      { label: "Type", key: "type" },
      { label: "Current Role", key: "role" },
      { label: "Scope", key: "scope" },
      { label: "Score", render: function (r) { return SS.ui.scorebar(r.score); } },
      { label: "Action", render: function (r) {
        return '<a class="btn btn-outline btn-sm" href="identity-detail.html?id=' + encodeURIComponent(r.id) + '">View</a>'; } }
    ]
  });
})();
