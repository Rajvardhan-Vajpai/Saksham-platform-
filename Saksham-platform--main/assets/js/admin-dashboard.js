initDashboardShell({ role: "admin", active: "dashboard.html", title: "Dashboard", crumb: "Admin console", userName: "Programme Admin" });

  (async function () {
    const activity = await loadWithFallback(() => Api.getDashboardStats().then(d => d.activity), MockDB.adminActivity) || MockDB.adminActivity;
    activityList.innerHTML = activity.map(a => `
      <li class="resource-row"><div class="r-icon">${icon("bell",16)}</div><div class="r-body"><h4>${a.who}</h4><span>${a.action} · ${a.when}</span></div></li>`).join("");
  })();