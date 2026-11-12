/* =========================================================
   EMDT - digital-twin.js  (modernization/digital-twin.html?ent=...)
   Interactive SVG graph built from the enterprise data:
   nodes = applications + their components, edges = dependency links.
   ========================================================= */
(function () {
  "use strict";
  var s = SS.session.current;
  if (!s) return;

  var C = SS.EMC;
  var entId = SS.EM.entId();
  SS.$("#crumb-home").setAttribute("href", SS.root() + s.home);
  SS.EM.entPicker(SS.$("#ent-picker"));

  var apps = SS.EM.load("apps").filter(function (a) { return a.ent === entId; });
  var comps = SS.EM.load("nodes").filter(function (n) { return n.ent === entId; });
  var links = SS.EM.load("links").filter(function (l) { return l.ent === entId; });
  var W = 160, H = 44, COL = 200, ROW = 78;
  var showLabels = true, selected = null;

  SS.$("#f-app").innerHTML += apps.map(function (a) { return '<option value="' + a.id + '">' + SS.esc(a.name) + "</option>"; }).join("");

  /* ----- layout: one column per application ----- */
  var nodes = [];
  function layout() {
    nodes = [];
    apps.forEach(function (a, col) {
      nodes.push({ id: a.id, type: "Application", name: a.name, app: a.id, x: 20 + col * COL, y: 20, crit: a.criticality });
      comps.filter(function (n) { return n.app === a.id; }).forEach(function (n, row) {
        nodes.push({ id: n.id, type: n.type, name: n.name, app: a.id, x: 20 + col * COL, y: 20 + (row + 1) * ROW + 20, crit: a.criticality });
      });
    });
  }
  layout();
  var VW = Math.max(860, 40 + apps.length * COL);
  var VH = Math.max(380, 60 + (1 + Math.max.apply(null, [0].concat(apps.map(function (a) { return comps.filter(function (n) { return n.app === a.id; }).length; })))) * ROW + 20);

  function node(id) { return nodes.filter(function (n) { return n.id === id; })[0]; }
  function center(n) { return { x: n.x + W / 2, y: n.y + H / 2 }; }
  function appName(id) { var a = apps.filter(function (x) { return x.id === id; })[0]; return a ? a.name : id; }

  function visibleNode(n) {
    var t = SS.$("#f-type").value, a = SS.$("#f-app").value, q = SS.$("#f-search").value.trim().toLowerCase();
    return (!t || n.type === t) && (!a || n.app === a) && (!q || n.name.toLowerCase().indexOf(q) > -1);
  }
  function visibleLink(l) { var c = SS.$("#f-crit").value; return !c || l.criticality === c; }

  function shape(n) {
    if (n.type === "API") return '<rect width="' + W + '" height="' + H + '" rx="22" style="fill:#fdf2f8;stroke:#db2777"/>';
    if (n.type === "Database") return '<rect width="' + W + '" height="' + H + '" rx="6" style="fill:#fffbeb;stroke:#d97706"/>';
    if (n.type === "Service") return '<rect width="' + W + '" height="' + H + '" rx="8" style="fill:#eff6ff;stroke:#2563eb;stroke-dasharray:5 3"/>';
    return '<rect width="' + W + '" height="' + H + '" rx="8" style="fill:var(--accent);stroke:var(--accent-dark)"/>';
  }

  function render() {
    var connected = {};
    if (selected) {
      connected[selected] = true;
      links.forEach(function (l) { if (l.source === selected) connected[l.target] = true; if (l.target === selected) connected[l.source] = true; });
    }
    var svg = '<svg viewBox="0 0 ' + VW + " " + VH + '" id="twin-svg" style="min-width:' + Math.min(VW, 900) + 'px"><defs><marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#64748b"/></marker></defs>';
    links.forEach(function (l) {
      var a = node(l.source), b = node(l.target);
      if (!a || !b) return;
      var hide = !visibleNode(a) || !visibleNode(b) || !visibleLink(l);
      var hl = selected && (l.source === selected || l.target === selected);
      var p1 = center(a), p2 = center(b);
      var dx = p2.x - p1.x, dy = p2.y - p1.y, len = Math.sqrt(dx * dx + dy * dy) || 1;
      var off = Math.abs(dy / len) > 0.3 ? H / 2 + 3 : W / 2 + 3;
      var ex = p2.x - (dx / len) * off, ey = p2.y - (dy / len) * off;
      var w = { Low: 1.2, Medium: 1.8, High: 2.4, Critical: 3.2 }[l.criticality];
      svg += '<line class="g-edge ' + (hl ? "hl" : "") + (hide || (selected && !hl) ? " dim" : "") + '" style="stroke-width:' + (hl ? w + 1 : w) + '" x1="' + p1.x + '" y1="' + p1.y + '" x2="' + ex + '" y2="' + ey + '" marker-end="url(#arr)"/>';
      if (showLabels && !hide) svg += '<text class="g-label" x="' + ((p1.x + ex) / 2 + 4) + '" y="' + ((p1.y + ey) / 2 - 4) + '">' + l.criticality + "</text>";
    });
    nodes.forEach(function (n) {
      var dim = !visibleNode(n) || (selected && !connected[n.id]);
      var dark = n.type === "Application";
      svg += '<g class="g-node ' + (n.id === selected ? "active" : "") + (dim ? " dim" : "") + '" data-node="' + n.id + '" transform="translate(' + n.x + "," + n.y + ')">' + shape(n) +
             '<text x="' + W / 2 + '" y="19" text-anchor="middle"' + (dark ? ' style="fill:#fff"' : "") + ">" + SS.esc(n.name.length > 22 ? n.name.slice(0, 21) + "…" : n.name) + "</text>" +
             '<text class="t-type" x="' + W / 2 + '" y="34" text-anchor="middle"' + (dark ? ' style="fill:#ccfbf1"' : "") + ">" + n.type + "</text></g>";
    });
    if (!nodes.length) svg += '<text x="40" y="60" class="g-label" style="font-size:14px">No applications registered for this enterprise yet.</text>';
    svg += "</svg>";
    SS.$("#graph").innerHTML = svg;
    bind();
    detail();
  }

  function detail() {
    var box = SS.$("#detail");
    if (!selected) {
      var c = { Application: 0, Service: 0, Database: 0, API: 0 };
      nodes.forEach(function (n) { c[n.type]++; });
      box.innerHTML = "<h2>Landscape Summary</h2><p class='small muted'>Select a node to see its details.</p><dl class='kv mt' style='grid-template-columns:120px 1fr'>" +
        Object.keys(c).map(function (k) { return "<dt>" + k + "s</dt><dd>" + c[k] + "</dd>"; }).join("") + "<dt>Links</dt><dd>" + links.length + "</dd></dl>";
      return;
    }
    var n = node(selected);
    var out = links.filter(function (l) { return l.source === n.id; });
    var inc = links.filter(function (l) { return l.target === n.id; });
    var extra = "";
    if (n.type === "Application") {
      var di = C.depImpact(n.id);
      extra = "<dt>Dependency Impact</dt><dd>" + di.score + " (" + di.raw + " raw points)</dd><dt>Business Criticality</dt><dd>" + SS.ui.badge(n.crit) + "</dd>";
    }
    box.innerHTML = '<div class="row-between"><h2>' + SS.esc(n.name) + '</h2><button class="modal-close" id="btn-close-detail" aria-label="Close">' + SS.icon("x") + "</button></div>" +
      '<dl class="kv mt" style="grid-template-columns:130px 1fr"><dt>Type</dt><dd>' + n.type + "</dd><dt>Application</dt><dd>" + SS.esc(appName(n.app)) + "</dd>" + extra + "</dl>" +
      '<h3 class="mt">Direct Links</h3><div class="table-wrap mt"><table class="table"><thead><tr><th>Name</th><th>Direction</th><th>Criticality</th></tr></thead><tbody>' +
      out.map(function (l) { return "<tr><td>" + SS.esc(node(l.target).name) + "</td><td>Depends on</td><td>" + SS.ui.badge(l.criticality) + "</td></tr>"; }).join("") +
      inc.map(function (l) { return "<tr><td>" + SS.esc(node(l.source).name) + "</td><td>Used by</td><td>" + SS.ui.badge(l.criticality) + "</td></tr>"; }).join("") +
      (out.length + inc.length ? "" : '<tr><td colspan="3" class="empty">No links</td></tr>') + "</tbody></table></div>" +
      (s.role === "architect" ? '<a class="btn btn-block mt" href="assessments.html?app=' + n.app + '" id="btn-assess-node">' + SS.icon("clipboard") + "Assess " + SS.esc(appName(n.app)) + "</a>" : "");
    SS.$("#btn-close-detail").addEventListener("click", function () { selected = null; render(); });
  }

  function toSvg(svg, e) {
    var r = svg.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * VW, y: ((e.clientY - r.top) / r.height) * VH };
  }
  function bind() {
    var svgEl = SS.$("#twin-svg");
    SS.$$(".g-node").forEach(function (g) {
      var id = g.getAttribute("data-node");
      g.addEventListener("pointerdown", function (ev) {
        var n = node(id), p0 = toSvg(svgEl, ev), ox = n.x, oy = n.y, moved = false;
        g.setPointerCapture(ev.pointerId);
        function move(e) {
          var p = toSvg(svgEl, e);
          if (Math.abs(p.x - p0.x) + Math.abs(p.y - p0.y) > 3) moved = true;
          n.x = Math.max(0, Math.min(VW - W, ox + p.x - p0.x));
          n.y = Math.max(0, Math.min(VH - H, oy + p.y - p0.y));
          g.setAttribute("transform", "translate(" + n.x + "," + n.y + ")");
        }
        function up() {
          g.removeEventListener("pointermove", move); g.removeEventListener("pointerup", up);
          if (moved) render(); else { selected = selected === id ? null : id; render(); }
        }
        g.addEventListener("pointermove", move);
        g.addEventListener("pointerup", up);
      });
    });
  }

  ["#f-type", "#f-app", "#f-crit"].forEach(function (x) { SS.$(x).addEventListener("change", render); });
  SS.$("#f-search").addEventListener("input", render);
  SS.$("#btn-reset").addEventListener("click", function () { ["#f-type", "#f-app", "#f-crit", "#f-search"].forEach(function (x) { SS.$(x).value = ""; }); selected = null; render(); });
  SS.$("#btn-fit").addEventListener("click", function () { layout(); render(); SS.ui.toast("Layout reset"); });
  SS.$("#btn-labels").addEventListener("click", function () {
    showLabels = !showLabels;
    this.innerHTML = SS.icon("file") + (showLabels ? "Hide Link Labels" : "Show Link Labels");
    render();
  });
  SS.$("#btn-export").addEventListener("click", function () {
    SS.ui.download("digital-twin-" + entId + ".json", JSON.stringify({ enterprise: entId, nodes: nodes, links: links }, null, 2));
  });

  if (SS.param("app")) selected = SS.param("app");
  render();
})();
