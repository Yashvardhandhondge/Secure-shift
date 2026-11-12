/* =========================================================
   Governance - companies.js  (governance/companies.html)
   ========================================================= */
(function () {
  "use strict";
  if (!SS.session.current) return;

  var companies = SS.GOV.load("companies");
  var selected = companies[0].name;

  var table = SS.ui.table({
    el: "#c-table", rows: companies, pageSize: 10, unit: "companies",
    rowClass: function (r) { return r.name === selected ? "selected" : ""; },
    onRowClick: function (r) { selected = r.name; table.refresh(); },
    columns: [
      { label: "Company", render: function (r) { return "<b>" + SS.esc(r.name) + "</b>"; } },
      { label: "Identities", right: true, key: "identities" },
      { label: "Avg Score", render: function (r) { return SS.ui.scorebar(r.avg); } },
      { label: "High-Risk Unused", right: true, key: "highRisk" },
      { label: "Last Analysis", key: "last" },
      { label: "Risk Level", render: function (r) { return r.last === "Not analysed" ? SS.ui.badge("PENDING") : SS.ui.badge(SS.GOV.riskBand(r.avg)); } },
      { label: "Action", render: function (r) { return '<button class="btn btn-outline btn-sm" data-open="' + SS.esc(r.name) + '">Open</button>'; } }
    ],
    afterRender: function (el) {
      SS.$$("[data-open]", el).forEach(function (b) {
        b.addEventListener("click", function () { openCompany(b.getAttribute("data-open")); });
      });
    }
  });

  function sub() { SS.$("#c-sub").textContent = companies.length + " companies analysed in this workspace"; }

  function openCompany(name) {
    selected = name; table.refresh();
    var c = companies.filter(function (x) { return x.name === name; })[0];
    SS.ui.modal({
      title: c.name, wide: true,
      body: '<div class="grid g-3">' +
        '<div class="card stat"><div><div class="stat-label">Identities</div><div class="stat-value">' + c.identities + "</div></div></div>" +
        '<div class="card stat"><div><div class="stat-label">Average Score</div><div class="stat-value">' + c.avg + "</div></div></div>" +
        '<div class="card stat"><div><div class="stat-label">High-Risk Unused</div><div class="stat-value">' + c.highRisk + "</div></div></div></div>" +
        '<dl class="kv mt-lg"><dt>Last analysis</dt><dd>' + c.last + "</dd><dt>Risk level</dt><dd>" + SS.ui.badge(SS.GOV.riskBand(c.avg)) + "</dd></dl>",
      buttons: [
        { label: "Close", cls: "btn-outline" },
        { label: "Run New Analysis", onClick: function () { SS.go("governance/analysis.html"); } },
        { label: "View Identities", id: "btn-company-identities", onClick: function () { SS.go("governance/identities.html"); } }
      ]
    });
  }

  function apply() {
    var q = SS.$("#f-search").value.trim().toLowerCase(), g = SS.$("#f-risk").value;
    table.update(companies.filter(function (c) { return (!q || c.name.toLowerCase().indexOf(q) > -1) && (!g || (c.last !== "Not analysed" && SS.GOV.riskBand(c.avg) === g)); }));
  }
  SS.$("#f-search").addEventListener("input", apply);
  SS.$("#f-risk").addEventListener("change", apply);

  SS.$("#btn-add").addEventListener("click", function () {
    SS.ui.modal({
      title: "Add Company Data",
      body: '<div class="form-grid">' +
        '<div class="field full"><label>Company Name <span class="req">*</span></label><input class="input" id="n-name" placeholder="e.g. Blue Yonder Retail"></div>' +
        '<div class="field"><label>Azure Tenant ID <span class="req">*</span></label><input class="input mono" id="n-tenant" placeholder="xxxxxxxx-xxxx-..."></div>' +
        '<div class="field"><label>Subscriptions <span class="req">*</span></label><input class="input" type="number" id="n-subs" value="1" min="1"></div>' +
        "</div><p class='small muted mt'>After adding, run the Analysis Wizard to upload this company's files.</p>",
      buttons: [{ label: "Cancel", cls: "btn-outline" }, { label: "Add Company", id: "btn-confirm-company", onClick: function (close, root) {
        var ok = SS.ui.validate(root, [
          { id: "n-name", label: "Company name", rule: function (v) {
            if (v.length < 3) return "Enter at least 3 characters";
            return companies.some(function (c) { return c.name.toLowerCase() === v.toLowerCase(); }) ? "This company already exists" : ""; } },
          { id: "n-tenant", label: "Tenant ID", rule: function (v) { return v.length >= 8 ? "" : "Enter a valid tenant ID"; } },
          { id: "n-subs", label: "Subscriptions", rule: function (v) { return Number(v) >= 1 ? "" : "At least 1"; } }
        ]);
        if (!ok) return false;
        var name = SS.$("#n-name", root).value.trim();
        companies.unshift({ name: name, identities: 0, avg: 0, highRisk: 0, last: "Not analysed" });
        SS.GOV.save("companies", companies);
        selected = name;
        apply(); sub();
        SS.ui.toast(name + " added. Run the Analysis Wizard next.");
      } }]
    });
  });

  sub();
})();
