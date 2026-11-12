/* =========================================================
   SecureShift - emdt-calc.js
   ALL EMDT formulas live here, so every page uses the same maths.

   1. EMSI  (Enterprise Modernization Size Index) + category + pricing
   2. Dependency points + Dependency Impact (per application)
   3. Technical Debt and Governance Risk (Assessment)
   4. Modernization simulation (risk, effort, cost, recommendation)
   5. Plan phases (always add up to the simulation effort)

   Load order: core.js -> emdt-data.js -> emdt-calc.js
   ========================================================= */

window.SS = window.SS || {};

(function (SS) {
  "use strict";
  var C = {};

  /* Pick the score for a value from a list of [upperLimit, score] bands */
  function band(value, bands) {
    for (var i = 0; i < bands.length; i++) { if (value <= bands[i][0]) return bands[i][1]; }
    return bands[bands.length - 1][1];
  }
  function round2(n) { return Math.round(n * 100) / 100; }
  C.level = function (score) { return score >= 70 ? "High" : score >= 40 ? "Medium" : "Low"; };

  /* =====================================================
     1. EMSI
     ===================================================== */
  C.TECH_VALUES = { "Java": 75, "PHP": 95, ".NET": 120, "COBOL": 450 };   // max total 740
  C.POLICIES = ["GDPR", "HIPAA", "PCI DSS", "ISO 27001", "SOC 2"];
  C.CLOUD_TYPES = { "Public Cloud": 25, "Private Cloud": 40, "Hybrid Cloud": 70, "Multi-Cloud": 100 };
  C.CRIT_SCORE = { low: 25, medium: 50, high: 75, critical: 100 };

  C.score = {
    totalApps: function (v) { return band(v, [[25, 20], [100, 40], [250, 60], [500, 80], [Infinity, 100]]); },
    deps: function (v) { return v === 0 ? 0 : band(v, [[25, 25], [100, 50], [300, 75], [Infinity, 100]]); },
    apis: function (v) { return v === 0 ? 0 : band(v, [[10, 25], [50, 50], [150, 75], [Infinity, 100]]); },
    dbs: function (v) { return band(v, [[5, 25], [15, 50], [30, 75], [Infinity, 100]]); },
    storageGB: function (v) { return band(v, [[99.999, 20], [1024, 40], [5120, 60], [20480, 80], [Infinity, 100]]); },
    envs: function (v) { return band(v, [[1, 25], [2, 50], [3, 75], [Infinity, 100]]); },
    units: function (v) { return band(v, [[1, 20], [3, 40], [6, 60], [10, 80], [Infinity, 100]]); },
    techs: function (list) {
      var sum = list.reduce(function (t, x) { return t + (C.TECH_VALUES[x] || 0); }, 0);
      return round2((sum / 740) * 100);
    },
    users: function (v) { return band(v, [[50, 20], [200, 40], [500, 60], [1000, 80], [Infinity, 100]]); },
    crit: function (c) {
      var n = c.low + c.medium + c.high + c.critical;
      if (!n) return 0;
      return round2((c.low * 25 + c.medium * 50 + c.high * 75 + c.critical * 100) / n);
    },
    policies: function (list) { return band(list.length, [[1, 25], [2, 50], [3, 75], [Infinity, 100]]); },
    cloud: function (t) { return C.CLOUD_TYPES[t] || 0; },
    loc: function (v) { return band(v, [[99999, 20], [500000, 40], [2000000, 60], [10000000, 80], [Infinity, 100]]); }
  };

  /* Weightages - they add up to 100% */
  C.EMSI_ROWS = [
    { key: "totalApps", label: "Total applications", weight: 0.14 },
    { key: "deps", label: "Number of dependencies", weight: 0.14 },
    { key: "apis", label: "Number of APIs", weight: 0.07 },
    { key: "dbStorage", label: "Databases and storage", weight: 0.09 },
    { key: "envs", label: "Number of environments", weight: 0.06 },
    { key: "units", label: "Number of business units", weight: 0.04 },
    { key: "techs", label: "Technology diversity", weight: 0.15 },
    { key: "users", label: "Number of active users", weight: 0.04 },
    { key: "crit", label: "Application criticality", weight: 0.09 },
    { key: "policies", label: "Governance policies used", weight: 0.06 },
    { key: "cloud", label: "Cloud infrastructure type", weight: 0.07 },
    { key: "loc", label: "Lines of code", weight: 0.05 }
  ];

  C.CATEGORIES = [
    { name: "Foundation", min: 0, max: 24.99, multiplier: 0.90, monthly: 5000, annual: 54000 },
    { name: "Growth", min: 25, max: 44.99, multiplier: 1.00, monthly: 10000, annual: 108000 },
    { name: "Enterprise", min: 45, max: 69.99, multiplier: 1.05, monthly: 25000, annual: 270000 },
    { name: "Strategic", min: 70, max: 100, multiplier: 1.10, monthly: 50000, annual: 540000 }
  ];
  C.categoryOf = function (score) {
    for (var i = C.CATEGORIES.length - 1; i >= 0; i--) { if (score >= C.CATEGORIES[i].min) return C.CATEGORIES[i]; }
    return C.CATEGORIES[0];
  };

  /* cls = enterprise.classification -> full EMSI result (or null if not classified) */
  C.emsi = function (cls) {
    if (!cls) return null;
    var dbScore = C.score.dbs(cls.dbs), stScore = C.score.storageGB(cls.storageGB);
    var inputs = {
      totalApps: [cls.totalApps, C.score.totalApps(cls.totalApps)],
      deps: [cls.deps, C.score.deps(cls.deps)],
      apis: [cls.apis, C.score.apis(cls.apis)],
      dbStorage: [cls.dbs + " DBs, " + SS.fmt(cls.storageGB) + " GB", round2((dbScore + stScore) / 2)],
      envs: [cls.envs, C.score.envs(cls.envs)],
      units: [cls.units, C.score.units(cls.units)],
      techs: [cls.techs.join(" + "), C.score.techs(cls.techs)],
      users: [SS.fmt(cls.users), C.score.users(cls.users)],
      crit: [cls.crit.low + "L / " + cls.crit.medium + "M / " + cls.crit.high + "H / " + cls.crit.critical + "C", C.score.crit(cls.crit)],
      policies: [cls.policies.length ? cls.policies.join(", ") : "None", C.score.policies(cls.policies)],
      cloud: [cls.cloud, C.score.cloud(cls.cloud)],
      loc: [SS.fmt(cls.loc), C.score.loc(cls.loc)]
    };
    var total = 0;
    var rows = C.EMSI_ROWS.map(function (r) {
      var sc = inputs[r.key][1], w = round2(sc * r.weight);
      total += sc * r.weight;
      return { label: r.label, input: inputs[r.key][0], score: sc, weight: r.weight, weighted: w };
    });
    var score = round2(total);
    var cat = C.categoryOf(score);
    return { rows: rows, score: score, category: cat.name, multiplier: cat.multiplier, plan: cat };
  };
  C.entEmsi = function (ent) { return ent ? C.emsi(ent.classification) : null; };

  /* =====================================================
     2. Dependencies
     ===================================================== */
  C.TYPE_WEIGHT = { "Application": 4, "Service": 3, "Database": 3, "API": 2 };
  C.CRIT_POINTS = { "Low": 1, "Medium": 2, "High": 3, "Critical": 4 };
  C.CRIT_RANK = { "None": 0, "Low": 1, "Medium": 2, "High": 3, "Critical": 4 };
  C.DI_K = 20;   // normalisation constant: higher K = slower growth

  /* Find any node (application or component) by id */
  C.node = function (id) {
    if (String(id).indexOf("APP-") === 0) {
      var a = SS.EM.load("apps").filter(function (x) { return x.id === id; })[0];
      return a ? { id: a.id, type: "Application", name: a.name, app: a.id, ent: a.ent } : null;
    }
    return SS.EM.load("nodes").filter(function (n) { return n.id === id; })[0] || null;
  };
  C.ownerApp = function (id) { var n = C.node(id); return n ? n.app : null; };
  C.linkType = function (link) { var t = C.node(link.target); return t ? t.type : "Application"; };
  C.linkPoints = function (link) { return C.TYPE_WEIGHT[C.linkType(link)] * C.CRIT_POINTS[link.criticality]; };

  /* Direct OUTGOING links of an application (from the app or any of its components) */
  C.appLinks = function (appId) {
    return SS.EM.load("links").filter(function (l) { return C.ownerApp(l.source) === appId; });
  };

  /* Dependency Impact (0-100) with diminishing returns: 100 x (1 - e^(-raw / K)) */
  C.depImpact = function (appId) {
    var links = C.appLinks(appId);
    var raw = links.reduce(function (t, l) { return t + C.linkPoints(l); }, 0);
    return { links: links, count: links.length, raw: raw, score: Math.round(100 * (1 - Math.exp(-raw / C.DI_K))) };
  };

  /* Affected systems = targets of the direct links */
  C.affected = function (appId) {
    return C.appLinks(appId).map(function (l) {
      var t = C.node(l.target);
      var owner = t && t.app !== appId ? C.node(t.app) : null;
      return { name: t ? t.name : l.target, type: C.linkType(l), criticality: l.criticality, owner: owner ? owner.name : "Same application" };
    });
  };

  /* =====================================================
     3. Assessment
     ===================================================== */
  C.techDebt = function (app) {
    var f = [
      ["Application age", app.age + " years", Math.min(25, app.age * 2)],
      ["Framework support", app.framework + " (" + app.support + ")", { Unsupported: 25, Extended: 12, Supported: 0 }[app.support] || 0],
      ["Documentation quality", app.docQuality, { Poor: 15, Average: 8, Good: 0 }[app.docQuality] || 0],
      ["Code complexity", app.complexity, { High: 20, Medium: 10, Low: 3 }[app.complexity] || 0],
      ["Codebase size", SS.fmt(app.loc) + " lines", band(app.loc, [[99999, 2], [500000, 5], [2000000, 10], [Infinity, 15]])]
    ];
    var score = Math.min(100, f.reduce(function (t, x) { return t + x[2]; }, 0));
    return { score: score, level: C.level(score), factors: f };
  };

  C.govRisk = function (app) {
    var links = C.appLinks(app.id);
    var top = links.reduce(function (m, l) { return C.CRIT_RANK[l.criticality] > C.CRIT_RANK[m] ? l.criticality : m; }, "None");
    if (!links.length) top = "None";
    var f = [
      ["Business criticality", app.criticality, { Critical: 30, High: 22, Medium: 12, Low: 5 }[app.criticality] || 0],
      ["Sensitive data", app.sensitive, app.sensitive === "Yes" ? 20 : 0],
      ["Security issues", app.securityIssues + " issues", band(app.securityIssues, [[0, 0], [2, 5], [5, 10], [Infinity, 15]])],
      ["Dependency criticality", top === "None" ? "No dependencies" : "Highest: " + top, { Critical: 15, High: 10, Medium: 5, Low: 2, None: 0 }[top]],
      ["Downtime tolerance", app.downtime, { Low: 10, Medium: 5, High: 0 }[app.downtime] || 0],
      ["Compliance requirements", app.compliance + (app.compliance === 1 ? " policy" : " policies"), band(app.compliance, [[0, 0], [2, 5], [Infinity, 10]])]
    ];
    var score = Math.min(100, f.reduce(function (t, x) { return t + x[2]; }, 0));
    return { score: score, level: C.level(score), factors: f };
  };

  C.assess = function (app) {
    var td = C.techDebt(app), gr = C.govRisk(app);
    return { td: td.score, tdLevel: td.level, tdFactors: td.factors, gr: gr.score, grLevel: gr.level, grFactors: gr.factors };
  };

  /* Latest assessment of an app (or null) */
  C.latestAssessment = function (appId) {
    return SS.EM.load("assessments").filter(function (a) { return a.app === appId; })[0] || null;
  };

  /* =====================================================
     4. Simulation
     ===================================================== */
  C.STRATEGIES = {
    Rehost: { risk: 25, weeks: 1, team: 3, label: "Move as-is to the cloud" },
    Replatform: { risk: 50, weeks: 2, team: 4, label: "Small changes to use a managed platform" },
    Refactor: { risk: 75, weeks: 4, team: 5, label: "Restructure the code for the cloud" },
    Rebuild: { risk: 100, weeks: 6, team: 6, label: "Rewrite the application from scratch" }
  };
  C.COST = { perPersonMonth: 0.60, testingPct: 0.10, tools: 1.00, otherFixed: 1.50, contingencyPct: 0.15 };  // ₹ lakh
  C.MR_WEIGHTS = { td: 0.30, gr: 0.25, di: 0.25, sr: 0.20 };

  C.simulate = function (app, strategy) {
    var asm = C.latestAssessment(app.id);
    var a = asm && asm.td !== undefined ? asm : C.assess(app);
    var ent = SS.EM.load("enterprises").filter(function (e) { return e.id === app.ent; })[0];
    var em = C.entEmsi(ent) || { score: 0, category: "Not classified", multiplier: 1 };
    var di = C.depImpact(app.id);
    var st = C.STRATEGIES[strategy];
    var mr = Math.round(a.td * C.MR_WEIGHTS.td + a.gr * C.MR_WEIGHTS.gr + di.score * C.MR_WEIGHTS.di + st.risk * C.MR_WEIGHTS.sr);
    var baseWeeks = round2(6 + mr * 0.12);
    var effort = Math.round(baseWeeks * em.multiplier + st.weeks);
    var pm = round2(effort / 4.33);
    var labour = round2(st.team * pm * C.COST.perPersonMonth);
    var testing = round2(labour * C.COST.testingPct);
    var subtotal = labour + testing + C.COST.tools + C.COST.otherFixed;
    var cost = round2(subtotal * (1 + C.COST.contingencyPct));
    var mrLevel = C.level(mr);
    var aff = C.affected(app.id);
    var order = aff.slice().sort(function (x, y) { return C.CRIT_RANK[y.criticality] - C.CRIT_RANK[x.criticality]; }).map(function (x) { return x.name; });
    var rec = mrLevel === "High"
      ? "High modernization risk. Use a phased implementation with a parallel run. Stabilise the critical dependencies first."
      : mrLevel === "Medium"
        ? "Moderate risk. Proceed in planned releases with dependency testing at every step."
        : "Low risk. Good candidate for a single-release modernization.";
    return {
      app: app.id, appName: app.name, ent: app.ent, strategy: strategy,
      td: a.td, tdLevel: C.level(a.td), gr: a.gr, grLevel: C.level(a.gr),
      di: di.score, raw: di.raw, depCount: di.count, sr: st.risk, mr: mr, mrLevel: mrLevel,
      emsi: em.score, category: em.category, multiplier: em.multiplier,
      baseWeeks: baseWeeks, adjWeeks: st.weeks, effort: effort, team: st.team, personMonths: pm,
      perPersonMonth: C.COST.perPersonMonth, labour: labour, testing: testing, tools: C.COST.tools, otherFixed: C.COST.otherFixed,
      contingencyPct: C.COST.contingencyPct, cost: cost, recommendation: rec, sequence: order, affected: aff,
      criticality: app.criticality
    };
  };

  C.lakh = function (n) { return "₹" + Number(n).toFixed(2) + " lakh"; };

  /* =====================================================
     5. Plan phases: 15% / 20% / 45% / remainder
     ===================================================== */
  C.phases = function (effort) {
    var p1 = Math.round(effort * 0.15), p2 = Math.round(effort * 0.20), p3 = Math.round(effort * 0.45);
    var p4 = effort - p1 - p2 - p3;   // rounding difference goes to the last phase
    return [
      { name: "Assessment and Readiness", pct: "15%", weeks: p1 },
      { name: "Architecture and Design", pct: "20%", weeks: p2 },
      { name: "Implementation", pct: "45%", weeks: p3 },
      { name: "Testing and Validation", pct: "Remaining", weeks: p4 }
    ];
  };

  C.newPlanFromSim = function (sim) {
    return { name: sim.appName + " " + sim.strategy + " Plan", phases: C.phases(sim.effort) };
  };

  /* =====================================================
     Fill the seed data with calculated values (runs once at load)
     ===================================================== */
  function fillSeeds() {
    var apps = SS.EM.apps;
    function app(id) { return apps.filter(function (a) { return a.id === id; })[0]; }
    // Seeds are frozen snapshots: always calculate them from the ORIGINAL demo data,
    // never from the user's edited copy, so a plan's numbers never change later.
    var saveLoad = SS.EM.load;
    SS.EM.load = function (k) { return SS.EM[k]; };
    SS.EM.assessments = SS.EM.assessments.map(function (s) { return s.td !== undefined ? s : Object.assign({}, s, C.assess(app(s.app))); });
    SS.EM.simulations = SS.EM.simulations.map(function (s) { return s.mr !== undefined ? s : Object.assign({}, C.simulate(app(s.app), s.strategy), s); });
    SS.EM.plans = SS.EM.plans.map(function (p) {
      if (p.snapshot) return p;
      var sim = SS.EM.simulations.filter(function (x) { return x.id === p.sim; })[0];
      return Object.assign({}, p, { name: sim.appName + " " + sim.strategy + " Plan", app: sim.app, appName: sim.appName, ent: sim.ent,
        strategy: sim.strategy, snapshot: sim, affected: sim.affected, phases: C.phases(sim.effort) });
    });
    SS.EM.load = saveLoad;
  }
  if (SS.EM && SS.EM.apps) fillSeeds();

  SS.EMC = C;
})(window.SS);
