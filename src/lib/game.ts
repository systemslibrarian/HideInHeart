export function normalizeWord(value: string): string {
  return value.trim().toUpperCase();
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
