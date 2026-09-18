// Placeholder payload for the User Behaviour Analysis storyboard
// (Consumer Segmentation Analysis, Tier 2). Shape = chartsData.user_behaviour.
// Contract: docs/ci-lens-contract-user-behaviour.md. Deck: PDF2 p32–34.

export const UB_SAMPLE = {
  meta: { brand: "Discover", category: "Gen-Z Student Credit Cards", window: "Jan – Jun 2024", total_mentions: 4410, logos: {}, is_sample: true },
  tabs: [
    { id: "t1", label: "Audience Segments" },
    { id: "t2", label: "Multiple-Card Behaviour" },
  ],
  footer: ["User Behaviour Analysis · Consumer Segmentation Analysis", "Sample data — values will be replaced by the session's tagged posts"],

  // ------------------------------------------------------------ tab 1 (p33)
  segments: {
    banner: {
      eyebrow: "Decision making process & selection cycle",
      headline: "Three sub-segments, three different relationships with credit",
      sub: "These sub-segments reflect the diverse and multifaceted nature of the Gen-Z generation, influenced by a wide range of factors including age, technology, education, values, lifestyle, and economic status.",
      stats: [{ value: "3", label: "Sub-segments" }, { value: "18–21", label: "Largest segment" }, { value: "46%", label: "Share of posts · 18–21" }, { value: "4,410", label: "Posts analysed" }],
    },
    note: "Share is the proportion of posts whose author or subject falls in each age band, where the tagger could infer it.",
    lead: "While most student credit card holders appreciate the rewards, cashback, and benefits offered by some credit cards, a few also express concerns about accumulating debt.",
    groups: [
      { key: "teens", range: "13–17", title: "Teens · College Students and Recent Graduates", pct: 21, points: [
        "Often still in middle and high school, focused on school, friendships, and <mark>early career thoughts</mark>.",
        "Students: currently enrolled in educational institutions, primary focus on academics and extracurricular activities." ] },
      { key: "young_adults", range: "18–21", title: "Young Adults", pct: 46, points: [
        "Typically in college or starting their careers, more independent, and <mark>making significant life choices</mark>.",
        "Highly tech-savvy, early adopters of new technology, heavily involved in social media and digital content.",
        "Job seekers: recent graduates or individuals looking for employment, focusing on career opportunities and job market trends." ] },
      { key: "professionals", range: "22–24", title: "Young Professionals", pct: 33, points: [
        "Use technology frequently but with more <mark>balanced habits</mark>, conscious about screen time, and more selective in digital consumption.",
        "Young professionals: those who have started their careers, balancing work-life priorities, and establishing themselves in their chosen fields." ] },
    ],
  },

  // ------------------------------------------------------------ tab 2 (p34)
  multi: {
    banner: {
      eyebrow: "Multiple-card behaviour",
      headline: "Category rewards and backup drive the second card, not credit building",
      sub: "Key drivers that make Gen-Z choose multiple credit cards: larger discounts in different categories, a fallback when one card is compromised, and workarounds for international students on low limits.",
      stats: [{ value: "38%", label: "Discover · brand choice" }, { value: "5", label: "Issuers tracked" }, { value: "3", label: "Reasons to carry more" }, { value: "4", label: "Ways they choose" }],
    },
    note: "Brand choice is the share of multiple-card posts naming each issuer; a post can name more than one. Answers are drawn from those posts.",
    brand_choice: [
      { name: "Discover", pct: 38, is_brand: true },
      { name: "Chase", pct: 24 },
      { name: "Capital One", pct: 14 },
      { name: "Bank of America", pct: 10 },
      { name: "Others", pct: 14 },
    ],
    questions: [
      { q: "Why do Gen-Zs carry multiple credit cards?", points: [
        "One card offers <mark>larger discounts on different categories</mark>, such as gas or restaurants, than the other. Certain cards also have limited acceptance in some areas.",
        "A second card is a <mark>fallback when one is compromised</mark>. But they believe multiple cards would not significantly enhance credit building, as the benefit diminishes with each additional card.",
        "International students face additional charges and tracking issues with <mark>low-limit cards</mark>, forcing them to add prepaid cards to meet expenses." ] },
      { q: "How do they choose between the cards they have?", points: [
        "Parents opt for a second card for their children only <mark>after graduation and a full-time job</mark>, while continuing to build credit with the current card.",
        "Some suggest waiting a year or two and applying for additional cards on meeting spending requirements for <mark>sign-up bonuses</mark>.",
        "Students switch between <mark>cashback cards and travel cards</mark> based on need.",
        "International students who travel frequently choose cards whose reward points transfer to <mark>airline miles</mark>." ] },
    ],
  },
};

export default UB_SAMPLE;
