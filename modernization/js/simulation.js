/* =========================================================
   EMDT - simulation.js  (modernization/simulation.html?app=APP-001)
   Assessed app + strategy -> Dependency Impact, Strategy Risk,
   Modernization Risk, Effort, Cost, Recommendation.
   ========================================================= */
(function () {
  "use strict";
  var s = SS.session.current;
  if (!s) return;

  var C = SS.EMC;
  var apps = SS.EM.load("apps");
  var ents = SS.EM.load("enterprises");
  var sims = SS.EM.load("simulations");
  var plans = SS.EM.load("plans");
  var last = null, lastId = null;

  var assessed = apps.filter(function (a) { return !!C.latestAssessment(a.id); });
  if (!assessed.length) {
    SS.$("#sim-form").innerHTML = '<div class="center" style="padding:30px"><b>No assessed applications yet.</b><p class="muted mt">Assess an application first.</p><a class="btn mt" href="applications.html">Go to Applications</a></div>';
    return;
  }
  SS.$("#s-app").innerHTML = ents.map(function (e) {
    var list = assessed.filter(function (a) { return a.ent === e.id; });
    return list.length ? '<optgroup label="' + SS.esc(e.name) + '">' + list.map(function (a) { return '<option value="' + a.id + '">' + SS.esc(a.name) + "</option>"; }).join("") + "</optgroup>" : "";
  }).join("");
  var want = SS.param("app");
  if (assessed.some(function (a) { return a.id === want; })) SS.$("#s-app").value = want;
  else if (want) SS.ui.toast("That application is not assessed yet - assess it first", "alert");

  SS.$("#s-strategy").innerHTML = Object.keys(C.STRATEGIES).map(function (k) {
    var st = C.STRATEGIES[k];
    return '<label class="card" style="cursor:pointer;box-shadow:none;padding:14px"><span class="check"><input type="radio" name="strategy" value="' + k + '"' + (k === "Refactor" ? " checked" : "") +
           "> <b>" + k + '</b></span><div class="small muted mt">' + st.label + '</div><div class="small mt">Strategy Risk <b>' + st.risk + "</b> · Effort <b>+" + st.weeks + " wk</b> · Team <b>" + st.team + "</b></div></label>";
  }).join("");

  function app() { return apps.filter(function (a) { return a.id === SS.$("#s-app").value; })[0]; }
  function strategy() { var r = SS.$('input[name="strategy"]:checked'); return r ? r.value : ""; }

  function summary() {
    var a = app(), asm = C.latestAssessment(a.id), di = C.depImpact(a.id);
    var ent = ents.filter(function (e) { return e.id === a.ent; })[0], em = C.entEmsi(ent);
    var items = [["Technical Debt", asm.td + " · " + asm.tdLevel], ["Governance Risk", asm.gr + " · " + asm.grLevel],
                 ["Direct Dependencies", di.count], ["Business Criticality", a.criticality],
                 ["EMSI", em ? em.score.toFixed(2) + " · ×" + em.multiplier.toFixed(2) : "Not classified · ×1.00"]];
    SS.$("#app-summary").innerHTML = items.map(function (x) { return '<div class="ro"><small>' + x[0] + "</small><b>" + SS.esc(x[1]) + "</b></div>"; }).join("");
    history.replaceState(null, "", "simulation.html?app=" + a.id);
  }
  SS.$("#s-app").addEventListener("change", function () { summary(); SS.$("#result").classList.add("hidden"); });

  function drawImpact(r) {
    var W = 720, H = 260, cx = W / 2, nw = 160, nh = 42, n = r.affected.length;
    var svg = '<svg viewBox="0 0 ' + W + " " + H + '"><defs><marker id="a2" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" style="fill:var(--accent)"/></marker></defs>';
    var pos = r.affected.map(function (x, i) { return { x: n === 1 ? cx : 20 + nw / 2 + (i * (W - 40 - nw)) / Math.max(1, n - 1), y: n > 4 && i % 2 ? 215 : 175, d: x }; });
    pos.forEach(function (p) { svg += '<line class="g-edge hl" x1="' + cx + '" y1="' + (40 + nh / 2) + '" x2="' + p.x + '" y2="' + (p.y - nh / 2 - 2) + '" marker-end="url(#a2)"/>'; });
    svg += '<g class="g-node source" transform="translate(' + (cx - nw / 2) + ',40)"><rect width="' + nw + '" height="' + nh + '" rx="8"/><text x="' + nw / 2 + '" y="26" text-anchor="middle">' + SS.esc(r.appName) + "</text></g>";
    pos.forEach(function (p) {
      svg += '<g class="g-node impact" transform="translate(' + (p.x - nw / 2) + "," + (p.y - nh / 2) + ')"><rect width="' + nw + '" height="' + nh + '" rx="8"/><text x="' + nw / 2 + '" y="18" text-anchor="middle">' +
             SS.esc(p.d.name) + '</text><text class="t-type" x="' + nw / 2 + '" y="33" text-anchor="middle">' + p.d.type + " · " + p.d.criticality + "</text></g>";
    });
    if (!n) svg += '<text x="' + cx + '" y="170" text-anchor="middle" class="g-label" style="font-size:13px">No mapped dependencies - low blast radius</text>';
    SS.$("#impact-graph").innerHTML = svg + "</svg>";
  }

  function show(r, id) {
    last = r; lastId = id;
    SS.$("#result").classList.remove("hidden");
    SS.$("#r-id").textContent = id + " · " + r.appName + " · " + r.strategy;
    var m = [["Dependency Impact", r.di, C.level(r.di)], ["Strategy Risk", r.sr, ""], ["Modernization Risk", r.mr, r.mrLevel],
             ["Estimated Effort", r.effort + " weeks", ""], ["Estimated Cost", C.lakh(r.cost), ""]];
    SS.$("#metrics").innerHTML = m.map(function (x) {
      return '<div class="card stat"><div><div class="stat-label">' + x[0] + '</div><div class="stat-value" style="font-size:24px">' + x[1] + "</div>" +
             (x[2] ? '<div class="stat-foot">' + SS.ui.badge(x[2]) + "</div>" : "") + "</div></div>";
    }).join("");
    drawImpact(r);
    SS.$("#reco").innerHTML = '<b class="row">' + SS.icon(r.mrLevel === "High" ? "alert" : "checkCircle") + "Recommendation</b><p class='small mt'>" + r.recommendation + "</p>" +
      (r.sequence.length ? "<div class='small mt'><b>Suggested order</b> (most critical dependency first):</div><ol class='small'>" + r.sequence.map(function (x) { return "<li>" + SS.esc(x) + "</li>"; }).join("") + "<li>" + SS.esc(r.appName) + "</li></ol>" : "");
    var w = C.MR_WEIGHTS;
    SS.$("#breakdown").innerHTML =
      '<div class="block-grey"><b>Modernization Risk</b><div class="small mt mono">= TD×' + w.td + " + GR×" + w.gr + " + DI×" + w.di + " + SR×" + w.sr + "</div>" +
        '<div class="small mt mono">= ' + r.td + "×" + w.td + " + " + r.gr + "×" + w.gr + " + " + r.di + "×" + w.di + " + " + r.sr + "×" + w.sr + "</div>" +
        '<div class="mt">= <b>' + r.mr + "</b> (" + r.mrLevel + ")</div><div class='small muted mt'>DI from " + r.raw + " raw dependency points</div></div>" +
      '<div class="block-grey"><b>Effort</b><div class="small mt mono">Base = 6 + MR×0.12 = ' + r.baseWeeks + " wk</div>" +
        '<div class="small mono">× EMSI multiplier ' + r.multiplier.toFixed(2) + " (" + r.category + ")</div>" +
        '<div class="small mono">+ strategy adjustment ' + r.adjWeeks + " wk</div><div class='mt'>= <b>" + r.effort + " weeks</b> (" + r.personMonths + " months)</div></div>" +
      '<div class="block-grey"><b>Cost (₹ lakh)</b><div class="small mt mono">Team ' + r.team + " × " + r.personMonths + " months × " + r.perPersonMonth + " = " + r.labour.toFixed(2) + "</div>" +
        '<div class="small mono">+ Testing 10% ' + r.testing.toFixed(2) + " + Tools " + r.tools.toFixed(2) + " + Other " + r.otherFixed.toFixed(2) + "</div>" +
        '<div class="small mono">+ Contingency ' + Math.round(r.contingencyPct * 100) + "%</div><div class='mt'>= <b>" + C.lakh(r.cost) + "</b></div></div>";
    SS.$("#btn-create-plan").setAttribute("href", "create-plan.html?sim=" + id);
    SS.$("#result").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function renderHistory() {
    SS.ui.table({ el: "#history", rows: sims, pageSize: 6, unit: "simulations", columns: [
      { label: "ID", key: "id" }, { label: "Application", render: function (r) { return "<b>" + SS.esc(r.appName) + "</b>"; } },
      { label: "Strategy", key: "strategy" }, { label: "DI", right: true, key: "di" },
      { label: "Modernization Risk", render: function (r) { return r.mr + " " + SS.ui.badge(r.mrLevel); } },
      { label: "Effort", right: true, render: function (r) { return r.effort + " wk"; } }, { label: "Cost", render: function (r) { return C.lakh(r.cost); } },
      { label: "Date", key: "date" },
      { label: "Plan", render: function (r) {
        var p = plans.filter(function (x) { return x.sim === r.id; })[0];
        return p ? '<a href="create-plan.html?plan=' + p.id + '">' + p.id + "</a>" : '<a class="btn btn-outline btn-sm" href="create-plan.html?sim=' + r.id + '">Create Plan</a>'; } }
    ] });
  }

  SS.$("#sim-form").addEventListener("submit", function (e) {
    e.preventDefault();
    if (!strategy()) { SS.ui.toast("Choose a strategy", "alert"); return; }
    var btn = SS.$("#btn-run");
    btn.disabled = true; btn.textContent = "Simulating...";
    setTimeout(function () {
      var r = C.simulate(app(), strategy());
      var id = SS.nextId(sims, "SIM-", 3);
      sims.unshift(Object.assign({ id: id, date: SS.today(), by: s.name }, r));
      SS.EM.save("simulations", sims);
      SS.EM.log("Simulation Run", r.appName, r.strategy + " · MR " + r.mr);
      show(r, id);
      renderHistory();
      btn.disabled = false; btn.innerHTML = SS.icon("play") + "Run Simulation";
      SS.ui.toast("Simulation " + id + " complete: " + r.mrLevel + " risk");
    }, 600);
  });

  SS.$("#btn-discard").addEventListener("click", function () {
    // Discard: remove the simulation that was just run (it has no plan yet)
    if (lastId && !plans.some(function (p) { return p.sim === lastId; })) {
      sims = sims.filter(function (x) { return x.id !== lastId; });
      SS.EM.save("simulations", sims);
      SS.EM.log("Simulation Discarded", lastId, last.appName);
      renderHistory();
    }
    SS.$("#result").classList.add("hidden");
    window.scrollTo({ top: 0, behavior: "smooth" });
    SS.ui.toast("Change the application or strategy and run again", "info");
  });

  summary();
  renderHistory();
})();
