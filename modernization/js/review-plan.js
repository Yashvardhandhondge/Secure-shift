/* =========================================================
   EMDT - review-plan.js  (modernization/review-plan.html?id=PLAN-001)
   Executive approves or rejects a Submitted plan.
   Allowed: Submitted -> Approved, Submitted -> Rejected. Nothing else.
   ========================================================= */
(function () {
  "use strict";
  if (!SS.session.current) return;

  var C = SS.EMC;
  var plans = SS.EM.load("plans");
  var ents = SS.EM.load("enterprises");
  var p = plans.filter(function (x) { return x.id === SS.param("id") && x.status !== "Draft"; })[0];
  if (!p) {
    p = plans.filter(function (x) { return x.status === "Submitted"; })[0] || plans.filter(function (x) { return x.status !== "Draft"; })[0];
    SS.ui.toast("Plan not found - showing " + p.id, "info");
  }
  var sim = p.snapshot;
  function entName(id) { var e = ents.filter(function (x) { return x.id === id; })[0]; return e ? e.name : id; }

  function render() {
    SS.$("#page-title").textContent = p.name;
    SS.$("#plan-id").textContent = p.id + " · from " + p.sim;
    SS.$("#status-badge").innerHTML = '<span class="badge ' + (p.status === "Approved" ? "badge-solid" : p.status === "Rejected" ? "badge-strong" : "badge-soft") +
      '" style="font-size:13px;padding:6px 14px">' + p.status + "</span>";
    var items = [["Technical Debt", sim.td], ["Governance Risk", sim.gr], ["Dependency Impact", sim.di], ["Modernization Risk", sim.mr + " · " + sim.mrLevel],
                 ["Strategy", p.strategy], ["Estimated Effort", sim.effort + " weeks"], ["Estimated Cost", C.lakh(sim.cost)], ["EMSI Category", sim.category + " ×" + Number(sim.multiplier).toFixed(2)]];
    SS.$("#summary").innerHTML = items.map(function (x) { return '<div class="ro"><small>' + x[0] + "</small><b>" + SS.esc(x[1]) + "</b></div>"; }).join("");
    var snap = [["EMSI score", Number(sim.emsi).toFixed(2)], ["Strategy Risk", sim.sr], ["Raw dependency points", sim.raw], ["Base effort", sim.baseWeeks + " wk"],
                ["Team size", sim.team], ["Person-months", sim.personMonths], ["Cost per person-month", C.lakh(sim.perPersonMonth)], ["Labour", C.lakh(sim.labour)],
                ["Testing (10%)", C.lakh(sim.testing)], ["Tools", C.lakh(sim.tools)], ["Other fixed", C.lakh(sim.otherFixed)],
                ["Contingency", Math.round(sim.contingencyPct * 100) + "%"], ["Final cost", C.lakh(sim.cost)], ["Simulation date", sim.date]];
    SS.$("#snapshot").innerHTML = '<div class="table-wrap"><table class="table"><tbody>' + snap.map(function (x) { return "<tr><td>" + x[0] + "</td><td><b>" + SS.esc(x[1]) + "</b></td></tr>"; }).join("") + "</tbody></table></div>";
    SS.$("#details").innerHTML = "<dt>Application</dt><dd>" + SS.esc(p.appName) + "</dd><dt>Enterprise</dt><dd>" + SS.esc(entName(p.ent)) +
      "</dd><dt>Business Criticality</dt><dd>" + SS.ui.badge(sim.criticality) + "</dd><dt>Submitted By</dt><dd>" + SS.esc(p.by) + " (Architect)</dd><dt>Submitted On</dt><dd>" +
      p.submitted + "</dd><dt>Source</dt><dd>Simulation " + p.sim + "</dd>" + (p.execComment ? "<dt>Executive Comment</dt><dd>" + SS.esc(p.execComment) + "</dd>" : "");
    SS.$("#reco").innerHTML = "<b>System recommendation</b><p class='small mt'>" + SS.esc(sim.recommendation) + "</p>";
    SS.$("#notes").textContent = p.notes || "No notes provided.";
    SS.ui.table({ el: "#affected", rows: p.affected, paging: false, empty: "No direct dependencies.", columns: [
      { label: "System", render: function (r) { return "<b>" + SS.esc(r.name) + "</b>"; } }, { label: "Type", key: "type" },
      { label: "Criticality", render: function (r) { return SS.ui.badge(r.criticality); } }] });
    var total = p.phases.reduce(function (t, x) { return t + x.weeks; }, 0);
    SS.$("#phases").innerHTML = '<div class="table-wrap"><table class="table"><thead><tr><th>Phase</th><th class="right">Weeks</th></tr></thead><tbody>' +
      p.phases.map(function (x) { return "<tr><td>" + x.name + '</td><td class="right">' + x.weeks + "</td></tr>"; }).join("") +
      '<tr><td><b>Total</b></td><td class="right"><b>' + total + "</b></td></tr></tbody></table></div>";
    SS.$("#decision-card").classList.toggle("hidden", p.status !== "Submitted");
  }

  function decide(status) {
    var note = SS.$("#note").value.trim();
    if (status === "Rejected" && note.length < 5) {
      SS.ui.validate(SS.$("#decision-card"), [{ id: "note", rule: function () { return "Please give a reason (at least 5 characters) to reject"; } }]);
      return;
    }
    SS.ui.confirm({
      title: status === "Approved" ? "Approve plan?" : "Reject plan?", icon: status === "Approved" ? "checkCircle" : "xCircle",
      message: (status === "Approved" ? "Approve " : "Reject ") + "<b>" + SS.esc(p.name) + "</b> (" + C.lakh(sim.cost) + ", " + sim.effort + " weeks)?",
      note: "This decision cannot be changed later.", okLabel: status === "Approved" ? "Approve" : "Reject",
      onOk: function () {
        p.status = status;
        p.execComment = note || "Approved.";
        p.decidedOn = SS.today();
        SS.EM.save("plans", plans);
        SS.EM.log("Plan " + status, p.id, p.appName);
        render();
        SS.ui.toast(p.id + " " + status.toLowerCase(), status === "Approved" ? "checkCircle" : "xCircle");
      }
    });
  }
  SS.$("#btn-approve").addEventListener("click", function () { decide("Approved"); });
  SS.$("#btn-reject").addEventListener("click", function () { decide("Rejected"); });
  render();
})();
