# Running Saksham frontend + backend together (local)

This frontend is plain HTML/CSS/JS — no build step. It just needs to be
served (not opened as `file://`) so Clerk and CORS behave, and served on
the same origin your backend's `FRONTEND_URL` expects.

## 1. Start the backend
```
cd sih-imd-backend
cp .env.example .env      # if you haven't already
npm install
npm run dev
```
Confirm it's up: open `http://localhost:5000/api/health` — you should see
`{"status":"ok",...}`. Leave this running in its own terminal.

Check `.env`: `FRONTEND_URL` should be `http://localhost:3000` (the
default in `.env.example`) since that's the origin we're about to serve
the frontend from. If you serve it on a different port, update this and
restart the backend.

## 2. Serve this frontend on port 3000
From this folder (the one with `index.html` in it), in a second terminal:
```
npx serve -l 3000
```
`npx serve` will prompt to install `serve` the first time — say yes.
Open the URL it prints (`http://localhost:3000`).

Any static server works as long as it's port 3000 to match `FRONTEND_URL`
above — e.g. `python3 -m http.server 3000` also works, though `npx serve`
handles SPA-style routing a bit better if you extend this later.

## 3. Test the flow
1. Visit `http://localhost:3000` → **Sign up**.
2. Pick **Trainee**, complete Clerk's sign-up form. You should land on
   `trainee/profile.html` — open your browser's dev tools Network tab
   and confirm `/api/users/sync` and `/api/users/me` returned 200, not
   a CORS error or 404.
3. Sign up a second account as **Trainer**. It should show the
   "pending admin approval" message instead of a dashboard.
4. To test the admin side, manually set that trainer's role to `admin`
   directly in MongoDB Atlas (there's no self-serve way to become the
   first admin — that's expected for a fresh backend), then log in as
   them and approve the pending trainer from **User Approvals**.

## If something doesn't connect
- **CORS error in the console** → `FRONTEND_URL` in the backend's `.env`
  doesn't match the origin you're serving the frontend from. Fix and
  restart `npm run dev`.
- **401/403 on API calls** → Clerk publishable key mismatch. This
  frontend uses the key already in `test-harness/index.html`
  (`assets/js/clerk-auth.js` → `CLERK_PUBLISHABLE_KEY`). If your backend
  uses a *different* Clerk app's secret key, update that constant to
  match your Clerk app's publishable key.
- **Calls fall back to sample data silently** → open dev tools Console;
  every fallback logs `console.warn("Backend not reachable...")` or the
  specific error, so you can see exactly which call failed and why.
- **A page just shows sample data on every field** → some endpoints
  genuinely aren't built yet (certificates, course feedback, homepage
  announcements, AI trainer-matching, aggregated trainee performance —
  see `API_DOCUMENTATION.md` → "Not yet built"). These are stubbed in
  `assets/js/api.js` to fail clearly rather than pretend to work; build
  the route, then fill in the matching stub.
