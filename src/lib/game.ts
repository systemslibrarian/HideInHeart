export function normalizeWord(value: string): string {
  return value.trim().toUpperCase();
}

export function countWords(values: string[]): Record<string, number> {
  return values.reduce<Record<string, number>>((acc, value) => {
    const normalized = normalizeWord(value);
    if (!normalized) return acc;
    acc[normalized] = (acc[normalized] ?? 0) + 1;
    return acc;
  }, {});
}

export function getRemainingTileCount(tile: string, tilePool: string[], placements: string[]): number {
  const normalized = normalizeWord(tile);
  const total = countWords(tilePool)[normalized] ?? 0;
  const used = countWords(placements)[normalized] ?? 0;
  return Math.max(0, total - used);
}

export function canPlaceWord(
  word: string,
  placements: string[],
  tilePool: string[],
  targetIndex?: number,
): boolean {
  const normalized = normalizeWord(word);
  const placementsWithoutTarget = placements.filter(
    (value, index) => Boolean(value) && (targetIndex === undefined || index !== targetIndex),
  );
  const used = countWords(placementsWithoutTarget)[normalized] ?? 0;
  const total = countWords(tilePool)[normalized] ?? 0;
  return used < total;
}

export function shuffle<T>(items: T[]): T[] {
  const clone = [...items];
  for (let i = clone.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [clone[i], clone[j]] = [clone[j], clone[i]];
  }
  return clone;
}

export function scoreAttempt(correctCount: number, totalBlanks: number, attemptIndex: number): number {
  if (totalBlanks <= 0) return 0;

  const normalized = Math.max(0, Math.min(correctCount, totalBlanks));
  const ratio = normalized / totalBlanks;
  const base = attemptIndex <= 1 ? 10 : attemptIndex === 2 ? 7 : 5;

  return Math.round(base * ratio);
}

export function sessionPercentage(score: number, maxScore: number): number {
  if (maxScore <= 0) return 0;
  return Math.round((score / maxScore) * 100);
}
