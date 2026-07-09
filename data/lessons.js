/* Savvio — Lesson content bank */
const LESSONS = [
  {
    id: "l-saving", title: "Saving Money", category: "saving", icon: "🌱",
    summary: "Why saving matters and how to make it a habit.",
    sections: [
      { heading: "What is saving?", body: "Saving means keeping some of your money instead of spending all of it right away. It's like planting a seed today so you have something bigger later." },
      { heading: "Why it matters", body: "Saving gives you choices. It lets you buy bigger things you really want, handle surprises, and feel less stressed about money." },
      { heading: "How to start", body: "Try 'pay yourself first' — as soon as you get money, put a little aside before you spend anything. Even $1 a week grows over time." },
      { heading: "Try it", body: "Pick one small goal, like a $20 item. Decide how much you'll save each week, and watch your progress bar fill up on your dashboard." }
    ]
  },
  {
    id: "l-spending", title: "Spending Wisely", category: "spending", icon: "🛍️",
    summary: "How to make your money go further.",
    sections: [
      { heading: "Spending isn't bad", body: "Spending money is normal and okay — the goal isn't to never spend, it's to spend on purpose instead of by accident." },
      { heading: "Pause before you buy", body: "Try the 24-hour rule for anything unplanned: wait a day. If you still want it and can afford it, go for it." },
      { heading: "Value over price", body: "Cheaper isn't always better, and expensive isn't always best. Think about how much use or joy something will really give you." },
      { heading: "Try it", body: "Next time you want to buy something, ask yourself: 'Will this still matter to me next week?' before deciding." }
    ]
  },
  {
    id: "l-budgeting", title: "Budgeting Basics", category: "budgeting", icon: "📊",
    summary: "Making a simple plan for your money.",
    sections: [
      { heading: "What is a budget?", body: "A budget is just a plan that shows money coming in (income) and money going out (spending), so you always know where you stand." },
      { heading: "The three jars idea", body: "A simple way to budget is splitting new money into three parts: some to save, some to spend, and some to share or give." },
      { heading: "Weekly check-ins", body: "Spend five minutes each week looking at what you earned and spent. Small check-ins prevent big surprises." },
      { heading: "Try it", body: "Open the Budget page and log your next bit of pocket money or allowance as income — that's your first budgeting habit started." }
    ]
  },
  {
    id: "l-needswants", title: "Needs vs Wants", category: "needswants", icon: "⚖️",
    summary: "Telling the difference between what you need and what you want.",
    sections: [
      { heading: "What's a need?", body: "A need is something you must have to stay healthy, safe, or able to learn — like food, basic clothing, or school supplies." },
      { heading: "What's a want?", body: "A want is something nice to have but not essential — like the newest game, extra toys, or brand-name items." },
      { heading: "The overlap", body: "Sometimes something is partly a need and partly a want — you need shoes, but you might want an extra fancy pair on top of that." },
      { heading: "Try it", body: "Ask yourself: 'What happens if I skip this?' If the answer is nothing serious, it's probably a want." }
    ]
  },
  {
    id: "l-earning", title: "Earning Money", category: "earning", icon: "💪",
    summary: "Ways to earn your own money and why it matters.",
    sections: [
      { heading: "Where earning starts", body: "Chores, helping neighbours, small jobs, or part-time work are all ways people earn money — often starting small and growing over time." },
      { heading: "Skills open doors", body: "The more skills you build, the more ways you can find to earn — from babysitting to tutoring to future careers." },
      { heading: "Why earned money feels different", body: "Money you've worked for often feels more valuable, because you know exactly what it took to get it." },
      { heading: "Try it", body: "Think of one small task you could offer to do this week to earn a bit of money, then log it as income when you do." }
    ]
  },
  {
    id: "l-investing", title: "Investing Basics", category: "investing", icon: "🌳",
    summary: "A first look at how money can grow over time.",
    sections: [
      { heading: "What is investing?", body: "Investing means putting money into something — like a savings account with interest, or shares in a company — so it can grow over time." },
      { heading: "Compound growth", body: "When your money earns a little extra over time, and that extra also starts earning more, it's called compound growth. It's like a snowball rolling downhill." },
      { heading: "Time matters most", body: "The earlier you start, even with small amounts, the longer your money has to grow. Starting at 12 has a big head start over starting at 30." },
      { heading: "Keep it safe", body: "Investing is a long-term tool, not a quick-money trick. Never trust anyone promising fast, guaranteed riches." }
    ]
  },
  {
    id: "l-shopping", title: "Smart Shopping", category: "shopping", icon: "🛒",
    summary: "Getting the most value for your money.",
    sections: [
      { heading: "Compare before you buy", body: "Check prices at more than one shop, or compare a few products, before spending on something bigger." },
      { heading: "Watch for sale traps", body: "A sale is only a good deal if you were already planning to buy that item — otherwise it's just spending you didn't plan." },
      { heading: "Price per item", body: "A bigger pack isn't always cheaper per item. Do a quick check before assuming the large size is the best value." },
      { heading: "Try it", body: "Next time you're shopping with a parent, try comparing two similar products and guess which is the better value." }
    ]
  },
  {
    id: "l-safety", title: "Online Financial Safety", category: "safety", icon: "🛡️",
    summary: "Staying safe with money online.",
    sections: [
      { heading: "Keep your PIN secret", body: "Never share your PIN, password, or card details with anyone — not friends, not strangers, not even someone claiming to be from a bank." },
      { heading: "Spotting scams", body: "If a message promises free money, a prize, or fast riches — especially if it asks you to pay first — it's almost always a scam." },
      { heading: "Ask a trusted adult", body: "Before entering any payment details online, or if something feels off, always check with a parent or trusted adult first." },
      { heading: "Secure sites", body: "Look for a padlock icon in your browser before entering payment information — it's a sign the site is more secure." }
    ]
  },
  {
    id: "l-credit", title: "Credit, Loans & BNPL", category: "credit", icon: "💳",
    summary: "How borrowing money actually works, and what it costs.",
    sections: [
      { heading: "What is credit?", body: "Credit means borrowing money now and agreeing to pay it back later — usually with extra cost added on, called interest." },
      { heading: "Credit cards", body: "A credit card lets you buy now and pay later. If you pay the full balance every month, it can be free to use. If you don't, interest charges add up fast — often much faster than most savings accounts earn." },
      { heading: "Loans", body: "A loan is a lump sum you borrow and pay back over time, usually with interest. Bigger loans (like for a car or a home) usually take years to repay." },
      { heading: "Buy Now, Pay Later (BNPL)", body: "BNPL splits a purchase into smaller payments with no interest — but missed payments often bring fees, and it's still money you don't have yet. Easy approval doesn't mean it's free." },
      { heading: "Try it", body: "Before borrowing for anything, ask: what's the total cost including interest or fees, and what happens if a payment is late?" }
    ]
  },
  {
    id: "l-insurance", title: "Insurance Basics", category: "insurance", icon: "🛟",
    summary: "Paying a little now so a big loss doesn't wreck your finances later.",
    sections: [
      { heading: "What is insurance?", body: "Insurance is a deal: you pay a smaller regular amount (a premium), and the insurer covers a much bigger cost if something goes wrong, like an accident, illness, or damaged property." },
      { heading: "Why it exists", body: "Without insurance, one bad event — a car crash, a hospital visit, a house fire — could undo years of saving. Insurance spreads that risk out." },
      { heading: "Common types", body: "Health, car, home/contents, and travel insurance are common examples. Different types cover different risks, and you usually only need the ones relevant to what you actually own or do." },
      { heading: "Try it", body: "Next time you hear about an insurance type, ask: what specific risk is this protecting against, and is that a risk that matters to me right now?" }
    ]
  },
  {
    id: "l-aussie", title: "Australian Money Basics", category: "aussie", icon: "🇦🇺",
    summary: "Local money terms every young Australian eventually runs into.",
    sections: [
      { heading: "Superannuation (super)", body: "Super is money your employer puts aside for your retirement, on top of your wage. It's invested and grows over decades — even small amounts from a first casual job add up by retirement age." },
      { heading: "Tax File Number (TFN) & tax basics", body: "A TFN identifies you to the tax system. Without one, more tax gets taken from your pay than necessary. Most people get some of it back at tax time if they've overpaid through the year." },
      { heading: "GST", body: "GST (Goods and Services Tax) is a 10% tax added to most things you buy in Australia. The price you see on the shelf almost always already includes it." },
      { heading: "HECS-HELP", body: "HECS-HELP is a loan from the government that covers university course fees. You only start repaying it once your income passes a certain threshold — it comes out of your pay automatically like tax." },
      { heading: "Youth Allowance & Centrelink", body: "Youth Allowance is government income support some students and young people can apply for. Centrelink is the government service that manages payments like this — worth knowing they exist, even if you don't need them yet." },
      { heading: "Try it", body: "This is a starting point, not full advice — the details (thresholds, rates, eligibility) change over time, so always check the current rules on the relevant government website when it actually matters to you." }
    ]
  }
];

if (typeof window !== "undefined") window.LESSONS = LESSONS;
