/* =========================================================
   EMDT - classification.js  (modernization/classification.html?ent=...)
   Enterprise details -> validate -> EMSI score -> category -> pricing.
   ========================================================= */
(function () {
  "use strict";
  if (!SS.session.current) return;

  var C = SS.EMC;
  var ents = SS.EM.load("enterprises");
  var id = SS.EM.entId();
  var e = ents.filter(function (x) { return x.id === id; })[0];

  SS.EM.entPicker(SS.$("#ent-picker"));
  SS.$("#crumb-ent").textContent = e.name;
  SS.$("#crumb-ent").setAttribute("href", "enterprise.html?ent=" + e.id);
  SS.$("#btn-cancel").setAttribute("href", "enterprise.html?ent=" + e.id);
  SS.$("#form-title").textContent = "Portfolio Details - " + e.name;

  SS.$("#c-techs").innerHTML = Object.keys(C.TECH_VALUES).map(function (t) {
    return '<label class="check"><input type="checkbox" name="tech" value="' + t + '"> ' + t + ' <span class="muted small">(' + C.TECH_VALUES[t] + ")</span></label>";
  }).join("");
  SS.$("#c-policies").innerHTML = C.POLICIES.map(function (p) {
    return '<label class="check"><input type="checkbox" name="policy" value="' + p + '"> ' + p + "</label>";
  }).join("");

  var NUM = ["totalApps", "deps", "apis", "dbs", "storageGB", "envs", "units", "users", "loc"];
  var CRIT = ["low", "medium", "high", "critical"];

  /* fill form when editing */
  var c = e.classification;
  if (c) {
    NUM.forEach(function (k) { SS.$("#c-" + k).value = c[k]; });
    CRIT.forEach(function (k) { SS.$("#c-crit-" + k).value = c.crit[k]; });
    SS.$("#c-cloud").value = c.cloud;
    SS.$$('input[name="tech"]').forEach(function (x) { x.checked = c.techs.indexOf(x.value) > -1; });
    SS.$$('input[name="policy"]').forEach(function (x) { x.checked = c.policies.indexOf(x.value) > -1; });
  }

  function checked(name) { return SS.$$('input[name="' + name + '"]:checked').map(function (x) { return x.value; }); }
  function critSum() { return CRIT.reduce(function (t, k) { return t + (Number(SS.$("#c-crit-" + k).value) || 0); }, 0); }
  function showCritSum() {
    var total = Number(SS.$("#c-totalApps").value) || 0, sum = critSum();
    SS.$("#crit-sum").innerHTML = "Sum of levels: <b>" + sum + "</b> / Total applications: <b>" + total + "</b> " +
      (sum === total && total > 0 ? '<span class="badge badge-solid">Matches</span>' : '<span class="badge badge-strong">Must match</span>');
  }
  ["#c-totalApps"].concat(CRIT.map(function (k) { return "#c-crit-" + k; })).forEach(function (s) { SS.$(s).addEventListener("input", showCritSum); });

  function rules() {
    var r = [
      { id: "c-totalApps", rule: function (v) { return SS.V.int(v, 1, 100000) ? "" : "Whole number from 1 to 100,000"; } },
      { id: "c-deps", rule: function (v) { return SS.V.int(v, 0, 1000000) ? "" : "Whole number, 0 or more"; } },
      { id: "c-apis", rule: function (v) { return SS.V.int(v, 0, 100000) ? "" : "Whole number, 0 or more"; } },
      { id: "c-loc", rule: function (v) { return SS.V.int(v, 1000, 1000000000) ? "" : "Whole number from 1,000 to 1,000,000,000"; } },
      { id: "c-dbs", rule: function (v) { return SS.V.int(v, 1, 100000) ? "" : "At least 1 database"; } },
      { id: "c-storageGB", rule: function (v) { return SS.V.int(v, 1, 10000000) ? "" : "Whole number of GB, at least 1"; } },
      { id: "c-envs", rule: function (v) { return SS.V.int(v, 1, 20) ? "" : "Whole number from 1 to 20"; } },
      { id: "c-cloud", rule: function (v) { return v ? "" : "Select a cloud type"; } },
      { id: "c-units", rule: function (v) { return SS.V.int(v, 1, 500) ? "" : "Whole number from 1 to 500"; } },
      { id: "c-users", rule: function (v) { return SS.V.int(v, 1, 10000000) ? "" : "Whole number, at least 1"; } },
      { id: "c-techs", rule: function () { return checked("tech").length ? "" : "Select at least one technology"; } }
    ];
    CRIT.forEach(function (k) {
      r.push({ id: "c-crit-" + k, rule: function (v) { return SS.V.int(v, 0, 100000) ? "" : "0 or more"; } });
    });
    r.push({ id: "c-crit-critical", rule: function () {
      return critSum() === Number(SS.$("#c-totalApps").value) ? "" : "Low + Medium + High + Critical must equal Total applications"; } });
    // consistency checks
    r.push({ id: "c-apis", rule: function (v) {
      return Number(v) > Number(SS.$("#c-deps").value) * 2 + 50 ? "APIs look too high compared with dependencies - please check" : ""; } });
    return r;
  }

  function collect() {
    var o = {};
    NUM.forEach(function (k) { o[k] = Number(SS.$("#c-" + k).value); });
    o.crit = {}; CRIT.forEach(function (k) { o.crit[k] = Number(SS.$("#c-crit-" + k).value); });
    o.cloud = SS.$("#c-cloud").value; o.techs = checked("tech"); o.policies = checked("policy");
    return o;
  }

  function showResult(r) {
    if (!r) {
      SS.$("#result").innerHTML = '<p class="muted small">Fill the form and click <b>Save &amp; Calculate EMSI</b>.</p>';
      return;
    }
    SS.$("#result").innerHTML =
      '<div class="center"><div class="emsi-ring" style="--p:' + r.score + ';margin:0 auto"><div><b id="r-score">' + r.score.toFixed(2) + '</b><span class="small muted">/ 100</span></div></div>' +
      '<div class="mt" style="font-size:22px;font-weight:900" id="r-category">' + r.category + '</div><div class="small">Effort multiplier ×' + r.multiplier.toFixed(2) + "</div></div>" +
      '<div class="cat-scale">' + C.CATEGORIES.map(function (x) { return '<div class="' + (x.name === r.category ? "on" : "") + '"><b>' + x.name + "</b>" + x.min + "-" + Math.ceil(x.max) + "</div>"; }).join("") + "</div>" +
      '<div class="price mt"><b>' + r.plan.name + ' Plan</b><div class="grid g-2 mt"><div><div class="small muted">Monthly</div><div class="amt">₹' + SS.fmt(r.plan.monthly) +
      '</div></div><div><div class="small muted">Annual (-10%)</div><div class="amt">₹' + SS.fmt(r.plan.annual) + "</div></div></div></div>";
    SS.$("#breakdown-card").classList.remove("hidden");
    SS.ui.table({ el: "#breakdown", rows: r.rows, paging: false, columns: [
      { label: "Parameter", key: "label" }, { label: "Your input", render: function (x) { return SS.esc(x.input); } },
      { label: "Score (0-100)", right: true, render: function (x) { return x.score; } },
      { label: "Weight", right: true, render: function (x) { return Math.round(x.weight * 100) + "%"; } },
      { label: "Score × Weight", right: true, render: function (x) { return "<b>" + x.weighted.toFixed(2) + "</b>"; } }
    ] });
  }

  SS.$("#cls-form").addEventListener("submit", function (ev) {
    ev.preventDefault();
    var ok = SS.ui.validate(this, rules());
    if (!ok) {
      var first = SS.$(".invalid", this) || SS.$(".error-text", this);
      if (first) first.scrollIntoView({ behavior: "smooth", block: "center" });
      SS.ui.toast("EMSI not calculated - please fix the highlighted fields", "alert");
      return;
    }
    e.classification = collect();
    e.classifiedOn = SS.today();
    SS.EM.save("enterprises", ents);
    var r = C.emsi(e.classification);
    SS.EM.log("Enterprise Classified", e.name, "EMSI " + r.score.toFixed(2) + " · " + r.category);
    showResult(r);
    SS.ui.toast("EMSI " + r.score.toFixed(2) + " - " + r.category + " category");
    SS.$("#result-card").scrollIntoView({ behavior: "smooth", block: "start" });
  });

  showCritSum();
  showResult(C.emsi(e.classification));
})();
