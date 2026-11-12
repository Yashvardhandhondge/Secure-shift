/* =========================================================
   Governance - identity-detail.js  (governance/identity-detail.html?id=...)
   ========================================================= */
(function () {
  "use strict";
  if (!SS.session.current) return;

  var id = SS.param("id") || "svc-webapp-deploy";
  var idt = SS.GOV.identities.filter(function (i) { return i.id === id; })[0];
  if (!idt) { SS.ui.toast("Identity not found - showing svc-webapp-deploy", "alert"); idt = SS.GOV.identities[0]; }
  var d = SS.GOV.getDetail(idt);
  var showAll = false;
  var selected = 0;

  SS.$("#crumb-name").textContent = idt.name;
  document.title = idt.name + " - Governance - SecureShift";

  SS.$("#summary").innerHTML =
    "<dt>Display Name</dt><dd>" + SS.esc(idt.name) + "</dd><dt>User Name</dt><dd class='mono'>" + SS.esc(SS.GOV.upn(idt)) + "</dd><dt>Type</dt><dd>" + idt.type + "</dd>" +
    "<dt>Current Role</dt><dd>" + idt.role + "</dd><dt>Scope</dt><dd>" + idt.scope + "</dd>" +
    "<dt>Analysis Period</dt><dd>" + SS.esc((SS.GOV.load("analyses")[0] || {}).period || "Last 90 days") + "</dd><dt>Suggested Scope</dt><dd>" + SS.esc(d.suggestedScope) + " (Resource Group)</dd>";

  SS.$("#big-score").textContent = idt.score;
  SS.$("#risk-badge").innerHTML = SS.ui.badge(SS.GOV.riskOf(idt.score));
  SS.$("#signals").innerHTML = d.signals.map(function (s) {
    return "<tr><td>" + s.signal + "</td><td><b>" + SS.esc(s.value) + "</b></td><td>" + s.weight + "</td></tr>";
  }).join("");

  SS.$("#k-granted").textContent = SS.fmt(idt.granted);
  SS.$("#k-used").textContent = SS.fmt(idt.used);
  SS.$("#k-unused").textContent = SS.fmt(idt.granted - idt.used);

  /* used permissions table (first 5, then "+ N more") */
  var usedTable = SS.ui.table({
    el: "#used-table", paging: false, rows: d.usedPerms.slice(0, 5),
    rowClass: function (r) { return d.usedPerms.indexOf(r) === selected ? "selected" : ""; },
    onRowClick: function (r) { selected = d.usedPerms.indexOf(r); usedTable.refresh(); renderEvidence(); },
    columns: [
      { label: "Action", render: function (r) { return '<span class="mono small">' + SS.esc(r.action) + "</span>"; } },
      { label: "First Seen", key: "first" }, { label: "Last Seen", key: "last" },
      { label: "Events", right: true, key: "events" }, { label: "Resource Group", key: "rg" }
    ]
  });
  SS.$("#used-title").textContent = "Permissions Used (" + idt.used + " of " + SS.fmt(idt.granted) + ")";

  function updateMore() {
    var hidden = d.usedPerms.length - 5;
    var btn = SS.$("#btn-more");
    if (hidden <= 0) { btn.classList.add("hidden"); return; }
    btn.textContent = showAll ? "Show less" : "+ " + hidden + " more";
  }
  SS.$("#btn-more").addEventListener("click", function () {
    showAll = !showAll;
    usedTable.update(showAll ? d.usedPerms : d.usedPerms.slice(0, 5));
    updateMore();
  });
  updateMore();

  function renderEvidence() {
    var p = d.usedPerms[selected];
    SS.$("#evidence-title").innerHTML = 'Evidence for <span class="mono" style="font-size:13px">' + SS.esc(p.action) + "</span>";
    var ev = SS.GOV.evidence(p.action, p.rg).map(function (e) { e.caller = SS.GOV.upn(idt); return e; });
    SS.ui.table({ el: "#evidence-table", paging: false, rows: ev, columns: [
      { label: "Timestamp", key: "ts" }, { label: "Caller", key: "caller" },
      { label: "Resource", render: function (r) { return '<span class="small">' + SS.esc(r.resource) + "</span>"; } },
      { label: "Status", render: function (r) { return SS.ui.badge(r.status); } }
    ] });
  }
  renderEvidence();

  SS.$("#unused-title").textContent = "Unused High-Risk Permissions (" + d.unusedHighRisk.length + ")";
  SS.$("#unused-list").innerHTML = d.unusedHighRisk.map(function (a) {
    return '<div class="row-between" style="padding:9px 0;border-bottom:1px solid var(--line-soft)"><span class="row mono small">' +
           SS.icon("alert") + SS.esc(a) + '</span><span class="badge badge-strong">Never used</span></div>';
  }).join("");

  /* role link */
  var role = SS.GOV.load("roles").filter(function (r) { return r.identity === idt.id; })[0];
  SS.$("#btn-view-role").setAttribute("href", "roles.html?id=" + encodeURIComponent(role ? role.id : idt.id + "-custom-role"));

  SS.$("#btn-export-evidence").addEventListener("click", function () {
    SS.ui.download(idt.id + "-evidence.json", JSON.stringify({
      identity: idt, score: idt.score, signals: d.signals, permissionsUsed: d.usedPerms, unusedHighRisk: d.unusedHighRisk,
      exportedAt: new Date().toISOString()
    }, null, 2));
  });
})();
