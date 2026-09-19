initDashboardShell({ role: "trainee", active: "courses.html", title: "Courses", crumb: "Trainee workspace" });

  let ALL_COURSES = [];

  function cardHTML(c) {
    return `
      <div class="course-card">
        <div class="course-thumb">${c.title.split(" ").map(w=>w[0]).slice(0,2).join("")}</div>
        <div class="course-body">
          <h4>${c.title}</h4>
          <div class="course-meta"><span>${c.category}</span><span>·</span><span>${c.level}</span></div>
          <div class="course-meta"><span>Trainer: ${c.trainer}</span></div>
          ${c.enrolled ? `<div class="progress"><span style="width:${c.progress}%"></span></div><div class="course-meta"><span>${c.progress}% complete</span></div>` : ""}
          <div style="display:flex;gap:8px;margin-top:6px;">
            <button class="btn ${c.enrolled ? "btn-outline" : "btn-primary"} btn-sm" data-view="${c.id}">${c.enrolled ? "Continue" : "View details"}</button>
            ${!c.enrolled ? `<button class="btn btn-teal btn-sm" data-enroll="${c.id}">Enroll</button>` : ""}
          </div>
        </div>
      </div>`;
  }

  function render() {
    const q = searchBox.value.toLowerCase();
    const cat = categoryFilter.value;
    const status = statusFilter.value;
    const list = ALL_COURSES.filter(c => {
      if (q && !c.title.toLowerCase().includes(q) && !c.category.toLowerCase().includes(q)) return false;
      if (cat && c.category !== cat) return false;
      if (status === "enrolled" && !c.enrolled) return false;
      if (status === "available" && c.enrolled) return false;
      return true;
    });
    courseGrid.innerHTML = list.length ? list.map(cardHTML).join("") :
      `<div class="empty-state" style="grid-column:1/-1;"><div class="icon">🔍</div>No courses match your filters.</div>`;
  }

  [searchBox, categoryFilter, statusFilter].forEach(el => el.addEventListener("input", render));

  courseGrid.addEventListener("click", (e) => {
    const enrollId = e.target.dataset.enroll;
    const viewId = e.target.dataset.view;
    if (enrollId) {
      const c = ALL_COURSES.find(x => x.id === enrollId);
      loadWithFallback(() => Api.enrollCourse(enrollId), null).then(() => {
        c.enrolled = true; c.progress = 0;
        toast(`Enrolled in ${c.title}`);
        render();
      });
    }
    if (viewId) window.location.href = `course-detail.html?id=${viewId}`;
  });

  (async function () {
    ALL_COURSES = await loadWithFallback(Api.getCourses, MockDB.courses);
    render();
  })();