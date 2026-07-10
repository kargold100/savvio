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
  tasks: [],
  pendingCompletions: [],
  perks: [],
  pendingRedemptions: [],
};

function isActiveVal(v) { return v === true || v === "TRUE" || v === "true"; }

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
        <button data-tab="chores" class="${adminState.tab==='chores'?'active':''}">Chores</button>
        <button data-tab="perks" class="${adminState.tab==='perks'?'active':''}">Rewards</button>
      </div>
      ${adminState.tab === "overview" ? renderOverview()
        : adminState.tab === "users" ? renderUsersTab()
        : adminState.tab === "chores" ? renderChoresTab()
        : renderPerksTab()}
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
  const pendingChores = (adminState.pendingCompletions || []).length;
  const pendingRewards = (adminState.pendingRedemptions || []).length;
  return `
    <div class="stat-grid">
      <div class="card"><div class="val">${total}</div><div class="lbl">Total profiles</div></div>
      <div class="card"><div class="val">${active}</div><div class="lbl">Active</div></div>
      <div class="card"><div class="val">${pending}</div><div class="lbl">Pending approval</div></div>
      <div class="card"><div class="val">${locked}</div><div class="lbl">Locked</div></div>
      <div class="card"><div class="val">${avgStreak}</div><div class="lbl">Avg. streak</div></div>
      <div class="card"><div class="val">${avgXp}</div><div class="lbl">Avg. XP</div></div>
    </div>
    ${(pendingChores > 0 || pendingRewards > 0) ? `
    <div class="card" style="display:flex;gap:20px;flex-wrap:wrap;">
      ${pendingChores > 0 ? `<button class="btn btn-outline btn-sm" data-tab="chores">🌟 ${pendingChores} chore${pendingChores===1?"":"s"} to review</button>` : ""}
      ${pendingRewards > 0 ? `<button class="btn btn-outline btn-sm" data-tab="perks">🎁 ${pendingRewards} reward${pendingRewards===1?"":"s"} to review</button>` : ""}
    </div>` : ""}
    ${pending > 0 ? `
    <div class="card">
      <h3 style="margin-top:0;">Waiting for approval</h3>
      ${users.filter(u=>u.status==="pending").map(u => `
        <div class="card-flat" style="display:flex;justify-content:space-between;align-items:center;">
          <span>${u.avatar} ${escapeHtml(u.name)}</span>
          <div class="actions">
            <button class="good" data-approve="${u.userId}">Approve</button>
            <button class="danger" data-reject="${u.userId}">Reject</button>
          </div>
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
      <td><div class="who"><div class="av">${u.avatar||"🙂"}</div><div><div style="font-weight:700;">${escapeHtml(u.name)}</div><div style="font-size:.72rem;color:var(--ink-faint);">${u.userId}</div>${u.email ? `<div style="font-size:.72rem;color:var(--ink-faint);">${escapeHtml(u.email)}</div>` : ""}</div></div></td>
      <td>${u.role === "parent" ? "👪 Parent/Guardian" : (u.ageGroup === "kids" ? "Kid (8–12)" : "Teen (13–18)")}</td>
      <td><span class="status-pill status-${u.status}">${u.status}</span></td>
      <td>${u.xp||0}</td>
      <td>🔥${u.streak||0}</td>
      <td>${u.lastActiveDate || "—"}</td>
      <td>
        <div class="actions">
          ${u.status === "pending" ? `<button class="good" data-approve="${u.userId}">Approve</button><button class="danger" data-reject="${u.userId}">Reject</button>` : ""}
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
// Chores tab (Tasks + pending Completions)
// ---------------------------------------------------------------
function assigneeOptions() {
  return ['<option value="all">All kids</option>']
    .concat(adminState.users.map(u => `<option value="${u.userId}">${escapeHtml(u.name)}</option>`))
    .join("");
}

function assigneeLabel(id) {
  if (id === "all") return "All kids";
  const u = adminState.users.find(x => x.userId === id);
  return u ? u.name : id;
}

function renderChoresTab() {
  const tasks = adminState.tasks || [];
  const pending = adminState.pendingCompletions || [];
  return `
    ${pending.length ? `
    <div class="card">
      <h3 style="margin-top:0;">Pending approval (${pending.length})</h3>
      ${pending.map(c => `
        <div class="card-flat" style="display:flex;justify-content:space-between;align-items:center;">
          <span>${escapeHtml(c.kidName)} — ${escapeHtml(c.taskTitle)} (⭐ ${c.starValue})</span>
          <div class="actions">
            <button class="good" data-chore-approve="${c.completionId}">Approve</button>
            <button class="danger" data-chore-reject="${c.completionId}">Reject</button>
          </div>
        </div>`).join("")}
    </div>` : `<div class="card"><p style="margin:0;color:var(--ink-faint);">No chores waiting for approval right now.</p></div>`}

    <div class="card">
      <h3 style="margin-top:0;">Add a chore</h3>
      <label for="task-title">Title</label>
      <input type="text" id="task-title" placeholder="e.g. Make your bed" />
      <div class="field-row">
        <div><label for="task-stars">Star value</label><input type="number" id="task-stars" min="1" value="5" /></div>
        <div><label for="task-recurring">Repeats</label>
          <select id="task-recurring">
            <option value="none">One-time</option>
            <option value="daily" selected>Daily</option>
            <option value="weekly">Weekly</option>
          </select>
        </div>
      </div>
      <label for="task-assign">Assign to</label>
      <select id="task-assign">${assigneeOptions()}</select>
      <button class="btn btn-primary btn-block" id="task-create-btn" style="margin-top:12px;">+ Add chore</button>
    </div>

    <div class="card">
      <h3 style="margin-top:0;">Chore catalog</h3>
      ${tasks.length ? tasks.map(t => `
        <div class="card-flat" style="display:flex;justify-content:space-between;align-items:center;">
          <span>${isActiveVal(t.active) ? "" : "⏸ "}${escapeHtml(t.title)} — ⭐ ${t.starValue} · ${t.recurring} · ${assigneeLabel(t.assignedTo)}</span>
          <div class="actions">
            <button data-task-toggle="${t.taskId}" data-active="${t.active}">${isActiveVal(t.active) ? "Pause" : "Resume"}</button>
            <button class="danger" data-task-delete="${t.taskId}">Delete</button>
          </div>
        </div>`).join("") : `<p style="margin:0;color:var(--ink-faint);">No chores yet — add one above.</p>`}
    </div>
  `;
}

// ---------------------------------------------------------------
// Perks (Rewards) tab
// ---------------------------------------------------------------
function renderPerksTab() {
  const perks = adminState.perks || [];
  const pending = adminState.pendingRedemptions || [];
  return `
    ${pending.length ? `
    <div class="card">
      <h3 style="margin-top:0;">Pending redemptions (${pending.length})</h3>
      ${pending.map(r => `
        <div class="card-flat" style="display:flex;justify-content:space-between;align-items:center;">
          <span>${escapeHtml(r.kidName)} — ${escapeHtml(r.perkTitle)} (⭐ ${r.starCost})</span>
          <div class="actions">
            <button class="good" data-redemption-fulfill="${r.redemptionId}">Fulfill</button>
            <button class="danger" data-redemption-reject="${r.redemptionId}">Reject &amp; refund</button>
          </div>
        </div>`).join("")}
    </div>` : `<div class="card"><p style="margin:0;color:var(--ink-faint);">No reward requests waiting right now.</p></div>`}

    <div class="card">
      <h3 style="margin-top:0;">Add a reward</h3>
      <label for="perk-title">Title</label>
      <input type="text" id="perk-title" placeholder="e.g. Choose dinner one night" />
      <label for="perk-cost">Star cost</label>
      <input type="number" id="perk-cost" min="1" value="20" />
      <label for="perk-assign">Assign to</label>
      <select id="perk-assign">${assigneeOptions()}</select>
      <button class="btn btn-primary btn-block" id="perk-create-btn" style="margin-top:12px;">+ Add reward</button>
    </div>

    <div class="card">
      <h3 style="margin-top:0;">Reward catalog</h3>
      ${perks.length ? perks.map(p => `
        <div class="card-flat" style="display:flex;justify-content:space-between;align-items:center;">
          <span>${isActiveVal(p.active) ? "" : "⏸ "}${escapeHtml(p.title)} — ⭐ ${p.starCost} · ${assigneeLabel(p.assignedTo)}</span>
          <div class="actions">
            <button data-perk-toggle="${p.perkId}" data-active="${p.active}">${isActiveVal(p.active) ? "Pause" : "Resume"}</button>
            <button class="danger" data-perk-delete="${p.perkId}">Delete</button>
          </div>
        </div>`).join("") : `<p style="margin:0;color:var(--ink-faint);">No rewards yet — add one above.</p>`}
    </div>
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

async function loadTasks() {
  const res = await SavvioCloud.adminListTasks(adminState.adminSessionToken);
  if (res && res.ok) adminState.tasks = res.tasks || [];
  render();
}

async function loadPendingCompletions() {
  const res = await SavvioCloud.adminListPendingCompletions(adminState.adminSessionToken);
  if (res && res.ok) adminState.pendingCompletions = res.completions || [];
  render();
}

async function loadPerksAdmin() {
  const res = await SavvioCloud.adminListPerks(adminState.adminSessionToken);
  if (res && res.ok) adminState.perks = res.perks || [];
  render();
}

async function loadPendingRedemptions() {
  const res = await SavvioCloud.adminListPendingRedemptions(adminState.adminSessionToken);
  if (res && res.ok) adminState.pendingRedemptions = res.redemptions || [];
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
      loadPendingCompletions();
      loadPendingRedemptions();
    } else {
      errEl.textContent = (res && res.error) || "Couldn't sign in — check your connection";
    }
  };

  const logoutBtn = document.getElementById("admin-logout-btn");
  if (logoutBtn) logoutBtn.onclick = doLogout;

  document.querySelectorAll("[data-tab]").forEach(el => el.onclick = () => {
    adminState.tab = el.dataset.tab;
    render();
    if (adminState.tab === "chores") { loadTasks(); loadPendingCompletions(); }
    if (adminState.tab === "perks") { loadPerksAdmin(); loadPendingRedemptions(); }
  });

  const searchInput = document.getElementById("admin-search");
  if (searchInput) searchInput.oninput = () => { adminState.search = searchInput.value; render(); document.getElementById("admin-search").focus(); };

  document.querySelectorAll("[data-filter]").forEach(el => el.onclick = () => { adminState.statusFilter = el.dataset.filter; render(); });

  const refreshBtn = document.getElementById("admin-refresh-btn");
  if (refreshBtn) refreshBtn.onclick = () => loadUsers();

  document.querySelectorAll("[data-approve]").forEach(el => el.onclick = () => runAction(SavvioCloud.adminApproveUser, el.dataset.approve, `Approved`));
  document.querySelectorAll("[data-reject]").forEach(el => el.onclick = () => {
    if (!confirm("Reject this profile? They'll see a friendly not-approved message next time they log in.")) return;
    runAction(SavvioCloud.adminRejectUser, el.dataset.reject, `Rejected`);
  });
  document.querySelectorAll("[data-lock]").forEach(el => el.onclick = () => runAction(SavvioCloud.adminLockUser, el.dataset.lock, `Locked`));
  document.querySelectorAll("[data-unlock]").forEach(el => el.onclick = () => runAction(SavvioCloud.adminUnlockUser, el.dataset.unlock, `Unlocked`));
  document.querySelectorAll("[data-delete]").forEach(el => el.onclick = () => {
    if (!confirm("Delete this profile permanently? This can't be undone.")) return;
    runAction(SavvioCloud.adminDeleteUser, el.dataset.delete, `Deleted`);
  });
  document.querySelectorAll("[data-reset]").forEach(el => el.onclick = () => resetPinFlow(el.dataset.reset));

  // Chores
  const taskCreateBtn = document.getElementById("task-create-btn");
  if (taskCreateBtn) taskCreateBtn.onclick = async () => {
    const title = document.getElementById("task-title").value.trim();
    const starValue = document.getElementById("task-stars").value;
    const recurring = document.getElementById("task-recurring").value;
    const assignedTo = document.getElementById("task-assign").value;
    if (!title || !starValue) { toast("Enter a title and star value"); return; }
    const res = await SavvioCloud.adminCreateTask(adminState.adminSessionToken, title, starValue, assignedTo, recurring);
    if (res && res.ok) { toast("Chore added"); loadTasks(); } else toast((res && res.error) || "Couldn't add chore");
  };
  document.querySelectorAll("[data-chore-approve]").forEach(el => el.onclick = () => reviewCompletion(el.dataset.choreApprove, true));
  document.querySelectorAll("[data-chore-reject]").forEach(el => el.onclick = () => reviewCompletion(el.dataset.choreReject, false));
  document.querySelectorAll("[data-task-toggle]").forEach(el => el.onclick = async () => {
    const active = !isActiveVal(el.dataset.active);
    const res = await SavvioCloud.adminUpdateTask(adminState.adminSessionToken, el.dataset.taskToggle, { active });
    if (res && res.ok) loadTasks(); else toast((res && res.error) || "Couldn't update chore");
  });
  document.querySelectorAll("[data-task-delete]").forEach(el => el.onclick = () => {
    if (!confirm("Delete this chore? Its history stays, but it won't show up for kids anymore.")) return;
    SavvioCloud.adminDeleteTask(adminState.adminSessionToken, el.dataset.taskDelete).then(res => {
      if (res && res.ok) { toast("Deleted"); loadTasks(); } else toast((res && res.error) || "Couldn't delete chore");
    });
  });

  // Perks / rewards
  const perkCreateBtn = document.getElementById("perk-create-btn");
  if (perkCreateBtn) perkCreateBtn.onclick = async () => {
    const title = document.getElementById("perk-title").value.trim();
    const starCost = document.getElementById("perk-cost").value;
    const assignedTo = document.getElementById("perk-assign").value;
    if (!title || !starCost) { toast("Enter a title and star cost"); return; }
    const res = await SavvioCloud.adminCreatePerk(adminState.adminSessionToken, title, starCost, assignedTo);
    if (res && res.ok) { toast("Reward added"); loadPerksAdmin(); } else toast((res && res.error) || "Couldn't add reward");
  };
  document.querySelectorAll("[data-redemption-fulfill]").forEach(el => el.onclick = () => reviewRedemption(el.dataset.redemptionFulfill, true));
  document.querySelectorAll("[data-redemption-reject]").forEach(el => el.onclick = () => reviewRedemption(el.dataset.redemptionReject, false));
  document.querySelectorAll("[data-perk-toggle]").forEach(el => el.onclick = async () => {
    const active = !isActiveVal(el.dataset.active);
    const res = await SavvioCloud.adminUpdatePerk(adminState.adminSessionToken, el.dataset.perkToggle, { active });
    if (res && res.ok) loadPerksAdmin(); else toast((res && res.error) || "Couldn't update reward");
  });
  document.querySelectorAll("[data-perk-delete]").forEach(el => el.onclick = () => {
    if (!confirm("Delete this reward?")) return;
    SavvioCloud.adminDeletePerk(adminState.adminSessionToken, el.dataset.perkDelete).then(res => {
      if (res && res.ok) { toast("Deleted"); loadPerksAdmin(); } else toast((res && res.error) || "Couldn't delete reward");
    });
  });
}

async function reviewCompletion(completionId, approve) {
  const res = await SavvioCloud.adminReviewCompletion(adminState.adminSessionToken, completionId, approve);
  if (res && res.ok) {
    toast(approve ? "Approved — stars credited 🌟" : "Rejected");
    loadPendingCompletions();
    loadUsers();
  } else {
    toast((res && res.error) || "Couldn't update that chore");
  }
}

async function reviewRedemption(redemptionId, approve) {
  const res = await SavvioCloud.adminReviewRedemption(adminState.adminSessionToken, redemptionId, approve);
  if (res && res.ok) {
    toast(approve ? "Marked fulfilled 🎁" : "Rejected — stars refunded");
    loadPendingRedemptions();
    loadUsers();
  } else {
    toast((res && res.error) || "Couldn't update that redemption");
  }
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
if (adminState.loggedIn) { loadUsers(); loadPendingCompletions(); loadPendingRedemptions(); }
