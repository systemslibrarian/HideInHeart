"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  canPlaceWord,
  countWords,
  normalizeWord,
  scoreAttempt,
  shuffle,
} from "@/lib/game";
import {
  HEART_CHECK_OPTIONS,
  PRACTICE_LEVELS,
  buildFullVerseText,
  buildPracticeSet,
  getPracticeLevelMeta,
  pickDailyFeaturedVerse,
  pickJourneyVerse,
} from "@/lib/journey";
import type { SkillLevel, Verse } from "@/types/domain";

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

type JourneyStep = "today" | "heartcheck" | "read" | "practice" | "apply" | "complete";

type PracticeResult = { correct: number; total: number };

type AttemptResponse = {
  success: boolean;
  score: number;
  streak: number;
  sessionBest: number;
  error?: string;
};

const STEP_LABELS: Record<JourneyStep, string> = {
  today: "Today",
  heartcheck: "Heart Check",
  read: "Read Slowly",
  practice: "Practice",
  apply: "Apply",
  complete: "Amen",
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function classNames(...values: (string | false | null | undefined)[]): string {
  return values.filter(Boolean).join(" ");
}

async function getUserId(): Promise<string> {
  try {
    const response = await fetch("/api/profile");
    if (response.ok) {
      const data = await response.json();
      if (data.userId) return data.userId as string;
    }
  } catch {
    /* fall through */
  }
  const KEY = "sg_guest_id";
  let guestId = localStorage.getItem(KEY);
  if (!guestId) {
    guestId = `guest_${crypto.randomUUID()}`;
    localStorage.setItem(KEY, guestId);
  }
  return guestId;
}

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

export default function PlayPage() {
  /* ---- data state ---- */
  const [verses, setVerses] = useState<Verse[]>([]);
  const [loading, setLoading] = useState(true);

  /* ---- journey flow ---- */
  const [step, setStep] = useState<JourneyStep>("today");
  const [selectedThemeId, setSelectedThemeId] = useState<string | null>(null);
  const [heartCheckTags, setHeartCheckTags] = useState<string[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<SkillLevel>("intermediate");
  const [verse, setVerse] = useState<Verse | null>(null);

  /* ---- practice state ---- */
  const [placements, setPlacements] = useState<string[]>([]);
  const [tilePool, setTilePool] = useState<string[]>([]);
  const [blankIndices, setBlankIndices] = useState<number[]>([]);
  const [blankIndexLookup, setBlankIndexLookup] = useState<Map<number, number>>(new Map());
  const [practiceAnswers, setPracticeAnswers] = useState<string[]>([]);
  const [selectedTile, setSelectedTile] = useState<number | null>(null);
  const [attemptIndex, setAttemptIndex] = useState(1);
  const [practiceResult, setPracticeResult] = useState<PracticeResult | null>(null);
  const [startTime, setStartTime] = useState(0);

  /* ---- reflection state ---- */
  const [reflectionText, setReflectionText] = useState("");
  const [reflectionSaved, setReflectionSaved] = useState(false);
  const [reflectionError, setReflectionError] = useState<string | null>(null);

  /* ---- overall stats ---- */
  const [streak, setStreak] = useState(0);
  const [serverError, setServerError] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  /* ---- fetch verses ---- */
  useEffect(() => {
    (async () => {
      try {
        const response = await fetch("/api/verses");
        if (!response.ok) throw new Error("fetch verses failed");
        const data = await response.json();
        setVerses(Array.isArray(data) ? data : data.verses ?? []);
      } catch {
        setVerses([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* featured verse for step 1 */
  const featuredVerse = useMemo(
    () => (verses.length > 0 ? pickDailyFeaturedVerse(verses) : null),
    [verses],
  );

  /* ---- step progress bar ---- */
  const stepOrder: JourneyStep[] = ["today", "heartcheck", "read", "practice", "apply", "complete"];
  const currentStepIndex = stepOrder.indexOf(step);

  /* ---- navigation helpers ---- */
  const goToHeartCheck = useCallback(() => setStep("heartcheck"), []);

  const goToRead = useCallback(
    (themeId: string | null) => {
      setSelectedThemeId(themeId);
      const picked = pickJourneyVerse(verses, themeId);
      setVerse(picked ?? null);
      setStep("read");
    },
    [verses],
  );

  const initPractice = useCallback(
    (level: SkillLevel) => {
      if (!verse) return;
      setSelectedLevel(level);

      const { blankIndices: bi, blankIndexLookup: lookup, practiceAnswers: pa } =
        buildPracticeSet(verse, level);

      setBlankIndices(bi);
      setBlankIndexLookup(lookup);
      setPracticeAnswers(pa);
      setPlacements(new Array(bi.length).fill(""));
      setTilePool(shuffle([...pa, ...verse.decoys.map(normalizeWord)]));
      setSelectedTile(null);
      setAttemptIndex(1);
      setPracticeResult(null);
      setStartTime(Date.now());
      setStep("practice");
    },
    [verse],
  );

  const goToApply = useCallback(() => {
    setReflectionText("");
    setReflectionSaved(false);
    setReflectionError(null);
    setStep("apply");
    setTimeout(() => textareaRef.current?.focus(), 60);
  }, []);

  const goToComplete = useCallback(() => setStep("complete"), []);

  const toggleHeartCheckTag = useCallback((tag: string) => {
    setHeartCheckTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  }, []);

  const navigateToStep = useCallback(
    (target: JourneyStep) => {
      const targetIndex = stepOrder.indexOf(target);
      const current = stepOrder.indexOf(step);
      if (targetIndex >= current) return;
      if (target === "today") {
        setStep("today");
        setSelectedThemeId(null);
        setHeartCheckTags([]);
        setVerse(null);
        setPracticeResult(null);
        setReflectionText("");
        setReflectionSaved(false);
        setServerError(null);
        return;
      }
      if (target === "practice" && verse) {
        initPractice(selectedLevel);
        return;
      }
      setStep(target);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [step, verse, selectedLevel],
  );

  const startOver = useCallback(() => {
    setStep("today");
    setSelectedThemeId(null);
    setHeartCheckTags([]);
    setVerse(null);
    setPracticeResult(null);
    setReflectionText("");
    setReflectionSaved(false);
    setServerError(null);
  }, []);

  /* ---- practice interaction ---- */
  const handleTileClick = useCallback(
    (tileIndex: number) => {
      if (practiceResult) return;
      setSelectedTile((prev) => (prev === tileIndex ? null : tileIndex));
    },
    [practiceResult],
  );

  const handleBlankClick = useCallback(
    (slotIndex: number) => {
      if (practiceResult) return;

      if (placements[slotIndex]) {
        setPlacements((prev) => {
          const next = [...prev];
          next[slotIndex] = "";
          return next;
        });
        return;
      }

      if (selectedTile === null) return;
      const word = tilePool[selectedTile];
      if (!canPlaceWord(word, placements, tilePool, slotIndex)) return;

      setPlacements((prev) => {
        const next = [...prev];
        next[slotIndex] = word;
        return next;
      });
      setSelectedTile(null);
    },
    [placements, selectedTile, tilePool, practiceResult],
  );

  const allFilled = placements.length > 0 && placements.every(Boolean);

  const handleSubmit = useCallback(async () => {
    if (!verse || !allFilled) return;

    let correct = 0;
    placements.forEach((placed, index) => {
      if (normalizeWord(placed) === practiceAnswers[index]) correct += 1;
    });

    const total = practiceAnswers.length;
    scoreAttempt(correct, total, attemptIndex);
    setPracticeResult({ correct, total });

    try {
      const userId = await getUserId();
      const response = await fetch("/api/attempt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          verseId: verse.id,
          correctCount: correct,
          totalBlanks: total,
          attemptIndex,
          elapsedMs: Date.now() - startTime,
          skillLevel: selectedLevel,
        }),
      });

      if (response.ok) {
        const data: AttemptResponse = await response.json();
        if (data.streak !== undefined) setStreak(data.streak);
      } else {
        const data = await response.json().catch(() => ({}));
        setServerError(data.error ?? "Server error");
      }
    } catch {
      setServerError("Could not save progress — offline?");
    }
  }, [verse, allFilled, placements, practiceAnswers, attemptIndex, startTime, selectedLevel]);

  const handleRetry = useCallback(() => {
    if (!verse) return;
    setPlacements(new Array(blankIndices.length).fill(""));
    setSelectedTile(null);
    setPracticeResult(null);
    setAttemptIndex((prev) => prev + 1);
    setStartTime(Date.now());
    setTilePool(shuffle([...practiceAnswers, ...verse.decoys.map(normalizeWord)]));
  }, [verse, blankIndices.length, practiceAnswers]);

  /* ---- reflection save ---- */
  const handleSaveReflection = useCallback(async () => {
    if (!verse || !reflectionText.trim()) return;
    setReflectionError(null);

    try {
      const response = await fetch("/api/reflection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          verseId: verse.id,
          categoryId: selectedThemeId ?? "general",
          responseText: reflectionText.trim(),
        }),
      });

      if (response.ok) {
        setReflectionSaved(true);
      } else {
        const data = await response.json().catch(() => ({}));
        setReflectionError(data.error ?? "Could not save reflection.");
      }
    } catch {
      setReflectionError("Could not save — you may be offline.");
    }
  }, [verse, reflectionText, selectedThemeId]);

  /* ---- loading screen ---- */
  if (loading) {
    return (
      <main className="shell" style={{ textAlign: "center", paddingTop: "4rem" }}>
        <p className="soft-label">Preparing your journey…</p>
      </main>
    );
  }

  if (!loading && verses.length === 0) {
    return (
      <main className="shell" style={{ textAlign: "center", paddingTop: "4rem" }}>
        <p>No verses available. Please try again later.</p>
      </main>
    );
  }

  /* ================================================================ */
  /*  RENDER                                                          */
  /* ================================================================ */

  const levelMeta = getPracticeLevelMeta(selectedLevel);

  return (
    <main className="shell">
      {/* progress bar */}
      {step !== "today" && (
        <nav className="journey-progress" aria-label="Journey steps">
          {stepOrder.map((s, i) => {
            const canClick = i < currentStepIndex;
            return (
              <button
                key={s}
                type="button"
                className={classNames(
                  "journey-progress-step",
                  i < currentStepIndex && "done",
                  i === currentStepIndex && "active",
                )}
                title={STEP_LABELS[s]}
                aria-label={`${STEP_LABELS[s]}${canClick ? " (go back)" : ""}`}
                aria-current={i === currentStepIndex ? "step" : undefined}
                disabled={!canClick}
                onClick={() => canClick && navigateToStep(s)}
              />
            );
          })}
        </nav>
      )}

      {/* ------- STEP 1 — TODAY ------- */}
      {step === "today" && (
        <section className="journey-stage" style={{ textAlign: "center" }}>
          <h1 style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: "1.8rem", marginBottom: "0.5rem" }}>
            Today&rsquo;s Journey
          </h1>

          {featuredVerse && (
            <div className="journey-verse-card" style={{ marginBottom: "2rem" }}>
              <p style={{ fontWeight: 600, marginBottom: "0.25rem" }}>{featuredVerse.reference}</p>
              <p className="soft-label" style={{ marginBottom: 0 }}>{featuredVerse.themeLabel}</p>
              <p className="soft-label" style={{ maxWidth: 480, margin: "0.75rem auto 0" }}>
                Read a verse slowly, practice placing its words, and take one thought
                with you into your day.
              </p>
            </div>
          )}

          {!featuredVerse && (
            <p className="soft-label" style={{ maxWidth: 480, margin: "0 auto 2rem" }}>
              Read a verse slowly, practice placing its words, and take one thought
              with you into your day.
            </p>
          )}

          <button className="btn" onClick={goToHeartCheck}>
            Begin today&rsquo;s journey
          </button>
        </section>
      )}

      {/* ------- STEP 2 — HEART CHECK ------- */}
      {step === "heartcheck" && (
        <section className="journey-stage">
          <h2 style={{ textAlign: "center", marginBottom: "0.25rem" }}>Heart Check</h2>
          <p className="soft-label" style={{ textAlign: "center", maxWidth: 440, margin: "0 auto 1.5rem" }}>
            What are you carrying today? Choose what resonates, and let Scripture meet you there.
          </p>

          <div className="theme-grid">
            {HEART_CHECK_OPTIONS.map((option) => (
              <button
                key={option.id}
                className={classNames("theme-card", heartCheckTags.includes(option.id) && "selected")}
                onClick={() => toggleHeartCheckTag(option.id)}
              >
                <strong>{option.label}</strong>
                <span className="soft-label" style={{ fontSize: "0.85rem" }}>
                  {option.description}
                </span>
              </button>
            ))}
          </div>

          <div style={{ textAlign: "center", marginTop: "1.5rem", display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
            <button
              className="btn"
              disabled={heartCheckTags.length === 0}
              onClick={() => {
                const primary = heartCheckTags[0] ?? null;
                setSelectedThemeId(primary);
                goToRead(primary);
              }}
            >
              Continue
            </button>
            <button className="btn btn-ghost" onClick={() => goToRead(null)}>
              Skip
            </button>
          </div>
        </section>
      )}

      {/* ------- STEP 3 — READ SLOWLY ------- */}
      {step === "read" && verse && (
        <section className="journey-stage">
          <h2 style={{ textAlign: "center", marginBottom: "0.25rem" }}>Read Slowly</h2>
          <p className="soft-label" style={{ textAlign: "center", marginBottom: "1.5rem" }}>
            Let this passage wash over you before you practice it.
          </p>

          <div className="journey-reading">
            <p className="journey-devotional" style={{ fontSize: "1.25rem", lineHeight: 1.8 }}>
              &ldquo;{buildFullVerseText(verse)}&rdquo;
            </p>
            <p style={{ fontWeight: 600, textAlign: "center" }}>{verse.reference}</p>

            {verse.devotional && (
              <div style={{ marginTop: "1.25rem", padding: "1rem", background: "rgba(49,95,114,0.06)", borderRadius: "var(--radius)" }}>
                <p style={{ lineHeight: 1.7 }}>{verse.devotional}</p>
              </div>
            )}
          </div>

          <h3 style={{ textAlign: "center", marginTop: "2rem", marginBottom: "0.25rem" }}>
            Choose your practice depth
          </h3>
          <p className="soft-label" style={{ textAlign: "center", marginBottom: "1rem" }}>
            How many words would you like to place?
          </p>

          <div className="practice-level-grid">
            {PRACTICE_LEVELS.map((level) => (
              <button
                key={level.id}
                className={classNames("practice-level-card", selectedLevel === level.id && "selected")}
                onClick={() => setSelectedLevel(level.id)}
              >
                <strong>{level.label}</strong>
                <span className="soft-label" style={{ fontSize: "0.85rem" }}>{level.description}</span>
              </button>
            ))}
          </div>

          <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
            <button className="btn" onClick={() => initPractice(selectedLevel)}>
              I&rsquo;ve read this
            </button>
          </div>
        </section>
      )}

      {/* ------- STEP 4 — PRACTICE (drag-and-drop preserved) ------- */}
      {step === "practice" && verse && (
        <section className="journey-stage">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: "0.5rem", marginBottom: "1rem" }}>
            <h2 style={{ margin: 0 }}>Place the Missing Words</h2>
            <span className="soft-label">{levelMeta.label} &middot; {verse.reference}</span>
          </div>

          {/* verse with blanks */}
          <div className="verse-area" style={{ lineHeight: 2.15, fontSize: "1.15rem" }}>
            {verse.parts.map((part, answerIndex) => {
              const slotIndex = blankIndexLookup.get(answerIndex);
              const isBlank = slotIndex !== undefined;
              const answer = verse.answers[answerIndex];

              return (
                <span key={answerIndex}>
                  {part}
                  {answerIndex < verse.answers.length && (
                    isBlank ? (
                      <button
                        className={classNames(
                          "blank",
                          placements[slotIndex] && "filled",
                          practiceResult &&
                            (normalizeWord(placements[slotIndex]) === practiceAnswers[slotIndex]
                              ? "correct"
                              : "wrong"),
                        )}
                        onClick={() => handleBlankClick(slotIndex)}
                        disabled={!!practiceResult}
                        style={{ minWidth: 100, minHeight: 44 }}
                      >
                        {placements[slotIndex] || "\u00A0"}
                      </button>
                    ) : (
                      <span className="revealed-word">{answer}</span>
                    )
                  )}
                </span>
              );
            })}
          </div>

          {/* tile pool */}
          {!practiceResult && (
            <div className="tile-pool" style={{ marginTop: "1.5rem" }}>
              {tilePool.map((tile, tileIndex) => {
                const norm = normalizeWord(tile);
                const usedCount = countWords(placements)[norm] ?? 0;
                const instanceIndex = tilePool.slice(0, tileIndex + 1).filter((t) => normalizeWord(t) === norm).length - 1;
                const isUsed = instanceIndex < usedCount;
                return (
                  <button
                    key={`${tile}-${tileIndex}`}
                    className={classNames(
                      "tile",
                      selectedTile === tileIndex && "selected",
                      isUsed && "used",
                    )}
                    onClick={() => handleTileClick(tileIndex)}
                    disabled={isUsed}
                  >
                    {tile}
                  </button>
                );
              })}
            </div>
          )}

          {/* submit */}
          {!practiceResult && (
            <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
              <button className="btn" disabled={!allFilled} onClick={handleSubmit}>
                Check my words
              </button>
            </div>
          )}

          {/* result */}
          {practiceResult && (
            <div className="journey-verse-card" style={{ marginTop: "1.5rem", textAlign: "center" }}>
              <p style={{ fontSize: "1.15rem", fontWeight: 600, marginBottom: "0.5rem", color: "var(--ink)" }}>
                {practiceResult.correct === practiceResult.total
                  ? "Well done. The Word is taking root."
                  : `${practiceResult.correct} of ${practiceResult.total} words placed correctly.`}
              </p>

              {serverError && (
                <p style={{ color: "var(--bad)", fontSize: "0.9rem", marginBottom: "0.5rem" }}>
                  {serverError}
                </p>
              )}

              <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
                <button className="btn btn-ghost" onClick={handleRetry}>
                  Practice once more
                </button>
                <button className="btn" onClick={goToApply}>
                  Continue
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      {/* ------- STEP 5 — APPLY ------- */}
      {step === "apply" && verse && (
        <section className="journey-stage" style={{ maxWidth: 560, margin: "0 auto" }}>
          <h2 style={{ textAlign: "center", marginBottom: "0.25rem" }}>Apply</h2>
          <p className="soft-label" style={{ textAlign: "center", marginBottom: "1.5rem" }}>
            Take one truth from this passage into the rest of your day.
          </p>

          {heartCheckTags.length > 0 && (
            <p style={{ fontStyle: "italic", color: "var(--muted)", textAlign: "center", marginBottom: "1rem" }}>
              You mentioned you&rsquo;re dealing with {heartCheckTags.map((t) => t.toLowerCase()).join(", ")}…
            </p>
          )}

          {verse.applicationPrompt && (
            <div className="journey-verse-card" style={{ marginBottom: "1.5rem" }}>
              <p style={{ lineHeight: 1.6 }}>{verse.applicationPrompt}</p>
            </div>
          )}

          {!reflectionSaved && (
            <div>
              <label className="soft-label" htmlFor="reflection-textarea" style={{ display: "block", marginBottom: "0.5rem" }}>
                Your reflection (optional)
              </label>
              <textarea
                id="reflection-textarea"
                ref={textareaRef}
                className="reflection-textarea"
                rows={4}
                maxLength={2000}
                placeholder="What is one way you can live this verse today?"
                value={reflectionText}
                onChange={(event) => setReflectionText(event.target.value)}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  borderRadius: "var(--radius)",
                  border: "1px solid rgba(0,0,0,0.12)",
                  fontSize: "1rem",
                  fontFamily: "inherit",
                  resize: "vertical",
                }}
              />
              <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", marginTop: "0.75rem" }}>
                <button
                  className="btn"
                  disabled={!reflectionText.trim()}
                  onClick={handleSaveReflection}
                >
                  Save and finish
                </button>
                <button className="btn btn-ghost" onClick={goToComplete}>
                  Skip
                </button>
              </div>
              {reflectionError && (
                <p style={{ color: "var(--bad)", textAlign: "center", marginTop: "0.5rem", fontSize: "0.9rem" }}>
                  {reflectionError}
                </p>
              )}
            </div>
          )}

          {reflectionSaved && (
            <div style={{ textAlign: "center" }}>
              <p style={{ color: "var(--ok)", fontWeight: 600, marginBottom: "1rem" }}>
                Reflection saved.
              </p>
              <button className="btn" onClick={goToComplete}>
                Finish
              </button>
            </div>
          )}
        </section>
      )}

      {/* ------- STEP 6 — COMPLETION ------- */}
      {step === "complete" && (
        <section className="journey-stage completion-panel" style={{ textAlign: "center" }}>
          {verse && (
            <>
              <p className="completion-verse-ref" style={{ fontWeight: 600, marginBottom: "0.5rem" }}>{verse.reference}</p>
            </>
          )}

          <p style={{ fontSize: "1.1rem", marginTop: "1rem" }}>
            You spent time with this verse today.
          </p>
          <p className="soft-label" style={{ marginTop: "0.5rem" }}>
            Carry it with you.
          </p>

          {streak > 0 && (
            <p style={{ fontSize: "0.85rem", color: "var(--muted)", marginTop: "1rem" }}>
              Day {streak} in a row
            </p>
          )}

          {reflectionSaved && (
            <p style={{ fontSize: "0.88rem", color: "var(--ok)", marginTop: "0.5rem" }}>
              Your reflection has been kept.
            </p>
          )}

          <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap", marginTop: "1.5rem" }}>
            <button className="btn" onClick={startOver}>
              Begin another journey
            </button>
            <Link href="/" className="btn btn-ghost">
              Return home
            </Link>
          </div>
        </section>
      )}
    </main>
  );
}
