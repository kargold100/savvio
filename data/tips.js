/* Savvio — Daily Tips content bank
   Categories: saving, spending, budgeting, shopping, needswants, earning, investing, safety
   Rule: max 25 words, simple language, positive tone. */
const TIPS = [
  // SAVING
  { id: "t01", category: "saving", text: "Every coin you save today is a gift to future you. Start small, save often." },
  { id: "t02", category: "saving", text: "Try the 24-hour rule: wait a day before buying something you didn't plan for." },
  { id: "t03", category: "saving", text: "Give your savings a job. A goal with a name is easier to stick to than 'just saving'." },
  { id: "t04", category: "saving", text: "Save first, spend what's left. Flip the order and saving gets a lot easier." },
  { id: "t05", category: "saving", text: "A piggy bank you can see helps more than one you forget about." },
  { id: "t06", category: "saving", text: "Small amounts add up. Saving $2 a week is $104 in a year." },
  { id: "t07", category: "saving", text: "Celebrate every deposit, not just the finish line. Progress deserves a mini high-five." },
  { id: "t08", category: "saving", text: "Round up your spare change into savings. You barely notice it's gone." },

  // SPENDING
  { id: "t09", category: "spending", text: "Before you buy, ask: will I still want this next week?" },
  { id: "t10", category: "spending", text: "Spending fast feels good for a minute. Spending wisely feels good for longer." },
  { id: "t11", category: "spending", text: "Make a short list before you shop. Lists keep impulse buys out of your cart." },
  { id: "t12", category: "spending", text: "It's okay to spend on fun things — just plan for them instead of surprising yourself." },
  { id: "t13", category: "spending", text: "Check the price per item, not just the total. Bigger isn't always cheaper." },
  { id: "t14", category: "spending", text: "Sleep on big purchases. A clear head makes better spending calls than an excited one." },

  // BUDGETING
  { id: "t15", category: "budgeting", text: "A budget isn't a cage — it's a plan that tells your money where to go." },
  { id: "t16", category: "budgeting", text: "Track every dollar for one week. You'll be surprised what you learn." },
  { id: "t17", category: "budgeting", text: "Split new money into three jars: save, spend, and share." },
  { id: "t18", category: "budgeting", text: "A budget that's too strict rarely lasts. Leave a little room for fun." },
  { id: "t19", category: "budgeting", text: "Review your budget every week — five minutes now saves surprises later." },
  { id: "t20", category: "budgeting", text: "If spending is more than income, something has to change — spend less or earn more." },
  { id: "t21", category: "budgeting", text: "Budgeting is just deciding in advance. Decide now, relax later." },

  // SMART SHOPPING
  { id: "t22", category: "shopping", text: "Compare prices at two shops before buying something expensive." },
  { id: "t23", category: "shopping", text: "Sales aren't a deal if you weren't going to buy it anyway." },
  { id: "t24", category: "shopping", text: "Ask yourself: am I buying this because I need it, or because it's on sale?" },
  { id: "t25", category: "shopping", text: "Store brands are often the same quality as name brands, for less money." },
  { id: "t26", category: "shopping", text: "A coupon only saves money if you were already planning to buy the item." },
  { id: "t27", category: "shopping", text: "Buying quality once can beat buying cheap three times." },

  // NEEDS VS WANTS
  { id: "t28", category: "needswants", text: "A need keeps you fed, safe, or healthy. A want just makes life more fun." },
  { id: "t29", category: "needswants", text: "It's fine to spend on wants — just pay for needs first." },
  { id: "t30", category: "needswants", text: "School shoes are a need. A tenth pair of sneakers is a want." },
  { id: "t31", category: "needswants", text: "When you're unsure if it's a need, ask: what happens if I skip it?" },
  { id: "t32", category: "needswants", text: "Wants change all the time. Needs mostly stay the same." },

  // EARNING
  { id: "t33", category: "earning", text: "Chores, odd jobs, and helping neighbours are all ways to earn your own money." },
  { id: "t34", category: "earning", text: "The more skills you learn, the more ways you'll find to earn." },
  { id: "t35", category: "earning", text: "Money earned by your own effort often feels more valuable than money you're given." },
  { id: "t36", category: "earning", text: "Every big earner started with a first small job. Yours counts too." },
  { id: "t37", category: "earning", text: "Ask for jobs, don't wait for them. Most opportunities start with a question." },

  // INVESTING BASICS
  { id: "t38", category: "investing", text: "Investing means putting money to work so it can grow over time." },
  { id: "t39", category: "investing", text: "The earlier you start investing, even a little, the more time your money has to grow." },
  { id: "t40", category: "investing", text: "Investing isn't gambling. Gambling is luck — investing is patience and a plan." },
  { id: "t41", category: "investing", text: "Compound growth means your money can earn money, and that money can earn more." },
  { id: "t42", category: "investing", text: "Never invest money you might need next week. Investing is a long game." },
  { id: "t43", category: "investing", text: "If a return sounds too good to be true, it usually is." },

  // ONLINE SAFETY
  { id: "t44", category: "safety", text: "Never share your PIN, password, or bank details with anyone online — not even a friend." },
  { id: "t45", category: "safety", text: "If a stranger online offers you free money, it's almost always a trick." },
  { id: "t46", category: "safety", text: "Always ask a trusted adult before entering payment details on a website." },
  { id: "t47", category: "safety", text: "A real prize never asks you to pay a fee first." },
  { id: "t48", category: "safety", text: "Check that a shopping site is secure before you buy — look for the padlock icon." },
  { id: "t49", category: "safety", text: "Think before you click. Scam links often look almost exactly like real ones." },
  { id: "t50", category: "safety", text: "Your money app password should be strong and different from your other passwords." },
];

if (typeof window !== "undefined") window.TIPS = TIPS;
