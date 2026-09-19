const routes = { trainee: "trainee/dashboard.html", trainer: "trainer/dashboard.html", admin: "admin/dashboard.html" };
  const statusBox = document.getElementById("statusBox");

  async function redirectSignedInUser() {
    statusBox.innerHTML = `<div class="alert alert-info">Signing you in…</div>`;
    try {
      const profile = await Api.getProfile(); // fails if this Clerk user hasn't been synced yet
      window.location.href = routes[profile.role] || "trainee/dashboard.html";
    } catch (e) {
      // Not synced yet (first login) or backend unreachable — default new sign-ins to trainee.
      try {
        await Api.syncUser({
          name: window.Clerk.user.fullName || window.Clerk.user.username || "User",
          email: window.Clerk.user.primaryEmailAddress?.emailAddress,
          role: "trainee"
        });
        window.location.href = routes.trainee;
      } catch (e2) {
        statusBox.innerHTML = `<div class="alert alert-info">Backend not reachable at the moment — opening the trainee workspace with sample data. Start your backend (see README) to log in for real.</div>`;
        setTimeout(() => window.location.href = routes.trainee, 1400);
      }
    }
  }

  (async function () {
    await AuthGuard.mountSignIn(document.getElementById("clerk-signin"), {
      afterSignInUrl: window.location.href,
      signUpUrl: "signup.html"
    });
    if (window.Clerk.user) redirectSignedInUser();
    AuthGuard.addListener(({ user }) => { if (user) redirectSignedInUser(); });
  })().catch(() => {
    statusBox.innerHTML = `<div class="alert alert-error">Couldn't load the sign-in widget (offline, or Clerk isn't reachable). <a href="trainee/dashboard.html">Continue in demo mode →</a></div>`;
  });