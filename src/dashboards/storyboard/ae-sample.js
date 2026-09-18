// Placeholder payload for the Audience Expectation storyboard
// (Whitespace & Gap Analysis, Tier 2). Shape = chartsData.audience_expectation.
// Contract: docs/ci-lens-contracts-whitespace-gap.md. Deck: PDF2 p24–26, PDF3 p18, p20.
// Bullets flagged `ext: true` are secondary research, not from tagged posts.

export const AE_SAMPLE = {
  meta: { brand: "Discover", category: "Gen-Z Student Credit Cards", window: "Jan – Jun 2024", total_mentions: 3860, logos: {}, is_sample: true },
  tabs: [
    { id: "t1", label: "Needs & Preferences" },
    { id: "t2", label: "Unmet Needs" },
    { id: "t3", label: "Digital Finance Gaps" },
  ],
  footer: ["Audience Expectation · Whitespace & Gap Analysis", "Sample data — values will be replaced by the session's tagged posts"],

  // ------------------------------------------------------------ tab 1 (p24 + p25)
  needs: {
    banner: {
      eyebrow: "Needs, Expectations & Preferences",
      headline: "Service offerings and security dominate what students expect",
      sub: "Customers show varying feedback: some praise robust fraud protection while others express frustration over communication gaps. Despite changes to benefits, student rewards continue to attract users. Frustrations persist around credit limits and reapplication after verification issues.",
      stats: [{ value: "5", label: "Attributes mapped" }, { value: "33%", label: "Top attribute · Service offerings" }, { value: "28%", label: "Safety & security" }, { value: "3,860", label: "Posts analysed" }],
    },
    note: "Share of expectation-tagged posts mapped to each attribute. Bullets summarise what posts say about the brand on that attribute.",
    attributes: [
      { key: "service", name: "Service offerings", pct: 33, points: [
        "Comparisons between the rewards on the student card (<mark>2% cash back on gas and restaurants</mark>) and other cards with higher rotating-category cash back.",
        "Tailored benefits like <mark>$20 cash back per academic year for good grades</mark> and a doubled first-year match make it rewarding for students building credit.",
        "The <mark>$50 referral bonus</mark> gained traction, rewarding members with statement credit for each new referral." ] },
      { key: "security", name: "Safety & Security", pct: 28, points: [
        "Concerns over the rigorous verification process, including <mark>IRS income verification and a notary form</mark>, seen as frustrating.",
        "Some appreciate the enhanced security but found the process cumbersome, especially without an established credit history." ] },
      { key: "trust", name: "Trust and loyalty", pct: 24, points: [
        "Customers feel disillusioned when <mark>long-term loyalty and on-time payments</mark> do not result in benefits like lower interest rates.",
        "<mark>Verification and documentation issues</mark> such as name mismatches lead to account closures and difficulty reapplying." ] },
      { key: "cs", name: "Customer service", pct: 9, points: [
        "Mixed experiences: some report <mark>unhelpful and rude interactions</mark>; others praise responsiveness, particularly in fraud protection.",
        "Negative feedback centres on representatives giving the <mark>runaround</mark> instead of directly answering questions." ] },
      { key: "limit", name: "Credit Limit", pct: 6, points: [
        "Users value cash back for good grades and decent initial limits for managing small daily expenses.",
        "Frustration with <mark>reluctance to increase limits</mark> over time despite responsible usage; some cite $1K to $3K over six years." ] },
    ],
    drivers_title: "Key drivers to use credit cards",
    drivers_lead: "Credit cards are primarily used for online shopping, dining, and gas, cashback offers, and other benefits.",
    drivers: [
      "College students own a card to help them <mark>build credit</mark>.",
      "They use an independent card in their name, are <mark>authorized users</mark> of parent-owned cards, or use a card with a cosigner.",
      "Cards were mostly used for clothes and accessories, tech and mobile, health and beauty, study supplies and books.",
      { text: "They used them due to a lack of other financial resources.", ext: true },
      "<mark>Easy approval</mark> was the most popular reason for obtaining a first card, followed by cashbacks and benefits.",
      "Parents usually choose <mark>multiple cards</mark> for them as a backup in case of an emergency.",
    ],
  },

  // ------------------------------------------------------------ tab 2 (p26)
  unmet: {
    banner: {
      eyebrow: "Unmet Needs",
      headline: "What Gen-Zs look for in credit cards, and don't yet get",
      sub: "Personalised rewards, easier access without credit history, a path for international students, financial education and instant digital access are the recurring gaps.",
      stats: [{ value: "5", label: "Unmet needs" }, { value: "33%", label: "Instant access & ease" }, { value: "19%", label: "Limited credit access" }, { value: "12%", label: "Personalised rewards" }],
    },
    note: "Share of unmet-need posts per theme. Themes without a share are drawn from posts but too few to size.",
    needs: [
      { key: "rewards", title: "Innovative and Personalized Rewards", pct: 12, text: "Loyalty programs tailored to their preferences strongly appeal to younger consumers. Gen Z and millennials prefer <mark>personalized rewards programs</mark> and are highly likely to apply for a card offering their preferred rewards." },
      { key: "history", title: "Lack of credit history and limited credit access", pct: 19, text: "Many students have a hard time getting approved due to <mark>limited credit history</mark>. Student cards are tailored for college attendees with modest limits to help establish credit before graduation." },
      { key: "intl", title: "Barriers for international students and those with no SSN", pct: 11, text: "International students and those without a Social Security Number face additional challenges getting approved. Lack of credit history and <mark>legal documentation</mark> makes it harder to build credit." },
      { key: "education", title: "Financial Education and Guidance", text: "Gen Z's average credit card balance is $3,262, compared to $6,501 for all other U.S. consumers. Many students struggle with debt and lack basic credit knowledge, highlighting the need for <mark>education on responsible usage</mark>.", ext: true },
      { key: "access", title: "Instant Access and Ease of Use", pct: 33, text: "Gen Z values efficiency and simplicity in rewards and account management. However, many find the <mark>redemption process confusing and slow</mark>." },
    ],
  },

  // ------------------------------------------------------------ tab 3 (PDF3 p18 + p20)
  digital: {
    banner: {
      eyebrow: "Digital Finance Gaps",
      headline: "Security, uptime and friction: what Gen-Z expects from digital finance",
      sub: "A seamless user experience that also ensures transparency in the form of security and data privacy is what Gen Zs expect in a nutshell from their digital finance experience.",
      stats: [{ value: "50%", label: "Wallet security" }, { value: "25%", label: "App down" }, { value: "17%", label: "Declined transactions" }, { value: "8%", label: "Environment" }],
    },
    note: "Share of digital-finance complaint posts per pillar, with a verbatim post each. Survey stats below are secondary research.",
    pillars: [
      { key: "wallet", title: "Wallet Security", pct: 50, text: "Need for a <mark>reliable crypto wallet</mark> to ensure financial security.", quote: { text: "Please help me i lost all my bitcoin and my cryptocurrency account got hacked, my entire eth trust wallet is gone.", source: "X" } },
      { key: "down", title: "App Down", pct: 25, text: "Frequent episodes of net banking apps being down were a cause of frustration.", quote: { text: "My PayPal & Venmo accs aren't working and I've been trying to figure it out all day but it just gave me a big headache so I couldn't buy the PC I wanted.", source: "X" } },
      { key: "declined", title: "Declined Transactions", pct: 17, text: "Too many <mark>roadblocks while making a transaction</mark>.", quote: { text: "Card declined three times at checkout for a $40 order. Bank said nothing was wrong. Switched to Apple Pay and it went through.", source: "Reddit" } },
      { key: "env", title: "Environment", pct: 8, text: "Alternatives to crypto mining for reducing <mark>environmental impact</mark>.", quote: { text: "I'd recommend investing in stocks instead, mining of cryptocurrency is so bad for the environment. Bitcoin alone generates about 37 tonnes of carbon dioxide every year.", source: "X" } },
    ],
    survey_title: "Are Gen-Zs content with the mobile banking experience?",
    survey_note: "Cornerstone Advisors survey. Secondary research, not from tagged posts.",
    survey: [
      { value: "4 in 10", label: "could not find what they were looking for online", ext: true },
      { value: "40%", label: "felt it was quicker to talk to someone than search online", ext: true },
      { value: "25%", label: "said the app or website did not support their need", ext: true },
      { value: "59%", label: "want a Tap-to-Call customer service feature on digital platforms", ext: true },
    ],
  },
};

export default AE_SAMPLE;
