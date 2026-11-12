/* =========================================================
   SecureShift - shell.js
   Builds the SAME frame on every inside page:
   sidebar (menu changes per product + role), top header,
   notifications, user menu and footer.
   The page's own content sits in <main id="page"> and is moved
   into the frame automatically.

   Each page body needs:
     data-root="../"          (path back to project root)
     data-product="governance"   (governance | emdt | any)
     data-page="dashboard"    (which menu item is active)
     data-roles="architect"   (optional: who may open this page)
   ========================================================= */

window.SS = window.SS || {};

(function (SS) {
  "use strict";

  /* ---------- Menus ---------- */
  var MENUS = {
    governance: {
      cloudadmin: [
        { group: "Overview", items: [{ id: "dashboard", label: "Dashboard", icon: "home", href: "governance/dashboard.html" }] },
        { group: "Analysis", items: [{ id: "analysis", label: "Analysis Wizard", icon: "wand", href: "governance/analysis.html" }] },
        { group: "Access Review", items: [
          { id: "identities", label: "Identities", icon: "users", href: "governance/identities.html" },
          { id: "findings", label: "High-Risk Findings", icon: "alert", href: "governance/findings.html" }] },
        { group: "Roles", items: [{ id: "roles", label: "Generated Roles", icon: "key", href: "governance/roles.html" }] },
        { group: "Governance", items: [
          { id: "rules", label: "Rules Configuration", icon: "sliders", href: "governance/rules.html" },
          { id: "reports", label: "Reports", icon: "report", href: "governance/reports.html" }] },
        { group: "Organization", items: [{ id: "companies", label: "Companies", icon: "building", href: "governance/companies.html" }] }
      ]
    },
    emdt: {
      superadmin: [
        { group: "Overview", items: [{ id: "dashboard", label: "Dashboard", icon: "home", href: "modernization/superadmin-dashboard.html" }] },
        { group: "Administration", items: [
          { id: "users", label: "Users", icon: "users", href: "modernization/users.html" },
          { id: "audit", label: "Audit Logs", icon: "clipboard", href: "modernization/audit-logs.html" }] },
        { group: "Account", items: [{ id: "profile", label: "Profile & Settings", icon: "settings", href: "profile.html" }] }
      ],
      admin: [
        { group: "Overview", items: [{ id: "dashboard", label: "Dashboard", icon: "home", href: "modernization/admin-dashboard.html" }] },
        { group: "Enterprise", items: [
          { id: "classification", label: "Classification (EMSI)", icon: "target", href: "modernization/classification.html" },
          { id: "deps", label: "Dependencies", icon: "link", href: "modernization/dependencies.html" },
          { id: "twin", label: "Digital Twin", icon: "network", href: "modernization/digital-twin.html" },
          { id: "apps", label: "Application Inventory", icon: "grid", href: "modernization/applications.html" }] },
        { group: "Account", items: [{ id: "profile", label: "Profile & Settings", icon: "settings", href: "profile.html" }] }
      ],
      architect: [
        { group: "Menu", items: [
          { id: "dashboard", label: "Dashboard", icon: "home", href: "modernization/architect-dashboard.html" },
          { id: "apps", label: "Applications", icon: "database", href: "modernization/applications.html" },
          { id: "twin", label: "Digital Twin", icon: "network", href: "modernization/digital-twin.html" },
          { id: "assessments", label: "Assessments", icon: "clipboard", href: "modernization/assessments.html" },
          { id: "simulation", label: "Simulations", icon: "play", href: "modernization/simulation.html" },
          { id: "plans", label: "Plans", icon: "map", href: "modernization/plans.html" },
          { id: "logout", label: "Logout", icon: "logout", href: "logout.html" }] }
      ],
      executive: [
        { group: "Overview", items: [{ id: "dashboard", label: "Approvals", icon: "home", href: "modernization/executive-dashboard.html" }] },
        { group: "Account", items: [{ id: "profile", label: "Profile & Settings", icon: "settings", href: "profile.html" }] }
      ]
    }
  };

  var FOOTERS = {
    governance: "© 2026 SecureShift. Offline analysis, no data leaves this machine.",
    emdt: "© 2026 SecureShift. Enterprise Modernization Digital Twin."
  };

  function build() {
    var body = document.body;
    var product = body.getAttribute("data-product") || "any";
    var rolesAttr = body.getAttribute("data-roles");
    var session = SS.guard(product === "any" ? null : product, rolesAttr ? rolesAttr.split(",") : null);
    if (!session) return;
    // Shared pages (Profile) take the colour theme of the product you logged in to
    if (product === "any") body.setAttribute("data-product", session.product);

    var root = SS.root();
    var pageId = body.getAttribute("data-page");
    var prod = SS.PRODUCTS[session.product];
    var menu = (MENUS[session.product] || {})[session.role] || [];
    // Notifications exist only in Cloud Governance (removed from Modernization)
    var hasBell = session.product === "governance";
    var notifs = hasBell ? ((SS.GOV || {}).notifications || []) : [];

    var nav = menu.map(function (g) {
      return '<div class="nav-group">' + g.group + "</div>" + g.items.map(function (it) {
        return '<a href="' + root + it.href + '" class="' + (it.id === pageId ? "active" : "") + '" data-nav="' + it.id + '" title="' + it.label + '">' +
               SS.icon(it.icon) + "<span>" + it.label + "</span></a>";
      }).join("");
    }).join("");

    var ini = SS.initials(session.name);
    var frame = document.createElement("div");
    frame.className = "app";
    frame.innerHTML =
      '<aside class="sidebar">' +
        '<a class="brand" href="' + root + session.home + '" style="text-decoration:none">' +
          '<div class="brand-mark">' + SS.icon("shieldCheck") + "</div>" +
          '<div class="brand-text"><div class="brand-name">SecureShift</div><div class="brand-tag">' + prod.tag + "</div></div></a>" +
        '<nav class="nav">' + nav + "</nav>" +
        '<div class="side-user"><div class="avatar">' + ini + '</div><div class="who"><b>' + SS.esc(session.name) +
          "</b><span>" + SS.esc(session.roleLabel) + "</span></div></div>" +
      "</aside>" +
      '<div class="main">' +
        '<header class="topbar">' +
          '<button class="icon-btn" id="btn-collapse" aria-label="Toggle menu">' + SS.icon("menu") + "</button>" +
          '<div class="top-title"><b>' + prod.title + "</b><div>" + prod.subtitle + "</div></div>" +
          (hasBell ? '<button class="icon-btn" id="btn-bell" aria-label="Notifications">' + SS.icon("bell") + '<span class="dot"></span></button>' : "") +
          '<button class="top-user" id="btn-user"><div class="avatar">' + ini + '</div><div class="who"><b>' + SS.esc(session.name) +
            "</b><span>" + SS.esc(session.roleLabel) + "</span></div>" + SS.icon("chevron") + "</button>" +
        "</header>" +
        '<div class="content" id="content"></div>' +
        '<footer class="footer"><span>' + FOOTERS[session.product] + "</span>" +
          '<nav><a href="#" data-help="Privacy Policy">Privacy Policy</a>|<a href="#" data-help="Security Guidelines">Security Guidelines</a>|<a href="#" data-help="Help & Support">Help &amp; Support</a></nav></footer>' +
      "</div>";

    var page = document.getElementById("page");
    body.insertBefore(frame, body.firstChild);
    if (page) { SS.$("#content", frame).appendChild(page); page.hidden = false; }
    SS.fillIcons(document);

    /* collapse sidebar (remember choice) */
    if (SS.store.get("sidebarCollapsed", false)) frame.classList.add("collapsed");
    SS.$("#btn-collapse").addEventListener("click", function () {
      frame.classList.toggle("collapsed");
      SS.store.set("sidebarCollapsed", frame.classList.contains("collapsed"));
    });

    /* notifications */
    if (hasBell) SS.$("#btn-bell").addEventListener("click", function (e) {
      e.stopPropagation();
      SS.ui.closeMenus();
      var m = document.createElement("div");
      m.className = "menu notif-panel";
      m.innerHTML = '<div class="row-between" style="padding:8px 10px"><b>Notifications</b><button class="link-btn small" id="mark-read">Mark all read</button></div>' +
        notifs.map(function (n) { return '<div class="notif-item">' + SS.esc(n.text) + "<small>" + n.time + "</small></div>"; }).join("");
      document.body.appendChild(m);
      var r = this.getBoundingClientRect();
      m.style.top = (r.bottom + window.scrollY + 6) + "px";
      m.style.left = Math.max(8, r.right - 320) + "px";
      m.addEventListener("click", function (ev) { ev.stopPropagation(); });
      SS.$("#mark-read", m).addEventListener("click", function () {
        var d = SS.$("#btn-bell .dot"); if (d) d.remove();
        SS.ui.closeMenus(); SS.ui.toast("All notifications marked as read");
      });
      setTimeout(function () { document.addEventListener("click", SS.ui.closeMenus, { once: true }); }, 0);
    });

    /* user menu */
    SS.$("#btn-user").addEventListener("click", function (e) {
      e.stopPropagation();
      SS.ui.menu(this, [
        { label: "My Profile", icon: "user", onClick: function () { SS.go("profile.html"); } },
        { label: "Change Password", icon: "lock", onClick: function () { SS.go("profile.html?tab=password"); } },
        { label: "Back to Home Page", icon: "home", onClick: function () { SS.go("index.html"); } },
        "-",
        { label: "Logout", icon: "logout", onClick: function () { SS.go("logout.html"); } }
      ]);
    });

    /* footer links */
    SS.$$("[data-help]").forEach(function (a) {
      a.addEventListener("click", function (e) {
        e.preventDefault();
        SS.ui.modal({
          title: a.getAttribute("data-help"),
          body: '<p class="muted">This is a Sprint 1 prototype. All data shown is hardcoded sample data and nothing is sent to any server.</p>' +
                '<p class="mt">For help contact the SecureShift team: <b>support@secureshift.io</b></p>'
        });
      });
    });

    SS.session.current = session;
  }

  build();
})(window.SS);
