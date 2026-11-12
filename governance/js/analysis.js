/* =========================================================
   Governance - analysis.js  (governance/analysis.html)
   4 step wizard: Upload -> Validate -> Run -> Results
   ========================================================= */
(function () {
  "use strict";
  if (!SS.session.current) return;

  var companies = SS.GOV.load("companies");
  var files = [
    { key: "assign", title: "Role Assignments (JSON)", file: "role-assignments.json", size: "248 KB", done: true },
    { key: "activity", title: "Activity Log (JSON)", file: "activity-log-90d.json", size: "18.4 MB", done: true },
    { key: "catalog", title: "Roles Catalog (JSON)", file: "", size: "", done: false }
  ];
  var step = 1;
  var timers = [];

  SS.$("#company").innerHTML = companies.map(function (c) { return "<option>" + SS.esc(c.name) + "</option>"; }).join("");

  /* ---------- Fixed analysis period (From / To) ---------- */
  function iso(d) { return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2); }
  function us(isoStr) { var p = isoStr.split("-"); return p[1] + "/" + p[2] + "/" + p[0]; }
  var today = new Date();
  SS.$("#p-to").max = iso(today); SS.$("#p-from").max = iso(today);
  var defDays = parseInt((SS.GOV.load("rules").window || "90").replace(/\D/g, ""), 10) || 90;
  if ([30, 60, 90].indexOf(defDays) > -1) SS.$("#period").value = String(defDays);
  function applyPreset() {
    var v = SS.$("#period").value;
    var custom = v === "custom";
    SS.$("#p-from").disabled = !custom; SS.$("#p-to").disabled = !custom;
    if (!custom) {
      var to = new Date(today); to.setDate(to.getDate() - 1);
      var from = new Date(to); from.setDate(from.getDate() - parseInt(v, 10) + 1);
      SS.$("#p-from").value = iso(from); SS.$("#p-to").value = iso(to);
    }
    checkPeriod();
  }
  /* returns {ok, days, text, error} */
  function periodInfo() {
    var f = SS.$("#p-from").value, t = SS.$("#p-to").value;
    if (!f || !t) return { ok: false, error: "Choose both From and To dates" };
    var df = new Date(f + "T00:00:00"), dt = new Date(t + "T00:00:00");
    var days = Math.round((dt - df) / 86400000) + 1;
    if (dt > today) return { ok: false, error: "To date cannot be in the future" };
    if (days < 1) return { ok: false, error: "From date must be before To date" };
    if (days < 7) return { ok: false, error: "Period must be at least 7 days" };
    if (days > 180) return { ok: false, error: "Period cannot be longer than 180 days" };
    return { ok: true, days: days, text: us(f) + " - " + us(t) };
  }
  function checkPeriod() {
    var p = periodInfo();
    SS.$("#period-summary").innerHTML = p.ok ? "<b>" + p.text + "</b> · " + p.days + " days" : '<span class="error-text">' + p.error + "</span>";
    renderNext();
  }
  SS.$("#period").addEventListener("change", applyPreset);
  SS.$("#p-from").addEventListener("change", checkPeriod);
  SS.$("#p-to").addEventListener("change", checkPeriod);
  function renderNext() {
    var all = files.every(function (f) { return f.done; });
    SS.$("#btn-next-1").disabled = !(all && periodInfo().ok);
  }

  /* ---------- Step 1: uploads ---------- */
  function renderUploads() {
    SS.$("#uploads").innerHTML = files.map(function (f, i) {
      return '<div class="upload ' + (f.done ? "ok" : "") + '" id="up-' + f.key + '">' +
        '<div class="u-head">' + SS.icon("fileJson") + f.title + "</div>" +
        '<div class="u-file">' + (f.done
          ? SS.icon("file") + "<div><b>" + SS.esc(f.file) + "</b><small>" + f.size + "</small></div>"
          : '<span class="muted">No file selected</span>') + "</div>" +
        '<div class="row-between">' +
          (f.done ? '<span class="badge badge-solid">' + SS.icon("check") + "Uploaded</span>" : '<span class="badge badge-soft">' + SS.icon("clock") + "Pending</span>") +
          '<span class="row" style="gap:6px">' +
            (f.done ? '<button class="btn btn-ghost btn-sm" data-remove="' + i + '">Remove</button>'
                    : '<button class="btn btn-ghost btn-sm" data-sample="' + i + '">Use sample</button><label class="btn btn-outline btn-sm" for="file-' + f.key + '">Choose File</label>') +
          "</span></div>" +
        '<input type="file" accept=".json,application/json" id="file-' + f.key + '" data-file="' + i + '">' +
      "</div>";
    }).join("");

    SS.$$("[data-file]").forEach(function (inp) {
      inp.addEventListener("change", function () {
        var f = files[parseInt(inp.getAttribute("data-file"), 10)];
        var picked = inp.files && inp.files[0];
        if (!picked) return;
        if (!/\.json$/i.test(picked.name)) { SS.ui.toast("Please choose a .json file", "alert"); return; }
        f.file = picked.name;
        f.size = picked.size > 1048576 ? (picked.size / 1048576).toFixed(1) + " MB" : Math.max(1, Math.round(picked.size / 1024)) + " KB";
        f.done = true;
        renderUploads();
        SS.ui.toast(picked.name + " uploaded");
      });
    });
    SS.$$("[data-sample]").forEach(function (b) {
      b.addEventListener("click", function () {
        var f = files[parseInt(b.getAttribute("data-sample"), 10)];
        f.file = f.key === "catalog" ? "roles-catalog.json" : f.key === "assign" ? "role-assignments.json" : "activity-log-90d.json";
        f.size = f.key === "catalog" ? "1.2 MB" : f.key === "assign" ? "248 KB" : "18.4 MB";
        f.done = true;
        renderUploads();
        SS.ui.toast(f.file + " uploaded");
      });
    });
    SS.$$("[data-remove]").forEach(function (b) {
      b.addEventListener("click", function () {
        var f = files[parseInt(b.getAttribute("data-remove"), 10)];
        f.done = false; f.file = ""; f.size = "";
        renderUploads();
      });
    });
    renderNext();
  }

  /* ---------- Step switching ---------- */
  function goStep(n) {
    step = n;
    SS.$$(".step").forEach(function (el) {
      var k = parseInt(el.getAttribute("data-step"), 10);
      el.classList.toggle("active", k === n);
      el.classList.toggle("done", k < n);
      el.querySelector(".dot").innerHTML = k < n ? SS.icon("check") : k;
    });
    SS.$$("[data-panel]").forEach(function (p) { p.classList.toggle("hidden", parseInt(p.getAttribute("data-panel"), 10) !== n); });
    if (n === 2) runValidation();
    if (n === 3) runAnalysis();
    window.scrollTo(0, 0);
  }

  function clearTimers() { timers.forEach(clearTimeout); timers = []; }

  /* ---------- Step 2: validation ---------- */
  function runValidation() {
    clearTimers();
    var checks = [
      ["Schema validation", "All 3 files match the expected JSON structure"],
      ["Missing fields check", "principalId, roleDefinitionId and scope present in every record"],
      ["Duplicate data check", "0 duplicate role assignments found"],
      ["Activity coverage", "Activity Log covers " + periodInfo().text + " (" + periodInfo().days + " days) for " + SS.$("#company").value]
    ];
    SS.$("#btn-next-2").disabled = true;
    SS.$("#checks").innerHTML = checks.map(function (c, i) {
      return '<div class="check-row" id="chk-' + i + '"><span class="st"></span><div class="grow"><b>' + c[0] + "</b><small>Waiting...</small></div></div>";
    }).join("");
    checks.forEach(function (c, i) {
      timers.push(setTimeout(function () {
        var row = SS.$("#chk-" + i); row.classList.add("run");
        SS.$("small", row).textContent = "Checking...";
      }, i * 450));
      timers.push(setTimeout(function () {
        var row = SS.$("#chk-" + i); row.classList.remove("run"); row.classList.add("ok");
        SS.$(".st", row).innerHTML = SS.icon("check");
        SS.$("small", row).textContent = c[1];
        if (i === checks.length - 1) { SS.$("#btn-next-2").disabled = false; SS.ui.toast("Validation passed"); }
      }, i * 450 + 400));
    });
  }

  /* ---------- Step 3: analysis ---------- */
  function runAnalysis() {
    clearTimers();
    var stages = ["Data Processing & Validation", "Identity & Permission Analysis", "Usage & Telemetry Assessment",
                  "Over-Privilege & Evidence Scoring", "Recommendation Engine (least-privilege roles)", "Audit & Reporting"];
    SS.$("#stages").innerHTML = stages.map(function (st, i) {
      return '<div class="check-row" id="stg-' + i + '"><span class="st"></span><div class="grow"><b>' + st + "</b></div></div>";
    }).join("");
    var pct = 0;
    stages.forEach(function (st, i) {
      timers.push(setTimeout(function () {
        SS.$("#stg-" + i).classList.add("run");
        SS.$("#progress-text").textContent = st + "...";
      }, i * 420));
      timers.push(setTimeout(function () {
        var row = SS.$("#stg-" + i); row.classList.remove("run"); row.classList.add("ok");
        SS.$(".st", row).innerHTML = SS.icon("check");
        pct = Math.round(((i + 1) / stages.length) * 100);
        SS.$("#progress-fill").style.width = pct + "%";
        SS.$("#progress-pct").textContent = pct + "%";
        if (i === stages.length - 1) { SS.$("#progress-text").textContent = "Done"; timers.push(setTimeout(finish, 350)); }
      }, i * 420 + 380));
    });
  }

  function finish() {
    var name = SS.$("#company").value;
    var c = companies.filter(function (x) { return x.name === name; })[0];
    var analyses = SS.GOV.load("analyses");
    var id = "AN-2026-" + String(1111 + analyses.length);
    var p = periodInfo();
    var rec = { id: id, company: name, date: SS.now(), period: p.text, days: p.days, identities: c.identities, avg: c.avg, status: "Complete" };
    analyses.unshift(rec);
    SS.GOV.save("analyses", analyses);
    c.last = SS.today();
    SS.GOV.save("companies", companies);

    SS.$("#r-id").textContent = id;
    SS.$("#r-date").textContent = rec.date;
    SS.$("#r-company").textContent = name;
    SS.$("#r-period").textContent = p.text + " (" + p.days + " days)";
    SS.$("#r-ids").textContent = c.identities;
    SS.$("#r-avg").textContent = c.avg;
    SS.$("#r-risk").textContent = c.highRisk;
    SS.$("#r-roles").textContent = c.identities;
    goStep(4);
  }

  /* ---------- Buttons ---------- */
  SS.$("#btn-next-1").addEventListener("click", function () { goStep(2); });
  SS.$("#btn-back-2").addEventListener("click", function () { clearTimers(); goStep(1); });
  SS.$("#btn-next-2").addEventListener("click", function () { goStep(3); });
  SS.$("#btn-again").addEventListener("click", function () {
    files[2].done = false; files[2].file = ""; files[2].size = "";
    renderUploads(); SS.$("#progress-fill").style.width = "0"; SS.$("#progress-pct").textContent = "0%";
    goStep(1);
  });
  SS.$("#btn-cancel-1").addEventListener("click", function () {
    SS.ui.confirm({ title: "Cancel analysis?", message: "Uploaded files will be cleared and you will return to the dashboard.",
      okLabel: "Yes, cancel", onOk: function () { SS.go("governance/dashboard.html"); } });
  });
  SS.$("#btn-previous").addEventListener("click", function () {
    var list = SS.GOV.load("analyses");
    SS.ui.modal({
      title: "Previous Analyses", wide: true,
      body: '<div class="table-wrap"><table class="table"><thead><tr><th>Analysis ID</th><th>Company</th><th>Period</th><th>Completed</th><th>Identities</th><th>Avg Score</th><th>Status</th></tr></thead><tbody>' +
        list.map(function (a) {
          return "<tr><td><b>" + a.id + "</b></td><td>" + SS.esc(a.company) + "</td><td>" + (a.period || "-") + "</td><td>" + a.date + "</td><td>" + a.identities + "</td><td>" + a.avg + "</td><td>" + SS.ui.badge(a.status) + "</td></tr>";
        }).join("") + "</tbody></table></div>"
    });
  });

  renderUploads();
  applyPreset();
  goStep(1);
})();
