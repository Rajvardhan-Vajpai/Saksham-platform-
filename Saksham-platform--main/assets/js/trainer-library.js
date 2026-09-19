initDashboardShell({ role: "trainer", active: "library.html", title: "Trainer Library", crumb: "Trainer workspace", userName: "R. Mehta" });

  const iconFor = (type) => ({
    video: '<path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H14a1.5 1.5 0 0 1 1.5 1.5v13A1.5 1.5 0 0 1 14 20H5.5A1.5 1.5 0 0 1 4 18.5v-13Z"/><path d="M15.5 10l4.5-3v10l-4.5-3Z"/>',
    ppt: '<rect x="4" y="3" width="16" height="18" rx="1.5"/><path d="M8 8h5a2.5 2.5 0 0 1 0 5H8v4"/>',
    pdf: '<rect x="4" y="3" width="16" height="18" rx="1.5"/><path d="M7.5 8h2a1.7 1.7 0 0 1 0 3.4h-2V16M13 8v8M13 8h2a2 2 0 0 1 0 8h-2M17 8h2"/>',
    doc: '<rect x="4" y="3" width="16" height="18" rx="1.5"/><path d="M8 8h8M8 12h8M8 16h5"/>'
  }[type] || "");

  let items = [];

  function render() {
    libraryList.innerHTML = items.map((r, i) => `
      <li class="resource-row">
        <div class="r-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">${iconFor(r.type)}</svg></div>
        <div class="r-body"><h4>${r.title}</h4><span>${r.meta}</span></div>
        <span class="status-pill ${r.visible ? "status-active" : "status-pending"}">${r.visible ? "Visible to trainees" : "Hidden"}</span>
        <button class="btn btn-ghost btn-sm" data-toggle="${i}">${r.visible ? "Hide" : "Publish"}</button>
      </li>`).join("");
  }

  libraryList.addEventListener("click", (e) => {
    const idx = e.target.dataset.toggle;
    if (idx !== undefined) { items[idx].visible = !items[idx].visible; render(); }
  });

  openUpload.addEventListener("click", () => uploadModal.classList.add("open"));
  closeUpload.addEventListener("click", () => uploadModal.classList.remove("open"));
  uploadModal.addEventListener("click", (e) => { if (e.target === uploadModal) uploadModal.classList.remove("open"); });

  // Materials are modeled as Course Modules on the backend (video/pdf/ppt/text
  // per module — see "Modules" in API_DOCUMENTATION.md), uploaded via
  // POST /courses/:courseId/modules then POST /modules/:id/upload.
  uploadForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const title = u_title.value.trim();
    const type = u_type.value;
    const file = u_file.files[0];
    const visible = document.getElementById("visibleCheck").checked;

    try {
      const courses = await Api.getCourses();
      const course = (Array.isArray(courses) ? courses : []).find(c => c.title === u_course.value);
      if (!course) throw new Error("Course not found on backend");
      const module = await Api.createModule(course._id || course.id, { title, description: "", order: 99 });
      if (file) await Api.uploadModuleFile(module._id || module.id, file);
      items.unshift({ title, type, meta: "Uploaded just now", visible });
      toast("Material uploaded to library");
    } catch (err) {
      console.warn("Backend not reachable, showing locally only:", err.message);
      items.unshift({ title, type, meta: "Saved locally — backend unreachable", visible });
      toast("Backend not reachable — added to this view only, not saved");
    }
    render();
    uploadModal.classList.remove("open");
    uploadForm.reset();
  });

  (async function () {
    const courses = await loadWithFallback(Api.getCourses, MockDB.courses);
    const lists = await Promise.all((Array.isArray(courses) ? courses : []).map(c =>
      loadWithFallback(() => Api.getModules(c._id || c.id), [])
    ));
    const modules = lists.flat();
    items = modules.length
      ? modules.map(m => ({ title: m.title, type: m.videoUrl ? "video" : m.pptUrl ? "ppt" : m.pdfUrl ? "pdf" : "doc", meta: m.description || "Course module", visible: true }))
      : MockDB.trainerLibrary.slice();
    render();
  })();