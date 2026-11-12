/* =========================================================
   EMDT - create-plan.js
   create-plan.html?sim=SIM-001   -> new plan from a simulation
   create-plan.html?plan=PLAN-001 -> view (Draft = editable)
   Statuses: Draft -> Submitted -> Approved / Rejected
   ========================================================= */
(function () {
  "use strict";
  var s = SS.session.current;
  if (!s) return;

  var C = SS.EMC;
  var sims = SS.EM.load("simulations");
  var plans = SS.EM.load("plans");
  var plan = null, sim = null, isNew = false;

  if (SS.param("plan")) {
    plan = plans.filter(function (p) { return p.id === SS.param("plan"); })[0];
    if (plan) sim = plan.snapshot;
  } else if (SS.param("sim")) {
    var sid = SS.param("sim");
    var existing = plans.filter(function (p) { return p.sim === sid; })[0];
    if (existing) { SS.go("modernization/create-plan.html?plan=" + existing.id); return; }
    var found = sims.filter(function (x) { return x.id === sid; })[0];
    if (found) { sim = found; isNew = true; }
  }

  /* No simulation chosen: list simulations that do not have a plan yet */
  if (!sim) {
    SS.$("#pick-sim").classList.remove("hidden");
    SS.$("#page-title").textContent = "Create Modernization Plan";
    var free = sims.filter(function (x) { return !plans.some(function (p) { return p.sim === x.id; }); });
    SS.ui.table({ el: "#sim-table", rows: free, pageSize: 8, unit: "simulations", empty: "All simulations already have a plan. Run a new simulation first.",
      columns: [
        { label: "Simulation", key: "id" }, { label: "Application", render: function (r) { return "<b>" + SS.esc(r.appName) + "</b>"; } },
        { label: "Strategy", key: "strategy" }, { label: "Risk", render: function (r) { return r.mr + " " + SS.ui.badge(r.mrLevel); } },
        { label: "Effort", render: function (r) { return r.effort + " wk"; } }, { label: "Cost", render: function (r) { return C.lakh(r.cost); } },
        { label: "", render: function (r) { return '<a class="btn btn-sm" href="create-plan.html?sim=' + r.id + '">Create Plan</a>'; } }
      ] });
    return;
  }

  var editable = isNew || (plan.status === "Draft" && plan.by === s.name);
  var phases = isNew ? C.phases(sim.effort) : plan.phases;
  var affected = isNew ? sim.affected : plan.affected;
  SS.$("#plan-body").classList.remove("hidden");
  SS.$("#btn-back-sim").setAttribute("href", "simulation.html?app=" + sim.app);

  /* header */
  if (isNew) {
    SS.$("#crumb-last").textContent = "Create Plan";
  } else {
    SS.$("#page-title").textContent = plan.name;
    SS.$("#crumb-last").textContent = plan.id;
    SS.$("#page-sub").textContent = editable ? "Draft plan - you can edit the name and notes, then submit." : "This plan is read-only.";
    SS.$("#status-badge").innerHTML = SS.ui.badge(plan.status);
  }

  /* executive decision */
  if (plan && (plan.status === "Approved" || plan.status === "Rejected")) {
    SS.$("#decision-card").innerHTML = '<b class="row">' + SS.icon(plan.status === "Approved" ? "checkCircle" : "xCircle") + "Executive decision: " + plan.status + "</b>" +
      '<p class="mt">' + SS.esc(plan.execComment || "No comment.") + "</p>";
  } else if (plan && plan.status === "Submitted") {
    SS.$("#decision-card").innerHTML = '<b class="row">' + SS.icon("clock") + "Waiting for Executive review</b><p class='small muted mt'>Submitted on " + plan.submitted + ". The plan is locked.</p>" +
      (plan.execComment ? '<p class="mt">' + SS.esc(plan.execComment) + "</p>" : "");
  } else {
    SS.$("#decision-card").remove();
  }

  /* 1. summary */
  var items = [["Application", sim.appName], ["Strategy", sim.strategy], ["Technical Debt", sim.td], ["Governance Risk", sim.gr],
               ["Dependency Impact", sim.di], ["Modernization Risk", sim.mr + " · " + sim.mrLevel], ["Estimated Effort", sim.effort + " weeks"], ["Estimated Cost", C.lakh(sim.cost)]];
  SS.$("#summary").innerHTML = items.map(function (x) { return '<div class="ro"><small>' + x[0] + "</small><b>" + SS.esc(x[1]) + "</b></div>"; }).join("");
  SS.$("#source-sim").textContent = "Source simulation: " + (plan ? plan.sim : sim.id) + " (" + sim.date + ")";
  var snap = [["EMSI score / multiplier", sim.emsi.toFixed ? sim.emsi.toFixed(2) + " / ×" + sim.multiplier.toFixed(2) + " (" + sim.category + ")" : sim.emsi],
              ["Technical Debt", sim.td], ["Governance Risk", sim.gr], ["Dependency Impact", sim.di + " (" + sim.raw + " raw points)"],
              ["Strategy Risk", sim.sr], ["Modernization Risk", sim.mr], ["Team size", sim.team], ["Cost per person-month", C.lakh(sim.perPersonMonth)],
              ["Labour cost", C.lakh(sim.labour)], ["Testing cost (10%)", C.lakh(sim.testing)], ["Tools cost", C.lakh(sim.tools)], ["Other fixed cost", C.lakh(sim.otherFixed)],
              ["Contingency", Math.round(sim.contingencyPct * 100) + "%"], ["Final cost", C.lakh(sim.cost)], ["Simulation date", sim.date]];
  SS.$("#snapshot-body").innerHTML = '<div class="table-wrap"><table class="table"><tbody>' + snap.map(function (x) { return "<tr><td>" + x[0] + "</td><td><b>" + SS.esc(x[1]) + "</b></td></tr>"; }).join("") + "</tbody></table></div>";

  /* 2. details */
  SS.$("#p-name").value = plan ? plan.name : C.newPlanFromSim(sim).name;
  SS.$("#p-notes").value = plan ? plan.notes : "";
  function count() { SS.$("#notes-count").textContent = SS.$("#p-notes").value.length + "/500"; }
  SS.$("#p-notes").addEventListener("input", count); count();
  SS.$("#reco").innerHTML = "<b>System recommendation</b><p class='small mt'>" + SS.esc(sim.recommendation) + "</p>";
  SS.$("#info").innerHTML = "<dt>Plan ID</dt><dd>" + (plan ? plan.id : "Assigned on save") + "</dd><dt>Status</dt><dd>" + (plan ? SS.ui.badge(plan.status) : SS.ui.badge("Draft")) +
    "</dd><dt>Created From</dt><dd>" + (plan ? plan.sim : sim.id) + "</dd><dt>Created By</dt><dd>" + SS.esc(plan ? plan.by : s.name) + "</dd><dt>Created On</dt><dd>" + (plan ? plan.created : SS.today()) +
    "</dd><dt>Submitted On</dt><dd>" + (plan && plan.submitted ? plan.submitted : "-") + "</dd>";
  if (!editable) { SS.$("#p-name").disabled = true; SS.$("#p-notes").disabled = true; SS.$("#actions").remove(); }
  else if (!isNew && SS.param("edit")) SS.$("#p-name").focus();

  /* 3. affected systems */
  SS.ui.table({ el: "#affected", rows: affected, paging: false, empty: "No direct dependencies.", columns: [
    { label: "System", render: function (r) { return "<b>" + SS.esc(r.name) + "</b>"; } },
    { label: "Dependency Type", key: "type" }, { label: "Criticality", render: function (r) { return SS.ui.badge(r.criticality); } }
  ] });

  /* 4. phases */
  var total = phases.reduce(function (t, p) { return t + p.weeks; }, 0);
  SS.$("#phases").innerHTML = '<div class="table-wrap"><table class="table"><thead><tr><th>#</th><th>Phase</th><th>Share</th><th class="right">Weeks</th></tr></thead><tbody>' +
    phases.map(function (p, i) { return "<tr><td>" + (i + 1) + "</td><td><b>" + p.name + "</b></td><td>" + p.pct + '</td><td class="right">' + p.weeks + "</td></tr>"; }).join("") +
    '<tr><td></td><td colspan="2"><b>Total estimated effort</b></td><td class="right"><b>' + total + "</b></td></tr></tbody></table></div>";
  var match = total === sim.effort;
  SS.$("#phase-check").innerHTML = match ? '<span class="badge badge-solid">' + total + " = " + sim.effort + " weeks</span>" : '<span class="badge badge-strong">Does not match effort</span>';

  /* save */
  function validName() {
    return SS.ui.validate(SS.$("#plan-body"), [
      { id: "p-name", rule: function (v) {
        if (v.length < 5 || v.length > 80) return "Plan name must be 5-80 characters";
        return plans.some(function (p) { return p !== plan && p.name.toLowerCase() === v.toLowerCase(); }) ? "A plan with this name already exists" : "";
      } },
      { id: "p-notes", rule: function (v) { return v.length <= 500 ? "" : "Max 500 characters"; } }
    ]);
  }
  function persist(status) {
    if (!match) { SS.ui.toast("Phase weeks must equal the estimated effort", "alert"); return null; }
    if (isNew) {
      plan = { id: SS.nextId(plans, "PLAN-", 3), sim: sim.id, created: SS.today(), submitted: "", by: s.name, execComment: "",
               app: sim.app, appName: sim.appName, ent: sim.ent, strategy: sim.strategy, snapshot: sim, affected: affected, phases: phases };
      plans.unshift(plan);
    }
    plan.name = SS.$("#p-name").value.trim();
    plan.notes = SS.$("#p-notes").value.trim();
    plan.status = status;
    if (status === "Submitted") plan.submitted = SS.today();
    SS.EM.save("plans", plans);
    SS.EM.log(status === "Draft" ? "Plan Saved as Draft" : "Plan Submitted", plan.id, plan.appName);
    return plan;
  }

  if (editable) {
    SS.$("#btn-draft").addEventListener("click", function () {
      if (!validName()) return;
      var p = persist("Draft");
      if (!p) return;
      SS.ui.toast(p.id + " saved as draft");
      setTimeout(function () { SS.go("modernization/plans.html"); }, 600);
    });
    SS.$("#btn-submit").addEventListener("click", function () {
      if (!validName()) return;
      SS.ui.confirm({
        title: "Submit modernization plan?", icon: "arrowRight",
        message: "After submission, this plan will be locked and sent to the Executive for review.",
        okLabel: "Submit Plan",
        onOk: function () {
          var p = persist("Submitted");
          if (!p) return;
          SS.ui.toast(p.id + " submitted for approval");
          setTimeout(function () { SS.go("modernization/plans.html"); }, 600);
        }
      });
    });
  }
})();
