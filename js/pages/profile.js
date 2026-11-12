/* =========================================================
   SecureShift - profile.js  (profile.html, shared by all roles)
   ========================================================= */
(function () {
  "use strict";
  var s = SS.session.current;
  if (!s) return;

  var key = "profile." + s.id;
  var isGov = s.product === "governance";
  // Notifications + Activity tabs exist only in Cloud Governance
  if (!isGov) {
    SS.$$("[data-gov-only]").forEach(function (b) { b.remove(); });
    SS.$$('[data-panel="notifications"], [data-panel="activity"]').forEach(function (p) { p.remove(); });
  } else {
    SS.$("#profile-sub").textContent = "Manage your account details, password, notifications and see your recent activity.";
  }
  var profile = SS.store.get(key, { name: s.name, phone: "9876543210", dept: s.product === "governance" ? "Cloud Security" : "Enterprise Architecture" });

  SS.$("#crumb-home").setAttribute("href", s.home);
  SS.$("#p-avatar").textContent = SS.initials(profile.name);
  SS.$("#p-name").textContent = profile.name;
  SS.$("#p-email").textContent = s.email;
  SS.$("#p-role").textContent = s.roleLabel;
  SS.$("#p-product").textContent = SS.PRODUCTS[s.product].name;
  SS.$("#p-id").textContent = s.id;
  SS.$("#p-login").textContent = new Date(s.loginAt).toLocaleString();

  SS.$("#d-name").value = profile.name;
  SS.$("#d-email").value = s.email;
  SS.$("#d-phone").value = profile.phone;
  SS.$("#d-dept").value = profile.dept;

  /* tabs */
  function openTab(t) {
    SS.$$(".tabs button").forEach(function (b) { b.classList.toggle("active", b.getAttribute("data-tab") === t); });
    SS.$$("[data-panel]").forEach(function (p) { p.classList.toggle("hidden", p.getAttribute("data-panel") !== t); });
  }
  SS.$$(".tabs button").forEach(function (b) { b.addEventListener("click", function () { openTab(b.getAttribute("data-tab")); }); });
  if (SS.param("tab")) openTab(SS.param("tab"));

  /* save details */
  SS.$("#form-details").addEventListener("submit", function (e) {
    e.preventDefault();
    var ok = SS.ui.validate(this, [
      { id: "d-name", label: "Name", rule: function (v) { return SS.V.name(v) ? "" : "Only letters and single spaces, 3-50 characters"; } },
      { id: "d-phone", label: "Phone", rule: function (v) { return SS.V.phone(v) ? "" : "Exactly 10 digits, starting with 6, 7, 8 or 9"; } },
      { id: "d-dept", label: "Department", rule: function (v) { return SS.V.dept(v) ? "" : "Letters, numbers and spaces only, 3-150 characters"; } }
    ]);
    if (!ok) return;
    profile.name = SS.$("#d-name").value.trim();
    profile.phone = SS.$("#d-phone").value.trim();
    profile.dept = SS.$("#d-dept").value.trim();
    SS.store.set(key, profile);
    SS.$("#p-name").textContent = profile.name;
    SS.$("#p-avatar").textContent = SS.initials(profile.name);
    SS.ui.toast("Profile updated");
  });

  /* change password */
  SS.$("#form-password").addEventListener("submit", function (e) {
    e.preventDefault();
    var ok = SS.ui.validate(this, [
      { id: "pw-current", label: "Current password", rule: function (v) { return v === SS.DEMO_PASSWORD ? "" : "Current password is wrong (demo: " + SS.DEMO_PASSWORD + ")"; } },
      { id: "pw-new", label: "New password", rule: function (v) {
        return SS.V.password(v) ? "" : "Min 8 characters with uppercase, lowercase, number and special character"; } },
      { id: "pw-confirm", label: "Confirm", rule: function (v) { return v && v === SS.$("#pw-new").value ? "" : "Passwords do not match"; } }
    ]);
    if (!ok) return;
    this.reset();
    SS.ui.toast("Password updated (prototype - demo password stays the same)", "lock");
  });

  if (!isGov) { if (SS.param("tab") === "notifications" || SS.param("tab") === "activity") openTab("details"); return; }

  /* notifications */
  var prefs = SS.store.get("notif." + s.id, { email: true, approvals: true, weekly: false, security: true });
  var labels = { email: "Email alerts", approvals: "Approval and review updates", weekly: "Weekly summary report", security: "Security / high-risk alerts" };
  SS.$("#notif-settings").innerHTML = Object.keys(labels).map(function (k) {
    return '<label class="check row-between" style="border:1px solid var(--line-soft);border-radius:8px;padding:12px 14px"><span>' + labels[k] +
           '</span><input type="checkbox" data-pref="' + k + '" ' + (prefs[k] ? "checked" : "") + "></label>";
  }).join("");
  SS.$("#btn-save-notif").addEventListener("click", function () {
    SS.$$("[data-pref]").forEach(function (c) { prefs[c.getAttribute("data-pref")] = c.checked; });
    SS.store.set("notif." + s.id, prefs);
    SS.ui.toast("Notification preferences saved");
  });

  /* activity */
  var rows = s.product === "governance"
    ? [
        { time: "11/11/2026 10:02 AM", action: "Logged in", detail: "Browser session" },
        { time: "11/10/2026 04:12 PM", action: "Ran analysis", detail: "AN-2026-1110 · Northwind Traders" },
        { time: "11/10/2026 04:20 PM", action: "Generated report", detail: "RPT-1110" },
        { time: "11/09/2026 11:40 AM", action: "Updated rules", detail: "rules.json weights" }
      ]
    : SS.EM.auditLogs.filter(function (l) { return l.user === s.name; }).map(function (l) {
        return { time: l.time, action: l.action, detail: l.target + " · " + l.detail };
      }).concat([{ time: "11/11/2026 10:02 AM", action: "Logged in", detail: "Browser session" }]);
  SS.ui.table({ el: "#activity-table", rows: rows, pageSize: 6, unit: "activities",
    columns: [{ label: "Time", key: "time" }, { label: "Action", key: "action", render: function (r) { return "<b>" + SS.esc(r.action) + "</b>"; } }, { label: "Details", key: "detail" }] });
})();
