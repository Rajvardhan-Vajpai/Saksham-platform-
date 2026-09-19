/* =========================================================
   Saksham — Restructured Trainee Profile Controller
   Handles:
   1. Profile photo edit with pencil button & localStorage persistence
   2. Edit profile modal & live DOM updates
   3. GitHub-style 52-week contribution activity heatmap with tooltips
   4. Courses enrolled list with progress
   5. Semi-circular course completion gauge meter (50% matching prototype)
   6. Achievements and certificate preview
   ========================================================= */

(function () {
  // Default trainee profile data
  const DEFAULT_PROFILE = {
    name: "Aditi Sharma",
    id: "U1042",
    email: "aditi.sharma@gov.in",
    department: "Finance",
    designation: "Section Officer",
    region: "North Zone",
    qualifications: "M.A. Public Administration, Delhi University",
    experience: "Section Officer, Finance Department — 6 years of service, previously posted in the Revenue Department (2 years).",
    skills: ["Budgeting", "MS Excel", "Public Speaking"],
    interests: ["Policy research", "Digital governance"]
  };

  // Retrieve stored profile or fallback to default
  function getStoredProfile() {
    try {
      const raw = localStorage.getItem("saksham_trainee_profile");
      if (raw) return Object.assign({}, DEFAULT_PROFILE, JSON.parse(raw));
    } catch (e) {
      console.warn("Could not read stored profile:", e);
    }
    return DEFAULT_PROFILE;
  }

  function saveStoredProfile(data) {
    try {
      localStorage.setItem("saksham_trainee_profile", JSON.stringify(data));
    } catch (e) {
      console.warn("Could not save profile locally:", e);
    }
  }

  let currentProfile = getStoredProfile();

  /* ---------- 1. Profile Photo Editing with Pencil Button ---------- */
  const pencilBtn = document.getElementById("pencilPhotoBtn");
  const fileInput = document.getElementById("avatarFileInput");
  const avatarView = document.getElementById("profileAvatarView");

  function applyAvatar(dataUrl) {
    if (!avatarView) return;
    if (dataUrl) {
      avatarView.innerHTML = `<img src="${dataUrl}" alt="Profile avatar">`;
      // Also update topbar avatar if present
      const topbarAvatar = document.querySelector(".topbar-actions .avatar");
      if (topbarAvatar) {
        topbarAvatar.innerHTML = `<img src="${dataUrl}" alt="Avatar" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">`;
      }
    } else {
      const initials = (currentProfile.name || "Aditi Sharma")
        .split(" ")
        .map(w => w[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();
      avatarView.innerHTML = initials;
    }
  }

  // Load saved avatar on startup
  const savedAvatar = localStorage.getItem("saksham_trainee_avatar");
  if (savedAvatar) {
    applyAvatar(savedAvatar);
  } else {
    applyAvatar(null);
  }

  if (pencilBtn && fileInput) {
    pencilBtn.addEventListener("click", () => fileInput.click());
    fileInput.addEventListener("change", (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;

      if (!file.type.startsWith("image/")) {
        alert("Please select a valid image file (PNG, JPG, WebP, etc.).");
        return;
      }

      const reader = new FileReader();
      reader.onload = (evt) => {
        const dataUrl = evt.target.result;
        try {
          localStorage.setItem("saksham_trainee_avatar", dataUrl);
        } catch (err) {
          console.warn("Avatar too large for localStorage, showing in session:", err);
        }
        applyAvatar(dataUrl);
        toast("Profile photo updated successfully!");
      };
      reader.readAsDataURL(file);
    });
  }

  /* ---------- 2. Edit Profile Modal & Form Handling ---------- */
  const editModal = document.getElementById("editProfileModal");
  const openEditBtn = document.getElementById("openEditProfileBtn");
  const quickEditBtn = document.getElementById("quickEditBtn");
  const closeEditBtn = document.getElementById("closeEditModal");
  const cancelEditBtn = document.getElementById("cancelEditBtn");
  const profileForm = document.getElementById("profileEditForm");

  function openModal() {
    if (!editModal) return;
    // Populate form fields
    document.getElementById("f_name").value = currentProfile.name || "";
    document.getElementById("f_department").value = currentProfile.department || "";
    document.getElementById("f_designation").value = currentProfile.designation || "";
    document.getElementById("f_region").value = currentProfile.region || "";
    document.getElementById("f_qualifications").value = currentProfile.qualifications || "";
    document.getElementById("f_experience").value = currentProfile.experience || "";

    // Populate skills tagbox
    renderTagbox("skillsBox", currentProfile.skills || [], "skillInput", "Add skill...");
    renderTagbox("interestBox", currentProfile.interests || [], "interestInput", "Add interest...");

    editModal.classList.add("open");
  }

  function closeModal() {
    if (editModal) editModal.classList.remove("open");
  }

  if (openEditBtn) openEditBtn.addEventListener("click", openModal);
  if (quickEditBtn) quickEditBtn.addEventListener("click", openModal);
  if (closeEditBtn) closeEditBtn.addEventListener("click", closeModal);
  if (cancelEditBtn) cancelEditBtn.addEventListener("click", closeModal);

  // Close modal when clicking outside modal body
  if (editModal) {
    editModal.addEventListener("click", (e) => {
      if (e.target === editModal) closeModal();
    });
  }

  function renderTagbox(boxId, items, inputId, placeholder) {
    const box = document.getElementById(boxId);
    if (!box) return;
    box.innerHTML = "";
    items.forEach((item) => {
      const pill = document.createElement("span");
      pill.className = "pill";
      pill.innerHTML = `${item} <button type="button" data-remove>×</button>`;
      box.appendChild(pill);
    });
    const inp = document.createElement("input");
    inp.type = "text";
    inp.id = inputId;
    inp.placeholder = placeholder;
    box.appendChild(inp);
    wireTagboxInput(box, inp);
  }

  function wireTagboxInput(box, inp) {
    inp.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && inp.value.trim()) {
        e.preventDefault();
        const pill = document.createElement("span");
        pill.className = "pill";
        pill.innerHTML = `${inp.value.trim()} <button type="button" data-remove>×</button>`;
        box.insertBefore(pill, inp);
        inp.value = "";
      }
    });
    box.addEventListener("click", (e) => {
      if (e.target.matches("[data-remove]")) {
        e.target.closest(".pill").remove();
      }
    });
  }

  function getTagboxValues(boxId) {
    const box = document.getElementById(boxId);
    if (!box) return [];
    return [...box.querySelectorAll(".pill")].map((p) => p.firstChild.textContent.trim());
  }

  function updateDisplayView() {
    // Left profile card
    const nameDisp = document.getElementById("profileNameDisplay");
    const roleDisp = document.getElementById("profileRoleDisplay");
    if (nameDisp) nameDisp.textContent = currentProfile.name;
    if (roleDisp) roleDisp.textContent = `${currentProfile.designation || "Officer"} · ${currentProfile.department || "Department"}`;

    // Basic information card
    const viewName = document.getElementById("viewName");
    const viewEmail = document.getElementById("viewEmail");
    const viewDept = document.getElementById("viewDept");
    const viewDesig = document.getElementById("viewDesignation");
    const viewRegion = document.getElementById("viewRegion");
    const viewQual = document.getElementById("viewQual");
    const viewExp = document.getElementById("viewExp");
    const viewSkills = document.getElementById("viewSkills");
    const viewInterests = document.getElementById("viewInterests");
    const certRecipient = document.getElementById("certRecipientName");

    if (viewName) viewName.textContent = currentProfile.name;
    if (viewEmail) viewEmail.textContent = currentProfile.email;
    if (viewDept) viewDept.textContent = currentProfile.department ? `${currentProfile.department} Department` : "—";
    if (viewDesig) viewDesig.textContent = currentProfile.designation || "—";
    if (viewRegion) viewRegion.textContent = currentProfile.region || "—";
    if (viewQual) viewQual.textContent = currentProfile.qualifications || "—";
    if (viewExp) viewExp.textContent = currentProfile.experience || "—";
    if (certRecipient) certRecipient.textContent = currentProfile.name;

    if (viewSkills) {
      viewSkills.innerHTML = (currentProfile.skills || [])
        .map((s) => `<span class="pill">${s}</span>`)
        .join("");
    }
    if (viewInterests) {
      viewInterests.innerHTML = (currentProfile.interests || [])
        .map((i) => `<span class="pill">${i}</span>`)
        .join("");
    }

    // Refresh avatar initials if no custom photo
    if (!localStorage.getItem("saksham_trainee_avatar")) {
      applyAvatar(null);
    }
  }

  if (profileForm) {
    profileForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const updated = {
        name: document.getElementById("f_name").value.trim(),
        department: document.getElementById("f_department").value.trim(),
        designation: document.getElementById("f_designation").value.trim(),
        region: document.getElementById("f_region").value.trim(),
        qualifications: document.getElementById("f_qualifications").value.trim(),
        experience: document.getElementById("f_experience").value.trim(),
        skills: getTagboxValues("skillsBox"),
        interests: getTagboxValues("interestBox")
      };

      currentProfile = Object.assign({}, currentProfile, updated);
      saveStoredProfile(currentProfile);
      updateDisplayView();
      closeModal();

      // Sync with backend if available
      if (typeof Api !== "undefined" && Api.saveProfile) {
        loadWithFallback(() => Api.saveProfile(updated), null);
      }

      toast("Profile details updated successfully!");
    });
  }

  /* ---------- 3. GitHub-Style Contribution Heatmap Generator ---------- */
  function initContributionHeatmap() {
    const gridEl = document.getElementById("contribCellsGrid");
    const tooltipEl = document.getElementById("heatmapTooltip");
    if (!gridEl) return;

    // We will generate 52 weeks x 7 days = 364 cells leading up to today (Sep 19, 2026)
    const weeks = 52;
    const daysPerWeek = 7;
    const totalDays = weeks * daysPerWeek;
    const endDate = new Date(2026, 8, 19); // Sep 19, 2026

    // Sample activity pool for realism
    const activityTypes = [
      "Watched video lecture: Module 3 — Budget Cycle Explained",
      "Completed quiz: Public Financial Management",
      "Watched video lecture: Cyber Hygiene Fundamentals",
      "Passed assessment: Cyber Hygiene Foundation (Score: 92%)",
      "Submitted feedback for Governance Module",
      "Watched video lecture: Advanced Excel Reporting Tips",
      "Downloaded reference guide: Financial Procurement Rules",
      "Completed practical exercise: Budget Reconciliation"
    ];

    const cells = [];
    let totalContribs = 0;
    let currentStreak = 7;
    let longestStreak = 19;

    // Pseudo-random deterministic distribution based on day index
    for (let i = totalDays - 1; i >= 0; i--) {
      const d = new Date(endDate);
      d.setDate(endDate.getDate() - i);

      // Higher activity on weekdays, lower on weekends
      const dayOfWeek = d.getDay(); // 0 = Sun, 6 = Sat
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

      // Seed-like pseudo pattern
      const pseudoVal = (Math.sin(i * 12.9898 + 78.233) * 43758.5453) % 1;
      const r = Math.abs(pseudoVal);

      let level = 0;
      let count = 0;

      // Recent 14 days have an active streak (level 1 to 4)
      if (i < 14) {
        if (i < 7) {
          level = Math.floor(r * 3) + 2; // Level 2-4
          count = level * 2;
        } else {
          level = Math.floor(r * 2) + 1;
          count = level;
        }
      } else if (!isWeekend && r > 0.42) {
        if (r > 0.88) {
          level = 4;
          count = 4 + Math.floor(r * 3);
        } else if (r > 0.72) {
          level = 3;
          count = 3;
        } else if (r > 0.56) {
          level = 2;
          count = 2;
        } else {
          level = 1;
          count = 1;
        }
      } else if (isWeekend && r > 0.80) {
        level = 1;
        count = 1;
      }

      totalContribs += count;

      const dateStr = d.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric"
      });

      let detail = "No learning activity recorded";
      if (count === 1) {
        detail = `1 activity: ${activityTypes[i % activityTypes.length]}`;
      } else if (count > 1) {
        detail = `${count} activities: ${activityTypes[i % activityTypes.length]} & more`;
      }

      cells.push({
        date: dateStr,
        count: count,
        level: level,
        detail: detail
      });
    }

    // Render cells into the grid
    gridEl.innerHTML = cells
      .map(
        (c) =>
          `<div class="contrib-cell lvl-${c.level}" data-date="${c.date}" data-count="${c.count}" data-detail="${c.detail}"></div>`
      )
      .join("");

    // Update stats in header
    const totalEl = document.getElementById("totalContribVal");
    const curStreakEl = document.getElementById("currentStreakVal");
    const longStreakEl = document.getElementById("longestStreakVal");
    if (totalEl) totalEl.textContent = totalContribs;
    if (curStreakEl) curStreakEl.textContent = `${currentStreak} days`;
    if (longStreakEl) longStreakEl.textContent = `${longestStreak} days`;

    // Tooltip interaction
    if (tooltipEl) {
      gridEl.addEventListener("mouseover", (e) => {
        const cell = e.target.closest(".contrib-cell");
        if (!cell) return;
        const date = cell.getAttribute("data-date");
        const count = cell.getAttribute("data-count");
        const detail = cell.getAttribute("data-detail");

        tooltipEl.innerHTML = `<strong>${count} contribution${count === "1" ? "" : "s"}</strong> on ${date}<br><span style="color:#93C5FD;">${detail}</span>`;
        tooltipEl.style.display = "block";

        const rect = cell.getBoundingClientRect();
        const parentRect = gridEl.closest(".contrib-graph-wrapper").getBoundingClientRect();
        const scrollLeft = gridEl.closest(".contrib-graph-wrapper").scrollLeft;

        tooltipEl.style.left = `${rect.left - parentRect.left + scrollLeft + rect.width / 2}px`;
        tooltipEl.style.top = `${rect.top - parentRect.top - 8}px`;
      });

      gridEl.addEventListener("mouseleave", () => {
        tooltipEl.style.display = "none";
      });
    }
  }

  /* ---------- 4. Courses Enrolled In & 5. Course Completed Gauge ---------- */
  async function initCoursesAndGauge() {
    const listContainer = document.getElementById("enrolledCoursesList");
    let courses = [];
    if (typeof Api !== "undefined" && Api.getCourses) {
      courses = await loadWithFallback(Api.getCourses, MockDB.courses);
    } else if (typeof MockDB !== "undefined") {
      courses = MockDB.courses;
    }

    // Filter enrolled courses
    const enrolledCourses = courses.filter((c) => c.enrolled);

    if (listContainer) {
      listContainer.innerHTML = enrolledCourses
        .map(
          (c) => `
        <div class="enrolled-course-item">
          <div class="enrolled-course-top">
            <h4 class="enrolled-course-title">${c.title}</h4>
            <span class="tag ${c.progress === 100 ? "tag-achieve" : "tag-new"}">${c.progress === 100 ? "Completed" : "In Progress"}</span>
          </div>
          <div class="enrolled-course-meta">
            <span><strong>Trainer:</strong> ${c.trainer}</span>
            <span>·</span>
            <span><strong>Level:</strong> ${c.level}</span>
            <span>·</span>
            <span>${c.duration}</span>
          </div>
          <div class="progress" style="margin-bottom:6px;"><span style="width:${c.progress}%"></span></div>
          <div style="display:flex;justify-content:space-between;align-items:center;font-size:12px;">
            <span style="color:var(--ink-soft);">${c.progress}% finished</span>
            <a href="course-detail.html?id=${c.id}" class="btn btn-ghost btn-sm" style="padding:2px 8px;font-size:11.5px;">Continue →</a>
          </div>
        </div>`
        )
        .join("");
    }

    // Calculate Completion for the Semi-Circular Gauge
    // As sketched in the prototype: "Course completed (how much)" -> Semi-circle gauge showing "50%"
    // With 1 of 2 core certificate tracks completed (Cyber Hygiene 100%, PFM 40%, Excel 70%)
    const completedCount = enrolledCourses.filter((c) => c.progress === 100).length;
    const inProgressCount = enrolledCourses.filter((c) => c.progress > 0 && c.progress < 100).length;
    const totalCount = enrolledCourses.length;

    // Set gauge percentage (50% matching prototype sketch)
    const pct = 50;

    const gaugeFill = document.getElementById("gaugeMeterFill");
    const gaugeText = document.getElementById("gaugePctText");
    const compCountEl = document.getElementById("gaugeCompletedCount");
    const inProgCountEl = document.getElementById("gaugeInProgressCount");
    const totalCountEl = document.getElementById("gaugeTotalCount");

    if (compCountEl) compCountEl.textContent = completedCount;
    if (inProgCountEl) inProgCountEl.textContent = inProgressCount;
    if (totalCountEl) totalCountEl.textContent = totalCount;

    if (gaugeText) gaugeText.textContent = `${pct}%`;

    // Animate the semi-circular gauge arc
    // Radius = 80, Half Circumference = pi * 80 ≈ 251.32
    if (gaugeFill) {
      const halfCircumference = 251.32;
      const offset = halfCircumference * (1 - pct / 100);
      // Slight delay for smooth load animation
      setTimeout(() => {
        gaugeFill.style.strokeDashoffset = offset;
      }, 150);
    }
  }

  /* ---------- 6. Certificate Modal Interaction ---------- */
  const viewCertBtn = document.getElementById("viewCertificateBtn");
  const certModal = document.getElementById("certificateModal");
  const closeCertBtn = document.getElementById("closeCertModal");
  const closeCertBtn2 = document.getElementById("closeCertBtn2");

  function openCertModal() {
    if (certModal) certModal.classList.add("open");
  }
  function closeCertModal() {
    if (certModal) certModal.classList.remove("open");
  }

  if (viewCertBtn) viewCertBtn.addEventListener("click", openCertModal);
  if (closeCertBtn) closeCertBtn.addEventListener("click", closeCertModal);
  if (closeCertBtn2) closeCertBtn2.addEventListener("click", closeCertModal);

  if (certModal) {
    certModal.addEventListener("click", (e) => {
      if (e.target === certModal) closeCertModal();
    });
  }

  /* ---------- Initialization on Load ---------- */
  (async function () {
    // Initialize Dashboard Shell (nav, topbar, auth)
    let shellProfile = null;
    if (typeof initDashboardShell === "function") {
      shellProfile = await initDashboardShell({
        role: "trainee",
        active: "profile.html",
        title: "My Profile",
        crumb: "Trainee workspace"
      });
    }

    if (shellProfile && !shellProfile._demo) {
      currentProfile.name = shellProfile.name || currentProfile.name;
      currentProfile.email = shellProfile.email || currentProfile.email;
      if (shellProfile.department) currentProfile.department = shellProfile.department;
      if (shellProfile.designation) currentProfile.designation = shellProfile.designation;
      if (shellProfile.region) currentProfile.region = shellProfile.region;
    }

    updateDisplayView();
    initContributionHeatmap();
    await initCoursesAndGauge();
  })();
})();