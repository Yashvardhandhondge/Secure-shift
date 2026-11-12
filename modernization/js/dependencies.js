/* =========================================================
   EMDT - dependencies.js  (modernization/dependencies.html?ent=...)
   Components (Service/Database/API) + dependency links + scores.
   ========================================================= */
(function () {
  "use strict";
  if (!SS.session.current) return;

  var C = SS.EMC;
  var entId = SS.EM.entId();
  var ent = SS.EM.ent(entId);
  var allNodes = SS.EM.load("nodes");
  var allLinks = SS.EM.load("links");
  var apps = SS.EM.load("apps").filter(function (a) { return a.ent === entId; });

  SS.EM.entPicker(SS.$("#ent-picker"));
  SS.$("#crumb-ent").textContent = ent.name;
  SS.$("#crumb-ent").setAttribute("href", "enterprise.html?ent=" + entId);
  SS.$("#f-node-app").innerHTML += apps.map(function (a) { return '<option value="' + a.id + '">' + SS.esc(a.name) + "</option>"; }).join("");

  function nodes() { return allNodes.filter(function (n) { return n.ent === entId; }); }
  function links() { return allLinks.filter(function (l) { return l.ent === entId; }); }
  function appName(id) { var a = apps.filter(function (x) { return x.id === id; })[0]; return a ? a.name : id; }
  function label(id) {
    var n = C.node(id);
    if (!n) return SS.esc(id);
    return "<b>" + SS.esc(n.name) + '</b><div class="small muted">' + n.type + (n.type === "Application" ? "" : " · " + SS.esc(appName(n.app))) + "</div>";
  }
  /* every application + every component can be a source or target */
  function options(selected) {
    var out = "";
    apps.forEach(function (a) {
      out += '<optgroup label="' + SS.esc(a.name) + '">';
      out += '<option value="' + a.id + '"' + (selected === a.id ? " selected" : "") + ">" + SS.esc(a.name) + " (Application)</option>";
      nodes().filter(function (n) { return n.app === a.id; }).forEach(function (n) {
        out += '<option value="' + n.id + '"' + (selected === n.id ? " selected" : "") + ">" + SS.esc(n.name) + " (" + n.type + ")</option>";
      });
      out += "</optgroup>";
    });
    return out;
  }
  function save() { SS.EM.save("nodes", allNodes); SS.EM.save("links", allLinks); renderAll(); }

  function renderKpis() {
    var n = nodes(), l = links();
    var k = [["grid", "Applications", apps.length], ["layers", "Components", n.length + " (" + n.filter(function (x) { return x.type === "Service"; }).length + " svc / " +
      n.filter(function (x) { return x.type === "Database"; }).length + " db / " + n.filter(function (x) { return x.type === "API"; }).length + " api)"],
      ["link", "Dependency Links", l.length], ["alert", "Critical Links", l.filter(function (x) { return x.criticality === "Critical"; }).length]];
    SS.$("#kpis").innerHTML = k.map(function (x) {
      return '<div class="card stat"><div class="stat-icon">' + SS.icon(x[0]) + '</div><div><div class="stat-label">' + x[1] + '</div><div class="stat-value" style="font-size:' + (String(x[2]).length > 6 ? 16 : 26) + 'px">' + x[2] + "</div></div></div>";
    }).join("");
  }

  var nodeTable = SS.ui.table({ el: "#node-table", rows: [], pageSize: 8, unit: "components", columns: [
    { label: "Component", render: function (r) { return "<b>" + SS.esc(r.name) + '</b><div class="small muted">' + r.id + "</div>"; } },
    { label: "Type", render: function (r) { return '<span class="badge">' + r.type + "</span>"; } },
    { label: "Application", render: function (r) { return SS.esc(appName(r.app)); } },
    { label: "", render: function (r) { return '<button class="btn btn-ghost btn-sm" data-del-node="' + r.id + '" aria-label="Delete component">' + SS.icon("trash") + "</button>"; } }
  ], afterRender: function (el) {
    SS.$$("[data-del-node]", el).forEach(function (b) {
      b.addEventListener("click", function () {
        var id = b.getAttribute("data-del-node");
        var used = allLinks.filter(function (l) { return l.source === id || l.target === id; }).length;
        if (used) { SS.ui.toast("Remove the " + used + " link(s) using this component first", "alert"); return; }
        var n = allNodes.filter(function (x) { return x.id === id; })[0];
        SS.ui.confirm({ title: "Delete component?", message: "Delete <b>" + SS.esc(n.name) + "</b>?", okLabel: "Delete",
          onOk: function () { allNodes.splice(allNodes.indexOf(n), 1); SS.EM.log("Component Deleted", n.name, n.type); save(); SS.ui.toast("Component deleted"); } });
      });
    });
  } });

  var linkTable = SS.ui.table({ el: "#link-table", rows: [], pageSize: 8, unit: "links", columns: [
    { label: "ID", render: function (r) { return '<span class="mono small">' + r.id + "</span>"; } },
    { label: "Source", render: function (r) { return label(r.source); } },
    { label: "Target", render: function (r) { return label(r.target); } },
    { label: "Type", render: function (r) { return C.linkType(r); } },
    { label: "Criticality", render: function (r) { return SS.ui.badge(r.criticality); } },
    { label: "Points", right: true, render: function (r) { return '<span class="small muted">' + C.TYPE_WEIGHT[C.linkType(r)] + "×" + C.CRIT_POINTS[r.criticality] + "</span> <b>" + C.linkPoints(r) + "</b>"; } },
    { label: "Actions", render: function (r) {
      return '<span class="row" style="gap:2px"><button class="btn btn-ghost btn-sm" data-edit-link="' + r.id + '" aria-label="Edit">' + SS.icon("edit") + "</button>" +
             '<button class="btn btn-ghost btn-sm" data-del-link="' + r.id + '" aria-label="Delete">' + SS.icon("trash") + "</button></span>"; } }
  ], afterRender: function (el) {
    SS.$$("[data-edit-link]", el).forEach(function (b) { b.addEventListener("click", function () { linkForm(findLink(b.getAttribute("data-edit-link"))); }); });
    SS.$$("[data-del-link]", el).forEach(function (b) {
      b.addEventListener("click", function () {
        var l = findLink(b.getAttribute("data-del-link"));
        SS.ui.confirm({ title: "Delete dependency?", message: "Remove link <b>" + l.id + "</b>?", okLabel: "Delete",
          onOk: function () { allLinks.splice(allLinks.indexOf(l), 1); SS.EM.log("Dependency Deleted", l.id, ""); save(); SS.ui.toast("Dependency deleted"); } });
      });
    });
  } });

  function findLink(id) { return allLinks.filter(function (l) { return l.id === id; })[0]; }

  function renderResults() {
    var rows = apps.map(function (a) { var d = C.depImpact(a.id); return { id: a.id, name: a.name, count: d.count, raw: d.raw, di: d.score }; })
      .sort(function (x, y) { return y.raw - x.raw; });
    SS.ui.table({ el: "#result-table", rows: rows, paging: false, empty: "Register applications first.", columns: [
      { label: "Application", render: function (r) { return "<b>" + SS.esc(r.name) + '</b><div class="small muted">' + r.id + "</div>"; } },
      { label: "Outgoing Links", right: true, key: "count" },
      { label: "Raw Points", right: true, render: function (r) { return "<b>" + r.raw + "</b>"; } },
      { label: "Dependency Impact", render: function (r) { return SS.ui.scorebar(r.di); } },
      { label: "Level", render: function (r) { return SS.ui.badge(C.level(r.di)); } }
    ] });
  }

  function apply() {
    var a = SS.$("#f-node-app").value;
    nodeTable.update(nodes().filter(function (n) { return !a || n.app === a; }), true);
    var q = SS.$("#f-search").value.trim().toLowerCase(), t = SS.$("#f-type").value, c = SS.$("#f-crit").value;
    linkTable.update(links().filter(function (l) {
      var s = C.node(l.source), g = C.node(l.target);
      var text = ((s ? s.name : "") + " " + (g ? g.name : "") + " " + l.desc + " " + l.id).toLowerCase();
      return (!q || text.indexOf(q) > -1) && (!t || C.linkType(l) === t) && (!c || l.criticality === c);
    }), true);
  }
  function renderAll() { renderKpis(); apply(); renderResults(); }

  SS.$("#f-node-app").addEventListener("change", apply);
  SS.$("#f-search").addEventListener("input", apply);
  SS.$("#f-type").addEventListener("change", apply);
  SS.$("#f-crit").addEventListener("change", apply);

  /* ----- Add component ----- */
  SS.$("#btn-add-node").addEventListener("click", function () {
    if (!apps.length) { SS.ui.toast("Register an application first (Application Inventory)", "alert"); return; }
    SS.ui.modal({
      title: "Add Component",
      body: '<div class="form-grid">' +
        '<div class="field"><label>Type <span class="req">*</span></label><select class="select" id="n-type"><option value="">Select type</option><option>Service</option><option>Database</option><option>API</option></select></div>' +
        '<div class="field"><label>Parent Application <span class="req">*</span></label><select class="select" id="n-app"><option value="">Select application</option>' +
          apps.map(function (a) { return '<option value="' + a.id + '">' + SS.esc(a.name) + "</option>"; }).join("") + "</select></div>" +
        '<div class="field full"><label>Component Name <span class="req">*</span></label><input class="input" id="n-name" maxlength="60" placeholder="e.g. Customer Profile Service"></div></div>',
      buttons: [{ label: "Cancel", cls: "btn-outline" }, { label: "Add Component", id: "n-submit", onClick: function (close, root) {
        var ok = SS.ui.validate(root, [
          { id: "n-type", rule: function (v) { return v ? "" : "Select a type"; } },
          { id: "n-app", rule: function (v) { return v ? "" : "Select the parent application"; } },
          { id: "n-name", rule: function (v) {
            if (!/^[A-Za-z0-9][A-Za-z0-9 ._\-]{2,59}$/.test(v)) return "3-60 characters: letters, numbers, space . _ -";
            return nodes().some(function (n) { return n.name.toLowerCase() === v.toLowerCase(); }) ? "A component with this name already exists" : "";
          } }
        ]);
        if (!ok) return false;
        var n = { id: SS.nextId(allNodes, "N-", 2), ent: entId, type: SS.$("#n-type", root).value, name: SS.$("#n-name", root).value.trim(), app: SS.$("#n-app", root).value };
        allNodes.push(n);
        SS.EM.log("Component Added", n.name, n.type + " · " + appName(n.app));
        save();
        SS.ui.toast(n.type + " " + n.name + " added");
      } }]
    });
  });

  /* ----- Add / edit dependency link ----- */
  function linkForm(l) {
    var isEdit = !!l;
    SS.ui.modal({
      title: isEdit ? "Edit Dependency " + l.id : "Add Dependency", wide: true,
      body: '<div class="form-grid">' +
        '<div class="field"><label>Source (depends on something) <span class="req">*</span></label><select class="select" id="l-source"><option value="">Select source</option>' + options(l ? l.source : "") + "</select></div>" +
        '<div class="field"><label>Target (is depended upon) <span class="req">*</span></label><select class="select" id="l-target"><option value="">Select target</option>' + options(l ? l.target : "") + "</select></div>" +
        '<div class="field"><label>Dependency Type</label><input class="input" id="l-type" disabled placeholder="Set from the target"></div>' +
        '<div class="field"><label>Criticality <span class="req">*</span></label><div class="radio-row" id="l-crit">' +
          ["Low", "Medium", "High", "Critical"].map(function (c) { return '<label class="check"><input type="radio" name="lcrit" value="' + c + '"' + (l && l.criticality === c ? " checked" : "") + "> " + c + "</label>"; }).join("") + "</div></div>" +
        '<div class="field full"><label>Description <span class="muted" style="font-weight:400">(optional, max 500)</span></label><textarea class="textarea" id="l-desc" maxlength="500">' + SS.esc(l ? l.desc : "") + "</textarea></div>" +
        '<div class="full small muted" id="l-points"></div></div>',
      buttons: [{ label: "Cancel", cls: "btn-outline" }, { label: isEdit ? "Update Dependency" : "Save Dependency", id: "l-submit", onClick: function (close, root) {
        var src = SS.$("#l-source", root).value, tgt = SS.$("#l-target", root).value;
        var crit = SS.$('input[name="lcrit"]:checked', root);
        var ok = SS.ui.validate(root, [
          { id: "l-source", rule: function (v) { return v ? "" : "Source is required"; } },
          { id: "l-target", rule: function (v) {
            if (!v) return "Target is required";
            if (v === src) return "Source and target cannot be the same";
            if (src && C.ownerApp(src) === v) return "A component cannot depend on its own parent application";
            return allLinks.some(function (x) { return x !== l && x.source === src && x.target === v; }) ? "This link already exists" : "";
          } },
          { id: "l-crit", rule: function () { return crit ? "" : "Criticality is required"; } },
          { id: "l-desc", rule: function (v) { return v.length <= 500 ? "" : "Max 500 characters"; } }
        ]);
        if (!ok) return false;
        var data = { source: src, target: tgt, criticality: crit.value, desc: SS.$("#l-desc", root).value.trim() };
        if (isEdit) { Object.assign(l, data); SS.EM.log("Dependency Updated", l.id, ""); SS.ui.toast("Dependency " + l.id + " updated"); }
        else {
          data.id = SS.nextId(allLinks, "DEP-", 3); data.ent = entId;
          allLinks.push(data);
          SS.EM.log("Dependency Added", C.node(src).name + " → " + C.node(tgt).name, C.linkType(data));
          SS.ui.toast("Dependency " + data.id + " saved (" + C.linkPoints(data) + " points)");
        }
        save();
      } }]
    });
    function preview() {
      var tgt = SS.$("#l-target").value, crit = SS.$('input[name="lcrit"]:checked');
      var t = tgt ? C.node(tgt).type : "";
      SS.$("#l-type").value = t;
      SS.$("#l-points").innerHTML = t && crit ? "Points for this link: <b>" + C.TYPE_WEIGHT[t] + " × " + C.CRIT_POINTS[crit.value] + " = " + C.TYPE_WEIGHT[t] * C.CRIT_POINTS[crit.value] + "</b>" : "";
    }
    SS.$("#l-target").addEventListener("change", preview);
    SS.$$('input[name="lcrit"]').forEach(function (r) { r.addEventListener("change", preview); });
    preview();
  }
  SS.$("#btn-add-link").addEventListener("click", function () {
    if (!apps.length) { SS.ui.toast("Register an application first (Application Inventory)", "alert"); return; }
    linkForm(null);
  });

  renderAll();
})();
