/* Savvio — Quick Games content
   Two lightweight tap-to-answer games sharing one engine (see app.js
   renderGamePlay). Each item: emoji, label, correct answer, and a short
   explanation shown after answering. */

const NEEDSWANTS_ITEMS = [
  { id: "nw01", emoji: "🍞", label: "Bread and milk", answer: "need", explain: "Basic food to eat is a need." },
  { id: "nw02", emoji: "🎮", label: "New video game", answer: "want", explain: "Fun, but not essential." },
  { id: "nw03", emoji: "💊", label: "Prescribed medicine", answer: "need", explain: "Health essentials are needs." },
  { id: "nw04", emoji: "👟", label: "Latest sneakers (you already have shoes)", answer: "want", explain: "An extra pair beyond what you need is a want." },
  { id: "nw05", emoji: "🎒", label: "School bag", answer: "need", explain: "Required for school." },
  { id: "nw06", emoji: "🍕", label: "Takeaway pizza", answer: "want", explain: "Tasty, but not essential — home food covers the need." },
  { id: "nw07", emoji: "🏠", label: "Rent or mortgage payment", answer: "need", explain: "Shelter is a core need." },
  { id: "nw08", emoji: "📱", label: "The newest phone model", answer: "want", explain: "A working phone can be a need — the newest model is a want." },
  { id: "nw09", emoji: "💧", label: "Drinking water", answer: "need", explain: "Essential for life." },
  { id: "nw10", emoji: "🎢", label: "Theme park tickets", answer: "want", explain: "Fun, but optional." },
  { id: "nw11", emoji: "🩹", label: "First aid supplies", answer: "need", explain: "Safety and health essential." },
  { id: "nw12", emoji: "🍬", label: "Lollies and candy", answer: "want", explain: "A treat, not essential." },
  { id: "nw13", emoji: "🧥", label: "Warm jacket for winter", answer: "need", explain: "Protects your health in cold weather." },
  { id: "nw14", emoji: "🎧", label: "Designer headphones", answer: "want", explain: "Basic headphones would meet the need — 'designer' is the want part." },
  { id: "nw15", emoji: "🚌", label: "Bus fare to school", answer: "need", explain: "Getting to school is essential." },
  { id: "nw16", emoji: "🖼️", label: "Poster for your wall", answer: "want", explain: "Decoration, not essential." },
  { id: "nw17", emoji: "🦷", label: "Dentist check-up", answer: "need", explain: "Health care is a need." },
  { id: "nw18", emoji: "🎬", label: "Movie tickets", answer: "want", explain: "Entertainment, not essential." },
  { id: "nw19", emoji: "🧴", label: "Soap and toothpaste", answer: "need", explain: "Basic hygiene essentials." },
  { id: "nw20", emoji: "🏎️", label: "A sports car (a basic car covers the need)", answer: "want", explain: "Transport can be a need — 'sports car' specifically is the want." },
];

const SCAM_SCENARIOS = [
  { id: "sc01", emoji: "📱", label: "A text says you've won a prize — just pay a small 'delivery fee' first.", answer: "scam", explain: "Real prizes never require you to pay first. Classic scam pattern." },
  { id: "sc02", emoji: "🏦", label: "Your bank sends a notification through their official app about a purchase you made.", answer: "legit", explain: "Notifications through your bank's own official app are normal." },
  { id: "sc03", emoji: "☎️", label: "A caller says they're from your bank and asks you to move money to a 'safe account'.", answer: "scam", explain: "Real banks never ask you to transfer money to a new 'safe' account over the phone." },
  { id: "sc04", emoji: "💌", label: "A friend's account messages you urgently asking to borrow money right now.", answer: "scam", explain: "Hacked accounts often send urgent money requests. Verify another way first." },
  { id: "sc05", emoji: "🧾", label: "A shopping site shows a padlock icon and a normal, spelled-correctly web address.", answer: "legit", explain: "A secure connection and a proper domain name are good signs." },
  { id: "sc06", emoji: "💰", label: "An ad promises to double your money in a week, guaranteed.", answer: "scam", explain: "Guaranteed high returns fast is one of the biggest red flags in finance." },
  { id: "sc07", emoji: "📧", label: "An email from 'support' asks you to confirm your password by clicking a link.", answer: "scam", explain: "Real companies don't ask you to 'confirm' your password over email." },
  { id: "sc08", emoji: "🛍️", label: "You get a receipt emailed to you right after buying something in a store.", answer: "legit", explain: "An expected receipt after a real purchase is normal." },
  { id: "sc09", emoji: "🎁", label: "A marketplace buyer offers to overpay you and asks you to refund the difference.", answer: "scam", explain: "The classic 'overpayment' scam — the original payment usually bounces later." },
  { id: "sc10", emoji: "🔐", label: "A website asks you to set up two-factor authentication for extra login security.", answer: "legit", explain: "2FA is a real security feature offered by legitimate services." },
  { id: "sc11", emoji: "📞", label: "An automated call says your identity is 'under investigation' — press 1 immediately.", answer: "scam", explain: "Urgency and threats over an automated call are a common scam tactic." },
  { id: "sc12", emoji: "💼", label: "A job offer promises huge pay for almost no work, and asks for your bank login to 'set up payroll'.", answer: "scam", explain: "No legitimate employer needs your online banking login." },
  { id: "sc13", emoji: "🧑‍💻", label: "A pop-up says your device is infected — call this number immediately to fix it.", answer: "scam", explain: "Scare-tactic pop-ups pushing a phone call are almost always fake." },
  { id: "sc14", emoji: "📦", label: "A tracking text matches a parcel you're actually expecting, from a courier you recognise.", answer: "legit", explain: "If it matches a real order you're expecting, it's likely genuine — still worth checking the link carefully." },
  { id: "sc15", emoji: "🎓", label: "A 'scholarship' asks for an upfront fee before you can receive the money.", answer: "scam", explain: "Real scholarships don't require you to pay to receive them." },
];

if (typeof window !== "undefined") {
  window.NEEDSWANTS_ITEMS = NEEDSWANTS_ITEMS;
  window.SCAM_SCENARIOS = SCAM_SCENARIOS;
}
