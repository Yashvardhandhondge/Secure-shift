/* =========================================================
   EMDT - enterprise.js  (modernization/enterprise.html?ent=ENT-001)
   One enterprise: registration details, EMSI category, pricing.
   ========================================================= */
(function () {
  "use strict";
  if (!SS.session.current) return;

  var ents = SS.EM.load("enterprises");
  var id = SS.EM.entId();
  var e = ents.filter(function (x) { return x.id === id; })[0];
  var q = "?ent=" + e.id;
  ["#btn-classify", "#lnk-edit-class", "#go-apps", "#go-deps", "#go-twin"].forEach(function (s) {
    SS.$(s).setAttribute("href", SS.$(s).getAttribute("href").split("?")[0] + q);
  });

  function render() {
    var r = SS.EMC.entEmsi(e);
    var apps = SS.EM.load("apps").filter(function (a) { return a.ent === e.id; });
    var nodes = SS.EM.load("nodes").filter(function (n) { return n.ent === e.id; });
    var links = SS.EM.load("links").filter(function (l) { return l.ent === e.id; });

    SS.$("#crumb-name").textContent = e.name;
    SS.$("#e-title").textContent = e.name;
    SS.$("#classify-label").textContent = e.classification ? "Edit Details" : "Add Details";
    SS.$("#status-badge").innerHTML = e.classification ? '<span class="badge badge-solid">Classified</span>' : '<span class="badge badge-soft">Pending Classification</span>';

    var k = [["target", "EMSI Score", r ? r.score.toFixed(2) : "-"], ["layers", "Category", r ? r.category : "Pending"],
             ["grid", "Applications", apps.length], ["link", "Dependency Links", links.length + " (" + nodes.length + " components)"]];
    SS.$("#kpis").innerHTML = k.map(function (x) {
      return '<div class="card stat"><div class="stat-icon">' + SS.icon(x[0]) + '</div><div><div class="stat-label">' + x[1] + '</div><div class="stat-value" style="font-size:22px">' + x[2] + "</div></div></div>";
    }).join("");

    SS.$("#reg").innerHTML = "<dt>Enterprise ID</dt><dd>" + e.id + "</dd><dt>Name</dt><dd>" + SS.esc(e.name) + "</dd><dt>Industry</dt><dd>" + SS.esc(e.industry) +
      "</dd><dt>Headquarters</dt><dd>" + SS.esc(e.city) + "</dd><dt>Contact Person</dt><dd>" + SS.esc(e.contact) + "</dd><dt>Email</dt><dd>" + SS.esc(e.email) +
      "</dd><dt>Phone</dt><dd>" + SS.esc(e.phone) + "</dd><dt>Registered On</dt><dd>" + e.registered + "</dd><dt>Classified On</dt><dd>" + (e.classifiedOn || "-") + "</dd>";

    if (!r) {
      SS.$("#class-box").innerHTML = '<div class="center" style="padding:20px"><div class="modal-icon">' + SS.icon("target", "ic-lg") +
        '</div><b>Not classified yet</b><p class="small muted mt">Click <b>Add Details</b> to enter the portfolio details. EMSI, category and pricing are calculated automatically.</p>' +
        '<a class="btn mt" href="classification.html' + q + '" id="btn-classify-now">Add Classification Details</a></div>';
      SS.$("#inputs").innerHTML = '<p class="muted">No classification inputs yet.</p>';
      return;
    }
    SS.$("#class-box").innerHTML =
      '<div class="emsi-hero"><div class="emsi-ring" style="--p:' + r.score + '"><div><b>' + r.score.toFixed(2) + '</b><span class="small muted">EMSI / 100</span></div></div>' +
      '<div><div class="small muted">Category</div><div style="font-size:24px;font-weight:900">' + r.category + '</div><div class="small">Effort multiplier: <b>×' + r.multiplier.toFixed(2) + "</b></div>" +
      '<div class="cat-scale">' + SS.EMC.CATEGORIES.map(function (c) { return '<div class="' + (c.name === r.category ? "on" : "") + '"><b>' + c.name + "</b>" + c.min + "-" + Math.ceil(c.max) + "</div>"; }).join("") + "</div></div></div>" +
      '<div class="price mt"><div class="row-between"><b>' + r.plan.name + ' Subscription Plan</b><span class="badge">Annual saves 10%</span></div>' +
      '<div class="grid g-2 mt"><div><div class="small muted">Monthly</div><div class="amt">₹' + SS.fmt(r.plan.monthly) + '</div></div><div><div class="small muted">Annual</div><div class="amt">₹' + SS.fmt(r.plan.annual) + "</div></div></div></div>";
    SS.ui.table({ el: "#inputs", rows: r.rows, paging: false, columns: [
      { label: "Parameter", key: "label" }, { label: "Input", render: function (x) { return SS.esc(x.input); } },
      { label: "Score", right: true, render: function (x) { return x.score; } }, { label: "Weight", right: true, render: function (x) { return Math.round(x.weight * 100) + "%"; } },
      { label: "Weighted", right: true, render: function (x) { return "<b>" + x.weighted.toFixed(2) + "</b>"; } }
    ] });
  }

  SS.$("#btn-edit-info").addEventListener("click", function () {
    SS.ui.modal({
      title: "Edit Registration", wide: true,
      body: '<div class="form-grid">' +
        '<div class="field"><label>Headquarters City <span class="req">*</span></label><input class="input" id="x-city" value="' + SS.esc(e.city) + '"></div>' +
        '<div class="field"><label>Contact Person <span class="req">*</span></label><input class="input" id="x-contact" value="' + SS.esc(e.contact) + '"></div>' +
        '<div class="field"><label>Contact Email <span class="req">*</span></label><input class="input" id="x-email" value="' + SS.esc(e.email) + '"></div>' +
        '<div class="field"><label>Contact Phone <span class="req">*</span></label><input class="input" id="x-phone" value="' + SS.esc(e.phone) + '"></div></div>',
      buttons: [{ label: "Cancel", cls: "btn-outline" }, { label: "Save", id: "x-save", onClick: function (close, root) {
        var ok = SS.ui.validate(root, [
          { id: "x-city", label: "City", rule: function (v) { return SS.V.name(v) ? "" : "Letters only, 3-50 characters"; } },
          { id: "x-contact", label: "Contact", rule: function (v) { return SS.V.name(v) ? "" : "Letters only, 3-50 characters"; } },
          { id: "x-email", label: "Email", rule: function (v) { return SS.V.email(v) ? "" : "Enter a valid email"; } },
          { id: "x-phone", label: "Phone", rule: function (v) { return SS.V.phone(v) ? "" : "10 digits starting with 6-9"; } }
        ]);
        if (!ok) return false;
        e.city = SS.$("#x-city", root).value.trim(); e.contact = SS.$("#x-contact", root).value.trim();
        e.email = SS.$("#x-email", root).value.trim(); e.phone = SS.$("#x-phone", root).value.trim();
        SS.EM.save("enterprises", ents);
        SS.EM.log("Enterprise Updated", e.name, e.id);
        render();
        SS.ui.toast("Registration details saved");
      } }]
    });
  });

  render();
})();
