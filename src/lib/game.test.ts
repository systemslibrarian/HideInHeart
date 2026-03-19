import { describe, expect, it } from "vitest";

import { scoreAttempt, sessionPercentage } from "@/lib/game";

describe("scoreAttempt", () => {
  it("gives full points on first perfect attempt", () => {
    expect(scoreAttempt(4, 4, 1)).toBe(10);
  });

  it("scales by correctness", () => {
    expect(scoreAttempt(2, 4, 1)).toBe(5);
  });

  it("reduces base points on retries", () => {
    expect(scoreAttempt(4, 4, 2)).toBe(7);
    expect(scoreAttempt(4, 4, 3)).toBe(5);
  });
});

describe("sessionPercentage", () => {
  it("returns rounded percentage", () => {
    expect(sessionPercentage(37, 50)).toBe(74);
  });
});
