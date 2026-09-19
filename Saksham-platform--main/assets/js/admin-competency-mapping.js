initDashboardShell({ role: "admin", active: "competency-mapping.html", title: "Competency Mapping", crumb: "Admin console", userName: "Programme Admin" });

  // Built from real primitives the backend has today — GET /competencies and
  // GET /trainers/:id/expertise — rather than a single ready-made endpoint,
  // since the AI trainer-matching route isn't built yet (see API_DOCUMENTATION.md).
  (async function () {
    let rows = MockDB.competency;
    try {
      const [competencies, trainers] = await Promise.all([Api.getCompetencies(), Api.getTrainers()]);
      const expertiseByTrainer = await Promise.all(trainers.map(t => loadWithFallback(() => Api.getTrainerExpertise(t._id || t.id), [])));
      rows = competencies.map((comp, i) => {
        const matched = trainers
          .map((t, ti) => ({ t, level: (expertiseByTrainer[ti] || []).find(e => (e.competencyId === (comp._id || comp.id)))?.level }))
          .filter(m => m.level)
          .sort((a, b) => b.level - a.level);
        return {
          subject: comp.name,
          trainers: matched.length ? matched.map(m => `${m.t.name} (${m.level}%)`) : ["Unassigned"],
          coverage: matched.length ? Math.min(100, matched[0].level) : 0
        };
      });
    } catch (e) {
      console.warn("Backend not reachable, showing sample competency data:", e.message);
    }
    mapTable.innerHTML = rows.map(r => `
      <tr>
        <td>${r.subject}</td>
        <td>${r.trainers.join(", ")}</td>
        <td style="min-width:160px;">
          <div class="hbar-row" style="margin:0;">
            <div class="hbar-track"><div class="hbar-fill" style="width:${r.coverage}%;${r.coverage<50?"background:var(--danger);":""}"></div></div>
            <div class="hbar-val">${r.coverage}%</div>
          </div>
        </td>
        <td>${r.coverage < 50 ? `<span class="tag tag-new">Needs trainer</span>` : `<span class="status-pill status-active">Covered</span>`}</td>
      </tr>`).join("");
  })();

  assignBtn.addEventListener("click", () => {
    // No "assign trainer to subject" route exists on the backend yet — this
    // records the trainer's own expertise level instead (POST /trainers/me/expertise
    // is trainer-only), so for now this button is a visual placeholder pending
    // that admin-side endpoint being built.
    toast(`${assignTrainer.value.split(" — ")[0]} assigned to ${assignSubject.value} (demo only — no backend route for this yet)`);
  });