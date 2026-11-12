/* =========================================================
   EMDT - users.js  (modernization/users.html)
   View/Search users, Add user, Edit role, Activate/Deactivate.
   ========================================================= */
(function () {
  "use strict";
  if (!SS.session.current) return;

  var users = SS.EM.load("users");
  var ROLES = ["Super Admin", "Admin", "Architect", "Executive"];

  if (SS.param("status")) SS.$("#f-status").value = SS.param("status");

  var table = SS.ui.table({
    el: "#u-table", rows: [], pageSize: 10, unit: "users",
    columns: [
      { label: "#", render: function (r) { return '<span class="muted">' + r.id.replace("USR-", "") + "</span>"; } },
      { label: "Full Name", render: function (r) { return '<span class="row" style="gap:8px"><span class="avatar" style="width:28px;height:28px;font-size:10px">' + SS.initials(r.name) + "</span><b>" + SS.esc(r.name) + "</b></span>"; } },
      { label: "Email", key: "email" },
      { label: "Phone Number", key: "phone" },
      { label: "Role", key: "role" },
      { label: "Status", render: function (r) { return SS.ui.badge(r.status); } },
      { label: "Actions", render: function (r) {
        return '<span class="row" style="gap:4px"><button class="btn btn-ghost btn-sm" data-view="' + r.id + '">View</button>' +
               '<button class="btn btn-ghost btn-sm" data-edit="' + r.id + '">Edit</button>' +
               '<button class="btn btn-ghost btn-sm" data-more="' + r.id + '" aria-label="More actions">&#8943;</button></span>';
      } }
    ],
    afterRender: function (el) {
      SS.$$("[data-view]", el).forEach(function (b) { b.addEventListener("click", function () { viewUser(find(b.getAttribute("data-view"))); }); });
      SS.$$("[data-edit]", el).forEach(function (b) { b.addEventListener("click", function () { editRole(find(b.getAttribute("data-edit"))); }); });
      SS.$$("[data-more]", el).forEach(function (b) {
        b.addEventListener("click", function (e) {
          e.stopPropagation();
          var u = find(b.getAttribute("data-more"));
          SS.ui.menu(b, [
            { label: "View Details", icon: "eye", onClick: function () { viewUser(u); } },
            { label: "Edit User", icon: "edit", onClick: function () { userForm(u); } },
            { label: "Change Role", icon: "users", onClick: function () { editRole(u); } },
            { label: "Reset Password", icon: "lock", onClick: function () { SS.EM.log("Password Reset", u.name, "By admin"); SS.ui.toast("Password reset link sent to " + u.email, "mail"); } },
            "-",
            { label: u.status === "Active" ? "Deactivate User" : "Activate User", icon: "power", onClick: function () { toggleStatus(u); } }
          ]);
        });
      });
    }
  });

  function find(id) { return users.filter(function (u) { return u.id === id; })[0]; }
  function save() { SS.EM.save("users", users); apply(true); }

  function apply(keep) {
    var q = SS.$("#f-search").value.trim().toLowerCase(), r = SS.$("#f-role").value, s = SS.$("#f-status").value;
    var rows = users.filter(function (u) {
      return (!q || (u.name + " " + u.email + " " + u.phone).toLowerCase().indexOf(q) > -1) && (!r || u.role === r) && (!s || u.status === s);
    });
    SS.$("#u-count").textContent = "Users (" + rows.length + ")";
    table.update(rows, keep === true);
  }

  /* ----- View ----- */
  function viewUser(u) {
    SS.ui.modal({
      title: "User Details",
      body: '<div class="center"><div class="avatar" style="width:64px;height:64px;font-size:22px;margin:0 auto 8px">' + SS.initials(u.name) + "</div><h2>" + SS.esc(u.name) + "</h2>" +
            '<p class="muted small">' + u.email + "</p></div>" +
            '<dl class="kv mt-lg"><dt>User ID</dt><dd>' + u.id + "</dd><dt>Phone</dt><dd>" + u.phone + "</dd><dt>Role</dt><dd>" + u.role +
            "</dd><dt>Status</dt><dd>" + SS.ui.badge(u.status) + "</dd><dt>Created On</dt><dd>" + u.created + "</dd></dl>",
      buttons: [{ label: "Close", cls: "btn-outline" }, { label: "Edit User", onClick: function () { setTimeout(function () { userForm(u); }, 0); } }]
    });
  }

  /* ----- Add / Edit user form ----- */
  function userForm(u) {
    var isEdit = !!u;
    SS.ui.modal({
      title: isEdit ? "Edit User" : "Add New User",
      body: '<div class="form-grid">' +
        '<div class="field full"><label>Full Name <span class="req">*</span></label><input class="input" id="uf-name" value="' + SS.esc(u ? u.name : "") + '"></div>' +
        '<div class="field"><label>Email <span class="req">*</span></label><input class="input" id="uf-email" value="' + SS.esc(u ? u.email : "") + '" placeholder="name@company.com"></div>' +
        '<div class="field"><label>Phone Number <span class="req">*</span></label><input class="input" id="uf-phone" value="' + SS.esc(u ? u.phone : "") + '" placeholder="10 digits"></div>' +
        '<div class="field"><label>Role <span class="req">*</span></label><select class="select" id="uf-role"' + (u && u.role === "Super Admin" ? " disabled" : "") + '><option value="">Select role</option>' +
          ROLES.map(function (r) { return "<option " + (u && u.role === r ? "selected" : "") + ">" + r + "</option>"; }).join("") + "</select>" +
          (u && u.role === "Super Admin" ? '<span class="small muted">A Super Admin role cannot be removed.</span>' : "") + "</div>" +
        "</div>" + (isEdit ? "" : '<p class="small muted mt">New users are created as <b>Active</b>. Name: letters only (3-50). Phone: 10 digits starting with 6-9.</p>'),
      buttons: [{ label: "Cancel", cls: "btn-outline" }, { label: isEdit ? "Save Changes" : "Create User", id: "uf-submit", onClick: function (close, root) {
        var ok = SS.ui.validate(root, [
          { id: "uf-name", label: "Name", rule: function (v) { return SS.V.name(v) ? "" : "Only letters and single spaces, 3-50 characters"; } },
          { id: "uf-email", label: "Email", rule: function (v) {
            if (!SS.V.email(v)) return "Enter a valid email (name@domain.com)";
            return users.some(function (x) { return x.email.toLowerCase() === v.toLowerCase() && x !== u; }) ? "Email already exists" : ""; } },
          { id: "uf-phone", label: "Phone", rule: function (v) { return SS.V.phone(v) ? "" : "Exactly 10 digits, starting with 6, 7, 8 or 9"; } },
          { id: "uf-role", label: "Role" }
        ]);
        if (!ok) return false;
        var data = { name: SS.$("#uf-name", root).value.trim(), email: SS.$("#uf-email", root).value.trim(), phone: SS.$("#uf-phone", root).value.trim(),
                     role: SS.$("#uf-role", root).value };
        if (isEdit) {
          if (u.role === "Super Admin") data.role = "Super Admin";   // Super Admin can never be demoted
          if (data.role !== u.role) SS.EM.log("Role Changed", u.name, u.role + " → " + data.role);
          Object.assign(u, data); SS.EM.log("User Updated", u.name, "Details edited"); SS.ui.toast(u.name + " updated");
        } else {
          data.id = SS.nextId(users, "USR-", 3); data.created = SS.today(); data.status = "Active";
          users.unshift(data);
          SS.EM.log("User Created", data.name, "Role: " + data.role);
          SS.ui.toast(data.name + " created");
        }
        save();
      } }]
    });
  }

  /* ----- Change role ----- */
  function editRole(u) {
    if (u.role === "Super Admin") { SS.ui.toast("A Super Admin role cannot be removed or changed", "alert"); return; }
    SS.ui.modal({
      title: "Edit User Role",
      body: '<p class="small muted">Change the role for <b>' + SS.esc(u.name) + "</b>. The new permissions apply on their next login.</p>" +
            '<div class="field mt"><label>Current Role</label><input class="input" value="' + u.role + '" disabled></div>' +
            '<div class="field mt"><label>New Role <span class="req">*</span></label><select class="select" id="er-role" title="You can promote a user to Super Admin">' +
            ROLES.map(function (r) { return "<option " + (r === u.role ? "selected" : "") + ">" + r + "</option>"; }).join("") + "</select></div>" +
            '<div class="field mt"><label>Reason</label><input class="input" id="er-reason" placeholder="Optional"></div>',
      buttons: [{ label: "Cancel", cls: "btn-outline" }, { label: "Update Role", id: "er-submit", onClick: function (close, root) {
        var nr = SS.$("#er-role", root).value;
        if (nr === u.role) { SS.ui.toast("Role is unchanged", "info"); return false; }
        SS.EM.log("Role Changed", u.name, u.role + " → " + nr);
        u.role = nr; save();
        SS.ui.toast(u.name + " is now " + nr);
      } }]
    });
  }

  /* ----- Activate / Deactivate ----- */
  function toggleStatus(u) {
    var deactivate = u.status === "Active";
    if (u.role === "Super Admin" && deactivate) { SS.ui.toast("A Super Admin cannot be deactivated or removed", "alert"); return; }
    SS.ui.confirm({
      title: deactivate ? "Confirm Deactivation" : "Confirm Activation",
      message: "Are you sure you want to " + (deactivate ? "deactivate" : "activate") + " <b>" + SS.esc(u.name) + "</b>?",
      note: deactivate ? "The user will not be able to log in to the platform until activated." : "The user will be able to log in again.",
      okLabel: deactivate ? "Deactivate" : "Activate",
      onOk: function () {
        u.status = deactivate ? "Inactive" : "Active";
        SS.EM.log(deactivate ? "Account Deactivated" : "Account Activated", u.name, "");
        save();
        SS.ui.toast(u.name + " " + (deactivate ? "deactivated" : "activated"));
      }
    });
  }

  SS.$("#filter-form").addEventListener("submit", function (e) { e.preventDefault(); apply(); });
  SS.$("#f-role").addEventListener("change", apply);
  SS.$("#f-status").addEventListener("change", apply);
  SS.$("#f-search").addEventListener("input", apply);
  SS.$("#btn-clear").addEventListener("click", function () { SS.$("#filter-form").reset(); apply(); });
  SS.$("#btn-add").addEventListener("click", function () { userForm(null); });

  apply();
  if (SS.param("add")) userForm(null);
})();
