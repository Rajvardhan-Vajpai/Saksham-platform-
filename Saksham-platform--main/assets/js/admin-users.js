let users = [];
  const statusClass = { pending: "status-pending", approved: "status-approved", rejected: "status-rejected" };
  // Backend statuses are uppercase (PENDING/APPROVED/REJECTED per API_DOCUMENTATION.md); normalize for display.
  const norm = (s) => (s || "").toLowerCase();

  function render() {
    const q = searchBox.value.toLowerCase();
    const status = statusFilter.value;
    const role = roleFilter.value;
    const rows = users.filter(u => {
      if (q && !u.name.toLowerCase().includes(q) && !u.email.toLowerCase().includes(q)) return false;
      if (status && norm(u.status) !== status) return false;
      if (role && norm(u.role) !== role) return false;
      return true;
    });
    userTable.innerHTML = rows.length ? rows.map((u) => `
      <tr>
        <td>${u.name}</td><td>${u.email}</td>
        <td style="text-transform:capitalize;">${u.role}</td>
        <td>${u.department || u.dept || "—"}</td><td>${u.applied || "—"}</td>
        <td><span class="status-pill ${statusClass[norm(u.status)] || "status-pending"}">${u.status}</span></td>
        <td>
          ${norm(u.status) === "pending" ? `
            <button class="btn btn-teal btn-sm" data-approve="${u._id}">Approve</button>
            <button class="btn btn-danger btn-sm" data-reject="${u._id}">Reject</button>` : `<span style="font-size:12px;color:var(--ink-soft);">—</span>`}
        </td>
      </tr>`).join("") : `<tr><td colspan="7"><div class="empty-state">No users match these filters.</div></td></tr>`;
  }

  [searchBox, statusFilter, roleFilter].forEach(el => el.addEventListener("input", render));

  userTable.addEventListener("click", async (e) => {
    const approveId = e.target.dataset.approve;
    const rejectId = e.target.dataset.reject;
    if (approveId) {
      await loadWithFallback(() => Api.approveUser(approveId), null);
      users.find(u => u._id === approveId).status = "approved";
      toast("User approved"); render();
    }
    if (rejectId) {
      await loadWithFallback(() => Api.rejectUser(rejectId), null);
      users.find(u => u._id === rejectId).status = "rejected";
      toast("User rejected"); render();
    }
  });

  (async function () {
    await initDashboardShell({ role: "admin", active: "users.html", title: "User Approvals", crumb: "Admin console" });
    // Only trainers go through approval per the backend (trainee signups are auto-active) —
    // fetching all roles here so the table can still show everyone.
    users = await loadWithFallback(Api.getAllUsers, MockDB.users.slice().map(u => ({ ...u, _id: u.email })));
    render();
  })();