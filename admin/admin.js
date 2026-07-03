/* ===========================================================
   Savvio Admin — admin.js
   Separate app, separate login, talks to the same Apps Script
   backend as the kid-facing app via js/cloud.js (SavvioCloud).
   =========================================================== */

const adminState = {
  loggedIn: false,
  username: null,
  adminSessionToken: null,
  tab: "overview",
  users: [],
  search: "",
  statusFilter: "all",
  loading: false,
};

const $root = () => document.getElementById("admin-app");

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
}

function toast(msg) {
  const el = document.createElement("div");
  el.className = "toast";
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2400);
}

function fmtDateTime(iso) {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleString(undefined, { day:"numeric", month:"short", hour:"2-digit", minute:"2-digit" }); }
  catch (e) { return iso; }
}

// ---------------------------------------------------------------
// Session restore (sessionStorage — cleared when the tab closes)
// ---------------------------------------------------------------
function restoreSession() {
  try {
    const raw = sessionStorage.getItem("savvio_admin_session");
    if (!raw) return;
    const s = JSON.parse(raw);
    if (s && s.adminSessionToken) {
      adminState.loggedIn = true;
      adminState.username = s.username;
      adminState.adminSessionToken = s.adminSessionToken;
    }
  } catch (e) { /* ignore */ }
}

function persistSession() {
  sessionStorage.setItem("savvio_admin_session", JSON.stringify({
    username: adminState.username, adminSessionToken: adminState.adminSessionToken,
  }));
}

function clearSession() {
  sessionStorage.removeItem("savvio_admin_session");
}

// ---------------------------------------------------------------
// Render
// ---------------------------------------------------------------
function render() {
  if (!SavvioCloud.isConfigured()) { $root().innerHTML = renderNotConfigured(); return; }
  $root().innerHTML = adminState.loggedIn ? renderDashboard() : renderLogin();
  bindEvents();
}

function renderNotConfigured() {
  return `
    <div class="admin-shell">
      <div class="admin-login-wrap">
        <img class="brand-logo-lg" src="../assets/logo.svg" alt="Savvio logo" />
        <h1>Savvio Admin</h1>
        <div class="card">
          <p>The backend isn't connected yet. Open <code>js/cloud.js</code> and set <code>PROXY_URL</code>
          to your deployed Apps Script web app URL — see <code>appsscript/SETUP.md</code> for the full walkthrough.</p>
        </div>
      </div>
    </div>
  `;
}

function renderLogin() {
  return `
    <div class="admin-shell">
      <div class="admin-login-wrap">
        <img class="brand-logo-lg" src="../assets/logo.svg" alt="Savvio logo" />
        <h1>Savvio Admin</h1>
        <p style="color:var(--ink-soft);">Sign in to manage profiles.</p>
        <div class="card">
          <label for="admin-username">Username</label>
          <input type="text" id="admin-username" autocomplete="username" />
          <label for="admin-password">Password</label>
          <input type="password" id="admin-password" autocomplete="current-password" />
          <button class="btn btn-primary btn-block" id="admin-login-btn" style="margin-top:14px;">Sign in</button>
          <p id="admin-login-error" style="color:var(--danger);font-size:.82rem;margin:10px 0 0;"></p>
        </div>
      </div>
    </div>
  `;
}

function renderDashboard() {
  return `
    <div class="admin-shell">
      <div class="admin-topbar">
        <div class="brand"><img class="brand-logo" src="../assets/logo.svg" alt="" /> Savvio Admin</div>
        <div style="display:flex;align-items:center;gap:12px;">
          <span style="font-size:.85rem;color:var(--ink-soft);">Signed in as <strong>${escapeHtml(adminState.username)}</strong></span>
          <button class="btn btn-outline btn-sm" id="admin-logout-btn">Sign out</button>
        </div>
      </div>
      <div class="admin-tabs">
        <button data-tab="overview" class="${adminState.tab==='overview'?'active':''}">Overview</button>
        <button data-tab="users" class="${adminState.tab==='users'?'active':''}">User Management</button>
      </div>
      ${adminState.tab === "overview" ? renderOverview() : renderUsersTab()}
    </div>
  `;
}

function renderOverview() {
  const users = adminState.users;
  const total = users.length;
  const active = users.filter(u => u.status === "active").length;
  const pending = users.filter(u => u.status === "pending").length;
  const locked = users.filter(u => u.status === "locked").length;
  const avgStreak = total ? Math.round(users.reduce((s,u)=>s + (Number(u.streak)||0), 0) / total) : 0;
  const avgXp = total ? Math.round(users.reduce((s,u)=>s + (Number(u.xp)||0), 0) / total) : 0;
  return `
    <div class="stat-grid">
      <div class="card"><div class="val">${total}</div><div class="lbl">Total profiles</div></div>
      <div class="card"><div class="val">${active}</div><div class="lbl">Active</div></div>
      <div class="card"><div class="val">${pending}</div><div class="lbl">Pending approval</div></div>
      <div class="card"><div class="val">${locked}</div><div class="lbl">Locked</div></div>
      <div class="card"><div class="val">${avgStreak}</div><div class="lbl">Avg. streak</div></div>
      <div class="card"><div class="val">${avgXp}</div><div class="lbl">Avg. XP</div></div>
    </div>
    ${pending > 0 ? `
    <div class="card">
      <h3 style="margin-top:0;">Waiting for approval</h3>
      ${users.filter(u=>u.status==="pending").map(u => `
        <div class="card-flat" style="display:flex;justify-content:space-between;align-items:center;">
          <span>${u.avatar} ${escapeHtml(u.name)}</span>
          <button class="btn btn-primary btn-sm" data-approve="${u.userId}">Approve</button>
        </div>`).join("")}
    </div>` : ""}
  `;
}

function renderUsersTab() {
  const q = adminState.search.trim().toLowerCase();
  let users = adminState.users;
  if (adminState.statusFilter !== "all") users = users.filter(u => u.status === adminState.statusFilter);
  if (q) users = users.filter(u => (u.name||"").toLowerCase().includes(q) || (u.userId||"").toLowerCase().includes(q));

  return `
    <div class="toolbar">
      <input type="text" id="admin-search" placeholder="Search by name or Savvio ID…" value="${escapeHtml(adminState.search)}" />
      <button class="filter-chip ${adminState.statusFilter==='all'?'active':''}" data-filter="all">All</button>
      <button class="filter-chip ${adminState.statusFilter==='pending'?'active':''}" data-filter="pending">Pending</button>
      <button class="filter-chip ${adminState.statusFilter==='active'?'active':''}" data-filter="active">Active</button>
      <button class="filter-chip ${adminState.statusFilter==='locked'?'active':''}" data-filter="locked">Locked</button>
      <button class="btn btn-outline btn-sm" id="admin-refresh-btn">↻ Refresh</button>
    </div>
    <table class="user-table">
      <thead><tr>
        <th>Profile</th><th>Age group</th><th>Status</th><th>XP</th><th>Streak</th><th>Last active</th><th>Actions</th>
      </tr></thead>
      <tbody>
        ${users.length ? users.map(userRow).join("") : `<tr class="empty-row"><td colspan="7">No profiles match.</td></tr>`}
      </tbody>
    </table>
  `;
}

function userRow(u) {
  return `
    <tr>
      <td><div class="who"><div class="av">${u.avatar||"🙂"}</div><div><div style="font-weight:700;">${escapeHtml(u.name)}</div><div style="font-size:.72rem;color:var(--ink-faint);">${u.userId}</div></div></div></td>
      <td>${u.ageGroup === "kids" ? "Kid (8–12)" : "Teen (13–18)"}</td>
      <td><span class="status-pill status-${u.status}">${u.status}</span></td>
      <td>${u.xp||0}</td>
      <td>🔥${u.streak||0}</td>
      <td>${u.lastActiveDate || "—"}</td>
      <td>
        <div class="actions">
          ${u.status === "pending" ? `<button class="good" data-approve="${u.userId}">Approve</button>` : ""}
          ${u.status === "locked"
            ? `<button class="good" data-unlock="${u.userId}">Unlock</button>`
            : `<button class="warn" data-lock="${u.userId}">Lock</button>`}
          <button data-reset="${u.userId}">Reset PIN</button>
          <button class="danger" data-delete="${u.userId}">Delete</button>
        </div>
      </td>
    </tr>
  `;
}

// ---------------------------------------------------------------
// Data loading
// ---------------------------------------------------------------
async function loadUsers() {
  const res = await SavvioCloud.adminListUsers(adminState.adminSessionToken);
  if (res && res.ok) {
    adminState.users = res.users || [];
  } else {
    if (res && !res.offline) { toast(res.error || "Session expired — please sign in again"); doLogout(); }
  }
  render();
}

function doLogout() {
  adminState.loggedIn = false;
  adminState.username = null;
  adminState.adminSessionToken = null;
  clearSession();
  render();
}

// ---------------------------------------------------------------
// Events
// ---------------------------------------------------------------
function bindEvents() {
  const loginBtn = document.getElementById("admin-login-btn");
  if (loginBtn) loginBtn.onclick = async () => {
    const username = document.getElementById("admin-username").value.trim();
    const password = document.getElementById("admin-password").value;
    const errEl = document.getElementById("admin-login-error");
    errEl.textContent = "";
    if (!username || !password) { errEl.textContent = "Enter a username and password"; return; }
    loginBtn.disabled = true; loginBtn.textContent = "Signing in…";
    const res = await SavvioCloud.adminLogin(username, password);
    loginBtn.disabled = false; loginBtn.textContent = "Sign in";
    if (res && res.ok) {
      adminState.loggedIn = true;
      adminState.username = res.username;
      adminState.adminSessionToken = res.adminSessionToken;
      persistSession();
      render();
      loadUsers();
    } else {
      errEl.textContent = (res && res.error) || "Couldn't sign in — check your connection";
    }
  };

  const logoutBtn = document.getElementById("admin-logout-btn");
  if (logoutBtn) logoutBtn.onclick = doLogout;

  document.querySelectorAll("[data-tab]").forEach(el => el.onclick = () => { adminState.tab = el.dataset.tab; render(); });

  const searchInput = document.getElementById("admin-search");
  if (searchInput) searchInput.oninput = () => { adminState.search = searchInput.value; render(); document.getElementById("admin-search").focus(); };

  document.querySelectorAll("[data-filter]").forEach(el => el.onclick = () => { adminState.statusFilter = el.dataset.filter; render(); });

  const refreshBtn = document.getElementById("admin-refresh-btn");
  if (refreshBtn) refreshBtn.onclick = () => loadUsers();

  document.querySelectorAll("[data-approve]").forEach(el => el.onclick = () => runAction(SavvioCloud.adminApproveUser, el.dataset.approve, `Approved`));
  document.querySelectorAll("[data-lock]").forEach(el => el.onclick = () => runAction(SavvioCloud.adminLockUser, el.dataset.lock, `Locked`));
  document.querySelectorAll("[data-unlock]").forEach(el => el.onclick = () => runAction(SavvioCloud.adminUnlockUser, el.dataset.unlock, `Unlocked`));
  document.querySelectorAll("[data-delete]").forEach(el => el.onclick = () => {
    if (!confirm("Delete this profile permanently? This can't be undone.")) return;
    runAction(SavvioCloud.adminDeleteUser, el.dataset.delete, `Deleted`);
  });
  document.querySelectorAll("[data-reset]").forEach(el => el.onclick = () => resetPinFlow(el.dataset.reset));
}

async function runAction(fn, userId, successLabel) {
  const res = await fn(adminState.adminSessionToken, userId);
  if (res && res.ok) {
    toast(`${successLabel}`);
    loadUsers();
  } else {
    toast((res && res.error) || "That didn't work — try again");
  }
}

async function resetPinFlow(userId) {
  const custom = prompt("Enter a new 4-digit PIN for this profile, or leave blank to auto-generate one:");
  if (custom === null) return;
  if (custom && !/^\d{4}$/.test(custom)) { toast("PIN must be exactly 4 digits"); return; }
  const res = await SavvioCloud.adminResetPin(adminState.adminSessionToken, userId, custom || undefined);
  if (res && res.ok) {
    alert(`New PIN for this profile: ${res.newPin}\n\nShare this with them directly — it won't be shown again here.`);
    loadUsers();
  } else {
    toast((res && res.error) || "Couldn't reset the PIN");
  }
}

// ---------------------------------------------------------------
// Init
// ---------------------------------------------------------------
restoreSession();
render();
if (adminState.loggedIn) loadUsers();
