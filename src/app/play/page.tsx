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

type JourneyStep = "intro" | "theme" | "read" | "practice" | "reflect" | "complete";

type PracticeResult = { correct: number; total: number; score: number };

type AttemptResponse = {
  success: boolean;
  score: number;
  streak: number;
  sessionBest: number;
  error?: string;
};

type ReflectionMode = "choose" | "write";

const STEP_LABELS: Record<JourneyStep, string> = {
  intro: "Welcome",
  theme: "Heart Check",
  read: "Read Slowly",
  practice: "Practice",
  reflect: "Live It",
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
  const [step, setStep] = useState<JourneyStep>("intro");
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
  const [startTime, setStartTime] = useState(0);

  /* ---- reflection state ---- */
  const [reflectionMode, setReflectionMode] = useState<ReflectionMode>("choose");
  const [reflectionText, setReflectionText] = useState("");
  const [reflectionSaved, setReflectionSaved] = useState(false);
  const [reflectionError, setReflectionError] = useState<string | null>(null);

  /* ---- overall stats ---- */
  const [streak, setStreak] = useState(0);
  const [sessionScore, setSessionScore] = useState(0);
  const [serverError, setServerError] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  /* ---- fetch verses ---- */
  useEffect(() => {
    (async () => {
      try {
        const response = await fetch("/api/verses");
        if (!response.ok) throw new Error("fetch verses failed");
        const data: Verse[] = await response.json();
        setVerses(data);
      } catch {
        setVerses([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* featured verse for intro */
  const featuredVerse = useMemo(
    () => (verses.length > 0 ? pickDailyFeaturedVerse(verses) : null),
    [verses],
  );

  /* ---- step progress bar ---- */
  const stepOrder: JourneyStep[] = ["intro", "theme", "read", "practice", "reflect", "complete"];
  const currentStepIndex = stepOrder.indexOf(step);

  /* ---- navigation helpers ---- */
  const goToTheme = useCallback(() => setStep("theme"), []);

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

  const goToReflect = useCallback(() => {
    setReflectionMode("choose");
    setReflectionText("");
    setReflectionSaved(false);
    setReflectionError(null);
    setStep("reflect");
  }, []);

  const goToComplete = useCallback(() => setStep("complete"), []);

  const navigateToStep = useCallback(
    (target: JourneyStep) => {
      const targetIndex = stepOrder.indexOf(target);
      const current = stepOrder.indexOf(step);
      if (targetIndex >= current) return; // only allow backward
      if (target === "intro") {
        // reset everything
        setStep("intro");
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
    setStep("intro");
    setSelectedThemeId(null);
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
    const score = scoreAttempt(correct, total, attemptIndex);
    const result: PracticeResult = { correct, total, score };
    setPracticeResult(result);
    setSessionScore((prev) => prev + score);

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

  const themeOption = HEART_CHECK_OPTIONS.find((option) => option.id === selectedThemeId);
  const levelMeta = getPracticeLevelMeta(selectedLevel);

  return (
    <main className="shell">
      {/* progress bar */}
      {step !== "intro" && (
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

      {/* ------- INTRO ------- */}
      {step === "intro" && (
        <section className="journey-stage" style={{ textAlign: "center" }}>
          <h1 style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: "1.8rem", marginBottom: "0.5rem" }}>
            Today&rsquo;s Journey
          </h1>
          <p className="soft-label" style={{ maxWidth: 480, margin: "0 auto 2rem" }}>
            Read a verse slowly, practice placing its words, and take one thought
            with you into your day.
          </p>

          {featuredVerse && (
            <div className="journey-verse-card" style={{ marginBottom: "2rem" }}>
              <p className="soft-label" style={{ marginBottom: "0.25rem" }}>Today&rsquo;s featured verse</p>
              <p style={{ fontStyle: "italic", lineHeight: 1.6, marginBottom: "0.5rem" }}>
                &ldquo;{buildFullVerseText(featuredVerse)}&rdquo;
              </p>
              <p style={{ fontWeight: 600 }}>{featuredVerse.reference}</p>
            </div>
          )}

          <button className="btn" onClick={goToTheme}>
            Begin today&rsquo;s journey
          </button>
        </section>
      )}

      {/* ------- THEME (Heart Check) ------- */}
      {step === "theme" && (
        <section className="journey-stage">
          <h2 style={{ textAlign: "center", marginBottom: "0.25rem" }}>Heart Check</h2>
          <p className="soft-label" style={{ textAlign: "center", maxWidth: 440, margin: "0 auto 1.5rem" }}>
            What are you carrying today? Choose a theme and let Scripture meet you there.
          </p>

          <div className="theme-grid">
            {HEART_CHECK_OPTIONS.map((option) => (
              <button
                key={option.id}
                className={classNames("theme-card", selectedThemeId === option.id && "selected")}
                onClick={() => setSelectedThemeId(option.id)}
              >
                <strong>{option.label}</strong>
                <span className="soft-label" style={{ fontSize: "0.85rem" }}>
                  {option.description}
                </span>
              </button>
            ))}
          </div>

          <div style={{ textAlign: "center", marginTop: "1.5rem", display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
            <button className="btn" disabled={!selectedThemeId} onClick={() => goToRead(selectedThemeId)}>
              Continue with this theme
            </button>
            <button className="btn btn-ghost" onClick={() => goToRead(null)}>
              Surprise me
            </button>
          </div>
        </section>
      )}

      {/* ------- READ SLOWLY ------- */}
      {step === "read" && verse && (
        <section className="journey-stage">
          <h2 style={{ textAlign: "center", marginBottom: "0.25rem" }}>Read Slowly</h2>
          <p className="soft-label" style={{ textAlign: "center", marginBottom: "1.5rem" }}>
            Let this passage wash over you before you practice it.
          </p>

          <div className="journey-reading">
            <p className="journey-devotional">
              &ldquo;{buildFullVerseText(verse)}&rdquo;
            </p>
            <p style={{ fontWeight: 600, textAlign: "center" }}>{verse.reference}</p>

            {verse.devotional && (
              <div style={{ marginTop: "1.25rem", padding: "1rem", background: "rgba(49,95,114,0.06)", borderRadius: "var(--radius)" }}>
                <p className="soft-label" style={{ marginBottom: "0.25rem" }}>A thought to sit with</p>
                <p style={{ lineHeight: 1.7 }}>{verse.devotional}</p>
              </div>
            )}
          </div>

          <h3 style={{ textAlign: "center", marginTop: "2rem", marginBottom: "0.25rem" }}>
            Choose your practice depth
          </h3>
          <p className="soft-label" style={{ textAlign: "center", marginBottom: "1rem" }}>
            How many words would you like to fill in?
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
              Begin practice
            </button>
          </div>
        </section>
      )}

      {/* ------- PRACTICE ------- */}
      {step === "practice" && verse && (
        <section className="journey-stage">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: "0.5rem", marginBottom: "1rem" }}>
            <h2 style={{ margin: 0 }}>Practice</h2>
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

          {/* submit / result */}
          {!practiceResult && (
            <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
              <button className="btn" disabled={!allFilled} onClick={handleSubmit}>
                See how I did
              </button>
            </div>
          )}

          {practiceResult && (
            <div className="journey-verse-card" style={{ marginTop: "1.5rem", textAlign: "center" }}>
              <p style={{ fontSize: "1.15rem", fontWeight: 600, marginBottom: "0.5rem", color: practiceResult.correct === practiceResult.total ? "var(--ok)" : "var(--ink)" }}>
                {practiceResult.correct === practiceResult.total
                  ? "Every word in its place."
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
                <button className="btn" onClick={goToReflect}>
                  Continue &rarr;
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      {/* ------- REFLECT (Live It) ------- */}
      {step === "reflect" && verse && (
        <section className="journey-stage" style={{ maxWidth: 560, margin: "0 auto" }}>
          <h2 style={{ textAlign: "center", marginBottom: "0.25rem" }}>Live It</h2>
          <p className="soft-label" style={{ textAlign: "center", marginBottom: "1.5rem" }}>
            Take one truth from this passage into the rest of your day.
          </p>

          {themeOption && (
            <div className="journey-verse-card" style={{ marginBottom: "1.5rem" }}>
              <p style={{ fontStyle: "italic", lineHeight: 1.6 }}>{themeOption.prompt}</p>
            </div>
          )}

          {verse.applicationPrompt && (
            <div className="journey-verse-card" style={{ marginBottom: "1.5rem" }}>
              <p className="soft-label" style={{ marginBottom: "0.25rem" }}>From today&rsquo;s verse</p>
              <p style={{ lineHeight: 1.6 }}>{verse.applicationPrompt}</p>
            </div>
          )}

          {reflectionMode === "choose" && (
            <div style={{ textAlign: "center", display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
              <button className="btn" onClick={() => { setReflectionMode("write"); setTimeout(() => textareaRef.current?.focus(), 60); }}>
                Write a short reflection
              </button>
              <button className="btn btn-ghost" onClick={goToComplete}>
                Skip for now
              </button>
            </div>
          )}

          {reflectionMode === "write" && !reflectionSaved && (
            <div>
              <textarea
                ref={textareaRef}
                className="reflection-textarea"
                rows={4}
                maxLength={1000}
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
                  Save &amp; finish
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
                Finish &rarr;
              </button>
            </div>
          )}
        </section>
      )}

      {/* ------- COMPLETE ------- */}
      {step === "complete" && (
        <section className="journey-stage completion-panel" style={{ textAlign: "center" }}>
          {verse && (
            <>
              <p className="verse-display">
                &ldquo;{buildFullVerseText(verse)}&rdquo;
              </p>
              <p className="completion-verse-ref">{verse.reference}</p>
            </>
          )}

          <p className="soft-label" style={{ marginTop: "1.5rem" }}>
            You spent time in this verse today.
          </p>

          {streak > 0 && (
            <p style={{ fontSize: "0.85rem", color: "var(--muted)", marginTop: "0.5rem" }}>
              {streak} days walking with the Word
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
              Return to home
            </Link>
          </div>
        </section>
      )}
    </main>
  );
}
