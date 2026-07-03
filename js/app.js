/* ===========================================================
   Savvio — app.js
   Everything: state, gamification rules, router, screens.
   =========================================================== */

const AVATARS = ["🦊","🐼","🐸","🐵","🦁","🐯","🐨","🦄","🐙","🐰","🐢","🦉"];

const LEVELS = [
  { level:1,  name:"Seed",            emoji:"🌰", min:0 },
  { level:2,  name:"Sprout",          emoji:"🌱", min:100 },
  { level:3,  name:"Sprout",          emoji:"🌱", min:250 },
  { level:4,  name:"Sapling",         emoji:"🌿", min:450 },
  { level:5,  name:"Sapling",         emoji:"🌿", min:700 },
  { level:6,  name:"Young Tree",      emoji:"🌳", min:1000 },
  { level:7,  name:"Young Tree",      emoji:"🌳", min:1400 },
  { level:8,  name:"Strong Tree",     emoji:"🌳", min:1900 },
  { level:9,  name:"Strong Tree",     emoji:"🌳", min:2500 },
  { level:10, name:"Mighty Oak",      emoji:"🌲", min:3200 },
  { level:11, name:"Forest Guardian", emoji:"🌲", min:4000 },
];

const BUDGET_CATEGORIES = {
  income: [
    { id:"allowance", label:"Allowance", icon:"💰" },
    { id:"pocketmoney", label:"Pocket Money", icon:"👛" },
    { id:"earnings", label:"Earnings", icon:"💪" },
    { id:"gifts", label:"Gifts", icon:"🎁" },
    { id:"other_income", label:"Other", icon:"➕" },
  ],
  expense: [
    { id:"snacks", label:"Snacks", icon:"🍿" },
    { id:"games", label:"Games", icon:"🎮" },
    { id:"toys", label:"Toys", icon:"🧸" },
    { id:"school", label:"School", icon:"🎒" },
    { id:"entertainment", label:"Entertainment", icon:"🎬" },
    { id:"savings", label:"Savings", icon:"🐷" },
    { id:"other_expense", label:"Other", icon:"➕" },
  ],
};

const BADGES = [
  { id:"first_goal", name:"Goal Setter", icon:"🎯", check:p => p.goals.length >= 1 },
  { id:"goal_getter", name:"Goal Getter", icon:"🏆", check:p => p.goals.filter(g=>g.status==="completed").length >= 3 },
  { id:"big_saver", name:"Big Saver", icon:"💎", check:p => p.goals.reduce((s,g)=>s+g.current,0) >= 100 },
  { id:"quiz_starter", name:"Quiz Starter", icon:"❓", check:p => p.quizAttempts.length >= 1 },
  { id:"quiz_whiz", name:"Quiz Whiz", icon:"🧠", check:p => p.quizAttempts.length >= 10 },
  { id:"perfect_score", name:"Perfect Score", icon:"⭐", check:p => p.quizAttempts.some(a=>a.total>0 && a.score===a.total) },
  { id:"budget_boss", name:"Budget Boss", icon:"📒", check:p => p.budget.length >= 30 },
  { id:"lesson_learner", name:"Lesson Learner", icon:"📘", check:p => p.lessonsCompleted.length >= 1 },
  { id:"know_it_all", name:"Know It All", icon:"🎓", check:p => p.lessonsCompleted.length >= LESSONS.length },
  { id:"streak_7", name:"7-Day Streak", icon:"🔥", check:p => p.streak >= 7 },
  { id:"streak_30", name:"30-Day Streak", icon:"🌟", check:p => p.streak >= 30 },
  { id:"level_5", name:"Sapling Status", icon:"🌿", check:p => getLevelInfo(p.xp).level >= 5 },
];

const DAILY_TIP_POOL = TIPS;

// ---------------------------------------------------------------
// Global state
// ---------------------------------------------------------------
const state = {
  profile: null,
  screen: "splash",
  params: {},
  pinBuffer: "",
  pinTargetId: null, // profile being unlocked
  onboard: { name:"", ageGroup:"", avatar:"", pin:"" },
  loginEntry: { name:"", pin:"" },
  budgetTab: "all", // all | income | expense
  budgetRange: "week", // week | month
  budgetForm: { type:"income", category:"allowance" },
  quizFilter: "all",
  quizSession: null,
  lastNewBadges: [],
  plannerDraft: null,
  choresData: null,
  perksData: null,
};

const $app = () => document.getElementById("app");

// ---------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------
function uid(prefix="id") {
  return prefix + "_" + Date.now().toString(36) + Math.random().toString(36).slice(2,7);
}

function todayStr() {
  return new Date().toISOString().slice(0,10);
}

function fmtDate(d) {
  if (!d) return "";
  const dt = new Date(d + "T00:00:00");
  return dt.toLocaleDateString(undefined, { day:"numeric", month:"short" });
}

function money(n) {
  const v = Number(n) || 0;
  return "$" + v.toFixed(v % 1 === 0 ? 0 : 2);
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
}

function getLevelInfo(xp) {
  let current = LEVELS[0];
  let next = LEVELS[1];
  for (let i = 0; i < LEVELS.length; i++) {
    if (xp >= LEVELS[i].min) { current = LEVELS[i]; next = LEVELS[i+1] || null; }
  }
  if (!next) {
    // Beyond defined table: keep growing Forest Guardian levels
    const extraLevels = Math.floor((xp - 4000) / 1000);
    const level = 11 + extraLevels;
    const min = 4000 + extraLevels * 1000;
    const max = min + 1000;
    return { level, name:"Forest Guardian", emoji:"🌲", xpIntoLevel: xp - min, xpForNext: 1000, min, max };
  }
  return { level: current.level, name: current.name, emoji: current.emoji, xpIntoLevel: xp - current.min, xpForNext: next.min - current.min, min: current.min, max: next.min };
}

function toast(msg) {
  const el = document.createElement("div");
  el.className = "toast";
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2200);
}

function closeModal() {
  const bd = document.querySelector(".modal-backdrop");
  if (bd) bd.remove();
}

function openModal(innerHtml) {
  closeModal();
  const bd = document.createElement("div");
  bd.className = "modal-backdrop";
  bd.innerHTML = `<div class="modal-sheet">${innerHtml}</div>`;
  bd.addEventListener("click", (e) => { if (e.target === bd) closeModal(); });
  document.body.appendChild(bd);
}

// ---------------------------------------------------------------
// Profile / persistence helpers
// ---------------------------------------------------------------
function newProfile({ name, ageGroup, avatar, pin }) {
  return {
    id: uid("kid"),
    name, ageGroup, avatar, pin,
    xp: 0, streak: 0, stars: 0, lastActiveDate: null,
    createdDate: todayStr(),
    goals: [], budget: [], lessonsCompleted: [], quizAttempts: [],
    budgetPlan: null, // { income, save, spend, give }
    // Cloud sync fields (all local-only and harmless until js/cloud.js has a PROXY_URL)
    cloudStatus: "offline", // offline | pending | active | rejected | locked
    sessionToken: null, sessionExpiry: null,
    locked: false,
  };
}

function saveActive() {
  if (state.profile) SavvioStorage.saveProfile(state.profile);
  scheduleCloudSync();
}

let _syncTimer = null;
function scheduleCloudSync() {
  if (!SavvioCloud.isConfigured()) return;
  const p = state.profile;
  if (!p || !p.sessionToken) return; // only synced once this device has logged in against the cloud at least once
  clearTimeout(_syncTimer);
  _syncTimer = setTimeout(async () => {
    const payload = {
      goals: p.goals, budget: p.budget,
      lessonsCompleted: p.lessonsCompleted, quizAttempts: p.quizAttempts,
      badgesEarned: p.badgesEarned || [], budgetPlan: p.budgetPlan || null,
    };
    const res = await SavvioCloud.syncProfile(p.id, p.sessionToken, p.xp, p.streak, p.lastActiveDate, payload);
    if (res && res.ok) {
      p.cloudStatus = res.status;
      p.stars = res.stars || 0;
    } else if (res && res.locked) {
      lockProfileLocally();
    }
  }, 1500);
}

function lockProfileLocally() {
  if (!state.profile) return;
  state.profile.locked = true;
  state.profile.cloudStatus = "locked";
  SavvioStorage.saveProfile(state.profile);
  if (state.screen !== "locked") go("locked");
}

function addXp(amount, reason) {
  state.profile.xp += amount;
  saveActive();
  if (reason) toast(`+${amount} XP · ${reason}`);
}

function touchDailyStreak() {
  const p = state.profile;
  const today = todayStr();
  if (p.lastActiveDate === today) return;
  if (!p.lastActiveDate) {
    p.streak = 1;
  } else {
    const last = new Date(p.lastActiveDate + "T00:00:00");
    const diffDays = Math.round((new Date(today + "T00:00:00") - last) / 86400000);
    if (diffDays === 1) { p.streak += 1; addXp(5, "Daily streak"); }
    else if (diffDays > 1) { p.streak = 1; }
  }
  p.lastActiveDate = today;
  saveActive();
}

function checkNewBadges() {
  const p = state.profile;
  const earnedIds = BADGES.filter(b => b.check(p)).map(b => b.id);
  const already = p.badgesEarned || [];
  const fresh = earnedIds.filter(id => !already.includes(id));
  p.badgesEarned = earnedIds;
  saveActive();
  if (fresh.length) {
    fresh.forEach(id => {
      const b = BADGES.find(x => x.id === id);
      toast(`🏅 New badge: ${b.name}!`);
    });
  }
}

function dailyTipFor(profile) {
  // deterministic "daily" pick based on date + profile id, so it's stable all day
  const seed = (profile.id + todayStr()).split("").reduce((a,c)=>a + c.charCodeAt(0), 0);
  return DAILY_TIP_POOL[seed % DAILY_TIP_POOL.length];
}

// ---------------------------------------------------------------
// Router
// ---------------------------------------------------------------
function go(screen, params = {}) {
  state.screen = screen;
  state.params = params;
  render();
  window.scrollTo(0, 0);
}

function render() {
  const authScreens = ["splash","login-entry","onboard-age","onboard-avatar","pin-login"];
  if (state.screen !== "locked" && state.screen !== "rejected" && !authScreens.includes(state.screen) && !state.profile) { state.screen = "splash"; }

  let html = "";
  switch (state.screen) {
    case "splash": html = renderSplash(); break;
    case "login-entry": html = renderLoginEntry(); break;
    case "onboard-age": html = renderOnboardAge(); break;
    case "onboard-avatar": html = renderOnboardAvatar(); break;
    case "pin-login": html = renderPinLogin(); break;
    case "dashboard": html = renderDashboard(); break;
    case "goals": html = renderGoals(); break;
    case "budget": html = renderBudget(); break;
    case "planner": html = renderPlanner(); break;
    case "lessons": html = renderLessons(); break;
    case "lesson-detail": html = renderLessonDetail(); break;
    case "quiz": html = renderQuizHub(); break;
    case "quiz-play": html = renderQuizPlay(); break;
    case "quiz-result": html = renderQuizResult(); break;
    case "rewards": html = renderRewards(); break;
    case "profile": html = renderProfile(); break;
    case "locked": html = renderLocked(); break;
    case "rejected": html = renderRejected(); break;
    case "chores": html = renderChores(); break;
    case "perks": html = renderPerks(); break;
    default: html = renderSplash();
  }
  $app().innerHTML = html;
  bindScreenEvents();
}

function shell(innerHtml, activeNav) {
  return `
    <div class="topbar">
      <div class="brand"><img class="brand-logo" src="assets/logo.svg" alt="" /> Savvio</div>
      <button class="icon-btn" data-nav="profile" aria-label="Profile">${state.profile ? state.profile.avatar : "👤"}</button>
    </div>
    <div class="screen">${innerHtml}</div>
    ${bottomNav(activeNav)}
  `;
}

function bottomNav(active) {
  const items = [
    { id:"dashboard", icon:"🏠", label:"Home" },
    { id:"goals", icon:"🎯", label:"Goals" },
    { id:"budget", icon:"📒", label:"Budget" },
    { id:"lessons", icon:"📘", label:"Learn" },
    { id:"quiz", icon:"❓", label:"Quiz" },
    { id:"rewards", icon:"🏅", label:"Rewards" },
  ];
  return `<div class="bottomnav">
    ${items.map(i => `<button data-nav="${i.id}" class="${active===i.id?'active':''}">
      <span class="icon">${i.icon}</span>${i.label}
    </button>`).join("")}
  </div>`;
}

// ---------------------------------------------------------------
// Onboarding / auth screens
// ---------------------------------------------------------------
function renderSplash() {
  const profiles = SavvioStorage.listProfiles();
  return `
    <div class="splash">
      <img class="brand-logo-lg" src="assets/logo.svg" alt="Savvio logo" />
      <h1>Savvio</h1>
      <p>Grow smart money habits, one small step at a time.</p>
      ${profiles.length ? `
        <div style="width:100%;max-width:340px;margin-top:10px;">
          ${profiles.map(p => `
            <div class="profile-chip" data-select-profile="${p.id}" role="button" tabindex="0">
              <div class="av">${p.avatar}</div>
              <div class="meta"><div class="n">${escapeHtml(p.name)}</div><div class="s">Level ${getLevelInfo(p.xp).level} · ${p.ageGroup === "kids" ? "Kid" : "Teen"}</div></div>
              ${p.cloudStatus && p.cloudStatus !== "offline" ? `<span class="status-pill status-${p.cloudStatus}">${p.cloudStatus}</span>` : ""}
              <div>›</div>
            </div>`).join("")}
        </div>
      ` : ""}
      <button class="btn btn-primary btn-block" data-nav="login-entry" style="max-width:340px;margin-top:14px;">Log in or create profile</button>
    </div>
  `;
}

// One combined screen: enter name + PIN. If it matches an existing profile
// (checked in the cloud first, then locally if offline), it logs straight
// in. If nothing matches, it offers to create a new profile using the same
// name + PIN, so nothing has to be typed twice.
function renderLoginEntry() {
  return `
    <div class="splash">
      <div style="font-size:3rem;">👋</div>
      <h1>Log in to Savvio</h1>
      <p>Enter your name and PIN. New here? We'll help you set up a profile.</p>
      <div style="width:100%;max-width:320px;text-align:left;">
        <label for="li-name">Your name</label>
        <input type="text" id="li-name" placeholder="e.g. Alex" maxlength="20" value="${escapeHtml(state.loginEntry.name)}" />
        <label for="li-pin">PIN</label>
        <input type="text" id="li-pin" inputmode="numeric" maxlength="4" placeholder="4-digit PIN" value="${escapeHtml(state.loginEntry.pin)}" />
      </div>
      <button class="btn btn-primary btn-block" id="li-submit" style="max-width:320px;margin-top:16px;">Continue</button>
      <button class="btn btn-outline btn-block btn-sm" data-nav="splash" style="max-width:320px;margin-top:10px;">← Back</button>
      <p id="li-error" style="color:var(--danger);font-size:.82rem;min-height:1.2em;"></p>
    </div>
  `;
}

function renderOnboardAge() {
  return `
    <div class="splash">
      <div style="font-size:3rem;">🎂</div>
      <h1>How old are you, ${escapeHtml(state.onboard.name)}?</h1>
      <p>This helps Savvio tailor lessons to you.</p>
      <div class="age-toggle" style="width:100%;max-width:320px;">
        <button data-age="kids" class="${state.onboard.ageGroup==='kids'?'selected':''}">🧒<br>8–12</button>
        <button data-age="teens" class="${state.onboard.ageGroup==='teens'?'selected':''}">🧑<br>13–18</button>
      </div>
      <button class="btn btn-primary btn-block" id="ob-age-next" style="max-width:320px;margin-top:16px;" ${state.onboard.ageGroup?"":"disabled"}>Continue</button>
    </div>
  `;
}

function renderOnboardAvatar() {
  return `
    <div class="splash">
      <div style="font-size:3rem;">${state.onboard.avatar || "🦊"}</div>
      <h1>Pick an avatar</h1>
      <p>You can change this anytime.</p>
      <div class="avatar-grid" style="width:100%;max-width:320px;">
        ${AVATARS.map(a => `<button class="avatar-choice ${state.onboard.avatar===a?'selected':''}" data-avatar="${a}">${a}</button>`).join("")}
      </div>
      <button class="btn btn-primary btn-block" id="ob-avatar-next" style="max-width:320px;margin-top:10px;" ${state.onboard.avatar?"":"disabled"}>Create my profile</button>
    </div>
  `;
}

function renderPinLogin() {
  const p = SavvioStorage.getProfile(state.pinTargetId);
  const dots = [0,1,2,3].map(i => `<span class="${state.pinBuffer.length>i?'filled':''}"></span>`).join("");
  return `
    <div class="splash">
      <div style="font-size:3rem;">${p ? p.avatar : "🔒"}</div>
      <h1>Hi ${p ? escapeHtml(p.name) : ""}!</h1>
      <p>Enter your PIN to continue.</p>
      <div class="pin-dots">${dots}</div>
      ${pinPad()}
      <button class="btn btn-outline btn-sm" data-nav="splash" style="margin-top:14px;">← Back</button>
    </div>
  `;
}

// ---------------------------------------------------------------
// Unified login-or-create flow
// ---------------------------------------------------------------
async function submitLoginEntry() {
  const name = document.getElementById("li-name").value.trim();
  const pin = document.getElementById("li-pin").value.trim();
  const errEl = document.getElementById("li-error");
  errEl.textContent = "";
  if (!name || !/^\d{4}$/.test(pin)) { errEl.textContent = "Enter your name and a 4-digit PIN"; return; }
  state.loginEntry = { name, pin };

  if (SavvioCloud.isConfigured()) {
    const res = await SavvioCloud.loginByName(name, pin);
    if (res && res.ok) { await completeCloudLogin(res, pin); return; }
    if (res && res.locked) { errEl.textContent = "This profile is locked. Ask a parent to unlock it in the Admin portal."; return; }
    if (res && res.notFound) { offerCreateProfile(name, pin); return; }
    if (res && !res.offline) { errEl.textContent = res.error || "Incorrect PIN"; return; }
    // offline: fall through to local-only check below
  }

  const local = SavvioStorage.listProfiles().find(x => x.name.trim().toLowerCase() === name.toLowerCase());
  if (local) {
    if (local.pin === pin) {
      state.profile = local;
      SavvioStorage.setActiveProfileId(local.id);
      state.loginEntry = { name: "", pin: "" };
      touchDailyStreak();
      go("dashboard");
    } else {
      errEl.textContent = "Incorrect PIN";
    }
    return;
  }
  offerCreateProfile(name, pin);
}

function offerCreateProfile(name, pin) {
  toast(`No profile found for "${name}" — let's create one!`);
  state.onboard = { name, ageGroup: "", avatar: "", pin };
  go("onboard-age");
}

async function completeCloudLogin(res, pin) {
  const userId = res.profile.userId;
  const dataRes = await SavvioCloud.restoreProfile(userId, res.sessionToken);
  let saved = {};
  if (dataRes && dataRes.ok) { try { saved = JSON.parse(dataRes.dataJson || "{}"); } catch (e) { saved = {}; } }
  const existing = SavvioStorage.getProfile(userId);
  const previousStatus = existing ? existing.cloudStatus : null;
  const profile = {
    id: userId, name: res.profile.name, ageGroup: res.profile.ageGroup, avatar: res.profile.avatar, pin,
    xp: res.profile.xp || 0, streak: res.profile.streak || 0, stars: res.profile.stars || 0, lastActiveDate: res.profile.lastActiveDate || null,
    createdDate: res.profile.createdDate || todayStr(),
    goals: saved.goals || (existing && existing.goals) || [],
    budget: saved.budget || (existing && existing.budget) || [],
    lessonsCompleted: saved.lessonsCompleted || (existing && existing.lessonsCompleted) || [],
    quizAttempts: saved.quizAttempts || (existing && existing.quizAttempts) || [],
    badgesEarned: saved.badgesEarned || (existing && existing.badgesEarned) || [],
    budgetPlan: saved.budgetPlan || (existing && existing.budgetPlan) || null,
    cloudStatus: res.profile.status, sessionToken: res.sessionToken, sessionExpiry: null, locked: false,
  };
  SavvioStorage.saveProfile(profile);
  SavvioStorage.setActiveProfileId(profile.id);
  state.profile = profile;
  state.loginEntry = { name: "", pin: "" };
  closeModal();
  touchDailyStreak();
  if (profile.cloudStatus === "rejected") { go("rejected"); return; }
  toast(`Welcome back, ${profile.name}! 🌱`);
  if (previousStatus === "pending" && profile.cloudStatus === "active") toast("🎉 Your profile has been approved!");
  go("dashboard");
}

async function finalizeNewProfile() {
  const profile = newProfile(state.onboard);
  SavvioStorage.saveProfile(profile);
  SavvioStorage.setActiveProfileId(profile.id);
  state.profile = profile;
  state.onboard = { name: "", ageGroup: "", avatar: "", pin: "" };
  state.loginEntry = { name: "", pin: "" };
  touchDailyStreak();
  toast(`Welcome, ${profile.name}! 🌱`);
  go("dashboard");
  if (SavvioCloud.isConfigured()) {
    const res = await SavvioCloud.registerProfile(profile.id, profile.name, profile.ageGroup, profile.avatar, profile.pin);
    if (res && res.ok) {
      profile.cloudStatus = res.status;
      profile.sessionToken = res.sessionToken;
      saveActive();
    }
  }
}

function editProfileModal() {
  const p = state.profile;
  openModal(`
    <div class="modal-head"><h3>Edit profile</h3><button class="close-x" id="modal-close">✕</button></div>
    <label for="edit-name">Name</label>
    <input type="text" id="edit-name" value="${escapeHtml(p.name)}" maxlength="20" />
    <label>Avatar</label>
    <div class="avatar-grid" id="edit-avatar-grid">
      ${AVATARS.map(a => `<button type="button" class="avatar-choice ${p.avatar===a?'selected':''}" data-edit-avatar="${a}">${a}</button>`).join("")}
    </div>
    <button class="btn btn-primary btn-block" id="edit-profile-save" style="margin-top:14px;">Save changes</button>
  `);
  let chosenAvatar = p.avatar;
  document.getElementById("modal-close").onclick = closeModal;
  document.querySelectorAll("[data-edit-avatar]").forEach(el => el.onclick = () => {
    chosenAvatar = el.dataset.editAvatar;
    document.querySelectorAll("[data-edit-avatar]").forEach(x => x.classList.toggle("selected", x.dataset.editAvatar === chosenAvatar));
  });
  document.getElementById("edit-profile-save").onclick = async () => {
    const name = document.getElementById("edit-name").value.trim();
    if (!name) { toast("Enter a name"); return; }
    p.name = name;
    p.avatar = chosenAvatar;
    saveActive();
    if (SavvioCloud.isConfigured() && p.sessionToken) {
      const res = await SavvioCloud.updateProfile(p.id, p.sessionToken, name, p.ageGroup, chosenAvatar);
      if (res && res.locked) { lockProfileLocally(); }
    }
    closeModal();
    render();
    toast("Profile updated");
  };
}

function changePinModal() {
  const p = state.profile;
  openModal(`
    <div class="modal-head"><h3>Change PIN</h3><button class="close-x" id="modal-close">✕</button></div>
    <label for="cp-current">Current PIN</label>
    <input type="text" id="cp-current" inputmode="numeric" maxlength="4" placeholder="••••" />
    <label for="cp-new">New PIN</label>
    <input type="text" id="cp-new" inputmode="numeric" maxlength="4" placeholder="••••" />
    <label for="cp-confirm">Confirm new PIN</label>
    <input type="text" id="cp-confirm" inputmode="numeric" maxlength="4" placeholder="••••" />
    <button class="btn btn-primary btn-block" id="cp-save" style="margin-top:14px;">Update PIN</button>
  `);
  document.getElementById("modal-close").onclick = closeModal;
  document.getElementById("cp-save").onclick = async () => {
    const current = document.getElementById("cp-current").value.trim();
    const next = document.getElementById("cp-new").value.trim();
    const confirm = document.getElementById("cp-confirm").value.trim();
    if (!/^\d{4}$/.test(next) || next !== confirm) { toast("New PIN must match and be 4 digits"); return; }

    if (SavvioCloud.isConfigured() && p.sessionToken) {
      const res = await SavvioCloud.changePin(p.id, p.sessionToken, current, next);
      if (res && res.ok) {
        p.pin = next;
        saveActive();
        closeModal();
        toast("PIN updated");
        return;
      }
      if (res && res.locked) { lockProfileLocally(); closeModal(); return; }
      if (res && !res.offline) { toast(res.error || "Couldn't update PIN"); return; }
      // offline: fall through to local-only change below
    }
    if (p.pin !== current) { toast("Current PIN is incorrect"); return; }
    p.pin = next;
    saveActive();
    closeModal();
    toast("PIN updated on this device");
  };
}

function pinPad() {
  const keys = ["1","2","3","4","5","6","7","8","9","⌫","0","OK"];
  return `<div class="pin-pad">${keys.map(k => `<button data-pinkey="${k}">${k}</button>`).join("")}</div>`;
}

function renderLocked() {
  return `
    <div class="splash locked-screen">
      <div class="lock-icon">🔒</div>
      <h1>This profile is locked</h1>
      <p>Ask a parent or guardian to unlock it, or reset the PIN, from the Savvio Admin portal.</p>
      <div class="card" style="width:100%;max-width:340px;">
        <p style="margin:0;font-size:.85rem;color:var(--ink-soft);">This usually happens after too many incorrect PIN attempts, or because a parent locked the profile on purpose.</p>
      </div>
      <button class="btn btn-outline btn-block" style="max-width:340px;margin-top:14px;" id="locked-retry-btn">Try again</button>
      <button class="btn btn-outline btn-block" style="max-width:340px;margin-top:8px;" id="locked-switch-btn">Switch profile</button>
    </div>
  `;
}

function renderRejected() {
  const name = state.profile ? escapeHtml(state.profile.name) : "";
  return `
    <div class="splash locked-screen">
      <div class="lock-icon">🌱</div>
      <h1>Not approved yet, ${name}</h1>
      <p>A parent or guardian looked at this profile and didn't approve it. If that seems wrong, have a chat with them or check the Savvio Admin portal.</p>
      <button class="btn btn-outline btn-block" style="max-width:340px;margin-top:14px;" id="rejected-switch-btn">Switch profile</button>
    </div>
  `;
}

// ---------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------
function renderDashboard() {
  const p = state.profile;
  const lvl = getLevelInfo(p.xp);
  const pct = Math.min(100, Math.round((lvl.xpIntoLevel / lvl.xpForNext) * 100));
  const tip = dailyTipFor(p);
  const activeGoals = p.goals.filter(g => g.status !== "completed").slice(0,2);
  const now = new Date();
  const hr = now.getHours();
  const greet = hr < 12 ? "Good morning" : hr < 17 ? "Good afternoon" : "Good evening";

  const { income, expense } = budgetTotals(p, "week");

  return shell(`
    <div class="greeting">
      <div class="hello">${greet}, ${escapeHtml(p.name)} ${p.avatar}</div>
      <div class="sub">Let's grow your money skills today.</div>
    </div>

    <div class="stat-row">
      <div class="stat-pill"><div class="val">${p.xp}</div><div class="lbl">XP</div></div>
      <div class="stat-pill"><div class="val">${lvl.level}</div><div class="lbl">Level</div></div>
      <div class="stat-pill"><div class="val">🔥${p.streak}</div><div class="lbl">Streak</div></div>
    </div>

    <div class="card plant-card">
      <div style="font-size:2.6rem;">${lvl.emoji}</div>
      <div class="level-name">${lvl.name}</div>
      <div class="xp-bar-wrap">
        <div class="xp-bar"><div class="xp-bar-fill" style="width:${pct}%;"></div></div>
        <div class="xp-bar-caption">${lvl.xpIntoLevel} / ${lvl.xpForNext} XP to next level</div>
      </div>
    </div>

    <div class="card tip-card">
      <div class="eyebrow">Today's tip</div>
      <p style="margin:6px 0 0;">${escapeHtml(tip.text)}</p>
    </div>

    <div class="quick-actions">
      <button data-nav="goals"><span class="icon">🎯</span>Goals</button>
      <button data-nav="budget"><span class="icon">📒</span>Budget</button>
      <button data-nav="lessons"><span class="icon">📘</span>Learn</button>
      <button data-nav="quiz"><span class="icon">❓</span>Quiz</button>
    </div>

    <div class="section-head"><h2>Savings goals</h2><button class="link" data-nav="goals">See all</button></div>
    ${activeGoals.length ? activeGoals.map(g => goalCardHtml(g)).join("") : `
      <div class="card empty-state"><span class="emoji">🎯</span>No goals yet. Start one on the Goals tab!</div>`}

    <div class="section-head"><h2>This week's budget</h2><button class="link" data-nav="budget">Details</button></div>
    <div class="card">
      <div class="budget-summary">
        <div class="box income"><div class="v">${money(income)}</div><div class="l">In</div></div>
        <div class="box expense"><div class="v">${money(expense)}</div><div class="l">Out</div></div>
        <div class="box remaining"><div class="v">${money(income-expense)}</div><div class="l">Left</div></div>
      </div>
      ${budgetHealthHtml(income, expense)}
    </div>
  `, "dashboard");
}

function budgetHealthHtml(income, expense) {
  if (income === 0 && expense === 0) {
    return `<div class="health-msg warn">Log some income or spending to see how you're doing.</div>`;
  }
  const remaining = income - expense;
  if (remaining >= 0 && expense <= income * 0.7) {
    return `<div class="health-msg good">You saved more than you spent this week. Great job! 🌟</div>`;
  }
  if (remaining >= 0) {
    return `<div class="health-msg warn">You're breaking even. A little more saved would help. 🌱</div>`;
  }
  return `<div class="health-msg bad">You spent more than you earned this week. Let's rebalance. 💡</div>`;
}

// ---------------------------------------------------------------
// Goals
// ---------------------------------------------------------------
function goalCardHtml(g) {
  const pct = g.target > 0 ? Math.min(100, Math.round((g.current / g.target) * 100)) : 0;
  const done = g.status === "completed";
  return `
    <div class="card goal-card ${done?'done':''}" data-goal-id="${g.id}">
      <div class="top-row">
        <div>
          <h3 style="margin-bottom:2px;">${escapeHtml(g.title)}</h3>
          ${g.targetDate ? `<div style="font-size:.72rem;color:var(--ink-faint);">Target: ${fmtDate(g.targetDate)}</div>` : ""}
        </div>
        ${done ? `<span class="badge-pill">Done! 🎉</span>` : ""}
      </div>
      <div class="amount">${money(g.current)} <span style="color:var(--ink-faint);font-weight:400;font-size:.85rem;">of ${money(g.target)}</span></div>
      <div class="progress-track" style="margin-top:8px;"><div class="progress-fill" style="width:${pct}%;"></div></div>
      <div class="pct">${pct}% complete</div>
      ${!done ? `
        <div class="actions">
          <button class="btn btn-primary btn-sm" data-goal-add="${g.id}">+ Add money</button>
          <button class="btn btn-outline btn-sm" data-goal-edit="${g.id}">Edit</button>
          <button class="btn btn-outline btn-sm" data-goal-delete="${g.id}">Delete</button>
        </div>` : `
        <div class="actions">
          <button class="btn btn-outline btn-sm" data-goal-delete="${g.id}">Remove</button>
        </div>`}
    </div>
  `;
}

function renderGoals() {
  const p = state.profile;
  const active = p.goals.filter(g => g.status !== "completed");
  const done = p.goals.filter(g => g.status === "completed");
  return shell(`
    <div class="section-head" style="margin-top:0;"><h2>Your goals</h2></div>
    <button class="btn btn-coral btn-block" id="new-goal-btn" style="margin-bottom:14px;">+ New savings goal</button>
    ${active.length ? active.map(goalCardHtml).join("") : `<div class="card empty-state"><span class="emoji">🌱</span>No active goals. What are you saving for?</div>`}
    ${done.length ? `<div class="section-head"><h2>Completed 🎉</h2></div>${done.map(goalCardHtml).join("")}` : ""}
  `, "goals");
}

function goalFormModal(existing) {
  const g = existing || { title:"", target:"", current:"0", targetDate:"" };
  openModal(`
    <div class="modal-head"><h3>${existing?"Edit goal":"New savings goal"}</h3><button class="close-x" id="modal-close">✕</button></div>
    <label for="g-title">What are you saving for?</label>
    <input type="text" id="g-title" placeholder="e.g. New headphones" value="${escapeHtml(g.title)}" maxlength="40" />
    <div class="field-row">
      <div>
        <label for="g-target">Target amount</label>
        <input type="number" id="g-target" min="1" step="0.01" value="${g.target}" />
      </div>
      <div>
        <label for="g-current">Already saved</label>
        <input type="number" id="g-current" min="0" step="0.01" value="${g.current}" />
      </div>
    </div>
    <label for="g-date">Target date (optional)</label>
    <input type="date" id="g-date" value="${g.targetDate||""}" />
    <button class="btn btn-primary btn-block" id="g-save" style="margin-top:16px;">${existing?"Save changes":"Create goal"}</button>
  `);
  document.getElementById("modal-close").onclick = closeModal;
  document.getElementById("g-save").onclick = () => {
    const title = document.getElementById("g-title").value.trim();
    const target = parseFloat(document.getElementById("g-target").value);
    const current = parseFloat(document.getElementById("g-current").value) || 0;
    const targetDate = document.getElementById("g-date").value;
    if (!title || !target || target <= 0) { toast("Add a title and target amount"); return; }
    const p = state.profile;
    if (existing) {
      Object.assign(existing, { title, target, current, targetDate });
      if (existing.current >= existing.target) existing.status = "completed";
    } else {
      const goal = { id: uid("goal"), title, target, current, targetDate, status: current >= target ? "completed" : "active", createdDate: todayStr() };
      p.goals.push(goal);
      addXp(5, "New goal");
    }
    saveActive();
    checkNewBadges();
    closeModal();
    render();
  };
}

function addMoneyModal(goal) {
  openModal(`
    <div class="modal-head"><h3>Add to "${escapeHtml(goal.title)}"</h3><button class="close-x" id="modal-close">✕</button></div>
    <label for="add-amt">Amount to add</label>
    <input type="number" id="add-amt" min="0.01" step="0.01" placeholder="5.00" />
    <button class="btn btn-primary btn-block" id="add-save" style="margin-top:14px;">Add</button>
  `);
  document.getElementById("modal-close").onclick = closeModal;
  document.getElementById("add-save").onclick = () => {
    const amt = parseFloat(document.getElementById("add-amt").value);
    if (!amt || amt <= 0) { toast("Enter an amount"); return; }
    goal.current += amt;
    const justCompleted = goal.current >= goal.target && goal.status !== "completed";
    if (justCompleted) { goal.status = "completed"; addXp(50, `"${goal.title}" complete!`); }
    saveActive();
    checkNewBadges();
    closeModal();
    render();
    if (justCompleted) toast(`🎉 Goal complete: ${goal.title}!`);
  };
}

// ---------------------------------------------------------------
// Budget
// ---------------------------------------------------------------
function budgetTotals(p, range) {
  const now = new Date();
  const cutoff = new Date(now);
  if (range === "week") cutoff.setDate(now.getDate() - 7); else cutoff.setDate(now.getDate() - 30);
  const entries = p.budget.filter(e => new Date(e.date + "T00:00:00") >= cutoff);
  const income = entries.filter(e => e.type === "income").reduce((s,e)=>s+e.amount,0);
  const expense = entries.filter(e => e.type === "expense").reduce((s,e)=>s+e.amount,0);
  return { income, expense, entries };
}

function catInfo(type, id) {
  return BUDGET_CATEGORIES[type].find(c => c.id === id) || { label:id, icon:"💵" };
}

// ---------------------------------------------------------------
// Budget Planner (separate from the Budget tracker — this plans
// ahead, the tracker logs what actually happened)
// ---------------------------------------------------------------
const PLANNER_PRESETS = {
  balanced: { label: "Balanced", save: 40, spend: 40, give: 20 },
  saver: { label: "Big saver", save: 60, spend: 30, give: 10 },
  even: { label: "Even thirds", save: 34, spend: 33, give: 33 },
};

function updatePlannerDisplay() {
  const plan = state.plannerDraft;
  const income = Number(plan.income) || 0;
  const setAmt = (id, pct) => { const el = document.getElementById(id); if (el) el.textContent = `${pct}% · ${money((income*pct)/100)}`; };
  setAmt("plan-save-amt", plan.save);
  setAmt("plan-spend-amt", plan.spend);
  setAmt("plan-give-amt", plan.give);
  const total = plan.save + plan.spend + plan.give;
  const msgEl = document.getElementById("plan-total-msg");
  if (msgEl) {
    msgEl.className = `health-msg ${total===100?'good':total>100?'bad':'warn'}`;
    msgEl.textContent = total === 100 ? "Perfectly allocated — 100%. 🌟" : total > 100 ? `Over by ${total-100}% — nudge a slider down.` : `${100-total}% left to allocate.`;
  }
}

function renderPlanner() {
  const p = state.profile;
  if (!state.plannerDraft) state.plannerDraft = { ...(p.budgetPlan || { income: 20, save: 40, spend: 40, give: 20 }) };
  const plan = state.plannerDraft;
  const income = Number(plan.income) || 0;
  const saveAmt = (income * plan.save) / 100;
  const spendAmt = (income * plan.spend) / 100;
  const giveAmt = (income * plan.give) / 100;
  const totalPct = plan.save + plan.spend + plan.give;
  const tip = p.ageGroup === "kids"
    ? "Try saving a little before you plan how to spend the rest — future you will be glad."
    : "A common starting point is roughly 40% save, 40% spend, 20% give or shared costs — adjust it to fit your life.";

  return shell(`
    <div class="section-head" style="margin-top:0;"><h2>Budget Planner</h2></div>
    <p style="color:var(--ink-soft);font-size:.88rem;margin-top:0;">Plan ahead for money you expect — separate from your Budget tracker, which logs what already happened.</p>

    <div class="card">
      <label for="plan-income">How much money are you planning for?</label>
      <input type="number" id="plan-income" min="0" step="0.01" value="${income}" />

      <label style="margin-top:14px;">Quick presets</label>
      <div class="tab-row">
        ${Object.entries(PLANNER_PRESETS).map(([key,pr]) => `<button data-preset="${key}" style="flex:0 0 auto;padding:8px 14px;">${pr.label}</button>`).join("")}
      </div>

      <div class="card-flat">
        <div style="display:flex;justify-content:space-between;"><span>🐷 Save</span><strong id="plan-save-amt">${plan.save}% · ${money(saveAmt)}</strong></div>
        <input type="range" min="0" max="100" id="plan-save" value="${plan.save}" />
      </div>
      <div class="card-flat">
        <div style="display:flex;justify-content:space-between;"><span>🛍️ Spend</span><strong id="plan-spend-amt">${plan.spend}% · ${money(spendAmt)}</strong></div>
        <input type="range" min="0" max="100" id="plan-spend" value="${plan.spend}" />
      </div>
      <div class="card-flat">
        <div style="display:flex;justify-content:space-between;"><span>🎁 Give / shared</span><strong id="plan-give-amt">${plan.give}% · ${money(giveAmt)}</strong></div>
        <input type="range" min="0" max="100" id="plan-give" value="${plan.give}" />
      </div>

      <div class="health-msg ${totalPct===100?'good':totalPct>100?'bad':'warn'}" id="plan-total-msg" style="margin-top:4px;">
        ${totalPct === 100 ? "Perfectly allocated — 100%. 🌟" : totalPct > 100 ? `Over by ${totalPct-100}% — nudge a slider down.` : `${100-totalPct}% left to allocate.`}
      </div>
    </div>

    <div class="card tip-card">
      <div class="eyebrow">Planning tip</div>
      <p style="margin:6px 0 0;">${tip}</p>
    </div>

    <button class="btn btn-primary btn-block" id="plan-save-btn">Save this plan</button>
    <button class="btn btn-outline btn-block" data-nav="budget" style="margin-top:8px;">← Back to Budget</button>
  `, "budget");
}

function renderBudget() {
  const p = state.profile;
  const { income, expense, entries } = budgetTotals(p, state.budgetRange);
  const filtered = state.budgetTab === "all" ? entries : entries.filter(e => e.type === state.budgetTab);
  const sorted = [...filtered].sort((a,b) => b.date.localeCompare(a.date));

  // 7-day expense-by-category chart
  const byCat = {};
  entries.filter(e=>e.type==="expense").forEach(e => { byCat[e.category] = (byCat[e.category]||0) + e.amount; });
  const catEntries = Object.entries(byCat).sort((a,b)=>b[1]-a[1]).slice(0,5);
  const maxVal = Math.max(1, ...catEntries.map(c=>c[1]));

  return shell(`
    <div class="section-head" style="margin-top:0;"><h2>Budget</h2></div>
    <button class="btn btn-coral btn-block" id="new-txn-btn" style="margin-bottom:10px;">+ Log money in or out</button>
    <button class="btn btn-outline btn-block" data-nav="planner" style="margin-bottom:12px;">🧮 Open Budget Planner</button>

    <div class="card">
      <div class="tab-row">
        <button data-range="week" class="${state.budgetRange==='week'?'active':''}">This week</button>
        <button data-range="month" class="${state.budgetRange==='month'?'active':''}">This month</button>
      </div>
      <div class="budget-summary">
        <div class="box income"><div class="v">${money(income)}</div><div class="l">Income</div></div>
        <div class="box expense"><div class="v">${money(expense)}</div><div class="l">Spent</div></div>
        <div class="box remaining"><div class="v">${money(income-expense)}</div><div class="l">Left</div></div>
      </div>
      ${budgetHealthHtml(income, expense)}
      ${catEntries.length ? `
        <div class="bar-chart">
          ${catEntries.map(([cat,val]) => `
            <div class="bar-col">
              <div class="bar" style="height:${Math.max(6, Math.round((val/maxVal)*100))}%;"></div>
              <div class="lbl">${catInfo("expense",cat).icon}</div>
            </div>`).join("")}
        </div>` : ""}
    </div>

    <div class="tab-row">
      <button data-txntab="all" class="${state.budgetTab==='all'?'active':''}">All</button>
      <button data-txntab="income" class="${state.budgetTab==='income'?'active':''}">Income</button>
      <button data-txntab="expense" class="${state.budgetTab==='expense'?'active':''}">Spending</button>
    </div>
    <div class="card">
      ${sorted.length ? sorted.map(txnRowHtml).join("") : `<div class="empty-state"><span class="emoji">📒</span>No entries in this period yet.</div>`}
    </div>
  `, "budget");
}

function txnRowHtml(e) {
  const c = catInfo(e.type, e.category);
  return `
    <div class="txn-row">
      <div class="cat-icon">${c.icon}</div>
      <div class="meta"><div class="c">${escapeHtml(c.label)}${e.notes?` · ${escapeHtml(e.notes)}`:""}</div><div class="d">${fmtDate(e.date)}</div></div>
      <div class="amt ${e.type==='income'?'pos':'neg'}">${e.type==='income'?'+':'-'}${money(e.amount)}</div>
      <button class="del" data-txn-delete="${e.id}" aria-label="Delete entry">🗑</button>
    </div>`;
}

function txnFormModal() {
  const type = state.budgetForm.type;
  openModal(`
    <div class="modal-head"><h3>Log money</h3><button class="close-x" id="modal-close">✕</button></div>
    <div class="tab-row">
      <button data-txn-type="income" class="${type==='income'?'active':''}">Money in</button>
      <button data-txn-type="expense" class="${type==='expense'?'active':''}">Money out</button>
    </div>
    <label>Category</label>
    <div class="category-pick" id="txn-cats">
      ${BUDGET_CATEGORIES[type].map(c => `<button data-cat="${c.id}" class="${state.budgetForm.category===c.id?'selected':''}">${c.icon}<span>${c.label}</span></button>`).join("")}
    </div>
    <label for="txn-amt">Amount</label>
    <input type="number" id="txn-amt" min="0.01" step="0.01" placeholder="5.00" />
    <label for="txn-date">Date</label>
    <input type="date" id="txn-date" value="${todayStr()}" />
    <label for="txn-notes">Note (optional)</label>
    <input type="text" id="txn-notes" maxlength="40" placeholder="What was it for?" />
    <button class="btn btn-primary btn-block" id="txn-save" style="margin-top:14px;">Save entry</button>
  `);
  document.getElementById("modal-close").onclick = closeModal;
  document.querySelectorAll("[data-txn-type]").forEach(btn => btn.onclick = () => {
    state.budgetForm.type = btn.dataset.txnType;
    state.budgetForm.category = BUDGET_CATEGORIES[state.budgetForm.type][0].id;
    txnFormModal();
  });
  document.querySelectorAll("#txn-cats [data-cat]").forEach(btn => btn.onclick = () => {
    state.budgetForm.category = btn.dataset.cat;
    txnFormModal();
  });
  document.getElementById("txn-save").onclick = () => {
    const amount = parseFloat(document.getElementById("txn-amt").value);
    const date = document.getElementById("txn-date").value || todayStr();
    const notes = document.getElementById("txn-notes").value.trim();
    if (!amount || amount <= 0) { toast("Enter an amount"); return; }
    const p = state.profile;
    p.budget.push({ id: uid("txn"), type: state.budgetForm.type, category: state.budgetForm.category, amount, date, notes });
    saveActive();
    addXp(2, "Logged money");
    checkNewBadges();
    closeModal();
    render();
  };
}

// ---------------------------------------------------------------
// Lessons
// ---------------------------------------------------------------
function renderLessons() {
  const p = state.profile;
  return shell(`
    <div class="section-head" style="margin-top:0;"><h2>Lessons</h2></div>
    <p style="color:var(--ink-soft);font-size:.88rem;margin-top:0;">${p.lessonsCompleted.length} of ${LESSONS.length} completed</p>
    ${LESSONS.map(l => `
      <div class="card lesson-card" data-lesson-open="${l.id}" role="button" tabindex="0">
        <div class="ico">${l.icon}</div>
        <div class="meta"><h3>${escapeHtml(l.title)}</h3><p>${escapeHtml(l.summary)}</p></div>
        ${p.lessonsCompleted.includes(l.id) ? `<div class="check">✅</div>` : `<div style="color:var(--ink-faint);">›</div>`}
      </div>
    `).join("")}
  `, "lessons");
}

function renderLessonDetail() {
  const l = LESSONS.find(x => x.id === state.params.id);
  if (!l) return renderLessons();
  const p = state.profile;
  const done = p.lessonsCompleted.includes(l.id);
  return shell(`
    <button class="btn btn-outline btn-sm" data-nav="lessons" style="margin-bottom:10px;">← All lessons</button>
    <div class="lesson-detail">
      <div style="font-size:2.2rem;">${l.icon}</div>
      <h2>${escapeHtml(l.title)}</h2>
      ${l.sections.map(s => `<div class="section-block"><h3>${escapeHtml(s.heading)}</h3><p>${escapeHtml(s.body)}</p></div>`).join("")}
      <button class="btn ${done?'btn-outline':'btn-primary'} btn-block" id="lesson-complete-btn" ${done?'disabled':''} style="margin-top:10px;">
        ${done ? "✅ Completed" : "Mark as complete (+20 XP)"}
      </button>
    </div>
  `, "lessons");
}

// ---------------------------------------------------------------
// Quiz
// ---------------------------------------------------------------
function renderQuizHub() {
  const p = state.profile;
  const cats = ["all", ...new Set(QUIZ.map(q => q.category))];
  const labelFor = c => c === "all" ? "All topics" : (LESSONS.find(l=>l.category===c)?.title || c);
  return shell(`
    <div class="section-head" style="margin-top:0;"><h2>Quiz time</h2></div>
    <p style="color:var(--ink-soft);font-size:.88rem;margin-top:0;">${p.quizAttempts.length} quizzes played</p>
    <div class="card">
      <label>Pick a topic</label>
      <div class="tab-row" style="flex-wrap:wrap;">
        ${cats.map(c => `<button data-quizfilter="${c}" class="${state.quizFilter===c?'active':''}" style="flex:0 0 auto;padding:8px 14px;">${labelFor(c)}</button>`).join("")}
      </div>
      <button class="btn btn-primary btn-block" id="start-quiz-btn" style="margin-top:10px;">Start 5-question quiz</button>
    </div>
    <div class="section-head"><h2>Past scores</h2></div>
    ${p.quizAttempts.length ? [...p.quizAttempts].reverse().slice(0,8).map(a => `
      <div class="card-flat" style="display:flex;justify-content:space-between;align-items:center;">
        <div>${fmtDate(a.date)}</div>
        <div style="font-weight:700;">${a.score}/${a.total}</div>
      </div>`).join("") : `<div class="card empty-state"><span class="emoji">❓</span>Play your first quiz above!</div>`}
  `, "quiz");
}

function renderQuizPlay() {
  const s = state.quizSession;
  if (!s) return renderQuizHub();
  const q = s.questions[s.idx];
  const answered = s.answers[s.idx] !== undefined;
  return shell(`
    <div class="quiz-progress">Question ${s.idx+1} of ${s.questions.length} · <span class="diff-pill diff-${q.difficulty}">${q.difficulty}</span></div>
    <div class="card">
      <div class="quiz-q">${escapeHtml(q.question)}</div>
      ${q.options.map((opt,i) => {
        let cls = "";
        if (answered) {
          if (i === q.answer) cls = "correct";
          else if (i === s.answers[s.idx] && i !== q.answer) cls = "wrong";
        }
        return `<button class="quiz-opt ${cls}" data-quiz-opt="${i}" ${answered?'disabled':''}>${escapeHtml(opt)}</button>`;
      }).join("")}
      ${answered ? `<div class="quiz-explain">${escapeHtml(q.explanation)}</div>
        <button class="btn btn-primary btn-block" id="quiz-next-btn" style="margin-top:14px;">${s.idx+1 < s.questions.length ? "Next question" : "See results"}</button>` : ""}
    </div>
  `, "quiz");
}

function renderQuizResult() {
  const s = state.quizSession;
  if (!s) return renderQuizHub();
  const pct = Math.round((s.correctCount / s.questions.length) * 100);
  const msg = pct === 100 ? "Perfect score! 🌟" : pct >= 60 ? "Nice work! 🌱" : "Good try — every quiz helps you learn!";
  return shell(`
    <div class="card quiz-result">
      <div style="font-size:2.6rem;">${pct===100?"🏆":pct>=60?"🎉":"💪"}</div>
      <div class="big">${s.correctCount}/${s.questions.length}</div>
      <p style="color:var(--ink-soft);">${msg}</p>
      <button class="btn btn-primary btn-block" id="quiz-again-btn" style="margin-top:10px;">Play again</button>
      <button class="btn btn-outline btn-block" data-nav="quiz" style="margin-top:8px;">Back to Quiz hub</button>
    </div>
  `, "quiz");
}

// ---------------------------------------------------------------
// Rewards
// ---------------------------------------------------------------
function renderRewards() {
  const p = state.profile;
  return shell(`
    <div class="section-head" style="margin-top:0;"><h2>Rewards</h2></div>
    <div class="card" style="text-align:center;">
      <div style="font-size:2.2rem;">${getLevelInfo(p.xp).emoji}</div>
      <div style="font-family:var(--font-display);font-size:1.1rem;">Level ${getLevelInfo(p.xp).level} · ${getLevelInfo(p.xp).name}</div>
      <div style="color:var(--ink-faint);font-size:.85rem;">${p.xp} XP total</div>
    </div>

    <div class="card" style="text-align:center;background:linear-gradient(160deg, #FFF6DC, var(--surface));">
      <div style="font-size:2.2rem;">⭐ ${p.stars || 0}</div>
      <div style="color:var(--ink-faint);font-size:.78rem;text-transform:uppercase;letter-spacing:.04em;">Stars from chores</div>
      <p style="font-size:.85rem;color:var(--ink-soft);margin:8px 0 14px;">Do chores at home, earn stars once a parent checks them off, then spend stars on rewards they've set up.</p>
      <button class="btn btn-primary btn-block" id="open-chores-btn">🌟 View Chores</button>
      <button class="btn btn-outline btn-block" id="open-perks-btn" style="margin-top:10px;">🎁 Redeem Rewards</button>
    </div>

    <div class="section-head"><h2>Badges</h2></div>
    <div class="badge-grid">
      ${BADGES.map(b => {
        const earned = b.check(p);
        return `<div class="badge-item ${earned?'':'locked'}"><div class="ic">${b.icon}</div><div class="n">${b.name}</div></div>`;
      }).join("")}
    </div>
  `, "rewards");
}

// ---------------------------------------------------------------
// Chores (stars) & Perks (rewards) — parent-verified via the cloud
// ---------------------------------------------------------------
function renderChores() {
  if (!SavvioCloud.isConfigured()) {
    return shell(`
      <div class="section-head" style="margin-top:0;"><h2>Chores</h2></div>
      <div class="card empty-state"><span class="emoji">🌟</span>Chores need the cloud backend connected first. Ask a parent to finish the setup in <code>appsscript/SETUP.md</code>.</div>
      <button class="btn btn-outline btn-block" data-nav="rewards">← Back to Rewards</button>
    `, "rewards");
  }
  if (!state.choresData) {
    loadChores();
    return shell(`<div class="section-head" style="margin-top:0;"><h2>Chores</h2></div><div class="card" style="text-align:center;">Loading your chores…</div>`, "rewards");
  }
  const { tasks, history, error } = state.choresData;
  return shell(`
    <div class="section-head" style="margin-top:0;"><h2>Chores</h2></div>
    <div class="card" style="text-align:center;"><div style="font-size:1.6rem;">⭐ ${state.profile.stars || 0}</div><div style="color:var(--ink-faint);font-size:.72rem;text-transform:uppercase;">Your stars</div></div>
    ${error ? `<div class="card empty-state">${escapeHtml(error)}</div>` : ""}
    ${tasks && tasks.length ? tasks.map(taskRowHtml).join("") : `<div class="card empty-state"><span class="emoji">🌟</span>No chores set up yet. Ask a parent to add some in the Admin portal.</div>`}
    ${history && history.length ? `<div class="section-head"><h2>Recent</h2></div>${history.slice(0,6).map(choreHistoryRowHtml).join("")}` : ""}
    <button class="btn btn-outline btn-block" data-nav="rewards" style="margin-top:10px;">← Back to Rewards</button>
  `, "rewards");
}

function taskRowHtml(t) {
  const label = t.recurring === "daily" ? "Daily" : t.recurring === "weekly" ? "Weekly" : "One-time";
  let action;
  if (t.status === "approved") action = `<span class="badge-pill">Done ✅</span>`;
  else if (t.status === "pending") action = `<span class="badge-pill grey">Waiting for approval</span>`;
  else action = `<button class="btn btn-primary btn-sm" data-task-done="${t.taskId}">Mark done</button>`;
  return `
    <div class="card-flat" style="display:flex;justify-content:space-between;align-items:center;gap:10px;">
      <div><div style="font-weight:700;">${escapeHtml(t.title)}</div><div style="font-size:.72rem;color:var(--ink-faint);">${label} · ⭐ ${t.starValue}</div></div>
      ${action}
    </div>`;
}

function choreHistoryRowHtml(h) {
  const icon = h.status === "approved" ? "✅" : h.status === "rejected" ? "❌" : "⏳";
  return `<div class="card-flat" style="display:flex;justify-content:space-between;"><span>${icon} ${escapeHtml(h.taskTitle)}</span><span style="color:var(--ink-faint);font-size:.78rem;">${h.status}</span></div>`;
}

function renderPerks() {
  if (!SavvioCloud.isConfigured()) {
    return shell(`
      <div class="section-head" style="margin-top:0;"><h2>Redeem Rewards</h2></div>
      <div class="card empty-state"><span class="emoji">🎁</span>Rewards need the cloud backend connected first. Ask a parent to finish the setup in <code>appsscript/SETUP.md</code>.</div>
      <button class="btn btn-outline btn-block" data-nav="rewards">← Back to Rewards</button>
    `, "rewards");
  }
  if (!state.perksData) {
    loadPerks();
    return shell(`<div class="section-head" style="margin-top:0;"><h2>Redeem Rewards</h2></div><div class="card" style="text-align:center;">Loading rewards…</div>`, "rewards");
  }
  const { perks, history, error } = state.perksData;
  return shell(`
    <div class="section-head" style="margin-top:0;"><h2>Redeem Rewards</h2></div>
    <div class="card" style="text-align:center;"><div style="font-size:1.6rem;">⭐ ${state.profile.stars || 0}</div><div style="color:var(--ink-faint);font-size:.72rem;text-transform:uppercase;">Your stars</div></div>
    ${error ? `<div class="card empty-state">${escapeHtml(error)}</div>` : ""}
    ${perks && perks.length ? perks.map(perkRowHtml).join("") : `<div class="card empty-state"><span class="emoji">🎁</span>No rewards set up yet. Ask a parent to add some in the Admin portal.</div>`}
    ${history && history.length ? `<div class="section-head"><h2>Recent</h2></div>${history.slice(0,6).map(perkHistoryRowHtml).join("")}` : ""}
    <button class="btn btn-outline btn-block" data-nav="rewards" style="margin-top:10px;">← Back to Rewards</button>
  `, "rewards");
}

function perkRowHtml(p) {
  const stars = state.profile.stars || 0;
  let action;
  if (p.pending) action = `<span class="badge-pill grey">Requested</span>`;
  else if (stars < p.starCost) action = `<span class="badge-pill grey">Need ${p.starCost - stars} more</span>`;
  else action = `<button class="btn btn-primary btn-sm" data-perk-redeem="${p.perkId}">Redeem</button>`;
  return `
    <div class="card-flat" style="display:flex;justify-content:space-between;align-items:center;gap:10px;">
      <div><div style="font-weight:700;">${escapeHtml(p.title)}</div><div style="font-size:.72rem;color:var(--ink-faint);">⭐ ${p.starCost}</div></div>
      ${action}
    </div>`;
}

function perkHistoryRowHtml(h) {
  const icon = h.status === "fulfilled" ? "🎉" : h.status === "rejected" ? "↩️" : "⏳";
  return `<div class="card-flat" style="display:flex;justify-content:space-between;"><span>${icon} ${escapeHtml(h.perkTitle)}</span><span style="color:var(--ink-faint);font-size:.78rem;">${h.status}</span></div>`;
}

function diffChoreNotifications(prevData, newData) {
  if (!prevData) return; // first load this session — nothing to compare against yet
  const prevMap = {};
  (prevData.history || []).forEach(h => { prevMap[h.completionId] = h.status; });
  (newData.history || []).forEach(h => {
    const old = prevMap[h.completionId];
    if (old === "pending" && h.status === "approved") toast(`🎉 Chore approved: ${h.taskTitle} (+${h.starValue}⭐)`);
    else if (old === "pending" && h.status === "rejected") toast(`Chore not approved this time: ${h.taskTitle}`);
  });
}

function diffPerkNotifications(prevData, newData) {
  if (!prevData) return;
  const prevMap = {};
  (prevData.history || []).forEach(h => { prevMap[h.redemptionId] = h.status; });
  (newData.history || []).forEach(h => {
    const old = prevMap[h.redemptionId];
    if (old === "pending" && h.status === "fulfilled") toast(`🎁 Reward ready: ${h.perkTitle}!`);
    else if (old === "pending" && h.status === "rejected") toast(`Reward request declined: ${h.perkTitle} (stars refunded)`);
  });
}

async function loadChores() {
  const p = state.profile;
  if (!p.sessionToken) { state.choresData = { tasks: [], history: [], error: "Log in once while online to unlock chores." }; render(); return; }
  const res = await SavvioCloud.listTasks(p.id, p.sessionToken);
  if (res && res.ok) {
    diffChoreNotifications(state.choresData, res);
    state.choresData = res;
    p.stars = res.stars || 0;
    SavvioStorage.saveProfile(p);
  } else {
    state.choresData = { tasks: [], history: [], error: (res && res.error) || "Couldn't load chores right now." };
  }
  render();
}

async function markTaskDone(taskId) {
  const p = state.profile;
  const res = await SavvioCloud.completeTask(p.id, p.sessionToken, taskId);
  if (res && res.ok) { toast("Submitted! Waiting for a parent to approve. 🌟"); state.choresData = null; go("chores"); }
  else toast((res && res.error) || "Couldn't submit that chore");
}

async function loadPerks() {
  const p = state.profile;
  if (!p.sessionToken) { state.perksData = { perks: [], history: [], error: "Log in once while online to unlock rewards." }; render(); return; }
  const res = await SavvioCloud.listPerks(p.id, p.sessionToken);
  if (res && res.ok) {
    diffPerkNotifications(state.perksData, res);
    state.perksData = res;
    p.stars = res.stars || 0;
    SavvioStorage.saveProfile(p);
  } else {
    state.perksData = { perks: [], history: [], error: (res && res.error) || "Couldn't load rewards right now." };
  }
  render();
}

async function redeemPerkFlow(perkId) {
  const p = state.profile;
  const res = await SavvioCloud.redeemPerk(p.id, p.sessionToken, perkId);
  if (res && res.ok) {
    p.stars = res.stars || 0;
    SavvioStorage.saveProfile(p);
    toast("Requested! Waiting for a parent to hand it over. 🎁");
    state.perksData = null;
    go("perks");
  } else {
    toast((res && res.error) || "Couldn't redeem that reward");
  }
}

// ---------------------------------------------------------------
// Profile
// ---------------------------------------------------------------
function renderProfile() {
  const p = state.profile;
  return shell(`
    <div class="profile-hero">
      <div class="av-big">${p.avatar}</div>
      <h2>${escapeHtml(p.name)}</h2>
      <p style="color:var(--ink-faint);">${p.ageGroup === "kids" ? "Kid mode (8–12)" : "Teen mode (13–18)"}</p>
    </div>
    <div class="stat-row">
      <div class="stat-pill"><div class="val">${p.xp}</div><div class="lbl">XP</div></div>
      <div class="stat-pill"><div class="val">${p.lessonsCompleted.length}</div><div class="lbl">Lessons</div></div>
      <div class="stat-pill"><div class="val">${p.goals.filter(g=>g.status==='completed').length}</div><div class="lbl">Goals hit</div></div>
    </div>
    <div class="card">
      <label>Switch age mode</label>
      <div class="age-toggle">
        <button data-profile-age="kids" class="${p.ageGroup==='kids'?'selected':''}">🧒<br>8–12</button>
        <button data-profile-age="teens" class="${p.ageGroup==='teens'?'selected':''}">🧑<br>13–18</button>
      </div>
    </div>
    <button class="btn btn-outline btn-block" id="edit-profile-btn">✏️ Edit name &amp; avatar</button>
    <button class="btn btn-outline btn-block" id="change-pin-btn" style="margin-top:10px;">🔑 Change PIN</button>
    ${SavvioCloud.isConfigured() ? `
    <div class="card" style="margin-top:14px;">
      <label>Cloud sync</label>
      <p style="margin:0;font-size:.85rem;">Status: <span class="status-pill status-${p.cloudStatus||'offline'}">${p.cloudStatus||'offline'}</span></p>
      <p style="margin:8px 0 0;font-size:.78rem;color:var(--ink-faint);">Log in on another device with your name and PIN to pick up right where you left off.</p>
    </div>` : ""}
    <button class="btn btn-outline btn-block" id="switch-profile-btn" style="margin-top:14px;">Switch profile</button>
    <button class="btn btn-outline btn-block" id="logout-btn" style="margin-top:10px;color:var(--danger);">Lock &amp; sign out</button>
  `, "profile");
}

// ---------------------------------------------------------------
// Event binding (delegated, re-run after every render)
// ---------------------------------------------------------------
function bindScreenEvents() {
  document.querySelectorAll("[data-nav]").forEach(el => el.onclick = () => go(el.dataset.nav));

  const liSubmit = document.getElementById("li-submit");
  if (liSubmit) liSubmit.onclick = () => submitLoginEntry();
  const liPinField = document.getElementById("li-pin");
  if (liPinField) liPinField.onkeydown = (e) => { if (e.key === "Enter") submitLoginEntry(); };

  document.querySelectorAll("[data-select-profile]").forEach(el => el.onclick = () => {
    state.pinTargetId = el.dataset.selectProfile;
    state.pinBuffer = "";
    go("pin-login");
  });

  document.querySelectorAll("[data-age]").forEach(el => el.onclick = () => {
    state.onboard.ageGroup = el.dataset.age;
    render();
  });
  const ageNext = document.getElementById("ob-age-next");
  if (ageNext) ageNext.onclick = () => go("onboard-avatar");

  document.querySelectorAll("[data-avatar]").forEach(el => el.onclick = () => {
    state.onboard.avatar = el.dataset.avatar;
    render();
  });
  const avatarNext = document.getElementById("ob-avatar-next");
  if (avatarNext) avatarNext.onclick = () => finalizeNewProfile();

  // PIN pad (used by the existing-device quick-login screen)
  document.querySelectorAll("[data-pinkey]").forEach(el => el.onclick = () => handlePinKey(el.dataset.pinkey));

  // Goals
  const newGoalBtn = document.getElementById("new-goal-btn");
  if (newGoalBtn) newGoalBtn.onclick = () => goalFormModal(null);
  document.querySelectorAll("[data-goal-edit]").forEach(el => el.onclick = () => {
    const g = state.profile.goals.find(x => x.id === el.dataset.goalEdit);
    goalFormModal(g);
  });
  document.querySelectorAll("[data-goal-add]").forEach(el => el.onclick = () => {
    const g = state.profile.goals.find(x => x.id === el.dataset.goalAdd);
    addMoneyModal(g);
  });
  document.querySelectorAll("[data-goal-delete]").forEach(el => el.onclick = () => {
    if (!confirm("Delete this goal?")) return;
    state.profile.goals = state.profile.goals.filter(x => x.id !== el.dataset.goalDelete);
    saveActive();
    render();
  });

  // Budget Planner
  const planIncome = document.getElementById("plan-income");
  if (planIncome) planIncome.oninput = () => { state.plannerDraft.income = parseFloat(planIncome.value) || 0; updatePlannerDisplay(); };
  ["save","spend","give"].forEach(key => {
    const el = document.getElementById("plan-" + key);
    if (el) el.oninput = () => { state.plannerDraft[key] = parseInt(el.value, 10); updatePlannerDisplay(); };
  });
  document.querySelectorAll("[data-preset]").forEach(el => el.onclick = () => {
    const pr = PLANNER_PRESETS[el.dataset.preset];
    state.plannerDraft.save = pr.save; state.plannerDraft.spend = pr.spend; state.plannerDraft.give = pr.give;
    render();
  });
  const planSaveBtn = document.getElementById("plan-save-btn");
  if (planSaveBtn) planSaveBtn.onclick = () => {
    state.profile.budgetPlan = { ...state.plannerDraft };
    saveActive();
    toast("Plan saved 🌱");
  };

  // Budget
  const newTxnBtn = document.getElementById("new-txn-btn");
  if (newTxnBtn) newTxnBtn.onclick = () => txnFormModal();
  document.querySelectorAll("[data-range]").forEach(el => el.onclick = () => { state.budgetRange = el.dataset.range; render(); });
  document.querySelectorAll("[data-txntab]").forEach(el => el.onclick = () => { state.budgetTab = el.dataset.txntab; render(); });
  document.querySelectorAll("[data-txn-delete]").forEach(el => el.onclick = () => {
    state.profile.budget = state.profile.budget.filter(x => x.id !== el.dataset.txnDelete);
    saveActive();
    render();
  });

  // Lessons
  document.querySelectorAll("[data-lesson-open]").forEach(el => el.onclick = () => go("lesson-detail", { id: el.dataset.lessonOpen }));
  const lessonCompleteBtn = document.getElementById("lesson-complete-btn");
  if (lessonCompleteBtn) lessonCompleteBtn.onclick = () => {
    const p = state.profile;
    const id = state.params.id;
    if (!p.lessonsCompleted.includes(id)) {
      p.lessonsCompleted.push(id);
      saveActive();
      addXp(20, "Lesson complete");
      checkNewBadges();
      render();
    }
  };

  // Quiz
  document.querySelectorAll("[data-quizfilter]").forEach(el => el.onclick = () => { state.quizFilter = el.dataset.quizfilter; render(); });
  const startQuizBtn = document.getElementById("start-quiz-btn");
  if (startQuizBtn) startQuizBtn.onclick = () => startQuiz();
  document.querySelectorAll("[data-quiz-opt]").forEach(el => el.onclick = () => answerQuiz(parseInt(el.dataset.quizOpt)));
  const quizNextBtn = document.getElementById("quiz-next-btn");
  if (quizNextBtn) quizNextBtn.onclick = () => {
    const s = state.quizSession;
    s.idx += 1;
    if (s.idx >= s.questions.length) go("quiz-result"); else render();
  };
  const quizAgainBtn = document.getElementById("quiz-again-btn");
  if (quizAgainBtn) quizAgainBtn.onclick = () => startQuiz();

  // Locked screen
  const lockedRetryBtn = document.getElementById("locked-retry-btn");
  if (lockedRetryBtn) lockedRetryBtn.onclick = async () => {
    const p = state.profile;
    if (p && SavvioCloud.isConfigured()) {
      const res = await SavvioCloud.checkStatus(p.id);
      if (res && res.ok && res.status !== "locked") {
        p.locked = false; p.cloudStatus = res.status; saveActive();
        go("dashboard");
        return;
      }
    }
    toast("Still locked — check with a parent or guardian.");
  };
  const lockedSwitchBtn = document.getElementById("locked-switch-btn");
  if (lockedSwitchBtn) lockedSwitchBtn.onclick = () => { state.profile = null; go("splash"); };
  const rejectedSwitchBtn = document.getElementById("rejected-switch-btn");
  if (rejectedSwitchBtn) rejectedSwitchBtn.onclick = () => { state.profile = null; go("splash"); };

  // Rewards / profile
  const openChoresBtn = document.getElementById("open-chores-btn");
  if (openChoresBtn) openChoresBtn.onclick = () => { state.choresData = null; go("chores"); };
  const openPerksBtn = document.getElementById("open-perks-btn");
  if (openPerksBtn) openPerksBtn.onclick = () => { state.perksData = null; go("perks"); };
  document.querySelectorAll("[data-task-done]").forEach(el => el.onclick = () => markTaskDone(el.dataset.taskDone));
  document.querySelectorAll("[data-perk-redeem]").forEach(el => el.onclick = () => redeemPerkFlow(el.dataset.perkRedeem));
  const editProfileBtn = document.getElementById("edit-profile-btn");
  if (editProfileBtn) editProfileBtn.onclick = () => editProfileModal();
  const changePinBtn = document.getElementById("change-pin-btn");
  if (changePinBtn) changePinBtn.onclick = () => changePinModal();
  document.querySelectorAll("[data-profile-age]").forEach(el => el.onclick = () => {
    state.profile.ageGroup = el.dataset.profileAge;
    saveActive();
    if (SavvioCloud.isConfigured() && state.profile.sessionToken) {
      SavvioCloud.updateProfile(state.profile.id, state.profile.sessionToken, state.profile.name, state.profile.ageGroup, state.profile.avatar);
    }
    render();
  });
  const switchBtn = document.getElementById("switch-profile-btn");
  if (switchBtn) switchBtn.onclick = () => { state.profile = null; state.plannerDraft = null; state.loginEntry = { name:"", pin:"" }; state.choresData = null; state.perksData = null; go("splash"); };
  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) logoutBtn.onclick = () => { state.profile = null; state.plannerDraft = null; state.loginEntry = { name:"", pin:"" }; state.choresData = null; state.perksData = null; go("splash"); };
}

async function unlockProfile(profileId, pin) {
  const p = SavvioStorage.getProfile(profileId);
  if (!p) { toast("Profile not found"); state.pinBuffer = ""; render(); return; }
  p.badgesEarned = p.badgesEarned || [];
  p.quizAttempts = p.quizAttempts || [];

  if (SavvioCloud.isConfigured()) {
    const res = await SavvioCloud.loginProfile(profileId, pin);
    if (res && res.ok) {
      // Cloud confirms this PIN — also keep the local copy in sync (covers
      // the case where an admin reset the PIN from the Admin portal).
      const previousStatus = p.cloudStatus;
      p.pin = pin;
      p.sessionToken = res.sessionToken;
      p.cloudStatus = res.profile.status;
      p.stars = res.profile.stars || 0;
      p.locked = false;
      state.profile = p;
      SavvioStorage.saveProfile(p);
      SavvioStorage.setActiveProfileId(p.id);
      state.pinBuffer = "";
      touchDailyStreak();
      if (p.cloudStatus === "rejected") { go("rejected"); return; }
      if (previousStatus === "pending" && p.cloudStatus === "active") toast("🎉 Your profile has been approved!");
      go("dashboard");
      return;
    }
    if (res && res.locked) {
      state.profile = p;
      lockProfileLocally();
      state.pinBuffer = "";
      return;
    }
    if (res && !res.offline) {
      // Cloud is reachable and explicitly said the PIN is wrong — trust it.
      toast(res.error || "Incorrect PIN, try again");
      state.pinBuffer = "";
      render();
      return;
    }
    // res.offline: cloud unreachable, fall through to local-only check below.
  }

  if (p.pin === pin) {
    state.profile = p;
    SavvioStorage.setActiveProfileId(p.id);
    state.pinBuffer = "";
    touchDailyStreak();
    go("dashboard");
  } else {
    toast("Incorrect PIN, try again");
    state.pinBuffer = "";
    render();
  }
}

function handlePinKey(key) {
  if (key === "⌫") { state.pinBuffer = state.pinBuffer.slice(0,-1); render(); return; }
  if (key === "OK") {
    if (state.pinBuffer.length !== 4) { toast("Enter 4 digits"); return; }
    if (state.screen === "pin-login") {
      unlockProfile(state.pinTargetId, state.pinBuffer);
    }
    return;
  }
  if (state.pinBuffer.length < 4 && /^[0-9]$/.test(key)) {
    state.pinBuffer += key;
    render();
    if (state.pinBuffer.length === 4) setTimeout(() => handlePinKey("OK"), 150);
  }
}

function startQuiz() {
  const pool = state.quizFilter === "all" ? QUIZ : QUIZ.filter(q => q.category === state.quizFilter);
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  const questions = shuffled.slice(0, Math.min(5, shuffled.length));
  state.quizSession = { questions, idx: 0, correctCount: 0, answers: [] };
  go("quiz-play");
}

function answerQuiz(optionIndex) {
  const s = state.quizSession;
  const q = s.questions[s.idx];
  s.answers[s.idx] = optionIndex;
  const correct = optionIndex === q.answer;
  if (correct) {
    s.correctCount += 1;
    const xpMap = { easy: 10, medium: 15, hard: 20 };
    addXp(xpMap[q.difficulty] || 10, "Correct answer");
  }
  render();
  if (s.idx + 1 >= s.questions.length) {
    // finalize attempt once last question is answered
    const p = state.profile;
    p.quizAttempts.push({ quizId: uid("attempt"), score: s.correctCount, total: s.questions.length, date: todayStr() });
    saveActive();
    checkNewBadges();
  }
}

// ---------------------------------------------------------------
// Init
// ---------------------------------------------------------------
function init() {
  const activeId = SavvioStorage.getActiveProfileId();
  if (activeId) {
    const p = SavvioStorage.getProfile(activeId);
    if (p) {
      p.badgesEarned = p.badgesEarned || [];
      p.quizAttempts = p.quizAttempts || [];
      state.profile = p;
      touchDailyStreak();
      if (p.locked) { go("locked"); }
      else { go("dashboard"); }
      // Best-effort background check: catches a lock/unlock/approval that
      // happened on the Admin portal since this device was last online.
      if (SavvioCloud.isConfigured()) {
        const previousStatus = p.cloudStatus;
        SavvioCloud.checkStatus(p.id).then(res => {
          if (res && res.ok && state.profile && state.profile.id === p.id) {
            state.profile.stars = res.stars || 0;
            if (res.status === "locked") { lockProfileLocally(); return; }
            if (res.status === "rejected") {
              state.profile.cloudStatus = "rejected";
              SavvioStorage.saveProfile(state.profile);
              go("rejected");
              return;
            }
            state.profile.cloudStatus = res.status;
            state.profile.locked = false;
            SavvioStorage.saveProfile(state.profile);
            if (state.screen === "locked") go("dashboard");
            if (previousStatus === "pending" && res.status === "active") toast("🎉 Your profile has been approved!");
          }
        });
      }
      return;
    }
  }
  go("splash");
}

document.addEventListener("DOMContentLoaded", init);
