function wireTagbox(boxId, inputEl) {
    const box = document.getElementById(boxId) || inputEl.closest(".tagbox");
    box.addEventListener("click", (e) => { if (e.target.matches("[data-remove]")) e.target.closest(".pill").remove(); });
  }
  wireTagbox("skillsBox");
  document.querySelectorAll(".tagbox input").forEach(inp => {
    inp.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && inp.value.trim()) {
        e.preventDefault();
        const pill = document.createElement("span");
        pill.className = "pill";
        pill.innerHTML = `${inp.value.trim()} <button type="button" data-remove>×</button>`;
        inp.closest(".tagbox").insertBefore(pill, inp);
        inp.value = "";
      }
    });
    inp.closest(".tagbox").addEventListener("click", (e) => { if (e.target.matches("[data-remove]")) e.target.closest(".pill").remove(); });
  });

  function pillValues(boxId) {
    return [...document.getElementById(boxId).querySelectorAll(".pill")].map(p => p.firstChild.textContent.trim());
  }

  document.getElementById("profileForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const payload = {
      name: document.getElementById("f_name").value,
      department: document.getElementById("f_department").value,
      designation: document.getElementById("f_designation").value,
      region: document.getElementById("f_region").value,
      qualifications: document.getElementById("f_qualifications").value,
      experience: document.getElementById("f_experience").value,
      skills: pillValues("skillsBox"),
      interests: pillValues("interestBox")
    };
    await loadWithFallback(() => Api.saveProfile(payload), null);
    toast("Profile saved");
  });

  (async function () {
    const profile = await initDashboardShell({ role: "trainee", active: "profile.html", title: "My Profile", crumb: "Trainee workspace" });
    if (profile && !profile._demo) {
      if (profile.name) document.getElementById("f_name").value = profile.name;
      if (profile.department) document.getElementById("f_department").value = profile.department;
      if (profile.designation) document.getElementById("f_designation").value = profile.designation;
      if (profile.region) document.getElementById("f_region").value = profile.region;
      if (profile.qualifications) document.getElementById("f_qualifications").value = profile.qualifications;
      if (profile.experience) document.getElementById("f_experience").value = profile.experience;
    }
  })();