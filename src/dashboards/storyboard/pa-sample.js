// Placeholder payload for the Perception Analysis storyboard.
//
// This is the shape the backend is expected to return under
// `chartsData.perception_analysis` (contract: docs/ci-lens-contracts-issues-priorities.md
// section 6). Until then the screen renders this sample (Gen-Z student credit
// cards, deck pages 28–31) with a "Sample data" pill. Every value is replaceable;
// nothing in the screen or blocks depends on the specific text.
//
// Prose fields may contain <mark>…</mark> to highlight key phrases (the deck's
// underlined links). Nothing else is rendered as HTML.

export const PA_SAMPLE = {
  meta: {
    brand: "Discover",
    category: "Gen-Z Student Credit Cards",
    window: "Jan – Jun 2024",
    total_mentions: 4870,
    rated_mentions: 4212,
    logos: {},               // backend fills { "Discover": "https://…", … }
    is_sample: true,
  },

  tabs: [
    { id: "t1", label: "General Perception" },
    { id: "t2", label: "Sentiment Drivers" },
    { id: "t3", label: "Emotional Outlook" },
  ],

  footer: [
    "Perception Analysis · Landscape Analysis",
    "Sample data — values will be replaced by the session's tagged posts",
  ],

  // ---------------------------------------------------------------- tab 1
  perception: {
    banner: {
      eyebrow: "Perception Analysis",
      headline: "A tool for building credit, held with caution",
      sub:
        "User perception and emotions around the category. Many students and young adults view credit cards as a tool for building credit history and learning financial responsibility, while being cautious of debt.",
      stats: [
        { value: "6", label: "Perception themes" },
        { value: "4,870", label: "Posts analysed" },
        { value: "Discover", label: "Most-recommended brand" },
        { value: "37%", label: "Positive sentiment" },
      ],
    },
    note: "Six recurring perception themes across the tagged posts, with the share of perception-tagged posts each represents.",
    summary:
      "Many students and young adults view credit cards as a tool for building credit history and learning financial responsibility, while being cautious of debt, preferring brands like Discover and Capital One, and often starting as authorized users on their parents' accounts.",
    keywords: ["building credit history", "financial responsibility", "cautious of debt", "authorized users", "Discover", "Capital One"],
    themes: [
      {
        key: "benefits", title: "Perceived Benefits", pct: 27,
        text: "Many students and young adults see credit cards as a tool for <mark>building credit history early</mark>, which can be beneficial for future financial endeavors like <mark>renting apartments</mark> or securing loans post-graduation.",
      },
      {
        key: "caution", title: "Cautionary Use", pct: 19,
        text: "There's a mixed perception about using credit cards responsibly. Some emphasize using them for <mark>everyday purchases</mark> and paying off balances regularly to avoid interest, while others caution against <mark>overspending</mark> and accruing debt.",
      },
      {
        key: "literacy", title: "Building Financial Literacy", pct: 16,
        text: "Credit cards are seen as a way to <mark>learn financial responsibility</mark>, including budgeting and managing expenses. Some users appreciate features like cashback rewards or <mark>travel points</mark>, which incentivize responsible use.",
      },
      {
        key: "brands", title: "Brand Preferences", pct: 15,
        text: "<mark>Discover and Capital One</mark> are commonly recommended for students due to their <mark>student-friendly credit card offerings</mark>, reliable approval options for those with <mark>no credit</mark> and relatively easier approval processes.",
        brands: ["Discover", "Capital One"],
      },
      {
        key: "parents", title: "Parental Influence", pct: 13,
        text: "Many students start with credit cards as <mark>authorized users</mark> on their parents' accounts, which helps them <mark>build credit history early</mark> on and learn about credit management under parental guidance.",
      },
      {
        key: "concerns", title: "Concerns and Advice", pct: 10,
        text: "There are concerns about high interest rates, <mark>fees</mark>, and the <mark>potential for credit card debt</mark>. Advice often includes starting with a low credit limit, <mark>paying balances in full</mark>, and being <mark>cautious about spending habits</mark>.",
      },
    ],
  },

  // ---------------------------------------------------------------- tab 2
  sentiment: {
    banner: {
      eyebrow: "Sentiment Drivers",
      headline: "Half the conversation is neutral. Rewards drive the positives, service the negatives.",
      sub:
        "Sentiment across rated posts, and the specific drivers behind each pole. Positive talk centres on perks and ease of use; negative talk on customer service and perceived exploitation by banks.",
      stats: [
        { value: "37%", label: "Positive" },
        { value: "12%", label: "Negative" },
        { value: "51%", label: "Neutral" },
        { value: "+25", label: "Net sentiment" },
      ],
    },
    note: "Share of rated posts by sentiment, of 4,212 posts that carried a sentiment tag. Drivers are the themes most frequent within each pole.",
    split: [
      { name: "Positive", pct: 37, tone: "pos" },
      { name: "Negative", pct: 12, tone: "neg" },
      { name: "Neutral", pct: 51, tone: "neu" },
    ],
    groups: [
      {
        tone: "pos", label: "Positive", pct: 37,
        drivers: [
          { title: "Perks and Rewards", text: "Gen Z appreciate the perks and rewards offered by credit cards, such as cash back, <mark>no annual fees</mark>, and specific benefits like the good grades program." },
          { title: "Ease of Use and Convenience", text: "The <mark>user-friendly</mark> nature of apps and easy control over card features are highly valued. This convenience helps users manage their finances effectively." },
        ],
      },
      {
        tone: "neu", label: "Neutral", pct: 51,
        drivers: [
          { title: "Card Diversity and Backup", text: "Having both a VISA and Mastercard is recommended to ensure a <mark>backup</mark> option in case one card doesn't work, reflecting a strategic approach to managing potential card issues." },
          { title: "Credit Building", text: "For college students with limited income, starting with a student credit card is a good choice. These cards are designed with lower credit requirements and benefits tailored to <mark>students' needs</mark>." },
        ],
      },
      {
        tone: "neg", label: "Negative", pct: 12,
        drivers: [
          { title: "Customer Service Issues", text: "Students report dissatisfaction with the <mark>customer service</mark> of Discover, citing unhelpfulness and poor attitudes from representatives.", brands: ["Discover"] },
          { title: "Perceived Exploitation by Banks", text: "There is a perception among some Gen Z's that certain banks, like Bank of America, profit off <mark>low credit scores</mark> and do not support Gen Z customers effectively.", brands: ["Bank of America"] },
        ],
      },
    ],
    quotes: [
      { text: "I got this credit card my senior year of college and it has been amazing! I get to build my credit while getting cash back for all my purchases.", source: "Reddit · r/CreditCards", tone: "pos" },
      { text: "Discover's customer service gave me the runaround instead of directly answering my question. Three calls, no fix.", source: "X", tone: "neg" },
    ],
  },

  // ---------------------------------------------------------------- tab 3
  emotion: {
    banner: {
      eyebrow: "Emotional Outlook",
      headline: "A useful tool, with a strong call for responsible use",
      sub:
        "While credit cards are seen as a useful tool, there is a strong emphasis on the need for responsible usage, parental guidance and financial education to prevent negative outcomes.",
      stats: [
        { value: "3", label: "Negative aspects" },
        { value: "22%", label: "Posts with negative emotion" },
        { value: "Debt", label: "Top concern" },
        { value: "Trust", label: "Top positive emotion" },
      ],
    },
    note: "Emotion tags across rated posts. Negative aspects are the recurring themes inside the unhappy / fearful / stressed / anxious set.",
    summary:
      "While credit cards are seen as a useful tool, there is a strong emphasis on the need for responsible usage, parental guidance and financial education to prevent negative outcomes.",
    mix: [
      { name: "Trust / Appreciation", pct: 41, tone: "pos" },
      { name: "Neutral / Informational", pct: 37, tone: "neu" },
      { name: "Anxiety / Fear", pct: 13, tone: "warn" },
      { name: "Frustration / Anger", pct: 9, tone: "neg" },
    ],
    lead: "While most student credit card holders appreciate the <mark>rewards, cashback, and benefits</mark> offered by some credit cards, a few also express concerns about <mark>accumulating debt</mark>.",
    aspect_label: "Negative aspects",
    aspect_tags: ["Unhappy", "Fearful", "Stressed", "Anxious"],
    aspects: [
      { key: "debt", title: "Debt Concerns", pct: 11, text: "There is significant concern about accumulating debt. Students may find themselves unable to pay off their balances, leading to high-interest charges and long-term financial strain." },
      { key: "literacy", title: "Financial Literacy", pct: 6, text: "Some students feel unprepared to handle credit responsibly due to a lack of financial education. This can lead to poor spending habits and misuse of credit." },
      { key: "stress", title: "Stress and Anxiety", pct: 5, text: "The burden of managing credit card debt can cause stress and anxiety among students who are already dealing with academic pressures." },
    ],
  },
};

export default PA_SAMPLE;
