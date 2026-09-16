// Campaign domain config — per-campaign performance, coverage, reach, and
// message congruence, plus campaign-vs-campaign comparisons. Every intent
// here requires a "campaign"/"campaigns" filter, so entityExtractor.js's
// CAMPAIGN_CUE match (e.g. "campaign called Summer Launch") is forced to the
// front of the category pool — these names only surface when the question
// doesn't name a real campaign.
const config = {
  domain: "campaign",
  categoryPool: [
    "Summer Launch",
    "Product Reveal",
    "Holiday Push",
    "Brand Refresh",
    "Global Rollout",
    "Anniversary Campaign",
  ],
  kpiRange: { min: 25, max: 95 },
  kpiBands: { green: 70, amber: 40 },
  unit: "",
  barMin: 10,
  barMax: 100,
  continuations: [
    "strong earned media pickup at launch",
    "a well-timed executive media tour",
    "the paid amplification strategy",
    "message alignment across all channels",
    "the influencer partnerships driving reach",
  ],
  defaultFollowUp: [
    "Want to compare this to a past campaign?",
    "Should I break this down by channel?",
  ],
  defaultAction: [
    "Share this with the campaign team",
    "Add this to the campaign performance report",
  ],
};

export default config;
