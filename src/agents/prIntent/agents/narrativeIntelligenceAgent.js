// Narrative Intelligence domain config — dominant narratives, message
// congruence/adoption/gaps, and (via the PE-/ST- prefixed intents folded
// into this domain) executive visibility and top-story tracking. The
// category pool doubles as both narrative themes (for bar/donut "top
// narratives" intents) and message-pillar labels (for congruence/gap
// intents) since both are short thematic phrases in the source data.
const config = {
  domain: "narrativeIntelligence",
  categoryPool: [
    "Product Innovation",
    "Customer Trust",
    "Sustainability",
    "Leadership Vision",
    "Workplace Culture",
    "Market Expansion",
    "Crisis Response",
    "Financial Performance",
  ],
  kpiRange: { min: 30, max: 90 },
  kpiBands: { green: 70, amber: 40 },
  unit: "",
  barMin: 10,
  barMax: 100,
  continuations: [
    "a new product launch reframing the conversation",
    "competitor activity shifting the media agenda",
    "a shift in analyst and journalist framing",
    "increased attention following a leadership change",
    "social commentary amplifying one theme over others",
  ],
  defaultFollowUp: [
    "Want to see how this breaks down by theme?",
    "Should I compare this to the intended messaging?",
  ],
  defaultAction: [
    "Add this theme to the messaging tracker",
    "Share this with the narrative strategy team",
  ],
};

export default config;
