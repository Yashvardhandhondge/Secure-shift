/* =========================================================
   EMDT - assessments.js  (modernization/assessments.html?app=APP-001)
   Technical Debt + Governance Risk for one application.
   ========================================================= */
(function () {
  "use strict";
  var s = SS.session.current;
  if (!s) return;

  var C = SS.EMC;
  var apps = SS.EM.load("apps");
  var assessments = SS.EM.load("assessments");
  var ents = SS.EM.load("enterprises");
  function entName(id) { var e = ents.filter(function (x) { return x.id === id; })[0]; return e ? e.name : id; }

  /* application list grouped by enterprise */
  SS.$("#app-select").innerHTML = ents.map(function (e) {
    var list = apps.filter(function (a) { return a.ent === e.id; });
    return list.length ? '<optgroup label="' + SS.esc(e.name) + '">' + list.map(function (a) { return '<option value="' + a.id + '">' + SS.esc(a.name) + "</option>"; }).join("") + "</optgroup>" : "";
  }).join("");
  var start = SS.param("app");
  if (!apps.some(function (a) { return a.id === start; })) {
    var cur = SS.EM.entId();
    var first = apps.filter(function (a) { return a.ent === cur; })[0] || apps[0];
    start = first.id;
  }
  SS.$("#app-select").value = start;

  function current() { return apps.filter(function (a) { return a.id === SS.$("#app-select").value; })[0]; }
  function factorRows(list) {
    return list.map(function (f) { return "<tr><td>" + f[0] + "</td><td>" + SS.esc(f[1]) + '</td><td class="right"><b>+' + f[2] + "</b></td></tr>"; }).join("");
  }

  function render() {
    var a = current();
    var asm = C.latestAssessment(a.id);
    SS.store.set("em.currentEnt", a.ent);
    history.replaceState(null, "", "assessments.html?app=" + a.id);
    SS.$("#crumb-apps").setAttribute("href", "applications.html?ent=" + a.ent);

    SS.$("#status-badge").innerHTML = asm ? '<span class="badge badge-solid">Assessed</span>' : '<span class="badge badge-soft">Not Assessed</span>';
    SS.$("#run-label").textContent = asm ? "Recalculate Assessment" : "Run Assessment";
    SS.$("#asm-date").textContent = asm ? "Assessed on " + asm.date + " by " + asm.by : "Not assessed yet";

    var di = C.depImpact(a.id);
    var items = [["Application", a.name], ["Technology & Framework", a.tech + " · " + a.framework], ["Framework Support", a.support],
                 ["Age", a.age + " years"], ["Business Criticality", a.criticality], ["Direct Dependencies", di.count],
                 ["Deployment Type", a.deployment], ["Enterprise", entName(a.ent)]];
    SS.$("#summary").innerHTML = items.map(function (x) { return '<div class="ro"><small>' + x[0] + "</small><b>" + SS.esc(x[1]) + "</b></div>"; }).join("");

    if (asm) {
      SS.$("#results").classList.remove("is-locked");
      SS.$("#td-score").textContent = asm.td; SS.$("#td-badge").innerHTML = SS.ui.badge(asm.tdLevel);
      SS.$("#gr-score").textContent = asm.gr; SS.$("#gr-badge").innerHTML = SS.ui.badge(asm.grLevel);
      SS.$("#td-factors").innerHTML = factorRows(asm.tdFactors) + '<tr><td colspan="2"><b>Total</b></td><td class="right"><b>' + asm.td + "</b></td></tr>";
      SS.$("#gr-factors").innerHTML = factorRows(asm.grFactors) + '<tr><td colspan="2"><b>Total</b></td><td class="right"><b>' + asm.gr + "</b></td></tr>";
      SS.$("#next-text").innerHTML = SS.icon("checkCircle") + "Assessment complete. Next: choose a strategy and simulate the modernization.";
      SS.$("#btn-continue").classList.remove("disabled");
      SS.$("#btn-continue").setAttribute("href", "simulation.html?app=" + a.id);
    } else {
      SS.$("#results").classList.add("is-locked");
      ["#td-score", "#gr-score"].forEach(function (x) { SS.$(x).textContent = "-"; });
      SS.$("#td-badge").innerHTML = ""; SS.$("#gr-badge").innerHTML = "";
      SS.$("#td-factors").innerHTML = '<tr><td colspan="3" class="empty">Click Run Assessment</td></tr>';
      SS.$("#gr-factors").innerHTML = '<tr><td colspan="3" class="empty">Click Run Assessment</td></tr>';
      SS.$("#next-text").innerHTML = SS.icon("info") + "Run the assessment first. Simulation is enabled only for assessed applications.";
      SS.$("#btn-continue").classList.add("disabled");
      SS.$("#btn-continue").setAttribute("href", "#");
    }

    SS.ui.table({ el: "#history", rows: assessments.filter(function (x) { return x.app === a.id; }), pageSize: 5, unit: "assessments",
      empty: "No assessment saved yet.", columns: [
        { label: "ID", key: "id" }, { label: "Date", key: "date" },
        { label: "Technical Debt", render: function (r) { return SS.ui.scorebar(r.td); } },
        { label: "Governance Risk", render: function (r) { return SS.ui.scorebar(r.gr); } },
        { label: "By", key: "by" }
      ] });
  }

  SS.$("#btn-continue").addEventListener("click", function (e) {
    if (this.classList.contains("disabled")) { e.preventDefault(); SS.ui.toast("Run the assessment first", "alert"); }
  });
  SS.$("#app-select").addEventListener("change", render);
  SS.$("#btn-run").addEventListener("click", function () {
    var a = current();
    var rec = Object.assign({ id: SS.nextId(assessments, "ASM-", 3), app: a.id, date: SS.today(), by: s.name }, C.assess(a));
    assessments.unshift(rec);
    SS.EM.save("assessments", assessments);
    SS.EM.log("Assessment Run", a.name, "Technical Debt " + rec.td + ", Governance Risk " + rec.gr);
    render();
    SS.ui.toast("Assessment " + rec.id + " saved: TD " + rec.td + ", GR " + rec.gr);
  });

  render();
})();
