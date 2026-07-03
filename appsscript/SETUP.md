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
a Savvio profile and is waiting for approval"). Leave this property unset
if you'd rather just check the Admin portal's Overview tab, which shows
pending sign-ups too. This uses `MailApp.sendEmail`, which is included in
Apps Script's default authorization — no extra scopes or setup needed.

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
  name + PIN it doesn't recognise, confirm you want to create one) — it
  registers in the background as `pending`.
- Open `admin/admin.html`, log in with the admin username/password from
  step 2, and you'll see that profile waiting for approval.
- Approve it. From here: lock, unlock, reject, reset PIN, and approve all
  work from the Admin tab, and everything is written to the `AuditLog`
  sheet.
- On a second device, open the app and tap "Log in or create profile" again
  — same name and PIN logs straight in and pulls down their goals, budget,
  lessons, and quiz history.
- In the Admin portal's **Chores** tab, add a chore (e.g. "Make your bed",
  5 stars, daily) assigned to that kid or to "All kids". In the app, they'll
  see it under Rewards → View Chores, tap "Mark done", and it'll show up in
  your Chores tab as pending — approve it and the stars land in their
  account automatically.
- In the **Rewards** admin tab (perks), add something they can spend stars
  on. They'll see it under Rewards → Redeem Rewards once they have enough
  stars; redeeming creates a pending request you fulfil (or reject, which
  refunds the stars) from that same tab.

## Notes

- Every sheet (`Users`, `Admins`, `AuditLog`, `Tasks`, `Completions`,
  `Perks`, `Redemptions`) is created automatically the first time the
  script runs — you don't need to create tabs by hand.
- PINs and the admin password are never stored in plain text — Code.gs
  salts and SHA-256-hashes them before they touch the sheet.
- If `PROXY_URL` is left blank in `cloud.js`, the whole app still works —
  it just stays local-only on that device, same as before. Chores and
  Rewards specifically need the cloud connected (they only make sense with
  a parent verifying them), and show a friendly message until then.
- A profile locked from the Admin portal is enforced the next time that
  device is online (login or app-open triggers a status check). Savvio is a
  family tool, not a bank — this is "good enough" household-level security,
  not something to rely on for anything sensitive.
- Chores are parent-verified by design: marking a chore done never credits
  stars by itself — an admin approving it does. Redeeming a reward deducts
  stars immediately (so a kid can't request the same reward twice with
  money they don't have) and refunds automatically if you reject it.
