"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import {
  canPlaceWord,
  countWords,
  normalizeWord,
  shuffle,
} from "@/lib/game";
import {
  PRACTICE_LEVELS,
  buildFullVerseText,
  buildPracticeSet,
  getPracticeLevelMeta,
  getVerseTranslation,
} from "@/lib/journey";
import { KIDS_VERSES } from "@/lib/kids-verses";
import { useAudience } from "@/lib/audience-context";
import { useTranslation } from "@/lib/translation-context";
import type { SkillLevel, Verse } from "@/types/domain";

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

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

export default function PracticePage() {
  const { translationKey } = useTranslation();
  const { audienceMode } = useAudience();
  const isKids = audienceMode === "kids";

  /* ---- data ---- */
  const [verses, setVerses] = useState<Verse[]>([]);
  const [loading, setLoading] = useState(true);
  const [verse, setVerse] = useState<Verse | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  /* ---- practice config ---- */
  const [selectedLevel, setSelectedLevel] = useState<SkillLevel>("intermediate");
  const [practiceStarted, setPracticeStarted] = useState(false);

  /* ---- practice state ---- */
  const [placements, setPlacements] = useState<string[]>([]);
  const [tilePool, setTilePool] = useState<string[]>([]);
  const [blankIndexLookup, setBlankIndexLookup] = useState<Map<number, number>>(new Map());
  const [practiceAnswers, setPracticeAnswers] = useState<string[]>([]);
  const [blankIndices, setBlankIndices] = useState<number[]>([]);
  const [selectedTile, setSelectedTile] = useState<number | null>(null);
  const [practiceResult, setPracticeResult] = useState<{ correct: number; total: number } | null>(null);
  const [answerRevealed, setAnswerRevealed] = useState(false);

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
        if (!response.ok) throw new Error("fetch failed");
        const data = await response.json();
        setVerses(Array.isArray(data) ? data : data.verses ?? []);
      } catch {
        setVerses([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [isKids]);

  /* ---- pick initial verse ---- */
  useEffect(() => {
    if (verses.length === 0) return;
    const saved = typeof window !== "undefined" ? localStorage.getItem("sg_lastJourneyVerse") : null;
    if (saved) {
      const match = verses.find((v) => v.reference === saved);
      if (match) { setVerse(match); return; }
    }
    setVerse(verses[0]);
  }, [verses]);

  /* ---- start practice ---- */
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
      setPracticeResult(null);
      setAnswerRevealed(false);
      setPracticeStarted(true);
    },
    [verse, translationKey],
  );

  /* ---- tile interaction ---- */
  const handleTileClick = useCallback(
    (tileIndex: number) => {
      if (practiceResult) return;
      const word = tilePool[tileIndex];
      const emptySlot = placements.findIndex((p) => !p);
      if (emptySlot !== -1 && canPlaceWord(word, placements, tilePool, emptySlot)) {
        setPlacements((prev) => {
          const next = [...prev];
          next[emptySlot] = word;
          return next;
        });
        setSelectedTile(null);
      } else {
        setSelectedTile((prev) => (prev === tileIndex ? null : tileIndex));
      }
    },
    [practiceResult, tilePool, placements],
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

  const handleSubmit = useCallback(() => {
    if (!verse || !allFilled) return;
    let correct = 0;
    placements.forEach((placed, index) => {
      if (normalizeWord(placed) === practiceAnswers[index]) correct += 1;
    });
    setPracticeResult({ correct, total: practiceAnswers.length });
  }, [verse, allFilled, placements, practiceAnswers]);

  const handleShowAnswer = useCallback(() => {
    if (!verse || practiceResult) return;
    setPlacements([...practiceAnswers]);
    setPracticeResult({ correct: practiceAnswers.length, total: practiceAnswers.length });
    setAnswerRevealed(true);
  }, [verse, practiceResult, practiceAnswers]);

  const handleRetry = useCallback(() => {
    if (!verse) return;
    const t = getVerseTranslation(verse, translationKey);
    setPlacements(new Array(blankIndices.length).fill(""));
    setSelectedTile(null);
    setPracticeResult(null);
    setAnswerRevealed(false);
    setTilePool(shuffle([...practiceAnswers, ...t.decoys.map(normalizeWord)]));
  }, [verse, translationKey, blankIndices.length, practiceAnswers]);

  const handleChooseVerse = useCallback((v: Verse) => {
    setVerse(v);
    setPracticeStarted(false);
    setPracticeResult(null);
    setPickerOpen(false);
  }, []);

  /* ---- loading ---- */
  if (loading) {
    return (
      <main className="shell" style={{ textAlign: "center", paddingTop: "4rem" }}>
        <p className="soft-label" role="status" aria-live="polite">Loading verses…</p>
      </main>
    );
  }

  if (!verse) {
    return (
      <main className="shell" style={{ textAlign: "center", paddingTop: "4rem" }}>
        <p role="alert">No verses available.</p>
        <Link href="/" className="btn btn-ghost" style={{ marginTop: "1rem" }}>Back to home</Link>
      </main>
    );
  }

  const levelMeta = getPracticeLevelMeta(selectedLevel);

  /* ---- group verses by theme for picker ---- */
  const versesByTheme: Record<string, Verse[]> = {};
  for (const v of verses) {
    const key = v.themeLabel || "Other";
    if (!versesByTheme[key]) versesByTheme[key] = [];
    versesByTheme[key].push(v);
  }

  return (
    <main className="shell" aria-label="Practice mode">
      <div style={{ marginBottom: "1.25rem" }}>
        <Link href="/" style={{ color: "var(--muted)", fontSize: "0.9rem" }}>&larr; Back to home</Link>
      </div>

      {/* ---- verse header ---- */}
      <div className="journey-stage">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: "0.5rem", marginBottom: "1rem" }}>
          <h2 style={{ margin: 0, fontFamily: "'Fraunces', Georgia, serif", fontSize: "1.25rem" }}>{verse.reference}</h2>
          <span className="topic-badge">{verse.themeLabel}</span>
        </div>

        {/* full verse text */}
        {!practiceStarted && (
          <p className="journey-devotional" style={{ fontFamily: "var(--scripture-font)", fontSize: "clamp(1.2rem, 2.4vw, 1.55rem)", lineHeight: 2, textAlign: "center", margin: "1rem 0" }}>
            &ldquo;{buildFullVerseText(verse, translationKey)}&rdquo;
            <span style={{ display: "block", fontWeight: 600, fontSize: "0.9rem", marginTop: "0.5rem", color: "var(--muted)" }}>
              ({translationKey.toUpperCase()})
            </span>
          </p>
        )}

        {/* ---- depth selector (before practice starts) ---- */}
        {!practiceStarted && (
          <div style={{ marginTop: "2rem", borderTop: "1px solid rgba(0,0,0,0.06)", paddingTop: "1.5rem" }}>
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
                Start practicing
              </button>
            </div>
          </div>
        )}

        {/* ---- tile mechanic (same as journey) ---- */}
        {practiceStarted && (() => {
          const t = getVerseTranslation(verse, translationKey);
          return (
            <>
              <div style={{ marginBottom: "1rem" }}>
                <span style={{ color: "var(--muted)", fontSize: "0.9rem" }}>{levelMeta.label} &middot; {verse.reference} ({translationKey.toUpperCase()})</span>
              </div>

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
                  <div className="tile-pool" role="group" aria-label="Word tiles">
                    {tilePool.map((tile, tileIndex) => {
                      const norm = normalizeWord(tile);
                      const usedCount = countWords(placements)[norm] ?? 0;
                      const instanceIndex = tilePool.slice(0, tileIndex + 1).filter((t) => normalizeWord(t) === norm).length - 1;
                      const isUsed = instanceIndex < usedCount;
                      return (
                        <button
                          key={`${tile}-${tileIndex}`}
                          className={classNames("tile", selectedTile === tileIndex && "selected", isUsed && "used")}
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
                        ? (isKids ? "You did it! Keep practicing and it will stick." : "Well placed.")
                        : "Almost there. A few words need another look."}
                  </p>
                  <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
                    <button className="btn btn-ghost" onClick={handleRetry}>
                      Try again
                    </button>
                    <button className="btn btn-ghost" onClick={() => { setPickerOpen(true); setPracticeStarted(false); setPracticeResult(null); }}>
                      Choose a different verse
                    </button>
                  </div>
                </div>
              )}
            </>
          );
        })()}
      </div>

      {/* ---- verse picker ---- */}
      {(pickerOpen || (!practiceStarted && !loading)) && (
        <div style={{ marginTop: "1.5rem" }}>
          <button
            className="btn btn-ghost"
            style={{ width: "100%", marginBottom: "1rem" }}
            onClick={() => setPickerOpen((o) => !o)}
          >
            {pickerOpen ? "Hide verse list" : "Choose a different verse"}
          </button>

          {pickerOpen && (
            <div className="journey-stage" style={{ maxHeight: "60vh", overflowY: "auto" }}>
              {Object.entries(versesByTheme).map(([theme, themeVerses]) => (
                <div key={theme} style={{ marginBottom: "1.25rem" }}>
                  <p className="soft-label" style={{ marginBottom: "0.5rem" }}>{theme}</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                    {themeVerses.map((v) => (
                      <button
                        key={v.id}
                        className={classNames("theme-card", v.id === verse.id && "selected")}
                        style={{ padding: "0.75rem 1rem" }}
                        onClick={() => handleChooseVerse(v)}
                      >
                        <strong style={{ fontSize: "0.95rem" }}>{v.reference}</strong>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </main>
  );
}
