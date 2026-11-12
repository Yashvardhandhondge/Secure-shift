/* =========================================================
   SecureShift - users.js
   Hardcoded demo login accounts for BOTH products.
   Password for every demo account: Secure@123
   ========================================================= */

window.SS = window.SS || {};

SS.DEMO_PASSWORD = "Secure@123";

SS.ACCOUNTS = [
  /* ----- Cloud Governance ----- */
  { id: "U-M01", product: "governance", role: "cloudadmin", roleLabel: "Cloud Admin",
    name: "Aarav Mehta", email: "aarav.mehta@secureshift.io", home: "governance/dashboard.html" },

  /* ----- EMDT (Application Modernization) ----- */
  { id: "U-E01", product: "emdt", role: "superadmin", roleLabel: "Super Admin",
    name: "Arya Mujumdar", email: "arya.mujumdar@secureshift.io", home: "modernization/superadmin-dashboard.html" },
  { id: "U-E02", product: "emdt", role: "admin", roleLabel: "Admin",
    name: "Sachin Kumar", email: "sachin.kumar@secureshift.io", home: "modernization/admin-dashboard.html" },
  { id: "U-E03", product: "emdt", role: "architect", roleLabel: "Architect",
    name: "Amanjeet Sharma", email: "amanjeet.sharma@secureshift.io", home: "modernization/architect-dashboard.html" },
  { id: "U-E04", product: "emdt", role: "executive", roleLabel: "Executive",
    name: "Shivanand Kumatekar", email: "shivanand.kumatekar@secureshift.io", home: "modernization/executive-dashboard.html" }
];

SS.PRODUCTS = {
  governance: { name: "Cloud Governance", short: "Cloud Governance", tag: "Least-Privilege Access Suite",
             title: "Single Source of Truth Access Governance", subtitle: "Azure RBAC Least-Privilege Portal 2026" },
  emdt: { name: "Application Modernization - EMDT", short: "EMDT", tag: "Enterprise Modernization Digital Twin",
          title: "Enterprise Modernization Digital Twin", subtitle: "Plan, simulate and approve modernization 2026" }
};
