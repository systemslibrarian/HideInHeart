import { LOCAL_VERSES } from "@/lib/verses-local";
import type { Verse } from "@/types/domain";

/**
 * Deterministic daily verse selection from the local verse pool.
 * Same verse for all users on the same calendar day, no randomness.
 */

const EPOCH = Date.UTC(2024, 0, 1); // Jan 1 2024
const MS_PER_DAY = 86_400_000;

function daysSinceEpoch(date: Date = new Date()): number {
  return Math.floor((date.getTime() - EPOCH) / MS_PER_DAY);
}

export function getDailyVersePool(): Verse[] {
  return LOCAL_VERSES;
}

export function getDailyVerse(date: Date = new Date()): Verse {
  const pool = getDailyVersePool();
  const index = daysSinceEpoch(date) % pool.length;
  const verse = pool[index];

  return {
    ...verse,
    devotional:
      verse.devotional ||
      `Take a moment to sit with ${verse.reference} today. Let the words settle before you move on.`,
    applicationPrompt:
      verse.applicationPrompt ||
      `How does ${verse.reference} speak into what you are facing right now?`,
  };
}
