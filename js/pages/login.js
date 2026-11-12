/* =========================================================
   SecureShift - login.js  (login.html)
   1. Pick product (Cloud Governance or EMDT)
   2. Enter email + password (or click a demo account)
   3. Go to that role's dashboard
   ========================================================= */
(function () {
  "use strict";

  var product = SS.param("product") === "emdt" ? "emdt" : "governance";

  SS.$("#logo-mark").innerHTML = SS.icon("shieldCheck", "ic-lg");
  SS.$("#ic-mail").outerHTML = SS.icon("mail");
  SS.$("#ic-lock").outerHTML = SS.icon("lock");
  SS.$("#ic-arrow").outerHTML = SS.icon("arrowRight");
  SS.$("#pw-toggle").innerHTML = SS.icon("eye");
  SS.$("#tab-custom-role").innerHTML = SS.icon("shieldCheck") + "Cloud Governance";
  SS.$("#tab-emdt").innerHTML = SS.icon("network") + "Modernization";
  SS.$("#auth-foot").innerHTML =
    "<span>" + SS.icon("lock") + "Secure Authentication</span><span>" + SS.icon("users") + "RBAC</span><span>" + SS.icon("shield") + "Governance</span>";

  // remembered email
  var remembered = SS.store.get("rememberEmail", "");
  if (remembered) { SS.$("#email").value = remembered; SS.$("#remember").checked = true; }

  if (SS.param("expired")) showAlert("Please log in to continue.");

  function showAlert(msg) {
    SS.$("#login-alert").innerHTML = '<div class="alert-box">' + SS.icon("alert") + "<span>" + SS.esc(msg) + "</span></div>";
  }

  function setProduct(p) {
    product = p;
    SS.$$(".seg button").forEach(function (b) { b.classList.toggle("active", b.getAttribute("data-product") === p); });
    document.body.setAttribute("data-product", p);   // login card turns indigo (Governance) or teal (EMDT)
    renderDemo();
  }

  function renderDemo() {
    var list = SS.ACCOUNTS.filter(function (a) { return a.product === product; });
    SS.$("#demo-list").innerHTML = list.map(function (a) {
      return '<button type="button" class="demo-item" data-email="' + a.email + '"><span class="avatar">' + SS.initials(a.name) +
             '</span><span><b>' + SS.esc(a.name) + "</b><span>" + a.roleLabel + " · " + a.email + "</span></span></button>";
    }).join("") + '<p class="small muted center">Password for all demo accounts: <b class="mono">' + SS.DEMO_PASSWORD + "</b></p>";
    SS.$$(".demo-item").forEach(function (b) {
      b.addEventListener("click", function () {
        SS.$("#email").value = b.getAttribute("data-email");
        SS.$("#password").value = SS.DEMO_PASSWORD;
        SS.$("#login-alert").innerHTML = "";
      });
    });
  }

  SS.$$(".seg button").forEach(function (b) {
    b.addEventListener("click", function () { setProduct(b.getAttribute("data-product")); });
  });

  SS.$("#pw-toggle").addEventListener("click", function () {
    var pw = SS.$("#password");
    pw.type = pw.type === "password" ? "text" : "password";
  });

  SS.$("#forgot").addEventListener("click", function () {
    SS.ui.modal({
      title: "Reset Password",
      body: '<p class="muted small" style="margin-bottom:12px">Enter your registered email. A reset link will be sent by your administrator.</p>' +
            '<div class="field"><label>Email</label><input class="input" id="reset-email" placeholder="name@secureshift.io"></div>',
      buttons: [
        { label: "Cancel", cls: "btn-outline" },
        { label: "Send Reset Link", id: "reset-send", onClick: function (close, root) {
          var ok = SS.ui.validate(root, [{ id: "reset-email", label: "Email",
            rule: function (v) { return /^\S+@\S+\.\S+$/.test(v) ? "" : "Enter a valid email"; } }]);
          if (!ok) return false;
          SS.ui.toast("Reset link sent to " + SS.$("#reset-email", root).value, "mail");
        } }
      ]
    });
  });

  SS.$("#login-form").addEventListener("submit", function (e) {
    e.preventDefault();
    var email = SS.$("#email").value.trim().toLowerCase();
    var pw = SS.$("#password").value;
    if (!email || !pw) { showAlert("Please enter your email and password."); return; }
    if (!/^\S+@\S+\.\S+$/.test(email)) { showAlert("Please enter a valid email address."); return; }

    var acc = SS.ACCOUNTS.filter(function (a) { return a.email === email; })[0];
    if (!acc || pw !== SS.DEMO_PASSWORD) { showAlert("Invalid email or password. Try a demo account below."); return; }
    if (acc.product !== product) {
      showAlert("This account belongs to " + SS.PRODUCTS[acc.product].name + ". Switching product - click LOGIN again.");
      setProduct(acc.product);
      return;
    }

    if (SS.$("#remember").checked) SS.store.set("rememberEmail", email); else SS.store.remove("rememberEmail");
    SS.session.start(acc);
    var btn = SS.$("#btn-login");
    btn.disabled = true;
    btn.textContent = "Signing in...";
    setTimeout(function () { SS.go(acc.home); }, 400);
  });

  setProduct(product);
})();
