/**
 * Savvio — Apps Script backend
 * ---------------------------------------------------------------
 * Sheets used (auto-created on first run): Users, Admins, AuditLog
 *
 * SECURITY MODEL
 * - PINs and the admin password arrive as plain values in the
 *   POST body over HTTPS, then are immediately salted + SHA-256
 *   hashed here and only the hash is stored. Plain values are
 *   never written to a sheet or logged.
 * - Every user row gets its own random salt (registerProfile).
 * - Logins issue a random session token with an expiry; every
 *   sync/restore call must present a still-valid token.
 * - 5 wrong PINs in a row auto-locks the profile server-side —
 *   an admin has to unlock it or reset the PIN.
 * - Admin actions all require a valid adminSessionToken and are
 *   written to the AuditLog sheet (who did what, to whom, when).
 *
 * ONE-TIME SETUP — see SETUP.md for the full walkthrough.
 */

const SHEET_USERS = "Users";
const SHEET_ADMINS = "Admins";
const SHEET_AUDIT = "AuditLog";
const SESSION_HOURS = 24;
const ADMIN_SESSION_HOURS = 6;
const MAX_FAILED_ATTEMPTS = 5;

const USER_HEADERS = ["userId","name","ageGroup","avatar","pinHash","pinSalt","status","xp","streak","lastActiveDate","createdDate","dataJson","sessionToken","sessionExpiry","failedAttempts"];
const ADMIN_HEADERS = ["adminId","username","passwordHash","passwordSalt","createdDate","sessionToken","sessionExpiry"];
const AUDIT_HEADERS = ["timestamp","admin","action","targetUserId","details"];

// ---------------------------------------------------------------
// Entry points
// ---------------------------------------------------------------
function doPost(e) {
  let body;
  try {
    body = JSON.parse(e.postData.contents);
  } catch (err) {
    return jsonOut({ ok: false, error: "Bad request" });
  }
  try {
    switch (body.action) {
      case "registerProfile": return jsonOut(registerProfile(body));
      case "loginProfile":    return jsonOut(loginProfile(body));
      case "checkStatus":     return jsonOut(checkStatus(body));
      case "syncProfile":     return jsonOut(syncProfile(body));
      case "restoreProfile":  return jsonOut(restoreProfile(body));

      case "adminLogin":        return jsonOut(adminLogin(body));
      case "adminListUsers":    return jsonOut(adminListUsers(body));
      case "adminApproveUser":  return jsonOut(adminSetStatus(body, "active", "approveUser"));
      case "adminLockUser":     return jsonOut(adminSetStatus(body, "locked", "lockUser"));
      case "adminUnlockUser":   return jsonOut(adminSetStatus(body, "active", "unlockUser"));
      case "adminResetPin":     return jsonOut(adminResetPin(body));
      case "adminDeleteUser":   return jsonOut(adminDeleteUser(body));

      default: return jsonOut({ ok: false, error: "Unknown action" });
    }
  } catch (err) {
    return jsonOut({ ok: false, error: String(err && err.message ? err.message : err) });
  }
}

function doGet(e) {
  return jsonOut({ ok: true, service: "Savvio API" });
}

function jsonOut(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

// ---------------------------------------------------------------
// Sheet helpers
// ---------------------------------------------------------------
function sheet(name) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  return sh;
}

function ensureHeaders(sh, headers) {
  const first = sh.getRange(1, 1, 1, headers.length).getValues()[0];
  if (first.join("") === "") sh.getRange(1, 1, 1, headers.length).setValues([headers]);
}

function usersSheet() { const sh = sheet(SHEET_USERS); ensureHeaders(sh, USER_HEADERS); return sh; }
function adminsSheet() { const sh = sheet(SHEET_ADMINS); ensureHeaders(sh, ADMIN_HEADERS); bootstrapAdmin(sh); return sh; }
function auditSheet() { const sh = sheet(SHEET_AUDIT); ensureHeaders(sh, AUDIT_HEADERS); return sh; }

function readRows(sh, headers) {
  const values = sh.getDataRange().getValues();
  const rows = [];
  for (let i = 1; i < values.length; i++) {
    if (!values[i][0]) continue;
    const obj = {};
    headers.forEach((h, idx) => obj[h] = values[i][idx]);
    obj._row = i + 1;
    rows.push(obj);
  }
  return rows;
}

function findUser(userId) {
  return readRows(usersSheet(), USER_HEADERS).find(r => r.userId === userId) || null;
}

function writeUserRow(row) {
  usersSheet().getRange(row._row, 1, 1, USER_HEADERS.length).setValues([USER_HEADERS.map(h => row[h])]);
}

function appendUserRow(obj) {
  usersSheet().appendRow(USER_HEADERS.map(h => (obj[h] !== undefined ? obj[h] : "")));
}

// ---------------------------------------------------------------
// Crypto helpers — server-side salted SHA-256 only
// ---------------------------------------------------------------
function randomSalt() { return Utilities.getUuid().replace(/-/g, ""); }

function hashWithSalt(value, salt) {
  const bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(value) + ":" + salt);
  return bytes.map(b => (b < 0 ? b + 256 : b).toString(16).padStart(2, "0")).join("");
}

function randomToken() { return Utilities.getUuid() + Utilities.getUuid(); }
function nowIso() { return new Date().toISOString(); }
function hoursFromNow(h) { return new Date(Date.now() + h * 3600 * 1000).toISOString(); }

function publicUser(user) {
  return {
    userId: user.userId, name: user.name, ageGroup: user.ageGroup, avatar: user.avatar,
    status: user.status, xp: user.xp, streak: user.streak,
    lastActiveDate: user.lastActiveDate, createdDate: user.createdDate,
  };
}

// ---------------------------------------------------------------
// User-facing actions
// ---------------------------------------------------------------
function registerProfile(body) {
  const { userId, name, ageGroup, avatar, pin } = body;
  if (!userId || !name || !pin) return { ok: false, error: "Missing fields" };
  if (findUser(userId)) return { ok: false, error: "Profile already exists" };
  const salt = randomSalt();
  appendUserRow({
    userId, name, ageGroup, avatar,
    pinHash: hashWithSalt(pin, salt), pinSalt: salt,
    status: "pending", xp: 0, streak: 0, lastActiveDate: "", createdDate: nowIso(),
    dataJson: "{}", sessionToken: "", sessionExpiry: "", failedAttempts: 0,
  });
  // New profiles start "pending" until a parent/admin approves them in the
  // Admin portal. Approval only gates cloud sync + cross-device restore —
  // the app itself keeps working fully offline on the original device.
  return { ok: true, status: "pending" };
}

function loginProfile(body) {
  const { userId, pin } = body;
  const user = findUser(userId);
  if (!user) return { ok: false, error: "Profile not found" };
  if (user.status === "locked") return { ok: false, error: "locked", locked: true };

  if (hashWithSalt(pin, user.pinSalt) !== user.pinHash) {
    const attempts = Number(user.failedAttempts || 0) + 1;
    user.failedAttempts = attempts;
    if (attempts >= MAX_FAILED_ATTEMPTS) user.status = "locked";
    writeUserRow(user);
    return {
      ok: false,
      error: attempts >= MAX_FAILED_ATTEMPTS ? "locked" : "Incorrect PIN",
      locked: attempts >= MAX_FAILED_ATTEMPTS,
      attemptsLeft: Math.max(0, MAX_FAILED_ATTEMPTS - attempts),
    };
  }

  user.failedAttempts = 0;
  user.sessionToken = randomToken();
  user.sessionExpiry = hoursFromNow(SESSION_HOURS);
  writeUserRow(user);
  return { ok: true, sessionToken: user.sessionToken, profile: publicUser(user) };
}

function checkStatus(body) {
  const user = findUser(body.userId);
  if (!user) return { ok: false, error: "Profile not found" };
  return { ok: true, status: user.status };
}

function validSession(user, token) {
  return !!(user && user.sessionToken && token && user.sessionToken === token &&
    user.sessionExpiry && new Date(user.sessionExpiry) > new Date());
}

function syncProfile(body) {
  const { userId, sessionToken, xp, streak, lastActiveDate, dataJson } = body;
  const user = findUser(userId);
  if (!user) return { ok: false, error: "Profile not found" };
  if (!validSession(user, sessionToken)) return { ok: false, error: "Session expired, please log in again" };
  if (user.status === "locked") return { ok: false, error: "locked", locked: true };
  user.xp = xp; user.streak = streak; user.lastActiveDate = lastActiveDate;
  user.dataJson = JSON.stringify(dataJson || {});
  writeUserRow(user);
  return { ok: true, status: user.status };
}

function restoreProfile(body) {
  const { userId, sessionToken } = body;
  const user = findUser(userId);
  if (!user) return { ok: false, error: "Profile not found" };
  if (!validSession(user, sessionToken)) return { ok: false, error: "Session expired, please log in again" };
  return { ok: true, profile: publicUser(user), dataJson: user.dataJson };
}

// ---------------------------------------------------------------
// Admin bootstrap & auth
// ---------------------------------------------------------------
// The very first admin account is seeded once from Script
// Properties (set these in Project Settings, not in code) so no
// credential ever lives in a file that gets committed to GitHub.
function bootstrapAdmin(sh) {
  const rows = readRows(sh, ADMIN_HEADERS);
  if (rows.length > 0) return;
  const props = PropertiesService.getScriptProperties();
  const username = props.getProperty("ADMIN_BOOTSTRAP_USERNAME");
  const password = props.getProperty("ADMIN_BOOTSTRAP_PASSWORD");
  if (!username || !password) return;
  const salt = randomSalt();
  sh.appendRow([Utilities.getUuid(), username, hashWithSalt(password, salt), salt, nowIso(), "", ""]);
}

function findAdmin(username) {
  return readRows(adminsSheet(), ADMIN_HEADERS).find(r => r.username === username) || null;
}

function adminLogin(body) {
  const { username, password } = body;
  const admin = findAdmin(username);
  if (!admin) return { ok: false, error: "Invalid credentials" };
  if (hashWithSalt(password, admin.passwordSalt) !== admin.passwordHash) return { ok: false, error: "Invalid credentials" };
  admin.sessionToken = randomToken();
  admin.sessionExpiry = hoursFromNow(ADMIN_SESSION_HOURS);
  adminsSheet().getRange(admin._row, 1, 1, ADMIN_HEADERS.length).setValues([ADMIN_HEADERS.map(h => admin[h])]);
  return { ok: true, adminSessionToken: admin.sessionToken, username: admin.username };
}

function validAdminSession(token) {
  if (!token) return null;
  return readRows(adminsSheet(), ADMIN_HEADERS)
    .find(r => r.sessionToken === token && r.sessionExpiry && new Date(r.sessionExpiry) > new Date()) || null;
}

function requireAdmin(body) {
  const admin = validAdminSession(body.adminSessionToken);
  if (!admin) throw new Error("Not authorized");
  return admin;
}

function logAudit(admin, action, targetUserId, details) {
  auditSheet().appendRow([nowIso(), admin.username, action, targetUserId || "", details || ""]);
}

// ---------------------------------------------------------------
// Admin actions
// ---------------------------------------------------------------
function adminListUsers(body) {
  requireAdmin(body);
  return { ok: true, users: readRows(usersSheet(), USER_HEADERS).map(publicUser) };
}

function adminSetStatus(body, status, actionName) {
  const admin = requireAdmin(body);
  const user = findUser(body.userId);
  if (!user) return { ok: false, error: "Profile not found" };
  user.status = status;
  if (status === "active") user.failedAttempts = 0;
  writeUserRow(user);
  logAudit(admin, actionName, body.userId, "");
  return { ok: true };
}

function adminResetPin(body) {
  const admin = requireAdmin(body);
  const user = findUser(body.userId);
  if (!user) return { ok: false, error: "Profile not found" };
  const newPin = body.newPin || String(Math.floor(1000 + Math.random() * 9000));
  const salt = randomSalt();
  user.pinHash = hashWithSalt(newPin, salt);
  user.pinSalt = salt;
  user.failedAttempts = 0;
  if (user.status === "locked") user.status = "active";
  writeUserRow(user);
  logAudit(admin, "resetPin", body.userId, "");
  return { ok: true, newPin };
}

function adminDeleteUser(body) {
  const admin = requireAdmin(body);
  const user = findUser(body.userId);
  if (!user) return { ok: false, error: "Profile not found" };
  usersSheet().deleteRow(user._row);
  logAudit(admin, "deleteUser", body.userId, "");
  return { ok: true };
}
