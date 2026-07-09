/**
 * Savvio — Apps Script backend
 * ---------------------------------------------------------------
 * Sheets used (auto-created on first run):
 *   Users, Admins, AuditLog, Tasks, Completions, Perks, Redemptions
 *
 * SECURITY MODEL
 * - PINs and the admin password arrive as plain values in the
 *   POST body over HTTPS, then are immediately salted + SHA-256
 *   hashed here and only the hash is stored. Plain values are
 *   never written to a sheet or logged.
 * - Every user row gets its own random salt (registerProfile).
 * - Logins issue a random session token with an expiry; every
 *   sync/restore/chore/perk call must present a still-valid token.
 * - 5 wrong PINs in a row auto-locks the profile server-side —
 *   an admin has to unlock it or reset the PIN.
 * - Admin actions all require a valid adminSessionToken and are
 *   written to the AuditLog sheet (who did what, to whom, when).
 *
 * CHORES → STARS → REWARDS
 * - Admin defines Tasks (chores) with a star value, and Perks
 *   (rewards) with a star cost. Either can be assigned to one kid
 *   or to "all".
 * - A kid marking a chore done creates a *pending* Completion —
 *   stars are only credited once an admin approves it. This keeps
 *   the whole loop parent-verified, same as a real chore chart.
 * - Redeeming a perk deducts stars immediately (so a kid can't
 *   overspend across several pending requests) and creates a
 *   pending Redemption; if an admin rejects it, the stars are
 *   refunded automatically.
 *
 * ONE-TIME SETUP — see SETUP.md for the full walkthrough.
 */

const SHEET_USERS = "Users";
const SHEET_ADMINS = "Admins";
const SHEET_AUDIT = "AuditLog";
const SHEET_TASKS = "Tasks";
const SHEET_COMPLETIONS = "Completions";
const SHEET_PERKS = "Perks";
const SHEET_REDEMPTIONS = "Redemptions";

const SESSION_HOURS = 24;
const ADMIN_SESSION_HOURS = 6;
const MAX_FAILED_ATTEMPTS = 5;

// Used only the very first time the Admins sheet is empty, and only if
// Script Properties don't already define ADMIN_BOOTSTRAP_USERNAME /
// ADMIN_BOOTSTRAP_PASSWORD. Script Properties always win if set — see
// SETUP.md. NOTE: if this file is pushed to a public GitHub repo, these
// defaults are visible to anyone who looks at the repo. Change the admin
// password from Script Properties right after your first login if that
// matters to you.
const DEFAULT_ADMIN_USERNAME = "sav_admin";
const DEFAULT_ADMIN_PASSWORD = "SavAdmin123$";

const USER_HEADERS = ["userId","name","ageGroup","role","avatar","pinHash","pinSalt","status","xp","streak","stars","lastActiveDate","createdDate","dataJson","sessionToken","sessionExpiry","failedAttempts"];
const ADMIN_HEADERS = ["adminId","username","passwordHash","passwordSalt","createdDate","sessionToken","sessionExpiry"];
const AUDIT_HEADERS = ["timestamp","admin","action","targetUserId","details"];
const TASK_HEADERS = ["taskId","title","starValue","assignedTo","recurring","active","createdDate"];
const COMPLETION_HEADERS = ["completionId","taskId","userId","taskTitle","starValue","periodKey","status","submittedDate","reviewedDate"];
const PERK_HEADERS = ["perkId","title","starCost","assignedTo","active","createdDate"];
const REDEMPTION_HEADERS = ["redemptionId","perkId","userId","perkTitle","starCost","status","requestedDate","reviewedDate"];

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
      case "loginByName":     return jsonOut(loginByName(body));
      case "checkStatus":     return jsonOut(checkStatus(body));
      case "syncProfile":     return jsonOut(syncProfile(body));
      case "restoreProfile":  return jsonOut(restoreProfile(body));
      case "updateProfile":   return jsonOut(updateProfile(body));
      case "changePin":       return jsonOut(changePin(body));

      case "listTasks":    return jsonOut(listTasks(body));
      case "completeTask": return jsonOut(completeTask(body));
      case "listPerks":    return jsonOut(listPerks(body));
      case "redeemPerk":   return jsonOut(redeemPerk(body));

      case "listMyKids":       return jsonOut(listMyKids(body));
      case "parentCreateKid":  return jsonOut(parentCreateKid(body));
      case "parentApproveKid": return jsonOut(parentApproveKid(body));
      case "parentRejectKid":  return jsonOut(parentRejectKid(body));
      case "parentAdjustStars": return jsonOut(parentAdjustStars(body));

      case "parentListTasks":              return jsonOut(parentListTasks(body));
      case "parentCreateTask":             return jsonOut(parentCreateTask(body));
      case "parentUpdateTask":             return jsonOut(parentUpdateTask(body));
      case "parentDeleteTask":             return jsonOut(parentDeleteTask(body));
      case "parentListPendingCompletions": return jsonOut(parentListPendingCompletions(body));
      case "parentReviewCompletion":       return jsonOut(parentReviewCompletion(body));

      case "parentListPerks":              return jsonOut(parentListPerks(body));
      case "parentCreatePerk":             return jsonOut(parentCreatePerk(body));
      case "parentUpdatePerk":             return jsonOut(parentUpdatePerk(body));
      case "parentDeletePerk":             return jsonOut(parentDeletePerk(body));
      case "parentListPendingRedemptions": return jsonOut(parentListPendingRedemptions(body));
      case "parentReviewRedemption":       return jsonOut(parentReviewRedemption(body));

      case "adminLogin":        return jsonOut(adminLogin(body));
      case "adminListUsers":    return jsonOut(adminListUsers(body));
      case "adminApproveUser":  return jsonOut(adminSetStatus(body, "active", "approveUser"));
      case "adminRejectUser":   return jsonOut(adminSetStatus(body, "rejected", "rejectUser"));
      case "adminLockUser":     return jsonOut(adminSetStatus(body, "locked", "lockUser"));
      case "adminUnlockUser":   return jsonOut(adminSetStatus(body, "active", "unlockUser"));
      case "adminResetPin":     return jsonOut(adminResetPin(body));
      case "adminDeleteUser":   return jsonOut(adminDeleteUser(body));

      case "adminListTasks":               return jsonOut(adminListTasks(body));
      case "adminCreateTask":              return jsonOut(adminCreateTask(body));
      case "adminUpdateTask":              return jsonOut(adminUpdateTask(body));
      case "adminDeleteTask":              return jsonOut(adminDeleteTask(body));
      case "adminListPendingCompletions":  return jsonOut(adminListPendingCompletions(body));
      case "adminReviewCompletion":        return jsonOut(adminReviewCompletion(body));

      case "adminListPerks":               return jsonOut(adminListPerks(body));
      case "adminCreatePerk":              return jsonOut(adminCreatePerk(body));
      case "adminUpdatePerk":              return jsonOut(adminUpdatePerk(body));
      case "adminDeletePerk":              return jsonOut(adminDeletePerk(body));
      case "adminListPendingRedemptions":  return jsonOut(adminListPendingRedemptions(body));
      case "adminReviewRedemption":        return jsonOut(adminReviewRedemption(body));

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
// Generic sheet helpers
// These are schema-migration-safe: ensureHeaders() only ever
// *appends* missing columns, and reads/writes look columns up by
// name (headerMap) rather than assuming a fixed position. That
// means adding a new field later (like "stars" here) doesn't
// break an already-deployed sheet — existing columns are left
// exactly where they are.
// ---------------------------------------------------------------
function sheet(name) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  return sh;
}

function ensureHeaders(sh, headers) {
  const lastCol = sh.getLastColumn();
  if (lastCol === 0) { sh.getRange(1, 1, 1, headers.length).setValues([headers]); return; }
  const existing = sh.getRange(1, 1, 1, lastCol).getValues()[0];
  headers.forEach(h => {
    if (existing.indexOf(h) === -1) {
      const col = sh.getLastColumn() + 1;
      sh.getRange(1, col).setValue(h);
      existing.push(h);
    }
  });
}

function headerMap(sh) {
  const lastCol = sh.getLastColumn();
  const existing = lastCol ? sh.getRange(1, 1, 1, lastCol).getValues()[0] : [];
  const map = {};
  existing.forEach((h, i) => { if (h) map[h] = i; });
  return map;
}

function readRows(sh, headers) {
  const map = headerMap(sh);
  const idCol = map[headers[0]];
  const values = sh.getDataRange().getValues();
  const rows = [];
  for (let i = 1; i < values.length; i++) {
    if (idCol === undefined || !values[i][idCol]) continue;
    const obj = {};
    headers.forEach(h => obj[h] = (map[h] !== undefined ? values[i][map[h]] : ""));
    obj._row = i + 1;
    rows.push(obj);
  }
  return rows;
}

function writeRow(sh, headers, row) {
  const map = headerMap(sh);
  headers.forEach(h => {
    if (map[h] !== undefined) sh.getRange(row._row, map[h] + 1).setValue(row[h] !== undefined ? row[h] : "");
  });
}

function appendRowObj(sh, headers, obj) {
  const map = headerMap(sh);
  const width = Math.max(sh.getLastColumn(), headers.length);
  const rowArr = new Array(width).fill("");
  headers.forEach(h => { if (map[h] !== undefined) rowArr[map[h]] = (obj[h] !== undefined ? obj[h] : ""); });
  sh.appendRow(rowArr);
}

function usersSheet() { const sh = sheet(SHEET_USERS); ensureHeaders(sh, USER_HEADERS); return sh; }
function adminsSheet() { const sh = sheet(SHEET_ADMINS); ensureHeaders(sh, ADMIN_HEADERS); bootstrapAdmin(sh); return sh; }
function auditSheet() { const sh = sheet(SHEET_AUDIT); ensureHeaders(sh, AUDIT_HEADERS); return sh; }
function tasksSheet() { const sh = sheet(SHEET_TASKS); ensureHeaders(sh, TASK_HEADERS); return sh; }
function completionsSheet() { const sh = sheet(SHEET_COMPLETIONS); ensureHeaders(sh, COMPLETION_HEADERS); return sh; }
function perksSheet() { const sh = sheet(SHEET_PERKS); ensureHeaders(sh, PERK_HEADERS); return sh; }
function redemptionsSheet() { const sh = sheet(SHEET_REDEMPTIONS); ensureHeaders(sh, REDEMPTION_HEADERS); return sh; }

function findUser(userId) {
  return readRows(usersSheet(), USER_HEADERS).find(r => r.userId === userId) || null;
}
function writeUserRow(row) { writeRow(usersSheet(), USER_HEADERS, row); }
function appendUserRow(obj) { appendRowObj(usersSheet(), USER_HEADERS, obj); }

function isTrue(v) { return v === true || v === "TRUE" || v === "true"; }
function visibleTo(row, userId) { return row.assignedTo === "all" || row.assignedTo === userId; }

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

function periodKeyFor(recurring) {
  const tz = Session.getScriptTimeZone();
  const now = new Date();
  if (recurring === "daily") return Utilities.formatDate(now, tz, "yyyy-MM-dd");
  if (recurring === "weekly") return Utilities.formatDate(now, tz, "YYYY-'W'ww");
  return "once"; // a one-off task can only ever be completed a single time
}

function publicUser(user) {
  return {
    userId: user.userId, name: user.name, ageGroup: user.ageGroup, role: user.role || "kid", avatar: user.avatar,
    status: user.status, xp: user.xp, streak: user.streak, stars: Number(user.stars) || 0,
    lastActiveDate: user.lastActiveDate, createdDate: user.createdDate,
  };
}

// ---------------------------------------------------------------
// User-facing actions
// ---------------------------------------------------------------
function registerProfile(body) {
  const { userId, name, ageGroup, avatar, pin } = body;
  const role = body.role === "parent" ? "parent" : "kid";
  if (!userId || !name || !pin) return { ok: false, error: "Missing fields" };
  if (findUser(userId)) return { ok: false, error: "Profile already exists" };
  const salt = randomSalt();
  const sessionToken = randomToken();
  const sessionExpiry = hoursFromNow(SESSION_HOURS);
  appendUserRow({
    userId, name, ageGroup, role, avatar,
    pinHash: hashWithSalt(pin, salt), pinSalt: salt,
    status: "pending", xp: 0, streak: 0, stars: 0, lastActiveDate: "", createdDate: nowIso(),
    dataJson: "{}", sessionToken, sessionExpiry, failedAttempts: 0,
  });
  notifyAdminNewSignup(name + (role === "parent" ? " (parent/guardian)" : ""));
  // New profiles start "pending" so they show up for parent/admin review,
  // but that status doesn't block anything technically — sync and
  // chores/perks all work right away. Approve/reject are for oversight
  // and to trigger the "you're approved!" notice in-app. Parent-role
  // signups can only be approved from the Admin portal (never by another
  // parent in-app) — see requireActiveParent below.
  return { ok: true, status: "pending", sessionToken };
}

function notifyAdminNewSignup(name) {
  const email = PropertiesService.getScriptProperties().getProperty("ADMIN_NOTIFY_EMAIL");
  if (!email) return;
  try {
    MailApp.sendEmail({
      to: email,
      subject: "Savvio: new profile waiting for approval",
      body: name + " just created a Savvio profile and is waiting for approval.\n\nOpen the Admin portal to approve, reject, lock, or manage it.",
      name: "Savvio Admin Alerts",
    });
  } catch (e) { /* best effort — a failed email shouldn't block signup */ }
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

// Lets the client log in with just a name + PIN instead of the internal
// userId — used for "log in on a new device" and "is this profile new".
function loginByName(body) {
  const { name, pin } = body;
  if (!name || !pin) return { ok: false, error: "Missing fields" };
  const rows = readRows(usersSheet(), USER_HEADERS);
  const matches = rows.filter(r => String(r.name).trim().toLowerCase() === String(name).trim().toLowerCase());
  if (matches.length === 0) return { ok: false, error: "not_found", notFound: true };

  for (const user of matches) {
    if (user.status === "locked") continue;
    if (hashWithSalt(pin, user.pinSalt) === user.pinHash) {
      user.failedAttempts = 0;
      user.sessionToken = randomToken();
      user.sessionExpiry = hoursFromNow(SESSION_HOURS);
      writeUserRow(user);
      return { ok: true, sessionToken: user.sessionToken, profile: publicUser(user) };
    }
  }

  if (matches.length === 1 && matches[0].status === "locked") {
    return { ok: false, error: "locked", locked: true };
  }

  const target = matches[0];
  const attempts = Number(target.failedAttempts || 0) + 1;
  target.failedAttempts = attempts;
  if (attempts >= MAX_FAILED_ATTEMPTS) target.status = "locked";
  writeUserRow(target);
  return {
    ok: false,
    error: attempts >= MAX_FAILED_ATTEMPTS ? "locked" : "Incorrect PIN",
    locked: attempts >= MAX_FAILED_ATTEMPTS,
  };
}

function checkStatus(body) {
  const user = findUser(body.userId);
  if (!user) return { ok: false, error: "Profile not found" };
  return { ok: true, status: user.status, stars: Number(user.stars) || 0 };
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
  return { ok: true, status: user.status, stars: Number(user.stars) || 0 };
}

function restoreProfile(body) {
  const { userId, sessionToken } = body;
  const user = findUser(userId);
  if (!user) return { ok: false, error: "Profile not found" };
  if (!validSession(user, sessionToken)) return { ok: false, error: "Session expired, please log in again" };
  return { ok: true, profile: publicUser(user), dataJson: user.dataJson };
}

function updateProfile(body) {
  const { userId, sessionToken, name, ageGroup, avatar } = body;
  const user = findUser(userId);
  if (!user) return { ok: false, error: "Profile not found" };
  if (!validSession(user, sessionToken)) return { ok: false, error: "Session expired, please log in again" };
  if (user.status === "locked") return { ok: false, error: "locked", locked: true };
  if (name) user.name = name;
  if (ageGroup) user.ageGroup = ageGroup;
  if (avatar) user.avatar = avatar;
  writeUserRow(user);
  return { ok: true, profile: publicUser(user) };
}

function changePin(body) {
  const { userId, sessionToken, currentPin, newPin } = body;
  const user = findUser(userId);
  if (!user) return { ok: false, error: "Profile not found" };
  if (!validSession(user, sessionToken)) return { ok: false, error: "Session expired, please log in again" };
  if (user.status === "locked") return { ok: false, error: "locked", locked: true };
  if (hashWithSalt(currentPin, user.pinSalt) !== user.pinHash) return { ok: false, error: "Current PIN is incorrect" };
  if (!/^\d{4}$/.test(String(newPin))) return { ok: false, error: "New PIN must be 4 digits" };
  const salt = randomSalt();
  user.pinHash = hashWithSalt(newPin, salt);
  user.pinSalt = salt;
  writeUserRow(user);
  return { ok: true };
}

// ---------------------------------------------------------------
// Chores (Tasks → Completions)
// ---------------------------------------------------------------
function listTasks(body) {
  const { userId, sessionToken } = body;
  const user = findUser(userId);
  if (!user) return { ok: false, error: "Profile not found" };
  if (!validSession(user, sessionToken)) return { ok: false, error: "Session expired, please log in again" };
  if (user.status !== "active") return { ok: false, error: "not_approved", notApproved: true };

  const tasks = readRows(tasksSheet(), TASK_HEADERS).filter(t => isTrue(t.active) && visibleTo(t, userId));
  const completions = readRows(completionsSheet(), COMPLETION_HEADERS).filter(c => c.userId === userId);

  const out = tasks.map(t => {
    const key = periodKeyFor(t.recurring);
    const mine = completions
      .filter(c => c.taskId === t.taskId && c.periodKey === key)
      .sort((a, b) => String(b.submittedDate).localeCompare(String(a.submittedDate)))[0];
    return {
      taskId: t.taskId, title: t.title, starValue: Number(t.starValue) || 0, recurring: t.recurring,
      status: mine ? mine.status : "none", // none | pending | approved | rejected
    };
  });

  const history = completions
    .sort((a, b) => String(b.reviewedDate || b.submittedDate).localeCompare(String(a.reviewedDate || a.submittedDate)))
    .slice(0, 15)
    .map(c => ({ completionId: c.completionId, taskTitle: c.taskTitle, starValue: Number(c.starValue) || 0, status: c.status, submittedDate: c.submittedDate, reviewedDate: c.reviewedDate }));

  return { ok: true, tasks: out, history, stars: Number(user.stars) || 0 };
}

function completeTask(body) {
  const { userId, sessionToken, taskId } = body;
  const user = findUser(userId);
  if (!user) return { ok: false, error: "Profile not found" };
  if (!validSession(user, sessionToken)) return { ok: false, error: "Session expired, please log in again" };
  if (user.status === "locked") return { ok: false, error: "locked", locked: true };
  if (user.status !== "active") return { ok: false, error: "not_approved", notApproved: true };

  const task = readRows(tasksSheet(), TASK_HEADERS).find(t => t.taskId === taskId);
  if (!task) return { ok: false, error: "Chore not found" };

  const key = periodKeyFor(task.recurring);
  const dup = readRows(completionsSheet(), COMPLETION_HEADERS)
    .find(c => c.taskId === taskId && c.userId === userId && c.periodKey === key && c.status !== "rejected");
  if (dup) return { ok: false, error: "Already submitted for this period" };

  appendRowObj(completionsSheet(), COMPLETION_HEADERS, {
    completionId: Utilities.getUuid(), taskId, userId, taskTitle: task.title, starValue: task.starValue,
    periodKey: key, status: "pending", submittedDate: nowIso(), reviewedDate: "",
  });
  return { ok: true };
}

// ---------------------------------------------------------------
// Perks / rewards (Perks → Redemptions)
// ---------------------------------------------------------------
function listPerks(body) {
  const { userId, sessionToken } = body;
  const user = findUser(userId);
  if (!user) return { ok: false, error: "Profile not found" };
  if (!validSession(user, sessionToken)) return { ok: false, error: "Session expired, please log in again" };
  if (user.status !== "active") return { ok: false, error: "not_approved", notApproved: true };

  const perks = readRows(perksSheet(), PERK_HEADERS).filter(p => isTrue(p.active) && visibleTo(p, userId));
  const redemptions = readRows(redemptionsSheet(), REDEMPTION_HEADERS).filter(r => r.userId === userId);
  const pendingPerkIds = redemptions.filter(r => r.status === "pending").map(r => r.perkId);

  const out = perks.map(p => ({
    perkId: p.perkId, title: p.title, starCost: Number(p.starCost) || 0,
    pending: pendingPerkIds.indexOf(p.perkId) !== -1,
  }));

  const history = redemptions
    .sort((a, b) => String(b.reviewedDate || b.requestedDate).localeCompare(String(a.reviewedDate || a.requestedDate)))
    .slice(0, 15)
    .map(r => ({ redemptionId: r.redemptionId, perkTitle: r.perkTitle, starCost: Number(r.starCost) || 0, status: r.status, requestedDate: r.requestedDate, reviewedDate: r.reviewedDate }));

  return { ok: true, perks: out, history, stars: Number(user.stars) || 0 };
}

function redeemPerk(body) {
  const { userId, sessionToken, perkId } = body;
  const user = findUser(userId);
  if (!user) return { ok: false, error: "Profile not found" };
  if (!validSession(user, sessionToken)) return { ok: false, error: "Session expired, please log in again" };
  if (user.status === "locked") return { ok: false, error: "locked", locked: true };
  if (user.status !== "active") return { ok: false, error: "not_approved", notApproved: true };

  const perk = readRows(perksSheet(), PERK_HEADERS).find(p => p.perkId === perkId);
  if (!perk) return { ok: false, error: "Reward not found" };
  const cost = Number(perk.starCost) || 0;
  const balance = Number(user.stars) || 0;
  if (balance < cost) return { ok: false, error: "Not enough stars yet" };

  user.stars = balance - cost;
  writeUserRow(user);
  appendRowObj(redemptionsSheet(), REDEMPTION_HEADERS, {
    redemptionId: Utilities.getUuid(), perkId, userId, perkTitle: perk.title, starCost: cost,
    status: "pending", requestedDate: nowIso(), reviewedDate: "",
  });
  return { ok: true, stars: user.stars };
}

// ---------------------------------------------------------------
// Admin bootstrap & auth
// ---------------------------------------------------------------
function bootstrapAdmin(sh) {
  const rows = readRows(sh, ADMIN_HEADERS);
  if (rows.length > 0) return;
  const props = PropertiesService.getScriptProperties();
  const username = props.getProperty("ADMIN_BOOTSTRAP_USERNAME") || DEFAULT_ADMIN_USERNAME;
  const password = props.getProperty("ADMIN_BOOTSTRAP_PASSWORD") || DEFAULT_ADMIN_PASSWORD;
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
  writeRow(adminsSheet(), ADMIN_HEADERS, admin);
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

// A parent-role profile authorizes itself with its own userId + sessionToken
// (the same session used for everything else it does in the app) — there's
// no separate admin password involved. Only active, role="parent" profiles
// pass this check, so a kid session (even a tampered client) can never call
// parent-only actions: the role and status live server-side on the row.
function requireActiveParent(body) {
  const user = findUser(body.userId);
  if (!user) throw new Error("Not authorized");
  if (!validSession(user, body.sessionToken)) throw new Error("Not authorized");
  if ((user.role || "kid") !== "parent" || user.status !== "active") throw new Error("Not authorized");
  return user;
}

function logAudit(actorLabel, action, targetUserId, details) {
  appendRowObj(auditSheet(), AUDIT_HEADERS, {
    timestamp: nowIso(), admin: actorLabel, action, targetUserId: targetUserId || "", details: details || "",
  });
}

// ---------------------------------------------------------------
// Admin: user management
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
  logAudit("admin:" + admin.username, actionName, body.userId, "");
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
  logAudit("admin:" + admin.username, "resetPin", body.userId, "");
  return { ok: true, newPin };
}

function adminDeleteUser(body) {
  const admin = requireAdmin(body);
  const user = findUser(body.userId);
  if (!user) return { ok: false, error: "Profile not found" };
  usersSheet().deleteRow(user._row);
  logAudit("admin:" + admin.username, "deleteUser", body.userId, "");
  return { ok: true };
}

// ---------------------------------------------------------------
// Kid management (parent-facing, in-app — lighter than the Admin
// portal: approve/reject only. Lock/unlock/reset PIN/delete stay
// admin-portal-only since a parent profile is secured by just a
// 4-digit PIN, weaker than the Admin portal's separate login.)
// ---------------------------------------------------------------
function listMyKids(body) {
  requireActiveParent(body);
  const kids = readRows(usersSheet(), USER_HEADERS).filter(u => (u.role || "kid") !== "parent");
  return { ok: true, kids: kids.map(publicUser) };
}

function parentApproveKid(body) {
  const parent = requireActiveParent(body);
  const kid = findUser(body.kidId);
  if (!kid) return { ok: false, error: "Profile not found" };
  if ((kid.role || "kid") === "parent") return { ok: false, error: "Parent profiles can only be approved from the Admin portal" };
  kid.status = "active";
  kid.failedAttempts = 0;
  writeUserRow(kid);
  logAudit("parent:" + parent.name, "approveKid", kid.userId, "");
  return { ok: true };
}

function parentRejectKid(body) {
  const parent = requireActiveParent(body);
  const kid = findUser(body.kidId);
  if (!kid) return { ok: false, error: "Profile not found" };
  if ((kid.role || "kid") === "parent") return { ok: false, error: "Parent profiles can only be reviewed from the Admin portal" };
  kid.status = "rejected";
  writeUserRow(kid);
  logAudit("parent:" + parent.name, "rejectKid", kid.userId, "");
  return { ok: true };
}

// A parent setting up a kid's profile themselves, from inside the app.
// Since the parent is already authenticated and doing this deliberately,
// the new profile goes straight to "active" — no separate approval step,
// which is what felt disconnected about the old flow (a kid signs up on
// their own device, and a parent has to go find and approve it later).
// This is the more natural path for most families; self-signup + approve
// still exists too, for a kid setting up their own device first.
// A parent gifting stars directly — e.g. a one-off bonus outside the
// normal chore-approval loop. Amount must be positive; the result is
// floored at zero so it can never push a balance negative.
function parentAdjustStars(body) {
  const parent = requireActiveParent(body);
  const kid = findUser(body.kidId);
  if (!kid) return { ok: false, error: "Profile not found" };
  if ((kid.role || "kid") === "parent") return { ok: false, error: "Can't adjust stars on a parent profile" };
  const amount = Number(body.amount) || 0;
  if (amount <= 0) return { ok: false, error: "Amount must be positive" };
  kid.stars = Math.max(0, (Number(kid.stars) || 0) + amount);
  writeUserRow(kid);
  logAudit("parent:" + parent.name, "giftStars", kid.userId, String(amount));
  return { ok: true, stars: kid.stars };
}

function parentCreateKid(body) {
  const parent = requireActiveParent(body);
  const { name, ageGroup, avatar, pin } = body;
  if (!name || !pin) return { ok: false, error: "Missing fields" };
  if (!/^\d{4}$/.test(String(pin))) return { ok: false, error: "PIN must be 4 digits" };
  if (readRows(usersSheet(), USER_HEADERS).some(u => u.name.trim().toLowerCase() === name.trim().toLowerCase())) {
    return { ok: false, error: "Someone with that name already exists — try a last initial or nickname" };
  }
  const kidId = "kid_" + Utilities.getUuid().replace(/-/g, "").slice(0, 12);
  const salt = randomSalt();
  appendUserRow({
    userId: kidId, name, ageGroup: ageGroup || "kids", role: "kid", avatar: avatar || "🦊",
    pinHash: hashWithSalt(pin, salt), pinSalt: salt,
    status: "active", xp: 0, streak: 0, stars: 0, lastActiveDate: "", createdDate: nowIso(),
    dataJson: "{}", sessionToken: "", sessionExpiry: "", failedAttempts: 0,
  });
  logAudit("parent:" + parent.name, "createKid", kidId, name);
  return { ok: true, kidId };
}

// ---------------------------------------------------------------
// Chores (Tasks + Completions) — core logic, callable by either an
// admin or an active parent, each authorized their own way above.
// ---------------------------------------------------------------
function createTaskCore(actorLabel, title, starValue, assignedTo, recurring) {
  if (!title || !starValue) return { ok: false, error: "Missing fields" };
  appendRowObj(tasksSheet(), TASK_HEADERS, {
    taskId: Utilities.getUuid(), title, starValue: Number(starValue) || 0,
    assignedTo: assignedTo || "all", recurring: recurring || "none", active: true, createdDate: nowIso(),
  });
  logAudit(actorLabel, "createTask", "", title);
  return { ok: true };
}

function updateTaskCore(actorLabel, taskId, patch) {
  const task = readRows(tasksSheet(), TASK_HEADERS).find(t => t.taskId === taskId);
  if (!task) return { ok: false, error: "Chore not found" };
  if (patch.title !== undefined) task.title = patch.title;
  if (patch.starValue !== undefined) task.starValue = Number(patch.starValue) || 0;
  if (patch.assignedTo !== undefined) task.assignedTo = patch.assignedTo;
  if (patch.recurring !== undefined) task.recurring = patch.recurring;
  if (patch.active !== undefined) task.active = patch.active;
  writeRow(tasksSheet(), TASK_HEADERS, task);
  logAudit(actorLabel, "updateTask", "", task.title);
  return { ok: true };
}

function deleteTaskCore(actorLabel, taskId) {
  const task = readRows(tasksSheet(), TASK_HEADERS).find(t => t.taskId === taskId);
  if (!task) return { ok: false, error: "Chore not found" };
  tasksSheet().deleteRow(task._row);
  logAudit(actorLabel, "deleteTask", "", task.title);
  return { ok: true };
}

function pendingCompletionsCore() {
  const users = readRows(usersSheet(), USER_HEADERS);
  const nameFor = uid => { const u = users.find(x => x.userId === uid); return u ? u.name : uid; };
  const pending = readRows(completionsSheet(), COMPLETION_HEADERS).filter(c => c.status === "pending");
  return pending.map(c => Object.assign({}, c, { kidName: nameFor(c.userId) }));
}

function reviewCompletionCore(actorLabel, completionId, approve) {
  const c = readRows(completionsSheet(), COMPLETION_HEADERS).find(x => x.completionId === completionId);
  if (!c) return { ok: false, error: "Not found" };
  c.status = approve ? "approved" : "rejected";
  c.reviewedDate = nowIso();
  writeRow(completionsSheet(), COMPLETION_HEADERS, c);
  if (approve) {
    const user = findUser(c.userId);
    if (user) { user.stars = (Number(user.stars) || 0) + (Number(c.starValue) || 0); writeUserRow(user); }
  }
  logAudit(actorLabel, approve ? "approveChore" : "rejectChore", c.userId, c.taskTitle);
  return { ok: true };
}

// --- Admin wrappers ---
function adminListTasks(body) { requireAdmin(body); return { ok: true, tasks: readRows(tasksSheet(), TASK_HEADERS) }; }
function adminCreateTask(body) { const a = requireAdmin(body); return createTaskCore("admin:" + a.username, body.title, body.starValue, body.assignedTo, body.recurring); }
function adminUpdateTask(body) { const a = requireAdmin(body); return updateTaskCore("admin:" + a.username, body.taskId, body); }
function adminDeleteTask(body) { const a = requireAdmin(body); return deleteTaskCore("admin:" + a.username, body.taskId); }
function adminListPendingCompletions(body) { requireAdmin(body); return { ok: true, completions: pendingCompletionsCore() }; }
function adminReviewCompletion(body) { const a = requireAdmin(body); return reviewCompletionCore("admin:" + a.username, body.completionId, body.approve); }

// --- Parent wrappers (in-app, own session — see requireActiveParent) ---
function parentListTasks(body) { requireActiveParent(body); return { ok: true, tasks: readRows(tasksSheet(), TASK_HEADERS) }; }
function parentCreateTask(body) { const p = requireActiveParent(body); return createTaskCore("parent:" + p.name, body.title, body.starValue, body.assignedTo, body.recurring); }
function parentUpdateTask(body) { const p = requireActiveParent(body); return updateTaskCore("parent:" + p.name, body.taskId, body); }
function parentDeleteTask(body) { const p = requireActiveParent(body); return deleteTaskCore("parent:" + p.name, body.taskId); }
function parentListPendingCompletions(body) { requireActiveParent(body); return { ok: true, completions: pendingCompletionsCore() }; }
function parentReviewCompletion(body) { const p = requireActiveParent(body); return reviewCompletionCore("parent:" + p.name, body.completionId, body.approve); }

// ---------------------------------------------------------------
// Perks / rewards (Perks + Redemptions) — same core+wrapper shape
// ---------------------------------------------------------------
function createPerkCore(actorLabel, title, starCost, assignedTo) {
  if (!title || !starCost) return { ok: false, error: "Missing fields" };
  appendRowObj(perksSheet(), PERK_HEADERS, {
    perkId: Utilities.getUuid(), title, starCost: Number(starCost) || 0,
    assignedTo: assignedTo || "all", active: true, createdDate: nowIso(),
  });
  logAudit(actorLabel, "createPerk", "", title);
  return { ok: true };
}

function updatePerkCore(actorLabel, perkId, patch) {
  const perk = readRows(perksSheet(), PERK_HEADERS).find(p => p.perkId === perkId);
  if (!perk) return { ok: false, error: "Reward not found" };
  if (patch.title !== undefined) perk.title = patch.title;
  if (patch.starCost !== undefined) perk.starCost = Number(patch.starCost) || 0;
  if (patch.assignedTo !== undefined) perk.assignedTo = patch.assignedTo;
  if (patch.active !== undefined) perk.active = patch.active;
  writeRow(perksSheet(), PERK_HEADERS, perk);
  logAudit(actorLabel, "updatePerk", "", perk.title);
  return { ok: true };
}

function deletePerkCore(actorLabel, perkId) {
  const perk = readRows(perksSheet(), PERK_HEADERS).find(p => p.perkId === perkId);
  if (!perk) return { ok: false, error: "Reward not found" };
  perksSheet().deleteRow(perk._row);
  logAudit(actorLabel, "deletePerk", "", perk.title);
  return { ok: true };
}

function pendingRedemptionsCore() {
  const users = readRows(usersSheet(), USER_HEADERS);
  const nameFor = uid => { const u = users.find(x => x.userId === uid); return u ? u.name : uid; };
  const pending = readRows(redemptionsSheet(), REDEMPTION_HEADERS).filter(r => r.status === "pending");
  return pending.map(r => Object.assign({}, r, { kidName: nameFor(r.userId) }));
}

function reviewRedemptionCore(actorLabel, redemptionId, approve) {
  const r = readRows(redemptionsSheet(), REDEMPTION_HEADERS).find(x => x.redemptionId === redemptionId);
  if (!r) return { ok: false, error: "Not found" };
  r.status = approve ? "fulfilled" : "rejected";
  r.reviewedDate = nowIso();
  writeRow(redemptionsSheet(), REDEMPTION_HEADERS, r);
  if (!approve) {
    const user = findUser(r.userId);
    if (user) { user.stars = (Number(user.stars) || 0) + (Number(r.starCost) || 0); writeUserRow(user); }
  }
  logAudit(actorLabel, approve ? "fulfillRedemption" : "rejectRedemption", r.userId, r.perkTitle);
  return { ok: true };
}

// --- Admin wrappers ---
function adminListPerks(body) { requireAdmin(body); return { ok: true, perks: readRows(perksSheet(), PERK_HEADERS) }; }
function adminCreatePerk(body) { const a = requireAdmin(body); return createPerkCore("admin:" + a.username, body.title, body.starCost, body.assignedTo); }
function adminUpdatePerk(body) { const a = requireAdmin(body); return updatePerkCore("admin:" + a.username, body.perkId, body); }
function adminDeletePerk(body) { const a = requireAdmin(body); return deletePerkCore("admin:" + a.username, body.perkId); }
function adminListPendingRedemptions(body) { requireAdmin(body); return { ok: true, redemptions: pendingRedemptionsCore() }; }
function adminReviewRedemption(body) { const a = requireAdmin(body); return reviewRedemptionCore("admin:" + a.username, body.redemptionId, body.approve); }

// --- Parent wrappers ---
function parentListPerks(body) { requireActiveParent(body); return { ok: true, perks: readRows(perksSheet(), PERK_HEADERS) }; }
function parentCreatePerk(body) { const p = requireActiveParent(body); return createPerkCore("parent:" + p.name, body.title, body.starCost, body.assignedTo); }
function parentUpdatePerk(body) { const p = requireActiveParent(body); return updatePerkCore("parent:" + p.name, body.perkId, body); }
function parentDeletePerk(body) { const p = requireActiveParent(body); return deletePerkCore("parent:" + p.name, body.perkId); }
function parentListPendingRedemptions(body) { requireActiveParent(body); return { ok: true, redemptions: pendingRedemptionsCore() }; }
function parentReviewRedemption(body) { const p = requireActiveParent(body); return reviewRedemptionCore("parent:" + p.name, body.redemptionId, body.approve); }
