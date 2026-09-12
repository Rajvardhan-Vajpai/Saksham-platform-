/* Shared chrome + small icon set (inline SVG, stroke=currentColor) so the
   whole site has no external icon-font dependency. */
const ICONS = {
  dashboard: '<path d="M4 13h6V4H4v9Zm0 7h6v-5H4v5Zm10 0h6V11h-6v9Zm0-16v5h6V4h-6Z"/>',
  profile: '<circle cx="12" cy="8" r="3.4"/><path d="M4.5 20c1.4-4 4.2-6 7.5-6s6.1 2 7.5 6"/>',
  courses: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5v-15Z"/><path d="M8 3v15"/>',
  assess: '<path d="M9 11.5 11 13.5 15.5 9"/><circle cx="12" cy="12" r="9"/>',
  feedback: '<path d="M4 5h16v10H8l-4 4V5Z"/>',
  library: '<path d="M4 4h4v16H4zM10 4h4v16h-4zM16 6l4-1v15l-4 1z"/>',
  users: '<circle cx="9" cy="8" r="3"/><path d="M3 20c.8-3.2 3-5 6-5s5.2 1.8 6 5"/><circle cx="17" cy="9" r="2.4"/><path d="M15.5 15.2c2.4.3 3.9 1.9 4.5 4.3"/>',
  competency: '<path d="M12 3v18M4 11h16M6 3l6 8 6-8"/>',
  content: '<path d="M4 4h16v4H4zM4 11h10v9H4zM16 11h4v9h-4z"/>',
  logout: '<path d="M9 4H5v16h4"/><path d="M15 8l4 4-4 4"/><path d="M19 12H9"/>',
  bell: '<path d="M6 10a6 6 0 1 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z"/><path d="M10 20a2 2 0 0 0 4 0"/>',
  menu: '<path d="M3 6h18M3 12h18M3 18h18"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  video: '<path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H14a1.5 1.5 0 0 1 1.5 1.5v13A1.5 1.5 0 0 1 14 20H5.5A1.5 1.5 0 0 1 4 18.5v-13Z"/><path d="M15.5 10l4.5-3v10l-4.5-3Z"/>',
  ppt: '<rect x="4" y="3" width="16" height="18" rx="1.5"/><path d="M8 8h5a2.5 2.5 0 0 1 0 5H8v4"/>',
  pdf: '<rect x="4" y="3" width="16" height="18" rx="1.5"/><path d="M7.5 8h2a1.7 1.7 0 0 1 0 3.4h-2V16M13 8v8M13 8h2a2 2 0 0 1 0 8h-2M17 8h2"/>',
  doc: '<rect x="4" y="3" width="16" height="18" rx="1.5"/><path d="M8 8h8M8 12h8M8 16h5"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  upload: '<path d="M12 16V4M7 9l5-5 5 5"/><path d="M4 16v3.5A1.5 1.5 0 0 0 5.5 21h13a1.5 1.5 0 0 0 1.5-1.5V16"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>',
  check: '<path d="M5 12l5 5L19 7"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>'
};
function icon(name, size = 18) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICONS[name] || ""}</svg>`;
}

function renderTicker(mountId, items) {
  const el = document.getElementById(mountId);
  if (!el) return;
  const doubled = items.concat(items);
  el.innerHTML = `
    <div class="container">
      <span class="ticker-label">Notices</span>
      <div class="ticker-track"><ul>${doubled.map(t => `<li>${t}</li>`).join("")}</ul></div>
    </div>`;
}

function toast(msg) {
  let region = document.querySelector(".toast-region");
  if (!region) {
    region = document.createElement("div");
    region.className = "toast-region";
    document.body.appendChild(region);
  }
  const t = document.createElement("div");
  t.className = "toast";
  t.textContent = msg;
  region.appendChild(t);
  setTimeout(() => t.remove(), 3200);
}

/* ---- Dashboard shell: sidebar + topbar, shared across trainee/trainer/admin ---- */
const NAV_BY_ROLE = {
  trainee: [
    { href: "dashboard.html", icon: "dashboard", label: "Dashboard" },
    { href: "profile.html", icon: "profile", label: "My Profile" },
    { href: "courses.html", icon: "courses", label: "Courses" },
    { href: "assessment.html", icon: "assess", label: "Assessments" }
  ],
  trainer: [
    { href: "dashboard.html", icon: "dashboard", label: "Dashboard" },
    { href: "library.html", icon: "library", label: "Trainer Library" },
    { href: "create-quiz.html", icon: "assess", label: "Create Questionnaire" }
  ],
  admin: [
    { href: "dashboard.html", icon: "dashboard", label: "Dashboard" },
    { href: "users.html", icon: "users", label: "User Approvals" },
    { href: "competency-mapping.html", icon: "competency", label: "Competency Mapping" },
    { href: "content.html", icon: "content", label: "Homepage Content" }
  ]
};
const ROLE_LABEL = { trainee: "Trainee account", trainer: "Trainer account", admin: "Administrator" };

/**
 * Renders the sidebar/topbar AND gates the page behind Clerk auth via
 * AuthGuard.requireRole(role) — redirects to /login.html if not signed
 * in, or to the correct role's dashboard if signed in as someone else.
 * Returns the resolved profile ({name, role, status, ...} or a demo
 * fallback if the backend isn't reachable) so pages can use it further.
 */
async function initDashboardShell({ role, active, title, crumb }) {
  const nav = NAV_BY_ROLE[role];
  const profile = await AuthGuard.requireRole(role);
  if (!profile) return null; // requireRole already redirected

  const userName = profile.name || "User";
  const initials = userName.split(" ").map(s => s[0]).slice(0, 2).join("").toUpperCase();
  const roleLabel = profile._demo ? `${ROLE_LABEL[role]} (demo data — backend unreachable)` : ROLE_LABEL[role];

  document.getElementById("sidebar").innerHTML = `
    <div class="brand">
      <div class="brand-emblem">SK</div>
      <div class="brand-text"><div class="brand-name">Saksham</div><div class="brand-sub">Training &amp; Competency Platform</div></div>
    </div>
    <div class="side-role"><span class="dot"></span>${roleLabel}</div>
    <nav class="side-nav">
      ${nav.map(n => `<a href="${n.href}" class="${n.href === active ? "active" : ""}"><span class="icon">${icon(n.icon, 17)}</span>${n.label}</a>`).join("")}
      <a href="#" id="signOutLink" style="margin-top:10px;border-top:1px solid rgba(255,255,255,.1);padding-top:14px;"><span class="icon">${icon("logout", 17)}</span>Log out</a>
    </nav>`;

  document.getElementById("topbar").innerHTML = `
    <button class="menu-toggle" id="menuToggle" aria-label="Toggle menu">${icon("menu", 22)}</button>
    <div>
      <div class="crumb">${crumb}</div>
      <h1>${title}</h1>
    </div>
    <div class="topbar-actions">
      <span title="Notifications">${icon("bell", 20)}</span>
      <div class="avatar" title="${userName}">${initials}</div>
    </div>`;

  const toggle = document.getElementById("menuToggle");
  const sidebar = document.getElementById("sidebar");
  if (toggle) toggle.addEventListener("click", () => sidebar.classList.toggle("open"));

  document.getElementById("signOutLink").addEventListener("click", (e) => {
    e.preventDefault();
    if (profile._demo) { window.location.href = "../login.html"; return; }
    AuthGuard.signOut("../login.html");
  });

  return profile;
}
