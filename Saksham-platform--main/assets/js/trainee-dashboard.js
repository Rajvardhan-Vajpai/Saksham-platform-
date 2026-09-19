initDashboardShell({ role: "trainee", active: "dashboard.html", title: "Dashboard", crumb: "Trainee workspace" });

  (async function () {
    const courses = (await loadWithFallback(Api.getCourses, MockDB.courses)).filter(c => c.enrolled);
    document.getElementById("courseGrid").innerHTML = courses.map(c => `
      <div class="course-card">
        <div class="course-thumb">${c.title.split(" ").map(w=>w[0]).slice(0,2).join("")}</div>
        <div class="course-body">
          <h4>${c.title}</h4>
          <div class="course-meta"><span>${c.category}</span><span>·</span><span>${c.duration}</span></div>
          <div class="progress"><span style="width:${c.progress}%"></span></div>
          <div class="course-meta"><span>${c.progress}% complete</span></div>
        </div>
      </div>`).join("");

    const notices = await loadWithFallback(Api.getAnnouncements, MockDB.announcements);
    document.getElementById("noticeList").innerHTML = notices.slice(0,3).map(n => `
      <li class="resource-row"><div class="r-icon">${icon("bell",16)}</div><div class="r-body"><h4>${n.title}</h4><span>${n.date}</span></div></li>`).join("");
  })();