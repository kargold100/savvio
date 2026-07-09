/* Savvio — Challenges content bank
   type: "streak" (do it N days in a row) | "target" (save a specific amount) | "once" (single action)
   Progress is tracked entirely on-device (synced via the profile's dataJson
   blob) — no admin/parent setup needed, unlike Chores. */
const CHALLENGES = [
  { id: "ch-no-spend-weekend", title: "No-Spend Weekend", icon: "🚫", type: "streak", target: 2,
    description: "Go a whole weekend (2 days) without spending anything.", xp: 30 },
  { id: "ch-save-2-daily", title: "Save $2 Every Day", icon: "🪙", type: "streak", target: 7,
    description: "Put aside $2 (or more), 7 days in a row.", xp: 40 },
  { id: "ch-skip-drink", title: "Skip One Soft Drink", icon: "🥤", type: "once", target: 1,
    description: "Skip buying one soft drink or sugary snack this week — bank the money instead.", xp: 15 },
  { id: "ch-lunch-week", title: "Bring Lunch From Home", icon: "🥪", type: "streak", target: 5,
    description: "Pack lunch from home for 5 days in a row instead of buying it.", xp: 35 },
  { id: "ch-walk-bus", title: "Walk Instead of the Bus", icon: "🚶", type: "streak", target: 3,
    description: "Walk somewhere you'd usually pay for transport, 3 times.", xp: 25 },
  { id: "ch-30-day", title: "30-Day Saver", icon: "📅", type: "streak", target: 30,
    description: "Save something — even a little — every day for 30 days straight.", xp: 100 },
  { id: "ch-52-week", title: "52-Week Challenge", icon: "🗓️", type: "target", target: 500,
    description: "A classic: save a little more each week until you reach $500 over the year.", xp: 120 },
  { id: "ch-bingo", title: "Savings Bingo", icon: "🎯", type: "target", target: 50,
    description: "Save any combination of small amounts that adds up to $50.", xp: 30 },
  { id: "ch-birthday-money", title: "Save Your Birthday Money", icon: "🎂", type: "once", target: 1,
    description: "Put some birthday or gift money straight into savings instead of spending it all.", xp: 20 },
  { id: "ch-no-spend-week", title: "No-Spend Week", icon: "🧘", type: "streak", target: 7,
    description: "A full 7 days with no non-essential spending.", xp: 60 },
  { id: "ch-price-compare", title: "Compare Before You Buy", icon: "🔍", type: "once", target: 1,
    description: "Compare prices at two shops before your next non-essential purchase.", xp: 15 },
  { id: "ch-secondhand", title: "Buy Secondhand Once", icon: "♻️", type: "once", target: 1,
    description: "Choose a secondhand or refurbished option instead of brand new, at least once.", xp: 20 },
  { id: "ch-subscription-audit", title: "Subscription Audit", icon: "📋", type: "once", target: 1,
    description: "Check every subscription you (or your family) pay for and cancel one you don't use.", xp: 25 },
  { id: "ch-give-some", title: "Give a Little", icon: "🎁", type: "once", target: 1,
    description: "Set aside or donate a small amount to something you care about.", xp: 20 },
  { id: "ch-goal-milestone", title: "First Goal Milestone", icon: "🏁", type: "once", target: 1,
    description: "Reach 50% progress on any savings goal.", xp: 30 },
];

if (typeof window !== "undefined") window.CHALLENGES = CHALLENGES;
