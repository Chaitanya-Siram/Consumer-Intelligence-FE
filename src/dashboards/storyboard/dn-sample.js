// Placeholder payload for the Dominant Narratives storyboard.
//
// This is the shape the backend is expected to return under
// `chartsData.dominant_narratives` (contract: docs/ci-lens-contract-dominant-narratives.md).
// Until then the screen renders this sample (Gen-Z student credit cards, deck
// pages 18–22) with a "Sample data" pill. Every value is replaceable.
//
// Prose may contain <mark>…</mark> highlights. Bullets flagged `ext: true` are
// secondary-research facts that cannot come from tagged posts; the frontend
// marks them "external".

export const DN_SAMPLE = {
  meta: {
    brand: "Discover",
    category: "Gen-Z Student Credit Cards",
    window: "Jan – Jun 2024",
    total_mentions: 5240,
    logos: {},               // backend fills { "Discover": "https://…", … }
    is_sample: true,
  },

  tabs: [
    { id: "t1", label: "Usage & Engagement" },
    { id: "t2", label: "Landscape Observations" },
    { id: "t3", label: "Current Landscape" },
    { id: "t4", label: "Audience Outlook" },
  ],

  footer: [
    "Dominant Narratives · Landscape Analysis",
    "Sample data — values will be replaced by the session's tagged posts",
  ],

  // ---------------------------------------------------------------- tab 1 (p19)
  usage: {
    banner: {
      eyebrow: "Category Landscape",
      headline: "Cards cover essentials first, lifestyle second",
      sub:
        "Students predominantly use credit cards to cover college essentials like books and fees, living expenses such as housing and transportation, nonessential spending on dining and shopping, impulsive purchases, and miscellaneous expenses.",
      stats: [
        { value: "3", label: "Narrative groups" },
        { value: "5,240", label: "Posts analysed" },
        { value: "Essentials", label: "Top use case" },
        { value: "42%", label: "Mention credit history" },
      ],
    },
    note: "Three narrative groups drawn from the tagged posts. Bullets marked external come from secondary research, not from posts.",
    summary:
      "Students predominantly use credit cards to cover college essentials like books and fees, living expenses such as housing and transportation, nonessential spending on dining and shopping, impulsive purchases, and miscellaneous expenses.",
    keywords: ["college essentials", "living expenses", "dining & shopping", "impulsive purchases", "authorized user"],
    groups: [
      {
        title: "Usage patterns",
        points: [
          { text: "Students incurred credit card debt primarily for paying <mark>college essentials</mark> such as books and fees, covering living expenses like housing, transportation costs, nonessential spending on dining and shopping, impulsive purchases, and other miscellaneous expenses." },
          { text: "In a mid-August survey from U.S. News & World Report of undergraduate students, over four in 10 say they currently have credit card debt, with over 53% having a card in their own name and 19% having access as an <mark>authorized user</mark>.", ext: true },
          { text: "A U.S. News survey conducted in August 2023 revealed that 42.1% of undergraduate college students have credit card debt. Of those, more than 28% owe $2,000 or more.", ext: true },
        ],
      },
      {
        title: "Usage engagement",
        points: [
          { text: "An article from 2024 reported that 24% of college students with credit cards said they used them due to a <mark>lack of other financial resources</mark>.", ext: true },
          { text: "College students allocate the majority of their credit card spending to <mark>online purchases</mark>, eating out, gas, groceries, travel, and other." },
        ],
      },
      {
        title: "Card perception",
        points: [
          { text: "Having a student credit card can both establish your <mark>credit history and score</mark>, providing financial backup for emergencies while necessitating responsible usage to avoid debt or negative credit outcomes." },
          { text: "Students value user-friendly credit cards offering free credit scores, spending alerts, and international use perks. They appreciate building credit through <mark>parental authorization</mark> and praise rewards but criticize high fees and customer service issues." },
        ],
      },
    ],
  },

  // ---------------------------------------------------------------- tab 2 (p20)
  observations: {
    banner: {
      eyebrow: "Landscape Observations",
      headline: "Why they need it, how they feel, why they hold more than one",
      sub: "Overall student credit card landscape analysis: the five questions the conversation keeps answering, and what the brand can do with them.",
      stats: [
        { value: "5", label: "Questions" },
        { value: "4", label: "Insight columns" },
        { value: "1", label: "Recommendation set" },
      ],
    },
    note: "Each column is a recurring question in the corpus. The last column is the recommendation derived from the other four.",
    columns: [
      {
        q: "Why do students need credit cards?",
        points: [
          "Students need credit cards to <mark>build credit history</mark>, manage finances independently, take advantage of rewards and benefits, and handle emergency expenses.",
          "They also use them for <mark>convenience in everyday purchases</mark> and to develop financial responsibility.",
        ],
      },
      {
        q: "What is their general perception and emotion around student credit cards?",
        points: [
          "Student credit cards are valuable tools for building credit history, <mark>gaining financial independence</mark>, and accessing rewards.",
          "However, students also experience anxiety and caution about <mark>potential debt, high interest rates, and fees</mark>, highlighting the importance of financial literacy and responsible usage.",
        ],
      },
      {
        q: "What motivates students to choose more than one credit card?",
        points: [
          "Students may choose more than one card to take advantage of: <mark>rewards</mark>, managing credit limits, building credit history, backup in emergencies, introductory offers, ensuring acceptance, and specific card features.",
        ],
      },
      {
        q: "How do students decide which card to use, from the basket they possess?",
        points: [
          "The primary consideration is often the <mark>rewards and benefits</mark> offered by each card.",
          "Students may choose the card that offers the <mark>highest rewards or cashback rate</mark> on the type of purchase they are making.",
        ],
      },
      {
        q: "Recommendations on how to engage with students to use credit cards",
        reco: true,
        points: [
          "Discuss strategies for <mark>using credit responsibly</mark>, such as keeping credit utilization low and avoiding unnecessary debt.",
          "Provide practical tips for managing credit cards, such as <mark>setting up automatic payments</mark>, monitoring statements, and reviewing credit reports regularly.",
        ],
      },
    ],
  },

  // ---------------------------------------------------------------- tab 3 (p21)
  landscape: {
    banner: {
      eyebrow: "Current Landscape",
      headline: "Discover leads the student-card conversation on X",
      sub:
        "The Discover it® Student Cash Back has been praised for its generous rewards, lack of fees, and ability to help students build credit. While the rotating 5% categories require activation, the cash back match in the first year provides significant value.",
      stats: [
        { value: "58%", label: "Share on X" },
        { value: "38%", label: "Top issuer share" },
        { value: "5", label: "Issuers tracked" },
        { value: "#1", label: "Rank among issuers" },
      ],
    },
    sec_title: "Where the conversation lives, and who leads it",
    note: "Platform share is the split of tagged posts by source. Issuer share counts posts naming each brand; a post can name more than one.",
    platforms: [
      { name: "X", pct: 58 },
      { name: "Tumblr", pct: 20 },
      { name: "Forums", pct: 17 },
      { name: "Blogs", pct: 4 },
      { name: "Review", pct: 1 },
    ],
    issuers: [
      { name: "Discover", pct: 38, is_brand: true },
      { name: "Chase", pct: 24 },
      { name: "Capital One", pct: 14 },
      { name: "Bank of America", pct: 10 },
      { name: "Others", pct: 14 },
    ],
    callouts: [
      { key: "volume", title: "Discover it® Student Cash Back", text: "Credit card had the highest social media volumes vis-à-vis other credit cards." },
      { key: "award", title: "Ranked among the best", text: "Ranked as one of the Best Credit Cards for Students." },
    ],
    goods_title: "Discover credit cards · what is going good?",
    goods_lead: "The Discover it® Student Cash Back credit card is performing well and receiving positive recognition in the USA in 2024.",
    goods: [
      { key: "rewards", title: "Generous Cash Back Rewards", text: "Consumers earn 5% cash back on rotating quarterly categories. It automatically matches all cash back earned in the first year." },
      { key: "fee", title: "No Annual Fee and Easy Approval", text: "No annual fee or credit score required to apply. Designed for students with limited credit history to build credit." },
      { key: "benefit", title: "Additional Benefit", text: "0% intro APR on purchases for 6 months, then variable APR of 18.24% – 27.24%. Includes free access to FICO credit score and no foreign transaction fees." },
      { key: "award", title: "Awards and Recognition", text: "Recognized as one of the \"Best Credit Cards for Students\" by U.S. News & World Report, Forbes Advisor, and Bankrate in 2024." },
    ],
  },

  // ---------------------------------------------------------------- tab 4 (p22)
  outlook: {
    banner: {
      eyebrow: "Audience Outlook",
      headline: "Digital-first, value-first, and anxious about savings",
      sub: "A snapshot of the audience's financial outlook: how they learn, what they prioritise, and where they struggle.",
      stats: [
        { value: "9", label: "Outlook themes" },
        { value: "Digital", label: "Default behaviour" },
        { value: "Price", label: "Beats brand" },
        { value: "30%", label: "Feel financially insecure" },
      ],
    },
    sec_title: "Gen Z financial outlook",
    note: "Nine recurring themes in how the audience talks about money. Share is the proportion of outlook-tagged posts each theme represents.",
    themes: [
      { key: "digital", title: "Digital-as-default behavior", pct: 16, text: "Gen Z's digital immersion shapes their financial learning preferences. They rely on video platforms like YouTube for financial education, though many still prefer human interaction for personalized guidance." },
      { key: "health", title: "Focused on good financial health", pct: 14, text: "Many Gen Zers prioritize financial wellness, using credit cards to build credit and focusing on budgeting and saving, influenced by their parents' struggles with mortgage, credit card, and other debt." },
      { key: "borrow", title: "Borrowing big", pct: 12, text: "Gen Z is increasingly taking on debt, with credit card balances rising. However, they are also focused on building credit and using cards responsibly." },
      { key: "coupons", title: "Coupons & offers motivate spending", pct: 12, text: "Gen Z is price-conscious, with offers and discounts influencing their spending habits. They prioritize value over brand loyalty." },
      { key: "price", title: "Price over brand", pct: 11, text: "Gen Z is more price-conscious than brand-loyal. They will choose the most affordable option, especially for everyday purchases like groceries and gas." },
      { key: "learning", title: "Financial learning vital", pct: 10, text: "Financial education is crucial for Gen Z. They want to learn about credit, budgeting, and investing from trusted sources like parents, schools, and financial institutions." },
      { key: "older", title: "Look up to older gens instead of millennials", pct: 9, text: "Gen Z is more likely to emulate the financial behaviors of Gen X and Baby Boomers rather than Millennials. They view older generations as more financially stable." },
      { key: "balance", title: "Expenses vs savings balance", pct: 9, text: "Gen Z is working to strike a balance between spending on experiences and saving for the future. They are saving for goals like buying a home or starting a business." },
      { key: "savings", title: "Frown over personal savings", pct: 7, text: "Despite their best intentions, many Gen Zers struggle to save money consistently. Financial insecurity remains a significant issue, with 30% feeling financially insecure and over half living paycheck-to-paycheck." },
    ],
  },
};

export default DN_SAMPLE;
