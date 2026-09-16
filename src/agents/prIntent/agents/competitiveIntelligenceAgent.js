// Competitive Intelligence domain config — share of voice, impact/
// reputation/narrative benchmarks against named competitors. Every intent
// here requires a "competitors" filter, so entityExtractor.js's COMPETITOR_CUE
// match (e.g. "vs Acme Corp") is forced to the front of the category pool by
// baseAgent's pickCategories() — these placeholder names only show up when
// the question doesn't name a real competitor.
const config = {
  domain: "competitiveIntelligence",
  categoryPool: ["Acme Corp", "Globex", "Initech", "Umbrella Inc", "Stark Industries"],
  kpiRange: { min: 15, max: 90 },
  kpiBands: { green: 60, amber: 35 },
  unit: "",
  barMin: 5,
  barMax: 100,
  continuations: [
    "a wave of positive trade press",
    "aggressive executive visibility this period",
    "a major product announcement",
    "stronger social media engagement",
    "more consistent message discipline",
  ],
  defaultFollowUp: [
    "Want to benchmark this against a different competitor?",
    "Should I break this down by narrative theme?",
  ],
  defaultAction: [
    "Share this comparison with the strategy team",
    "Add this benchmark to the competitive tracker",
  ],
};

export default config;
