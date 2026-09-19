const routes = { trainee: "trainee/profile.html", trainer: "trainer/dashboard.html" };
  let chosenRole = "trainee";
  const statusBox = document.getElementById("statusBox");

  continueBtn.addEventListener("click", async () => {
    chosenRole = document.querySelector('input[name="role"]:checked').value;
    roleStep.style.display = "none";
    clerkStep.style.display = "block";
    try {
      await AuthGuard.mountSignUp(document.getElementById("clerk-signup"), {
        afterSignUpUrl: window.location.href,
        signInUrl: "login.html"
      });
      if (window.Clerk.user) finishSignup();
      AuthGuard.addListener(({ user }) => { if (user) finishSignup(); });
    } catch (e) {
      statusBox.innerHTML = `<div class="alert alert-error">Couldn't load sign-up (offline, or Clerk isn't reachable).</div>`;
    }
  });

  async function finishSignup() {
    statusBox.innerHTML = `<div class="alert alert-info">Setting up your account…</div>`;
    const name = window.Clerk.user.fullName || window.Clerk.user.username || "User";
    const email = window.Clerk.user.primaryEmailAddress?.emailAddress;
    try {
      await Api.syncUser({ name, email, role: chosenRole });
      clerkStep.innerHTML = chosenRole === "trainer"
        ? `<div class="alert alert-success">Thanks, ${name}. Your trainer account is pending admin approval — you'll get access once it's reviewed.</div><a href="login.html" class="btn btn-outline btn-block">Back to log in</a>`
        : `<div class="alert alert-success">You're all set, ${name}.</div><a href="${routes.trainee}" class="btn btn-primary btn-block">Go to your dashboard</a>`;
    } catch (e) {
      clerkStep.innerHTML = `<div class="alert alert-info">Account created, but the backend wasn't reachable to finish setup. Start it and log in again — or explore with sample data for now.</div><a href="${routes[chosenRole]}" class="btn btn-outline btn-block">Continue in demo mode</a>`;
    }
  }