import { describe, expect, it } from "vitest";

import { validateAndScoreAttempt } from "@/lib/attempt-security";

describe("validateAndScoreAttempt", () => {
  it("throws when reported blank count does not match verse definition", () => {
    expect(() =>
      validateAndScoreAttempt({
        reportedCorrectCount: 2,
        reportedTotalBlanks: 3,
        expectedTotalBlanks: 4,
        attemptIndex: 1,
      }),
    ).toThrow("Mismatched blank count");
  });

  it("clamps impossible correct counts", () => {
    const result = validateAndScoreAttempt({
      reportedCorrectCount: 99,
      reportedTotalBlanks: 4,
      expectedTotalBlanks: 4,
      attemptIndex: 1,
    });

    expect(result.correctCount).toBe(4);
    expect(result.points).toBe(10);
  });
});