initDashboardShell({ role: "admin", active: "content.html", title: "Homepage Content", crumb: "Admin console", userName: "Programme Admin" });

  let items = [];
  const tagClass = t => t === "Achievement" ? "tag-achieve" : (t === "New content" ? "tag-new" : "tag-info");

  function render() {
    itemGrid.innerHTML = items.map((n, i) => `
      <div class="notice-card">
        <div class="notice-date"><div class="d">${n.date.split(" ")[0]}</div><div class="m">${n.date.split(" ")[1]}</div></div>
        <div class="notice-body" style="flex:1;">
          <span class="tag ${tagClass(n.tag)}">${n.tag}</span>
          <h4 style="margin-top:6px;">${n.title}</h4>
          <p style="margin:0;">${n.body}</p>
        </div>
        <button class="btn btn-ghost btn-sm" data-remove="${i}">Remove</button>
      </div>`).join("");
  }

  itemGrid.addEventListener("click", (e) => {
    if (e.target.dataset.remove !== undefined) { items.splice(e.target.dataset.remove, 1); render(); toast("Removed from homepage"); }
  });

  publishForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const now = new Date();
    const months = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
    const entry = { date: `${String(now.getDate()).padStart(2,"0")} ${months[now.getMonth()]}`, title: itemTitle.value, body: itemBody.value, tag: itemType.value };
    await loadWithFallback(() => Api.publishHomepageItem(entry), null);
    items.unshift(entry);
    render();
    toast("Published to homepage");
    publishForm.reset();
  });

  (async function () {
    items = await loadWithFallback(Api.getAnnouncements, MockDB.announcements.slice());
    render();
  })();