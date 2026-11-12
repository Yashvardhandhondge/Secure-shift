/* =========================================================
   EMDT - audit-logs.js  (modernization/audit-logs.html)
   ========================================================= */
(function () {
  "use strict";
  if (!SS.session.current) return;

  var logs = SS.EM.load("auditLogs");
  function uniq(key) { return logs.map(function (l) { return l[key]; }).filter(function (v, i, a) { return a.indexOf(v) === i; }).sort(); }
  SS.$("#f-action").innerHTML += uniq("action").map(function (a) { return "<option>" + SS.esc(a) + "</option>"; }).join("");
  SS.$("#f-user").innerHTML += uniq("user").map(function (a) { return "<option>" + SS.esc(a) + "</option>"; }).join("");

  var cols = [
    { label: "Time", key: "time" },
    { label: "Performed By", render: function (r) { return "<b>" + SS.esc(r.user) + "</b>"; } },
    { label: "Action", render: function (r) { return '<span class="badge">' + SS.esc(r.action) + "</span>"; } },
    { label: "Target", key: "target" },
    { label: "Details", key: "detail" }
  ];
  var table = SS.ui.table({ el: "#log-table", rows: logs, pageSize: 10, unit: "log entries", columns: cols });

  function filtered() {
    var q = SS.$("#f-search").value.trim().toLowerCase(), a = SS.$("#f-action").value, u = SS.$("#f-user").value;
    return logs.filter(function (l) {
      return (!q || (l.user + " " + l.action + " " + l.target + " " + l.detail).toLowerCase().indexOf(q) > -1) && (!a || l.action === a) && (!u || l.user === u);
    });
  }
  function apply() { table.update(filtered()); }
  SS.$("#f-search").addEventListener("input", apply);
  SS.$("#f-action").addEventListener("change", apply);
  SS.$("#f-user").addEventListener("change", apply);
  SS.$("#btn-clear").addEventListener("click", function () { SS.$("#f-search").value = ""; SS.$("#f-action").value = ""; SS.$("#f-user").value = ""; apply(); });
})();
