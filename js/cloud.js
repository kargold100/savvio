/* ===========================================================
   Savvio — Cloud sync client
   Talks to the Apps Script web app backed by a Google Sheet
   (see /appsscript/Code.gs and /appsscript/SETUP.md).

   SECURITY NOTE: PINs and the admin password are sent as plain
   values in the POST body. That's safe here because the whole
   request travels over HTTPS (both GitHub Pages and Apps Script
   enforce it), so nothing is readable in transit. The server
   (Code.gs) is what salts and SHA-256-hashes every PIN/password
   before it's compared or stored — the raw value is never
   written to the Sheet or logged. Hashing on the client instead
   would just turn the hash into a second password that's sent
   on every request, which doesn't add real protection.

   Until PROXY_URL is filled in below, every call here safely
   no-ops (offline:true) and the app keeps working local-only.
   =========================================================== */

const SavvioCloud = (() => {
  const PROXY_URL = "https://script.google.com/macros/s/AKfycbxt-hHv1K_ijQhCsIuq0NkesAEfgSV9Bvx7ALhDKiPZouRLCrhkREZKB8TX7lHrCDNx/exec"; // <- paste your Apps Script /exec URL here once deployed
  const TIMEOUT_MS = 4000;

  function withTimeout(promise, ms) {
    return Promise.race([
      promise,
      new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), ms)),
    ]);
  }

  async function call(action, payload) {
    if (!PROXY_URL) return { ok: false, offline: true };
    try {
      const res = await withTimeout(
        fetch(PROXY_URL, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" }, // avoids CORS preflight on Apps Script
          body: JSON.stringify({ action, ...payload }),
        }),
        TIMEOUT_MS
      );
      return await res.json();
    } catch (e) {
      return { ok: false, offline: true, error: String(e) };
    }
  }

  return {
    isConfigured: () => !!PROXY_URL,

    registerProfile: (userId, name, ageGroup, avatar, pin, role) =>
      call("registerProfile", { userId, name, ageGroup, avatar, pin, role }),

    loginProfile: (userId, pin) => call("loginProfile", { userId, pin }),
    loginByName: (name, pin) => call("loginByName", { name, pin }),

    checkStatus: (userId) => call("checkStatus", { userId }),

    syncProfile: (userId, sessionToken, xp, streak, lastActiveDate, dataJson) =>
      call("syncProfile", { userId, sessionToken, xp, streak, lastActiveDate, dataJson }),

    restoreProfile: (userId, sessionToken) => call("restoreProfile", { userId, sessionToken }),
    updateProfile: (userId, sessionToken, name, ageGroup, avatar) =>
      call("updateProfile", { userId, sessionToken, name, ageGroup, avatar }),
    changePin: (userId, sessionToken, currentPin, newPin) =>
      call("changePin", { userId, sessionToken, currentPin, newPin }),

    // --- Chores & Perks (kid-facing) ---
    listTasks: (userId, sessionToken) => call("listTasks", { userId, sessionToken }),
    completeTask: (userId, sessionToken, taskId) => call("completeTask", { userId, sessionToken, taskId }),
    listPerks: (userId, sessionToken) => call("listPerks", { userId, sessionToken }),
    redeemPerk: (userId, sessionToken, perkId) => call("redeemPerk", { userId, sessionToken, perkId }),

    // --- Parent (in-app "Manage Family") ---
    listMyKids: (userId, sessionToken) => call("listMyKids", { userId, sessionToken }),
    parentApproveKid: (userId, sessionToken, kidId) => call("parentApproveKid", { userId, sessionToken, kidId }),
    parentRejectKid: (userId, sessionToken, kidId) => call("parentRejectKid", { userId, sessionToken, kidId }),

    parentListTasks: (userId, sessionToken) => call("parentListTasks", { userId, sessionToken }),
    parentCreateTask: (userId, sessionToken, title, starValue, assignedTo, recurring) =>
      call("parentCreateTask", { userId, sessionToken, title, starValue, assignedTo, recurring }),
    parentUpdateTask: (userId, sessionToken, taskId, patch) =>
      call("parentUpdateTask", Object.assign({ userId, sessionToken, taskId }, patch)),
    parentDeleteTask: (userId, sessionToken, taskId) => call("parentDeleteTask", { userId, sessionToken, taskId }),
    parentListPendingCompletions: (userId, sessionToken) => call("parentListPendingCompletions", { userId, sessionToken }),
    parentReviewCompletion: (userId, sessionToken, completionId, approve) =>
      call("parentReviewCompletion", { userId, sessionToken, completionId, approve }),

    parentListPerks: (userId, sessionToken) => call("parentListPerks", { userId, sessionToken }),
    parentCreatePerk: (userId, sessionToken, title, starCost, assignedTo) =>
      call("parentCreatePerk", { userId, sessionToken, title, starCost, assignedTo }),
    parentUpdatePerk: (userId, sessionToken, perkId, patch) =>
      call("parentUpdatePerk", Object.assign({ userId, sessionToken, perkId }, patch)),
    parentDeletePerk: (userId, sessionToken, perkId) => call("parentDeletePerk", { userId, sessionToken, perkId }),
    parentListPendingRedemptions: (userId, sessionToken) => call("parentListPendingRedemptions", { userId, sessionToken }),
    parentReviewRedemption: (userId, sessionToken, redemptionId, approve) =>
      call("parentReviewRedemption", { userId, sessionToken, redemptionId, approve }),

    // --- Admin ---
    adminLogin: (username, password) => call("adminLogin", { username, password }),
    adminListUsers: (adminSessionToken) => call("adminListUsers", { adminSessionToken }),
    adminApproveUser: (adminSessionToken, userId) => call("adminApproveUser", { adminSessionToken, userId }),
    adminRejectUser: (adminSessionToken, userId) => call("adminRejectUser", { adminSessionToken, userId }),
    adminLockUser: (adminSessionToken, userId) => call("adminLockUser", { adminSessionToken, userId }),
    adminUnlockUser: (adminSessionToken, userId) => call("adminUnlockUser", { adminSessionToken, userId }),
    adminResetPin: (adminSessionToken, userId, newPin) => call("adminResetPin", { adminSessionToken, userId, newPin }),
    adminDeleteUser: (adminSessionToken, userId) => call("adminDeleteUser", { adminSessionToken, userId }),

    // --- Admin: chores ---
    adminListTasks: (adminSessionToken) => call("adminListTasks", { adminSessionToken }),
    adminCreateTask: (adminSessionToken, title, starValue, assignedTo, recurring) =>
      call("adminCreateTask", { adminSessionToken, title, starValue, assignedTo, recurring }),
    adminUpdateTask: (adminSessionToken, taskId, patch) =>
      call("adminUpdateTask", Object.assign({ adminSessionToken, taskId }, patch)),
    adminDeleteTask: (adminSessionToken, taskId) => call("adminDeleteTask", { adminSessionToken, taskId }),
    adminListPendingCompletions: (adminSessionToken) => call("adminListPendingCompletions", { adminSessionToken }),
    adminReviewCompletion: (adminSessionToken, completionId, approve) =>
      call("adminReviewCompletion", { adminSessionToken, completionId, approve }),

    // --- Admin: perks ---
    adminListPerks: (adminSessionToken) => call("adminListPerks", { adminSessionToken }),
    adminCreatePerk: (adminSessionToken, title, starCost, assignedTo) =>
      call("adminCreatePerk", { adminSessionToken, title, starCost, assignedTo }),
    adminUpdatePerk: (adminSessionToken, perkId, patch) =>
      call("adminUpdatePerk", Object.assign({ adminSessionToken, perkId }, patch)),
    adminDeletePerk: (adminSessionToken, perkId) => call("adminDeletePerk", { adminSessionToken, perkId }),
    adminListPendingRedemptions: (adminSessionToken) => call("adminListPendingRedemptions", { adminSessionToken }),
    adminReviewRedemption: (adminSessionToken, redemptionId, approve) =>
      call("adminReviewRedemption", { adminSessionToken, redemptionId, approve }),
  };
})();

if (typeof window !== "undefined") window.SavvioCloud = SavvioCloud;
