/**
 * Curated memorization plans — structured paths through Scripture.
 *
 * Each plan is an ordered list of verse IDs that already exist in
 * verses-local.ts or verses-additional.ts. Plans are purely
 * client-side metadata; progress is derived from the memorized set
 * stored in localStorage.
 */

export type PlanCategory = "gospel" | "comfort" | "growth" | "foundation" | "character";

export type MemorizationPlan = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  verseIds: string[];
  audience: "adults" | "kids";
  category: PlanCategory;
};

/* ------------------------------------------------------------------ */
/*  Adult plans                                                        */
/* ------------------------------------------------------------------ */

const ROMANS_ROAD: MemorizationPlan = {
  id: "romans-road",
  title: "The Romans Road",
  subtitle: "The path to salvation through Paul's letter",
  description:
    "Five verses from Romans that trace the gospel from sin to salvation. " +
    "This classic plan has helped generations of believers share and understand the good news.",
  icon: "✝️",
  verseIds: ["rom323", "rom623", "rom58", "rom10910", "rom81"],
  audience: "adults",
  category: "gospel",
};

const GOSPEL_FOUNDATIONS: MemorizationPlan = {
  id: "gospel-foundations",
  title: "Gospel Foundations",
  subtitle: "Core truths every believer should know by heart",
  description:
    "Seven verses that anchor you in the basics of the gospel — who God is, " +
    "what He has done, and how we receive it. A strong starting point for new and seasoned believers alike.",
  icon: "📖",
  verseIds: ["jn316", "rom323", "rom58", "rom623", "john146", "eph289", "rom81"],
  audience: "adults",
  category: "gospel",
};

const PEACE_IN_ANXIETY: MemorizationPlan = {
  id: "peace-in-anxiety",
  title: "Peace in Anxiety",
  subtitle: "When worry weighs heavy, let truth carry you",
  description:
    "Eight verses for the anxious heart. Each one is an invitation to lay down what " +
    "you are carrying and receive the peace that only God can give.",
  icon: "🕊️",
  verseIds: ["matt1128", "php46", "1pet57", "ps4610", "is263", "jn1427", "php47", "is4110"],
  audience: "adults",
  category: "comfort",
};

const GODS_UNFAILING_LOVE: MemorizationPlan = {
  id: "gods-unfailing-love",
  title: "God's Unfailing Love",
  subtitle: "You are not tolerated — you are fiercely loved",
  description:
    "Seven verses that declare the depth, breadth, and permanence of God's love for you. " +
    "Memorize these for the days when you forget.",
  icon: "❤️",
  verseIds: ["jer313", "rom58", "1jn49", "jn316", "rom83839", "1jn4-7-8", "john1513"],
  audience: "adults",
  category: "comfort",
};

const IDENTITY_IN_CHRIST: MemorizationPlan = {
  id: "identity-in-christ",
  title: "Identity in Christ",
  subtitle: "Stop living from the old story — step into who God says you are",
  description:
    "Seven verses that replace the world's labels with God's declaration over your life. " +
    "You are chosen, redeemed, and purposefully made.",
  icon: "🌟",
  verseIds: ["2cor517", "gal220", "eph210", "ps13914", "john112", "1cor620", "1pet2-9"],
  audience: "adults",
  category: "growth",
};

const STRENGTH_FOR_THE_WEARY: MemorizationPlan = {
  id: "strength-for-the-weary",
  title: "Strength for the Weary",
  subtitle: "His power is made perfect in your weakness",
  description:
    "Seven verses for the exhausted, the overwhelmed, and the ones running on empty. " +
    "God does not ask you to be strong — He asks you to lean on Him.",
  icon: "🛡️",
  verseIds: ["is4031", "php413", "2cor129", "is4029", "john1633", "josh19", "2tim1-7"],
  audience: "adults",
  category: "comfort",
};

const PSALMS_OF_COMFORT: MemorizationPlan = {
  id: "psalms-of-comfort",
  title: "Psalms of Comfort",
  subtitle: "Ancient words, present refuge",
  description:
    "Seven psalms that have sheltered God's people for three thousand years. " +
    "When you don't know what to pray, let the psalmist pray for you.",
  icon: "🏔️",
  verseIds: ["ps23", "ps234", "ps271", "ps365", "ps461", "ps911", "ps119105"],
  audience: "adults",
  category: "comfort",
};

const TRUST_AND_PRAYER: MemorizationPlan = {
  id: "trust-and-prayer",
  title: "Trust & Prayer",
  subtitle: "Draw near to God and He will draw near to you",
  description:
    "Seven verses about the privilege of prayer and the practice of trust. " +
    "These words will shape how you talk to God and rely on Him.",
  icon: "🙏",
  verseIds: ["pro35", "col42", "rom826", "matt77", "1john514", "jas15", "php46"],
  audience: "adults",
  category: "growth",
};

const WALKING_IN_LIGHT: MemorizationPlan = {
  id: "walking-in-light",
  title: "Walking in Light",
  subtitle: "Living as children of light in a darkened world",
  description:
    "Seven verses that call you out of darkness and into the radiance of Christ. " +
    "Light exposes, heals, and guides — let these truths illuminate your path.",
  icon: "💡",
  verseIds: ["jn812", "ps119105", "matt516", "1jn17", "is601", "ps271", "eph5-8"],
  audience: "adults",
  category: "growth",
};

const THIRTY_DAY_STARTER: MemorizationPlan = {
  id: "30-day-starter",
  title: "30-Day Foundation",
  subtitle: "One verse a day for a month — build a Scripture foundation",
  description:
    "Thirty carefully chosen verses that span the big themes of the Christian faith: " +
    "the gospel, God's character, personal comfort, Christian living, prayer, and purpose. " +
    "Memorize one a day and watch your foundation grow.",
  icon: "🌱",
  verseIds: [
    /* Week 1 – Gospel & salvation */
    "jn316", "rom323", "rom58", "rom623", "eph289", "rom81", "john146",
    /* Week 2 – God's character & faithfulness */
    "lam322", "ps365", "jer313", "1jn49", "rom83839", "is4110", "ps4610",
    /* Week 3 – Comfort & strength */
    "matt1128", "php413", "is4031", "2cor129", "php47", "jn1427", "1pet57",
    /* Week 4 – Living it out */
    "pro35", "jas15", "josh19", "heb412", "eph210", "matt281920", "rom828",
    /* Days 29-30 – Anchors */
    "ps119105", "2cor517",
  ],
  audience: "adults",
  category: "foundation",
};

/* ------------------------------------------------------------------ */
/*  Kids plans                                                         */
/* ------------------------------------------------------------------ */

const KIDS_GOD_LOVES_ME: MemorizationPlan = {
  id: "kids-god-loves-me",
  title: "God Loves Me",
  subtitle: "Five verses about how much God loves you",
  description:
    "These five verses show you that God's love is real, forever, and just for you. " +
    "Start here and let His love fill your heart.",
  icon: "💛",
  verseIds: ["kids-john316", "kids-1john419", "kids-1john418", "kids-1john48", "kids-ps1361"],
  audience: "kids",
  category: "comfort",
};

const KIDS_FIRST_STEPS: MemorizationPlan = {
  id: "kids-first-steps",
  title: "First Steps of Faith",
  subtitle: "Start your memorization journey here",
  description:
    "Five short, powerful verses about trusting God. " +
    "These are great first verses to memorize and carry with you.",
  icon: "👣",
  verseIds: ["kids-john316", "kids-prov35", "kids-jer2911", "kids-heb116", "kids-josh19"],
  audience: "kids",
  category: "foundation",
};

const KIDS_KIND_AND_BRAVE: MemorizationPlan = {
  id: "kids-kind-and-brave",
  title: "Be Kind, Be Brave",
  subtitle: "Verses about how God wants us to live",
  description:
    "Five verses about kindness, courage, and trusting God even when things are hard. " +
    "Hide these words in your heart and be strong!",
  icon: "🦁",
  verseIds: ["kids-eph432", "kids-phil413", "kids-1pet57", "kids-phil44", "kids-ps13914"],
  audience: "kids",
  category: "character",
};

/* ------------------------------------------------------------------ */
/*  Exports                                                            */
/* ------------------------------------------------------------------ */

export const ADULT_PLANS: MemorizationPlan[] = [
  ROMANS_ROAD,
  GOSPEL_FOUNDATIONS,
  PEACE_IN_ANXIETY,
  GODS_UNFAILING_LOVE,
  IDENTITY_IN_CHRIST,
  STRENGTH_FOR_THE_WEARY,
  PSALMS_OF_COMFORT,
  TRUST_AND_PRAYER,
  WALKING_IN_LIGHT,
  THIRTY_DAY_STARTER,
];

export const KIDS_PLANS: MemorizationPlan[] = [
  KIDS_GOD_LOVES_ME,
  KIDS_FIRST_STEPS,
  KIDS_KIND_AND_BRAVE,
];

export const ALL_PLANS: MemorizationPlan[] = [...ADULT_PLANS, ...KIDS_PLANS];

export const PLAN_CATEGORIES: Array<{ id: PlanCategory | "all"; label: string }> = [
  { id: "all", label: "All plans" },
  { id: "gospel", label: "Gospel" },
  { id: "comfort", label: "Comfort" },
  { id: "growth", label: "Growth" },
  { id: "foundation", label: "Foundation" },
  { id: "character", label: "Character" },
];
