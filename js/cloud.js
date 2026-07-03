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
  const PROXY_URL = "https://script.google.com/macros/s/AKfycbyLWsY4W1qejQRWRDsXXgraLYs-TrM2sFklUfhRn-xffEnAzQ06Q74a6uGzcEF7C_cF/exec"; // <- paste your Apps Script /exec URL here once deployed
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

    registerProfile: (userId, name, ageGroup, avatar, pin) =>
      call("registerProfile", { userId, name, ageGroup, avatar, pin }),

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

    // --- Admin ---
    adminLogin: (username, password) => call("adminLogin", { username, password }),
    adminListUsers: (adminSessionToken) => call("adminListUsers", { adminSessionToken }),
    adminApproveUser: (adminSessionToken, userId) => call("adminApproveUser", { adminSessionToken, userId }),
    adminLockUser: (adminSessionToken, userId) => call("adminLockUser", { adminSessionToken, userId }),
    adminUnlockUser: (adminSessionToken, userId) => call("adminUnlockUser", { adminSessionToken, userId }),
    adminResetPin: (adminSessionToken, userId, newPin) => call("adminResetPin", { adminSessionToken, userId, newPin }),
    adminDeleteUser: (adminSessionToken, userId) => call("adminDeleteUser", { adminSessionToken, userId }),
  };
})();

if (typeof window !== "undefined") window.SavvioCloud = SavvioCloud;
