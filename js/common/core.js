/* =========================================================
   SecureShift - core.js
   Loaded FIRST on every page.
   - SS.store   : save / read data in the browser (localStorage)
   - SS.session : who is logged in
   - SS.guard   : send user to login if not logged in
   - SS.icon    : outline SVG icons
   - small helpers (query params, escaping, dates)
   ========================================================= */

window.SS = window.SS || {};

(function (SS) {
  "use strict";

  /* ---------- Storage (with safe fallback if browser blocks it) ---------- */
  var memory = {};
  var PREFIX = "secureshift.";

  SS.store = {
    get: function (key, fallback) {
      try {
        var raw = window.localStorage.getItem(PREFIX + key);
        if (raw !== null) return JSON.parse(raw);
      } catch (e) {
        if (memory[key] !== undefined) return memory[key];
      }
      if (memory[key] !== undefined) return memory[key];
      // return a copy so pages never edit the original hardcoded data
      return fallback === undefined ? null : JSON.parse(JSON.stringify(fallback));
    },
    set: function (key, value) {
      memory[key] = value;
      try { window.localStorage.setItem(PREFIX + key, JSON.stringify(value)); } catch (e) { /* ignore */ }
    },
    remove: function (key) {
      delete memory[key];
      try { window.localStorage.removeItem(PREFIX + key); } catch (e) { /* ignore */ }
    },
    resetAll: function () {
      memory = {};
      try {
        Object.keys(window.localStorage).forEach(function (k) {
          if (k.indexOf(PREFIX) === 0) window.localStorage.removeItem(k);
        });
      } catch (e) { /* ignore */ }
    }
  };

  /* ---------- Session ---------- */
  SS.session = {
    get: function () { return SS.store.get("session", null); },
    start: function (user) {
      SS.store.set("session", {
        id: user.id, name: user.name, email: user.email, role: user.role,
        roleLabel: user.roleLabel, product: user.product, home: user.home,
        loginAt: new Date().toISOString()
      });
    },
    end: function () { SS.store.remove("session"); }
  };

  /* Root path ("" on root pages, "../" inside folders). Set on <body data-root="../"> */
  SS.root = function () { return (document.body && document.body.getAttribute("data-root")) || ""; };
  SS.go = function (path) { window.location.href = SS.root() + path; };

  /* Protect a page. allowed = list of role ids, or empty for any logged-in user */
  SS.guard = function (product, allowed) {
    var s = SS.session.get();
    if (!s) { SS.go("login.html?product=" + (product || "governance") + "&expired=1"); return null; }
    if (product && s.product !== product) { SS.go(s.home); return null; }
    if (allowed && allowed.length && allowed.indexOf(s.role) === -1) { SS.go(s.home); return null; }
    return s;
  };

  /* ---------- Helpers ---------- */
  SS.param = function (name) {
    var m = new RegExp("[?&]" + name + "=([^&#]*)").exec(window.location.search);
    return m ? decodeURIComponent(m[1].replace(/\+/g, " ")) : null;
  };
  SS.esc = function (v) {
    return String(v === undefined || v === null ? "" : v)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  };
  SS.$ = function (sel, el) { return (el || document).querySelector(sel); };
  SS.$$ = function (sel, el) { return Array.prototype.slice.call((el || document).querySelectorAll(sel)); };
  SS.initials = function (name) {
    return String(name || "?").split(/[\s.]+/).filter(Boolean).slice(0, 2).map(function (p) { return p[0]; }).join("").toUpperCase();
  };
  SS.fmt = function (n) { return Number(n).toLocaleString("en-IN"); };
  SS.today = function () {
    var d = new Date();
    return ("0" + (d.getMonth() + 1)).slice(-2) + "/" + ("0" + d.getDate()).slice(-2) + "/" + d.getFullYear();
  };
  SS.now = function () {
    var d = new Date();
    var h = d.getHours(), m = ("0" + d.getMinutes()).slice(-2), ap = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    return SS.today() + ", " + h + ":" + m + " " + ap;
  };
  SS.nextId = function (list, prefix, pad) {
    var max = 0;
    list.forEach(function (x) { var n = parseInt(String(x.id).replace(/\D/g, ""), 10); if (n > max) max = n; });
    return prefix + String(max + 1).padStart(pad || 3, "0");
  };

  /* ---------- Shared validation rules (same everywhere) ---------- */
  SS.V = {
    // Full name: letters only (single spaces between words), 3-50 characters
    name: function (v) { v = String(v || "").trim(); return v.length >= 3 && v.length <= 50 && /^[A-Za-z]+( [A-Za-z]+)*$/.test(v); },
    // Email: something@domain.tld
    email: function (v) { return /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(String(v || "").trim()); },
    // Indian mobile: 10 digits, first digit 6-9
    phone: function (v) { return /^[6-9][0-9]{9}$/.test(String(v || "").trim()); },
    // Department: letters, numbers and spaces, 3-150 characters
    dept: function (v) { v = String(v || "").trim(); return v.length >= 3 && v.length <= 150 && /^[A-Za-z0-9 ]+$/.test(v); },
    // Password: min 8, upper + lower + number + special character
    password: function (v) { return /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).{8,}$/.test(String(v || "")); },
    // Whole number between min and max
    int: function (v, min, max) { var n = Number(v); return String(v).trim() !== "" && /^[0-9]+$/.test(String(v).trim()) && n >= min && n <= max; }
  };

  /* ---------- Icons (simple outline SVG paths) ---------- */
  var P = {
    home: '<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/>',
    wand: '<path d="M15 4V2M15 10V8M11 6h2M17 6h2"/><path d="M3 21l12-12"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-3.5 3.4-5.5 6.5-5.5s5.7 2 6.5 5.5"/><circle cx="17" cy="9" r="2.5"/><path d="M17.5 14c2 .4 3.4 2 4 4.5"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4.2-6.5 8-6.5s7 2.5 8 6.5"/>',
    alert: '<path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18v.5"/>',
    key: '<circle cx="8" cy="15" r="4"/><path d="M11 12l9-9M17 6l3 3M15 8l2 2"/>',
    gate: '<path d="M8 4L3 12l5 8M16 4l5 8-5 8"/>',
    sliders: '<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>',
    report: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    building: '<rect x="4" y="3" width="16" height="18" rx="1"/><path d="M9 7h1M14 7h1M9 11h1M14 11h1M9 15h1M14 15h1M10 21v-3h4v3"/>',
    bell: '<path d="M6 16V11a6 6 0 1112 0v5l2 2H4z"/><path d="M10 20a2 2 0 004 0"/>',
    chevron: '<path d="M6 9l6 6 6-6"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>',
    check: '<path d="M5 12l5 5 9-10"/>',
    checkCircle: '<circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 5-6"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>',
    xCircle: '<circle cx="12" cy="12" r="9"/><path d="M9 9l6 6M15 9l-6 6"/>',
    logout: '<path d="M15 4h4v16h-4"/><path d="M10 8l-4 4 4 4M6 12h11"/>',
    file: '<path d="M14 3H6v18h12V7z"/><path d="M14 3v4h4"/>',
    fileJson: '<path d="M14 3H6v18h12V7z"/><path d="M14 3v4h4"/><path d="M10 12c-1 0-1 1-1 1.5S9 15 8 15c1 0 1 1 1 1.5s0 1.5 1 1.5M14 12c1 0 1 1 1 1.5s0 1.5 1 1.5c-1 0-1 1-1 1.5s0 1.5-1 1.5"/>',
    upload: '<path d="M12 16V4M7 9l5-5 5 5"/><path d="M4 16v4h16v-4"/>',
    download: '<path d="M12 4v12M7 11l5 5 5-5"/><path d="M4 20h16"/>',
    copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V4H4v12h4"/>',
    printer: '<path d="M6 9V3h12v6"/><rect x="3" y="9" width="18" height="8" rx="1"/><path d="M6 14h12v7H6z"/>',
    eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13 7l4 4"/>',
    trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 018 0v3"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
    shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/>',
    shieldCheck: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M8.5 12l2.5 2.5 4.5-5"/>',
    cloud: '<path d="M7 18a5 5 0 01-.6-10A6 6 0 0118 9a4.5 4.5 0 01-1 9z"/>',
    grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
    link: '<path d="M10 14a4 4 0 005.7 0l3-3a4 4 0 00-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 00-5.7 0l-3 3a4 4 0 005.7 5.7l1-1"/>',
    network: '<circle cx="12" cy="5" r="2.5"/><circle cx="5" cy="19" r="2.5"/><circle cx="19" cy="19" r="2.5"/><path d="M12 7.5v4M12 11.5L6.5 17M12 11.5l5.5 5.5"/>',
    database: '<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/>',
    clipboard: '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V3h6v1M9 10h6M9 14h6M9 18h3"/>',
    play: '<circle cx="12" cy="12" r="9"/><path d="M10 8l6 4-6 4z"/>',
    map: '<path d="M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3z"/><path d="M9 3v15M15 6v15"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z"/>',
    code: '<path d="M8 6l-6 6 6 6M16 6l6 6-6 6"/>',
    layers: '<path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5"/>',
    arrowRight: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    arrowLeft: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>',
    activity: '<path d="M3 12h4l3-8 4 16 3-8h4"/>',
    filter: '<path d="M3 5h18l-7 8v6l-4 2v-8z"/>',
    refresh: '<path d="M20 11a8 8 0 10-2.3 5.7"/><path d="M20 4v7h-7"/>',
    trend: '<path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
    target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
    api: '<path d="M4 8h16M4 16h16"/><circle cx="8" cy="8" r="2"/><circle cx="16" cy="16" r="2"/>',
    power: '<path d="M12 3v9"/><path d="M6.3 7a8 8 0 1011.4 0"/>'
  };
  SS.icon = function (name, cls) {
    return '<svg class="ic ' + (cls || "") + '" viewBox="0 0 24 24" aria-hidden="true">' + (P[name] || P.info) + "</svg>";
  };

  /* Any element with data-i="iconName" gets that icon put inside it */
  SS.fillIcons = function (root) {
    SS.$$("[data-i]", root).forEach(function (el) {
      if (el.getAttribute("data-i-done")) return;
      el.insertAdjacentHTML("afterbegin", SS.icon(el.getAttribute("data-i"), el.classList.contains("ic-lg") ? "ic-lg" : ""));
      el.setAttribute("data-i-done", "1");
    });
  };
})(window.SS);
