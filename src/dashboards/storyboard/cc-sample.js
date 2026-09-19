// Placeholder payload for the Congruence & Content Intelligence storyboard
// (AI/LLM Audit and Analysis, Tier 2). Shape = chartsData.congruence_content.
// Contract: docs/ci-lens-contract-congruence-content.md. Deck: LLM_Analysis_as_
// ServiceOffering (all 8 slides). Sample brand: a beauty-industry client, as in
// the deck's case study. Every value is replaceable.
//
// Unlike the other CI lenses, the primary input here is LLM answers to a fixed
// prompt set run across several assistants; tagged articles are the "social
// validation" cross-check. See the contract.

export const CC_SAMPLE = {
  meta: {
    brand: "Glow Labs", category: "Beauty & Skincare", window: "Jul – Sep 2026",
    llms: ["ChatGPT", "Gemini", "Copilot", "Claude", "Perplexity", "Meta AI"],
    prompts_run: 48, responses: 288, sources_cited: 412,
    logos: {}, is_sample: true,
  },
  tabs: [
    { id: "t1", label: "Overview" },
    { id: "t2", label: "LLM Analysis" },
    { id: "t3", label: "LLM Interpretation" },
    { id: "t4", label: "Narrative Scan" },
  ],
  footer: ["Congruence & Content Intelligence · AI/LLM Audit and Analysis", "Sample data — values will be replaced by the brand's LLM audit run"],

  // ------------------------------------------------------------ tab 1 (p2–p6)
  overview: {
    banner: {
      eyebrow: "Congruence & Content Intelligence",
      headline: "Brands do not control how LLMs interpret them",
      sub: "How narratives travel through LLM ecosystems, what influences visibility, and how the brand can shape content to be more understandable, more quotable, and more likely to appear in generated responses.",
      stats: [{ value: "6", label: "LLMs analysed" }, { value: "48", label: "Prompts run" }, { value: "288", label: "Responses" }, { value: "412", label: "Sources cited" }],
    },
    note: "Six assistants answered the same prompt set. Sources, themes and sentiment below are aggregated across all responses; the Narrative Scan compares them with the brand's own positioning.",
    stages: [
      { n: 1, key: "analysis", title: "LLM Analysis", tone: "purple", questions: ["Who is shaping the conversation about the brand and category inside LLMs?", "Which sources appear most frequently in LLM responses?", "Where does influence concentrate?"], method: ["Source listing from LLM outputs", "Journalist and outlet identification", "Ranking by frequency, authority and reach"], deliverables: ["Ranked media source list", "Journalist / reporter influence map", "Network map of narrative drivers"] },
      { n: 2, key: "interpretation", title: "LLM Interpretation Study", tone: "blue", questions: ["How is the brand described across LLMs?", "What themes, sentiment and language dominate?", "Where do positioning gaps or risks appear?"], method: ["Run standardised prompts across multiple LLMs", "Analyse outputs for narrative themes, emotional tone, language cues, positioning alignment"], deliverables: ["LLM interpretation report", "Theme & sentiment matrices", "Narrative strength and consistency scores"] },
      { n: 3, key: "scan", title: "Brand Narrative Intelligence Scan", tone: "green", questions: ["Where does AI perception align with brand intent?", "Where does it diverge?", "Which narratives are being reinforced or diluted?"], method: ["Cross-channel narrative comparison", "Consistency and differentiation assessment", "Perception-shaping signal analysis"], deliverables: ["Brand vs. LLM narrative gap analysis", "Consistency / incongruence heat-map", "Opportunity and risk flags"] },
    ],
    inputs: ["Sources & Reports", "Category & Cultural Context", "Brand KPIs", "LLM Prompts"],
    datasets: ["LLM sources (ChatGPT, Perplexity, Gemini, …)", "Social validation (tagged posts)", "Secondary research"],
    outcomes: [
      { title: "LLM Signals", items: ["Sources", "Journalists", "Publishers"] },
      { title: "LLM Interpretation", items: ["Themes", "Sentiment", "Positioning"] },
      { title: "Narrative Intelligence", items: ["Alignment", "Risks", "Opportunities"] },
      { title: "Strategic Outcomes", items: ["Smarter messaging", "Media prioritisation", "AI-ready brand narrative"] },
    ],
  },

  // ------------------------------------------------------------ tab 2 (p5, p8 list)
  analysis: {
    banner: {
      eyebrow: "LLM Analysis · who shapes the narrative",
      headline: "Twelve outlets and nine journalists drive most of what LLMs say",
      sub: "Sources and reporters cited in LLM responses about the brand and its category, ranked by citation frequency, authority and reach. Influence concentrates in trade press and two social platforms.",
      stats: [{ value: "412", label: "Sources cited" }, { value: "37%", label: "Top 5 sources' share" }, { value: "Allure", label: "Most-cited outlet" }, { value: "9", label: "Named journalists" }],
    },
    note: "Citations counted across all responses; a source cited by several LLMs for one prompt counts once per LLM. Reach is the outlet's monthly audience where known.",
    source_types: [
      { name: "Trade & beauty press", pct: 38 }, { name: "Reddit", pct: 22 }, { name: "Brand & retailer sites", pct: 15 }, { name: "Dermatologist / expert blogs", pct: 11 }, { name: "YouTube / TikTok transcripts", pct: 9 }, { name: "News wires", pct: 5 },
    ],
    sources: [
      { name: "Allure", type: "Trade press", mentions: 61, reach: "9.2M", llms: ["ChatGPT", "Gemini", "Perplexity", "Copilot"] },
      { name: "Byrdie", type: "Trade press", mentions: 47, reach: "6.1M", llms: ["ChatGPT", "Perplexity", "Claude"] },
      { name: "r/SkincareAddiction", type: "Reddit", mentions: 44, reach: "3.4M", llms: ["Perplexity", "Gemini", "Meta AI"] },
      { name: "Sephora.com", type: "Retailer", mentions: 38, reach: "—", llms: ["Copilot", "ChatGPT"] },
      { name: "Paula's Choice Ingredient Dictionary", type: "Expert", mentions: 29, reach: "1.1M", llms: ["Claude", "Perplexity"] },
      { name: "Harper's Bazaar", type: "Trade press", mentions: 24, reach: "5.5M", llms: ["Gemini", "ChatGPT"] },
      { name: "Lab Muffin Beauty Science", type: "Expert blog", mentions: 21, reach: "0.8M", llms: ["Perplexity", "Claude"] },
      { name: "Vogue", type: "Trade press", mentions: 19, reach: "12.3M", llms: ["Gemini"] },
    ],
    journalists: [
      { name: "Jessica Cruel", outlet: "Allure", mentions: 23, beat: "Skincare launches, ingredient trends" },
      { name: "Michelle Wong", outlet: "Lab Muffin", mentions: 18, beat: "Cosmetic chemistry, myth-busting" },
      { name: "Faith Xue", outlet: "Byrdie", mentions: 16, beat: "Routines, dermatologist Q&A" },
      { name: "Jenna Rosenstein", outlet: "Harper's Bazaar", mentions: 12, beat: "Luxury skincare, editor picks" },
      { name: "Dr. Shereene Idriss", outlet: "YouTube / Instagram", mentions: 11, beat: "Dermatologist reviews" },
      { name: "Sable Yong", outlet: "Allure / Freelance", mentions: 9, beat: "Culture, clean-beauty critique" },
    ],
    concentration: "The top five sources account for 37% of all citations and appear in four of six LLMs. Perplexity and Gemini lean on Reddit threads; ChatGPT and Copilot favour retailer and trade-press pages.",
  },

  // ------------------------------------------------------------ tab 3 (p5, p8 pie + bubbles)
  interpretation: {
    banner: {
      eyebrow: "LLM Interpretation Study · how the brand is described",
      headline: "Efficacy and clean formulation lead; price is the recurring caveat",
      sub: "Themes, emotional tone and language across all responses. LLMs describe the brand as science-led and gentle, but most mention premium pricing and several question long-term results.",
      stats: [{ value: "56%", label: "Positive" }, { value: "27%", label: "Negative" }, { value: "17%", label: "Neutral" }, { value: "72", label: "Narrative strength · /100" }],
    },
    note: "Sentiment is per response. Theme size is the number of responses touching the theme; sub-themes are the most frequent qualifiers inside each.",
    sentiment: { pos: 56, neg: 27, neu: 17 },
    sentiment_note: "Positive sentiment is driven by ingredient transparency and visible hydration results. Negative sentiment centres on price relative to drugstore alternatives and inconsistent results for acne-prone skin.",
    themes: [
      { name: "Ingredient efficacy", count: 186, sub: ["Niacinamide", "Barrier repair", "Clinical claims"] },
      { name: "Clean / sensitive-skin positioning", count: 142, sub: ["Fragrance-free", "Dermatologist-tested"] },
      { name: "Price & value", count: 121, sub: ["Premium tier", "Drugstore comparison"] },
      { name: "Sustainability", count: 88, sub: ["Refillable packaging", "Sourcing"] },
      { name: "Routine fit", count: 74, sub: ["Layering", "Morning vs night"] },
      { name: "Availability", count: 52, sub: ["Sephora", "DTC only"] },
    ],
    matrix: {
      llms: ["ChatGPT", "Gemini", "Copilot", "Claude", "Perplexity", "Meta AI"],
      rows: [
        { theme: "Ingredient efficacy", values: [72, 68, 61, 75, 70, 58] },
        { theme: "Clean / sensitive-skin", values: [66, 71, 64, 69, 60, 62] },
        { theme: "Price & value", values: [-22, -18, -30, -12, -25, -35] },
        { theme: "Sustainability", values: [41, 55, 38, 47, 52, 30] },
        { theme: "Routine fit", values: [35, 28, 40, 44, 33, 25] },
      ],
      legend: "Net sentiment per LLM within the theme, -100 to +100.",
    },
    language: ["science-backed", "gentle", "premium", "minimalist", "dermatologist-approved", "pricey", "hydrating", "clean"],
    scores: [
      { name: "Narrative strength", value: 72, text: "How clearly a single brand story comes through." },
      { name: "Consistency across LLMs", value: 64, text: "How similar the six assistants' descriptions are." },
      { name: "Positioning alignment", value: 58, text: "Overlap between LLM descriptions and intended positioning." },
    ],
  },

  // ------------------------------------------------------------ tab 4 (p5 scan)
  scan: {
    banner: {
      eyebrow: "Brand Narrative Intelligence Scan · the delta",
      headline: "Science story lands; sustainability and inclusivity are being diluted",
      sub: "Where AI perception aligns with brand intent, where it diverges, and which narratives are being reinforced or lost. Each pillar is scored on how strongly LLMs reproduce it.",
      stats: [{ value: "5", label: "Narrative pillars" }, { value: "2", label: "Aligned" }, { value: "2", label: "Diluted" }, { value: "1", label: "Contradicted" }],
    },
    note: "Brand intent comes from the project's positioning statement. LLM narrative is the dominant description across responses. Alignment is the share of responses that reproduce the pillar.",
    pillars: [
      { name: "Science-led efficacy", intent: "Clinically proven actives at effective concentrations.", llm: "Described as science-backed with named actives; efficacy claims repeated.", align: 82, status: "aligned" },
      { name: "Gentle for sensitive skin", intent: "Fragrance-free, barrier-first formulation.", llm: "Consistently called gentle and dermatologist-tested.", align: 76, status: "aligned" },
      { name: "Sustainable by design", intent: "Refillable packaging and traceable sourcing.", llm: "Mentioned in under half of responses; sourcing rarely cited.", align: 41, status: "diluted" },
      { name: "Inclusive for all skin tones", intent: "Shade-agnostic skincare tested across Fitzpatrick types.", llm: "Almost absent; LLMs default to generic 'for all skin types'.", align: 23, status: "diluted" },
      { name: "Accessible premium", intent: "Worth-it pricing with value packs.", llm: "Framed as expensive versus drugstore alternatives.", align: 18, status: "contradicted" },
    ],
    heatmap: {
      llms: ["ChatGPT", "Gemini", "Copilot", "Claude", "Perplexity", "Meta AI"],
      rows: [
        { pillar: "Science-led efficacy", values: [88, 80, 74, 90, 84, 76] },
        { pillar: "Gentle for sensitive skin", values: [78, 82, 70, 80, 72, 74] },
        { pillar: "Sustainable by design", values: [44, 58, 30, 48, 50, 16] },
        { pillar: "Inclusive for all skin tones", values: [26, 30, 18, 34, 22, 8] },
        { pillar: "Accessible premium", values: [20, 24, 12, 28, 16, 8] },
      ],
      legend: "Share of that LLM's responses reproducing the pillar, 0–100.",
    },
    flags: [
      { tone: "risk", title: "Price framing", text: "Five of six LLMs frame the brand as expensive. The value-pack story never appears because no cited source carries it." },
      { tone: "risk", title: "Inclusivity narrative absent", text: "Shade-inclusive testing is not in any top-20 cited source, so LLMs cannot repeat it." },
      { tone: "opportunity", title: "Sustainability is one outlet away", text: "Gemini and Perplexity already surface refillable packaging via Byrdie. A second trade-press placement would lift the pillar above 50%." },
      { tone: "opportunity", title: "Own the efficacy story", text: "Science-led efficacy is the strongest pillar across all six LLMs. Anchor new content to named actives and clinical results." },
    ],
    actions: [
      "Brief Allure and Byrdie journalists (Cruel, Xue) on value packs and inclusive testing; they are the most-cited outlets in four LLMs.",
      "Publish a sourcing and refill page on the brand site; Copilot and ChatGPT cite retailer and brand pages most.",
      "Seed a Reddit AMA with a dermatologist partner; Perplexity, Gemini and Meta AI draw heavily on r/SkincareAddiction.",
    ],
  },
};

export default CC_SAMPLE;
