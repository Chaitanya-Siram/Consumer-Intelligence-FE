// Reputation Index domain config — the composite reputation score, its
// drivers/risks/opportunities, and market/theme breakdowns. The category
// pool uses the classic reputation-measurement pillars (RepTrak-style:
// products/services, innovation, workplace, governance, citizenship,
// leadership, financial performance) since RI-/RK- intents repeatedly ask
// "reputation by theme" / "biggest drivers" style questions.
const config = {
  domain: "reputationIndex",
  categoryPool: [
    "Products & Services",
    "Innovation",
    "Workplace",
    "Governance",
    "Citizenship",
    "Leadership",
    "Financial Performance",
  ],
  kpiRange: { min: 35, max: 95 },
  kpiBands: { green: 75, amber: 50 },
  unit: "",
  barMin: 10,
  barMax: 100,
  continuations: [
    "strong governance and leadership perception",
    "consistent positive sentiment across markets",
    "a recent product issue drawing scrutiny",
    "sustained trust gains after the crisis response",
    "concerns about workplace culture surfacing in coverage",
  ],
  defaultFollowUp: [
    "Want to see the drivers behind this score?",
    "Should I flag this as an emerging risk?",
  ],
  defaultAction: [
    "Escalate this to the reputation risk team",
    "Add this to the reputation watchlist",
  ],
};

export default config;
