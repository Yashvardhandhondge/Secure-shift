# SecureShift: Sprint 1 Prototype (v2)

**Secure Your Cloud. Modernize Your Applications.**
TCS Training · Cloud Domain · Group 3 (Nimbus) + Group 4 (ModernOps)

| Product | Team | What it does |
|---|---|---|
| **Cloud Governance** | Group 3 · Nimbus | Compares the Azure permissions an identity was *given* with what it *used* in a fixed analysis period, gives a 0-100 Over-Privilege Score and builds a least-privilege custom role. |
| **Application Modernization (EMDT)** | Group 4 · ModernOps | Onboards enterprises, classifies them with the EMSI score, maps application dependencies, assesses Technical Debt and Governance Risk, simulates modernization and sends plans to an Executive for approval. |

**Sprint 1 rules:** only HTML, CSS and JavaScript. No backend, no libraries, no CDN. All demo data is hardcoded in `js/data/`. Changes are saved in the browser (localStorage).

---

## 1. How to run

1. Open the `secure-shift` folder in **VS Code**.
2. Right-click `index.html` and choose **Open with Live Server**. (Double-clicking also works.)
3. Choose **Explore Governance** or **Explore Modernization**, then click a demo account and press **LOGIN**.

### Demo accounts (password for all: `Secure@123`)

| Product | Role | Email |
|---|---|---|
| Cloud Governance | Cloud Admin | aarav.mehta@secureshift.io |
| EMDT | Super Admin | arya.mujumdar@secureshift.io |
| EMDT | Admin | sachin.kumar@secureshift.io |
| EMDT | Architect | amanjeet.sharma@secureshift.io |
| EMDT | Executive | shivanand.kumatekar@secureshift.io |

**To reset the demo data:** press F12, run `localStorage.clear()` in the Console, then refresh.

---

## 2. What changed in v2

**Cloud Governance**
- The name "MinRole" is removed everywhere (folder `minrole/` is now `governance/`).
- Removed the **Revoke** button (findings are read-only, with a *View Identity* link).
- The analysis runs on a **fixed period**: last 30/60/90 days or a custom From-To range (7 to 180 days, not in the future).
- **Grey blocks**: KPI cards are grey, card headers have grey bands, and wizard steps you haven't reached yet are greyed out. The whole UI got more CSS polish.
- Identities show the **user name** (display name plus `user@northwindtraders.com`).
- Removed the **CI/CD Gate** (page, menu item and dashboard card).

**Modernization (EMDT)**
- Notifications removed (no bell icon, no notification or activity tabs).
- **Super Admin:** strict validations; Add User has no status field; Super Admin can promote to Super Admin but never demote or deactivate one; no CSV export on Audit Logs.
- **Admin:** Dashboard lists **enterprises**, with Register New Enterprise. Each enterprise has a details page, a **Classification (EMSI)** tab (category + pricing), Dependencies (components + links + scores), Digital Twin and Application Inventory. All cost fields are removed.
- **Architect:** Dashboard lists enterprises. Menu is Dashboard, Applications, Digital Twin, Assessments, Simulations, Plans and Logout. The Applications list is read-only. The assessment shows only Technical Debt and Governance Risk (6 factors). The simulation offers 4 strategies only. Plans can only be created from a simulation, with a read-only summary and 4 generated phases.
- **Executive:** 3 submitted demo plans to approve. Statuses are Draft, Submitted, Approved and Rejected.

---

## 2a. What changed in v3 (colour theme)

The UI is no longer black and white. Each product has its own colour:

| Where | Colour |
| --- | --- |
| Cloud Governance | Indigo / purple (sidebar, buttons, table headers) |
| Modernization (EMDT) | Teal (sidebar, buttons, table headers) |
| KPI cards | Each card in a row has its own colour: blue, green, amber, violet, pink |
| Badges | Red = bad (HIGH, REJECTED), amber = needs attention (MEDIUM, SUBMITTED), green = good (LOW, APPROVED), blue = info (DRAFT) |
| Score bars | Red = high score, amber = medium, green = low |
| Digital Twin nodes | Application = teal, Service = blue, Database = amber, API = pink |

Grey is kept only for locked or disabled parts (steps not reached yet, disabled buttons, the Assessment results before you run them).

How it works: all colours are CSS variables in `css/base.css` (`--accent`, `--red`, `--green` and so on).
`body[data-product="emdt"]` changes `--accent` to teal, so the same CSS works for both products.

| File | Owner | What changed |
| --- | --- | --- |
| `css/base.css`, `css/layout.css` | Ashish | Colour variables, buttons, cards, KPIs, badges, tables, coloured sidebar |
| `governance/css/governance.css` | Ashish | Coloured wizard stepper, upload boxes, checks |
| `css/landing.css`, `js/pages/login.js` | Yash | Coloured landing and login; the login card turns teal when you pick Modernization |
| `modernization/css/emdt.css`, `modernization/digital-twin.html`, `modernization/js/digital-twin.js` | Mohit Choudhary | Coloured graph nodes, EMSI ring, plan timeline |
| `js/common/ui.js`, `modernization/js/simulation.js` | Shrinivas | Badge colours, coloured line and donut charts |
| `js/common/shell.js` | Ashish | The Profile page takes the colour of the product you logged in to |

## 3. Folder structure (72 code files + this README)

```
secure-shift/
├── README.md
├── index.html  login.html  logout.html  profile.html
├── css/            base.css  layout.css  landing.css
├── js/
│   ├── common/     core.js  ui.js  shell.js
│   ├── data/       users.js  governance-data.js  emdt-data.js  emdt-calc.js
│   └── pages/      landing.js  login.js  logout.js  profile.js
├── governance/                      ===== Group 3 · Nimbus =====
│   ├── css/governance.css
│   ├── dashboard.html  analysis.html  identities.html  identity-detail.html
│   ├── findings.html   roles.html     rules.html       reports.html  companies.html
│   └── js/  (one .js per page above, same name)
└── modernization/                   ===== Group 4 · ModernOps =====
    ├── css/emdt.css
    ├── superadmin-dashboard.html  users.html  audit-logs.html
    ├── admin-dashboard.html  enterprise.html  classification.html
    ├── dependencies.html  digital-twin.html  applications.html  register-application.html
    ├── architect-dashboard.html  assessments.html  simulation.html  plans.html  create-plan.html
    ├── executive-dashboard.html  review-plan.html
    └── js/  (one .js per page above, same name)
```

Create these empty folders first: `css`, `js/common`, `js/data`, `js/pages`, `governance/css`, `governance/js`, `modernization/css`, `modernization/js`.

---

## 4. Who commits which files

### Group 3 · Nimbus (Cloud Governance)

| # | Member | Files | Feature |
|---|---|---|---|
| 1 | **Yashwardhan Dhondge** | `README.md`, `index.html`, `login.html`, `logout.html`, `css/landing.css`, `js/common/core.js`, `js/data/users.js`, `js/pages/landing.js`, `js/pages/login.js`, `js/pages/logout.js` | Landing, Login, Logout, session + validation core |
| 2 | **Ashish Kumar** | `css/base.css`, `css/layout.css`, `js/common/shell.js`, `governance/css/governance.css`, `governance/dashboard.html`, `governance/js/dashboard.js` | Design system (grey blocks), app frame + menus, Governance Dashboard |
| 3 | **Ashwini Rathod** | `governance/analysis.html`, `governance/js/analysis.js`, `governance/companies.html`, `governance/js/companies.js` | Analysis Wizard (fixed period), Companies |
| 4 | **Mohit Deore** | `js/data/governance-data.js`, `governance/identities.html`, `governance/js/identities.js`, `governance/identity-detail.html`, `governance/js/identity-detail.js` | Governance data, Identities (user names), Identity Detail & Evidence |
| 5 | **Suhas Sambargi** | `governance/findings.html`, `governance/js/findings.js`, `governance/roles.html`, `governance/js/roles.js` | High-Risk Findings, Generated Roles |
| 6 | **Vedant Mahanavar** | `governance/rules.html`, `governance/js/rules.js`, `governance/reports.html`, `governance/js/reports.js` | Rules Configuration, Reports |

### Group 4 · ModernOps (EMDT)

| # | Member | Files | Feature |
|---|---|---|---|
| 7 | **Arya Mujumdar** | `modernization/superadmin-dashboard.html`, `modernization/js/superadmin-dashboard.js`, `modernization/users.html`, `modernization/js/users.js`, `modernization/audit-logs.html`, `modernization/js/audit-logs.js` | Super Admin: Dashboard, User Management, Audit Logs |
| 8 | **Sachin Kumar** | `modernization/admin-dashboard.html`, `modernization/js/admin-dashboard.js`, `modernization/enterprise.html`, `modernization/js/enterprise.js`, `modernization/classification.html`, `modernization/js/classification.js` | Admin: Enterprise list + registration, Enterprise Details, Classification (EMSI) |
| 9 | **Mohit Choudhary** | `js/data/emdt-data.js`, `modernization/css/emdt.css`, `modernization/dependencies.html`, `modernization/js/dependencies.js`, `modernization/digital-twin.html`, `modernization/js/digital-twin.js` | EMDT data model, Dependency Mapping, Digital Twin |
| 10 | **Amanjeet Sharma** | `modernization/applications.html`, `modernization/js/applications.js`, `modernization/register-application.html`, `modernization/js/register-application.js`, `modernization/architect-dashboard.html`, `modernization/js/architect-dashboard.js`, `modernization/plans.html`, `modernization/js/plans.js` | Application Inventory, Register/Edit App, Architect Dashboard, Plans list |
| 11 | **Shrinivas Naik** | `js/common/ui.js`, `js/data/emdt-calc.js`, `modernization/assessments.html`, `modernization/js/assessments.js`, `modernization/simulation.html`, `modernization/js/simulation.js` | Shared UI components, all EMDT formulas, Assessment, Simulation |
| 12 | **Shivanand Kumatekar** | `modernization/create-plan.html`, `modernization/js/create-plan.js`, `modernization/executive-dashboard.html`, `modernization/js/executive-dashboard.js`, `modernization/review-plan.html`, `modernization/js/review-plan.js`, `profile.html`, `js/pages/profile.js` | Create Plan, Executive Approval, Review Plan, Profile & Settings |

### Commit order

**Round 1 (shared foundation, commit first):**
1. Ashish Kumar: `css/base.css`, `css/layout.css`, `js/common/shell.js`
2. Yashwardhan Dhondge: `js/common/core.js`, `js/data/users.js`
3. Shrinivas Naik: `js/common/ui.js`, `js/data/emdt-calc.js`
4. Mohit Deore: `js/data/governance-data.js`
5. Mohit Choudhary: `js/data/emdt-data.js`, `modernization/css/emdt.css`

**Round 2:** everyone commits the rest of their files.

---

## 5. EMDT formulas (all in `js/data/emdt-calc.js`)

**EMSI** = Σ (parameter score × weight). Weights: Total apps 14%, Dependencies 14%, APIs 7%, Databases & storage 9%, Environments 6%, Business units 4%, Technology diversity 15%, Active users 4%, Application criticality 9%, Governance policies 6%, Cloud type 7%, Lines of code 5%.
Technology diversity = (sum of selected values ÷ 740) × 100, where Java = 75, PHP = 95, .NET = 120 and COBOL = 450.

| Category | EMSI | Effort multiplier | Monthly | Annual |
|---|---|---|---|---|
| Foundation | 0-25 | ×0.90 | ₹5,000 | ₹54,000 |
| Growth | 25-45 | ×1.00 | ₹10,000 | ₹1,08,000 |
| Enterprise | 45-70 | ×1.05 | ₹25,000 | ₹2,70,000 |
| Strategic | 70-100 | ×1.10 | ₹50,000 | ₹5,40,000 |

**Dependency points** = Type weight (Application 4, Service 3, Database 3, API 2) × Criticality (Low 1, Medium 2, High 3, Critical 4). Only direct outgoing links count.
**Dependency Impact** = 100 × (1 − e^(−raw ÷ 20)).
**Technical Debt** = Age (max 25) + Framework support (Unsupported 25, Extended 12, Supported 0) + Documentation (15/8/0) + Complexity (20/10/3) + Codebase size (2-15).
**Governance Risk** = Criticality (30/22/12/5) + Sensitive data (20) + Security issues (0/5/10/15) + Highest dependency criticality (15/10/5/2) + Downtime tolerance (Low 10, Medium 5, High 0) + Compliance policies (0/5/10).
**Modernization Risk** = TD×0.30 + GR×0.25 + DI×0.25 + Strategy Risk×0.20. Strategy Risk: Rehost 25, Replatform 50, Refactor 75, Rebuild 100.
**Effort (weeks)** = (6 + MR×0.12) × EMSI multiplier + strategy weeks (Rehost +1, Replatform +2, Refactor +4, Rebuild +6).
**Cost (₹ lakh)** = (team × person-months × 0.60 + testing 10% + tools 1.00 + other 1.50) × 1.15 contingency. Team: Rehost 3, Replatform 4, Refactor 5, Rebuild 6.
**Phases** = 15% / 20% / 45% / remainder, so they always add up to the effort.

Check (the example from the doc): Trade Finance Portal + Refactor gives TD 95, GR 90, DI 83, MR 87, **22 weeks** and **₹22.15 lakh**.

> Assumptions to confirm with the trainer, because these parts were not visible in the shared document: the EMSI category ranges for Foundation and Growth, the effort multipliers, the Dependency Impact normalisation constant (20), and the base effort and cost constants. Each one is a single number at the top of `emdt-calc.js`.

---

## 6. Demo flow for the review

**Cloud Governance:** Dashboard → Analysis Wizard (Last 60 days, run) → Identities (search "Rahul Verma") → Identity detail and evidence → Generated Role → High-Risk Findings → Reports.

**EMDT (full loop):**
1. **Super Admin:** add a user (try a wrong name or phone to show the validation), promote a user to Super Admin, try to deactivate a Super Admin (blocked).
2. **Admin:** Register New Enterprise → Classification (Save & Calculate EMSI) → Application Inventory (register 2 apps) → Dependencies (add a component and links, see the scores) → Digital Twin.
3. **Architect:** Dashboard → open Northwind Bank → Assess Customer360 → Continue to Simulation → Trade Finance Portal + Refactor → Create Plan → Submit.
4. **Executive:** Approval Dashboard → Review → Approve, or Reject with a comment.
5. **Architect again:** Plans shows the Executive's comment.

**Tested:** 148 automated click checks across all roles, with 0 JavaScript errors.
