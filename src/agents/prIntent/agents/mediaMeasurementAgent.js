// Media Measurement domain config — coverage volume, reach, tier/outlet mix,
// share of voice. Feeds `baseAgent.generateResponse()` the pieces that make
// a Media Measurement answer look like one: outlet-shaped categories, a
// 0-100 "coverage index" KPI range, and continuation clauses that plausibly
// follow "...caused by", "...contributed by" style open-ended templates
// (see mediaMeasurement's answerTemplates in data/intentLibrary.json).
const config = {
  domain: "mediaMeasurement",
  categoryPool: [
    "TechCrunch",
    "Forbes",
    "Reuters",
    "Bloomberg",
    "The Wall Street Journal",
    "The Verge",
    "Axios",
    "CNBC",
    "Business Insider",
    "Associated Press",
  ],
  kpiRange: { min: 45, max: 95 },
  kpiBands: { green: 75, amber: 55 },
  unit: "",
  barMin: 20,
  barMax: 100,
  continuations: [
    "driven by a wave of earned media pickup",
    "amplified by a key spokesperson interview",
    "concentrated among top-tier trade outlets",
    "tied to the latest product announcement",
    "boosted by social media amplification",
  ],
  defaultFollowUp: [
    "Want to see this broken out by outlet tier?",
    "Should I compare this to the previous period?",
  ],
  defaultAction: [
    "Share this view with the comms team",
    "Export the underlying coverage list",
  ],
};

export default config;
