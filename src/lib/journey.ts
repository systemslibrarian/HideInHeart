import { normalizeWord } from "@/lib/game";
import type { SkillLevel, ThemeOption, Verse } from "@/types/domain";

export const HEART_CHECK_OPTIONS: ThemeOption[] = [
  {
    id: "anxiety",
    label: "Anxiety",
    description: "Come with what feels heavy and unsettled today.",
    prompt: "Where do you need to release anxious thoughts into God's care?",
  },
  {
    id: "fear",
    label: "Fear",
    description: "Bring what feels uncertain, threatening, or fragile.",
    prompt: "What fear needs to be placed back into God's hands today?",
  },
  {
    id: "anger",
    label: "Anger",
    description: "Slow your reactions and let Scripture steady your spirit.",
    prompt: "Where do you need God's mercy to soften a sharp response today?",
    verseThemeIds: ["anger"],
  },
  {
    id: "doubt",
    label: "Doubt",
    description: "Meet uncertainty with truth that invites honest faith.",
    prompt: "What question or hesitation do you need to bring honestly before God?",
  },
  {
    id: "temptation",
    label: "Temptation",
    description: "Practice truth that helps you turn back toward obedience.",
    prompt: "Where do you need to choose confession and a clean path today?",
  },
  {
    id: "waiting",
    label: "Waiting",
    description: "Sit with verses that speak into delay, trust, and hope.",
    prompt: "What are you waiting on, and how can you wait with trust today?",
  },
  {
    id: "guidance",
    label: "Guidance",
    description: "Listen for the next faithful step rather than total control.",
    prompt: "What decision needs surrender before it needs a solution?",
  },
  {
    id: "hope",
    label: "Hope",
    description: "Hold onto the promises that lift your eyes forward.",
    prompt: "What promise from God do you need to remember and live from today?",
  },
  {
    id: "peace",
    label: "Peace",
    description: "Receive the stillness that only God gives.",
    prompt: "Where do you need God's peace to stand guard over your mind today?",
  },
  {
    id: "rest",
    label: "Rest",
    description: "Lay down striving and receive what Christ offers.",
    prompt: "What are you straining under that needs to come under Christ's yoke?",
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
    description: "About one third of the words are hidden so you can settle into the passage.",
  },
  {
    id: "intermediate",
    label: "Steady practice",
    shortLabel: "Steady",
    description: "About two thirds of the words are hidden for a fuller memorization pass.",
  },
  {
    id: "expert",
    label: "Deep practice",
    shortLabel: "Deep",
    description: "Every practice word is hidden so the verse must be rebuilt in full.",
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

  switch (skillLevel) {
    case "beginner":
      return Math.max(1, Math.ceil(totalAnswers * 0.33));
    case "intermediate":
      return Math.max(1, Math.ceil(totalAnswers * 0.67));
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

export function buildPracticeSet(verse: Verse, skillLevel: SkillLevel) {
  const blankIndices = getBlankIndicesForSkillLevel(verse.id, skillLevel, verse.answers.length);
  const blankIndexLookup = new Map<number, number>();

  blankIndices.forEach((answerIndex, slotIndex) => {
    blankIndexLookup.set(answerIndex, slotIndex);
  });

  return {
    blankIndices,
    blankIndexLookup,
    practiceAnswers: blankIndices.map((answerIndex) => normalizeWord(verse.answers[answerIndex])),
  };
}

export function buildFullVerseText(verse: Verse): string {
  return verse.parts.reduce((text, part, index) => {
    const answer = index < verse.answers.length ? `${verse.answers[index]}` : "";
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