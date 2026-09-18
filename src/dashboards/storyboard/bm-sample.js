// Placeholder payload for the Brand Messaging storyboard
// (Whitespace & Gap Analysis, Tier 2). Shape = chartsData.brand_messaging.
// Contract: docs/ci-lens-contracts-whitespace-gap.md. Deck: PDF3 p24–26.
// One tab per brand; tabs are derived from `brands[]`, project brand first.

export const BM_SAMPLE = {
  meta: { brand: "Capital One", category: "Gen-Z Digital Banking", window: "Sep – Nov 2021", total_mentions: 2750, logos: {}, is_sample: true },
  footer: ["Brand Messaging · Whitespace & Gap Analysis", "Sample data — values will be replaced by the session's tagged posts"],
  note: "Share of brand-initiative posts per message theme. Initiatives are what the brand's own and earned content talk about.",

  brands: [
    {
      name: "Capital One", is_brand: true, mentions: 1200,
      headline: "Innovative app features, digital-wallet education and exclusive travel offers capture Gen-Z attention",
      sub: "Innovative mobile app features, interactive ways of teaching how to use digital wallets and dispensing knowledge around cyber etiquette, exclusive travel miles offers on cards. These went a long way to capture Gen-Z attention.",
      initiatives: [
        { title: "Entertainment & Sports", pct: 37, points: ["Exclusive partner of sporting events such as football and Formula One; collaborations with well-known music festivals.", "These collaborations attract Gen-Z customers who are <mark>experience oriented</mark>."] },
        { title: "Exclusive Card Holders Offer", pct: 24, points: ["Collaboration with <mark>Taylor Swift</mark> for the re-release of \"Red\" with exclusive bundles drew a lot of attention in November.", "Special deals on merchandise and vinyl records drove positive engagement."] },
        { title: "Inclusivity and a Better Tomorrow", pct: 18, points: ["Gen-Zers align with brands that stand for equality and inclusivity.", "Special programs and <mark>grants for Black-owned businesses</mark>; Impact Investment combines philanthropy with venture capital.", "Partners like The Good Co. work to put food on the tables of those with limited resources."] },
        { title: "Local Business Empowerment", pct: 11, points: ["Collaboration with <mark>\"Taste America\"</mark> positions the brand as a promoter of local food and restaurant entities.", "Support for green infrastructure through training programs adds to its reputation as a brand with a human side."] },
        { title: "Student Initiatives", pct: 10, points: ["<mark>Student-friendly loans</mark> to attract Gen-Z students.", "Coders Program: more than 20K students have received monetary benefits while honing software skills."] },
      ],
    },
    {
      name: "Citibank", mentions: 1300,
      headline: "Gamified app, customised offers and a visible human side",
      sub: "Apart from gamified app features and customised discounts and offers, Citi Bank's special fraud team, \"Stay Safe Online\" campaign, new experience centre at NYC and collabs with popular OTT platforms all went a long way to attract Gen-Z customers.",
      initiatives: [
        { title: "Entertainment & Sports", pct: 44, points: ["A variety of offers for Gen-Z customers, ranging from entertainment to sporting events.", "These card offerings had a lot of positive mention on social media; Gen-Z's love for <mark>customised offerings</mark> is well addressed."] },
        { title: "Digital Experience", pct: 31, points: ["Feature-loaded mobile app: <mark>gamified features</mark>, interest boosters like \"Citi Missions\".", "Financial literacy on saving goals and low-threshold investing; tips around stock market investment."] },
        { title: "Citi Bank Cards", pct: 17, points: ["Partnerships with <mark>Spotify</mark>; collab with musician @TracyAnderson for an exclusive Custom Cash Card playlist struck a chord with Gen-Z."] },
        { title: "Social Initiatives", pct: 8, points: ["\"Giving back to society\" and a human side matter to Gen-Zers when they shortlist a brand.", "Commitment to <mark>remove child hunger</mark> won the hearts of many Gen-Zers."] },
      ],
    },
    {
      name: "Bank of America", mentions: 250,
      headline: "Sports mentorship, small-business support and mental-health podcasts",
      sub: "From teaming up with baseball star J.D. Martinez for sports mentorship programs, promoting small and women-owned businesses, to podcasts on mental health, the brand showed variety in its strategies to attract Gen-Z clientele.",
      initiatives: [
        { title: "Digital Experience", pct: 44, points: ["Posts around mobile banking app features saw sizeable engagement.", "<mark>Security meter</mark>, an app feature that alerts users to spurious agents, was well received."] },
        { title: "Deals and Rewards", pct: 33, points: ["Exclusive online shopping discounts for card holders during holiday seasons.", "<mark>0% Liability Guarantee</mark> on debit cards for stress-free online shopping; opinion polls on shopping habits."] },
        { title: "Social Media Engagement", pct: 13, points: ["Opinion polls on special days like Thanksgiving; posts on arts and culture attract huge engagement.", "These help the brand gain the reputation of a <mark>humanised enterprise</mark>."] },
        { title: "Student Initiatives", pct: 10, points: ["Special student cards with low APRs, admission glossaries and scholarship programs like the NYC CTE Summer Scholars aimed at young Gen-Z students."] },
      ],
    },
  ],
};

export default BM_SAMPLE;
