// Placeholder payload for the Brand Performance storyboard
// (Whitespace & Gap Analysis, Tier 2). Shape = chartsData.brand_performance.
// Contract: docs/ci-lens-contracts-whitespace-gap.md. Deck: PDF3 p19, p21, p23.
// The deck's sample brand is Capital One vs Citibank and Bank of America.

export const BPF_SAMPLE = {
  meta: { brand: "Capital One", category: "Gen-Z Digital Banking", window: "Sep – Nov 2021", total_mentions: 11500, logos: {}, is_sample: true },
  tabs: [
    { id: "t1", label: "Share of Voice & Sentiment" },
    { id: "t2", label: "Digital Experience" },
    { id: "t3", label: "Mobile Banking" },
  ],
  footer: ["Brand Performance · Whitespace & Gap Analysis", "Sample data — values will be replaced by the session's tagged posts"],

  // ------------------------------------------------------------ tab 1 (p23)
  voice: {
    banner: {
      eyebrow: "Share of Voice & Sentiment",
      headline: "Capital One holds a quarter of the conversation, with the flattest sentiment",
      sub: "Share of brand-tagged posts across the three tracked issuers, and how sentiment splits within each brand's mentions.",
      stats: [{ value: "26%", label: "Capital One share" }, { value: "39%", label: "Citibank · leader" }, { value: "17%", label: "Capital One positive" }, { value: "11.5K", label: "Posts analysed" }],
    },
    note: "Share of voice is the split of brand-tagged posts. Sentiment bars are within each brand's own posts and sum to 100.",
    share: [
      { name: "Citibank", pct: 39 },
      { name: "Bank of America", pct: 35 },
      { name: "Capital One", pct: 26, is_brand: true },
    ],
    sentiment: [
      { name: "Capital One", pos: 17, neu: 76, neg: 5, is_brand: true },
      { name: "Citibank", pos: 27, neu: 67, neg: 5 },
      { name: "Bank of America", pos: 24, neu: 68, neg: 5 },
    ],
    callout: "Neutral dominates across all three. Capital One's positive share trails both competitors by 7–10 points, the gap to close.",
  },

  // ------------------------------------------------------------ tab 2 (p21)
  digital: {
    banner: {
      eyebrow: "Digital Experience",
      headline: "Convenience wins praise everywhere, app crashes lose it",
      sub: "Across brands, convenience was the key positivity driver, however frequent app crashes did not cater to the seamless experience that Gen-Z value the most.",
      stats: [{ value: "22%", label: "Capital One · convenience" }, { value: "20%", label: "Capital One · app crash" }, { value: "87%", label: "BoA · app down" }, { value: "3", label: "Brands compared" }],
    },
    note: "Theme shares are within each brand's digital-experience posts. Working / not working are the recurring positives and negatives.",
    brands: [
      { name: "Capital One", is_brand: true,
        themes: [{ name: "Convenience", pct: 22 }, { name: "App crash related", pct: 20 }, { name: "Excessive notifications", pct: 11 }, { name: "Privacy issues", pct: 11 }],
        working: ["Convenient", "Overall good digital experience", "App asks permission to access media"],
        not_working: ["Frequent app crashes", "Too many notifications"] },
      { name: "Citibank",
        themes: [{ name: "App functionality", pct: 25 }, { name: "App crash", pct: 20 }, { name: "App update", pct: 15 }, { name: "Website functionality", pct: 15 }, { name: "UI/UX", pct: 10 }, { name: "Sign-in related", pct: 5 }, { name: "Website outage", pct: 5 }, { name: "Security", pct: 5 }],
        working: ["Convenient for quick tasks", "User friendly, <mark>card lock through app</mark>", "<mark>Gamified features</mark>", "Financial literacy: saving goals, low-threshold investing", "Tips and tricks around stock market investment"],
        not_working: ["Frequent app crashes", "Sign in, password reset issues", "Fingerprint option is non-functional", "Connectivity issue with Zelle app"] },
      { name: "Bank of America",
        themes: [{ name: "App down", pct: 87 }, { name: "Declined transaction", pct: 9 }, { name: "Unable to log in", pct: 4 }],
        working: ["Convenient", "Overall good digital experience", "App asks permission to access media"],
        not_working: ["Frequent episodes of the app being down"] },
    ],
  },

  // ------------------------------------------------------------ tab 3 (p19)
  mobile: {
    banner: {
      eyebrow: "Mobile Banking Experience",
      headline: "Mobile is the default channel, and the reason Gen-Z switches banks",
      sub: "80% of Gen Z smartphone users already use mobile banking, primarily for checking balances, credit bills and paying bills. The surge owes to the pandemic, which changed banking behaviour significantly.",
      stats: [{ value: "80%", label: "Use mobile banking" }, { value: "37%", label: "Open deposit account via app" }, { value: "66%", label: "Would switch banks for a better app" }, { value: "50%+", label: "Open to P2P / social payment apps" }],
    },
    note: "Survey data from Alphawise / Morgan Stanley and GoCardless. Secondary research, not from tagged posts.",
    surge: [
      { text: "37% of Gen Z prefer using mobile banking to open a deposit account, far higher than any other generation.", ext: true },
      { text: "66% of Gen Z would switch banks for a better mobile app in 2020, compared to 54% in 2019.", ext: true },
      { text: "More than half of Gen Zs were willing to totally switch to peer-to-peer and social media payment apps.", ext: true },
    ],
    activity: {
      series: ["Gen Z", "Gen Y"],
      rows: [
        { name: "Check balance / activity", values: [51, 64] },
        { name: "Pay bills", values: [28, 55] },
        { name: "Check credit card balance", values: [25, 46] },
        { name: "Money transfers to individuals", values: [24, 30] },
        { name: "Deposit checks", values: [23, 30] },
        { name: "Payments to a business", values: [13, 20] },
        { name: "None of the above", values: [30, 16] },
      ],
      ext: true,
    },
    channel: {
      series: ["Desktop", "Mobile app", "Branch", "Other"],
      groups: [
        { name: "Gen Z", values: [21, 37, 18, 24] },
        { name: "Millennials", values: [29, 31, 14, 26] },
        { name: "Gen X", values: [33, 24, 27, 16] },
        { name: "Boomers+", values: [24, 4, 63, 8] },
      ],
      ext: true,
    },
  },
};

export default BPF_SAMPLE;
