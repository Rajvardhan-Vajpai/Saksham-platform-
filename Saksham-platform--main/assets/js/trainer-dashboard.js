initDashboardShell({ role: "trainer", active: "dashboard.html", title: "Dashboard", crumb: "Trainer workspace", userName: "R. Mehta" });

  (async function () {
    const rows = await loadWithFallback(Api.getTraineePerformance, MockDB.trainees);
    traineeTable.innerHTML = rows.map(t => `
      <tr>
        <td>${t.name}</td><td>${t.dept}</td><td>${t.course}</td>
        <td style="min-width:140px;"><div class="progress"><span style="width:${t.progress}%"></span></div></td>
        <td>${t.score}</td>
      </tr>`).join("");
  })();