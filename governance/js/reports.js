/* =========================================================
   Governance - reports.js  (governance/reports.html)
   ========================================================= */
(function () {
  "use strict";
  if (!SS.session.current) return;

  var reports = SS.GOV.load("reports");
  var current = reports[0];

  var fixFirst = SS.GOV.identities.slice().sort(function (a, b) { return b.score - a.score; }).slice(0, 3);

  function previewHtml(r) {
    return "<h3>Cloud Governance Report · " + r.id + "</h3><div class='muted small'>" + SS.esc(r.company) + " · " + r.date + "</div>" +
      "<div class='mini-stats'><div><b>" + r.identities + "</b>identities</div><div><b>" + r.avg + "</b>avg score</div><div><b>" + r.highRisk + "</b>high-risk unused</div></div>" +
      "<b>Fix First</b><ol style='margin:6px 0 12px 18px'>" + fixFirst.map(function (i) {
        return "<li><b>" + SS.esc(i.name) + "</b> <span class='mono'>(" + i.id + ")</span> - score " + i.score + " (" + i.role + ")</li>"; }).join("") + "</ol>" +
      "<b>Score by risk band</b>" + SS.ui.hbars([
        { label: "High (70-100)", value: Math.round(r.identities * 0.3) },
        { label: "Medium (40-69)", value: Math.round(r.identities * 0.4) },
        { label: "Low (0-39)", value: r.identities - Math.round(r.identities * 0.3) - Math.round(r.identities * 0.4) }
      ]);
  }

  function fullReport(r) {
    return "<!DOCTYPE html><html><head><meta charset='UTF-8'><title>" + r.id + "</title><style>body{font-family:Arial,sans-serif;max-width:860px;margin:30px auto;color:#111}" +
      "table{border-collapse:collapse;width:100%;margin-top:10px}th,td{border:1px solid #ccc;padding:8px;text-align:left;font-size:13px}th{background:#f5f5f5}" +
      ".k{display:inline-block;border:1px solid #ccc;border-radius:6px;padding:10px 16px;margin:4px;text-align:center}.k b{display:block;font-size:22px}</style></head><body>" +
      "<h1>Cloud Governance Report</h1><p>" + r.id + " · " + SS.esc(r.company) + " · Generated " + r.date + "</p>" +
      "<div><span class='k'><b>" + r.identities + "</b>Identities</span><span class='k'><b>" + r.avg + "</b>Average score</span><span class='k'><b>" + r.highRisk + "</b>High-risk unused</span></div>" +
      "<h2>Identities</h2><table><tr><th>Identity</th><th>Type</th><th>Role</th><th>Scope</th><th>Granted</th><th>Used</th><th>Score</th></tr>" +
      SS.GOV.identities.map(function (i) { return "<tr><td>" + SS.esc(i.name) + " (" + i.id + ")</td><td>" + i.type + "</td><td>" + i.role + "</td><td>" + i.scope + "</td><td>" + i.granted + "</td><td>" + i.used + "</td><td>" + i.score + "</td></tr>"; }).join("") +
      "</table><p style='color:#777;font-size:12px;margin-top:20px'>© 2026 SecureShift · Offline analysis, no data leaves this machine.</p></body></html>";
  }

  var table = SS.ui.table({
    el: "#rep-table", rows: reports, pageSize: 6, unit: "reports",
    rowClass: function (r) { return r.id === current.id ? "selected" : ""; },
    onRowClick: function (r) { select(r); },
    columns: [
      { label: "Report ID", render: function (r) { return "<b>" + r.id + "</b>"; } },
      { label: "Company", key: "company" }, { label: "Date", key: "date" },
      { label: "Identities", right: true, key: "identities" }, { label: "Avg Score", right: true, key: "avg" },
      { label: "Action", render: function (r) { return '<button class="btn btn-outline btn-sm" data-view="' + r.id + '">View</button>'; } }
    ],
    afterRender: function (el) {
      SS.$$("[data-view]", el).forEach(function (b) {
        b.addEventListener("click", function () { select(reports.filter(function (r) { return r.id === b.getAttribute("data-view"); })[0]); });
      });
    }
  });

  function select(r) {
    current = r;
    SS.$("#pv-title").textContent = "Report Preview - " + r.id;
    SS.$("#preview").innerHTML = previewHtml(r);
    table.refresh();
  }

  SS.$("#btn-open").addEventListener("click", function () {
    SS.ui.modal({ title: current.id + " - Full Report", wide: true,
      body: '<iframe title="report" style="width:100%;height:60vh;border:1px solid #ddd;border-radius:8px" id="report-frame"></iframe>' });
    SS.$("#report-frame").srcdoc = fullReport(current);
  });
  SS.$("#btn-print").addEventListener("click", function () {
    var w = window.open("", "_blank");
    if (!w) { SS.ui.toast("Allow pop-ups to print the report", "alert"); return; }
    w.document.write(fullReport(current));
    w.document.close();
    w.focus();
    setTimeout(function () { w.print(); }, 300);
  });
  SS.$("#btn-download").addEventListener("click", function () { SS.ui.download(current.id + ".html", fullReport(current), "text/html"); });

  SS.$("#btn-generate").addEventListener("click", function () {
    var companies = SS.GOV.load("companies");
    SS.ui.modal({
      title: "Generate New Report",
      body: '<div class="field"><label>Company</label><select class="select" id="g-company">' +
            companies.map(function (c) { return "<option>" + SS.esc(c.name) + "</option>"; }).join("") + "</select></div>" +
            '<p class="small muted mt">The report uses the latest analysis for the selected company.</p>',
      buttons: [{ label: "Cancel", cls: "btn-outline" }, { label: "Generate", id: "btn-confirm-generate", onClick: function (close, root) {
        var name = SS.$("#g-company", root).value;
        var c = companies.filter(function (x) { return x.name === name; })[0];
        var num = Math.max.apply(null, reports.map(function (r) { return parseInt(r.id.replace(/\D/g, ""), 10); })) + 1;
        var rec = { id: "RPT-" + num, company: name, date: SS.today(), identities: c.identities, avg: c.avg, highRisk: c.highRisk };
        reports.unshift(rec);
        SS.GOV.save("reports", reports);
        table.update(reports);
        select(rec);
        SS.ui.toast(rec.id + " generated for " + name);
      } }]
    });
  });

  select(current);
})();
