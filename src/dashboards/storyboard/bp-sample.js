// Placeholder payload for the Brand Perception storyboard.
//
// Shape the backend is expected to return under `chartsData.brand_perception`
// (contract: docs/ci-lens-contract-brand-perception.md). Until then the screen
// renders this sample (Gen-Z student credit cards, deck pages 15–17) with a
// "Sample data" pill. Every value is replaceable. Prose may carry <mark>…</mark>.

export const BP_SAMPLE = {
  meta: {
    brand: "Discover",
    category: "Gen-Z Student Credit Cards",
    window: "Jan – Jun 2024",
    total_mentions: 4130,
    logos: {},               // backend fills { "Discover": "https://…", … }
    is_sample: true,
  },

  tabs: [
    { id: "t1", label: "Brand Perception" },
    { id: "t2", label: "Popularity" },
    { id: "t3", label: "Switchover Intent" },
  ],

  footer: [
    "Brand Perception · Brand Intelligence",
    "Sample data — values will be replaced by the session's tagged posts",
  ],

  // ---------------------------------------------------------------- tab 1 (p15)
  perception: {
    banner: {
      eyebrow: "Brand Perception",
      headline: "Discover owns the student-card conversation",
      sub: "Key discussion points include comparing different card benefits, such as cash back rewards, the good grades program, credit building opportunities, and student-friendly features.",
      stats: [
        { value: "65%", label: "Discover share of voice" },
        { value: "4", label: "Brands tracked" },
        { value: "6", label: "Products discussed" },
        { value: "#1", label: "Best student card · US News" },
      ],
    },
    note: "Popularity is the share of brand-tagged posts naming each issuer. Product cards summarise what the conversation says about each named card.",
    summary: "Students appreciate credit cards that offer cash back rewards, easy credit limit growth, and no fees, with a focus on building credit and managing spending.",
    keywords: ["cash back", "good grades program", "credit limit growth", "no fees", "credit building"],
    popularity: [
      { name: "Discover", pct: 65, is_brand: true },
      { name: "Capital One", pct: 24 },
      { name: "Chase", pct: 16 },
      { name: "Bank of America", pct: 13 },
    ],
    products: [
      {
        brand: "Discover", name: "Discover it® Student Cash Back",
        tags: ["Cash back", "Good grades", "Credit building"],
        award: "Best Credit Cards for Students · US News, July 2024",
        text: "Topics of discussion focused on benefits associated with the card, including cash back rewards, the good grades program, credit building, and student-friendly features.",
        quote: { text: "I got this credit card my senior year of college and it has been amazing! I get to build my credit while getting cash back for all my purchases.", source: "Reddit" },
      },
      {
        brand: "Discover", name: "Discover it® Student Chrome",
        tags: ["Easy use", "Payment reminders", "Good grades"],
        text: "Customers are attracted to this card for its easy use, cash back bonuses, payment reminders, and rewards for good grades, making it ideal for building credit and managing spending as a student.",
        quote: { text: "Love easy use, cash back bonuses, reminders to pay with the app, and the ability to get free cash with good grades.", source: "Reddit" },
      },
      {
        brand: "Capital One", name: "Capital One Quicksilver Student",
        tags: ["1.5% cash back", "$200 bonus", "Simplicity"],
        text: "Appreciated by users seeking simplicity and flexibility. Students value the straightforward 1.5% cash back and $200 bonus after $500 spend in 3 months.",
        quote: { text: "I love my Capital One Quicksilver card and I think you will too! Unlimited rewards on every purchase and a $200 bonus if you spend $500 in 3 months.", source: "X" },
      },
      {
        brand: "Capital One", name: "Capital One SavorOne Student",
        tags: ["3x dining", "No annual fee", "Miles conversion"],
        text: "Ideal with 3x rewards on dining, groceries, entertainment and streaming, no annual fee, and options to convert cash back to miles for travel upgrades.",
        quote: { text: "If you have income, get the CapitalOne SavorOne for restaurants and groceries.", source: "Reddit" },
      },
      {
        brand: "Chase", name: "Chase Freedom Rise",
        tags: ["Credit newbies", "Limit growth", "Chase ecosystem"],
        text: "Ideal for those new to credit, offering features designed to support credit newbies. Students like it for easy credit limit growth.",
        quote: { text: "Got it 6+ months ago with a $500 limit, spoke to reconsideration and now have a $2000 limit. And it gets you in the door with Chase.", source: "Reddit" },
      },
      {
        brand: "Bank of America", name: "BoA Travel Rewards for Students",
        tags: ["Travel rewards", "No annual fee", "No FX fees"],
        text: "Appreciated by students looking for flexible travel rewards, no annual fee and no foreign transaction fees.",
      },
    ],
  },

  // ---------------------------------------------------------------- tab 2 (p16)
  popularity: {
    banner: {
      eyebrow: "Popularity",
      headline: "Starter cards win on accessibility and app features",
      sub: "Gen Z notes starter cards for ease of accessibility and user-friendly features such as free credit scores and spending alerts. They prioritise no foreign transaction fees for international use and leverage tactics like becoming an authorized user to build credit early.",
      stats: [
        { value: "65%", label: "Discover" },
        { value: "24%", label: "Capital One" },
        { value: "16%", label: "Chase" },
        { value: "13%", label: "Bank of America" },
      ],
    },
    note: "Share of brand-tagged posts. A post can name more than one issuer, so shares need not sum to 100.",
    lead: "As Gen Zs tend to note <mark>starter cards</mark> for their ease of accessibility and user-friendly features such as <mark>free credit scores and spending alerts</mark>, they prioritise cards with <mark>no foreign transaction fees</mark> and become <mark>authorized users</mark> to build credit early.",
    brands: [
      { name: "Discover", pct: 65, is_brand: true, points: [
        "Discover it Student Cash Back card is frequently mentioned as being <mark>easy to obtain</mark> for students, making it a popular choice for first-time credit card users.",
        "The card and its app are praised for being <mark>user-friendly</mark>, with features like free monthly credit scores.",
      ] },
      { name: "Capital One", pct: 24, points: [
        "Users preferred Capital One cards for their comprehensive lineup of <mark>no foreign transaction fee</mark> options.",
        "Many report success building credit by being added as <mark>authorized users</mark> on a parent's Capital One card, such as Quicksilver.",
      ] },
      { name: "Chase", pct: 16, points: [
        "Gen Z generally praises Chase cards like Freedom Unlimited for attractive <mark>perks and rewards</mark>, such as points systems and fee waivers.",
      ] },
      { name: "Bank of America", pct: 13, points: [
        "Praised for accessibility to <mark>international students without an SSN</mark>, no annual fees and rewards points.",
        "Some express dissatisfaction with high fees and lower acceptance compared to Visa and Mastercard options.",
      ] },
    ],
  },

  // ---------------------------------------------------------------- tab 3 (p17)
  switching: {
    banner: {
      eyebrow: "Switchover Intent",
      headline: "Rewards drive two in five switches",
      sub: "Gen Z switches cards for value first: better rewards, a smoother move from student to regular products, and a second card for backup. Major networks and long-term credit history round out the reasons.",
      stats: [
        { value: "42%", label: "Switch for rewards" },
        { value: "21%", label: "Student → regular" },
        { value: "5", label: "Switch drivers" },
        { value: "16%", label: "Carry multiple cards" },
      ],
    },
    note: "Reasons are the share of switching-intent posts citing each driver. Posts are verbatim.",
    reasons: [
      { key: "rewards", short: "Rewards and Benefits", title: "High Value on Rewards and Benefits", pct: 42, text: "Gen Z values credit cards with high cashback rates, no foreign transaction fees, and user-friendly app features for efficient financial management." },
      { key: "transition", short: "Student to Regular Cards", title: "Transitioning from Student to Regular Cards", pct: 21, text: "Moving from student to regular cards involves higher limits and wider acceptance, with challenges like limited credit increases, prompting choices between keeping multiple cards or switching for better terms." },
      { key: "multiple", short: "Multiple Cards", title: "Multiple Cards for Security and Flexibility", pct: 16, text: "Gen Z values multiple cards for added security and flexibility. They seek cards that complement each other in rewards and features." },
      { key: "network", short: "Major Networks and Banks", title: "Preference for Major Networks and Banks", pct: 16, text: "Gen Z prefers cards from major networks for broad acceptance and from well-known banks for reliable service and upgrade potential." },
      { key: "history", short: "Long-Term Credit History", title: "Building Long-Term Credit History", pct: 16, text: "Gen Z strategically uses student cards to build credit early. They favour cards that transition to regular versions without impacting their credit score." },
    ],
    posts: [
      {
        source: "Forum", title: "Credit Card Question for College Freshman",
        text: "Figure out what card you want and get the student version, with the intention of holding onto that card for a long time. Once you have a job and income, you can product-change that student card into the full version without losing your credit history.",
        reply: "I probably wouldn't get a Discover card. They aren't accepted as many places as Mastercard or Visa. You're better off getting a card from a major bank.",
      },
      {
        source: "Reddit · r/personalfinance", title: "Switching banks with my current student credit card. Upgrade or cancel?",
        text: "I have a student card with a large bank and want to switch to a regional bank with branches close to me. The new bank offers a good rewards card. Should I cancel, upgrade, or get a second card and live with two?",
        reply: "Just leave it alone. Product changes don't impact you at all. It's always good to have more than one card as backup should the primary not work.",
      },
    ],
  },
};

export default BP_SAMPLE;
