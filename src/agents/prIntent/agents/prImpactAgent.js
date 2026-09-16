// PR Impact domain config — the composite impact score, its drivers
// (reach, prominence, sentiment, spokesperson quality), and story/executive
// rankings. Several intents here key off a "Person" filter (spokesperson,
// executive), so the category pool leans on role titles rather than outlet
// names — entityExtractor.js already forces a named person to the front of
// the pool when the question mentions one (e.g. "our CEO").
const config = {
  domain: "prImpact",
  categoryPool: [
    "CEO",
    "CFO",
    "COO",
    "Chief Communications Officer",
    "VP of Marketing",
    "Founder",
    "Board Chair",
    "General Counsel",
  ],
  kpiRange: { min: 35, max: 92 },
  kpiBands: { green: 70, amber: 45 },
  unit: "",
  barMin: 15,
  barMax: 100,
  continuations: [
    "strong executive quotes and clear messaging",
    "high-authority outlets picking up the story",
    "weak call-to-action framing in the coverage",
    "the story lacking a compelling data point",
    "broad but shallow, generalist coverage",
  ],
  defaultFollowUp: [
    "Want to see which driver moved this the most?",
    "Should I break this down by spokesperson?",
  ],
  defaultAction: [
    "Flag this for the executive brief",
    "Share this with the spokesperson coaching team",
  ],
};

export default config;
