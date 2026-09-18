// Placeholder payloads for the three Regional Intelligence storyboards
// (State-Level Sentiment, Engagement, Brand Perception). One regional base
// record per market, sliced into the three lens payloads below. Shapes =
// chartsData.regional_sentiment / regional_engagement / regional_brand_perception.
// Contract: docs/ci-lens-contracts-regional.md. Deck: Regional Dashboard.pdf p2–9
// (car-care category, brand Armor All). Every value is replaceable.

const META = { brand: "Armor All", category: "Car Auto Appearance", window: "Jan – Dec 2025", logos: {}, is_sample: true };

// Sentiment splits are not in the deck; they are illustrative so the layout
// shows the element the backend will compute per region.
const REGIONS = [
  {
    key: "usa", name: "USA", flag: "🇺🇸", mentions: 6840,
    headline: "Shift from multi-purpose to specialised interior solutions",
    summary: "U.S. car enthusiasts are shifting from multi-purpose products to specialized interior and upholstery solutions, emphasizing visible results and convenience. Meguiar's, Armor All, Chemical Guys and Turtle Wax lead with innovative, niche products. Consumers value hydrophobic finishes, stain removal and ceramic protection, while minor challenges include streaking and chemical sensitivity.",
    insights: [
      "Leading brands like Meguiar's and Turtle Wax deliver innovative detailing solutions: specialty products for <mark>water stains, iron removal, ceramic protection</mark> and trim restoration.",
      "Product effectiveness leads consumer priorities, with strong emphasis on a <mark>high-quality final finish</mark> and convenient application.",
      "From H1 to H2 2025 preference shifted from Multi-Purpose Products (42% to 24%) to <mark>Interior and Upholstery Cleaners (12% to 44%)</mark>. Niche categories like Wheel/Tire Cleaner emerged.",
    ],
    sentiment: { pos: 58, neu: 31, neg: 11 },
    themes: [{ name: "Product Efficacy", sub: "Functionality", pct: 74 }, { name: "Final Finish", sub: "Premium", pct: 37 }, { name: "Convenience", sub: "Effortlessness", pct: 22 }],
    types_h1: [{ name: "Multi Purpose Products", pct: 42 }, { name: "Ceramic/SiO2 Powered", pct: 14 }, { name: "Interior and Upholstery", pct: 12 }, { name: "Fragrance washes", pct: 7 }, { name: "Detailing Accessories", pct: 4 }, { name: "Others", pct: 17 }],
    types_h2: [{ name: "Interior and Upholstery", pct: 44 }, { name: "Multi Purpose Products", pct: 24 }, { name: "Ceramic/SiO2 Powered", pct: 10 }, { name: "Detailing Accessories", pct: 3 }, { name: "Wheel/Tyre Cleaner", pct: 2 }],
    brands: [{ name: "Turtle Wax", pct: 27 }, { name: "Meguiar's", pct: 15 }, { name: "Chemical Guys", pct: 12 }, { name: "Armor All", pct: 9, is_brand: true }, { name: "Carpro", pct: 5 }, { name: "Others", pct: 32 }],
    others: ["Carex", "Car Guys", "MTX Lexol", "NuFinish"],
    topics: [
      { brand: "Turtle Wax", text: "Hybrid solutions stand out for <mark>ultra-fast application</mark>, deep gloss, ceramic-grade shine and long-lasting water beading, achieving professional results without professional pricing or effort." },
      { brand: "Meguiar's", text: "Quick waterless cleaning, spray-on buff-off convenience, durable <mark>hydrophobic shine</mark>, dust protection, portable single-bottle efficiency, suitable for winter and apartment use." },
      { brand: "Chemical Guys", text: "Trusted for consistent, reliable performance: safe formulations, long-lasting accessories and <mark>water-beading protection</mark> that keeps vehicles cleaner for longer." },
    ],
  },
  {
    key: "uk", name: "UK", flag: "🇬🇧", mentions: 3120,
    headline: "Quick, convenient solutions with a showroom finish",
    summary: "Autoglym, Meguiar's and Turtle Wax lead the UK car care market, trusted for quick, convenient solutions that provide long-lasting protection and a premium, showroom-quality finish. Interest remains strong in interior cleaning and quick detailing, with the most notable shift being the strong growth in interior cleaners.",
    insights: [
      "Autoglym, Meguiar's, Turtle Wax and Armor All are preferred brands, combining effective performance, <mark>user-friendly application</mark> and visible finish enhancement.",
      "Detailing enthusiasts report excellent results with ceramic products used as directed; <mark>spray-on / wipe-off</mark> formats praised for practicality.",
      "Interior cleaners grew from <mark>17% to 33%</mark>. Bundles/kits emerged, reflecting value-focused purchases.",
    ],
    sentiment: { pos: 61, neu: 30, neg: 9 },
    themes: [{ name: "Product Efficacy", sub: "Thoroughness", pct: 68 }, { name: "Convenience", sub: "Ease of use", pct: 34 }, { name: "Final Finish", sub: "Premium look", pct: 29 }],
    types_h1: [{ name: "Interior and Upholstery", pct: 17 }, { name: "Quick detailers", pct: 7 }, { name: "Waterless Wash", pct: 7 }, { name: "Ceramic/SiO2 Powered", pct: 6 }, { name: "Car Polish", pct: 5 }, { name: "Wheel/Tire Cleaner", pct: 3 }],
    types_h2: [{ name: "Interior and Upholstery", pct: 33 }, { name: "Quick detailers", pct: 11 }, { name: "Ceramic/SiO2 Powered", pct: 9 }, { name: "Bundles and Kits", pct: 6 }, { name: "Detailing Accessories", pct: 3 }],
    brands: [{ name: "Autoglym", pct: 26 }, { name: "Meguiar's", pct: 11 }, { name: "Turtle Wax", pct: 10 }, { name: "Gtechniq", pct: 10 }, { name: "Armor All", pct: 10, is_brand: true }, { name: "Wolfgang", pct: 7 }, { name: "MTX", pct: 6 }, { name: "Auto Finesse", pct: 5 }, { name: "Others", pct: 14 }],
    others: ["Klasse", "SONAX", "Chemical Guys", "CarPro", "Menzerna", "Car Guys"],
    topics: [
      { brand: "Autoglym", text: "Trusted among detailing enthusiasts for high-quality, <mark>reliable performance</mark>, ease of use and consistently professional, time-saving results." },
      { brand: "Meguiar's", text: "Well regarded for rich foam, easy application, lasting shine and <mark>hydrophobic protection</mark>, delivering showroom-like results with minimal effort." },
      { brand: "Armor All", text: "Popular for quick, convenient cleaning, pleasant fragrance and good value, though <mark>mixed performance and packaging issues</mark> affect consistency." },
    ],
  },
  {
    key: "germany", name: "Germany", flag: "🇩🇪", mentions: 2410,
    headline: "Sonax dominates on reliability; low-effort, visible results win",
    summary: "German consumers increasingly prioritize high-performing products that deliver immediate visible results, favoring low-effort cleaning solutions that save time while still providing a premium, well-finished appearance. Sonax leads for consistent and reliable performance, while Meguiar's appeals to detailing enthusiasts for professional-grade results.",
    insights: [
      "Sonax leads with strong trust and loyalty, valued for <mark>consistent, streak-free and cost-effective</mark> performance. Other brands have minimal impact.",
      "Posts highlight strong performance across shampoos, wheel/rim cleaners, glass cleaners, quick detailers, ceramic sprays and tire shines.",
      "Interest shifted from interior cleaners to <mark>multi-surface cleaners</mark>; multi-purpose products declined; waterless wash gained moderate traction.",
    ],
    sentiment: { pos: 64, neu: 29, neg: 7 },
    themes: [{ name: "Product Efficacy", sub: "Reliability", pct: 52 }, { name: "Final Finish", sub: "Visible shine", pct: 15 }, { name: "Convenience", sub: "Effortless application", pct: 13 }],
    types_h1: [{ name: "Interior and Upholstery", pct: 29 }, { name: "Multi Purpose Products", pct: 13 }, { name: "Wash and wax with sealant", pct: 3 }, { name: "Bundles and Kits", pct: 3 }, { name: "Waterless Wash", pct: 3 }, { name: "Car Polish", pct: 3 }],
    types_h2: [{ name: "Multi surface Cleaners", pct: 13 }, { name: "Interior and Upholstery", pct: 12 }, { name: "Multi Purpose Products", pct: 7 }, { name: "Waterless Wash", pct: 5 }, { name: "Bundles and Kits", pct: 3 }],
    brands: [{ name: "Sonax", pct: 70 }, { name: "Meguiar's", pct: 7 }, { name: "Turtle Wax", pct: 7 }, { name: "Armor All", pct: 2, is_brand: true }, { name: "Griot's Garage", pct: 2 }, { name: "Lexol", pct: 1 }, { name: "Menzerna", pct: 1 }, { name: "Others", pct: 10 }],
    others: ["Chemical Guys", "Nu Finish", "Mothers"],
    topics: [
      { brand: "Sonax", text: "Trusted as a reliable brand: <mark>streak-free cleaning</mark>, long-lasting protection, gentle formulas, pleasant scent, economical with premium results, driving strong loyalty." },
      { brand: "Meguiar's", text: "Praised for professional, easy-to-use solutions for tires, plastics, glass and wax with natural finish and strong protection, though <mark>packaging issues</mark> and careful application are sometimes needed." },
    ],
  },
  {
    key: "australia", name: "Australia", flag: "🇦🇺", mentions: 1980,
    headline: "Performance-led, low-effort maintenance routines",
    summary: "Australian consumers show preference for established brands like Meguiar's, CarPro and Bowden's Own, driving a shift toward performance-led, low-effort car maintenance. Growth in interior cleaners and quick detailers signals a preference for frequent, practical maintenance routines.",
    insights: [
      "Meguiar's, CarPro and Bowden's Own are favoured for easy-to-use, high-performance care delivering strong cleaning, gloss, protection and value, earning <mark>loyal repeat use</mark>.",
      "Consumers prioritised <mark>product efficacy</mark> most, then convenience, while final finish remained important.",
      "Interior & Upholstery cleaners stayed the leading category; interest shifted toward <mark>quick detailers</mark> for efficient upkeep.",
    ],
    sentiment: { pos: 66, neu: 27, neg: 7 },
    themes: [{ name: "Product Efficacy", sub: "Practicality", pct: 33 }, { name: "Convenience", sub: "Frequency", pct: 20 }, { name: "Final Finish", sub: "Polished look", pct: 18 }],
    types_h1: [{ name: "Interior and Upholstery", pct: 21 }, { name: "Ceramic/SiO2 Powered", pct: 15 }, { name: "Detailing Accessories", pct: 11 }, { name: "Car Polish", pct: 6 }, { name: "Wheel/Tire Cleaner", pct: 4 }, { name: "Multi Purpose Products", pct: 2 }],
    types_h2: [{ name: "Interior and Upholstery", pct: 52 }, { name: "Quick detailers", pct: 9 }, { name: "Detailing Accessories", pct: 8 }, { name: "Ceramic/SiO2 Powered", pct: 7 }, { name: "Wheel/Tire Cleaner", pct: 3 }],
    brands: [{ name: "Meguiar's", pct: 29 }, { name: "Carpro", pct: 13 }, { name: "Bowden's Own", pct: 13 }, { name: "Armor All", pct: 10, is_brand: true }, { name: "Turtle Wax", pct: 9 }, { name: "Chemical Guys", pct: 5 }, { name: "Others", pct: 21 }],
    others: ["MTX", "Gtechniq", "Autoglym", "Luxca", "SONAX"],
    topics: [
      { brand: "Meguiar's", text: "Strong cleaning, shine, slickness and value across washes, wheels, scratches, glass and interiors, with easy use and durability; <mark>occasional leaks and smell issues</mark> noted." },
      { brand: "Carpro", text: "Consistently <mark>easy, beginner-friendly and long-lasting</mark>, with strong gloss, protection and coating maintenance at great value." },
      { brand: "Bowden's Own", text: "Exceptional cleaning, thick suds, gloss and long-lasting protection, easy application, great scent and <mark>loyal repeat use</mark>." },
    ],
  },
  {
    key: "korea", name: "South Korea", flag: "🇰🇷", mentions: 1650,
    headline: "Pivot to interior care as wet sanding collapses",
    summary: "South Korea consumer behavior shows a clear turn toward easy, interior-focused car care, as interest in upholstery cleaners surges and wet sanding collapses. Growing interest in anti-freeze concentrates signals climate-ready care. Bullsone strengthened leadership in foam and coatings, Sonax maintained professional trust.",
    insights: [
      "Bullsone leads with performance-driven washes and coatings; Sonax represents <mark>premium, professional-grade</mark> care; Carex differentiates on affordable all-in-one solutions.",
      "Product efficacy dominates, followed by superior final finish and <mark>affordable pricing</mark>.",
      "Focus shifted from Wet Sanding (49% to 14%) to <mark>Interior and Upholstery Cleaners (newly leading at 61%)</mark>. Demand emerged for Anti-Freeze Concentrates.",
    ],
    sentiment: { pos: 70, neu: 24, neg: 6 },
    themes: [{ name: "Product Efficacy", sub: "Reliability", pct: 38 }, { name: "Final Finish", sub: "Professional finish", pct: 19 }, { name: "Price / Cost-Effectiveness", sub: "Economical", pct: 15 }],
    types_h1: [{ name: "Wet sanding Products", pct: 49 }, { name: "Multi Purpose Products", pct: 10 }, { name: "Windscreen wash", pct: 5 }, { name: "Foam Cleaners", pct: 5 }, { name: "Ceramic/SiO2 Powered", pct: 4 }, { name: "Bundles and Kits", pct: 3 }],
    types_h2: [{ name: "Interior and Upholstery", pct: 61 }, { name: "Wet sanding Products", pct: 14 }, { name: "Multi Purpose Products", pct: 7 }, { name: "Windscreen wash", pct: 4 }, { name: "Ceramic/SiO2 Powered", pct: 3 }],
    brands: [{ name: "Bullsone", pct: 49 }, { name: "SONAX", pct: 21 }, { name: "Klasse", pct: 13 }, { name: "Fireball", pct: 10 }, { name: "Car Guys", pct: 6 }, { name: "MTX", pct: 1 }],
    others: [],
    topics: [
      { brand: "Bullsone", text: "Praised for <mark>beginner-friendly use</mark>: works on wet cars, beads water instantly, avoids residue and delivers \"expensive-wax\" shine without waiting, curing or complicated steps." },
      { brand: "SONAX", text: "Fast-conditioning leather, UV protection, subtle fragrance and ergonomic <mark>child-safe spray</mark>; interior cleaner delivers dust-free, stain-free, matte surfaces." },
    ],
  },
  {
    key: "philippines", name: "Philippines", flag: "🇵🇭", mentions: 1420,
    headline: "Premium shine and safe, value-driven cleaning",
    summary: "Meguiar's and MTX are leading Philippine car care brands, offering premium shine and safe, convenient, value-driven cleaning. Consumer preference shifted toward interior and upholstery cleaners, with steady interest in detailing accessories and quick solutions.",
    insights: [
      "Meguiar's leads with glossy, <mark>ceramic-like finishes</mark> and easy spray-on application; MTX delivers safe, chemical-free cleaning with pleasant fragrance and excellent value.",
      "Users highlight strong efficacy, quick no-water formats and consistently <mark>streak-free, residue-free finishes</mark>.",
      "Interior and upholstery cleaners rose to the most preferred category; reduced share of car wax suggests a move toward <mark>convenience-focused, multi-functional</mark> solutions.",
    ],
    sentiment: { pos: 62, neu: 28, neg: 10 },
    themes: [{ name: "Product Efficacy", sub: "Performance", pct: 91 }, { name: "Convenience", sub: "Practicality", pct: 34 }, { name: "Streak-Free Results", sub: "Uniform finish", pct: 15 }],
    types_h1: [{ name: "Detailing Accessories", pct: 27 }, { name: "Interior and Upholstery", pct: 16 }, { name: "Car Wax", pct: 12 }, { name: "Ceramic/SiO2 Powered", pct: 7 }, { name: "Quick detailers", pct: 6 }, { name: "Multi Purpose Products", pct: 3 }],
    types_h2: [{ name: "Interior and Upholstery", pct: 27 }, { name: "Detailing Accessories", pct: 20 }, { name: "Quick detailers", pct: 12 }, { name: "Multi Purpose Products", pct: 8 }, { name: "Wheel/Tyre Cleaner", pct: 3 }],
    brands: [{ name: "Meguiar's", pct: 31 }, { name: "MTX", pct: 31 }, { name: "Klasse", pct: 10 }, { name: "Fireball", pct: 6 }, { name: "Proauto", pct: 5 }, { name: "Car Guys", pct: 5 }, { name: "Others", pct: 11 }],
    others: ["Chemical Guys", "Luxcar", "Adam's Polish", "Armor All"],
    topics: [
      { brand: "Meguiar's", text: "Appreciated for strong shine, easy spray-on application and good value with ceramic-like protection, but <mark>mixed feedback on durability</mark>, water beading, packaging and pricing." },
      { brand: "MTX", text: "Recognised for <mark>pH-balanced, chemical-free</mark> formulas that clean interiors and exteriors safely, remove tough stains effortlessly, with pleasant fragrance and excellent value." },
    ],
  },
  {
    key: "latam", name: "LATAM", flag: "🌎", mentions: 1180,
    headline: "From aesthetic detailing to weather-driven maintenance",
    summary: "Car enthusiasts in LATAM are shifting from aesthetic-focused detailing to functional, weather-driven maintenance. Meguiar's sets benchmarks in long-lasting shine and ceramic protection, Turtle Wax enhances coatings with premium hydrophobic finishes and Armor All leads non-toxic interior care.",
    insights: [
      "Meguiar's, Chemical Guys and Turtle Wax stand out for <mark>innovation, premium formulations and reliability</mark> across tire shine, interior protection, foam shampoos and scratch repair.",
      "Consumers shifted from aesthetic-focused care to <mark>seasonal and functional maintenance</mark>. Foam cleaners (30%) and detailing accessories (15%) led H1.",
    ],
    sentiment: { pos: 60, neu: 32, neg: 8 },
    themes: [{ name: "Product Efficacy", sub: "Multi-purpose", pct: 32 }, { name: "Final Finish", sub: "Professional-grade finish", pct: 18 }, { name: "Fragrance", sub: "Pleasant scent", pct: 12 }],
    types_h1: [{ name: "Foam Cleaners", pct: 30 }, { name: "Detailing Accessories", pct: 15 }, { name: "Car wax", pct: 10 }, { name: "Interior and Upholstery", pct: 10 }, { name: "Car polish", pct: 5 }, { name: "Multi-Purpose Products", pct: 4 }],
    types_h2: [{ name: "Detailing Accessories", pct: 12 }, { name: "Bundles and Kits", pct: 7 }, { name: "Interior and Upholstery", pct: 5 }, { name: "Ceramic/SiO2 Powered", pct: 2 }, { name: "Multi Purpose Products", pct: 1 }],
    brands: [{ name: "Turtle Wax", pct: 29 }, { name: "Meguiar's", pct: 24 }, { name: "Armor All", pct: 7, is_brand: true }, { name: "Proauto", pct: 6 }, { name: "Adam's Polish", pct: 6 }, { name: "Luxcar", pct: 4 }, { name: "Others", pct: 13 }],
    others: ["Chemical Guys", "Klasse", "SONAX", "Car Guys"],
    topics: [
      { brand: "Turtle Wax", text: "Praised for high-gloss shine and <mark>hydrophobic protection</mark>; enhances existing coatings, locks in finish while drying and justifies its premium price." },
      { brand: "Meguiar's", text: "Long-lasting shine and protection on paint, tires and rims; excels at water and dust repellency, <mark>boosting ceramic coatings</mark>." },
      { brand: "Armor All", text: "Praised for protecting dashboards, doors and leather with visible surface enhancement, a <mark>non-toxic formula</mark> and no unpleasant odour." },
    ],
  },
  {
    key: "china", name: "China", flag: "🇨🇳", mentions: 2960,
    headline: "Specialised interior care and advanced ceramic protection",
    summary: "Chinese consumers are pivoting toward specialized interior maintenance and advanced ceramic protection to safeguard high-tech vehicle surfaces. Legacy brands like SONAX and Turtle Wax lead as users prioritize proven efficacy and visually engaging, professional-grade DIY application techniques.",
    insights: [
      "3M and Turtle Wax lead share of voice as primary recommendations for new owners prioritising <mark>paint safety and all-in-one starter kits</mark>.",
      "Chemical Guys captures voice through visually driven application content, specifically <mark>snow foams</mark> that turn routine care into a social lifestyle.",
      "The market transitioned from H1 basic cleaning and waxing to H2 <mark>advanced ceramic protection</mark> and visually engaging snow foam applications.",
    ],
    sentiment: { pos: 55, neu: 37, neg: 8 },
    themes: [{ name: "Product Efficacy", sub: "", pct: 39 }, { name: "Product Enquiry", sub: "Application & usage", pct: 36 }, { name: "Product Recommendations", sub: "", pct: 25 }],
    types_h1: [{ name: "Interior and Upholstery", pct: 27 }, { name: "Detailing Accessories", pct: 23 }, { name: "Tar Remover", pct: 19 }, { name: "Anti-Freeze Concentrate", pct: 18 }, { name: "Car Polish", pct: 13 }],
    types_h2: [{ name: "Interior and Upholstery", pct: 32 }, { name: "Ceramic/SiO2 Infused", pct: 29 }, { name: "Detailing Accessories", pct: 19 }, { name: "Car Polish", pct: 12 }, { name: "Wheel/Tire Cleaner", pct: 8 }],
    brands: [{ name: "SONAX", pct: 23 }, { name: "Turtle Wax", pct: 18 }, { name: "3M", pct: 15 }, { name: "Chemical Guys", pct: 14 }, { name: "Armor All", pct: 10, is_brand: true }, { name: "Meguiar's", pct: 9 }, { name: "Gtechniq", pct: 7 }, { name: "Others", pct: 4 }],
    others: [],
    topics: [
      { brand: "3M", text: "Leads positive mentions with Meguiar's for <mark>pH-neutral protection of NEV interiors</mark>; consumers prioritise efficacy and safety for high-tech surfaces." },
      { brand: "Chemical Guys", text: "Users seek application guidance for <mark>snow foams</mark> and ceramic layering steps to achieve high-visual, professional DIY results." },
      { brand: "Armor All", text: "Peer-led recommendations for Armor All and Turtle Wax <mark>starter kits</mark> remain influential for new vehicle owners." },
      { brand: "SONAX", text: "Value-for-money discussions compare accessible one-step sprays against the <mark>premium performance</mark> of SONAX or Gtechniq; durability of hydrophobic protection on matte finishes matters to experienced users." },
    ],
  },
];

const footer = (lens) => [`${lens} · Regional Intelligence`, "Sample data — values will be replaced by the session's tagged posts"];
const base = (r) => ({ key: r.key, name: r.name, flag: r.flag, mentions: r.mentions, headline: r.headline, summary: r.summary });

export const RS_SAMPLE = {
  meta: META, footer: footer("State-Level Sentiment"),
  note: "Sentiment split and product-theme shares per market. Theme shares may exceed 100% because a post can carry several themes.",
  regions: REGIONS.map((r) => ({ ...base(r), insights: r.insights, sentiment: r.sentiment, themes: r.themes })),
};

export const RE_SAMPLE = {
  meta: META, footer: footer("Engagement"),
  note: "Trending product types by half-year, and what the conversation engages with. Shares are of product-tagged posts in that half.",
  periods: ["Jan – Jun 2025", "Jul – Dec 2025"],
  regions: REGIONS.map((r) => ({ ...base(r), insights: r.insights, types_h1: r.types_h1, types_h2: r.types_h2, topics: r.topics })),
};

export const RBP_SAMPLE = {
  meta: META, footer: footer("Brand Perception"),
  note: "Share of brand-tagged posts per market and what is said about each leading brand. Project brand highlighted.",
  regions: REGIONS.map((r) => ({ ...base(r), brands: r.brands, others: r.others, topics: r.topics })),
};
