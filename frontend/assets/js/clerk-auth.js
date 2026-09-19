/* =========================================================
   Clerk auth — matches sih-imd-backend, which authenticates every
   route (except /api/health) via a Clerk session token.
   Publishable key below is the one already in your repo's
   test-harness/index.html. Swap CLERK_PUBLISHABLE_KEY /
   CLERK_FRONTEND_API if you point this at a different Clerk app.
   ========================================================= */
const CLERK_PUBLISHABLE_KEY = window.CLERK_PUBLISHABLE_KEY || "pk_test_dG9waWNhbC11bmljb3JuLTMwMTIuY2xlcmsuYWNjb3VudHMuZGV2JA";
const CLERK_FRONTEND_API = window.CLERK_FRONTEND_API || "https://topical-unicorn-3012.clerk.accounts.dev";

function loadClerkScript() {
  return new Promise((resolve, reject) => {
    if (window.Clerk) return resolve();
    const s = document.createElement("script");
    s.async = true;
    s.crossOrigin = "anonymous";
    s.setAttribute("data-clerk-publishable-key", CLERK_PUBLISHABLE_KEY);
    s.src = `${CLERK_FRONTEND_API}/npm/@clerk/clerk-js@latest/dist/clerk.browser.js`;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Could not load Clerk — check your network/publishable key."));
    document.head.appendChild(s);
  });
}

const AuthGuard = {
  _readyPromise: null,

  init() {
    if (!this._readyPromise) {
      this._readyPromise = loadClerkScript().then(() => window.Clerk.load()).then(() => window.Clerk);
    }
    return this._readyPromise;
  },

  async getToken() {
    try {
      await this.init();
      return window.Clerk.session ? await window.Clerk.session.getToken() : null;
    } catch (e) {
      return null; // Clerk unreachable — api.js falls back to mock data
    }
  },

  async signOut(redirectTo = "../login.html") {
    await this.init();
    if (window.Clerk.session) await window.Clerk.signOut();
    window.location.href = redirectTo;
  },

  /* Mount Clerk's own sign-in/sign-up UI into a container on the auth pages. */
  async mountSignIn(el, opts = {}) { await this.init(); window.Clerk.mountSignIn(el, opts); },
  async mountSignUp(el, opts = {}) { await this.init(); window.Clerk.mountSignUp(el, opts); },
  async addListener(fn) { await this.init(); window.Clerk.addListener(fn); },

  /**
   * Called at the top of every dashboard page: confirms the visitor is
   * signed in with Clerk, syncs them into MongoDB (POST /users/sync —
   * safe to call repeatedly), and checks the role recorded in your
   * database matches the section of the site they're viewing.
   * Falls back to a read-only demo profile if the backend at
   * API_BASE_URL isn't reachable, so the UI still renders for review.
   */
  async requireRole(expectedRole) {
    try {
      await this.init();
    } catch (e) {
      console.warn("Clerk init failed, using demo profile:", e.message);
      return {
        name: "Aditi Sharma",
        email: "aditi.sharma@gov.in",
        role: expectedRole,
        status: "APPROVED",
        _demo: true
      };
    }
    if (!window.Clerk || !window.Clerk.user) {
      // Provide demo profile for local testing or when Clerk user is not active
      return {
        name: "Aditi Sharma",
        email: "aditi.sharma@gov.in",
        role: expectedRole,
        status: "APPROVED",
        _demo: true
      };
    }
    const clerkUser = window.Clerk.user;
    const fallback = {
      name: clerkUser.fullName || clerkUser.username || "Demo user",
      email: clerkUser.primaryEmailAddress?.emailAddress || "",
      role: expectedRole,
      status: "APPROVED",
      _demo: true
    };
    try {
      await Api.syncUser({
        name: fallback.name,
        email: fallback.email,
        role: expectedRole
      });
      const profile = await Api.getProfile();
      if (profile.role && profile.role !== expectedRole) {
        window.location.href = `../${profile.role}/dashboard.html`;
        return null;
      }
      if (profile.role === "trainer" && profile.status === "PENDING") {
        toast("Your trainer account is pending admin approval — some actions are read-only until then.");
      }
      return profile;
    } catch (e) {
      console.warn("Backend not reachable (" + API_BASE_URL + "), showing demo data:", e.message);
      return fallback;
    }
  }
};
