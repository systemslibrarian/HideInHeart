"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

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

const BIBLE_BOOK_ORDER = [
  "Genesis", "Exodus", "Leviticus", "Numbers", "Deuteronomy",
  "Joshua", "Judges", "Ruth", "1 Samuel", "2 Samuel", "1 Kings", "2 Kings",
  "1 Chronicles", "2 Chronicles", "Ezra", "Nehemiah", "Esther", "Job", "Psalm",
  "Psalms", "Proverbs", "Ecclesiastes", "Song of Songs", "Isaiah", "Jeremiah",
  "Lamentations", "Ezekiel", "Daniel", "Hosea", "Joel", "Amos", "Obadiah", "Jonah",
  "Micah", "Nahum", "Habakkuk", "Zephaniah", "Haggai", "Zechariah", "Malachi",
  "Matthew", "Mark", "Luke", "John", "Acts", "Romans", "1 Corinthians",
  "2 Corinthians", "Galatians", "Ephesians", "Philippians", "Colossians",
  "1 Thessalonians", "2 Thessalonians", "1 Timothy", "2 Timothy", "Titus", "Philemon",
  "Hebrews", "James", "1 Peter", "2 Peter", "1 John", "2 John", "3 John", "Jude",
  "Revelation",
] as const;

const BIBLE_BOOK_INDEX = new Map<string, number>(BIBLE_BOOK_ORDER.map((book, index) => [book, index]));

function bookFromReference(reference: string): string {
  const maybeBook = reference.replace(/\s+\d+:\d+.*$/, "").trim();
  return maybeBook || reference;
}

function chapterVerseFromReference(reference: string): { chapter: number; verse: number } {
  const match = reference.match(/(\d+):(\d+)/);
  if (!match) return { chapter: Number.MAX_SAFE_INTEGER, verse: Number.MAX_SAFE_INTEGER };
  return { chapter: Number(match[1]), verse: Number(match[2]) };
}

function compareReferences(a: string, b: string): number {
  const aBook = bookFromReference(a);
  const bBook = bookFromReference(b);

  const aBookIndex = BIBLE_BOOK_INDEX.get(aBook) ?? Number.MAX_SAFE_INTEGER;
  const bBookIndex = BIBLE_BOOK_INDEX.get(bBook) ?? Number.MAX_SAFE_INTEGER;
  if (aBookIndex !== bBookIndex) return aBookIndex - bBookIndex;

  if (aBook !== bBook) return aBook.localeCompare(bBook);

  const aCv = chapterVerseFromReference(a);
  const bCv = chapterVerseFromReference(b);
  if (aCv.chapter !== bCv.chapter) return aCv.chapter - bCv.chapter;
  if (aCv.verse !== bCv.verse) return aCv.verse - bCv.verse;

  return a.localeCompare(b);
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

  /* ---- drag-and-drop ---- */
  const dragIndexRef = useRef<number | null>(null);
  const [dragOverSlot, setDragOverSlot] = useState<number | null>(null);

  const handleDragStart = useCallback((tileIndex: number) => {
    dragIndexRef.current = tileIndex;
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, slotIndex: number) => {
    e.preventDefault();
    setDragOverSlot(slotIndex);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOverSlot(null);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, slotIndex: number) => {
      e.preventDefault();
      setDragOverSlot(null);
      const tileIndex = dragIndexRef.current;
      if (tileIndex === null || practiceResult) return;
      const word = tilePool[tileIndex];
      if (!canPlaceWord(word, placements, tilePool, slotIndex)) return;
      setPlacements((prev) => {
        const next = [...prev];
        next[slotIndex] = word;
        return next;
      });
      setSelectedTile(null);
      dragIndexRef.current = null;
    },
    [practiceResult, tilePool, placements],
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
  }, []);

  /* ---- loading ---- */
  if (loading) {
    return (
      <main className="shell" style={{ textAlign: "center", paddingTop: "4rem" }}>
        <p className="soft-label" role="status" aria-live="polite">Loading verses…</p>
      </main>
    );
  }

  if (verses.length === 0) {
    return (
      <main className="shell" style={{ textAlign: "center", paddingTop: "4rem" }}>
        <p role="alert">No verses available.</p>
        <Link href="/" className="btn btn-ghost" style={{ marginTop: "1rem" }}>Back to home</Link>
      </main>
    );
  }

  const levelMeta = verse ? getPracticeLevelMeta(selectedLevel) : null;

  const versesByBook: Record<string, Verse[]> = {};
  for (const v of verses) {
    const book = bookFromReference(v.reference);
    if (!versesByBook[book]) versesByBook[book] = [];
    versesByBook[book].push(v);
  }

  const sortedBooks = Object.entries(versesByBook)
    .map(([book, bookVerses]) => [book, [...bookVerses].sort((a, b) => compareReferences(a.reference, b.reference))] as const)
    .sort((a, b) => compareReferences(`${a[0]} 1:1`, `${b[0]} 1:1`));

  return (
    <main className="shell" aria-label="Practice">
      <div style={{ marginBottom: "1.25rem" }}>
        <Link href="/" style={{ color: "var(--muted)", fontSize: "0.9rem" }}>&larr; Back to home</Link>
      </div>

      {!practiceStarted && !verse && (
        <div className="journey-stage" style={{ maxHeight: "60vh", overflowY: "auto", marginBottom: "1.5rem" }}>
          <p className="soft-label" style={{ marginBottom: "1rem" }}>Choose a verse by Bible book</p>
          {sortedBooks.map(([book, bookVerses]) => (
            <div key={book} style={{ marginBottom: "1.25rem" }}>
              <p className="soft-label" style={{ marginBottom: "0.5rem" }}>
                {book} ({bookVerses.length})
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                {bookVerses.map((v) => (
                  <button
                    key={v.id}
                    className="theme-card"
                    style={{ padding: "0.75rem 1rem", display: "flex", justifyContent: "space-between", gap: "0.75rem", alignItems: "center" }}
                    onClick={() => handleChooseVerse(v)}
                  >
                    <strong style={{ fontSize: "0.95rem", textAlign: "left" }}>{v.reference}</strong>
                    <span className="soft-label" style={{ fontSize: "0.75rem" }}>{v.themeLabel}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ---- verse header ---- */}
      {verse && (
      <div className="journey-stage">
        {!practiceStarted && (
          <div style={{ marginBottom: "1rem" }}>
            <button
              type="button"
              onClick={() => { setVerse(null); setPracticeResult(null); }}
              style={{ background: "none", border: "none", color: "var(--muted)", fontSize: "0.9rem", cursor: "pointer", padding: 0 }}
            >
              &larr; Choose a different verse
            </button>
          </div>
        )}
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
          <div style={{ marginTop: "2rem", borderTop: "1px solid var(--border)", paddingTop: "1.5rem" }}>
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
                <span style={{ color: "var(--muted)", fontSize: "0.9rem" }}>{levelMeta?.label} &middot; {verse.reference} ({translationKey.toUpperCase()})</span>
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
                              !placements[slotIndex] && dragOverSlot === slotIndex && "drag-over",
                              practiceResult &&
                                (normalizeWord(placements[slotIndex]) === practiceAnswers[slotIndex]
                                  ? "correct"
                                  : "wrong"),
                            )}
                            onClick={() => handleBlankClick(slotIndex)}
                            onDragOver={(e) => !placements[slotIndex] && handleDragOver(e, slotIndex)}
                            onDragLeave={handleDragLeave}
                            onDrop={(e) => !placements[slotIndex] && handleDrop(e, slotIndex)}
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
                    Tap or drag a word into a blank &middot; tap a filled blank to remove it
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
                          draggable={!isUsed && !practiceResult}
                          onDragStart={() => handleDragStart(tileIndex)}
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
                  {placements.some(Boolean) && (
                    <button className="btn btn-ghost" onClick={() => { setPlacements(new Array(blankIndices.length).fill("")); setSelectedTile(null); }}>
                      Reset
                    </button>
                  )}
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
                    <button className="btn btn-ghost" onClick={() => { setPracticeStarted(false); setPracticeResult(null); }}>
                      Choose a different verse
                    </button>
                  </div>
                </div>
              )}
            </>
          );
        })()}
      </div>
      )}

    </main>
  );
}
