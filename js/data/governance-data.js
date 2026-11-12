/* =========================================================
   SecureShift - governance-data.js
   Hardcoded data for the Cloud Governance product.
   Pages read this through SS.store so edits survive refresh.
   ========================================================= */

window.SS = window.SS || {};

SS.GOV = {};

SS.GOV.trend = {
  labels: ["Jun", "Jul", "Aug", "Sep", "Oct", "Nov"],
  values: [82, 76, 71, 66, 60, 54]
};

SS.GOV.trend12 = {
  labels: ["Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov"],
  values: [90, 89, 87, 86, 84, 83, 82, 76, 71, 66, 60, 54]
};

/* ---------- Identities ---------- */
SS.GOV.identities = [
  { id: "svc-webapp-deploy", name: "Web App Deploy Pipeline", type: "Service Principal", role: "Contributor", scope: "Subscription", granted: 1850, used: 12, score: 91 },
  { id: "rahul.verma", name: "Rahul Verma", type: "User", role: "Owner", scope: "Subscription", granted: 2100, used: 40, score: 88 },
  { id: "priya.sharma", name: "Priya Sharma", type: "User", role: "Contributor", scope: "rg-sales", granted: 1850, used: 95, score: 71 },
  { id: "svc-data-pipeline", name: "Data Pipeline Service", type: "Service Principal", role: "VM Contributor", scope: "rg-data", granted: 210, used: 60, score: 48 },
  { id: "mi-orders-api", name: "Orders API (Managed)", type: "Managed Identity", role: "Reader", scope: "rg-orders", granted: 320, used: 280, score: 12 },
  { id: "svc-backup", name: "Backup Service", type: "Service Principal", role: "Backup Contributor", scope: "rg-backup", granted: 140, used: 120, score: 8 },
  { id: "neha.kulkarni", name: "Neha Kulkarni", type: "User", role: "Network Contributor", scope: "rg-network", granted: 260, used: 70, score: 55 },
  { id: "mi-reports-func", name: "Reports Function (Managed)", type: "Managed Identity", role: "Contributor", scope: "rg-reports", granted: 1850, used: 30, score: 80 },
  { id: "amit.joshi", name: "Amit Joshi", type: "User", role: "Contributor", scope: "rg-hr", granted: 1850, used: 210, score: 66 },
  { id: "svc-aks-ops", name: "AKS Operations Service", type: "Service Principal", role: "AKS Contributor", scope: "rg-aks", granted: 410, used: 150, score: 44 },
  { id: "kavya.iyer", name: "Kavya Iyer", type: "User", role: "Reader", scope: "Subscription", granted: 320, used: 300, score: 6 },
  { id: "mi-billing-job", name: "Billing Job (Managed)", type: "Managed Identity", role: "Storage Blob Contributor", scope: "rg-billing", granted: 95, used: 40, score: 39 },
  { id: "svc-github-ci", name: "GitHub CI Pipeline", type: "Service Principal", role: "Owner", scope: "rg-webapp-prod", granted: 2100, used: 25, score: 84 },
  { id: "rohan.desai", name: "Rohan Desai", type: "User", role: "SQL DB Contributor", scope: "rg-data", granted: 180, used: 110, score: 33 },
  { id: "mi-notify-func", name: "Notify Function (Managed)", type: "Managed Identity", role: "Contributor", scope: "rg-notify", granted: 1850, used: 52, score: 77 },
  { id: "sneha.patil", name: "Sneha Patil", type: "User", role: "Key Vault Officer", scope: "rg-security", granted: 70, used: 22, score: 52 }
];

/* Fill up to 128 identities (the analysed total). Every identity has a
   user name (id, used to sign in) and a display name. */
(function () {
  var first = ["Ankit", "Pooja", "Vikas", "Sonal", "Deepak", "Meera", "Tushar", "Nisha", "Rajesh", "Shruti", "Gaurav", "Komal", "Sagar", "Swati",
               "Aditya", "Bhavna", "Chetan", "Divya", "Harish", "Isha", "Jayesh", "Kiran", "Lata", "Manoj", "Nikhil", "Omkar"];
  var last = ["Kulkarni", "Patil", "Deshmukh", "Joshi", "Shinde", "Pawar", "Gupta", "Nair", "Rao", "Mehta", "Iyer", "Chavan", "Jadhav", "Bhosale", "Reddy"];
  var apps = ["billing", "catalog", "search", "media", "audit", "crm", "inventory", "payments", "hr", "logs", "ml", "etl"];
  var userRoles = ["Reader", "Contributor", "Website Contributor", "Monitoring Reader", "SQL DB Contributor", "Key Vault Reader"];
  var appRoles = ["Storage Blob Reader", "Contributor", "Website Contributor", "Monitoring Reader"];
  var used = {};
  SS.GOV.identities.forEach(function (i) { used[i.id] = true; });
  var seed = 7;
  function rnd() { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }
  for (var i = SS.GOV.identities.length; i < 128; i++) {
    var t = i % 4 === 0 ? "Service Principal" : i % 4 === 1 ? "Managed Identity" : "User";
    var id, name;
    if (t === "User") {
      var fn = first[i % first.length], ln = last[(i * 7) % last.length];
      id = (fn + "." + ln).toLowerCase(); name = fn + " " + ln;
      var n = 2; while (used[id]) { id = (fn + "." + ln).toLowerCase() + n; n++; }
    } else {
      var app = apps[i % apps.length];
      id = (t === "Service Principal" ? "svc-" : "mi-") + app + "-" + String(i).padStart(3, "0");
      name = app.charAt(0).toUpperCase() + app.slice(1) + (t === "Service Principal" ? " Service" : " Function (Managed)");
    }
    used[id] = true;
    var granted = [95, 140, 210, 320, 410, 1850][Math.floor(rnd() * 6)];
    var score = Math.floor(rnd() * 64) + 2;
    var usedCount = Math.max(3, Math.round(granted * (1 - score / 100) * 0.9));
    SS.GOV.identities.push({ id: id, name: name, type: t, role: (t === "User" ? userRoles : appRoles)[i % 6 % (t === "User" ? 6 : 4)],
      scope: "rg-" + apps[i % apps.length], granted: granted, used: usedCount, score: score });
  }
})();

/* Display helpers: "Rahul Verma" + "rahul.verma@northwindtraders.com" */
SS.GOV.upn = function (idt) { return idt.type === "User" ? idt.id + "@northwindtraders.com" : idt.id; };
SS.GOV.identityCell = function (idt) {
  return "<b>" + SS.esc(idt.name) + '</b><div class="small muted mono">' + SS.esc(SS.GOV.upn(idt)) + "</div>";
};
SS.GOV.byId = function (id) { return SS.GOV.identities.filter(function (i) { return i.id === id; })[0]; };

SS.GOV.riskOf = function (score) { return score >= 70 ? "HIGH" : score >= 40 ? "MEDIUM" : "LOW"; };

/* ---------- Detail for the main demo identity ---------- */
SS.GOV.detail = {
  "svc-webapp-deploy": {
    signals: [
      { signal: "Unused permission ratio", value: "99%", weight: "50%" },
      { signal: "Unused high-risk actions", value: "7", weight: "30%" },
      { signal: "Scope breadth", value: "Subscription (work in 1 resource group)", weight: "20%" }
    ],
    usedPerms: [
      { action: "Microsoft.Web/sites/write", first: "08/14/2026", last: "11/09/2026", events: 46, rg: "rg-webapp-prod" },
      { action: "Microsoft.Web/sites/config/write", first: "08/14/2026", last: "11/09/2026", events: 31, rg: "rg-webapp-prod" },
      { action: "Microsoft.Web/sites/slots/write", first: "08/20/2026", last: "11/08/2026", events: 18, rg: "rg-webapp-prod" },
      { action: "Microsoft.Web/sites/restart/action", first: "09/01/2026", last: "11/07/2026", events: 9, rg: "rg-webapp-prod" },
      { action: "Microsoft.Resources/deployments/write", first: "08/14/2026", last: "11/09/2026", events: 52, rg: "rg-webapp-prod" },
      { action: "Microsoft.Web/sites/read", first: "08/14/2026", last: "11/10/2026", events: 212, rg: "rg-webapp-prod" },
      { action: "Microsoft.Web/sites/config/read", first: "08/14/2026", last: "11/10/2026", events: 140, rg: "rg-webapp-prod" },
      { action: "Microsoft.Web/serverfarms/read", first: "08/15/2026", last: "11/09/2026", events: 64, rg: "rg-webapp-prod" },
      { action: "Microsoft.Insights/components/read", first: "08/18/2026", last: "11/09/2026", events: 27, rg: "rg-webapp-prod" },
      { action: "Microsoft.Resources/deployments/read", first: "08/14/2026", last: "11/09/2026", events: 52, rg: "rg-webapp-prod" },
      { action: "Microsoft.Web/sites/slots/read", first: "08/20/2026", last: "11/08/2026", events: 18, rg: "rg-webapp-prod" },
      { action: "Microsoft.Resources/subscriptions/resourceGroups/read", first: "08/14/2026", last: "11/10/2026", events: 88, rg: "rg-webapp-prod" }
    ],
    unusedHighRisk: [
      "Microsoft.Compute/virtualMachines/delete",
      "Microsoft.Network/networkSecurityGroups/write",
      "Microsoft.KeyVault/vaults/write",
      "Microsoft.Authorization/roleAssignments/write",
      "Microsoft.Sql/servers/databases/delete",
      "Microsoft.Storage/storageAccounts/delete",
      "Microsoft.Network/virtualNetworks/delete"
    ],
    suggestedScope: "rg-webapp-prod"
  }
};

/* Build a believable detail for any other identity */
SS.GOV.getDetail = function (idt) {
  if (SS.GOV.detail[idt.id]) return SS.GOV.detail[idt.id];
  var rg = idt.scope === "Subscription" ? "rg-" + idt.id.split(/[.-]/)[0] : idt.scope;
  var base = ["Microsoft.Resources/deployments/write", "Microsoft.Resources/subscriptions/resourceGroups/read",
              "Microsoft.Storage/storageAccounts/read", "Microsoft.Web/sites/read", "Microsoft.Insights/metrics/read"];
  var risky = ["Microsoft.Compute/virtualMachines/delete", "Microsoft.Authorization/roleAssignments/write",
               "Microsoft.KeyVault/vaults/write", "Microsoft.Network/networkSecurityGroups/write",
               "Microsoft.Storage/storageAccounts/delete"];
  var nRisk = idt.score >= 70 ? 5 : idt.score >= 40 ? 3 : 1;
  var ratio = Math.round((1 - idt.used / idt.granted) * 100);
  return {
    signals: [
      { signal: "Unused permission ratio", value: ratio + "%", weight: "50%" },
      { signal: "Unused high-risk actions", value: String(nRisk), weight: "30%" },
      { signal: "Scope breadth", value: idt.scope === "Subscription" ? "Subscription (work in 1 resource group)" : "Resource group", weight: "20%" }
    ],
    usedPerms: base.map(function (a, i) {
      return { action: a, first: "08/1" + i + "/2026", last: "11/0" + (9 - i) + "/2026", events: 60 - i * 9, rg: rg };
    }),
    unusedHighRisk: risky.slice(0, nRisk),
    suggestedScope: rg
  };
};

SS.GOV.evidence = function (action, rg) {
  return [
    { ts: "11/09/2026 14:32:10", caller: "svc-webapp-deploy", resource: rg + "/app-portal-prod", status: "Succeeded" },
    { ts: "11/08/2026 09:15:44", caller: "svc-webapp-deploy", resource: rg + "/app-portal-prod", status: "Succeeded" },
    { ts: "11/05/2026 18:02:31", caller: "svc-webapp-deploy", resource: rg + "/app-api-prod", status: "Succeeded" },
    { ts: "11/01/2026 11:47:09", caller: "svc-webapp-deploy", resource: rg + "/app-portal-prod", status: "Succeeded" }
  ];
};

/* ---------- High-risk findings (37 total) ---------- */
SS.GOV.findings = (function () {
  var rows = [
    ["svc-webapp-deploy", "Microsoft.Compute/virtualMachines/delete", "Delete", "Contributor", "HIGH"],
    ["svc-webapp-deploy", "Microsoft.Network/networkSecurityGroups/write", "Network", "Contributor", "HIGH"],
    ["rahul.verma", "Microsoft.Authorization/roleAssignments/write", "Role Assignment", "Owner", "HIGH"],
    ["rahul.verma", "Microsoft.KeyVault/vaults/write", "Key Vault", "Owner", "HIGH"],
    ["priya.sharma", "Microsoft.Sql/servers/databases/delete", "Delete", "Contributor", "HIGH"],
    ["mi-reports-func", "Microsoft.Storage/storageAccounts/delete", "Delete", "Contributor", "MEDIUM"]
  ];
  var ids = ["svc-webapp-deploy", "rahul.verma", "priya.sharma", "mi-reports-func", "svc-github-ci", "mi-notify-func", "amit.joshi", "neha.kulkarni"];
  var roleOf = { "svc-webapp-deploy": "Contributor", "rahul.verma": "Owner", "priya.sharma": "Contributor", "mi-reports-func": "Contributor",
                 "svc-github-ci": "Owner", "mi-notify-func": "Contributor", "amit.joshi": "Contributor", "neha.kulkarni": "Network Contributor" };
  var pool = [
    ["Microsoft.Compute/disks/delete", "Delete"], ["Microsoft.Network/virtualNetworks/delete", "Delete"],
    ["Microsoft.Network/networkSecurityGroups/securityRules/write", "Network"], ["Microsoft.KeyVault/vaults/secrets/write", "Key Vault"],
    ["Microsoft.Authorization/roleAssignments/write", "Role Assignment"], ["Microsoft.Web/sites/delete", "Delete"],
    ["Microsoft.KeyVault/vaults/delete", "Key Vault"], ["Microsoft.Network/networkSecurityGroups/delete", "Network"]
  ];
  // target counts: Delete 14, Network 8, Key Vault 7, Role Assignment 8
  var need = { "Delete": 14, "Network": 8, "Key Vault": 7, "Role Assignment": 8 };
  rows.forEach(function (r) { need[r[2]]--; });
  var i = 0;
  while (rows.length < 37) {
    var p = pool[i % pool.length];
    if (need[p[1]] > 0) {
      var who = ids[i % ids.length];
      rows.push([who, p[0], p[1], roleOf[who], i % 3 === 0 ? "MEDIUM" : "HIGH"]);
      need[p[1]]--;
    }
    i++;
  }
  return rows.map(function (r, n) {
    return { id: "F-" + (n + 1), identity: r[0], action: r[1], category: r[2], lastUsed: "Never", role: r[3], severity: r[4], status: "Open" };
  });
})();

/* ---------- Generated roles ---------- */
SS.GOV.roles = [
  { id: "svc-webapp-deploy-custom-role", identity: "svc-webapp-deploy", original: "Contributor (Subscription)", scope: "rg-webapp-prod", actions: 12, reviewed: false,
    rare: ["Microsoft.Web/sites/delete - used once, 85 days ago", "Microsoft.Web/sites/backup/action - used once, 70 days ago"] },
  { id: "rahul.verma-custom-role", identity: "rahul.verma", original: "Owner (Subscription)", scope: "rg-finance", actions: 40, reviewed: false,
    rare: ["Microsoft.Authorization/policyAssignments/write - used once, 60 days ago"] },
  { id: "priya.sharma-custom-role", identity: "priya.sharma", original: "Contributor (rg-sales)", scope: "rg-sales", actions: 95, reviewed: false, rare: [] },
  { id: "svc-data-pipeline-custom-role", identity: "svc-data-pipeline", original: "VM Contributor (rg-data)", scope: "rg-data", actions: 60, reviewed: true,
    rare: ["Microsoft.Compute/virtualMachines/deallocate/action - used twice, 40 days ago"] },
  { id: "mi-reports-func-custom-role", identity: "mi-reports-func", original: "Contributor (rg-reports)", scope: "rg-reports", actions: 30, reviewed: false, rare: [] }
];

/* ---------- Reports ---------- */
SS.GOV.reports = [
  { id: "RPT-1110", company: "Northwind Traders", date: "11/10/2026", identities: 128, avg: 54, highRisk: 37 },
  { id: "RPT-1103", company: "Northwind Traders", date: "11/03/2026", identities: 126, avg: 57, highRisk: 41 },
  { id: "RPT-1027", company: "Contoso Retail", date: "10/27/2026", identities: 74, avg: 49, highRisk: 21 },
  { id: "RPT-1020", company: "Fabrikam Logistics", date: "10/20/2026", identities: 91, avg: 62, highRisk: 30 }
];

/* ---------- Rules (rules.json) ---------- */
SS.GOV.rules = {
  weights: { unused: 50, highRisk: 30, scope: 20 },
  patterns: [
    { p: "*/delete", on: true },
    { p: "Microsoft.Authorization/*/write", on: true },
    { p: "Microsoft.KeyVault/*", on: true },
    { p: "Microsoft.Network/networkSecurityGroups/write", on: true }
  ],
  window: "90 days",
  baselineRead: true,
  rareThreshold: 3
};

/* ---------- Companies ---------- */
SS.GOV.companies = [
  { name: "Northwind Traders", identities: 128, avg: 54, highRisk: 37, last: "11/10/2026" },
  { name: "Contoso Retail", identities: 74, avg: 49, highRisk: 21, last: "10/27/2026" },
  { name: "Fabrikam Logistics", identities: 91, avg: 62, highRisk: 30, last: "10/20/2026" },
  { name: "Tailspin Airlines", identities: 66, avg: 41, highRisk: 15, last: "10/18/2026" },
  { name: "Adventure Works", identities: 83, avg: 58, highRisk: 26, last: "10/15/2026" },
  { name: "Litware Health", identities: 59, avg: 35, highRisk: 9, last: "10/12/2026" },
  { name: "Proseware Finance", identities: 102, avg: 67, highRisk: 41, last: "10/10/2026" },
  { name: "Wingtip Media", identities: 48, avg: 38, highRisk: 11, last: "10/08/2026" },
  { name: "Fourth Coffee", identities: 37, avg: 30, highRisk: 6, last: "10/05/2026" },
  { name: "Woodgrove Bank", identities: 117, avg: 71, highRisk: 48, last: "10/02/2026" }
];

SS.GOV.analyses = [
  { id: "AN-2026-1110", company: "Northwind Traders", date: "11/10/2026, 4:12 PM", period: "08/12/2026 - 11/09/2026", days: 90, identities: 128, avg: 54, status: "Complete" },
  { id: "AN-2026-1103", company: "Northwind Traders", date: "11/03/2026, 3:40 PM", period: "08/05/2026 - 11/02/2026", days: 90, identities: 126, avg: 57, status: "Complete" },
  { id: "AN-2026-1027", company: "Contoso Retail", date: "10/27/2026, 11:05 AM", period: "09/27/2026 - 10/26/2026", days: 30, identities: 74, avg: 49, status: "Complete" }
];

SS.GOV.notifications = [
  { text: "Analysis AN-2026-1110 completed for Northwind Traders", time: "Today, 4:12 PM" },
  { text: "4 generated roles are waiting for review", time: "Today, 4:20 PM" },
  { text: "7 new high-risk unused permissions found", time: "Yesterday" }
];

/* ---------- Load / save helpers (edits are kept in the browser) ---------- */
SS.GOV.riskBand = function (avg) { return avg >= 60 ? "HIGH" : avg >= 40 ? "MEDIUM" : "LOW"; };

SS.GOV.load = function (key) { return SS.store.get("gov." + key, SS.GOV[key]); };
SS.GOV.save = function (key, value) { SS.store.set("gov." + key, value); };
