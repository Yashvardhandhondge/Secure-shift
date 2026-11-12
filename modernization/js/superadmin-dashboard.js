/* =========================================================
   EMDT - superadmin-dashboard.js
   ========================================================= */
(function () {
  "use strict";
  if (!SS.session.current) return;

  var users = SS.EM.load("users");
  var logs = SS.EM.load("auditLogs");
  var active = users.filter(function (u) { return u.status === "Active"; }).length;

  SS.$("#k-total").textContent = users.length;
  SS.$("#k-active").textContent = active;
  SS.$("#k-inactive").textContent = users.length - active;

  var roles = ["Super Admin", "Admin", "Architect", "Executive"];
  SS.$("#by-role").innerHTML = SS.ui.hbars(roles.map(function (r) {
    return { label: r, value: users.filter(function (u) { return u.role === r; }).length };
  }));

  SS.$("#recent-activity").innerHTML = logs.slice(0, 5).map(function (l) {
    return '<div class="row" style="padding:9px 0;border-bottom:1px solid var(--line-soft);gap:12px"><span class="avatar" style="width:30px;height:30px;font-size:11px">' +
           SS.initials(l.user) + '</span><div style="flex:1"><b class="small">' + SS.esc(l.action) + "</b> · <span class='small'>" + SS.esc(l.target) +
           '</span><div class="small muted">' + SS.esc(l.user) + " · " + l.time + "</div></div></div>";
  }).join("");

  var changes = logs.filter(function (l) { return /Role|Created|Deactivated|Activated|Password/.test(l.action); }).slice(0, 6);
  SS.ui.table({ el: "#access-table", rows: changes, paging: false, empty: "No access changes yet.", columns: [
    { label: "User Name", render: function (r) { return "<b>" + SS.esc(r.target) + "</b>"; } },
    { label: "Action", key: "action" },
    { label: "Details", key: "detail" },
    { label: "Changed By", key: "user" },
    { label: "Updated On", key: "time" }
  ] });
})();
