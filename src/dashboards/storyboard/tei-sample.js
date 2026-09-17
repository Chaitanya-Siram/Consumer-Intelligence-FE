// Placeholder payload for the Track Emerging Issues storyboard.
//
// This is the shape the backend is expected to return under
// `chartsData.track_emerging_issues`. Until that endpoint exists the screen
// renders this sample (Gen-Z student credit cards, from the approved deck,
// pages 7–13) so the layout can be reviewed with realistic proportions.
// Every string and number here is replaceable; nothing in the screen or the
// blocks depends on the specific values.

export const TEI_SAMPLE = {
  meta: {
    brand: "Gen-Z Student Credit Cards",
    window: "Jan – Jun 2024",
    platforms: ["X", "Forums", "Blogs", "News"],
    total_mentions: 6120,
    is_sample: true,
  },

  tabs: [
    { id: "t1", label: "Issue Journey" },
    { id: "t2", label: "Behaviour & Usage" },
    { id: "t3", label: "Themes & Drivers" },
  ],

  footer: [
    "Track Emerging Issues · Issues Intelligence",
    "Sample data — values will be replaced by the session's tagged posts",
  ],

  // ---------------------------------------------------------------- tab 1
  journey: {
    banner: {
      eyebrow: "Issue Journey",
      headline: "Where the issue takes hold, stage by stage",
      sub:
        "A lifecycle read of how the audience discovers, evaluates and adopts, and where the emerging concern surfaces first. Every stage and figure comes from the session's tagged posts.",
      stats: [
        { value: "4", label: "Lifecycle stages" },
        { value: "1,940", label: "Peak monthly mentions" },
        { value: "Mar '24", label: "Peak month" },
        { value: "4", label: "Platforms" },
      ],
    },
    stages: [
      {
        label: "Discovery Phase",
        steps: [
          { title: "Awareness (Understanding)" },
          {
            title: "Choices",
            detail:
              "Rewards and benefits · Annual fees · Low APR · Credit building · Student-friendly features like credit education, budgeting tools and flexible payments",
          },
          {
            title: "Brand Identification",
            detail:
              "Discover it Student Cash Back · Capital One SavorOne Student · Chase Freedom Student · BoA Travel Rewards for Students · Deserve EDU",
          },
          {
            title: "Eligibility Criteria",
            detail: "At least 18 · Under 21 without independent income may need a US-citizen cosigner",
          },
        ],
      },
      {
        label: "Documentation & Submission",
        steps: [
          { title: "Application Process", detail: "Mail, mobile, in-person or online" },
          {
            title: "Gather Documentation",
            detail: "Driver's licence, passport or state ID · Proof of enrolment · Proof of income if required",
          },
          { title: "Submit Application" },
        ],
      },
      {
        label: "Verification Process",
        gate: true,
        outcomes: [
          { label: "Accept", tone: "pos" },
          { label: "Reject", tone: "neg" },
        ],
        note:
          "Applications pass or fail identity, enrolment and income checks here. Rejections feed back into the Discovery phase.",
      },
      {
        label: "Activation & Transition",
        steps: [
          { title: "Transition to mainstream credit cards" },
          { title: "Monitoring and Maintenance", detail: "Tracking credit scores" },
          { title: "Making Payments and Credit Building" },
          { title: "Card activation and initial usage" },
        ],
      },
    ],
  },

  trend: {
    title: "Social media mention trendline · starter credit card",
    headline:
      "Gen Z demands tailored rewards in financial products amid debate over credit card fees and regulations.",
    unit: "No. of mentions",
    points: [
      { x: "Jan '24", y: 1100 },
      { x: "Feb '24", y: 780 },
      { x: "Mar '24", y: 1940 },
      { x: "Apr '24", y: 720 },
      { x: "May '24", y: 850 },
      { x: "Jun '24", y: 500 },
    ],
    annotations: [
      {
        at: 0,
        label: "Jan",
        text:
          "Recurring conversation shows dissatisfaction with traditional reward offerings from banks, indicating a demand for more tailored rewarding benefits.",
      },
      {
        at: 2,
        label: "Mar · peak",
        text:
          "Bonuses for opening accounts or cards became a major point of discussion. Gen Z's focus on student financial products emphasises cashback and travel points.",
      },
      {
        at: 4,
        label: "May",
        text: "Discussion centres on the debate surrounding credit card fees and regulations.",
      },
    ],
    footnote: "Mentions are from the following platforms: Twitter, Forums, Blogs, News.",
  },

  // ---------------------------------------------------------------- tab 2
  behaviour: {
    banner: {
      eyebrow: "Behaviour & Usage",
      headline: "Digital natives want app-first, real-time control",
      sub:
        "As digital natives, Gen Z students prefer credit cards with user-friendly mobile apps and online account management. They value real-time alerts, mobile payments and digital wallets.",
      stats: [
        { value: "3", label: "Profile dimensions" },
        { value: "4", label: "Usage modes" },
        { value: "18–24", label: "Core age band" },
      ],
    },
    profile: [
      {
        title: "Behaviour",
        sub: "Entertainment, dining, travel and online shopping mark the social life of Gen Z",
        points: [
          "Gen Z often uses student credit cards for discretionary spending such as entertainment, dining and online shopping.",
          "When choosing cards, Gen Z values rewards programmes offering cash back, travel points or discounts on popular brands, maximising benefits that fit their lifestyle.",
          "Gen Z primarily uses credit cards to build credit scores, crucial for a strong financial foundation early in adult life.",
        ],
      },
      {
        title: "Interests",
        sub: "Where the money and attention go",
        points: [
          "Food and dining, transportation, streaming services, concerts, movies, gaming subscriptions.",
          "Travel, fitness and health, technology and gadgets.",
        ],
      },
      {
        title: "Attitude",
        sub: "The stance toward the category",
        points: [
          "Value oriented: tangible benefits such as cashback, discounts and perks aligned with spending habits.",
          "Digital savvy: easy-to-use mobile apps, real-time transaction alerts, mobile payment options and digital wallets.",
          "Flexibility and control: flexible payment options, low or no fees, and tools to monitor spending in real time.",
        ],
      },
    ],
    usage_note:
      "Gen-Zs use student credit cards to establish early credit histories, handle a variety of expenses and make lifestyle choices. Cards also serve as safety nets and are integral to digital-first purchasing habits.",
    usage: [
      {
        title: "Building credit history",
        segments: ["College-aged · 18–24"],
        points: [
          "Gen Z cardholders use their cards primarily to build credit history.",
          "They understand the importance of a good credit score for renting an apartment or taking out a loan.",
        ],
      },
      {
        title: "Managing expenses",
        segments: ["High school students · 18–22", "Graduates / young professionals · 23–24"],
        points: [
          "Beyond groceries and transport, cards cover lifestyle expenses such as entertainment and travel.",
          "Reflects a desire for independence and social engagement during college years.",
        ],
      },
      {
        title: "Emergency funds",
        segments: ["Undergraduate / graduate · 18–24", "Entry-level professionals · 23–24"],
        points: [
          "Primarily for planned expenses, student cards also cushion unexpected costs such as medical emergencies.",
        ],
      },
      {
        title: "Online purchases",
        segments: ["Tech-savvy students · 18–24"],
        points: [
          "Gen Z's affinity for digital platforms extends to purchasing habits.",
          "More likely to use student cards for online shopping, app purchases, streaming and digital subscriptions.",
        ],
      },
    ],
  },

  // ---------------------------------------------------------------- tab 3
  themes: {
    banner: {
      eyebrow: "Themes & Drivers",
      headline: "Rewards dominate, security and credit score follow",
      sub:
        "Gen-Z highlights a shift toward personalised rewards, concerns over card security, and the impact of effective credit management on scores, while navigating fees, eligibility and customer-service frustrations.",
      stats: [
        { value: "8", label: "Themes tracked" },
        { value: "41%", label: "Top theme share" },
        { value: "52%", label: "Positive sentiment" },
      ],
    },
    funnel: [
      { value: "~38%", label: "of all social conversations from Gen-Z is focused on financial discussions" },
      { value: "~15%", label: "of those financial conversations relate to credit cards" },
    ],
    rows: [
      { name: "Rewards / Benefits", pct: 41, text: "Gen-Zs look for a more personalised reward programme, a shift from traditional schemes." },
      { name: "Safety & Security", pct: 20, text: "Worries about fraud protection and the challenge of managing debt responsibly." },
      { name: "Credit Score", pct: 13, text: "How managing cards well affects scores; importance of timely bill payments." },
      { name: "Annual fees / APR / Late fees", pct: 11, text: "Financial pressure from student loans; preference for no or low annual fees." },
      { name: "Eligibility", pct: 8, text: "Meeting requirements at 18 to start building credit early." },
      { name: "Credit Limit", pct: 3, text: "Concerns over high limits offered to young students and the effect of history on limits." },
      { name: "Customer Service", pct: 2, text: "Frustration with long hold times and difficulty reaching representatives." },
      { name: "Others", pct: 3, text: "Loan forgiveness, car payments, rent and general card debt." },
    ],
  },

  motivation: {
    note:
      "Gen-Z values cards with rewards like cashback on everyday purchases, strong customer support, no or low annual fees, and sufficient credit limits to build history and manage expenses independently.",
    split: [
      { name: "Rewards / Benefits", pct: 40 },
      { name: "Credit score", pct: 26 },
      { name: "Customer Service", pct: 11 },
      { name: "Credit Limit", pct: 13 },
      { name: "Annual fees / APR / Low fees", pct: 10 },
    ],
    drivers: [
      { title: "Rewards / Benefits", text: "Cashback on everyday purchases, lifestyle-oriented programmes (dining, entertainment, travel) and no international transaction fees." },
      { title: "Credit Score", text: "Responsible use is a proactive step toward favourable terms on future loans, rentals and financial opportunities." },
      { title: "Customer Support", text: "Responsive, accessible service that resolves concerns promptly." },
      { title: "Annual fees / APR / Late fees", text: "No annual fee and minimal late, foreign-transaction and balance-transfer fees." },
      { title: "Credit Limit", text: "Financial flexibility for life transitions such as starting college or moving abroad." },
    ],
  },

  multi: {
    note:
      "Students using multiple cards considered it beneficial, choosing according to need. Others kept an alternate card as a backup for when the primary could not be used.",
    holders: [
      { name: "Single credit card", pct: 71 },
      { name: "Multiple credit cards", pct: 29 },
    ],
    sentiment: [
      { name: "Positive", pct: 52, tone: "pos" },
      { name: "Negative", pct: 10, tone: "neg" },
      { name: "Neutral", pct: 38, tone: "neu" },
    ],
    single: {
      rows: [
        { name: "Rewards / Benefits", pct: 36 },
        { name: "Credit score", pct: 19 },
        { name: "Annual fees / APR", pct: 15 },
        { name: "Customer Service", pct: 11 },
        { name: "Credit Limit", pct: 10 },
        { name: "Safety & Security", pct: 8 },
      ],
      points: [
        "Gen Z use starter cards from Discover: steady credit score, no annual fee and a decent credit limit.",
        "They often choose Capital One for dining out and entertainment thanks to attractive rewards.",
      ],
      quote: {
        text:
          "Discover It Student. This was my first card and this will forever be my answer as a good first card, especially as a college student. Very simple to use, and as a student they give you statement credits for good grades each semester.",
        source: "Reddit · r/CreditCards",
      },
    },
    multiple: {
      rows: [
        { name: "Rewards / Benefits", pct: 33 },
        { name: "Credit score", pct: 24 },
        { name: "Credit Limit", pct: 24 },
        { name: "Customer Service", pct: 14 },
        { name: "Annual fees / APR", pct: 5 },
      ],
      points: [
        "Some liked Capital One for most expenses but added travel cards for personal travel goals and larger category discounts.",
        "Switched from SavorOne to Discover for a better credit limit with only an authorised-user card on their report.",
      ],
      quote: {
        text:
          "Discover It Student. The CapitalOne SavorOne is technically the better card but you'll get a pathetic credit limit with them. Discover gave me $1500 with nothing but an AU card on my report.",
        source: "Reddit · r/personalfinance",
      },
    },
  },
};

export default TEI_SAMPLE;
