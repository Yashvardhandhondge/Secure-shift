/* =========================================================
   SecureShift - landing.js  (index.html)
   ========================================================= */
(function () {
  "use strict";

  // fill icons
  SS.$("#logo-mark").innerHTML = SS.icon("shieldCheck");
  SS.$$("[data-icon]").forEach(function (el) {
    el.innerHTML = SS.icon(el.getAttribute("data-icon"), el.classList.contains("pc-icon") ? "ic-lg" : "");
  });

  // trust strip
  var trust = [
    ["cloud", "Cloud Governance", "Permission visibility"],
    ["network", "App Intelligence", "Dependency insights"],
    ["shield", "Secure by Design", "Offline, local analysis"]
  ];
  SS.$("#trust").innerHTML = trust.map(function (t) {
    return "<div>" + SS.icon(t[0], "ic-lg") + "<span><b>" + t[1] + "</b>" + t[2] + "</span></div>";
  }).join("");

  // features
  var features = [
    ["users", "Over-Privilege Score", "See every identity's granted vs used access as one 0-100 score."],
    ["key", "Least-Privilege Roles", "Generate minimal custom role JSON from real activity."],
    ["network", "Digital Twin", "Visual graph of apps, APIs, databases and services."],
    ["play", "What-if Simulation", "Estimate risk, cost and timeline before migrating."]
  ];
  SS.$("#features").innerHTML = features.map(function (f) {
    return '<div class="feature"><div class="ic-box">' + SS.icon(f[0]) + "</div><h3>" + f[1] + "</h3><p>" + f[2] + "</p></div>";
  }).join("");

  // products dropdown
  var dd = SS.$("#products-dd");
  SS.$("#products-btn").addEventListener("click", function (e) { e.stopPropagation(); dd.classList.toggle("open"); });
  document.addEventListener("click", function () { dd.classList.remove("open"); });

  // if already logged in, Login button goes straight to the dashboard
  var s = SS.session.get();
  if (s) {
    var btn = SS.$("#nav-login");
    btn.textContent = "Go to Dashboard";
    btn.setAttribute("href", s.home);
  }

  // book appointment form
  SS.$("#btn-appointment").addEventListener("click", function () {
    SS.ui.modal({
      title: "Book an Appointment",
      body:
        '<div class="form-grid">' +
        '<div class="field full"><label>Full Name <span class="req">*</span></label><input class="input" id="ap-name" placeholder="Your name"></div>' +
        '<div class="field full"><label>Work Email <span class="req">*</span></label><input class="input" id="ap-email" placeholder="name@company.com"></div>' +
        '<div class="field"><label>Product</label><select class="select" id="ap-product"><option>Cloud Governance</option><option>Application Modernization - EMDT</option><option>Both</option></select></div>' +
        '<div class="field"><label>Preferred Date <span class="req">*</span></label><input class="input" type="date" id="ap-date"></div>' +
        "</div>",
      buttons: [
        { label: "Cancel", cls: "btn-outline" },
        { label: "Book Demo", id: "ap-submit", onClick: function (close, root) {
          var ok = SS.ui.validate(root, [
            { id: "ap-name", label: "Name" },
            { id: "ap-email", label: "Email", rule: function (v) { return /^\S+@\S+\.\S+$/.test(v) ? "" : "Enter a valid email"; } },
            { id: "ap-date", label: "Date" }
          ]);
          if (!ok) return false;
          SS.ui.toast("Appointment booked. We will email you soon.");
        } }
      ]
    });
  });
})();
