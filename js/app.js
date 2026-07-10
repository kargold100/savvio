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
    { id:"odd_jobs", label:"Odd Jobs", icon:"🧹" },
    { id:"selling", label:"Selling Things", icon:"🏷️" },
    { id:"other_income", label:"Other", icon:"➕" },
  ],
  expense: [
    { id:"snacks", label:"Snacks", icon:"🍿" },
    { id:"games", label:"Games", icon:"🎮" },
    { id:"toys", label:"Toys", icon:"🧸" },
    { id:"school", label:"School", icon:"🎒" },
    { id:"entertainment", label:"Entertainment", icon:"🎬" },
    { id:"transport", label:"Transport", icon:"🚌" },
    { id:"clothes", label:"Clothes", icon:"👕" },
    { id:"subscriptions", label:"Subscriptions", icon:"📱" },
    { id:"giving", label:"Giving", icon:"💗" },
    { id:"savings", label:"Savings", icon:"🐷" },
    { id:"other_expense", label:"Other", icon:"➕" },
  ],
};

const BADGES = [
  { id:"first_goal", name:"Goal Setter", icon:"🎯", check:p => p.goals.length >= 1 },
  { id:"goal_getter", name:"Goal Getter", icon:"🏆", check:p => p.goals.filter(g=>g.status==="completed").length >= 3 },
  { id:"big_saver", name:"Big Saver", icon:"💎", check:p => p.goals.reduce((s,g)=>s+g.current,0) >= 100 },
  { id:"super_saver", name:"Super Saver", icon:"👑", check:p => p.goals.reduce((s,g)=>s+g.current,0) >= 500 },
  { id:"quiz_starter", name:"Quiz Starter", icon:"❓", check:p => p.quizAttempts.length >= 1 },
  { id:"quiz_whiz", name:"Quiz Whiz", icon:"🧠", check:p => p.quizAttempts.length >= 10 },
  { id:"perfect_score", name:"Perfect Score", icon:"⭐", check:p => p.quizAttempts.some(a=>a.total>0 && a.score===a.total) },
  { id:"budget_boss", name:"Budget Boss", icon:"📒", check:p => p.budget.length >= 30 },
  { id:"lesson_learner", name:"Lesson Learner", icon:"📘", check:p => p.lessonsCompleted.length >= 1 },
  { id:"know_it_all", name:"Finance Genius", icon:"🎓", check:p => p.lessonsCompleted.length >= LESSONS.length },
  { id:"streak_7", name:"7-Day Streak", icon:"🔥", check:p => p.streak >= 7 },
  { id:"streak_30", name:"30-Day Streak", icon:"🌟", check:p => p.streak >= 30 },
  { id:"level_5", name:"Sapling Status", icon:"🌿", check:p => getLevelInfo(p.xp).level >= 5 },
  { id:"first_challenge", name:"Challenge Accepted", icon:"🚀", check:p => Object.values(p.challengeProgress||{}).some(c=>c.completed) },
  { id:"challenge_master", name:"Challenge Master", icon:"🏅", check:p => Object.values(p.challengeProgress||{}).filter(c=>c.completed).length >= 5 },
  { id:"needswants_pro", name:"Needs vs Wants Pro", icon:"⚖️", check:p => (p.gameStats && p.gameStats.needswants ? p.gameStats.needswants.correct : 0) >= 20 },
  { id:"scam_spotter", name:"Scam Spotter", icon:"🛡️", check:p => (p.gameStats && p.gameStats.scams ? p.gameStats.scams.correct : 0) >= 15 },
  { id:"flexi_starter", name:"Piggy Bank Starter", icon:"🐷", check:p => (p.flexiSaves||[]).length >= 1 },
  { id:"flexi_pro", name:"Piggy Bank Pro", icon:"🏦", check:p => (p.flexiSaves||[]).length >= 15 },
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
  manageTab: "kids",
  manageKids: null,
  manageTasks: null,
  managePerks: null,
  playTab: "challenges",
  gameSession: null,
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
  const symbol = (state.profile && state.profile.prefs && state.profile.prefs.currency) || "$";
  return symbol + v.toFixed(v % 1 === 0 ? 0 : 2);
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
}

function isActiveVal(v) { return v === true || v === "TRUE" || v === "true"; }

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
function applyPrefs(p) {
  const prefs = (p && p.prefs) || {};
  document.body.classList.toggle("dark", !!prefs.darkMode);
  document.body.classList.toggle("large-text", !!prefs.largeText);
}

function ensureProfileDefaults(p) {
  if (!p) return p;
  if (!p.badgesEarned) p.badgesEarned = [];
  if (!p.quizAttempts) p.quizAttempts = [];
  if (!p.challengeProgress) p.challengeProgress = {};
  if (!p.gameStats) p.gameStats = { needswants: { played: 0, correct: 0 }, scams: { played: 0, correct: 0 } };
  if (!p.wishlist) p.wishlist = [];
  if (!p.subscriptions) p.subscriptions = [];
  if (!p.habitLog) p.habitLog = {};
  if (!p.flexiSaves) p.flexiSaves = [];
  if (typeof p.email !== "string") p.email = "";
  if (!p.prefs) p.prefs = { darkMode: false, largeText: false, currency: "$" };
  if (!p.prefs.currency) p.prefs.currency = "$";
  if (!p.role) p.role = "kid";
  if (typeof p.stars !== "number") p.stars = 0;
  return p;
}

function newProfile({ name, ageGroup, avatar, pin, role, email }) {
  return {
    id: uid("kid"),
    name, ageGroup, avatar, pin, role: role || "kid", email: email || "",
    xp: 0, streak: 0, stars: 0, lastActiveDate: null,
    createdDate: todayStr(),
    goals: [], budget: [], lessonsCompleted: [], quizAttempts: [],
    budgetPlan: null, // { income, save, spend, give }
    challengeProgress: {}, // { challengeId: { count, completed, lastDate } }
    gameStats: { needswants: { played: 0, correct: 0 }, scams: { played: 0, correct: 0 } },
    wishlist: [], // { id, title, price, priority, addedDate }
    subscriptions: [], // { id, name, cost, cycle, renewalDay }
    habitLog: {}, // { "YYYY-MM-DD": { habitId: true } }
    flexiSaves: [], // { id, amount, date } — the "digital piggy bank", no target
    prefs: { darkMode: false, largeText: false, currency: "$" },
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
      challengeProgress: p.challengeProgress || {}, gameStats: p.gameStats || {},
      wishlist: p.wishlist || [], subscriptions: p.subscriptions || [], habitLog: p.habitLog || {},
      flexiSaves: p.flexiSaves || [],
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
  const authScreens = ["splash","login-entry","onboard-role","onboard-email","onboard-age","onboard-avatar","pin-login"];
  if (state.screen !== "locked" && state.screen !== "rejected" && !authScreens.includes(state.screen) && !state.profile) { state.screen = "splash"; }

  let html = "";
  switch (state.screen) {
    case "splash": html = renderSplash(); break;
    case "login-entry": html = renderLoginEntry(); break;
    case "onboard-age": html = renderOnboardAge(); break;
    case "onboard-role": html = renderOnboardRole(); break;
    case "onboard-email": html = renderOnboardEmail(); break;
    case "onboard-avatar": html = renderOnboardAvatar(); break;
    case "pin-login": html = renderPinLogin(); break;
    case "dashboard": html = renderDashboard(); break;
    case "goals": html = renderGoals(); break;
    case "flexisave": html = renderFlexiSave(); break;
    case "wishlist": html = renderWishlist(); break;
    case "budget": html = renderBudget(); break;
    case "planner": html = renderPlanner(); break;
    case "calculators": html = renderCalculators(); break;
    case "subscriptions": html = renderSubscriptions(); break;
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
    case "manage": html = renderManage(); break;
    case "play": html = renderPlay(); break;
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
  const isParent = state.profile && state.profile.role === "parent";
  const items = [
    { id:"dashboard", icon:"🏠", label:"Home" },
    { id:"goals", icon:"🎯", label:"Goals" },
    { id:"budget", icon:"📒", label:"Budget" },
    { id:"lessons", icon:"📘", label:"Learn" },
    { id:"quiz", icon:"❓", label:"Quiz" },
    isParent ? { id:"manage", icon:"👪", label:"Manage" } : { id:"rewards", icon:"🏅", label:"Rewards" },
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
              <div class="meta"><div class="n">${escapeHtml(p.name)}</div><div class="s">${p.role === "parent" ? "👪 Parent/Guardian" : `Level ${getLevelInfo(p.xp).level} · ${p.ageGroup === "kids" ? "Kid" : "Teen"}`}</div></div>
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
      ${SavvioCloud.isConfigured() ? `<button class="btn btn-outline btn-block btn-sm" id="li-forgot-btn" style="max-width:320px;margin-top:8px;">Forgot your PIN?</button>` : ""}
      <button class="btn btn-outline btn-block btn-sm" data-nav="splash" style="max-width:320px;margin-top:8px;">← Back</button>
      <p id="li-error" style="color:var(--danger);font-size:.82rem;min-height:1.2em;"></p>
    </div>
  `;
}

function renderOnboardRole() {
  return `
    <div class="splash">
      <div style="font-size:3rem;">👪</div>
      <h1>One more thing, ${escapeHtml(state.onboard.name)}</h1>
      <p>Are you setting this up as a parent/guardian, or for yourself as a kid or teen?</p>
      <div class="age-toggle" style="width:100%;max-width:320px;">
        <button data-role="parent" class="${state.onboard.role==='parent'?'selected':''}">👤<br>Parent /<br>Guardian</button>
        <button data-role="kid" class="${state.onboard.role==='kid'?'selected':''}">🧒<br>Kid or<br>Teen</button>
      </div>
      <button class="btn btn-primary btn-block" id="ob-role-next" style="max-width:320px;margin-top:16px;" ${state.onboard.role?"":"disabled"}>Continue</button>
    </div>
  `;
}

function renderOnboardEmail() {
  return `
    <div class="splash">
      <div style="font-size:3rem;">✉️</div>
      <h1>Add your email? (optional)</h1>
      <p>Lets you get a code to reset your PIN if you forget it, and a heads-up when a kid signs up or needs approval. You can skip this.</p>
      <div style="width:100%;max-width:320px;text-align:left;">
        <label for="ob-email">Email</label>
        <input type="email" id="ob-email" placeholder="you@example.com" value="${escapeHtml(state.onboard.email||"")}" />
      </div>
      <button class="btn btn-primary btn-block" id="ob-email-next" style="max-width:320px;margin-top:16px;">Continue</button>
      <button class="btn btn-outline btn-block btn-sm" id="ob-email-skip" style="max-width:320px;margin-top:8px;">Skip for now</button>
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
  state.onboard = { name, ageGroup: "", avatar: "", pin, role: "", email: "" };
  go("onboard-role");
}

async function completeCloudLogin(res, pin) {
  const userId = res.profile.userId;
  const dataRes = await SavvioCloud.restoreProfile(userId, res.sessionToken);
  let saved = {};
  if (dataRes && dataRes.ok) { try { saved = JSON.parse(dataRes.dataJson || "{}"); } catch (e) { saved = {}; } }
  const existing = SavvioStorage.getProfile(userId);
  const previousStatus = existing ? existing.cloudStatus : null;
  const profile = {
    id: userId, name: res.profile.name, ageGroup: res.profile.ageGroup, role: res.profile.role || "kid", avatar: res.profile.avatar, pin,
    email: res.profile.email || "",
    xp: res.profile.xp || 0, streak: res.profile.streak || 0, stars: res.profile.stars || 0, lastActiveDate: res.profile.lastActiveDate || null,
    createdDate: res.profile.createdDate || todayStr(),
    goals: saved.goals || (existing && existing.goals) || [],
    budget: saved.budget || (existing && existing.budget) || [],
    lessonsCompleted: saved.lessonsCompleted || (existing && existing.lessonsCompleted) || [],
    quizAttempts: saved.quizAttempts || (existing && existing.quizAttempts) || [],
    badgesEarned: saved.badgesEarned || (existing && existing.badgesEarned) || [],
    budgetPlan: saved.budgetPlan || (existing && existing.budgetPlan) || null,
    challengeProgress: saved.challengeProgress || (existing && existing.challengeProgress) || {},
    gameStats: saved.gameStats || (existing && existing.gameStats) || { needswants: { played: 0, correct: 0 }, scams: { played: 0, correct: 0 } },
    wishlist: saved.wishlist || (existing && existing.wishlist) || [],
    flexiSaves: saved.flexiSaves || (existing && existing.flexiSaves) || [],
    subscriptions: saved.subscriptions || (existing && existing.subscriptions) || [],
    habitLog: saved.habitLog || (existing && existing.habitLog) || {},
    prefs: (existing && existing.prefs) || { darkMode: false, largeText: false, currency: "$" },
    cloudStatus: res.profile.status, sessionToken: res.sessionToken, sessionExpiry: null, locked: false,
  };
  SavvioStorage.saveProfile(profile);
  SavvioStorage.setActiveProfileId(profile.id);
  state.profile = profile;
  applyPrefs(profile);
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
  applyPrefs(profile);
  state.onboard = { name: "", ageGroup: "", avatar: "", pin: "", role: "", email: "" };
  state.loginEntry = { name: "", pin: "" };
  touchDailyStreak();
  toast(profile.role === "parent" ? `Welcome, ${profile.name}! 👪` : `Welcome, ${profile.name}! 🌱`);
  go("dashboard");
  if (SavvioCloud.isConfigured()) {
    const res = await SavvioCloud.registerProfile(profile.id, profile.name, profile.ageGroup, profile.avatar, profile.pin, profile.role, profile.email);
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
    ${p.role === "parent" ? `
    <label for="edit-email" style="margin-top:14px;">Email <span style="font-weight:400;color:var(--ink-faint);">(for PIN recovery and sign-up alerts)</span></label>
    <input type="email" id="edit-email" value="${escapeHtml(p.email||"")}" placeholder="you@example.com" />` : ""}
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
    const emailField = document.getElementById("edit-email");
    const email = emailField ? emailField.value.trim() : p.email;
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { toast("That doesn't look like a valid email"); return; }
    p.name = name;
    p.avatar = chosenAvatar;
    p.email = email || "";
    saveActive();
    if (SavvioCloud.isConfigured() && p.sessionToken) {
      const res = await SavvioCloud.updateProfile(p.id, p.sessionToken, name, p.ageGroup, chosenAvatar, p.email);
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

function forgotPinModal() {
  openModal(`
    <div class="modal-head"><h3>Forgot your PIN?</h3><button class="close-x" id="modal-close">✕</button></div>
    <p style="font-size:.85rem;color:var(--ink-soft);">Enter your name. If there's an email on file for that profile, we'll send a reset code — this only works for profiles with an email saved (usually parent/guardian profiles).</p>
    <label for="fp-name">Name</label>
    <input type="text" id="fp-name" maxlength="20" />
    <button class="btn btn-primary btn-block" id="fp-send-btn" style="margin-top:12px;">Send reset code</button>
    <div id="fp-step2" style="display:none;margin-top:14px;">
      <label for="fp-code">6-digit code</label>
      <input type="text" id="fp-code" inputmode="numeric" maxlength="6" />
      <label for="fp-newpin">New 4-digit PIN</label>
      <input type="text" id="fp-newpin" inputmode="numeric" maxlength="4" />
      <button class="btn btn-primary btn-block" id="fp-confirm-btn" style="margin-top:10px;">Reset PIN</button>
    </div>
    <p id="fp-msg" style="font-size:.82rem;color:var(--ink-soft);margin-top:10px;"></p>
  `);
  document.getElementById("modal-close").onclick = closeModal;
  document.getElementById("fp-send-btn").onclick = async () => {
    const name = document.getElementById("fp-name").value.trim();
    const msgEl = document.getElementById("fp-msg");
    if (!name) { toast("Enter a name"); return; }
    const res = await SavvioCloud.requestPinReset(name);
    if (res && res.ok) {
      document.getElementById("fp-step2").style.display = "block";
      msgEl.style.color = "var(--ink-soft)";
      msgEl.textContent = "If that profile has an email on file, a code is on its way — check your inbox.";
    } else {
      msgEl.style.color = "var(--danger)";
      msgEl.textContent = (res && res.error) || "Something went wrong — try again.";
    }
  };
  document.getElementById("fp-confirm-btn").onclick = async () => {
    const name = document.getElementById("fp-name").value.trim();
    const code = document.getElementById("fp-code").value.trim();
    const newPin = document.getElementById("fp-newpin").value.trim();
    const msgEl = document.getElementById("fp-msg");
    if (!/^\d{4}$/.test(newPin)) { toast("New PIN must be 4 digits"); return; }
    const res = await SavvioCloud.confirmPinReset(name, code, newPin);
    if (res && res.ok) {
      toast("PIN reset — log in with your new PIN 🌱");
      closeModal();
    } else {
      msgEl.style.color = "var(--danger)";
      msgEl.textContent = (res && res.error) || "Couldn't reset the PIN.";
    }
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
const HABITS = [
  { id: "no-junk", label: "Didn't buy junk food", icon: "🍏" },
  { id: "saved", label: "Saved some money", icon: "💰" },
  { id: "packed-lunch", label: "Packed lunch", icon: "🥪" },
  { id: "no-impulse", label: "No impulse purchase", icon: "🛑" },
  { id: "read-lesson", label: "Read a lesson or tip", icon: "📘" },
  { id: "chore", label: "Did a chore", icon: "🌟" },
];

// Rule-based "coach" message computed from the person's own real data —
// no paid AI API involved, just simple comparisons. Falls back to null
// (caller shows the static daily tip instead) when there isn't enough
// data yet to say anything meaningful.
function moneyCoachMessage(p) {
  const now = new Date();
  const cutoffThis = new Date(now); cutoffThis.setDate(now.getDate() - 7);
  const cutoffLast = new Date(now); cutoffLast.setDate(now.getDate() - 14);
  const thisWeek = p.budget.filter(e => e.type === "expense" && new Date(e.date + "T00:00:00") >= cutoffThis);
  const lastWeek = p.budget.filter(e => e.type === "expense" && new Date(e.date + "T00:00:00") >= cutoffLast && new Date(e.date + "T00:00:00") < cutoffThis);

  const sumBy = (arr) => { const m = {}; arr.forEach(e => { m[e.category] = (m[e.category] || 0) + e.amount; }); return m; };
  const thisMap = sumBy(thisWeek), lastMap = sumBy(lastWeek);
  let biggestIncrease = null, incAmt = 0;
  Object.keys(thisMap).forEach(cat => {
    const diff = thisMap[cat] - (lastMap[cat] || 0);
    if (diff > incAmt) { incAmt = diff; biggestIncrease = cat; }
  });
  if (biggestIncrease && incAmt >= 3 && lastWeek.length > 0) {
    return { text: `You spent more on ${catInfo("expense", biggestIncrease).label} this week than last (+${money(incAmt)}). Worth a look?` };
  }

  if (p.streak >= 3) {
    return { text: `You've kept your streak going for ${p.streak} days — that consistency is exactly how good habits form.` };
  }

  const activeGoal = p.goals.find(g => g.status !== "completed");
  if (activeGoal) {
    const remaining = activeGoal.target - activeGoal.current;
    if (remaining > 0) {
      return { text: `You're ${money(remaining)} away from "${activeGoal.title}". A few more small deposits and you're there.` };
    }
  }
  return null;
}

function toggleHabit(habitId) {
  const p = state.profile;
  const today = todayStr();
  if (!p.habitLog[today]) p.habitLog[today] = {};
  const wasAllDone = HABITS.every(h => p.habitLog[today][h.id]);
  p.habitLog[today][habitId] = !p.habitLog[today][habitId];
  const nowAllDone = HABITS.every(h => p.habitLog[today][h.id]);
  saveActive();
  if (!wasAllDone && nowAllDone) { addXp(15, "Perfect habit day"); checkNewBadges(); }
  render();
}

function renderDashboard() {
  const p = state.profile;
  const lvl = getLevelInfo(p.xp);
  const pct = Math.min(100, Math.round((lvl.xpIntoLevel / lvl.xpForNext) * 100));
  const tip = dailyTipFor(p);
  const coach = moneyCoachMessage(p);
  const activeGoals = p.goals.filter(g => g.status !== "completed").slice(0,2);
  const now = new Date();
  const hr = now.getHours();
  const greet = hr < 12 ? "Good morning" : hr < 17 ? "Good afternoon" : "Good evening";
  const today = todayStr();
  const todaysHabits = p.habitLog[today] || {};
  const habitDoneCount = HABITS.filter(h => todaysHabits[h.id]).length;

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

    <div class="card ${coach ? 'coach-card' : 'tip-card'}">
      <div class="eyebrow">${coach ? "Money Coach" : "Today's tip"}</div>
      <p style="margin:6px 0 0;">${coach ? escapeHtml(coach.text) : escapeHtml(tip.text)}</p>
    </div>

    <div class="section-head" style="margin-top:14px;"><h2>Today's habits</h2><span style="font-size:.78rem;color:var(--ink-faint);">${habitDoneCount}/${HABITS.length}</span></div>
    <div class="card">
      <div class="habit-list">
        ${HABITS.map(h => `<div class="habit-row ${todaysHabits[h.id]?'done':''}" data-habit-toggle="${h.id}"><div class="check-circle">${todaysHabits[h.id]?'✓':''}</div><div class="label">${h.icon} ${h.label}</div></div>`).join("")}
      </div>
    </div>

    <div class="quick-actions">
      <button data-nav="goals"><span class="icon">🎯</span>Goals</button>
      <button data-nav="budget"><span class="icon">📒</span>Budget</button>
      <button data-nav="lessons"><span class="icon">📘</span>Learn</button>
      <button data-nav="quiz"><span class="icon">❓</span>Quiz</button>
      <button data-nav="play"><span class="icon">🎮</span>Play</button>
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

function trafficLight(color) {
  return `<span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:${color};margin-right:6px;vertical-align:middle;"></span>`;
}

function budgetHealthHtml(income, expense) {
  if (income === 0 && expense === 0) {
    return `<div class="health-msg warn">${trafficLight('#F3A93A')}Log some income or spending to see how you're doing.</div>`;
  }
  const remaining = income - expense;
  if (remaining >= 0 && expense <= income * 0.7) {
    return `<div class="health-msg good">${trafficLight('#2FA84F')}You saved more than you spent this week. Great job! 🌟</div>`;
  }
  if (remaining >= 0) {
    return `<div class="health-msg warn">${trafficLight('#F3A93A')}You're breaking even. A little more saved would help. 🌱</div>`;
  }
  return `<div class="health-msg bad">${trafficLight('#E5484D')}You spent more than you earned this week. Let's rebalance. 💡</div>`;
}

// ---------------------------------------------------------------
// Goals
// ---------------------------------------------------------------
function requiredMonthlySavings(g) {
  if (!g.targetDate || g.status === "completed") return null;
  const remaining = g.target - g.current;
  if (remaining <= 0) return null;
  const months = Math.max(1, (new Date(g.targetDate + "T00:00:00") - new Date()) / (1000*60*60*24*30.44));
  if (months < 0.2) return null; // basically due already, not a useful monthly figure
  return remaining / months;
}

function goalCardHtml(g) {
  const pct = g.target > 0 ? Math.min(100, Math.round((g.current / g.target) * 100)) : 0;
  const done = g.status === "completed";
  const monthlyNeeded = requiredMonthlySavings(g);
  return `
    <div class="card goal-card ${done?'done':''}" data-goal-id="${g.id}">
      <div class="top-row">
        <div style="display:flex;gap:10px;align-items:flex-start;">
          <div style="font-size:1.6rem;">${g.icon || "🎯"}</div>
          <div>
            <h3 style="margin-bottom:2px;">${escapeHtml(g.title)}</h3>
            ${g.targetDate ? `<div style="font-size:.72rem;color:var(--ink-faint);">Target: ${fmtDate(g.targetDate)}</div>` : ""}
          </div>
        </div>
        ${done ? `<span class="badge-pill">Done! 🎉</span>` : ""}
      </div>
      <div class="amount">${money(g.current)} <span style="color:var(--ink-faint);font-weight:400;font-size:.85rem;">of ${money(g.target)}</span></div>
      <div class="progress-track" style="margin-top:8px;"><div class="progress-fill" style="width:${pct}%;"></div></div>
      <div class="pct">${pct}% complete${monthlyNeeded ? ` · save ~${money(monthlyNeeded)}/month to hit your date` : ""}</div>
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

function renderFlexiSave() {
  const p = state.profile;
  const saves = p.flexiSaves || [];
  const total = saves.reduce((s,x) => s + x.amount, 0);
  const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 7);
  const weekSaves = saves.filter(s => new Date(s.date + "T00:00:00") >= cutoff);
  const fillPct = Math.min(100, Math.round((total / 2000) * 100));
  return shell(`
    <div class="section-head" style="margin-top:0;"><h2>Flexi Save</h2></div>
    <p style="color:var(--ink-soft);font-size:.85rem;margin-top:0;">Your digital piggy bank — no fixed target, just save a little, often. Aim for 2–3 saves a week.</p>
    <div class="card piggy-card">
      <div class="piggy-visual">🐷</div>
      <div class="piggy-total">${money(total)}</div>
      <div class="progress-track"><div class="progress-fill gold" style="width:${fillPct}%;"></div></div>
      <div class="pct">${weekSaves.length} save${weekSaves.length===1?"":"s"} this week · aim for 2–3</div>
    </div>
    <div class="card">
      <label>Quick save</label>
      <div class="quick-actions">
        <button data-flexi-quick="100">${money(100)}</button>
        <button data-flexi-quick="300">${money(300)}</button>
        <button data-flexi-quick="500">${money(500)}</button>
        <button id="flexi-custom-btn">Custom</button>
      </div>
    </div>
    <div class="card">
      <label>Recent saves</label>
      ${saves.length ? [...saves].reverse().slice(0,10).map(s => `<div class="card-flat" style="display:flex;justify-content:space-between;"><span>${fmtDate(s.date)}</span><strong>${money(s.amount)}</strong></div>`).join("") : `<p style="color:var(--ink-faint);margin:0;">No saves yet — tap a quick-save above to start.</p>`}
    </div>
    ${total > 0 ? `<button class="btn btn-coral btn-block" id="flexi-break-btn">🔨 Break the piggy bank</button>` : ""}
    <button class="btn btn-outline btn-block" data-nav="goals" style="margin-top:10px;">← Back to Goals</button>
  `, "goals");
}

function flexiSave(amount) {
  const p = state.profile;
  if (!p.flexiSaves) p.flexiSaves = [];
  p.flexiSaves.push({ id: uid("flexi"), amount, date: todayStr() });
  addXp(8, "Flexi save");
  saveActive();
  checkNewBadges();
  toast(`🐷 +${money(amount)} saved!`);
  render();
}

function flexiCustomModal() {
  openModal(`
    <div class="modal-head"><h3>Custom save</h3><button class="close-x" id="modal-close">✕</button></div>
    <label for="flexi-amt">Amount</label>
    <input type="number" id="flexi-amt" min="0.01" step="0.01" placeholder="250" />
    <button class="btn btn-primary btn-block" id="flexi-save-custom" style="margin-top:14px;">Save it</button>
  `);
  document.getElementById("modal-close").onclick = closeModal;
  document.getElementById("flexi-save-custom").onclick = () => {
    const amt = parseFloat(document.getElementById("flexi-amt").value);
    if (!amt || amt <= 0) { toast("Enter an amount"); return; }
    closeModal();
    flexiSave(amt);
  };
}

function breakFlexiBank() {
  if (!confirm("Break the piggy bank and cash out? This clears your Flexi Save total back to zero.")) return;
  const p = state.profile;
  const total = (p.flexiSaves || []).reduce((s,x) => s + x.amount, 0);
  addXp(Math.min(50, Math.round(total / 10)), "Piggy bank cashed out");
  p.flexiSaves = [];
  saveActive();
  checkNewBadges();
  toast(`🎉 Cashed out ${money(total)}! Spend it wisely or start saving again.`);
  render();
}

function renderGoals() {
  const p = state.profile;
  const active = p.goals.filter(g => g.status !== "completed");
  const done = p.goals.filter(g => g.status === "completed");
  return shell(`
    <div class="section-head" style="margin-top:0;"><h2>Your goals</h2></div>
    <button class="btn btn-coral btn-block" id="new-goal-btn" style="margin-bottom:10px;">+ New savings goal</button>
    <button class="btn btn-outline btn-block" id="emergency-fund-btn" style="margin-bottom:10px;">🚨 Start an Emergency Fund</button>
    <div class="field-row" style="margin-bottom:14px;">
      <button class="btn btn-outline" data-nav="flexisave">🐷 Flexi Save</button>
      <button class="btn btn-outline" data-nav="wishlist">💭 Wishlist</button>
    </div>
    ${active.length ? active.map(goalCardHtml).join("") : `<div class="card empty-state"><span class="emoji">🌱</span>No active goals. What are you saving for?</div>`}
    ${done.length ? `<div class="section-head"><h2>Completed 🎉</h2></div>${done.map(goalCardHtml).join("")}` : ""}
  `, "goals");
}

const GOAL_ICONS = ["🎯","🏀","🎮","📱","🚗","🎓","✈️","🎁","💻","🚲","🐶","🚨","🎧","👟","📷","⚽"];

function goalFormModal(existing, preset) {
  const g = existing || preset || { title:"", target:"", current:"0", targetDate:"", icon:"🎯" };
  openModal(`
    <div class="modal-head"><h3>${existing?"Edit goal":"New savings goal"}</h3><button class="close-x" id="modal-close">✕</button></div>
    <label for="g-title">What are you saving for?</label>
    <input type="text" id="g-title" placeholder="e.g. New headphones" value="${escapeHtml(g.title)}" maxlength="40" />
    <label>Icon</label>
    <div class="avatar-grid" id="g-icon-grid">
      ${GOAL_ICONS.map(i => `<button type="button" class="avatar-choice ${(g.icon||'🎯')===i?'selected':''}" data-g-icon="${i}">${i}</button>`).join("")}
    </div>
    <div class="field-row" style="margin-top:10px;">
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
  let chosenIcon = g.icon || "🎯";
  document.getElementById("modal-close").onclick = closeModal;
  document.querySelectorAll("[data-g-icon]").forEach(el => el.onclick = () => {
    chosenIcon = el.dataset.gIcon;
    document.querySelectorAll("[data-g-icon]").forEach(x => x.classList.toggle("selected", x.dataset.gIcon === chosenIcon));
  });
  document.getElementById("g-save").onclick = () => {
    const title = document.getElementById("g-title").value.trim();
    const target = parseFloat(document.getElementById("g-target").value);
    const current = parseFloat(document.getElementById("g-current").value) || 0;
    const targetDate = document.getElementById("g-date").value;
    if (!title || !target || target <= 0) { toast("Add a title and target amount"); return; }
    const p = state.profile;
    if (existing) {
      Object.assign(existing, { title, target, current, targetDate, icon: chosenIcon });
      if (existing.current >= existing.target) existing.status = "completed";
    } else {
      const goal = { id: uid("goal"), title, target, current, targetDate, icon: chosenIcon, status: current >= target ? "completed" : "active", createdDate: todayStr(), milestonesHit: [] };
      p.goals.push(goal);
      addXp(5, "New goal");
    }
    saveActive();
    checkNewBadges();
    closeModal();
    render();
  };
}

function renderWishlist() {
  const p = state.profile;
  const items = [...p.wishlist].sort((a,b) => b.addedDate.localeCompare(a.addedDate));
  return shell(`
    <div class="section-head" style="margin-top:0;"><h2>Wishlist</h2></div>
    <p style="color:var(--ink-soft);font-size:.85rem;margin-top:0;">Add things you want but haven't committed to buying yet — a 30-day cooldown helps tell a real want from an impulse.</p>
    <button class="btn btn-coral btn-block" id="new-wish-btn" style="margin-bottom:14px;">+ Add to wishlist</button>
    <div class="card">
      ${items.length ? items.map(wishRowHtml).join("") : `<div class="empty-state"><span class="emoji">💭</span>Nothing here yet.</div>`}
    </div>
    <button class="btn btn-outline btn-block" data-nav="goals" style="margin-top:10px;">← Back to Goals</button>
  `, "goals");
}

function wishRowHtml(w) {
  const added = new Date(w.addedDate + "T00:00:00");
  const daysWaited = Math.floor((new Date() - added) / 86400000);
  const ready = daysWaited >= 30;
  return `
    <div class="wish-row">
      <div class="meta">
        <div class="t">${escapeHtml(w.title)} · ${money(w.price)}</div>
        <div class="d">Priority: ${w.priority} · Added ${fmtDate(w.addedDate)}</div>
      </div>
      <span class="cooldown ${ready?'ready':''}">${ready ? "Ready!" : `${30-daysWaited}d left`}</span>
      <button class="del" data-wish-delete="${w.id}" aria-label="Remove">🗑</button>
    </div>`;
}

function wishFormModal() {
  openModal(`
    <div class="modal-head"><h3>Add to wishlist</h3><button class="close-x" id="modal-close">✕</button></div>
    <label for="w-title">Item</label>
    <input type="text" id="w-title" maxlength="40" placeholder="e.g. New headphones" />
    <label for="w-price">Price</label>
    <input type="number" id="w-price" min="0" step="0.01" />
    <label for="w-priority">Priority</label>
    <select id="w-priority"><option value="low">Low</option><option value="medium" selected>Medium</option><option value="high">High</option></select>
    <button class="btn btn-primary btn-block" id="w-save" style="margin-top:14px;">Add</button>
  `);
  document.getElementById("modal-close").onclick = closeModal;
  document.getElementById("w-save").onclick = () => {
    const title = document.getElementById("w-title").value.trim();
    const price = parseFloat(document.getElementById("w-price").value) || 0;
    const priority = document.getElementById("w-priority").value;
    if (!title) { toast("Enter an item name"); return; }
    state.profile.wishlist.push({ id: uid("wish"), title, price, priority, addedDate: todayStr() });
    saveActive();
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
    if (!goal.milestonesHit) goal.milestonesHit = [];
    const justCompleted = goal.current >= goal.target && goal.status !== "completed";
    if (justCompleted) { goal.status = "completed"; addXp(50, `"${goal.title}" complete!`); }
    else {
      const pct = goal.target > 0 ? (goal.current / goal.target) * 100 : 0;
      [25, 50, 75].forEach(m => {
        if (pct >= m && goal.milestonesHit.indexOf(m) === -1) {
          goal.milestonesHit.push(m);
          addXp(10, `${m}% of "${goal.title}"`);
        }
      });
    }
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

function renderSubscriptions() {
  const p = state.profile;
  const subs = p.subscriptions || [];
  const monthlyTotal = subs.reduce((s,x) => s + (x.cycle === "yearly" ? x.cost/12 : x.cost), 0);
  const today = new Date();
  return shell(`
    <div class="section-head" style="margin-top:0;"><h2>Subscriptions</h2></div>
    <div class="card" style="text-align:center;">
      <div style="font-size:1.6rem;font-family:var(--font-display);">${money(monthlyTotal)}<span style="font-size:.8rem;color:var(--ink-faint);"> /month total</span></div>
    </div>
    <button class="btn btn-coral btn-block" id="new-sub-btn" style="margin:10px 0 14px;">+ Add a subscription</button>
    <div class="card">
      ${subs.length ? subs.map(s => subRowHtml(s, today)).join("") : `<div class="empty-state"><span class="emoji">📱</span>No subscriptions tracked yet.</div>`}
    </div>
    <button class="btn btn-outline btn-block" data-nav="budget" style="margin-top:10px;">← Back to Budget</button>
  `, "budget");
}

function subRowHtml(s, today) {
  const dueSoon = s.renewalDay && Math.abs(s.renewalDay - today.getDate()) <= 3;
  return `
    <div class="sub-row">
      <div class="meta">
        <div class="t">${escapeHtml(s.name)}</div>
        <div class="d">${s.cycle === "yearly" ? "Yearly" : "Monthly"}${s.renewalDay ? ` · renews on the ${s.renewalDay}${dueSoon ? ' <span style="color:var(--danger);font-weight:700;">· due soon</span>' : ''}` : ""}</div>
      </div>
      <div class="cost">${money(s.cost)}</div>
      <button class="del" data-sub-delete="${s.id}" aria-label="Remove">🗑</button>
    </div>`;
}

function subFormModal() {
  openModal(`
    <div class="modal-head"><h3>Add a subscription</h3><button class="close-x" id="modal-close">✕</button></div>
    <label for="s-name">Name</label>
    <input type="text" id="s-name" maxlength="30" placeholder="e.g. Netflix" />
    <div class="field-row">
      <div><label for="s-cost">Cost</label><input type="number" id="s-cost" min="0" step="0.01" /></div>
      <div><label for="s-cycle">Billed</label>
        <select id="s-cycle"><option value="monthly">Monthly</option><option value="yearly">Yearly</option></select>
      </div>
    </div>
    <label for="s-day">Renewal day of month (optional)</label>
    <input type="number" id="s-day" min="1" max="31" placeholder="e.g. 15" />
    <button class="btn btn-primary btn-block" id="s-save" style="margin-top:14px;">Add</button>
  `);
  document.getElementById("modal-close").onclick = closeModal;
  document.getElementById("s-save").onclick = () => {
    const name = document.getElementById("s-name").value.trim();
    const cost = parseFloat(document.getElementById("s-cost").value);
    const cycle = document.getElementById("s-cycle").value;
    const renewalDay = parseInt(document.getElementById("s-day").value, 10) || null;
    if (!name || !cost || cost <= 0) { toast("Enter a name and cost"); return; }
    state.profile.subscriptions.push({ id: uid("sub"), name, cost, cycle, renewalDay });
    saveActive();
    closeModal();
    render();
  };
}

function renderCalculators() {
  return shell(`
    <div class="section-head" style="margin-top:0;"><h2>Calculators</h2></div>

    <div class="card">
      <h3 style="margin-top:0;">🎯 Savings Goal Calculator</h3>
      <label for="calc-goal-amount">How much do you need?</label>
      <input type="number" id="calc-goal-amount" min="0" step="0.01" placeholder="200" />
      <label for="calc-goal-days">In how many days?</label>
      <input type="number" id="calc-goal-days" min="1" placeholder="60" />
      <button class="btn btn-primary btn-block" id="calc-goal-btn" style="margin-top:10px;">Calculate</button>
      <div id="calc-goal-result"></div>
    </div>

    <div class="card">
      <h3 style="margin-top:0;">🌳 Compound Growth Calculator</h3>
      <label for="calc-ci-principal">Starting amount</label>
      <input type="number" id="calc-ci-principal" min="0" step="0.01" placeholder="100" />
      <div class="field-row">
        <div><label for="calc-ci-rate">Annual growth rate (%)</label><input type="number" id="calc-ci-rate" min="0" step="0.1" placeholder="5" /></div>
        <div><label for="calc-ci-years">Years</label><input type="number" id="calc-ci-years" min="1" placeholder="10" /></div>
      </div>
      <button class="btn btn-primary btn-block" id="calc-ci-btn" style="margin-top:10px;">Calculate</button>
      <div id="calc-ci-result"></div>
    </div>

    <div class="card">
      <h3 style="margin-top:0;">🇦🇺 GST Calculator</h3>
      <label for="calc-gst-amount">Price</label>
      <input type="number" id="calc-gst-amount" min="0" step="0.01" placeholder="110" />
      <label>Direction</label>
      <div class="tab-row">
        <button type="button" data-gst-dir="add" class="active">Add 10% GST</button>
        <button type="button" data-gst-dir="remove">Remove 10% GST</button>
      </div>
      <button class="btn btn-primary btn-block" id="calc-gst-btn" style="margin-top:10px;">Calculate</button>
      <div id="calc-gst-result"></div>
    </div>

    <button class="btn btn-outline btn-block" data-nav="budget" style="margin-top:6px;">← Back to Budget</button>
  `, "budget");
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

function spendingInsights(p) {
  const expenses = p.budget.filter(e => e.type === "expense");
  if (!expenses.length) return null;
  const largest = [...expenses].sort((a,b) => b.amount - a.amount)[0];
  const totalSpent = expenses.reduce((s,e) => s+e.amount, 0);
  const avg = totalSpent / expenses.length;
  const byMonth = {};
  p.budget.forEach(e => {
    const m = e.date.slice(0,7);
    if (!byMonth[m]) byMonth[m] = { income: 0, expense: 0 };
    byMonth[m][e.type] += e.amount;
  });
  let bestMonth = null, bestSaved = -Infinity;
  Object.entries(byMonth).forEach(([m, v]) => {
    const saved = v.income - v.expense;
    if (saved > bestSaved) { bestSaved = saved; bestMonth = m; }
  });
  return { largest, avg, bestMonth, bestSaved };
}

function renderBudget() {
  const p = state.profile;
  const { income, expense, entries } = budgetTotals(p, state.budgetRange);
  const filtered = state.budgetTab === "all" ? entries : entries.filter(e => e.type === state.budgetTab);
  const sorted = [...filtered].sort((a,b) => b.date.localeCompare(a.date));
  const insights = spendingInsights(p);

  // 7-day expense-by-category chart
  const byCat = {};
  entries.filter(e=>e.type==="expense").forEach(e => { byCat[e.category] = (byCat[e.category]||0) + e.amount; });
  const catEntries = Object.entries(byCat).sort((a,b)=>b[1]-a[1]).slice(0,5);
  const maxVal = Math.max(1, ...catEntries.map(c=>c[1]));

  return shell(`
    <div class="section-head" style="margin-top:0;"><h2>Budget</h2></div>
    <button class="btn btn-coral btn-block" id="new-txn-btn" style="margin-bottom:10px;">+ Log money in or out</button>
    <div class="field-row" style="margin-bottom:12px;">
      <button class="btn btn-outline" data-nav="planner">📝 Planner</button>
      <button class="btn btn-outline" data-nav="calculators">🧮 Calculators</button>
      <button class="btn btn-outline" data-nav="subscriptions">📱 Subs</button>
    </div>

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

    ${insights ? `
    <div class="card">
      <label>Spending insights</label>
      <p style="margin:6px 0 0;font-size:.85rem;">
        Biggest single expense: <strong>${escapeHtml(catInfo("expense", insights.largest.category).label)}</strong> (${money(insights.largest.amount)})<br>
        Average expense: <strong>${money(insights.avg)}</strong><br>
        ${insights.bestMonth ? `Best month saved: <strong>${money(Math.max(0,insights.bestSaved))}</strong> (${insights.bestMonth})` : ""}
      </p>
    </div>` : ""}

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
  } else if (res && res.notApproved) {
    state.choresData = { tasks: [], history: [], error: "A parent needs to approve your profile before chores unlock. Ask them to check the Manage tab or the Admin portal." };
  } else {
    state.choresData = { tasks: [], history: [], error: (res && res.error) || "Couldn't load chores right now." };
  }
  render();
}

async function markTaskDone(taskId) {
  const p = state.profile;
  const res = await SavvioCloud.completeTask(p.id, p.sessionToken, taskId);
  if (res && res.ok) { toast("Submitted! Waiting for a parent to approve. 🌟"); state.choresData = null; go("chores"); }
  else if (res && res.notApproved) toast("Ask a parent to approve your profile first");
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
  } else if (res && res.notApproved) {
    state.perksData = { perks: [], history: [], error: "A parent needs to approve your profile before rewards unlock. Ask them to check the Manage tab or the Admin portal." };
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
  } else if (res && res.notApproved) {
    toast("Ask a parent to approve your profile first");
  } else {
    toast((res && res.error) || "Couldn't redeem that reward");
  }
}

// ---------------------------------------------------------------
// Manage Family (parent role) — kids, chore catalog + approvals,
// reward catalog + fulfilment. Lock/unlock/reset PIN/delete stay
// Admin-portal-only; see Code.gs requireActiveParent for why.
// ---------------------------------------------------------------
// ---------------------------------------------------------------
// Play hub — Challenges + Quick Games (Needs vs Wants, Scam Spotter)
// ---------------------------------------------------------------
function renderPlay() {
  return shell(`
    <div class="section-head" style="margin-top:0;"><h2>Play &amp; Challenges</h2></div>
    <div class="tab-row">
      <button data-playtab="challenges" class="${state.playTab==='challenges'?'active':''}">Challenges</button>
      <button data-playtab="games" class="${state.playTab==='games'?'active':''}">Quick Games</button>
    </div>
    ${state.playTab === "challenges" ? renderChallengesTab() : renderGamesTab()}
  `, "play");
}

function renderChallengesTab() {
  const p = state.profile;
  return CHALLENGES.map(c => {
    const prog = p.challengeProgress[c.id] || { count: 0, completed: false };
    const pct = c.target > 0 ? Math.min(100, Math.round((prog.count / c.target) * 100)) : 0;
    return `
      <div class="card challenge-card">
        <div class="top-row">
          <div>
            <div class="ic">${c.icon}</div>
            <h3 style="margin:4px 0 2px;">${escapeHtml(c.title)}</h3>
            <p style="margin:0;font-size:.82rem;color:var(--ink-soft);">${escapeHtml(c.description)}</p>
          </div>
          <span class="xp-tag">+${c.xp} XP</span>
        </div>
        ${prog.completed ? `<div class="badge-pill" style="margin-top:10px;">Completed 🎉</div>` : `
          <div class="progress-track" style="margin-top:10px;"><div class="progress-fill gold" style="width:${pct}%;"></div></div>
          <div class="pct">${prog.count}/${c.target}${c.type==='target' ? ' saved' : ''}</div>
          <button class="btn btn-primary btn-sm" data-challenge-progress="${c.id}" style="margin-top:8px;">${c.type==='once' ? 'Mark done' : '+1 today'}</button>
        `}
      </div>`;
  }).join("");
}

function renderGamesTab() {
  if (state.gameSession) return renderGamePlay();
  const p = state.profile;
  return `
    <div class="game-mode-pick">
      <div class="card" data-start-game="needswants"><div class="ic">⚖️</div><h3 style="margin:6px 0 2px;">Needs vs Wants</h3><p style="font-size:.8rem;color:var(--ink-soft);margin:0;">Quick-fire sorting</p></div>
      <div class="card" data-start-game="scams"><div class="ic">🛡️</div><h3 style="margin:6px 0 2px;">Scam Spotter</h3><p style="font-size:.8rem;color:var(--ink-soft);margin:0;">Scam or legit?</p></div>
    </div>
    <div class="card" style="margin-top:14px;">
      <p style="margin:0;font-size:.85rem;color:var(--ink-soft);">
        Needs vs Wants: ${p.gameStats.needswants.correct}/${p.gameStats.needswants.played} correct all-time<br>
        Scam Spotter: ${p.gameStats.scams.correct}/${p.gameStats.scams.played} correct all-time
      </p>
    </div>
  `;
}

function renderGamePlay() {
  const s = state.gameSession;
  const item = s.items[s.idx];
  const isNW = s.type === "needswants";
  const opt1 = isNW ? "need" : "legit";
  const opt2 = isNW ? "want" : "scam";
  const label1 = isNW ? "Need" : "✅ Legit";
  const label2 = isNW ? "Want" : "⚠️ Scam";
  return `
    <div class="game-score">Question ${s.idx+1} of ${s.items.length} · Score ${s.correct}</div>
    <div class="card game-card">
      <div class="game-emoji">${item.emoji}</div>
      <div class="game-label">${escapeHtml(item.label)}</div>
      <div class="game-choices">
        <button data-game-choice="${opt1}" class="${s.answered ? (item.answer===opt1?'correct':(s.chosen===opt1?'wrong':'')) : ''}" ${s.answered?'disabled':''}>${label1}</button>
        <button data-game-choice="${opt2}" class="${s.answered ? (item.answer===opt2?'correct':(s.chosen===opt2?'wrong':'')) : ''}" ${s.answered?'disabled':''}>${label2}</button>
      </div>
      ${s.answered ? `<div class="game-explain">${escapeHtml(item.explain)}</div>
        <button class="btn btn-primary btn-block" id="game-next-btn" style="margin-top:14px;">${s.idx+1 < s.items.length ? 'Next' : 'See results'}</button>` : ""}
    </div>
    <button class="btn btn-outline btn-block" id="game-quit-btn" style="margin-top:10px;">Quit</button>
  `;
}

function progressChallenge(challengeId) {
  const c = CHALLENGES.find(x => x.id === challengeId);
  if (!c) return;
  const p = state.profile;
  if (!p.challengeProgress[challengeId]) p.challengeProgress[challengeId] = { count: 0, completed: false };
  const prog = p.challengeProgress[challengeId];
  if (prog.completed) return;
  prog.count += 1;
  if (prog.count >= c.target) {
    prog.completed = true;
    addXp(c.xp, `Challenge: ${c.title}`);
    checkNewBadges();
    toast(`🎉 Challenge complete: ${c.title}!`);
  } else {
    toast(`Nice! ${prog.count}/${c.target}`);
  }
  saveActive();
  render();
}

function startGame(type) {
  const pool = type === "needswants" ? NEEDSWANTS_ITEMS : SCAM_SCENARIOS;
  const shuffled = [...pool].sort(() => Math.random() - 0.5).slice(0, 8);
  state.gameSession = { type, items: shuffled, idx: 0, correct: 0, answered: false, chosen: null };
  render();
}

function answerGame(choice) {
  const s = state.gameSession;
  const item = s.items[s.idx];
  s.answered = true;
  s.chosen = choice;
  const p = state.profile;
  const statKey = s.type === "needswants" ? "needswants" : "scams";
  p.gameStats[statKey].played += 1;
  if (choice === item.answer) { s.correct += 1; p.gameStats[statKey].correct += 1; addXp(5, "Correct!"); }
  saveActive();
  render();
}

function nextGameQuestion() {
  const s = state.gameSession;
  s.idx += 1;
  if (s.idx >= s.items.length) {
    toast(`Game over! ${s.correct}/${s.items.length} correct 🎮`);
    checkNewBadges();
    state.gameSession = null;
  } else {
    s.answered = false; s.chosen = null;
  }
  render();
}

function renderManage() {
  if (!SavvioCloud.isConfigured()) {
    return shell(`
      <div class="section-head" style="margin-top:0;"><h2>Manage Family</h2></div>
      <div class="card empty-state"><span class="emoji">👪</span>This needs the cloud backend connected first. Ask whoever set this up to finish <code>appsscript/SETUP.md</code>.</div>
    `, "manage");
  }
  return shell(`
    <div class="section-head" style="margin-top:0;"><h2>Manage Family</h2></div>
    <div class="tab-row">
      <button data-managetab="kids" class="${state.manageTab==='kids'?'active':''}">Kids</button>
      <button data-managetab="chores" class="${state.manageTab==='chores'?'active':''}">Chores</button>
      <button data-managetab="perks" class="${state.manageTab==='perks'?'active':''}">Rewards</button>
    </div>
    ${state.manageTab === "kids" ? renderManageKids() : state.manageTab === "chores" ? renderManageChores() : renderManagePerks()}
  `, "manage");
}

function renderManageKids() {
  if (!state.manageKids) { loadManageKids(); return `<div class="card" style="text-align:center;">Loading your kids…</div>`; }
  const { kids, error } = state.manageKids;
  const active = (kids || []).filter(k => k.status === "active");
  const ranked = [...active].sort((a,b) => b.xp - a.xp);
  const medalFor = (userId) => {
    const rank = ranked.findIndex(k => k.userId === userId);
    return rank === 0 ? "🥇" : rank === 1 ? "🥈" : rank === 2 ? "🥉" : "";
  };
  return `
    <button class="btn btn-primary btn-block" id="add-kid-btn">+ Add a kid profile</button>
    <p style="font-size:.78rem;color:var(--ink-faint);text-align:center;margin:6px 0 16px;">Fastest way to set them up — they're active right away, no approval step needed. If they've already created their own profile on their own device, approve or reject it below instead.</p>
    ${error ? `<div class="card empty-state">${escapeHtml(error)}</div>` : ""}
    ${kids && kids.length ? kids.map(k => `
      <div class="card">
        <div style="display:flex;align-items:center;gap:10px;">
          <div class="kid-rank">${medalFor(k.userId)}</div>
          <div style="width:40px;height:40px;border-radius:50%;background:var(--primary-tint);display:flex;align-items:center;justify-content:center;font-size:1.2rem;flex-shrink:0;">${k.avatar}</div>
          <div style="flex:1;">
            <div style="font-weight:700;">${escapeHtml(k.name)}</div>
            <div style="font-size:.75rem;color:var(--ink-faint);">Level ${getLevelInfo(k.xp).level} · ⭐ ${k.stars||0} · 🔥${k.streak||0}</div>
          </div>
          <span class="status-pill status-${k.status}">${k.status}</span>
        </div>
        ${k.status === "pending" ? `
        <div style="display:flex;gap:8px;margin-top:12px;">
          <button class="btn btn-primary btn-sm" data-kid-approve="${k.userId}">Approve</button>
          <button class="btn btn-outline btn-sm" data-kid-reject="${k.userId}">Reject</button>
        </div>` : `
        <div style="margin-top:12px;">
          <button class="btn btn-outline btn-sm" data-kid-gift="${k.userId}" data-kid-name="${escapeHtml(k.name)}">🎁 Gift stars</button>
        </div>`}
      </div>
    `).join("") : `<div class="card empty-state"><span class="emoji">👪</span>No kid profiles yet — add one above, or wait for one to sign up on their own device.</div>`}
    <p style="font-size:.76rem;color:var(--ink-faint);text-align:center;padding:0 10px;">Need to lock, unlock, reset a PIN, or delete a profile? That stays in the Admin portal for extra security.</p>
  `;
}

function renderManageChores() {
  if (!state.manageTasks) { loadManageChores(); return `<div class="card" style="text-align:center;">Loading chores…</div>`; }
  const { tasks, pending, error } = state.manageTasks;
  const kidOptions = ['<option value="all">All kids</option>']
    .concat(((state.manageKids && state.manageKids.kids) || []).map(k => `<option value="${k.userId}">${escapeHtml(k.name)}</option>`))
    .join("");
  return `
    ${error ? `<div class="card empty-state">${escapeHtml(error)}</div>` : ""}
    ${pending && pending.length ? `
    <div class="card">
      <h3 style="margin-top:0;">Pending approval</h3>
      ${pending.map(c => `
        <div class="card-flat" style="display:flex;justify-content:space-between;align-items:center;gap:8px;">
          <span>${escapeHtml(c.kidName)} — ${escapeHtml(c.taskTitle)} (⭐ ${c.starValue})</span>
          <div style="display:flex;gap:6px;flex-shrink:0;">
            <button class="btn btn-primary btn-sm" data-mchore-approve="${c.completionId}">Approve</button>
            <button class="btn btn-outline btn-sm" data-mchore-reject="${c.completionId}">Reject</button>
          </div>
        </div>`).join("")}
    </div>` : ""}
    <div class="card">
      <h3 style="margin-top:0;">Add a chore</h3>
      <label for="mtask-title">Title</label>
      <input type="text" id="mtask-title" placeholder="e.g. Make your bed" />
      <div class="field-row">
        <div><label for="mtask-stars">Stars</label><input type="number" id="mtask-stars" min="1" value="5" /></div>
        <div><label for="mtask-recurring">Repeats</label>
          <select id="mtask-recurring">
            <option value="none">One-time</option>
            <option value="daily" selected>Daily</option>
            <option value="weekly">Weekly</option>
          </select>
        </div>
      </div>
      <label for="mtask-assign">Assign to</label>
      <select id="mtask-assign">${kidOptions}</select>
      <button class="btn btn-primary btn-block" id="mtask-create-btn" style="margin-top:10px;">+ Add chore</button>
    </div>
    <div class="card">
      <h3 style="margin-top:0;">Chore catalog</h3>
      ${tasks && tasks.length ? tasks.map(t => `
        <div class="card-flat" style="display:flex;justify-content:space-between;align-items:center;gap:8px;">
          <span>${isActiveVal(t.active)?"":"⏸ "}${escapeHtml(t.title)} — ⭐ ${t.starValue} · ${t.recurring}</span>
          <div style="display:flex;gap:6px;flex-shrink:0;">
            <button class="btn btn-outline btn-sm" data-mtask-toggle="${t.taskId}" data-active="${t.active}">${isActiveVal(t.active)?"Pause":"Resume"}</button>
            <button class="btn btn-outline btn-sm" data-mtask-delete="${t.taskId}">Delete</button>
          </div>
        </div>`).join("") : `<p style="color:var(--ink-faint);margin:0;">No chores yet — add one above.</p>`}
    </div>
  `;
}

function renderManagePerks() {
  if (!state.managePerks) { loadManagePerks(); return `<div class="card" style="text-align:center;">Loading rewards…</div>`; }
  const { perks, pending, error } = state.managePerks;
  const kidOptions = ['<option value="all">All kids</option>']
    .concat(((state.manageKids && state.manageKids.kids) || []).map(k => `<option value="${k.userId}">${escapeHtml(k.name)}</option>`))
    .join("");
  return `
    ${error ? `<div class="card empty-state">${escapeHtml(error)}</div>` : ""}
    ${pending && pending.length ? `
    <div class="card">
      <h3 style="margin-top:0;">Pending redemptions</h3>
      ${pending.map(r => `
        <div class="card-flat" style="display:flex;justify-content:space-between;align-items:center;gap:8px;">
          <span>${escapeHtml(r.kidName)} — ${escapeHtml(r.perkTitle)} (⭐ ${r.starCost})</span>
          <div style="display:flex;gap:6px;flex-shrink:0;">
            <button class="btn btn-primary btn-sm" data-mredeem-fulfill="${r.redemptionId}">Fulfill</button>
            <button class="btn btn-outline btn-sm" data-mredeem-reject="${r.redemptionId}">Reject</button>
          </div>
        </div>`).join("")}
    </div>` : ""}
    <div class="card">
      <h3 style="margin-top:0;">Add a reward</h3>
      <label for="mperk-title">Title</label>
      <input type="text" id="mperk-title" placeholder="e.g. Choose dinner one night" />
      <label for="mperk-cost">Star cost</label>
      <input type="number" id="mperk-cost" min="1" value="20" />
      <label for="mperk-assign">Assign to</label>
      <select id="mperk-assign">${kidOptions}</select>
      <button class="btn btn-primary btn-block" id="mperk-create-btn" style="margin-top:10px;">+ Add reward</button>
    </div>
    <div class="card">
      <h3 style="margin-top:0;">Reward catalog</h3>
      ${perks && perks.length ? perks.map(p => `
        <div class="card-flat" style="display:flex;justify-content:space-between;align-items:center;gap:8px;">
          <span>${isActiveVal(p.active)?"":"⏸ "}${escapeHtml(p.title)} — ⭐ ${p.starCost}</span>
          <div style="display:flex;gap:6px;flex-shrink:0;">
            <button class="btn btn-outline btn-sm" data-mperk-toggle="${p.perkId}" data-active="${p.active}">${isActiveVal(p.active)?"Pause":"Resume"}</button>
            <button class="btn btn-outline btn-sm" data-mperk-delete="${p.perkId}">Delete</button>
          </div>
        </div>`).join("") : `<p style="color:var(--ink-faint);margin:0;">No rewards yet — add one above.</p>`}
    </div>
  `;
}

function addKidModal() {
  openModal(`
    <div class="modal-head"><h3>Add a kid profile</h3><button class="close-x" id="modal-close">✕</button></div>
    <label for="ak-name">Name</label>
    <input type="text" id="ak-name" maxlength="20" placeholder="e.g. Adarsh" />
    <label>Age group</label>
    <div class="age-toggle" id="ak-age-toggle">
      <button type="button" data-ak-age="kids" class="selected">🧒<br>8–12</button>
      <button type="button" data-ak-age="teens">🧑<br>13–18</button>
    </div>
    <label style="margin-top:14px;">Avatar</label>
    <div class="avatar-grid" id="ak-avatar-grid">
      ${AVATARS.map((a,i) => `<button type="button" class="avatar-choice ${i===0?'selected':''}" data-ak-avatar="${a}">${a}</button>`).join("")}
    </div>
    <label for="ak-pin" style="margin-top:14px;">4-digit PIN</label>
    <input type="text" id="ak-pin" inputmode="numeric" maxlength="4" placeholder="••••" />
    <p style="font-size:.78rem;color:var(--ink-faint);margin:4px 0 0;">They'll use their name + this PIN to log in on any device.</p>
    <button class="btn btn-primary btn-block" id="ak-save" style="margin-top:14px;">Add profile</button>
  `);
  let chosenAge = "kids";
  let chosenAvatar = AVATARS[0];
  document.getElementById("modal-close").onclick = closeModal;
  document.querySelectorAll("[data-ak-age]").forEach(el => el.onclick = () => {
    chosenAge = el.dataset.akAge;
    document.querySelectorAll("[data-ak-age]").forEach(x => x.classList.toggle("selected", x.dataset.akAge === chosenAge));
  });
  document.querySelectorAll("[data-ak-avatar]").forEach(el => el.onclick = () => {
    chosenAvatar = el.dataset.akAvatar;
    document.querySelectorAll("[data-ak-avatar]").forEach(x => x.classList.toggle("selected", x.dataset.akAvatar === chosenAvatar));
  });
  document.getElementById("ak-save").onclick = async () => {
    const name = document.getElementById("ak-name").value.trim();
    const pin = document.getElementById("ak-pin").value.trim();
    if (!name) { toast("Enter a name"); return; }
    if (!/^\d{4}$/.test(pin)) { toast("PIN must be 4 digits"); return; }
    const p = state.profile;
    const res = await SavvioCloud.parentCreateKid(p.id, p.sessionToken, name, chosenAge, chosenAvatar, pin);
    if (res && res.ok) {
      toast(`${name}'s profile is ready! 🎉`);
      closeModal();
      state.manageKids = null;
      loadManageKids();
    } else {
      toast((res && res.error) || "Couldn't add that profile");
    }
  };
}

async function loadManageKids() {
  const p = state.profile;
  const res = await SavvioCloud.listMyKids(p.id, p.sessionToken);
  state.manageKids = (res && res.ok) ? { kids: res.kids || [] } : { kids: [], error: (res && res.error) || "Couldn't load kids" };
  render();
}

async function loadManageChores() {
  const p = state.profile;
  const [tasksRes, pendingRes] = await Promise.all([
    SavvioCloud.parentListTasks(p.id, p.sessionToken),
    SavvioCloud.parentListPendingCompletions(p.id, p.sessionToken),
  ]);
  state.manageTasks = {
    tasks: (tasksRes && tasksRes.ok) ? tasksRes.tasks : [],
    pending: (pendingRes && pendingRes.ok) ? pendingRes.completions : [],
    error: (!tasksRes || !tasksRes.ok) ? ((tasksRes && tasksRes.error) || "Couldn't load chores") : null,
  };
  render();
}

async function loadManagePerks() {
  const p = state.profile;
  const [perksRes, pendingRes] = await Promise.all([
    SavvioCloud.parentListPerks(p.id, p.sessionToken),
    SavvioCloud.parentListPendingRedemptions(p.id, p.sessionToken),
  ]);
  state.managePerks = {
    perks: (perksRes && perksRes.ok) ? perksRes.perks : [],
    pending: (pendingRes && pendingRes.ok) ? pendingRes.redemptions : [],
    error: (!perksRes || !perksRes.ok) ? ((perksRes && perksRes.error) || "Couldn't load rewards") : null,
  };
  render();
}

async function reviewManageCompletion(completionId, approve) {
  const p = state.profile;
  const res = await SavvioCloud.parentReviewCompletion(p.id, p.sessionToken, completionId, approve);
  if (res && res.ok) { toast(approve ? "Approved — stars credited 🌟" : "Rejected"); state.manageTasks = null; loadManageChores(); }
  else toast((res && res.error) || "Couldn't update that chore");
}

async function reviewManageRedemption(redemptionId, approve) {
  const p = state.profile;
  const res = await SavvioCloud.parentReviewRedemption(p.id, p.sessionToken, redemptionId, approve);
  if (res && res.ok) { toast(approve ? "Marked fulfilled 🎁" : "Rejected — stars refunded"); state.managePerks = null; loadManagePerks(); }
  else toast((res && res.error) || "Couldn't update that redemption");
}

// ---------------------------------------------------------------
// Profile
// ---------------------------------------------------------------
function renderProfile() {
  const p = state.profile;
  const isParent = p.role === "parent";
  return shell(`
    <div class="profile-hero">
      <div class="av-big">${p.avatar}</div>
      <h2>${escapeHtml(p.name)}</h2>
      <p style="color:var(--ink-faint);">${isParent ? "👪 Parent/Guardian" : (p.ageGroup === "kids" ? "Kid mode (8–12)" : "Teen mode (13–18)")}</p>
    </div>
    <div class="stat-row">
      <div class="stat-pill"><div class="val">${p.xp}</div><div class="lbl">XP</div></div>
      <div class="stat-pill"><div class="val">${p.lessonsCompleted.length}</div><div class="lbl">Lessons</div></div>
      <div class="stat-pill"><div class="val">${p.goals.filter(g=>g.status==='completed').length}</div><div class="lbl">Goals hit</div></div>
    </div>
    ${!isParent ? `
    <div class="card">
      <label>Switch age mode</label>
      <div class="age-toggle">
        <button data-profile-age="kids" class="${p.ageGroup==='kids'?'selected':''}">🧒<br>8–12</button>
        <button data-profile-age="teens" class="${p.ageGroup==='teens'?'selected':''}">🧑<br>13–18</button>
      </div>
    </div>` : ""}
    <div class="card">
      <label>Accessibility</label>
      <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;">
        <span style="font-size:.9rem;">🌙 Dark mode</span>
        <button class="btn btn-sm ${p.prefs.darkMode?'btn-primary':'btn-outline'}" id="toggle-dark-btn">${p.prefs.darkMode?'On':'Off'}</button>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;">
        <span style="font-size:.9rem;">🔠 Large text</span>
        <button class="btn btn-sm ${p.prefs.largeText?'btn-primary':'btn-outline'}" id="toggle-large-text-btn">${p.prefs.largeText?'On':'Off'}</button>
      </div>
      <div style="padding:8px 0;">
        <label for="currency-select" style="margin:0 0 6px;">💱 Currency</label>
        <select id="currency-select">
          <option value="$" ${p.prefs.currency==='$'?'selected':''}>$ Dollar</option>
          <option value="₹" ${p.prefs.currency==='₹'?'selected':''}>₹ Rupee</option>
          <option value="€" ${p.prefs.currency==='€'?'selected':''}>€ Euro</option>
          <option value="£" ${p.prefs.currency==='£'?'selected':''}>£ Pound</option>
          <option value="¥" ${p.prefs.currency==='¥'?'selected':''}>¥ Yen</option>
        </select>
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
  document.querySelectorAll("[data-habit-toggle]").forEach(el => el.onclick = () => toggleHabit(el.dataset.habitToggle));

  const liSubmit = document.getElementById("li-submit");
  if (liSubmit) liSubmit.onclick = () => submitLoginEntry();
  const liForgotBtn = document.getElementById("li-forgot-btn");
  if (liForgotBtn) liForgotBtn.onclick = () => forgotPinModal();
  const liPinField = document.getElementById("li-pin");
  if (liPinField) liPinField.onkeydown = (e) => { if (e.key === "Enter") submitLoginEntry(); };

  document.querySelectorAll("[data-select-profile]").forEach(el => el.onclick = () => {
    state.pinTargetId = el.dataset.selectProfile;
    state.pinBuffer = "";
    go("pin-login");
  });

  document.querySelectorAll("[data-role]").forEach(el => el.onclick = () => {
    state.onboard.role = el.dataset.role;
    render();
  });
  const roleNext = document.getElementById("ob-role-next");
  if (roleNext) roleNext.onclick = () => {
    if (state.onboard.role === "parent") { state.onboard.ageGroup = "teens"; go("onboard-email"); }
    else { go("onboard-age"); }
  };

  const emailNext = document.getElementById("ob-email-next");
  if (emailNext) emailNext.onclick = () => {
    const val = document.getElementById("ob-email").value.trim();
    if (val && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) { toast("That doesn't look like a valid email"); return; }
    state.onboard.email = val;
    go("onboard-avatar");
  };
  const emailSkip = document.getElementById("ob-email-skip");
  if (emailSkip) emailSkip.onclick = () => { state.onboard.email = ""; go("onboard-avatar"); };

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
  const emergencyFundBtn = document.getElementById("emergency-fund-btn");
  if (emergencyFundBtn) emergencyFundBtn.onclick = () => {
    const p = state.profile;
    const { expense } = budgetTotals(p, "month");
    const suggested = Math.max(50, Math.round(expense || 100));
    goalFormModal(null, { title: "Emergency Fund", target: suggested, current: "0", targetDate: "", icon: "🚨" });
  };
  // Flexi Save (digital piggy bank)
  document.querySelectorAll("[data-flexi-quick]").forEach(el => el.onclick = () => flexiSave(parseFloat(el.dataset.flexiQuick)));
  const flexiCustomBtn = document.getElementById("flexi-custom-btn");
  if (flexiCustomBtn) flexiCustomBtn.onclick = () => flexiCustomModal();
  const flexiBreakBtn = document.getElementById("flexi-break-btn");
  if (flexiBreakBtn) flexiBreakBtn.onclick = () => breakFlexiBank();

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

  // Wishlist
  const newWishBtn = document.getElementById("new-wish-btn");
  if (newWishBtn) newWishBtn.onclick = () => wishFormModal();
  document.querySelectorAll("[data-wish-delete]").forEach(el => el.onclick = () => {
    state.profile.wishlist = state.profile.wishlist.filter(x => x.id !== el.dataset.wishDelete);
    saveActive();
    render();
  });

  // Subscriptions
  const newSubBtn = document.getElementById("new-sub-btn");
  if (newSubBtn) newSubBtn.onclick = () => subFormModal();
  document.querySelectorAll("[data-sub-delete]").forEach(el => el.onclick = () => {
    state.profile.subscriptions = state.profile.subscriptions.filter(x => x.id !== el.dataset.subDelete);
    saveActive();
    render();
  });

  // Calculators
  let gstDirection = "add";
  document.querySelectorAll("[data-gst-dir]").forEach(el => el.onclick = () => {
    gstDirection = el.dataset.gstDir;
    document.querySelectorAll("[data-gst-dir]").forEach(x => x.classList.toggle("active", x.dataset.gstDir === gstDirection));
  });
  const calcGoalBtn = document.getElementById("calc-goal-btn");
  if (calcGoalBtn) calcGoalBtn.onclick = () => {
    const amt = parseFloat(document.getElementById("calc-goal-amount").value) || 0;
    const days = parseFloat(document.getElementById("calc-goal-days").value) || 0;
    const resultEl = document.getElementById("calc-goal-result");
    if (amt <= 0 || days <= 0) { resultEl.innerHTML = ""; toast("Enter both fields"); return; }
    const perDay = amt / days;
    resultEl.innerHTML = `<div class="calc-result"><div class="big">${money(perDay)}/day</div><div class="lbl">or ${money(perDay*7)}/week · ${money(perDay*30.44)}/month</div></div>`;
  };
  const calcCiBtn = document.getElementById("calc-ci-btn");
  if (calcCiBtn) calcCiBtn.onclick = () => {
    const principal = parseFloat(document.getElementById("calc-ci-principal").value) || 0;
    const rate = parseFloat(document.getElementById("calc-ci-rate").value) || 0;
    const years = parseFloat(document.getElementById("calc-ci-years").value) || 0;
    const resultEl = document.getElementById("calc-ci-result");
    if (principal <= 0 || years <= 0) { resultEl.innerHTML = ""; toast("Enter a starting amount and years"); return; }
    const future = principal * Math.pow(1 + rate/100, years);
    resultEl.innerHTML = `<div class="calc-result"><div class="big">${money(future)}</div><div class="lbl">after ${years} years (+${money(future-principal)} growth)</div></div>`;
  };
  const calcGstBtn = document.getElementById("calc-gst-btn");
  if (calcGstBtn) calcGstBtn.onclick = () => {
    const amt = parseFloat(document.getElementById("calc-gst-amount").value) || 0;
    const resultEl = document.getElementById("calc-gst-result");
    if (amt <= 0) { resultEl.innerHTML = ""; toast("Enter a price"); return; }
    let result, label;
    if (gstDirection === "add") { result = amt * 1.1; label = `Price including GST (GST portion: ${money(amt*0.1)})`; }
    else { result = amt / 1.1; label = `Price excluding GST (GST portion: ${money(amt - amt/1.1)})`; }
    resultEl.innerHTML = `<div class="calc-result"><div class="big">${money(result)}</div><div class="lbl">${label}</div></div>`;
  };

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
  const toggleDarkBtn = document.getElementById("toggle-dark-btn");
  if (toggleDarkBtn) toggleDarkBtn.onclick = () => {
    state.profile.prefs.darkMode = !state.profile.prefs.darkMode;
    applyPrefs(state.profile);
    saveActive();
    render();
  };
  const toggleLargeTextBtn = document.getElementById("toggle-large-text-btn");
  if (toggleLargeTextBtn) toggleLargeTextBtn.onclick = () => {
    state.profile.prefs.largeText = !state.profile.prefs.largeText;
    applyPrefs(state.profile);
    saveActive();
    render();
  };
  const currencySelect = document.getElementById("currency-select");
  if (currencySelect) currencySelect.onchange = () => {
    state.profile.prefs.currency = currencySelect.value;
    saveActive();
    render();
  };
  const openChoresBtn = document.getElementById("open-chores-btn");
  if (openChoresBtn) openChoresBtn.onclick = () => { state.choresData = null; go("chores"); };
  const openPerksBtn = document.getElementById("open-perks-btn");
  if (openPerksBtn) openPerksBtn.onclick = () => { state.perksData = null; go("perks"); };
  document.querySelectorAll("[data-task-done]").forEach(el => el.onclick = () => markTaskDone(el.dataset.taskDone));
  document.querySelectorAll("[data-perk-redeem]").forEach(el => el.onclick = () => redeemPerkFlow(el.dataset.perkRedeem));

  // Play hub
  document.querySelectorAll("[data-playtab]").forEach(el => el.onclick = () => { state.playTab = el.dataset.playtab; render(); });
  document.querySelectorAll("[data-challenge-progress]").forEach(el => el.onclick = () => progressChallenge(el.dataset.challengeProgress));
  document.querySelectorAll("[data-start-game]").forEach(el => el.onclick = () => startGame(el.dataset.startGame));
  document.querySelectorAll("[data-game-choice]").forEach(el => el.onclick = () => answerGame(el.dataset.gameChoice));
  const gameNextBtn = document.getElementById("game-next-btn");
  if (gameNextBtn) gameNextBtn.onclick = () => nextGameQuestion();
  const gameQuitBtn = document.getElementById("game-quit-btn");
  if (gameQuitBtn) gameQuitBtn.onclick = () => { state.gameSession = null; render(); };

  // Manage Family (parent role)
  const addKidBtn = document.getElementById("add-kid-btn");
  if (addKidBtn) addKidBtn.onclick = () => addKidModal();
  document.querySelectorAll("[data-managetab]").forEach(el => el.onclick = () => {
    state.manageTab = el.dataset.managetab;
    if (state.manageTab === "kids" && !state.manageKids) loadManageKids();
    if (state.manageTab === "chores" && !state.manageTasks) loadManageChores();
    if (state.manageTab === "perks" && !state.managePerks) loadManagePerks();
    render();
  });
  document.querySelectorAll("[data-kid-approve]").forEach(el => el.onclick = async () => {
    const p = state.profile;
    const res = await SavvioCloud.parentApproveKid(p.id, p.sessionToken, el.dataset.kidApprove);
    if (res && res.ok) { toast("Approved 🎉"); state.manageKids = null; loadManageKids(); } else toast((res && res.error) || "Couldn't approve");
  });
  document.querySelectorAll("[data-kid-reject]").forEach(el => el.onclick = async () => {
    if (!confirm("Reject this profile?")) return;
    const p = state.profile;
    const res = await SavvioCloud.parentRejectKid(p.id, p.sessionToken, el.dataset.kidReject);
    if (res && res.ok) { toast("Rejected"); state.manageKids = null; loadManageKids(); } else toast((res && res.error) || "Couldn't reject");
  });
  document.querySelectorAll("[data-kid-gift]").forEach(el => el.onclick = async () => {
    const amountStr = prompt(`Gift how many stars to ${el.dataset.kidName}?`, "10");
    if (amountStr === null) return;
    const amount = parseInt(amountStr, 10);
    if (!amount || amount <= 0) { toast("Enter a positive number"); return; }
    const p = state.profile;
    const res = await SavvioCloud.parentAdjustStars(p.id, p.sessionToken, el.dataset.kidGift, amount);
    if (res && res.ok) { toast(`🎁 Gifted ${amount} stars!`); state.manageKids = null; loadManageKids(); } else toast((res && res.error) || "Couldn't gift stars");
  });

  const mtaskCreateBtn = document.getElementById("mtask-create-btn");
  if (mtaskCreateBtn) mtaskCreateBtn.onclick = async () => {
    const p = state.profile;
    const title = document.getElementById("mtask-title").value.trim();
    const starValue = document.getElementById("mtask-stars").value;
    const recurring = document.getElementById("mtask-recurring").value;
    const assignedTo = document.getElementById("mtask-assign").value;
    if (!title || !starValue) { toast("Enter a title and star value"); return; }
    const res = await SavvioCloud.parentCreateTask(p.id, p.sessionToken, title, starValue, assignedTo, recurring);
    if (res && res.ok) { toast("Chore added"); state.manageTasks = null; loadManageChores(); } else toast((res && res.error) || "Couldn't add chore");
  };
  document.querySelectorAll("[data-mchore-approve]").forEach(el => el.onclick = () => reviewManageCompletion(el.dataset.mchoreApprove, true));
  document.querySelectorAll("[data-mchore-reject]").forEach(el => el.onclick = () => reviewManageCompletion(el.dataset.mchoreReject, false));
  document.querySelectorAll("[data-mtask-toggle]").forEach(el => el.onclick = async () => {
    const p = state.profile;
    const active = !isActiveVal(el.dataset.active);
    const res = await SavvioCloud.parentUpdateTask(p.id, p.sessionToken, el.dataset.mtaskToggle, { active });
    if (res && res.ok) { state.manageTasks = null; loadManageChores(); } else toast((res && res.error) || "Couldn't update chore");
  });
  document.querySelectorAll("[data-mtask-delete]").forEach(el => el.onclick = () => {
    if (!confirm("Delete this chore?")) return;
    const p = state.profile;
    SavvioCloud.parentDeleteTask(p.id, p.sessionToken, el.dataset.mtaskDelete).then(res => {
      if (res && res.ok) { toast("Deleted"); state.manageTasks = null; loadManageChores(); } else toast((res && res.error) || "Couldn't delete chore");
    });
  });

  const mperkCreateBtn = document.getElementById("mperk-create-btn");
  if (mperkCreateBtn) mperkCreateBtn.onclick = async () => {
    const p = state.profile;
    const title = document.getElementById("mperk-title").value.trim();
    const starCost = document.getElementById("mperk-cost").value;
    const assignedTo = document.getElementById("mperk-assign").value;
    if (!title || !starCost) { toast("Enter a title and star cost"); return; }
    const res = await SavvioCloud.parentCreatePerk(p.id, p.sessionToken, title, starCost, assignedTo);
    if (res && res.ok) { toast("Reward added"); state.managePerks = null; loadManagePerks(); } else toast((res && res.error) || "Couldn't add reward");
  };
  document.querySelectorAll("[data-mredeem-fulfill]").forEach(el => el.onclick = () => reviewManageRedemption(el.dataset.mredeemFulfill, true));
  document.querySelectorAll("[data-mredeem-reject]").forEach(el => el.onclick = () => reviewManageRedemption(el.dataset.mredeemReject, false));
  document.querySelectorAll("[data-mperk-toggle]").forEach(el => el.onclick = async () => {
    const p = state.profile;
    const active = !isActiveVal(el.dataset.active);
    const res = await SavvioCloud.parentUpdatePerk(p.id, p.sessionToken, el.dataset.mperkToggle, { active });
    if (res && res.ok) { state.managePerks = null; loadManagePerks(); } else toast((res && res.error) || "Couldn't update reward");
  });
  document.querySelectorAll("[data-mperk-delete]").forEach(el => el.onclick = () => {
    if (!confirm("Delete this reward?")) return;
    const p = state.profile;
    SavvioCloud.parentDeletePerk(p.id, p.sessionToken, el.dataset.mperkDelete).then(res => {
      if (res && res.ok) { toast("Deleted"); state.managePerks = null; loadManagePerks(); } else toast((res && res.error) || "Couldn't delete reward");
    });
  });
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
  if (switchBtn) switchBtn.onclick = () => { state.profile = null; state.plannerDraft = null; state.loginEntry = { name:"", pin:"" }; state.choresData = null; state.perksData = null; state.manageKids = null; state.manageTasks = null; state.managePerks = null; state.manageTab = "kids"; go("splash"); };
  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) logoutBtn.onclick = () => { state.profile = null; state.plannerDraft = null; state.loginEntry = { name:"", pin:"" }; state.choresData = null; state.perksData = null; state.manageKids = null; state.manageTasks = null; state.managePerks = null; state.manageTab = "kids"; go("splash"); };
}

async function unlockProfile(profileId, pin) {
  const p = SavvioStorage.getProfile(profileId);
  if (!p) { toast("Profile not found"); state.pinBuffer = ""; render(); return; }
  ensureProfileDefaults(p);

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
      p.role = res.profile.role || p.role || "kid";
      p.locked = false;
      state.profile = p;
      applyPrefs(p);
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
    applyPrefs(p);
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
      ensureProfileDefaults(p);
      applyPrefs(p);
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
