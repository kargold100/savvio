# Savvio — cloud backend setup (Google Apps Script + Sheets)

This gives you: cross-device sync, PIN reset by an admin, and lock/unlock/approve
controls — all on a free Google Sheet, no paid hosting.

The app works fully offline without any of this. Do this whenever you're ready
to turn cloud sync on.

## 1. Create the Sheet + script

1. Go to sheets.new to create a fresh Google Sheet. Name it "Savvio Data".
2. Extensions → Apps Script.
3. Delete the default `Code.gs` contents and paste in the full contents of
   `appsscript/Code.gs` from this project.
4. Save (Ctrl/Cmd+S). Name the project "Savvio Backend".

## 2. Your first admin login

Code.gs ships with a default admin login that's created automatically the
first time the `Admins` sheet is empty:

- Username: `sav_admin`
- Password: `SavAdmin123$`

**If you're pushing this repo to public GitHub, change this before you rely
on it** — anyone can read `Code.gs` in a public repo, defaults included.
Two ways to change it:

- **Easiest:** log into `admin/admin.html` with the defaults once it's
  deployed, then reset your own password — (there's no in-UI password
  change yet; for now, edit `DEFAULT_ADMIN_USERNAME` / `DEFAULT_ADMIN_PASSWORD`
  in `Code.gs` before first deploy, or use Script Properties below).
- **More private:** before first deploy, in the Apps Script editor go to
  Project Settings (gear icon) → Script Properties, and add:
  - `ADMIN_BOOTSTRAP_USERNAME` → your own username
  - `ADMIN_BOOTSTRAP_PASSWORD` → your own password
  Script Properties always win over the defaults in the code, and aren't
  visible in the repo. They're only read once (when `Admins` is empty), so
  you can delete them again afterwards.

### Optional: get an email when someone signs up

Add one more Script Property:

- `ADMIN_NOTIFY_EMAIL` → the email address you want notified

Whenever a new profile registers, you'll get a short email ("X just created
a Savvio profile and is waiting for approval"). This is optional — **every
parent profile with an email address on file gets notified automatically
too**, no property needed for that part. Set `ADMIN_NOTIFY_EMAIL` if you
want a copy sent somewhere else as well (e.g. an inbox no single parent
profile owns). Leave everything unset and you'll still see pending
sign-ups on the Admin portal's Overview tab and a parent's Manage tab.

### Forgot PIN (self-service, email-based)

If a parent adds their email on the "Log in or create profile" flow (a
"Skip for now" option is always shown — it's optional), they can tap
"Forgot your PIN?" on the login screen to get a 6-digit code emailed to
them, valid for 1 hour, to set a new PIN themselves. Kids aren't asked for
an email by design — if a kid forgets their PIN, a parent resets it from
the Manage tab or the Admin portal instead. Both `MailApp.sendEmail` calls
(this and the new-signup notification) use Apps Script's default
authorization — no extra setup needed.

## 3. Deploy as a web app

1. In the Apps Script editor: Deploy → New deployment.
2. Click the gear next to "Select type" → Web app.
3. Execute as: **Me**. Who has access: **Anyone**.
4. Deploy, and authorize the requested permissions (this is your own script
   touching your own Sheet).
5. Copy the **Web app URL** — it ends in `/exec`.

## 4. Wire the URL into the app

Paste that URL into one place — `js/cloud.js` → set `const PROXY_URL = "...";`
near the top. Both the main app and the admin portal load this same file, so
one edit covers both.

Bump the `?v=` cache-busting numbers in `index.html` and `admin/admin.html`
and redeploy to GitHub Pages as usual.

## 5. Try it

- Open the app, create a profile (tap "Log in or create profile", enter a
  name + PIN it doesn't recognise, confirm you want to create one, then
  choose **Parent/Guardian** or **Kid or Teen**) — it registers in the
  background as `pending`.
- Open `admin/admin.html`, log in with the admin username/password from
  step 2, and you'll see that profile waiting for approval.
- Approve it. From here: lock, unlock, reject, reset PIN, and approve all
  work from the Admin tab, and everything is written to the `AuditLog`
  sheet.
- On a second device, open the app and tap "Log in or create profile" again
  — same name and PIN logs straight in and pulls down their goals, budget,
  lessons, and quiz history.
- **If you approved a parent profile:** log in as them, and the bottom nav
  shows a **Manage** tab instead of Rewards. From there, tap **"+ Add a kid
  profile"** to set up a kid directly — name, age group, avatar, PIN — and
  it's active immediately, no separate approval step. That's the
  recommended way to add a family's kids: cleaner and more "linked" than
  waiting for each kid to self-register on their own device and then
  hunting down the approval. (Self-signup still works too — if a kid sets
  up their own profile first, it'll show up under Manage → Kids as
  pending, with Approve/Reject buttons.)
- Chores and rewards only unlock for **active** profiles — a pending or
  rejected profile sees a friendly "ask a parent to approve you" message
  instead of the chore list. That's deliberate: approval should actually
  mean something.
- **If you approved a kid profile:** in the app, they'll see chores under
  Rewards → View Chores, tap "Mark done", and it'll show up in a parent's
  Manage tab (or the Admin portal's Chores tab) as pending — approve it and
  the stars land in their account automatically. Same idea for redeeming
  rewards under Rewards → Redeem Rewards.

## Notes

- Every sheet (`Users`, `Admins`, `AuditLog`, `Tasks`, `Completions`,
  `Perks`, `Redemptions`) is created automatically the first time the
  script runs — you don't need to create tabs by hand.
- PINs and the admin password are never stored in plain text — Code.gs
  salts and SHA-256-hashes them before they touch the sheet.
- If `PROXY_URL` is left blank in `cloud.js`, the whole app still works —
  it just stays local-only on that device, same as before. Chores, Rewards,
  and Manage Family specifically need the cloud connected (they only make
  sense with a parent verifying them), and show a friendly message until
  then.
- A profile locked from the Admin portal is enforced the next time that
  device is online (login or app-open triggers a status check). Savvio is a
  family tool, not a bank — this is "good enough" household-level security,
  not something to rely on for anything sensitive.
- Chores are parent-verified by design: marking a chore done never credits
  stars by itself — a parent or admin approving it does. Redeeming a reward
  deducts stars immediately (so a kid can't request the same reward twice
  with money they don't have) and refunds automatically if rejected.
- **Flexi Save** (Goals → 🐷 Flexi Save) is a digital piggy bank with no
  fixed target — quick-save buttons, a running total, and a weekly-save
  count nudging toward 2–3 saves a week. It's fully local/synced like
  Goals — no parent setup needed, unlike Chores.
- **Currency** is a per-profile display preference (Profile → Accessibility
  → Currency: $, ₹, €, £, ¥) — it only changes the symbol shown, not any
  stored values, so switching it is always safe and reversible.
- The app is a full installable PWA now (`manifest.json` + `service-worker.js`
  + `assets/icons/`). On Android, "Add to Home Screen" gives a real app
  icon with no browser chrome. To go further and package it as an actual
  Android app (for sideloading, a small private distribution, or the Play
  Store), feed the deployed URL into pwabuilder.com — it reads the
  manifest automatically and generates a signed Android package.
- **Parent vs Admin — why both exist:** a parent profile is secured the
  same way as a kid's — a 4-digit PIN. That's fine for day-to-day things
  (chores, rewards, approving a new kid), but too weak to gate account
  recovery. So locking, unlocking, resetting a PIN, and deleting a profile
  stay Admin-portal-only, behind its separate username/password login. A
  parent also can't approve *another* parent's sign-up in-app — new parent
  profiles always need Admin-portal approval, so a stranger who finds your
  app URL can't self-register as "parent" and get in that way. In a
  single-family deployment (the default for this whole project — one
  Google Sheet per household) every parent profile automatically manages
  every kid profile in that sheet; there's no separate "linking" step
  needed. If you ever share one deployment across multiple unrelated
  families, that's a bigger change this version doesn't cover.
