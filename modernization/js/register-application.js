/* =========================================================
   EMDT - register-application.js
   register-application.html          -> register in current enterprise
   register-application.html?id=APP-1 -> edit existing application
   ========================================================= */
(function () {
  "use strict";
  if (!SS.session.current) return;

  var apps = SS.EM.load("apps");
  var editId = SS.param("id");
  var app = editId ? apps.filter(function (a) { return a.id === editId; })[0] : null;
  var entId = app ? app.ent : SS.EM.entId();
  var ent = SS.EM.ent(entId);
  SS.$("#ent-label").textContent = "Enterprise: " + ent.name;

  var RADIOS = { support: ["Supported", "Extended", "Unsupported"], doc: ["Good", "Average", "Poor"], complexity: ["Low", "Medium", "High"],
                 crit: ["Low", "Medium", "High", "Critical"], sensitive: ["Yes", "No"], downtime: ["Low", "Medium", "High"] };
  SS.$$("[data-radio]").forEach(function (box) {
    var n = box.getAttribute("data-radio");
    box.innerHTML = RADIOS[n].map(function (v) { return '<label class="check"><input type="radio" name="' + n + '" value="' + v + '"> ' + v + "</label>"; }).join("");
  });
  function radio(n) { var r = SS.$('input[name="' + n + '"]:checked'); return r ? r.value : ""; }
  function setRadio(n, v) { var r = SS.$('input[name="' + n + '"][value="' + v + '"]'); if (r) r.checked = true; }

  if (app) {
    SS.$("#page-title").textContent = "Edit Application";
    SS.$("#page-sub").textContent = "Update application information to keep the inventory accurate.";
    SS.$("#crumb-last").textContent = app.name + " / Edit";
    SS.$("#save-label").textContent = "Update Application";
    SS.$("#form-head").textContent = "Application Details - " + app.id;
    SS.$("#a-name").value = app.name; SS.$("#a-unit").value = app.unit || ""; SS.$("#a-owner").value = app.owner || "";
    SS.$("#a-status").value = app.status; SS.$("#a-deployment").value = app.deployment; SS.$("#a-tech").value = app.tech;
    SS.$("#a-framework").value = app.framework; SS.$("#a-age").value = app.age; SS.$("#a-loc").value = app.loc;
    SS.$("#a-security").value = app.securityIssues; SS.$("#a-compliance").value = app.compliance;
    setRadio("support", app.support); setRadio("doc", app.docQuality); setRadio("complexity", app.complexity);
    setRadio("crit", app.criticality); setRadio("sensitive", app.sensitive); setRadio("downtime", app.downtime);
  }

  var textRule = function (min, max) {
    return function (v) { return v.length >= min && v.length <= max && /^[A-Za-z0-9][A-Za-z0-9 &.\-]*$/.test(v) ? "" : min + "-" + max + " characters: letters, numbers, space & . -"; };
  };
  function validate() {
    var form = SS.$("#app-form");
    var ok = SS.ui.validate(form, [
      { id: "a-name", rule: function (v) {
        var e = textRule(3, 60)(v); if (e) return e;
        return apps.some(function (a) { return a.ent === entId && a !== app && a.name.toLowerCase() === v.toLowerCase(); }) ? "This application already exists in " + ent.name : "";
      } },
      { id: "a-unit", rule: textRule(2, 50) }, { id: "a-owner", rule: textRule(2, 50) },
      { id: "a-status", rule: function (v) { return v ? "" : "Select a status"; } },
      { id: "a-deployment", rule: function (v) { return v ? "" : "Select a deployment type"; } },
      { id: "a-tech", rule: function (v) { return v ? "" : "Select a technology"; } },
      { id: "a-framework", rule: function (v) { return /^[A-Za-z.#+ ]{2,}[0-9]+(\.[0-9]+)*$/.test(v) ? "" : "Name + version number, e.g. Java 8 or .NET 6"; } },
      { id: "a-support", rule: function () { return radio("support") ? "" : "Choose one"; } },
      { id: "a-age", rule: function (v) { return SS.V.int(v, 0, 60) ? "" : "Whole number from 0 to 60"; } },
      { id: "a-doc", rule: function () { return radio("doc") ? "" : "Choose one"; } },
      { id: "a-complexity", rule: function () { return radio("complexity") ? "" : "Choose one"; } },
      { id: "a-loc", rule: function (v) { return SS.V.int(v, 100, 1000000000) ? "" : "Whole number, at least 100"; } },
      { id: "a-crit", rule: function () { return radio("crit") ? "" : "Choose one"; } },
      { id: "a-sensitive", rule: function () { return radio("sensitive") ? "" : "Choose one"; } },
      { id: "a-security", rule: function (v) { return SS.V.int(v, 0, 999) ? "" : "Whole number from 0 to 999"; } },
      { id: "a-downtime", rule: function () { return radio("downtime") ? "" : "Choose one"; } },
      { id: "a-compliance", rule: function (v) { return SS.V.int(v, 0, 10) ? "" : "Whole number from 0 to 10"; } }
    ]);
    if (!ok) {
      var first = SS.$(".invalid", form) || SS.$(".error-text", form);
      if (first) first.scrollIntoView({ behavior: "smooth", block: "center" });
      SS.ui.toast("Please fix the highlighted fields", "alert");
    }
    return ok;
  }

  function collect() {
    return {
      ent: entId, name: SS.$("#a-name").value.trim(), unit: SS.$("#a-unit").value.trim(), owner: SS.$("#a-owner").value.trim(),
      status: SS.$("#a-status").value, deployment: SS.$("#a-deployment").value, tech: SS.$("#a-tech").value, framework: SS.$("#a-framework").value.trim(),
      support: radio("support"), age: Number(SS.$("#a-age").value), docQuality: radio("doc"), complexity: radio("complexity"), loc: Number(SS.$("#a-loc").value),
      criticality: radio("crit"), sensitive: radio("sensitive"), securityIssues: Number(SS.$("#a-security").value), downtime: radio("downtime"),
      compliance: Number(SS.$("#a-compliance").value)
    };
  }

  function save(next) {
    if (!validate()) return;
    var data = collect();
    if (app) {
      SS.ui.confirm({ title: "Confirm Update", icon: "info", message: "Update <b>" + SS.esc(app.name) + "</b>?",
        note: "Existing assessments keep their old scores. Re-assess the application to use the new values.", okLabel: "Yes, Update",
        onOk: function () {
          Object.assign(app, data);
          SS.EM.save("apps", apps);
          SS.EM.log("Application Updated", data.name, app.id);
          SS.ui.toast(data.name + " updated");
          setTimeout(function () { SS.go(next || "modernization/applications.html?ent=" + entId); }, 600);
        } });
      return;
    }
    data.id = SS.nextId(apps, "APP-", 3);
    apps.push(data);
    SS.EM.save("apps", apps);
    SS.EM.log("Application Registered", data.name, data.id + " · " + ent.name);
    SS.ui.toast(data.name + " registered as " + data.id);
    setTimeout(function () { SS.go(next || "modernization/applications.html?ent=" + entId); }, 600);
  }

  SS.$("#app-form").addEventListener("submit", function (e) { e.preventDefault(); save(null); });
  SS.$("#btn-save-continue").addEventListener("click", function () { save("modernization/dependencies.html?ent=" + entId); });
})();
