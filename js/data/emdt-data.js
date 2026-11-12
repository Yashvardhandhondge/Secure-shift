/* =========================================================
   SecureShift - emdt-data.js
   Hardcoded data for EMDT (Enterprise Modernization Digital Twin).

   Data model (one enterprise has many applications):
     enterprises  -> registration details + classification inputs (EMSI)
     apps         -> applications of an enterprise (Application Inventory)
     nodes        -> components of an application: Service / Database / API
     links        -> dependency links between nodes (source -> target)
     assessments  -> Technical Debt + Governance Risk per application
     simulations  -> what-if modernization results
     plans        -> plans created from simulations, approved by Executive

   Scores are NOT typed here: emdt-calc.js calculates them.
   ========================================================= */

window.SS = window.SS || {};

SS.EM = {};

/* ---------- Platform users (Super Admin > User Management) ---------- */
SS.EM.users = (function () {
  var base = [
    ["Arya Mujumdar", "Super Admin", "Active"], ["Rohan Kapoor", "Super Admin", "Active"], ["Tejas Pathak", "Executive", "Active"],
    ["Aditya Ghate", "Admin", "Active"], ["Sonal Shende", "Executive", "Active"], ["Sakshi Patil", "Architect", "Inactive"],
    ["Vivek Randive", "Admin", "Active"], ["Aditi Jain", "Executive", "Active"], ["Rohit Kale", "Architect", "Inactive"],
    ["Sneha Gupta", "Admin", "Active"], ["Tanvi Mahore", "Executive", "Active"], ["Sachin Kumar", "Admin", "Active"],
    ["Amanjeet Sharma", "Architect", "Active"], ["Shivanand Kumatekar", "Executive", "Active"], ["Mohit Choudhary", "Architect", "Active"],
    ["Shrinivas Naik", "Architect", "Active"], ["Pooja Kulkarni", "Admin", "Active"], ["Nikhil Bhosale", "Architect", "Inactive"],
    ["Rutuja More", "Executive", "Active"], ["Omkar Jadhav", "Admin", "Active"], ["Isha Deshpande", "Architect", "Active"],
    ["Kunal Shinde", "Executive", "Active"], ["Meera Nair", "Admin", "Active"], ["Divya Rao", "Executive", "Inactive"]
  ];
  return base.map(function (b, i) {
    var parts = b[0].toLowerCase().split(" ");
    return { id: "USR-" + String(i + 1).padStart(3, "0"), name: b[0], email: parts[0] + "." + parts[1] + "@company.com",
             phone: "98765432" + String(10 + i), role: b[1], status: b[2], created: "0" + ((i % 9) + 1) + "/1" + (i % 9) + "/2026" };
  });
})();

SS.EM.auditLogs = [
  { time: "11/11/2026 10:24 AM", user: "Arya Mujumdar", action: "User Created", target: "Rutuja More", detail: "Role: Executive" },
  { time: "11/11/2026 09:51 AM", user: "Arya Mujumdar", action: "Role Changed", target: "Sonal Shende", detail: "Admin → Executive" },
  { time: "11/10/2026 06:40 PM", user: "Arya Mujumdar", action: "Account Deactivated", target: "Rohit Kale", detail: "Left project" },
  { time: "11/10/2026 04:12 PM", user: "Sachin Kumar", action: "Enterprise Classified", target: "Northwind Bank", detail: "EMSI calculated" },
  { time: "11/10/2026 11:02 AM", user: "Amanjeet Sharma", action: "Simulation Run", target: "Trade Finance Portal", detail: "Refactor" },
  { time: "11/09/2026 05:33 PM", user: "Shivanand Kumatekar", action: "Plan Approved", target: "PLAN-004", detail: "Online Store" },
  { time: "11/09/2026 02:19 PM", user: "Sachin Kumar", action: "Dependency Added", target: "Payment Service → Customer API", detail: "API" },
  { time: "11/08/2026 10:45 AM", user: "Arya Mujumdar", action: "Password Reset", target: "Aditi Jain", detail: "By admin" }
];

/* ---------- Enterprises (Admin > Dashboard / Classification) ---------- */
SS.EM.enterprises = [
  { id: "ENT-001", name: "Northwind Bank", industry: "Banking", city: "Mumbai", contact: "Ravi Menon",
    email: "ravi.menon@northwindbank.com", phone: "9820012345", registered: "09/15/2026", classifiedOn: "11/10/2026",
    classification: { totalApps: 120, deps: 180, apis: 60, dbs: 22, storageGB: 8000, envs: 4, units: 8,
      techs: ["Java", ".NET", "COBOL"], users: 850, crit: { low: 10, medium: 30, high: 50, critical: 30 },
      policies: ["GDPR", "PCI DSS", "ISO 27001", "SOC 2"], cloud: "Hybrid Cloud", loc: 4500000 } },
  { id: "ENT-002", name: "Contoso Retail", industry: "Retail", city: "Pune", contact: "Neha Bansal",
    email: "neha.bansal@contosoretail.com", phone: "9876501234", registered: "10/02/2026", classifiedOn: "10/20/2026",
    classification: { totalApps: 40, deps: 60, apis: 25, dbs: 8, storageGB: 900, envs: 3, units: 3,
      techs: ["Java", "PHP"], users: 300, crit: { low: 10, medium: 15, high: 10, critical: 5 },
      policies: ["PCI DSS", "ISO 27001"], cloud: "Public Cloud", loc: 800000 } },
  { id: "ENT-003", name: "Fabrikam Health", industry: "Healthcare", city: "Bengaluru", contact: "Arjun Rao",
    email: "arjun.rao@fabrikamhealth.com", phone: "9988776655", registered: "11/08/2026", classifiedOn: "",
    classification: null }
];

/* ---------- Applications (Application Inventory) ----------
   support: Supported | Extended | Unsupported      downtime: Low | Medium | High (tolerance)
   compliance: number of compliance policies that apply to this application            */
SS.EM.apps = [
  { id: "APP-001", ent: "ENT-001", name: "Trade Finance Portal", tech: ".NET", framework: ".NET Framework 4.5", support: "Unsupported", age: 14,
    criticality: "Critical", sensitive: "Yes", securityIssues: 4, downtime: "Low", compliance: 2, deployment: "On-Premise",
    docQuality: "Poor", complexity: "High", loc: 1200000, status: "Legacy", unit: "Corporate Banking", owner: "Trade Team" },
  { id: "APP-002", ent: "ENT-001", name: "Customer360", tech: ".NET", framework: ".NET 6", support: "Extended", age: 6,
    criticality: "High", sensitive: "Yes", securityIssues: 2, downtime: "Medium", compliance: 2, deployment: "Private Cloud",
    docQuality: "Average", complexity: "Medium", loc: 450000, status: "Active", unit: "Retail Banking", owner: "Digital Team" },
  { id: "APP-003", ent: "ENT-001", name: "Payment Gateway", tech: "Java", framework: "Java 11", support: "Supported", age: 7,
    criticality: "Critical", sensitive: "Yes", securityIssues: 3, downtime: "Low", compliance: 3, deployment: "Hybrid Cloud",
    docQuality: "Average", complexity: "High", loc: 900000, status: "Active", unit: "Payments", owner: "Payments Team" },
  { id: "APP-004", ent: "ENT-001", name: "Core Banking", tech: "COBOL", framework: "COBOL 85", support: "Unsupported", age: 22,
    criticality: "Critical", sensitive: "Yes", securityIssues: 6, downtime: "Low", compliance: 4, deployment: "On-Premise",
    docQuality: "Poor", complexity: "High", loc: 3500000, status: "Legacy", unit: "Core Banking", owner: "Mainframe Team" },
  { id: "APP-005", ent: "ENT-001", name: "Reporting Hub", tech: "Java", framework: "Java 8", support: "Extended", age: 9,
    criticality: "Medium", sensitive: "No", securityIssues: 1, downtime: "High", compliance: 1, deployment: "Private Cloud",
    docQuality: "Good", complexity: "Medium", loc: 300000, status: "Active", unit: "Analytics", owner: "Data Team" },
  { id: "APP-006", ent: "ENT-001", name: "HR System", tech: "PHP", framework: "PHP 7.2", support: "Unsupported", age: 11,
    criticality: "High", sensitive: "Yes", securityIssues: 3, downtime: "Medium", compliance: 2, deployment: "On-Premise",
    docQuality: "Average", complexity: "Medium", loc: 250000, status: "Legacy", unit: "Human Resources", owner: "HR IT" },
  { id: "APP-007", ent: "ENT-002", name: "Online Store", tech: "Java", framework: "Java 17", support: "Supported", age: 4,
    criticality: "Critical", sensitive: "Yes", securityIssues: 2, downtime: "Low", compliance: 1, deployment: "Public Cloud",
    docQuality: "Good", complexity: "Medium", loc: 600000, status: "Active", unit: "E-commerce", owner: "Web Team" },
  { id: "APP-008", ent: "ENT-002", name: "Inventory Manager", tech: "PHP", framework: "PHP 8.1", support: "Supported", age: 5,
    criticality: "High", sensitive: "No", securityIssues: 1, downtime: "Medium", compliance: 1, deployment: "Public Cloud",
    docQuality: "Good", complexity: "Low", loc: 200000, status: "Active", unit: "Operations", owner: "Ops IT" },
  { id: "APP-009", ent: "ENT-002", name: "Loyalty Program", tech: "PHP", framework: "PHP 5.6", support: "Unsupported", age: 10,
    criticality: "Medium", sensitive: "Yes", securityIssues: 4, downtime: "High", compliance: 1, deployment: "On-Premise",
    docQuality: "Poor", complexity: "Medium", loc: 150000, status: "Legacy", unit: "Marketing", owner: "CRM Team" },
  { id: "APP-010", ent: "ENT-002", name: "Supplier Portal", tech: "Java", framework: "Java 8", support: "Extended", age: 8,
    criticality: "Medium", sensitive: "No", securityIssues: 2, downtime: "High", compliance: 1, deployment: "Hybrid Cloud",
    docQuality: "Average", complexity: "Low", loc: 180000, status: "Active", unit: "Procurement", owner: "Vendor IT" }
];

/* ---------- Components (nodes) - each belongs to one application ---------- */
SS.EM.nodes = [
  { id: "N-01", ent: "ENT-001", type: "Service", name: "Authentication Service", app: "APP-002" },
  { id: "N-02", ent: "ENT-001", type: "API", name: "Reporting API", app: "APP-005" },
  { id: "N-03", ent: "ENT-001", type: "Service", name: "Notification Service", app: "APP-002" },
  { id: "N-04", ent: "ENT-001", type: "Database", name: "Trade Database", app: "APP-001" },
  { id: "N-05", ent: "ENT-001", type: "Service", name: "Trade Service", app: "APP-001" },
  { id: "N-06", ent: "ENT-001", type: "API", name: "Customer API", app: "APP-002" },
  { id: "N-07", ent: "ENT-001", type: "Database", name: "Customer Database", app: "APP-002" },
  { id: "N-08", ent: "ENT-001", type: "Service", name: "Payment Service", app: "APP-003" },
  { id: "N-09", ent: "ENT-001", type: "API", name: "Payment API", app: "APP-003" },
  { id: "N-10", ent: "ENT-001", type: "Database", name: "Core Ledger Database", app: "APP-004" },
  { id: "N-11", ent: "ENT-001", type: "API", name: "Banking API", app: "APP-004" },
  { id: "N-12", ent: "ENT-001", type: "Database", name: "Reports Database", app: "APP-005" },
  { id: "N-13", ent: "ENT-001", type: "Service", name: "Payroll Service", app: "APP-006" },
  { id: "N-14", ent: "ENT-001", type: "Database", name: "HR Database", app: "APP-006" },
  { id: "N-15", ent: "ENT-002", type: "Service", name: "Checkout Service", app: "APP-007" },
  { id: "N-16", ent: "ENT-002", type: "API", name: "Product API", app: "APP-008" },
  { id: "N-17", ent: "ENT-002", type: "Database", name: "Orders Database", app: "APP-007" },
  { id: "N-18", ent: "ENT-002", type: "Database", name: "Stock Database", app: "APP-008" },
  { id: "N-19", ent: "ENT-002", type: "Service", name: "Points Service", app: "APP-009" }
];

/* ---------- Dependency links (source depends on target) ----------
   source/target can be an application id (APP-xxx) or a component id (N-xx).
   The dependency type is the type of the TARGET (Application, Service, Database, API). */
SS.EM.links = [
  { id: "DEP-001", ent: "ENT-001", source: "APP-001", target: "N-01", criticality: "Critical", desc: "Login and tokens" },
  { id: "DEP-002", ent: "ENT-001", source: "APP-001", target: "N-02", criticality: "High", desc: "Trade reports" },
  { id: "DEP-003", ent: "ENT-001", source: "APP-001", target: "N-03", criticality: "Medium", desc: "Status alerts" },
  { id: "DEP-004", ent: "ENT-001", source: "N-05", target: "N-04", criticality: "Critical", desc: "Trade records" },
  { id: "DEP-005", ent: "ENT-001", source: "N-06", target: "N-07", criticality: "Critical", desc: "Customer master data" },
  { id: "DEP-006", ent: "ENT-001", source: "APP-002", target: "N-11", criticality: "High", desc: "Account balances" },
  { id: "DEP-007", ent: "ENT-001", source: "N-08", target: "N-06", criticality: "High", desc: "Customer lookup" },
  { id: "DEP-008", ent: "ENT-001", source: "N-08", target: "N-07", criticality: "Critical", desc: "Customer records" },
  { id: "DEP-009", ent: "ENT-001", source: "N-09", target: "N-11", criticality: "Critical", desc: "Ledger posting" },
  { id: "DEP-010", ent: "ENT-001", source: "N-08", target: "N-01", criticality: "High", desc: "Payment authorisation" },
  { id: "DEP-011", ent: "ENT-001", source: "APP-004", target: "N-10", criticality: "Critical", desc: "General ledger" },
  { id: "DEP-012", ent: "ENT-001", source: "N-02", target: "N-12", criticality: "Medium", desc: "Report storage" },
  { id: "DEP-013", ent: "ENT-001", source: "APP-005", target: "APP-004", criticality: "High", desc: "Nightly data extract" },
  { id: "DEP-014", ent: "ENT-001", source: "N-13", target: "N-14", criticality: "High", desc: "Employee records" },
  { id: "DEP-015", ent: "ENT-001", source: "APP-006", target: "N-01", criticality: "Medium", desc: "Single sign-on" },
  { id: "DEP-016", ent: "ENT-002", source: "N-15", target: "N-17", criticality: "Critical", desc: "Order storage" },
  { id: "DEP-017", ent: "ENT-002", source: "N-15", target: "N-16", criticality: "High", desc: "Product prices" },
  { id: "DEP-018", ent: "ENT-002", source: "N-16", target: "N-18", criticality: "Medium", desc: "Stock levels" },
  { id: "DEP-019", ent: "ENT-002", source: "APP-009", target: "N-15", criticality: "Low", desc: "Reward on checkout" },
  { id: "DEP-020", ent: "ENT-002", source: "APP-010", target: "N-16", criticality: "Medium", desc: "Supplier catalogue" }
];

/* ---------- Seeds: emdt-calc.js fills in every score ---------- */
SS.EM.assessments = [
  { id: "ASM-001", app: "APP-001", date: "11/10/2026", by: "Amanjeet Sharma" },
  { id: "ASM-002", app: "APP-003", date: "11/08/2026", by: "Amanjeet Sharma" },
  { id: "ASM-003", app: "APP-005", date: "11/06/2026", by: "Amanjeet Sharma" },
  { id: "ASM-004", app: "APP-007", date: "11/04/2026", by: "Amanjeet Sharma" },
  { id: "ASM-005", app: "APP-006", date: "11/03/2026", by: "Amanjeet Sharma" }
];

SS.EM.simulations = [
  { id: "SIM-001", app: "APP-001", strategy: "Refactor", date: "11/10/2026", by: "Amanjeet Sharma" },
  { id: "SIM-002", app: "APP-003", strategy: "Replatform", date: "11/08/2026", by: "Amanjeet Sharma" },
  { id: "SIM-003", app: "APP-005", strategy: "Rehost", date: "11/06/2026", by: "Amanjeet Sharma" },
  { id: "SIM-004", app: "APP-007", strategy: "Replatform", date: "11/04/2026", by: "Amanjeet Sharma" },
  { id: "SIM-005", app: "APP-006", strategy: "Rebuild", date: "11/03/2026", by: "Amanjeet Sharma" },
  { id: "SIM-006", app: "APP-003", strategy: "Refactor", date: "11/09/2026", by: "Amanjeet Sharma" }
];

SS.EM.plans = [
  { id: "PLAN-001", sim: "SIM-001", status: "Submitted", created: "11/10/2026", submitted: "11/10/2026", by: "Amanjeet Sharma",
    notes: "Refactoring is recommended because the application has high technical debt, critical dependencies and an unsupported framework. Use phased implementation.", execComment: "" },
  { id: "PLAN-002", sim: "SIM-002", status: "Submitted", created: "11/08/2026", submitted: "11/08/2026", by: "Amanjeet Sharma",
    notes: "Move the gateway to a managed Java runtime before the PCI audit.", execComment: "" },
  { id: "PLAN-003", sim: "SIM-003", status: "Submitted", created: "11/06/2026", submitted: "11/07/2026", by: "Amanjeet Sharma",
    notes: "Low-risk quick win - lift and shift reporting.", execComment: "" },
  { id: "PLAN-004", sim: "SIM-004", status: "Approved", created: "11/04/2026", submitted: "11/04/2026", by: "Amanjeet Sharma",
    notes: "", execComment: "Approved. Start after the festive sale." },
  { id: "PLAN-005", sim: "SIM-005", status: "Rejected", created: "11/03/2026", submitted: "11/03/2026", by: "Amanjeet Sharma",
    notes: "Full rebuild of the HR system.", execComment: "Too costly for this year. Evaluate a SaaS HR product first." },
  { id: "PLAN-006", sim: "SIM-006", status: "Draft", created: "11/09/2026", submitted: "", by: "Amanjeet Sharma",
    notes: "Alternative option to compare with PLAN-002.", execComment: "" }
];

/* ---------- Load / save helpers (edits are kept in the browser) ---------- */
SS.EM.load = function (key) { return SS.store.get("em." + key, SS.EM[key]); };
SS.EM.save = function (key, value) { SS.store.set("em." + key, value); };

/* Add a line to the audit log (shown on Super Admin > Audit Logs) */
SS.EM.log = function (action, target, detail) {
  var logs = SS.EM.load("auditLogs");
  var s = SS.session.get() || { name: "System" };
  logs.unshift({ time: SS.now(), user: s.name, action: action, target: target, detail: detail || "" });
  SS.EM.save("auditLogs", logs);
};

/* ---------- Current enterprise (Admin and Architect work inside one enterprise) ---------- */
SS.EM.entId = function () {
  var list = SS.EM.load("enterprises");
  var id = SS.param("ent") || SS.store.get("em.currentEnt", null);
  if (!list.some(function (e) { return e.id === id; })) id = list[0] ? list[0].id : null;
  if (id) SS.store.set("em.currentEnt", id);
  return id;
};
SS.EM.ent = function (id) {
  id = id || SS.EM.entId();
  return SS.EM.load("enterprises").filter(function (e) { return e.id === id; })[0] || null;
};

/* Renders an "Enterprise" dropdown. opts: { onChange(id), label } */
SS.EM.entPicker = function (el, opts) {
  opts = opts || {};
  var list = SS.EM.load("enterprises");
  var cur = SS.EM.entId();
  el.innerHTML = '<div class="ent-picker"><span class="small muted">' + (opts.label || "Enterprise") + '</span><select class="select" id="ent-select" aria-label="Select enterprise">' +
    list.map(function (e) { return '<option value="' + e.id + '"' + (e.id === cur ? " selected" : "") + ">" + SS.esc(e.name) + " (" + e.id + ")</option>"; }).join("") + "</select></div>";
  SS.$("#ent-select", el).addEventListener("change", function () {
    SS.store.set("em.currentEnt", this.value);
    if (opts.onChange) opts.onChange(this.value);
    else window.location.href = window.location.pathname.split("/").pop() + "?ent=" + this.value;
  });
};
