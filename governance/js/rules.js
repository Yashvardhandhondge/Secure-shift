/* =========================================================
   Governance - rules.js  (governance/rules.html)
   ========================================================= */
(function () {
  "use strict";
  if (!SS.session.current) return;

  var rules = SS.GOV.load("rules");

  function fill() {
    SS.$("#w-unused").value = rules.weights.unused;
    SS.$("#w-highRisk").value = rules.weights.highRisk;
    SS.$("#w-scope").value = rules.weights.scope;
    SS.$("#s-window").value = rules.window;
    SS.$("#s-rare").value = rules.rareThreshold;
    SS.$("#s-baseline").checked = rules.baselineRead;
    total();
    renderPatterns();
  }

  function total() {
    var t = ["#w-unused", "#w-highRisk", "#w-scope"].reduce(function (a, s) { return a + (Number(SS.$(s).value) || 0); }, 0);
    SS.$("#w-total").textContent = t + "%";
    SS.$("#w-total-badge").innerHTML = t === 100 ? '<span class="badge badge-solid">Valid</span>' : '<span class="badge badge-strong">Must be 100%</span>';
    return t;
  }
  ["#w-unused", "#w-highRisk", "#w-scope"].forEach(function (s) { SS.$(s).addEventListener("input", total); });

  function renderPatterns() {
    SS.$("#patterns").innerHTML = rules.patterns.map(function (p, i) {
      return '<div class="pattern-row"><label class="check"><input type="checkbox" data-toggle="' + i + '" ' + (p.on ? "checked" : "") +
             '> <span class="mono small">' + SS.esc(p.p) + '</span></label><button class="btn btn-ghost btn-sm" data-del="' + i + '" aria-label="Delete pattern">' + SS.icon("trash") + "</button></div>";
    }).join("") || '<p class="muted small">No patterns. Add one.</p>';
    SS.$$("[data-toggle]").forEach(function (c) {
      c.addEventListener("change", function () { rules.patterns[parseInt(c.getAttribute("data-toggle"), 10)].on = c.checked; });
    });
    SS.$$("[data-del]").forEach(function (b) {
      b.addEventListener("click", function () {
        var p = rules.patterns[parseInt(b.getAttribute("data-del"), 10)];
        SS.ui.confirm({ title: "Delete pattern?", message: "Remove <b class='mono'>" + SS.esc(p.p) + "</b>?", okLabel: "Delete",
          onOk: function () { rules.patterns.splice(rules.patterns.indexOf(p), 1); renderPatterns(); SS.ui.toast("Pattern removed (click Save Changes to keep it)"); } });
      });
    });
  }

  SS.$("#btn-add-pattern").addEventListener("click", function () {
    SS.ui.modal({
      title: "Add High-Risk Pattern",
      body: '<div class="field"><label>Pattern <span class="req">*</span></label><input class="input mono" id="new-pattern" placeholder="e.g. Microsoft.Sql/*/delete"></div>' +
            '<p class="small muted mt">Use * as a wildcard. Example: <span class="code-inline">Microsoft.Compute/*/delete</span></p>',
      buttons: [{ label: "Cancel", cls: "btn-outline" }, { label: "Add Pattern", id: "btn-confirm-pattern", onClick: function (close, root) {
        var ok = SS.ui.validate(root, [{ id: "new-pattern", label: "Pattern", rule: function (v) {
          if (!v) return "Pattern is required";
          if (!/^[\w.*\/-]+$/.test(v)) return "Only letters, numbers, . / * - are allowed";
          if (rules.patterns.some(function (p) { return p.p.toLowerCase() === v.toLowerCase(); })) return "This pattern already exists";
          return "";
        } }]);
        if (!ok) return false;
        rules.patterns.push({ p: SS.$("#new-pattern", root).value.trim(), on: true });
        renderPatterns();
        SS.ui.toast("Pattern added (click Save Changes to keep it)");
      } }]
    });
  });

  function collect() {
    rules.weights = { unused: Number(SS.$("#w-unused").value), highRisk: Number(SS.$("#w-highRisk").value), scope: Number(SS.$("#w-scope").value) };
    rules.window = SS.$("#s-window").value;
    rules.rareThreshold = Number(SS.$("#s-rare").value);
    rules.baselineRead = SS.$("#s-baseline").checked;
  }

  SS.$("#btn-save").addEventListener("click", function () {
    if (total() !== 100) { SS.ui.toast("Weights must add up to 100% before saving", "alert"); return; }
    var rare = Number(SS.$("#s-rare").value);
    if (!(rare >= 1 && rare <= 50)) { SS.ui.toast("Rare action threshold must be 1 to 50", "alert"); return; }
    collect();
    SS.GOV.save("rules", rules);
    SS.ui.toast("rules.json saved");
  });

  SS.$("#btn-reset").addEventListener("click", function () {
    SS.ui.confirm({ title: "Reset to default?", message: "All weights, patterns and settings will go back to the default values.", okLabel: "Reset",
      onOk: function () { rules = JSON.parse(JSON.stringify(SS.GOV.rules)); SS.GOV.save("rules", rules); fill(); SS.ui.toast("Rules reset to default"); } });
  });

  SS.$("#btn-view-json").addEventListener("click", function () {
    collect();
    var json = JSON.stringify(rules, null, 2);
    SS.ui.modal({ title: "rules.json (current values)", wide: true, body: '<pre class="code">' + SS.esc(json) + "</pre>",
      buttons: [{ label: "Close", cls: "btn-outline" }, { label: "Download", onClick: function () { SS.ui.download("rules.json", json); } }] });
  });

  fill();
})();
