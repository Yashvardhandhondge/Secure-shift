/* =========================================================
   EMDT - admin-dashboard.js
   List of enterprises + Register New Enterprise.
   ========================================================= */
(function () {
  "use strict";
  if (!SS.session.current) return;

  var ents = SS.EM.load("enterprises");
  var apps = SS.EM.load("apps");

  function appCount(id) { return apps.filter(function (a) { return a.ent === id; }).length; }
  function rows() {
    return ents.map(function (e) {
      var r = SS.EMC.entEmsi(e);
      return { id: e.id, name: e.name, industry: e.industry, city: e.city, apps: appCount(e.id),
               emsi: r ? r.score : null, category: r ? r.category : "Not classified", plan: r ? r.plan : null };
    });
  }

  function renderKpis() {
    var classified = ents.filter(function (e) { return e.classification; }).length;
    var k = [["building", "Total Enterprises", ents.length], ["target", "Classified", classified],
             ["clock", "Pending Classification", ents.length - classified], ["grid", "Total Applications", apps.length]];
    SS.$("#kpis").innerHTML = k.map(function (x) {
      return '<div class="card stat"><div class="stat-icon">' + SS.icon(x[0]) + '</div><div><div class="stat-label">' + x[1] + '</div><div class="stat-value">' + x[2] + "</div></div></div>";
    }).join("");
    var r = rows();
    var cats = ["Foundation", "Growth", "Enterprise", "Strategic", "Not classified"].map(function (c) {
      return { label: c, value: r.filter(function (x) { return x.category === c; }).length };
    }).filter(function (x) { return x.value; });
    SS.ui.donut(SS.$("#cat-donut"), cats, "Enterprises");
  }

  var table = SS.ui.table({
    el: "#ent-table", rows: [], pageSize: 8, unit: "enterprises",
    onRowClick: function (r) { SS.go("modernization/enterprise.html?ent=" + r.id); },
    columns: [
      { label: "Enterprise", render: function (r) { return "<b>" + SS.esc(r.name) + '</b><div class="small muted">' + r.id + " · " + SS.esc(r.city) + "</div>"; } },
      { label: "Industry", key: "industry" },
      { label: "Apps", right: true, key: "apps" },
      { label: "EMSI", right: true, render: function (r) { return r.emsi === null ? '<span class="muted">-</span>' : "<b>" + r.emsi.toFixed(2) + "</b>"; } },
      { label: "Category", render: function (r) { return r.emsi === null ? '<span class="badge badge-soft">Pending</span>' : '<span class="badge">' + r.category + "</span>"; } },
      { label: "Plan / Month", render: function (r) { return r.plan ? "₹" + SS.fmt(r.plan.monthly) : "-"; } },
      { label: "Action", render: function (r) { return '<a class="btn btn-outline btn-sm" href="enterprise.html?ent=' + r.id + '">Open</a>'; } }
    ]
  });

  function apply() {
    var q = SS.$("#f-search").value.trim().toLowerCase(), c = SS.$("#f-cat").value;
    var list = rows().filter(function (r) {
      return (!q || (r.name + " " + r.id + " " + r.city).toLowerCase().indexOf(q) > -1) &&
             (!c || (c === "none" ? r.emsi === null : r.category === c));
    });
    SS.$("#ent-count").textContent = list.length + " of " + ents.length;
    table.update(list);
  }
  SS.$("#f-search").addEventListener("input", apply);
  SS.$("#f-cat").addEventListener("change", apply);

  /* ----- Register New Enterprise ----- */
  SS.$("#btn-register").addEventListener("click", function () {
    SS.ui.modal({
      title: "Register New Enterprise", wide: true,
      body: '<p class="small muted" style="margin-bottom:12px">Step 1 of onboarding. After registering, fill the Classification tab to calculate the EMSI and category.</p>' +
        '<div class="form-grid">' +
        '<div class="field full"><label>Enterprise Name <span class="req">*</span></label><input class="input" id="e-name" maxlength="100" placeholder="e.g. Tailspin Airlines"></div>' +
        '<div class="field"><label>Industry <span class="req">*</span></label><select class="select" id="e-industry"><option value="">Select industry</option><option>Banking</option><option>Insurance</option><option>Retail</option><option>Healthcare</option><option>Manufacturing</option><option>Telecom</option><option>Government</option><option>Other</option></select></div>' +
        '<div class="field"><label>Headquarters City <span class="req">*</span></label><input class="input" id="e-city" placeholder="e.g. Pune"></div>' +
        '<div class="field"><label>Contact Person <span class="req">*</span></label><input class="input" id="e-contact" placeholder="Full name"></div>' +
        '<div class="field"><label>Contact Email <span class="req">*</span></label><input class="input" id="e-email" placeholder="name@company.com"></div>' +
        '<div class="field"><label>Contact Phone <span class="req">*</span></label><input class="input" id="e-phone" placeholder="10 digit mobile"></div>' +
        "</div>",
      buttons: [{ label: "Cancel", cls: "btn-outline" }, { label: "Register Enterprise", id: "e-submit", onClick: function (close, root) {
        var ok = SS.ui.validate(root, [
          { id: "e-name", label: "Name", rule: function (v) {
            if (!/^[A-Za-z0-9][A-Za-z0-9 &.\-]{2,99}$/.test(v)) return "3-100 characters: letters, numbers, space, & . -";
            return ents.some(function (e) { return e.name.toLowerCase() === v.toLowerCase(); }) ? "This enterprise is already registered" : "";
          } },
          { id: "e-industry", label: "Industry", rule: function (v) { return v ? "" : "Select an industry"; } },
          { id: "e-city", label: "City", rule: function (v) { return SS.V.name(v) ? "" : "Letters only, 3-50 characters"; } },
          { id: "e-contact", label: "Contact", rule: function (v) { return SS.V.name(v) ? "" : "Letters only, 3-50 characters"; } },
          { id: "e-email", label: "Email", rule: function (v) { return SS.V.email(v) ? "" : "Enter a valid email"; } },
          { id: "e-phone", label: "Phone", rule: function (v) { return SS.V.phone(v) ? "" : "10 digits starting with 6, 7, 8 or 9"; } }
        ]);
        if (!ok) return false;
        var e = { id: SS.nextId(ents, "ENT-", 3), name: SS.$("#e-name", root).value.trim(), industry: SS.$("#e-industry", root).value,
                  city: SS.$("#e-city", root).value.trim(), contact: SS.$("#e-contact", root).value.trim(), email: SS.$("#e-email", root).value.trim(),
                  phone: SS.$("#e-phone", root).value.trim(), registered: SS.today(), classifiedOn: "", classification: null };
        ents.push(e);
        SS.EM.save("enterprises", ents);
        SS.EM.log("Enterprise Registered", e.name, e.id);
        SS.store.set("em.currentEnt", e.id);
        SS.ui.toast(e.name + " registered as " + e.id + ". Next: classification.");
        setTimeout(function () { SS.go("modernization/classification.html?ent=" + e.id); }, 700);
      } }]
    });
  });

  renderKpis();
  apply();
})();
