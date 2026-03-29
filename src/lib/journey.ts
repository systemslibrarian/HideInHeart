import { normalizeWord } from "@/lib/game";
import { VERSE_TRANSLATIONS } from "@/lib/verse-translations";
import type { SkillLevel, ThemeOption, TranslationKey, Verse, VerseTranslation } from "@/types/domain";

/** Return the parts/answers/decoys for a given translation key. Falls back to NIV. */
export function getVerseTranslation(verse: Verse, key: TranslationKey): VerseTranslation {
  if (key === "niv") return { parts: verse.parts, answers: verse.answers, decoys: verse.decoys };

  /* Inline data on the verse object takes priority */
  if (key === "kjv" && verse.kjv) return verse.kjv;
  if (key === "nkjv" && verse.nkjv) return verse.nkjv;
  if (key === "esv" && verse.esv) return verse.esv;

  /* Fall back to the generated translations lookup */
  const entry = VERSE_TRANSLATIONS[verse.id];
  if (entry) {
    if (key === "nkjv" && entry.nkjv) return entry.nkjv;
    if (key === "esv" && entry.esv) return entry.esv;
  }

  /* Ultimate fallback: NIV */
  return { parts: verse.parts, answers: verse.answers, decoys: verse.decoys };
}

export const HEART_CHECK_OPTIONS: ThemeOption[] = [
  {
    id: "anxiety",
    label: "Anxiety",
    description: "You are carrying something heavy. Let God meet you in the tension between worry and trust.",
    prompt: "What are you gripping that God is asking you to release into His hands?",
  },
  {
    id: "fear",
    label: "Fear",
    description: "Something feels uncertain or threatening. Bring it into the presence of the God who is not shaken.",
    prompt: "What fear shrinks when you stand it next to the character of God?",
  },
  {
    id: "anger",
    label: "Anger",
    description: "Something in you needs to surrender control, extend forgiveness, or confess what is underneath.",
    prompt: "What anger are you holding that is really about control, hurt, or unforgiveness?",
    verseThemeIds: ["anger"],
  },
  {
    id: "doubt",
    label: "Doubt",
    description: "Your faith feels thin. Come with honest questions and let truth meet you where you actually are.",
    prompt: "Where is your belief struggling, and can you bring that struggle to God without cleaning it up first?",
  },
  {
    id: "temptation",
    label: "Temptation",
    description: "You know the pull. Name it honestly and let Scripture remind you of the way out.",
    prompt: "What temptation keeps returning, and what would confession and a clean path look like today?",
  },
  {
    id: "waiting",
    label: "Waiting",
    description: "The answer has not come. Sit with truth that holds when the timeline is out of your hands.",
    prompt: "What are you waiting for, and where is God asking you to trust without seeing the end?",
  },
  {
    id: "guidance",
    label: "Guidance",
    description: "You need direction. Surrender the demand for the whole map and take the next faithful step.",
    prompt: "What decision needs surrender before it needs a solution?",
  },
  {
    id: "hope",
    label: "Hope",
    description: "Your reserves are low. Come back to what God has promised and let it carry more weight than what you see.",
    prompt: "What promise from God do you need to stake your life on today, even though you cannot see it?",
  },
  {
    id: "peace",
    label: "Peace",
    description: "Your mind will not stop. Let God post a guard over the noise and give you rest you cannot explain.",
    prompt: "What is stealing your peace, and are you ready to let God stand between you and it?",
  },
  {
    id: "rest",
    label: "Rest",
    description: "You are running on empty. Stop striving and receive what Christ is offering you right now.",
    prompt: "What are you still carrying that Christ already carried for you?",
  },
  {
    id: "faithfulness",
    label: "God's Faithfulness",
    description: "His compassions are new every morning. Stand on what God has proven, not on what you feel right now.",
    prompt: "Where do you need to trust what God has already shown to be true about Himself?",
  },
  {
    id: "light",
    label: "God's Light",
    description: "Things feel unclear or dark. Let the Word illuminate the next step you've been avoiding.",
    prompt: "What would obedience look like if you trusted the light God has already given you?",
  },
  {
    id: "love",
    label: "God's Love",
    description: "You need to be reminded that you are not just tolerated — you are genuinely, fiercely loved.",
    prompt: "What would change if you stopped trying to earn God's love and simply received it?",
  },
  {
    id: "identity",
    label: "Identity in Christ",
    description: "You've been living from an old story. Step into who God says you actually are.",
    prompt: "What old story about yourself are you still living from that Christ has already declared finished?",
  },
  {
    id: "father-of-lights",
    label: "Father of Lights",
    description: "Every good thing in your life traces back to Him. He does not shift, shadow, or change. He is the source.",
    prompt: "What good gift have you been crediting to yourself or circumstances that actually came down from above?",
  },
  {
    id: "salvation",
    label: "Salvation",
    description: "The gospel is not complicated. God came, God died, God rose. Let Truth anchor you again.",
    prompt: "If someone asked you today why you have hope, what would you say — and do you still believe it?",
  },
  {
    id: "gods-word",
    label: "God's Word",
    description: "His Word is not dead text. It is living, sharp, and active — let it search you today.",
    prompt: "Where have you been reading Scripture without letting it read you?",
  },
  {
    id: "perseverance",
    label: "Perseverance",
    description: "The race is not a sprint. Press on — not in your own strength, but in the One who finishes what He starts.",
    prompt: "What are you tempted to quit, and what would it look like to take one more faithful step?",
  },
  {
    id: "surrender",
    label: "Surrender",
    description: "Stop managing your life and lay it down. The One asking for it is the One who already gave His.",
    prompt: "What part of your life are you still gripping that God is asking you to open your hands on?",
  },
  {
    id: "courage",
    label: "Courage",
    description: "Courage is not the absence of fear. It is trusting the God who goes before you into the thing you dread.",
    prompt: "What would you do today if you believed God was truly with you in it?",
  },
  {
    id: "wisdom",
    label: "Wisdom",
    description: "You do not need more information. You need the fear of the Lord — and the humility to follow what He shows.",
    prompt: "Where are you relying on your own understanding instead of asking God for His?",
  },
  {
    id: "grace",
    label: "Grace",
    description: "You cannot earn what has already been given. Stop performing and receive the finished work of Christ.",
    prompt: "What are you still trying to pay for that Christ already paid for on the cross?",
  },
  {
    id: "mission",
    label: "Mission",
    description: "You were not saved to sit still. The same Jesus who called you now sends you — go where He leads.",
    prompt: "Who in your life needs to hear the good news, and what is keeping you from being the one to share it?",
  },
  {
    id: "prayer",
    label: "Prayer",
    description: "Prayer is not a ritual. It is your lifeline to the God who hears, answers, and moves on your behalf.",
    prompt: "What conversation with God have you been putting off — and what would it cost you to start it now?",
  },
  {
    id: "provision",
    label: "Provision",
    description: "He who feeds the sparrows and clothes the lilies will not forget you. Trust His supply, not your strategy.",
    prompt: "What need are you anxiously trying to meet on your own instead of trusting God to provide?",
  },
  {
    id: "forgiveness",
    label: "Forgiveness",
    description: "Unforgiveness is a prison you lock yourself inside. Release it — not because they earned it, but because Christ released you.",
    prompt: "Who do you need to forgive, and what would freedom look like if you stopped holding the debt?",
  },
  {
    id: "obedience",
    label: "Obedience",
    description: "Obedience is not legalism. It is love in action — the proof that you trust the One who gave the command.",
    prompt: "What has God clearly asked of you that you have been delaying or rationalizing away?",
  },
  {
    id: "joy",
    label: "Joy",
    description: "Joy is not happiness. It is the deep, unshakeable anchor that holds when everything on the surface is storm.",
    prompt: "Where have you confused happiness with joy, and what would it look like to rejoice even now?",
  },
  {
    id: "strength",
    label: "Strength",
    description: "Your own strength ran out a long time ago. His never does. Let the God of the universe be your power today.",
    prompt: "Where are you running on fumes instead of drawing from the limitless strength God offers?",
  },
  {
    id: "grief",
    label: "Grief",
    description: "Loss has torn something open. Bring your sorrow to the God who is close to the brokenhearted.",
    prompt: "What grief are you carrying, and can you let God sit with you in it instead of rushing past it?",
  },
  {
    id: "parenting",
    label: "Parenting",
    description: "Raising children is holy, exhausting work. Let God's Word steady you when you feel insufficient.",
    prompt: "Where do you need God's wisdom most in leading and loving the children in your life?",
  },
  {
    id: "work-vocation",
    label: "Work & Vocation",
    description: "Your work is not separate from your faith. Let Scripture shape how you labor and why.",
    prompt: "How is God calling you to honor Him through your work — even when it feels mundane or overwhelming?",
  },
];

export const PRACTICE_LEVELS: Array<{
  id: SkillLevel;
  label: string;
  shortLabel: string;
  description: string;
}> = [
  {
    id: "beginner",
    label: "Gentle practice",
    shortLabel: "Gentle",
    description: "About a third of the key words are hidden — good for your first pass through a new verse.",
  },
  {
    id: "intermediate",
    label: "Steady practice",
    shortLabel: "Steady",
    description: "About two thirds of the key words are hidden for a fuller memorization pass.",
  },
  {
    id: "expert",
    label: "Deep practice",
    shortLabel: "Deep",
    description: "All key words are hidden — see how much of the verse you can recall from memory.",
  },
];

function hashString(value: string): number {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }

  return hash;
}

function chooseDeterministic<T>(items: T[], seed: string): T | undefined {
  if (items.length === 0) return undefined;
  const index = hashString(seed) % items.length;
  return items[index];
}

export function getThemeOption(themeId: string | null | undefined): ThemeOption | undefined {
  if (!themeId) return undefined;
  return HEART_CHECK_OPTIONS.find((option) => option.id === themeId);
}

export function getPracticeLevelMeta(skillLevel: SkillLevel) {
  return PRACTICE_LEVELS.find((option) => option.id === skillLevel) ?? PRACTICE_LEVELS[1];
}

export function getBlankCountForSkillLevel(skillLevel: SkillLevel, totalAnswers: number): number {
  if (totalAnswers <= 0) return 0;

  // beginner: ~1/3 of blanks, using ceil so it's always strictly less than intermediate
  const beginnerCount = Math.max(1, Math.ceil(totalAnswers / 3));

  switch (skillLevel) {
    case "beginner":
      return beginnerCount;
    case "intermediate":
      // Guaranteed at least 1 more blank than beginner so the two levels are always distinct
      return Math.max(beginnerCount + 1, Math.round((totalAnswers * 2) / 3));
    case "expert":
      return totalAnswers;
  }
}

export function getBlankIndicesForSkillLevel(verseId: string, skillLevel: SkillLevel, totalAnswers: number): number[] {
  const desiredCount = getBlankCountForSkillLevel(skillLevel, totalAnswers);
  const allIndices = Array.from({ length: totalAnswers }, (_, index) => index);

  if (desiredCount >= allIndices.length) {
    return allIndices;
  }

  return allIndices
    .map((index) => ({ index, score: hashString(`${verseId}:${skillLevel}:${index}`) }))
    .sort((left, right) => left.score - right.score)
    .slice(0, desiredCount)
    .map((item) => item.index)
    .sort((left, right) => left - right);
}

export function buildPracticeSet(verse: Verse, skillLevel: SkillLevel, translationKey: TranslationKey = "niv") {
  const t = getVerseTranslation(verse, translationKey);
  const blankIndices = getBlankIndicesForSkillLevel(verse.id, skillLevel, t.answers.length);
  const blankIndexLookup = new Map<number, number>();

  blankIndices.forEach((answerIndex, slotIndex) => {
    blankIndexLookup.set(answerIndex, slotIndex);
  });

  return {
    blankIndices,
    blankIndexLookup,
    practiceAnswers: blankIndices.map((answerIndex) => normalizeWord(t.answers[answerIndex])),
  };
}

export function buildFullVerseText(verse: Verse, translationKey: TranslationKey = "niv"): string {
  const t = getVerseTranslation(verse, translationKey);
  return t.parts.reduce((text, part, index) => {
    const answer = index < t.answers.length ? `${t.answers[index]}` : "";
    return `${text}${part}${answer}`;
  }, "");
}

export function getTodayKey(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

export function pickDailyFeaturedVerse(verses: Verse[], date = new Date()): Verse | undefined {
  const featured = verses.filter((verse) => verse.isDailyFeatured);
  const source = featured.length > 0 ? featured : verses;
  return chooseDeterministic(source, `featured:${getTodayKey(date)}`);
}

export function pickJourneyVerse(verses: Verse[], categoryId: string | null, date = new Date()): Verse | undefined {
  if (verses.length === 0) return undefined;

  const selectedTheme = getThemeOption(categoryId);
  const matchIds = selectedTheme?.verseThemeIds ?? (categoryId ? [categoryId] : []);
  const matches = matchIds.length > 0 ? verses.filter((verse) => matchIds.includes(verse.themeId)) : [];

  if (matches.length > 0) {
    return chooseDeterministic(matches, `${categoryId}:${getTodayKey(date)}`);
  }

  return pickDailyFeaturedVerse(verses, date) ?? verses[0];
}