/* =========================================================
   SecureShift - logout.js  (logout.html)
   ========================================================= */
(function () {
  "use strict";

  SS.$("#logo-mark").innerHTML = SS.icon("shieldCheck", "ic-lg");
  SS.$("#ic-logout").innerHTML = SS.icon("logout", "ic-lg");
  SS.$("#ic-done").innerHTML = SS.icon("checkCircle", "ic-lg");

  var s = SS.session.get();
  if (!s) {
    // nobody logged in - show the "done" state directly
    SS.$("#confirm-box").classList.add("hidden");
    SS.$("#done-box").classList.remove("hidden");
    return;
  }
  SS.$("#who").innerHTML = "Are you sure you want to logout, <b>" + SS.esc(s.name) + "</b>?";

  SS.$("#btn-cancel").addEventListener("click", function () {
    if (document.referrer && document.referrer.indexOf("logout.html") === -1) history.back();
    else SS.go(s.home);
  });

  SS.$("#btn-logout").addEventListener("click", function () {
    var product = s.product;
    SS.session.end();
    SS.$("#confirm-box").classList.add("hidden");
    SS.$("#done-box").classList.remove("hidden");
    SS.$("#btn-login-again").setAttribute("href", "login.html?product=" + product);
    setTimeout(function () {
      if (!SS.$("#done-box").classList.contains("hidden")) SS.go("login.html?product=" + product);
    }, 2500);
  });
})();
