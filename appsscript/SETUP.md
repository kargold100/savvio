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

## 2. Set your first admin login (one time only)

1. In the Apps Script editor: Project Settings (gear icon) → Script Properties.
2. Add two properties:
   - `ADMIN_BOOTSTRAP_USERNAME` → e.g. `kavya`
   - `ADMIN_BOOTSTRAP_PASSWORD` → a strong password only you know
3. These are only ever read once, the first time the `Admins` sheet is empty,
   to create your admin account (stored as a salted hash, never as plain
   text). You can delete both properties again afterwards if you like —
   they're not needed after that first run.

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

- Open the app, create a profile — it registers in the background as
  `pending`.
- Open `admin/admin.html`, log in with the username/password from step 2,
  and you'll see that profile waiting for approval.
- Approve it. From here: lock, unlock, reset PIN, and approve all work from
  the Admin tab, and everything is written to the `AuditLog` sheet.

## Notes

- Every sheet (`Users`, `Admins`, `AuditLog`) is created automatically the
  first time the script runs — you don't need to create tabs by hand.
- PINs and the admin password are never stored in plain text — Code.gs
  salts and SHA-256-hashes them before they touch the sheet.
- If `PROXY_URL` is left blank in `cloud.js`, the whole app still works —
  it just stays local-only on that device, same as before.
- A profile locked from the Admin portal is enforced the next time that
  device is online (login or app-open triggers a status check). Savvio is a
  family tool, not a bank — this is "good enough" household-level security,
  not something to rely on for anything sensitive.
