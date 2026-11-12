/* =========================================================
   EMDT - applications.js  (modernization/applications.html?ent=...)
   Admin     : manage the inventory (register / edit / delete).
   Architect : read-only list to pick an app -> Assess -> Simulate.
   ========================================================= */
(function () {
  "use strict";
  var s = SS.session.current;
  if (!s) return;

  var C = SS.EMC;
  var isAdmin = s.role === "admin";
  var entId = SS.EM.entId();
  var ent = SS.EM.ent(entId);
  var allApps = SS.EM.load("apps");
  var plans = SS.EM.load("plans");

  SS.EM.entPicker(SS.$("#ent-picker"));
  SS.$("#crumb-home").setAttribute("href", SS.root() + s.home);
  SS.$("#crumb-ent").textContent = ent.name;
  if (!isAdmin) {
    SS.$("#btn-register").classList.add("hidden");
    SS.$("#page-sub").textContent = "Read-only list. Choose an application to assess, then simulate.";
  }

  function apps() { return allApps.filter(function (a) { return a.ent === entId; }); }
  function assessed(id) { return !!C.latestAssessment(id); }

  /* category data of the enterprise */
  function renderStrip() {
    var r = C.entEmsi(ent);
    SS.$("#cat-strip").innerHTML = r
      ? '<div><div class="small muted">Enterprise</div><b>' + SS.esc(ent.name) + "</b></div>" +
        '<div><div class="small muted">EMSI</div><b>' + r.score.toFixed(2) + "</b></div>" +
        '<div><div class="small muted">Category</div><span class="badge badge-solid">' + r.category + "</span></div>" +
        '<div><div class="small muted">Effort multiplier</div><b>×' + r.multiplier.toFixed(2) + "</b></div>" +
        (isAdmin ? '<div><div class="small muted">Subscription</div><b>' + r.plan.name + " · ₹" + SS.fmt(r.plan.monthly) + "/month</b></div>" : "") +
        '<div><div class="small muted">Portfolio (declared)</div><b>' + ent.classification.totalApps + " apps · " + ent.classification.techs.join(", ") + "</b></div>"
      : '<div class="row">' + SS.icon("alert") + "<span><b>" + SS.esc(ent.name) + " is not classified yet.</b> " +
        (isAdmin ? '<a href="classification.html?ent=' + ent.id + '">Add classification details</a> first.' : "Ask the Admin to complete the classification.") + "</span></div>";
  }

  function renderKpis() {
    var list = apps();
    var k = isAdmin
      ? [["grid", "Total Applications", list.length], ["alert", "Critical Applications", list.filter(function (a) { return a.criticality === "Critical"; }).length],
         ["clock", "Legacy Applications", list.filter(function (a) { return a.status === "Legacy"; }).length],
         ["link", "Dependency Links", SS.EM.load("links").filter(function (l) { return l.ent === entId; }).length]]
      : [["grid", "Total Applications", list.length], ["clock", "Pending Assessment", list.filter(function (a) { return !assessed(a.id); }).length],
         ["clipboard", "Assessed Applications", list.filter(function (a) { return assessed(a.id); }).length],
         ["map", "Submitted Plans", plans.filter(function (p) { return p.ent === entId && p.status !== "Draft"; }).length]];
    SS.$("#kpis").innerHTML = k.map(function (x) {
      return '<div class="card stat"><div class="stat-icon">' + SS.icon(x[0]) + '</div><div><div class="stat-label">' + x[1] + '</div><div class="stat-value">' + x[2] + "</div></div></div>";
    }).join("");
  }

  var adminCols = [
    { label: "Application", render: function (r) { return "<b>" + SS.esc(r.name) + '</b><div class="small muted">' + r.id + " · " + SS.esc(r.owner || "") + "</div>"; } },
    { label: "Technology", render: function (r) { return r.tech + '<div class="small muted">' + SS.esc(r.framework) + " · " + r.support + "</div>"; } },
    { label: "Criticality", render: function (r) { return SS.ui.badge(r.criticality); } },
    { label: "Deployment", key: "deployment" },
    { label: "Age", right: true, render: function (r) { return r.age + " yrs"; } },
    { label: "Links", right: true, render: function (r) { return C.appLinks(r.id).length; } },
    { label: "Status", render: function (r) { return SS.ui.badge(r.status); } },
    { label: "Actions", render: function (r) {
      return '<span class="row" style="gap:2px"><button class="btn btn-ghost btn-sm" data-view="' + r.id + '" aria-label="View">' + SS.icon("eye") + "</button>" +
        '<a class="btn btn-ghost btn-sm" href="register-application.html?id=' + r.id + '" data-edit="' + r.id + '" aria-label="Edit">' + SS.icon("edit") + "</a>" +
        '<button class="btn btn-ghost btn-sm" data-del="' + r.id + '" aria-label="Delete">' + SS.icon("trash") + "</button></span>"; } }
  ];
  var architectCols = [
    { label: "Application", render: function (r) { return "<b>" + SS.esc(r.name) + '</b><div class="small muted">' + r.id + "</div>"; } },
    { label: "Technology", key: "tech" },
    { label: "Criticality", render: function (r) { return SS.ui.badge(r.criticality); } },
    { label: "Status", render: function (r) { return SS.ui.badge(r.status); } },
    { label: "Assessment", render: function (r) { return assessed(r.id) ? '<span class="badge badge-solid">Assessed</span>' : '<span class="badge badge-soft">Not Assessed</span>'; } },
    { label: "Actions", render: function (r) {
      var ok = assessed(r.id);
      return '<span class="row" style="gap:4px"><button class="btn btn-ghost btn-sm" data-view="' + r.id + '">View</button>' +
        '<a class="btn btn-outline btn-sm" href="assessments.html?app=' + r.id + '" data-assess="' + r.id + '">' + (ok ? "Re-assess" : "Assess") + "</a>" +
        (ok ? '<a class="btn btn-sm" href="simulation.html?app=' + r.id + '" data-sim="' + r.id + '">Simulate</a>'
            : '<button class="btn btn-sm" disabled title="Assess the application first">Simulate</button>') + "</span>"; } }
  ];

  var table = SS.ui.table({
    el: "#app-table", rows: [], pageSize: 8, unit: "applications", columns: isAdmin ? adminCols : architectCols,
    afterRender: function (el) {
      SS.$$("[data-view]", el).forEach(function (b) { b.addEventListener("click", function () { view(find(b.getAttribute("data-view"))); }); });
      SS.$$("[data-del]", el).forEach(function (b) { b.addEventListener("click", function () { del(find(b.getAttribute("data-del"))); }); });
    }
  });
  function find(id) { return allApps.filter(function (a) { return a.id === id; })[0]; }

  function view(a) {
    var aff = C.affected(a.id);
    var asm = C.latestAssessment(a.id);
    SS.ui.modal({
      title: a.name + " (" + a.id + ")", wide: true,
      body: '<div class="grid g-2"><dl class="kv" style="grid-template-columns:140px 1fr"><dt>Technology</dt><dd>' + a.tech + "</dd><dt>Framework</dt><dd>" + SS.esc(a.framework) +
        "</dd><dt>Framework support</dt><dd>" + a.support + "</dd><dt>Age</dt><dd>" + a.age + " years</dd><dt>Deployment</dt><dd>" + a.deployment +
        "</dd><dt>Lines of code</dt><dd>" + SS.fmt(a.loc) + "</dd><dt>Business unit</dt><dd>" + SS.esc(a.unit || "-") + "</dd></dl>" +
        '<dl class="kv" style="grid-template-columns:150px 1fr"><dt>Criticality</dt><dd>' + SS.ui.badge(a.criticality) + "</dd><dt>Sensitive data</dt><dd>" + a.sensitive +
        "</dd><dt>Security issues</dt><dd>" + a.securityIssues + "</dd><dt>Downtime tolerance</dt><dd>" + a.downtime + "</dd><dt>Compliance policies</dt><dd>" + a.compliance +
        "</dd><dt>Documentation</dt><dd>" + a.docQuality + "</dd><dt>Assessment</dt><dd>" + (asm ? "TD " + asm.td + " · GR " + asm.gr + " (" + asm.date + ")" : "Not assessed") + "</dd></dl></div>" +
        '<h3 class="mt-lg">Direct dependencies (' + aff.length + ")</h3>" +
        (aff.length ? '<div class="table-wrap mt"><table class="table"><thead><tr><th>System</th><th>Type</th><th>Criticality</th></tr></thead><tbody>' +
          aff.map(function (x) { return "<tr><td>" + SS.esc(x.name) + "</td><td>" + x.type + "</td><td>" + SS.ui.badge(x.criticality) + "</td></tr>"; }).join("") + "</tbody></table></div>"
          : '<p class="muted small">No dependencies mapped.</p>'),
      buttons: [{ label: "Close", cls: "btn-outline" }].concat(isAdmin
        ? [{ label: "Edit Application", onClick: function () { SS.go("modernization/register-application.html?id=" + a.id); } }]
        : [{ label: asm ? "Re-assess" : "Assess", onClick: function () { SS.go("modernization/assessments.html?app=" + a.id); } }])
    });
  }

  function del(a) {
    var used = SS.EM.load("links").filter(function (l) { return C.ownerApp(l.source) === a.id || C.ownerApp(l.target) === a.id; }).length;
    SS.ui.confirm({ title: "Delete application?", message: "Delete <b>" + SS.esc(a.name) + "</b> from the inventory?",
      note: used ? "Its " + used + " dependency link(s) and components will also be removed." : "This cannot be undone.", okLabel: "Delete",
      onOk: function () {
        allApps.splice(allApps.indexOf(a), 1);
        SS.EM.save("apps", allApps);
        var nodes = SS.EM.load("nodes").filter(function (n) { return n.app !== a.id; });
        var ids = {}; nodes.forEach(function (n) { ids[n.id] = 1; });
        SS.EM.save("links", SS.EM.load("links").filter(function (l) {
          var ok = function (x) { return x.indexOf("APP-") === 0 ? x !== a.id : !!ids[x]; };
          return ok(l.source) && ok(l.target);
        }));
        SS.EM.save("nodes", nodes);
        SS.EM.log("Application Deleted", a.name, a.id);
        renderKpis(); apply(true);
        SS.ui.toast(a.name + " deleted");
      } });
  }

  function apply(keep) {
    var q = SS.$("#f-search").value.trim().toLowerCase(), t = SS.$("#f-tech").value, c = SS.$("#f-crit").value, st = SS.$("#f-assess").value;
    table.update(apps().filter(function (a) {
      return (!q || (a.name + " " + a.id).toLowerCase().indexOf(q) > -1) && (!t || a.tech === t) && (!c || a.criticality === c) &&
             (!st || (st === "Assessed") === assessed(a.id));
    }), keep === true);
  }
  SS.$("#f-search").addEventListener("input", apply);
  ["#f-tech", "#f-crit", "#f-assess"].forEach(function (x) { SS.$(x).addEventListener("change", apply); });
  SS.$("#btn-clear").addEventListener("click", function () { ["#f-search", "#f-tech", "#f-crit", "#f-assess"].forEach(function (x) { SS.$(x).value = ""; }); apply(); });

  renderStrip();
  renderKpis();
  apply();
})();
