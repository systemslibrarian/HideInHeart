import { scoreAttempt } from "@/lib/game";

export type AttemptValidationInput = {
  reportedCorrectCount: number;
  reportedTotalBlanks: number;
  expectedTotalBlanks: number;
  attemptIndex: number;
};

export function validateAndScoreAttempt(input: AttemptValidationInput): {
  correctCount: number;
  totalBlanks: number;
  points: number;
} {
  if (input.reportedTotalBlanks !== input.expectedTotalBlanks) {
    throw new Error("Mismatched blank count.");
  }

  const correctCount = Math.max(0, Math.min(input.reportedCorrectCount, input.expectedTotalBlanks));
  const totalBlanks = input.expectedTotalBlanks;
  const points = scoreAttempt(correctCount, totalBlanks, input.attemptIndex);

  return { correctCount, totalBlanks, points };
}
