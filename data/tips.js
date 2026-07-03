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

  // MORE SAVING
  { id: "t51", category: "saving", text: "Automate it: move money to savings the moment it arrives, before you can spend it." },
  { id: "t52", category: "saving", text: "An emergency fund is money set aside just for surprises — aim for a small cushion first, then grow it." },
  { id: "t53", category: "saving", text: "Saving isn't about being cheap. It's about choosing what matters to you more than today's impulse buy." },
  { id: "t54", category: "saving", text: "Try a no-spend week once a month. It resets your habits and boosts your savings fast." },
  { id: "t55", category: "saving", text: "Keep saving goals visible — on your fridge, phone, or app — out of sight often means out of mind." },
  { id: "t56", category: "saving", text: "When you get a pay rise or bonus, save a chunk of it before your spending catches up to it." },

  // MORE SPENDING
  { id: "t57", category: "spending", text: "Track subscriptions regularly — small monthly charges add up fast when you forget about them." },
  { id: "t58", category: "spending", text: "A wish list works better than an impulse buy. Add it, wait, then decide if it's still worth it." },
  { id: "t59", category: "spending", text: "Free trials aren't free once you forget to cancel. Set a reminder before it converts to a paid plan." },
  { id: "t60", category: "spending", text: "Emotional spending is real — buying something to feel better rarely fixes the actual problem." },
  { id: "t61", category: "spending", text: "Cash can feel more 'real' than tapping a card, which makes it easier to notice when you're overspending." },

  // MORE BUDGETING
  { id: "t62", category: "budgeting", text: "A common starting split is 50% needs, 30% wants, 20% savings — adjust it to fit your own life." },
  { id: "t63", category: "budgeting", text: "Big, irregular costs (like gifts or school trips) are easier if you budget a little for them every month." },
  { id: "t64", category: "budgeting", text: "A budget is a living plan, not a one-time task. Revisit it whenever your income or costs change." },
  { id: "t65", category: "budgeting", text: "If you keep overspending in one category, it's often a sign the budget for it was unrealistic, not that you failed." },
  { id: "t66", category: "budgeting", text: "Zero-based budgeting means giving every dollar a job — including the dollars you plan to save." },
  { id: "t67", category: "budgeting", text: "Building a household budget together, even briefly, helps everyone understand where money is really going." },

  // MORE SMART SHOPPING
  { id: "t68", category: "shopping", text: "Unit pricing (cost per 100g or per item) is the fastest way to compare value between two products." },
  { id: "t69", category: "shopping", text: "Loyalty points are only a good deal if they don't tempt you to spend more than you meant to." },
  { id: "t70", category: "shopping", text: "Buying secondhand or refurbished can get you the same quality for a lot less money." },
  { id: "t71", category: "shopping", text: "'Limited time offer' is designed to rush your decision. A good deal is still good tomorrow." },
  { id: "t72", category: "shopping", text: "Return policies matter — a slightly pricier item with free returns can be the safer buy." },

  // MORE NEEDS VS WANTS
  { id: "t73", category: "needswants", text: "Rent, groceries, and utilities are needs. A bigger apartment than you require is a want layered on a need." },
  { id: "t74", category: "needswants", text: "Wants aren't bad — a life with zero wants met isn't really the goal. Balance is." },
  { id: "t75", category: "needswants", text: "The needs-vs-wants question gets more complex as you grow up — a car might shift from want to need with a job." },

  // MORE EARNING
  { id: "t76", category: "earning", text: "Negotiating your pay or price for a job is a skill — it's okay to ask, calmly and clearly." },
  { id: "t77", category: "earning", text: "A side hustle can turn a hobby into income, but check it doesn't crowd out school, rest, or family time." },
  { id: "t78", category: "earning", text: "Track what you earn as carefully as what you spend. It's easy to lose sight of small, frequent income." },
  { id: "t79", category: "earning", text: "Your first job rarely pays what your tenth will. Experience and skills compound just like savings do." },

  // MORE INVESTING
  { id: "t80", category: "investing", text: "Diversifying means not putting all your money in one place, so one bad outcome doesn't wipe you out." },
  { id: "t81", category: "investing", text: "Interest can work for you (on savings) or against you (on debt) — know which side you're on." },
  { id: "t82", category: "investing", text: "A high-interest debt, like some credit cards, usually costs more than most investments earn — pay that down first." },
  { id: "t83", category: "investing", text: "Understanding what you're investing in matters more than chasing the highest promised return." },
  { id: "t84", category: "investing", text: "Markets go up and down. Long-term investors plan for both, not just the good days." },

  // MORE ONLINE SAFETY
  { id: "t85", category: "safety", text: "Two-factor authentication adds a second lock to your accounts — turn it on wherever money is involved." },
  { id: "t86", category: "safety", text: "Check your bank or app statements regularly so you'd notice quickly if something looked wrong." },
  { id: "t87", category: "safety", text: "A real bank will never ask you to move money to a 'safe account' over the phone. That's a scam script." },
  { id: "t88", category: "safety", text: "Public Wi-Fi isn't the safest place to log into a banking app — wait for a trusted network if you can." },

  // FAMILY / GROWING-UP MONEY SKILLS (useful for teens heading into adulthood, and adults too)
  { id: "t89", category: "budgeting", text: "Understanding your household's bills, even in outline, makes the jump to managing your own a lot less daunting." },
  { id: "t90", category: "saving", text: "A credit score is basically a trust score for money — paying bills on time, every time, is what builds it." },
  { id: "t91", category: "spending", text: "Bank fees are a hidden leak — check your statement occasionally for charges you didn't expect." },
  { id: "t92", category: "investing", text: "Superannuation or retirement accounts grow quietly for decades — starting even small contributions early makes a real difference." },
  { id: "t93", category: "budgeting", text: "Splitting shared costs fairly, and talking about money openly, prevents most money arguments before they start." },
  { id: "t94", category: "earning", text: "A payslip is worth reading properly — knowing what's deducted and why helps you plan around what actually lands in your account." },
  { id: "t95", category: "saving", text: "Setting a joint goal with someone you trust — a trip, a gift, an emergency fund — can make saving feel like teamwork." },
  { id: "t96", category: "shopping", text: "Big purchases (cars, appliances) reward research. A week of comparing options can save real money." },
  { id: "t97", category: "safety", text: "Shredding or securely deleting old financial documents protects you from identity theft long after you've stopped needing them." },
  { id: "t98", category: "investing", text: "'Get rich quick' offers almost always benefit the person selling them more than the person buying in." },
  { id: "t99", category: "budgeting", text: "Reviewing your money once a month, calendar reminder and all, keeps small problems from becoming big ones." },
  { id: "t100", category: "needswants", text: "As responsibilities grow, so does the needs list — the skill of telling the two apart never stops being useful." },

  // ROUND THREE — MORE SAVING
  { id: "t101", category: "saving", text: "Naming a savings account or jar after your goal makes it feel closer and easier to stick with." },
  { id: "t102", category: "saving", text: "Saving windfalls — birthday money, tax refunds, bonuses — before you get used to having them works better than saving from routine income alone." },
  { id: "t103", category: "saving", text: "A savings streak works like any habit streak: the goal isn't perfection, it's not breaking it too many times in a row." },
  { id: "t104", category: "saving", text: "Separate 'safety net' savings from 'fun goal' savings — mixing them makes it too easy to dip into an emergency fund for a treat." },
  { id: "t105", category: "saving", text: "Saving 10% might sound small, but it's a habit that scales — the percentage matters more than the dollar amount when you're starting out." },

  // MORE SPENDING
  { id: "t106", category: "spending", text: "A 'cooling off' list works for adults too — add the urge, revisit it in a week, buy only what you still want." },
  { id: "t107", category: "spending", text: "Comparing your spending to friends is a losing game — everyone's budget and goals are different, even if it doesn't look that way." },
  { id: "t108", category: "spending", text: "Working out cost 'per use' (like cost per wear) can turn an expensive item into a good buy — or reveal it isn't." },
  { id: "t109", category: "spending", text: "Convenience has a price. Delivery fees and rush shipping add up fast if they become the default instead of the exception." },

  // MORE BUDGETING
  { id: "t110", category: "budgeting", text: "A budget you're embarrassed to show anyone is usually a budget that's hiding a habit worth looking at honestly." },
  { id: "t111", category: "budgeting", text: "Sinking funds — small monthly amounts set aside for known future costs — turn 'surprise' expenses into ones you already planned for." },
  { id: "t112", category: "budgeting", text: "Budgeting apps and spreadsheets are just tools. The habit of checking in regularly matters far more than which tool you use." },
  { id: "t113", category: "budgeting", text: "If a budget keeps failing in the same spot, redesign that part rather than blaming yourself for not following it." },

  // MORE SMART SHOPPING
  { id: "t114", category: "shopping", text: "Reading a few real reviews, not just the star rating, often reveals whether a product actually suits how you'll use it." },
  { id: "t115", category: "shopping", text: "Waiting for seasonal sales on things you already planned to buy (like end-of-season clothes) is smart shopping, not impulse shopping." },
  { id: "t116", category: "shopping", text: "A discount code that only works with a bigger cart total is designed to make you spend more, not less." },

  // MORE NEEDS VS WANTS
  { id: "t117", category: "needswants", text: "Transport can be a need, but the specific vehicle you drive is often a want layered on top of that need." },
  { id: "t118", category: "needswants", text: "Wanting to keep up appearances is a real feeling, but it isn't the same as needing to." },

  // MORE EARNING
  { id: "t119", category: "earning", text: "Freelancing, tutoring, or selling things you've made are all modern ways to turn a skill into income." },
  { id: "t120", category: "earning", text: "Asking for feedback after a job, paid or not, helps you get better and often leads to more opportunities." },
  { id: "t121", category: "earning", text: "Multiple small income streams can add up to real stability, even if none of them alone feels like much." },

  // MORE INVESTING
  { id: "t122", category: "investing", text: "Dollar-cost averaging just means investing a fixed amount regularly, regardless of price — it takes the guesswork out of timing." },
  { id: "t123", category: "investing", text: "Fees quietly eat into investment returns over decades — it's worth knowing roughly what you're being charged and why." },
  { id: "t124", category: "investing", text: "'Past performance' in an investment ad is exactly that — past. It's not a promise about what happens next." },
  { id: "t125", category: "investing", text: "A financial goal with a clear timeline (5 years, 20 years) helps you choose investments that actually match it." },

  // MORE ONLINE SAFETY
  { id: "t126", category: "safety", text: "A sense of urgency — 'act now or lose this deal' — is one of the most common pressure tactics scammers use." },
  { id: "t127", category: "safety", text: "Double-check a payment request from someone you know by contacting them a different way — accounts do get hacked or spoofed." },
  { id: "t128", category: "safety", text: "Screenshotting or saving proof of a transaction is a small habit that makes disputing a problem much easier later." },

  // MORE FAMILY / GROWING-UP MONEY SKILLS
  { id: "t129", category: "budgeting", text: "Talking openly about money with people you trust, instead of guessing what's normal, usually reduces stress rather than adding to it." },
  { id: "t130", category: "saving", text: "An emergency fund exists so a surprise bill becomes an inconvenience, not a crisis — even a small one changes how a bad week feels." },
  { id: "t131", category: "investing", text: "Understanding roughly how insurance, tax, and interest work isn't exciting, but it quietly protects nearly every other financial decision you make." },
  { id: "t132", category: "spending", text: "A rent or mortgage payment is usually the biggest single spending decision most people make — it's worth taking time to get it right." },
  { id: "t133", category: "earning", text: "Understanding your own pay, benefits, and any entitlements is a skill in itself, separate from earning the income in the first place." },
  { id: "t134", category: "shopping", text: "Cancelling something you no longer use is just as much a money skill as choosing what to buy in the first place." },
  { id: "t135", category: "safety", text: "Reviewing account access and shared logins occasionally is a healthy habit once money and family accounts start to overlap." },
  { id: "t136", category: "needswants", text: "As life gets more complex, so does the needs-vs-wants question — revisiting it regularly matters more than getting it perfect once." },

  // ROUND FOUR — QUICK, PRACTICAL, VARIED
  { id: "t137", category: "saving", text: "Set a savings 'floor' — a minimum you never dip below — so a good week of spending doesn't undo months of saving." },
  { id: "t138", category: "spending", text: "A grocery list written before you're hungry leads to very different choices than one written in the store." },
  { id: "t139", category: "budgeting", text: "Colour-coding or labelling spending categories makes patterns jump out faster than scrolling through a plain list of numbers." },
  { id: "t140", category: "shopping", text: "Asking 'do I already own something that does this job?' before buying something new saves more money than most discounts do." },
  { id: "t141", category: "needswants", text: "A 'want' today can become tomorrow's 'need' as circumstances change — the categories aren't fixed forever." },
  { id: "t142", category: "earning", text: "Reliability — showing up, doing what you said you would — is often what turns a one-off job into a repeat one." },
  { id: "t143", category: "investing", text: "Reinvesting what you earn, instead of spending it immediately, is one of the simplest ways compound growth builds momentum." },
  { id: "t144", category: "safety", text: "If something feels rushed, secretive, or too good to be true online, it's worth slowing down before you act on it." },
  { id: "t145", category: "saving", text: "Progress you can see — a chart, a jar filling up, a bar on a screen — keeps motivation going better than a number alone." },
  { id: "t146", category: "budgeting", text: "A monthly 'money date' with yourself, even just ten quiet minutes, keeps your plan connected to what's actually happening." },
  { id: "t147", category: "spending", text: "Treats spent on purpose feel different from treats bought on autopilot — the planning is what keeps them feeling special." },
  { id: "t148", category: "shopping", text: "A high price doesn't always mean high quality, and a low price doesn't always mean poor quality — check, don't assume." },
  { id: "t149", category: "earning", text: "Turning down a bad opportunity is sometimes as valuable as saying yes to a good one — your time has worth too." },
  { id: "t150", category: "investing", text: "Nobody gets every investment right — the goal is a plan that still works out even when some choices don't." },

  // ROUND FIVE — MORE SAVING
  { id: "t151", category: "saving", text: "A 'save the difference' habit — rounding purchases up and banking the change — turns everyday spending into quiet saving." },
  { id: "t152", category: "saving", text: "Saving for something specific tends to beat saving 'just because' — a clear picture in your head keeps you motivated." },
  { id: "t153", category: "saving", text: "It's fine to pause a savings goal during a tough month — restarting matters far more than never having paused." },
  { id: "t154", category: "saving", text: "Two smaller goals running at once can feel more motivating than one big distant one — pick whatever keeps you moving." },

  // MORE SPENDING
  { id: "t155", category: "spending", text: "Unsubscribing from marketing emails cuts down on the constant nudges to buy things you weren't actually planning to." },
  { id: "t156", category: "spending", text: "A 'want it, don't need it yet' shelf — mental or literal — is a gentle way to slow down casual spending." },
  { id: "t157", category: "spending", text: "Spending to impress people you don't know well rarely pays off the way it feels like it will in the moment." },

  // MORE BUDGETING
  { id: "t158", category: "budgeting", text: "A budget with too many tiny categories gets abandoned fast — a handful of broad ones is usually easier to keep up." },
  { id: "t159", category: "budgeting", text: "Budgeting for 'fun money' with no questions asked, even a small amount, makes the rest of the budget easier to stick to." },
  { id: "t160", category: "budgeting", text: "Irregular income (like tips or freelance work) budgets better off your lowest typical month than your best one." },

  // MORE SMART SHOPPING
  { id: "t161", category: "shopping", text: "Waiting until you actually need something, rather than stockpiling 'just in case', usually saves both money and storage space." },
  { id: "t162", category: "shopping", text: "A product with better reviews for durability can be cheaper long-term than a flashier one that needs replacing sooner." },
  { id: "t163", category: "shopping", text: "Shopping with a firm total in mind, decided before you start, makes it much easier to say no to extras." },

  // MORE NEEDS VS WANTS
  { id: "t164", category: "needswants", text: "Comfort matters, but 'comfortable' and 'necessary' aren't always the same thing — it's worth noticing which one is driving a purchase." },
  { id: "t165", category: "needswants", text: "A single, well-chosen want can bring more lasting satisfaction than several impulsive smaller ones for the same total money." },

  // MORE EARNING
  { id: "t166", category: "earning", text: "Learning to say what you're worth, calmly and with reasons, is a skill that pays off across an entire working life." },
  { id: "t167", category: "earning", text: "Odd jobs that seem small now — mowing lawns, tutoring, pet-sitting — are often where people first learn to manage their own money." },
  { id: "t168", category: "earning", text: "Consistency in a side job or gig often earns more trust, and better opportunities, than raw talent alone." },

  // MORE INVESTING
  { id: "t169", category: "investing", text: "Understanding the difference between saving (safe, low growth) and investing (some risk, potential for more growth) helps you pick the right tool for each goal." },
  { id: "t170", category: "investing", text: "A long time horizon is one of the few real advantages a young investor has over an older one — it's worth using." },
  { id: "t171", category: "investing", text: "Panic-selling during a market dip often locks in a loss that a little patience would have avoided." },

  // MORE ONLINE SAFETY
  { id: "t172", category: "safety", text: "A payment app's 'request money' feature can be abused by scammers pretending to send you money — always check who's really asking." },
  { id: "t173", category: "safety", text: "Using a unique password for financial accounts means one leaked password elsewhere can't be used to break into your money." },
  { id: "t174", category: "safety", text: "If a 'friend' online suddenly asks to borrow money urgently, it's worth verifying it's really them before sending anything." },

  // MORE FAMILY / GROWING-UP
  { id: "t175", category: "budgeting", text: "Knowing the rough cost of running a household — rent, power, groceries, insurance — makes moving out feel far less like a mystery." },
  { id: "t176", category: "saving", text: "A first payslip is a good moment to start a savings habit, before spending on a new income level becomes the default." },
  { id: "t177", category: "investing", text: "Employer retirement contributions, where available, are often close to free money — it's worth understanding what you're entitled to." },
  { id: "t178", category: "spending", text: "Big life costs — a car, a first home, a wedding — go smoother when they're planned for years ahead, not weeks." },
  { id: "t179", category: "safety", text: "Keeping a simple list of accounts, subscriptions, and who has access to what makes managing money as an adult far less chaotic." },

  // ROUND SIX — QUICK & VARIED
  { id: "t180", category: "saving", text: "A visual thermometer or progress bar for a goal turns an abstract number into something that feels like real momentum." },
  { id: "t181", category: "budgeting", text: "The best budget is the one you'll actually keep using — simple and imperfect beats detailed and abandoned." },
  { id: "t182", category: "spending", text: "Asking 'would I still buy this if it weren't on sale?' cuts through most sale-driven impulse purchases instantly." },
  { id: "t183", category: "needswants", text: "Wants aren't the enemy of good money habits — unplanned wants, bought without a second thought, usually are." },
  { id: "t184", category: "earning", text: "Tracking hours worked against money earned helps you notice if a 'good deal' job is actually paying what you think it is." },
  { id: "t185", category: "investing", text: "A diversified plan doesn't promise no losses — it just means one bad pick is unlikely to sink the whole plan." },
  { id: "t186", category: "safety", text: "A locked phone and a locked wallet deserve the same level of care — both hold direct access to your money." },
  { id: "t187", category: "shopping", text: "Buying in bulk only saves money if you'll actually use it all before it expires or goes out of style." },
  { id: "t188", category: "saving", text: "Celebrating hitting 25%, 50%, and 75% of a goal — not just 100% — keeps long goals from feeling like a slog." },
  { id: "t189", category: "budgeting", text: "A shared household budget works best when everyone can see it, not just the person who built it." },
  { id: "t190", category: "spending", text: "Impulse purchases often solve a mood, not a need — a short walk can be a cheaper fix for both." },
  { id: "t191", category: "needswants", text: "A 'need' framed with urgency ('I need this now') is worth a second look — real needs rarely have to be decided in seconds." },
  { id: "t192", category: "earning", text: "The first time you negotiate anything — a price, a wage, a deal — is the hardest. It gets easier with practice." },
  { id: "t193", category: "investing", text: "Automating investment contributions removes the temptation to 'wait for a better time', which often just means waiting forever." },
  { id: "t194", category: "safety", text: "A quick search of a company's name plus 'scam' before paying them anything unfamiliar takes seconds and can save a lot of trouble." },
  { id: "t195", category: "shopping", text: "The most expensive option in a store is sometimes placed at eye level on purpose — it pays to glance at the whole shelf." },
  { id: "t196", category: "saving", text: "Consistency beats intensity — saving a little every week usually outperforms saving a lot occasionally, because it actually keeps happening." },
  { id: "t197", category: "budgeting", text: "A 'no-spend day' challenge, tried occasionally, is a quick way to notice how many small purchases happen on autopilot." },
  { id: "t198", category: "spending", text: "Trading time for money works both ways — spending money to buy back time is sometimes the smarter trade, not always the wasteful one." },
  { id: "t199", category: "needswants", text: "Revisiting an old 'must-have want' a few months later often reveals it mattered far less than it felt like at the time." },
  { id: "t200", category: "investing", text: "Learning how money grows, even slowly, is one investment that never loses value — the knowledge stays useful for life." },
];

if (typeof window !== "undefined") window.TIPS = TIPS;
