"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

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
  getThemeOption,
  getVerseTranslation,
  pickJourneyVerse,
} from "@/lib/journey";
import { KIDS_VERSES, KIDS_THEME_OPTIONS } from "@/lib/kids-verses";
import { useAudience } from "@/lib/audience-context";
import { useTranslation } from "@/lib/translation-context";
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
  heartcheck: "Prepare",
  read: "Read",
  practice: "Practice",
  apply: "Respond",
  complete: "Amen",
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function classNames(...values: (string | false | null | undefined)[]): string {
  return values.filter(Boolean).join(" ");
}

function displayWord(word: string): string {
  if (!word) return word;
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
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
  const autoStartedTodayRef = useRef(false);

  /* ---- data state ---- */
  const [verses, setVerses] = useState<Verse[]>([]);
  const [loading, setLoading] = useState(true);

  /* ---- audience mode ---- */
  const { audienceMode } = useAudience();
  const isKids = audienceMode === "kids";
  const themeOptions = isKids ? KIDS_THEME_OPTIONS : HEART_CHECK_OPTIONS;

  /* ---- journey flow ---- */
  const [step, setStep] = useState<JourneyStep>("heartcheck");
  const [selectedThemeId, setSelectedThemeId] = useState<string | null>(null);
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
  const [answerRevealed, setAnswerRevealed] = useState(false);
  const [startTime, setStartTime] = useState(0);

  /* ---- reflection state ---- */
  const [reflectionText, setReflectionText] = useState("");
  const [reflectionSaved, setReflectionSaved] = useState(false);
  const [reflectionError, setReflectionError] = useState<string | null>(null);

  /* ---- overall stats ---- */
  const [streak, setStreak] = useState(0);
  const [serverError, setServerError] = useState<string | null>(null);

  /* ---- same-day return detection ---- */
  const [completedToday, setCompletedToday] = useState(false);
  const [completedVerseRef, setCompletedVerseRef] = useState<string | null>(null);

  /* ---- translation preference (shared context) ---- */
  const { translationKey } = useTranslation();

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  /* ---- fetch verses ---- */
  useEffect(() => {
    if (isKids) {
      setVerses(KIDS_VERSES);
      setLoading(false);
      return;
    }
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

    /* Check if today's journey was already completed */
    const today = new Date().toISOString().slice(0, 10);
    if (localStorage.getItem("sg_lastJourneyDate") === today) {
      setCompletedToday(true);
      setCompletedVerseRef(localStorage.getItem("sg_lastJourneyVerse"));
    }
  }, [isKids]);

  /* ---- step progress bar ---- */
  const stepOrder: JourneyStep[] = ["heartcheck", "read", "practice", "apply", "complete"];
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

  useEffect(() => {
    const startWithToday =
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).get("today") === "1";

    if (!startWithToday) return;
    if (loading || verses.length === 0) return;
    if (completedToday) return;
    if (autoStartedTodayRef.current) return;

    autoStartedTodayRef.current = true;
    goToRead(null);
  }, [loading, verses, completedToday, goToRead]);

  const initPractice = useCallback(
    (level: SkillLevel) => {
      if (!verse) return;
      setSelectedLevel(level);

      const t = getVerseTranslation(verse, translationKey);
      const { blankIndices: bi, blankIndexLookup: lookup, practiceAnswers: pa } =
        buildPracticeSet(verse, level, translationKey);

      setBlankIndices(bi);
      setBlankIndexLookup(lookup);
      setPracticeAnswers(pa);
      setPlacements(new Array(bi.length).fill(""));
      setTilePool(shuffle([...pa, ...t.decoys.map(normalizeWord)]));
      setSelectedTile(null);
      setAttemptIndex(1);
      setPracticeResult(null);
      setAnswerRevealed(false);
      setStartTime(Date.now());
      setStep("practice");
    },
    [verse, translationKey],
  );

  const goToApply = useCallback(() => {
    setReflectionText("");
    setReflectionSaved(false);
    setReflectionError(null);
    setStep("apply");
    setTimeout(() => textareaRef.current?.focus(), 60);
  }, []);

  const goToComplete = useCallback(() => {
    setStep("complete");
    const today = new Date().toISOString().slice(0, 10);
    localStorage.setItem("sg_lastJourneyDate", today);
    if (verse) localStorage.setItem("sg_lastJourneyVerse", verse.reference);
  }, [verse]);

  const navigateToStep = useCallback(
    (target: JourneyStep) => {
      const targetIndex = stepOrder.indexOf(target);
      const current = stepOrder.indexOf(step);
      if (targetIndex >= current) return;
      if (target === "heartcheck") {
        setStep("heartcheck");
        setSelectedThemeId(null);
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
    setStep("heartcheck");
    setSelectedThemeId(null);
    setVerse(null);
    setPracticeResult(null);
    setAnswerRevealed(false);
    setReflectionText("");
    setReflectionSaved(false);
    setServerError(null);
  }, []);

  /* ---- practice interaction ---- */
  const handleTileClick = useCallback(
    (tileIndex: number) => {
      if (practiceResult) return;
      const word = tilePool[tileIndex];
      // Auto-place into first empty blank
      const emptySlot = placements.findIndex((p) => !p);
      if (emptySlot !== -1 && canPlaceWord(word, placements, tilePool, emptySlot)) {
        setPlacements((prev) => {
          const next = [...prev];
          next[emptySlot] = word;
          return next;
        });
        setSelectedTile(null);
      } else {
        // Fall back to select/deselect if no valid slot
        setSelectedTile((prev) => (prev === tileIndex ? null : tileIndex));
      }
    },
    [practiceResult, tilePool, placements],
  );

  const handleBlankClick = useCallback(
    (slotIndex: number) => {
      if (practiceResult) return;

      // Tap filled blank to remove the word
      if (placements[slotIndex]) {
        setPlacements((prev) => {
          const next = [...prev];
          next[slotIndex] = "";
          return next;
        });
        return;
      }

      // If a tile is selected, place it here
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
    const t = getVerseTranslation(verse, translationKey);
    setPlacements(new Array(blankIndices.length).fill(""));
    setSelectedTile(null);
    setPracticeResult(null);
    setAnswerRevealed(false);
    setAttemptIndex((prev) => prev + 1);
    setStartTime(Date.now());
    setTilePool(shuffle([...practiceAnswers, ...t.decoys.map(normalizeWord)]));
  }, [verse, translationKey, blankIndices.length, practiceAnswers]);

  const handleShowAnswer = useCallback(() => {
    if (!verse || practiceResult) return;
    setPlacements([...practiceAnswers]);
    setPracticeResult({ correct: practiceAnswers.length, total: practiceAnswers.length });
    setAnswerRevealed(true);
  }, [verse, practiceResult, practiceAnswers]);

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
        <p className="soft-label" role="status" aria-live="polite">Preparing your journey…</p>
      </main>
    );
  }

  if (!loading && verses.length === 0) {
    return (
      <main className="shell" style={{ textAlign: "center", paddingTop: "4rem" }}>
        <p role="alert">No verses available. Please try again later.</p>
      </main>
    );
  }

  /* ================================================================ */
  /*  RENDER                                                          */
  /* ================================================================ */

  const levelMeta = getPracticeLevelMeta(selectedLevel);

  return (
    <main className="shell" aria-label="Scripture journey">
      {/* step announcer for screen readers */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {STEP_LABELS[step]}
      </div>

      {/* progress bar */}
      {
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
      }

      {/* ------- SAME-DAY RETURN ------- */}
      {step === "heartcheck" && completedToday && (
        <section className="journey-stage" style={{ textAlign: "center", padding: "clamp(2.5rem, 6vw, 5rem) clamp(1.5rem, 4vw, 3rem)" }}>
          <p style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: "1.25rem", lineHeight: 1.6, marginBottom: "1rem" }}>
            You&rsquo;ve journeyed with today&rsquo;s verse.
          </p>
          {completedVerseRef && (
            <p style={{ fontFamily: "var(--scripture-font)", fontStyle: "italic", color: "var(--muted)", marginBottom: "1.5rem" }}>
              &ldquo;{completedVerseRef}&rdquo;
            </p>
          )}
          <p style={{ color: "var(--muted)", lineHeight: 1.7, marginBottom: "2rem" }}>
            Your reflection is saved. Come back tomorrow — or revisit your reflections.
          </p>
          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/profile/reflections" className="btn">View my reflections</Link>
            <button className="btn btn-ghost" onClick={() => { setCompletedToday(false); }}>
              Practice again anyway
            </button>
          </div>
        </section>
      )}

      {/* ------- STEP 2 — HEART CHECK ------- */}
      {step === "heartcheck" && !completedToday && (
        <section className="journey-stage" aria-labelledby="heartcheck-heading">
          <h2 id="heartcheck-heading" style={{ textAlign: "center", fontFamily: "'Fraunces', Georgia, serif", marginBottom: "0.35rem" }}>Choose a topic</h2>
          <p style={{ textAlign: "center", maxWidth: 440, margin: "0 auto 1rem", color: "rgba(35,49,58,0.7)", lineHeight: 1.7 }}>
            Select a theme below and let Scripture meet you there.
          </p>

          <div className="theme-grid" role="group" aria-label="Select what you are carrying">
            {themeOptions.map((option) => (
              <button
                key={option.id}
                className="theme-card"
                onClick={() => {
                  setSelectedThemeId(option.id);
                  goToRead(option.id);
                }}
              >
                <strong>{option.label}</strong>
                <span className="soft-label" style={{ fontSize: "0.85rem" }}>
                  {option.description}
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* ------- STEP 3 — READ SLOWLY ------- */}
      {step === "read" && verse && (
        <section className="journey-stage" aria-labelledby="read-heading">
          {selectedThemeId && (() => {
            const theme = getThemeOption(selectedThemeId);
            return theme ? (
              <div className="topic-badge-row">
                <span className="topic-badge">{theme.label}</span>
                <button className="btn-change-topic" onClick={goToHeartCheck}>Change topic</button>
              </div>
            ) : null;
          })()}
          <p id="read-heading" className="soft-label" style={{ textAlign: "center", marginBottom: "1rem" }}>
            Read slowly
          </p>
          <p style={{ textAlign: "center", color: "var(--muted)", fontSize: "0.92rem", marginBottom: "1.5rem" }}>
            {isKids ? "Read it out loud if you can. Then read it again." : "Read slowly, 2–3 times. There is no timer."}
          </p>

          <div className="journey-reading" style={{ padding: "1.5rem 0" }}>
            <p className="journey-devotional" style={{ fontFamily: "var(--scripture-font)", fontSize: "clamp(1.4rem, 2.8vw, 1.85rem)", lineHeight: 2, textAlign: "center" }}>
              &ldquo;{buildFullVerseText(verse, translationKey)}&rdquo;
            </p>
            <p style={{ fontWeight: 600, textAlign: "center", marginTop: "0.75rem" }}>{verse.reference} <span style={{ fontWeight: 400, color: "var(--muted)", fontSize: "0.9rem" }}>({translationKey.toUpperCase()})</span></p>

            {verse.devotional && !isKids && (
              <div style={{ marginTop: "2rem", padding: "1.25rem 1.5rem", background: "rgba(49,95,114,0.05)", borderRadius: "var(--radius)", borderLeft: "3px solid rgba(49,95,114,0.2)" }}>
                <p style={{ lineHeight: 1.8, fontSize: "1.02rem", color: "rgba(35,49,58,0.85)" }}>{verse.devotional}</p>
              </div>
            )}
          </div>

          <div style={{ marginTop: "2.5rem", borderTop: "1px solid rgba(0,0,0,0.06)", paddingTop: "2rem" }}>
            <p style={{ textAlign: "center", color: "rgba(35,49,58,0.7)", marginBottom: "1rem", fontSize: "1.02rem" }}>
              When you are ready, choose how deeply you want to practice.
            </p>

          <div className="practice-level-grid" role="radiogroup" aria-label="Practice depth">
            {PRACTICE_LEVELS.map((level) => (
              <button
                key={level.id}
                role="radio"
                aria-checked={selectedLevel === level.id}
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
              I&rsquo;m ready to practice
            </button>
          </div>
          </div>
        </section>
      )}

      {/* ------- STEP 4 — PRACTICE (drag-and-drop preserved) ------- */}
      {step === "practice" && verse && (() => {
        const t = getVerseTranslation(verse, translationKey);
        const practiceTheme = selectedThemeId ? getThemeOption(selectedThemeId) : null;
        return (
        <section className="journey-stage">
          {practiceTheme && (
            <div className="topic-badge-row">
              <span className="topic-badge">{practiceTheme.label}</span>
              <button className="btn-change-topic" onClick={goToHeartCheck}>Change topic</button>
            </div>
          )}
          <div style={{ marginBottom: "1.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: "0.5rem" }}>
              <p className="soft-label" style={{ margin: 0 }}>Hide this verse in your heart</p>
              <span style={{ color: "var(--muted)", fontSize: "0.9rem" }}>{levelMeta.label} &middot; {verse.reference} ({translationKey.toUpperCase()})</span>
            </div>
            <p style={{ margin: "0.35rem 0 0", fontSize: "0.88rem", fontStyle: "italic", color: "var(--muted)" }}>Psalm 119:11</p>
          </div>

          {/* verse with blanks */}
          <div className="verse-area" role="group" aria-label="Verse with blanks to fill" style={{ lineHeight: 2.15, fontSize: "1.15rem" }}>
            {t.parts.map((part, answerIndex) => {
              const slotIndex = blankIndexLookup.get(answerIndex);
              const isBlank = slotIndex !== undefined;
              const answer = t.answers[answerIndex];

              return (
                <span key={answerIndex}>
                  {part}
                  {answerIndex < t.answers.length && (
                    isBlank ? (
                      <button
                        className={classNames(
                          "blank",
                          placements[slotIndex] && "filled",
                          !placements[slotIndex] && selectedTile !== null && "awaiting",
                          practiceResult &&
                            (normalizeWord(placements[slotIndex]) === practiceAnswers[slotIndex]
                              ? "correct"
                              : "wrong"),
                        )}
                        onClick={() => handleBlankClick(slotIndex)}
                        disabled={!!practiceResult}
                        aria-label={placements[slotIndex] ? `Blank ${slotIndex + 1}: ${displayWord(placements[slotIndex])}. Tap to remove.` : `Blank ${slotIndex + 1}. Tap a word tile to place it here.`}
                        style={{ minWidth: 100, minHeight: 48 }}
                      >
                        {placements[slotIndex] ? displayWord(placements[slotIndex]) : "\u00A0"}
                      </button>
                    ) : (
                      <span className="revealed-word">{displayWord(answer)}</span>
                    )
                  )}
                </span>
              );
            })}
          </div>

          {/* tile pool */}
          {!practiceResult && (
            <>
              <p style={{ textAlign: "center", margin: "1.5rem 0 0.5rem", fontSize: "0.88rem", color: "var(--muted)" }}>
                Tap a word to place it in the next blank &middot; tap a filled blank to remove it
              </p>
              <div className="tile-pool" role="group" aria-label="Word tiles" style={{ marginTop: "0" }}>
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
                    aria-pressed={selectedTile === tileIndex}
                    aria-label={isUsed ? `${displayWord(tile)} (already placed)` : displayWord(tile)}
                  >
                    {displayWord(tile)}
                  </button>
                );
              })}
            </div>
            </>
          )}

          {/* submit + show answer */}
          {!practiceResult && (
            <div style={{ textAlign: "center", marginTop: "1.5rem", display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
              <button className="btn" disabled={!allFilled} onClick={handleSubmit}>
                Commit to heart
              </button>
              <button className="btn btn-ghost" onClick={handleShowAnswer}>
                Show answer
              </button>
            </div>
          )}

          {/* result */}
          {practiceResult && (
            <div className="journey-verse-card" role="status" aria-live="polite" style={{ marginTop: "2rem", textAlign: "center", padding: "1.5rem" }}>
              <p style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "0.75rem", color: "var(--ink)" }}>
                {answerRevealed
                  ? "Here is the complete verse. Read it slowly."
                  : practiceResult.correct === practiceResult.total
                    ? (isKids ? "You did it! Keep practicing and it will stick." : "Practice complete — hidden deeper in your heart.")
                    : "Almost there. A few words need another look."}
              </p>

              {serverError && (
                <p style={{ color: "var(--bad)", fontSize: "0.9rem", marginBottom: "0.5rem" }}>
                  {serverError}
                </p>
              )}

              <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
                <button className="btn btn-ghost" onClick={handleRetry}>
                  Practice again
                </button>
                <button className="btn" onClick={goToApply}>
                  Continue
                </button>
              </div>
            </div>
          )}
        </section>
        );
      })()}

      {/* ------- STEP 5 — APPLY ------- */}
      {step === "apply" && verse && (
        <section className="journey-stage" aria-labelledby="apply-heading" style={{ maxWidth: 560, margin: "0 auto" }}>
          <p id="apply-heading" className="soft-label" style={{ textAlign: "center", marginBottom: "1.5rem" }}>Respond</p>

          {selectedThemeId && (() => {
            const theme = getThemeOption(selectedThemeId);
            return theme ? (
              <div className="topic-badge-row">
                <span className="topic-badge">{theme.label}</span>
                <button className="btn-change-topic" onClick={goToHeartCheck}>Change topic</button>
              </div>
            ) : null;
          })()}

          {selectedThemeId && !isKids && (() => {
            const theme = getThemeOption(selectedThemeId);
            return theme ? (
              <p style={{ fontStyle: "italic", color: "var(--muted)", textAlign: "center", marginBottom: "1.25rem", lineHeight: 1.6 }}>
                You said you are carrying {theme.label.toLowerCase()}…
              </p>
            ) : null;
          })()}

          {verse.applicationPrompt && (
            <div style={{ marginBottom: "2rem", padding: "1.25rem 1.5rem", background: "rgba(49,95,114,0.05)", borderRadius: "var(--radius)", borderLeft: "3px solid rgba(49,95,114,0.2)" }}>
              <p style={{ lineHeight: 1.7, fontSize: "1.05rem", fontFamily: "'Fraunces', Georgia, serif" }}>{verse.applicationPrompt}</p>
            </div>
          )}

          {!reflectionSaved && (
            <div>
              <label htmlFor="reflection-textarea" className="sr-only">Your reflection</label>
              <textarea
                id="reflection-textarea"
                ref={textareaRef}
                className="reflection-textarea"
                rows={5}
                maxLength={2000}
                placeholder="Write what comes to mind…"
                value={reflectionText}
                onChange={(event) => setReflectionText(event.target.value)}
                style={{
                  width: "100%",
                  padding: "1rem",
                  borderRadius: "var(--radius)",
                  border: "1px solid rgba(0,0,0,0.08)",
                  fontSize: "1rem",
                  fontFamily: "inherit",
                  resize: "vertical",
                  lineHeight: 1.7,
                  background: "rgba(255,255,255,0.7)",
                }}
              />
              <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", marginTop: "1rem" }}>
                <button
                  className="btn"
                  disabled={!reflectionText.trim()}
                  onClick={handleSaveReflection}
                >
                  Save and finish
                </button>
                <button className="btn btn-ghost" onClick={goToComplete}>
                  Continue without writing
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
        <section className="journey-stage completion-panel" aria-labelledby="completion-heading" style={{ textAlign: "center", padding: "clamp(2.5rem, 6vw, 5rem) clamp(1.5rem, 4vw, 3rem)" }}>
          {verse && (
            <>
              <p className="verse-display" style={{ marginBottom: "1rem" }}>
                &ldquo;{buildFullVerseText(verse, translationKey)}&rdquo;
              </p>
              <p className="completion-verse-ref">{verse.reference} ({translationKey.toUpperCase()})</p>
            </>
          )}

          <div style={{ margin: "2.5rem auto 0", maxWidth: 400, borderTop: "1px solid rgba(0,0,0,0.06)", paddingTop: "2rem" }}>
            <p style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: "1.15rem", lineHeight: 1.6, color: "var(--ink)" }}>
              This stays with you.
            </p>
            <p id="completion-heading" style={{ color: "var(--muted)", fontSize: "0.95rem", marginTop: "0.75rem", lineHeight: 1.6 }}>
              You gave this verse your time and attention today. Let it continue to work in the quiet.
            </p>
          </div>

          {streak > 0 && (
            <p style={{ fontSize: "0.85rem", color: "var(--muted)", marginTop: "1.5rem" }}>
              {streak} {streak === 1 ? "day" : "days"} in a row
            </p>
          )}

          {reflectionSaved && (
            <p style={{ fontSize: "0.88rem", color: "var(--ok)", marginTop: "0.5rem" }}>
              Your reflection has been kept.
            </p>
          )}

          <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap", marginTop: "2.5rem" }}>
            <button className="btn btn-ghost" onClick={startOver}>
              Start again with a new verse
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
