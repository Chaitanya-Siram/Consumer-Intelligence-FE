// Executive & Cross-KPI domain config — the catch-all for questions that
// span two or more of the other six KPI families (volume vs impact,
// coverage vs reputation, message vs media) plus executive-facing rollups
// (CEO/board briefings, key wins/risks, strategic recommendations). The
// category pool names the other domains themselves, since that's what a
// "gap"/"vs" cross-KPI chart is actually comparing.
const config = {
  domain: "executiveCrossKpi",
  categoryPool: [
    "Media Measurement",
    "PR Impact",
    "Narrative Intelligence",
    "Reputation Index",
    "Campaign Performance",
  ],
  kpiRange: { min: 30, max: 95 },
  kpiBands: { green: 70, amber: 45 },
  unit: "",
  barMin: 10,
  barMax: 100,
  continuations: [
    "coverage skewing toward lower-authority outlets",
    "sentiment softening even as volume grew",
    "message discipline slipping across channels",
    "reputation lagging behind visibility gains",
    "a disconnect between reach and quality of coverage",
  ],
  defaultFollowUp: [
    "Want the full cross-KPI breakdown for this period?",
    "Should I put this in the next executive briefing?",
  ],
  defaultAction: [
    "Add this to the next executive briefing",
    "Flag this gap for the strategy team",
  ],
};

export default config;
