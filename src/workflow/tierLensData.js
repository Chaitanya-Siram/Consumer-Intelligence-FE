// Tier 1 and Tier 2 lens data — ported from ConsumerIntelligence_PR reference project.
// Do not merge into constants.js; kept isolated to avoid touching existing code.
//
// A Tier 2 entry with a `route` (a key into `paths` in router/nav.js) is real:
// the Tier 2 gallery (screens/IntelLensScreen.jsx) navigates straight to that
// charts-backed dashboard. `slide` additionally picks an initial tab/lens
// within that dashboard. Entries without a `route` are UI-only placeholders.

const IMG = (id) => `https://images.unsplash.com/photo-${id}?w=480&h=220&fit=crop&auto=format`

export const TIER1_LENSES = [
  {
    key: 'brand_intelligence',
    label: 'Brand Intelligence',
    description: 'Every brand-related lens in one place — health, competitive standing, and product-level intelligence.',
    image: IMG('1557804506-669a67965ba0'),
  },
  {
    key: 'market_intelligence',
    label: 'Market Intelligence',
    description: 'Twelve category lenses in one place — channel impact, trends, themes, launches, campaigns and regional performance.',
    image: IMG('1460925895917-afdab827c52f'),
  },
  {
    key: 'landscape_analysis',
    label: 'Landscape Analysis',
    description: 'Map the full conversational universe around your brand and category, surfacing dominant narratives, sentiment shifts, and share of voice.',
    image: IMG('1451187580459-43490279c0fa'),
  },
  {
    key: 'advanced_metrics',
    label: 'Advanced Metrics',
    description: 'Track emerging themes and shifting audience priorities to reveal where conversations are heading before your competitors do.',
    image: IMG('1551288049-bebda4e38f71'),
  },
  {
    key: 'influencer_mapping',
    label: 'Influencer Mapping & Audience Segmentation',
    description: 'Uncover the loyalists, advocates, and silent switchers reshaping market share across your consumer cohorts.',
    image: IMG('1519389950473-47ba0277781c'),
  },
  {
    key: 'whitespace_gap_analysis',
    label: 'Whitespace & Gap Analysis',
    description: 'Identify the unmet needs and narrative gaps between evolving audience expectations and current brand performance.',
    image: IMG('1553877522-43269d4ea984'),
  },
  {
    key: 'regional_intelligence',
    label: 'Regional Intelligence',
    description: 'Visualize state-level sentiment, engagement, and brand perception to pinpoint priority markets and emerging risks.',
    image: IMG('1524661135-423995f22d0b'),
  },
  {
    key: 'network_map_analysis',
    label: 'Network Map Analysis',
    description: 'Map conversational clusters, influence pathways, and amplification patterns to reveal who truly shapes your narrative.',
    image: IMG('1544197150-b99a580bb7a8'),
  },
  {
    key: 'issues_intelligence',
    label: 'Issues Intelligence',
    description: 'Track emerging issues in real time, identifying risk drivers and narrative escalations before they reach the boardroom.',
    image: IMG('1504711434969-e33886168f5c'),
  },
  {
    key: 'crisis_solutioning',
    label: 'Crisis Solutioning',
    description: 'Detect reputational risks before they escalate with real-time crisis detection and actionable response strategies.',
    image: IMG('1583321500900-82807e458f3c'),
  },
  {
    key: 'reputation_index',
    label: 'Reputation Index',
    description: 'Continuously measure brand trust and reputation evolution against competitors to protect and grow brand equity.',
    image: IMG('1521791136064-7986c2920216'),
  },
]

export const TIER2_LENSES = {
  brand_intelligence: [
    {
      label: 'Brand Health',
      description: 'A composite read on brand health across awareness, consideration, preference, advocacy and trust.',
      route: 'health',
      image: IMG('1521791136064-7986c2920216'),
    },
    {
      label: 'Brand & Competitive',
      description: 'How the brand stacks up against its competitive set — share of voice, sentiment league and capture.',
      route: 'competitive',
      image: IMG('1552664730-d307ca884978'),
    },
    {
      label: 'Brand Product Intelligence',
      description: "The emerging themes shaping the brand's category — how each is growing, who is leading it, and where to place the next bet.",
      route: 'brandintel',
      image: IMG('1460925895917-afdab827c52f'),
    },
  ],
  market_intelligence: [
    { label: 'Channel Impact Analysis', description: 'Social post volume by brand across platforms.', route: 'marketintel', slide: 1, image: IMG('1551288049-bebda4e38f71') },
    { label: 'Industry Trends: Share of Voice', description: '13 trend categories across the category conversation.', route: 'marketintel', slide: 2, image: IMG('1611974789855-9c2a0a7236a3') },
    { label: 'Trend Tracking Across Semesters', description: 'Share-of-voice comparison across the last two half-year periods.', route: 'marketintel', slide: 3, image: IMG('1526628953301-3e589a6a8b74') },
    { label: 'Volume Trendline', description: 'Monthly conversation volume across the capture window.', route: 'marketintel', slide: 4, image: IMG('1560221328-12fe60f83ab8') },
    { label: 'Key Themes of Discussion', description: 'Half-year over half-year theme analysis.', route: 'marketintel', slide: 5, image: IMG('1560472354-b33ff0c44a43') },
    { label: 'Voice of User Analysis', description: 'Product trends and regional brand preferences.', route: 'marketintel', slide: 6, image: IMG('1524661135-423995f22d0b') },
    { label: 'Brand Analysis', description: 'Post type mix by platform, per brand.', route: 'marketintel', slide: 7, image: IMG('1611162616305-c69b3fa7fbe0') },
    { label: 'New Launches', description: 'Product category launch distribution.', route: 'marketintel', slide: 8, image: IMG('1504711434969-e33886168f5c') },
    { label: 'Campaigns', description: 'Named campaign engagement and total reach.', route: 'marketintel', slide: 9, image: IMG('1552664730-d307ca884978') },
    { label: 'Events & Conferences', description: 'Industry event coverage and sentiment.', route: 'marketintel', slide: 10, image: IMG('1726249686209-8f662c0322ed') },
    { label: 'Product Trends: Global', description: 'A four-quadrant global view of product trends.', route: 'marketintel', slide: 11, image: IMG('1620584898989-d39f7f9ed1b7') },
    { label: 'Regional Dashboards', description: 'Market-by-market coverage across every region tracked.', route: 'marketintel', slide: 12, image: IMG('1591696205602-2f950c417cb9') },
  ],
  landscape_analysis: [
    { label: 'Dominant Narratives', description: 'The stories currently shaping perception of your brand and category.', route: 'narratives', image: IMG('1504711434969-e33886168f5c') },
    { label: 'Sentiment Shifts', description: 'Where audience sentiment is moving, and how fast.', image: IMG('1553877522-43269d4ea984') },
    { label: 'Share of Voice', description: 'Who is winning the conversation across every channel that matters.', image: IMG('1478760329108-5c3ed9d495a0') },
    { label: 'Competitive Positioning', description: 'How you stack up against the brands shaping the same narrative.', image: IMG('1552664730-d307ca884978') },
    { label: 'Perception Analysis', description: 'User perception and emotions around the category: benefits, caution, sentiment drivers and outlook.', route: 'perception', image: IMG('1521791136064-7986c2920216') },
  ],
  advanced_metrics: [
    { label: 'Emerging Themes', description: 'The subjects gaining traction before they become mainstream.', image: IMG('1460925895917-afdab827c52f') },
    { label: 'Shifting Audience Priorities', description: "What your audience cares about now, and how that's changing.", route: 'priorities', image: IMG('1519389950473-47ba0277781c') },
    { label: 'Content Patterns', description: 'The formats and angles driving engagement right now.', image: IMG('1611162616305-c69b3fa7fbe0') },
    { label: 'Campaign Analysis', description: 'How specific campaigns are performing against the wider conversation.', image: IMG('1552664730-d307ca884978') },
  ],
  influencer_mapping: [
    { label: 'Behaviour Segmentation', description: 'The cohorts defined by how they act, not just who they are.', image: IMG('1519389950473-47ba0277781c') },
    { label: 'Engagement Patterns', description: 'How each audience segment interacts with your content.', image: IMG('1611162616305-c69b3fa7fbe0') },
    { label: 'Narrative Participation', description: "Who's amplifying your story, and who's contesting it.", image: IMG('1522202176988-66273c2fd55f') },
  ],
  whitespace_gap_analysis: [
    { label: 'Audience Expectation', description: "What your audience expects that isn't being delivered.", image: IMG('1553877522-43269d4ea984') },
    { label: 'Brand Messaging', description: 'Where your message diverges from what resonates.', image: IMG('1504711434969-e33886168f5c') },
    { label: 'Brand Performance', description: 'The gap between brand promise and lived audience experience.', image: IMG('1460925895917-afdab827c52f') },
  ],
  regional_intelligence: [
    { label: 'State-Level Sentiment', description: 'Sentiment broken down market by market.', image: IMG('1524661135-423995f22d0b') },
    { label: 'Engagement', description: 'Where engagement concentrates geographically.', image: IMG('1611162616305-c69b3fa7fbe0') },
    { label: 'Brand Perception', description: 'How perception varies by region.', image: IMG('1521791136064-7986c2920216') },
  ],
  network_map_analysis: [
    { label: 'Conversational Clusters', description: 'The groups driving distinct threads of the conversation.', image: IMG('1522202176988-66273c2fd55f') },
    { label: 'Influence Pathways', description: 'How a narrative moves from originator to mainstream.', image: IMG('1544197150-b99a580bb7a8') },
    { label: 'Amplification Patterns', description: 'What causes a story to spread, and how far.', image: IMG('1478760329108-5c3ed9d495a0') },
    {
      label: 'Network Overview',
      description: 'The network at a glance — accounts, connections and the bridge voices carrying a narrative between communities.',
      route: 'network',
      slide: 0,
      image: IMG('1451187580459-43490279c0fa'),
    },
    {
      label: 'Community Mapping',
      description: 'Every distinct community driving the conversation, mapped and ranked by mentions, engagement and sentiment.',
      route: 'network',
      slide: 1,
      image: IMG('1524661135-423995f22d0b'),
    },
    {
      label: 'Influencer Deep-Dive',
      description: 'A representative high-affinity voice from the warmest community — who they are and what they actually said.',
      route: 'network',
      slide: 2,
      image: IMG('1611162616305-c69b3fa7fbe0'),
    },
  ],
  issues_intelligence: [
    { label: 'Track Emerging Issues', description: 'Early signals of a brewing issue, before it escalates.', route: 'issues', image: IMG('1583321500900-82807e458f3c') },
    { label: 'Categorized', description: 'Issues grouped by type and root cause.', image: IMG('1553877522-43269d4ea984') },
    { label: 'Real-time', description: 'Live monitoring as an issue develops.', image: IMG('1504711434969-e33886168f5c') },
  ],
  crisis_solutioning: [
    { label: 'Detect Crisis', description: 'Automated flags the moment a risk crosses threshold.', image: IMG('1583321500900-82807e458f3c') },
    { label: 'Real-time', description: 'Live tracking through the life of a crisis.', image: IMG('1504711434969-e33886168f5c') },
    { label: 'Cause Analysis', description: 'What triggered it, and why it spread.', image: IMG('1553877522-43269d4ea984') },
    { label: 'Impact', description: 'The measurable effect on brand health and reputation.', image: IMG('1460925895917-afdab827c52f') },
  ],
  reputation_index: [
    { label: 'Measure Brand Trust', description: 'A continuous read on how much your audience trusts you.', image: IMG('1521791136064-7986c2920216') },
    { label: 'Perception Drivers', description: 'The specific factors moving your reputation up or down.', image: IMG('1553877522-43269d4ea984') },
    { label: 'Reputation Evolution vs Competitors', description: 'How your reputation trend compares to the field.', image: IMG('1552664730-d307ca884978') },
  ],
}

export function tier1Label(key) {
  return TIER1_LENSES.find((l) => l.key === key)?.label || ''
}

export function tier1Image(key) {
  return TIER1_LENSES.find((l) => l.key === key)?.image || ''
}

export function tier2Options(tier1Key) {
  return TIER2_LENSES[tier1Key] || []
}
