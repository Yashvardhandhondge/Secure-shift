/* =========================================================
   SecureShift - ui.js
   Reusable UI pieces used by many pages:
   toast, modal, confirm, data table with paging, charts (SVG),
   dropdown menus, file download and copy-to-clipboard.
   ========================================================= */

window.SS = window.SS || {};

(function (SS) {
  "use strict";
  var ui = {};

  /* ---------- Toast message (bottom-right) ---------- */
  ui.toast = function (msg, icon) {
    var wrap = SS.$(".toast-wrap");
    if (!wrap) { wrap = document.createElement("div"); wrap.className = "toast-wrap"; document.body.appendChild(wrap); }
    var t = document.createElement("div");
    t.className = "toast";
    t.innerHTML = SS.icon(icon || "checkCircle") + "<span>" + SS.esc(msg) + "</span>";
    wrap.appendChild(t);
    setTimeout(function () { t.style.opacity = "0"; t.style.transition = "opacity .3s"; }, 2600);
    setTimeout(function () { t.remove(); }, 3000);
  };

  /* ---------- Modal ---------- */
  // opts: { title, body (html), wide, buttons: [{label, cls, onClick(close) }] }
  ui.modal = function (opts) {
    var bd = document.createElement("div");
    bd.className = "modal-backdrop";
    bd.innerHTML =
      '<div class="modal ' + (opts.wide ? "wide" : "") + '" role="dialog" aria-modal="true">' +
        '<div class="modal-head"><h2>' + SS.esc(opts.title || "") + '</h2>' +
        '<button class="modal-close" data-close aria-label="Close">' + SS.icon("x") + "</button></div>" +
        '<div class="modal-body">' + (opts.body || "") + "</div>" +
        '<div class="modal-foot"></div>' +
      "</div>";
    var foot = SS.$(".modal-foot", bd);
    function close() { bd.remove(); document.removeEventListener("keydown", onKey); }
    function onKey(e) { if (e.key === "Escape") close(); }
    (opts.buttons || [{ label: "Close", cls: "btn-outline" }]).forEach(function (b) {
      var btn = document.createElement("button");
      btn.className = "btn " + (b.cls || "");
      btn.textContent = b.label;
      if (b.id) btn.id = b.id;
      btn.addEventListener("click", function () {
        if (b.onClick) { if (b.onClick(close, bd) === false) return; }
        close();
      });
      foot.appendChild(btn);
    });
    bd.addEventListener("click", function (e) { if (e.target === bd || e.target.closest("[data-close]")) close(); });
    document.addEventListener("keydown", onKey);
    document.body.appendChild(bd);
    var first = SS.$("input, select, textarea", bd);
    if (first) first.focus();
    return { el: bd, close: close };
  };

  ui.confirm = function (opts) {
    return ui.modal({
      title: opts.title,
      body: '<div class="center"><div class="modal-icon">' + SS.icon(opts.icon || "alert", "ic-lg") + "</div>" +
            "<p>" + opts.message + "</p>" + (opts.note ? '<p class="muted small mt">' + opts.note + "</p>" : "") + "</div>",
      buttons: [
        { label: opts.cancelLabel || "Cancel", cls: "btn-outline" },
        { label: opts.okLabel || "Confirm", cls: "", id: "modal-ok", onClick: function () { opts.onOk(); } }
      ]
    });
  };

  /* ---------- Data table with search-friendly update + paging ---------- */
  // cfg: { el, columns:[{label, key, render(row)}], rows, pageSize, empty, onRowClick(row), rowClass(row), unit }
  ui.table = function (cfg) {
    var state = { rows: cfg.rows || [], page: 1, size: cfg.paging === false ? 100000 : (cfg.pageSize || 10) };
    var el = typeof cfg.el === "string" ? SS.$(cfg.el) : cfg.el;

    function render() {
      var total = state.rows.length;
      var pages = Math.max(1, Math.ceil(total / state.size));
      if (state.page > pages) state.page = pages;
      var start = (state.page - 1) * state.size;
      var slice = state.rows.slice(start, start + state.size);

      var html = '<div class="table-wrap"><table class="table"><thead><tr>';
      cfg.columns.forEach(function (c) { html += "<th" + (c.right ? ' class="right"' : "") + ">" + c.label + "</th>"; });
      html += "</tr></thead><tbody>";
      if (!slice.length) {
        html += '<tr><td class="empty" colspan="' + cfg.columns.length + '">' + (cfg.empty || "No records found.") + "</td></tr>";
      }
      slice.forEach(function (r, i) {
        var cls = (cfg.onRowClick ? "clickable " : "") + (cfg.rowClass ? cfg.rowClass(r) : "");
        html += '<tr class="' + cls + '" data-i="' + (start + i) + '">';
        cfg.columns.forEach(function (c) {
          var v = c.render ? c.render(r) : SS.esc(r[c.key]);
          html += "<td" + (c.right ? ' class="right"' : "") + ">" + v + "</td>";
        });
        html += "</tr>";
      });
      html += "</tbody></table></div>";

      if (cfg.paging !== false) {
        html += '<div class="table-foot"><span>Showing ' + (total ? start + 1 : 0) + "-" + Math.min(start + state.size, total) +
                " of " + total + " " + (cfg.unit || "records") + '</span><div class="pager">';
        html += '<button data-p="prev" ' + (state.page === 1 ? "disabled" : "") + ' aria-label="Previous">&lsaquo;</button>';
        for (var p = 1; p <= pages; p++) {
          if (pages > 7 && p > 3 && p < pages - 1 && Math.abs(p - state.page) > 1) {
            if (p === 4 || p === pages - 2) html += "<button disabled>…</button>";
            continue;
          }
          html += '<button data-p="' + p + '" class="' + (p === state.page ? "active" : "") + '">' + p + "</button>";
        }
        html += '<button data-p="next" ' + (state.page === pages ? "disabled" : "") + ' aria-label="Next">&rsaquo;</button></div></div>';
      }
      el.innerHTML = html;

      SS.$$(".pager button[data-p]", el).forEach(function (b) {
        b.addEventListener("click", function () {
          var v = b.getAttribute("data-p");
          state.page = v === "prev" ? state.page - 1 : v === "next" ? state.page + 1 : parseInt(v, 10);
          render();
        });
      });
      if (cfg.onRowClick) {
        SS.$$("tbody tr[data-i]", el).forEach(function (tr) {
          tr.addEventListener("click", function (e) {
            if (e.target.closest("button, a, input, select")) return;
            cfg.onRowClick(state.rows[parseInt(tr.getAttribute("data-i"), 10)], tr);
          });
        });
      }
      if (cfg.afterRender) cfg.afterRender(el, state.rows);
    }

    render();
    return {
      update: function (rows, keepPage) { state.rows = rows; if (!keepPage) state.page = 1; render(); },
      refresh: render
    };
  };

  /* ---------- Small render helpers ---------- */
  ui.badge = function (text) {
    var t = String(text);
    var strong = /^(HIGH|FAIL|CRITICAL|REJECTED|INACTIVE)$/i.test(t);
    var solid = /^(PASS|APPROVED|COMPLETE|ACTIVE|CLOUD READY|REVIEWED)$/i.test(t);
    var soft = /^(LOW|PENDING|DRAFT|SUBMITTED|REGISTERED|OPEN|NEVER|NOT ASSESSED)$/i.test(t);
    // colour tone (v3): red = bad, amber = needs attention, green = good, blue = info, violet = big category
    var tone = strong ? "red" :
      /^(MEDIUM|PENDING|SUBMITTED|WARN|IN PROGRESS|GROWTH|NEVER)$/i.test(t) ? "amber" :
      solid || /^(LOW|FOUNDATION|ADMIN)$/i.test(t) ? "green" :
      /^(DRAFT|REGISTERED|OPEN|NOT ASSESSED|ARCHITECT)$/i.test(t) ? "blue" :
      /^(STRATEGIC|ENTERPRISE|SUPER ADMIN|EXECUTIVE)$/i.test(t) ? "violet" : "accent";
    return '<span class="badge ' + (strong ? "badge-strong" : solid ? "badge-solid" : soft ? "badge-soft" : "") + " tone-" + tone + '">' + SS.esc(t) + "</span>";
  };

  ui.scorebar = function (score) {
    var cls = score >= 70 ? "" : score >= 40 ? "mid" : "low";
    return '<div class="scorebar"><b>' + score + '</b><div class="track"><div class="fill ' + cls + '" style="width:' + score + '%"></div></div></div>';
  };

  ui.hbars = function (items, max) {
    max = max || Math.max.apply(null, items.map(function (i) { return i.value; }));
    return '<div class="hbars">' + items.map(function (i) {
      return '<div class="hbar"><span>' + SS.esc(i.label) + '</span><div class="track"><div class="fill" style="width:' +
             Math.round((i.value / max) * 100) + '%"></div></div><span>' + (i.text || i.value) + "</span></div>";
    }).join("") + "</div>";
  };

  /* ---------- Line chart (SVG) ---------- */
  ui.lineChart = function (el, labels, values, opts) {
    opts = opts || {};
    var W = 640, H = 240, L = 40, R = 16, T = 16, B = 32;
    var max = opts.max || 100, min = opts.min || 0;
    var x = function (i) { return L + (i * (W - L - R)) / (labels.length - 1); };
    var y = function (v) { return T + (H - T - B) * (1 - (v - min) / (max - min)); };
    var s = '<svg viewBox="0 0 ' + W + " " + H + '" width="100%" role="img" aria-label="line chart">';
    for (var g = 0; g <= 4; g++) {
      var gv = min + ((max - min) * g) / 4;
      s += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + y(gv) + '" y2="' + y(gv) + '" stroke="#e6e6e6"/>';
      s += '<text x="' + (L - 8) + '" y="' + (y(gv) + 4) + '" font-size="11" text-anchor="end" fill="#777">' + gv + "</text>";
    }
    var pts = values.map(function (v, i) { return x(i) + "," + y(v); }).join(" ");
    s += '<polygon points="' + L + "," + y(min) + " " + pts + " " + x(values.length - 1) + "," + y(min) + '" style="fill:var(--accent);fill-opacity:.10"/>';
    s += '<polyline points="' + pts + '" fill="none" style="stroke:var(--accent)" stroke-width="2.5"/>';
    values.forEach(function (v, i) {
      s += '<circle cx="' + x(i) + '" cy="' + y(v) + '" r="4.5" fill="#fff" style="stroke:var(--accent)" stroke-width="2"><title>' + labels[i] + ": " + v + "</title></circle>";
      s += '<text x="' + x(i) + '" y="' + (y(v) - 11) + '" font-size="11" font-weight="700" text-anchor="middle" style="fill:var(--accent-dark)">' + v + "</text>";
      s += '<text x="' + x(i) + '" y="' + (H - 10) + '" font-size="11" text-anchor="middle" fill="#777">' + labels[i] + "</text>";
    });
    s += "</svg>";
    el.innerHTML = s;
  };

  /* ---------- Donut chart (SVG) ---------- */
  // items: [{label, value}]  each slice gets its own colour
  ui.donut = function (el, items, centerLabel) {
    var shades = ["#ef4444", "#f59e0b", "#22c55e", "#6366f1", "#14b8a6", "#ec4899"];
    var total = items.reduce(function (a, b) { return a + b.value; }, 0);
    var r = 60, c = 2 * Math.PI * r, off = 0;
    var s = '<div class="row" style="gap:24px;align-items:center;flex-wrap:wrap"><svg viewBox="0 0 160 160" width="150" height="150">';
    items.forEach(function (it, i) {
      var len = (it.value / total) * c;
      s += '<circle cx="80" cy="80" r="' + r + '" fill="none" stroke="' + shades[i % shades.length] + '" stroke-width="22" stroke-dasharray="' +
           len + " " + (c - len) + '" stroke-dashoffset="' + -off + '" transform="rotate(-90 80 80)"><title>' + it.label + ": " + it.value + "</title></circle>";
      off += len;
    });
    s += '<text x="80" y="78" text-anchor="middle" font-size="26" font-weight="800">' + total + '</text>' +
         '<text x="80" y="98" text-anchor="middle" font-size="11" fill="#777">' + (centerLabel || "Total") + "</text></svg>";
    s += '<div style="flex:1;min-width:150px">';
    items.forEach(function (it, i) {
      s += '<div class="row-between" style="padding:5px 0;font-size:13px"><span class="row" style="gap:8px"><span style="width:11px;height:11px;border-radius:3px;background:' +
           shades[i % shades.length] + '"></span>' + SS.esc(it.label) + "</span><b>" + it.value + ' <span class="muted small">(' + Math.round((it.value / total) * 100) + "%)</span></b></div>";
    });
    s += "</div></div>";
    el.innerHTML = s;
  };

  /* ---------- Dropdown menu attached to a button ---------- */
  ui.menu = function (anchor, items) {
    ui.closeMenus();
    var m = document.createElement("div");
    m.className = "menu";
    items.forEach(function (it) {
      if (it === "-") { m.appendChild(document.createElement("hr")); return; }
      var b = document.createElement("button");
      b.innerHTML = SS.icon(it.icon || "arrowRight") + "<span>" + SS.esc(it.label) + "</span>";
      b.addEventListener("click", function (e) { e.stopPropagation(); ui.closeMenus(); it.onClick(); });
      m.appendChild(b);
    });
    document.body.appendChild(m);
    var r = anchor.getBoundingClientRect();
    m.style.top = (r.bottom + window.scrollY + 4) + "px";
    var left = r.right + window.scrollX - m.offsetWidth;
    m.style.left = Math.max(8, left) + "px";
    setTimeout(function () { document.addEventListener("click", ui.closeMenus, { once: true }); }, 0);
    return m;
  };
  ui.closeMenus = function () { SS.$$("body > .menu").forEach(function (m) { m.remove(); }); };

  /* ---------- Download a text file / copy text ---------- */
  ui.download = function (filename, text, type) {
    try {
      var blob = new Blob([text], { type: type || "application/json" });
      var a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
      ui.toast("Downloaded " + filename, "download");
    } catch (e) { ui.toast("Download not supported here", "alert"); }
  };

  ui.copy = function (text) {
    function fallback() {
      var ta = document.createElement("textarea");
      ta.value = text; document.body.appendChild(ta); ta.select();
      try { document.execCommand("copy"); } catch (e) { /* ignore */ }
      ta.remove();
    }
    try {
      if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).catch(fallback);
      else fallback();
    } catch (e) { fallback(); }
    ui.toast("Copied to clipboard", "copy");
  };

  /* CSV helper */
  ui.csv = function (rows, cols) {
    var out = [cols.map(function (c) { return c.label; }).join(",")];
    rows.forEach(function (r) {
      out.push(cols.map(function (c) { return '"' + String(r[c.key] === undefined ? "" : r[c.key]).replace(/"/g, '""') + '"'; }).join(","));
    });
    return out.join("\n");
  };

  /* Form validation helper: fields = [{id, label, rule(value) -> error or ""}] */
  ui.validate = function (root, fields) {
    var ok = true;
    SS.$$(".error-text", root).forEach(function (e) { e.remove(); });
    SS.$$(".invalid", root).forEach(function (e) { e.classList.remove("invalid"); });
    fields.forEach(function (f) {
      var el = SS.$("#" + f.id, root);
      var val = el ? (el.value || "").trim() : "";
      var err = f.rule ? f.rule(val, el) : (val ? "" : f.label + " is required");
      if (err) {
        ok = false;
        if (el) {
          el.classList.add("invalid");
          var e = document.createElement("div");
          e.className = "error-text"; e.textContent = err;
          (el.closest(".field") || el.parentNode).appendChild(e);
        }
      }
    });
    return ok;
  };

  /* Remove a field's error message as soon as the user fixes it */
  function clearError(e) {
    var el = e.target;
    if (!el || !el.closest) return;
    var field = el.closest(".field");
    if (!field) return;
    SS.$$(".invalid", field).forEach(function (x) { x.classList.remove("invalid"); });
    SS.$$(".error-text", field).forEach(function (x) { x.remove(); });
  }
  document.addEventListener("input", clearError);
  document.addEventListener("change", clearError);

  SS.ui = ui;
})(window.SS);
