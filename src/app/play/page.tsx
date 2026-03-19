"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { canPlaceWord, getRemainingTileCount, normalizeWord, scoreAttempt, sessionPercentage, shuffle } from "@/lib/game";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Verse } from "@/types/domain";

type VerseState = {
  placements: string[];
  attemptIndex: number;
  answerRevealed: boolean;
};

type AttemptResult = {
  verseId: string;
  points: number;
  correctCount: number;
};

function getUserId(): string {
  const key = "sg_user_id";
  const existing = window.localStorage.getItem(key);
  if (existing) return existing;

  const generated = crypto.randomUUID();
  window.localStorage.setItem(key, generated);
  return generated;
}

function createVerseState(verse: Verse): VerseState {
  return {
    placements: Array(verse.answers.length).fill(""),
    attemptIndex: 1,
    answerRevealed: false,
  };
}

export default function PlayPage() {
  const [verses, setVerses] = useState<Verse[]>([]);
  const [current, setCurrent] = useState(0);
  const [states, setStates] = useState<Record<string, VerseState>>({});
  const [results, setResults] = useState<AttemptResult[]>([]);
  const [feedback, setFeedback] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [actionPending, setActionPending] = useState(false);
  const [dropTarget, setDropTarget] = useState<number | null>(null);
  const [isDraggingTile, setIsDraggingTile] = useState(false);
  const startedAtRef = useRef<number>(0);

  useEffect(() => {
    let mounted = true;

    async function load() {
      const response = await fetch("/api/verses");
      const payload = (await response.json()) as { verses: Verse[] };
      if (!mounted) return;
      const normalizedVerses = payload.verses.map((item) => ({
        ...item,
        answers: item.answers.map((answer) => normalizeWord(answer)),
        decoys: item.decoys.map((decoy) => normalizeWord(decoy)),
      }));
      setVerses(normalizedVerses);
      setLoading(false);
    }

    void load();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    startedAtRef.current = performance.now();
  }, [current]);

  const verse = verses[current];
  const state = verse ? states[verse.id] ?? createVerseState(verse) : undefined;

  const tiles = useMemo(() => {
    if (!verse) return [];
    return shuffle([...verse.answers, ...verse.decoys]);
  }, [verse]);

  if (loading) {
    return <main className="card">Loading verses...</main>;
  }

  if (!verse || !state) {
    const totalScore = results.reduce((sum, item) => sum + item.points, 0);
    const maxScore = verses.length * 10;

    return (
      <main className="grid" style={{ gap: "1rem" }}>
        <section className="card">
          <h2 style={{ marginTop: 0 }}>Session complete</h2>
          <p>
            Score: <strong>{totalScore}</strong> / {maxScore} ({sessionPercentage(totalScore, maxScore)}%)
          </p>
        </section>
        <section className="card">
          <h3 style={{ marginTop: 0 }}>By verse</h3>
          <ul>
            {results.map((row) => (
              <li key={row.verseId}>
                {row.verseId}: {row.points} pts
              </li>
            ))}
          </ul>
        </section>
      </main>
    );
  }

  const activeState = state;

  function updatePlacements(targetIndex: number, word: string) {
    setFeedback("");
    setStates((prev) => {
      const next = { ...prev };
      const active = next[verse.id] ?? createVerseState(verse);
      if (actionPending || active.answerRevealed || !canPlaceWord(word, active.placements, tiles, targetIndex)) {
        return prev;
      }
      const placements = [...active.placements];
      placements[targetIndex] = normalizeWord(word);
      next[verse.id] = { ...active, placements };
      return next;
    });
  }

  function placeWord(word: string) {
    const target = activeState.placements.findIndex((item) => item === "");
    if (target === -1) return;
    updatePlacements(target, word);
  }

  function clearSlot(index: number) {
    setFeedback("");
    setStates((prev) => {
      const next = { ...prev };
      const active = next[verse.id] ?? createVerseState(verse);
      if (actionPending || active.answerRevealed) return prev;
      const placements = [...active.placements];
      placements[index] = "";
      next[verse.id] = { ...active, placements };
      return next;
    });
  }

  function clearPlacements() {
    setDropTarget(null);
    setIsDraggingTile(false);
    setFeedback("");
    setStates((prev) => ({
      ...prev,
      [verse.id]: {
        ...(prev[verse.id] ?? createVerseState(verse)),
        placements: Array(verse.answers.length).fill(""),
        answerRevealed: false,
      },
    }));
  }

  async function postAttempt(correctCount: number, points: number, attemptIndex: number, elapsedMs: number) {
    let authHeader: string | undefined;
    let userId = getUserId();

    try {
      const supabase = getSupabaseBrowserClient();
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (token) {
        authHeader = `Bearer ${token}`;
        userId = data.session?.user.id ?? userId;
      }
    } catch {
      // Local/dev mode can run without Supabase auth.
    }

    await fetch("/api/attempt", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
      body: JSON.stringify({
        userId,
        verseId: verse.id,
        correctCount,
        totalBlanks: verse.answers.length,
        attemptIndex,
        elapsedMs,
        points,
      }),
    });
  }

  async function submitAttempt(eventTimestamp: number) {
    if (actionPending || activeState.answerRevealed) {
      return;
    }

    setActionPending(true);

    try {
      const correctCount = activeState.placements.reduce(
        (acc, value, idx) => acc + (normalizeWord(value) === normalizeWord(verse.answers[idx]) ? 1 : 0),
        0,
      );
      const points = scoreAttempt(correctCount, verse.answers.length, activeState.attemptIndex);

      const elapsedMs = Math.max(0, Math.round(eventTimestamp - startedAtRef.current));
      await postAttempt(correctCount, points, activeState.attemptIndex, elapsedMs);

      if (correctCount === verse.answers.length) {
        setFeedback(`Correct. +${points} points`);
        setResults((prev) => [...prev, { verseId: verse.id, points, correctCount }]);
        setCurrent((x) => x + 1);
        return;
      }

      setFeedback(`You got ${correctCount}/${verse.answers.length}. Try again.`);
      setStates((prev) => ({
        ...prev,
        [verse.id]: {
          placements: activeState.placements,
          attemptIndex: activeState.attemptIndex + 1,
          answerRevealed: false,
        },
      }));
    } finally {
      setActionPending(false);
    }
  }

  async function revealAnswer() {
    if (actionPending || activeState.answerRevealed) {
      return;
    }

    setActionPending(true);

    try {
      const elapsedMs = Math.max(0, Math.round(performance.now() - startedAtRef.current));
      await postAttempt(0, 0, activeState.attemptIndex, elapsedMs);
      setDropTarget(null);
      setIsDraggingTile(false);
      setStates((prev) => ({
        ...prev,
        [verse.id]: {
          placements: [...verse.answers],
          attemptIndex: activeState.attemptIndex,
          answerRevealed: true,
        },
      }));
      setResults((prev) => [...prev, { verseId: verse.id, points: 0, correctCount: 0 }]);
      setFeedback("Answer shown. No points awarded for this verse.");
    } finally {
      setActionPending(false);
    }
  }

  function moveToNextVerse() {
    setFeedback("");
    setDropTarget(null);
    setIsDraggingTile(false);
    setCurrent((value) => value + 1);
  }

  function skipVerse() {
    setFeedback("");
    setDropTarget(null);
    setIsDraggingTile(false);
    // Record a zero-point result so the session total stays accurate
    setResults((prev) => [...prev, { verseId: verse.id, points: 0, correctCount: 0 }]);
    setCurrent((value) => value + 1);
  }

  return (
    <main className="grid" style={{ gap: "1rem" }}>
      <section className="card">
        <div className="muted">
          Verse {current + 1} / {verses.length}
        </div>
        <h2 style={{ marginTop: "0.2rem" }}>{verse.reference}</h2>
        <div className="drop-help" role="note">
          Drag each word tile into the dashed blanks in the verse below. Tap a blank to clear it.
        </div>
        <p className={`verse-text ${isDraggingTile ? "drop-zone-active" : ""}`}>
          {verse.parts.map((chunk, idx) => (
            <span key={`${verse.id}-${idx}`}>
              {chunk}
              {idx < verse.answers.length ? (
                <button
                  className={`blank ${activeState.placements[idx] ? "filled" : "empty"} ${dropTarget === idx ? "drag-over" : ""}`}
                  onClick={() => clearSlot(idx)}
                  onDragOver={(event) => {
                    if (activeState.answerRevealed) return;
                    event.preventDefault();
                    setDropTarget(idx);
                  }}
                  onDragLeave={() => setDropTarget((currentTarget) => (currentTarget === idx ? null : currentTarget))}
                  onDrop={(event) => {
                    event.preventDefault();
                    const word = event.dataTransfer.getData("text/plain");
                    setDropTarget(null);
                    setIsDraggingTile(false);
                    if (!word) return;
                    updatePlacements(idx, word);
                  }}
                  type="button"
                >
                  {activeState.placements[idx] || (
                    <span className="blank-placeholder">Drop word here</span>
                  )}
                </button>
              ) : null}
            </span>
          ))}
        </p>
      </section>

      <section className="card">
        <h3 style={{ marginTop: 0 }}>Word tiles</h3>
        <div className="row tile-row">
          {tiles.map((tile, index) => (
            <button
              className="tile"
              disabled={
                actionPending || activeState.answerRevealed || getRemainingTileCount(tile, tiles, activeState.placements) === 0
              }
              draggable={
                !actionPending && !activeState.answerRevealed && getRemainingTileCount(tile, tiles, activeState.placements) > 0
              }
              key={`${tile}-${index}`}
              onClick={() => placeWord(tile)}
              onDragStart={(event) => {
                event.dataTransfer.setData("text/plain", tile);
                event.dataTransfer.effectAllowed = "move";
                setIsDraggingTile(true);
              }}
              onDragEnd={() => {
                setDropTarget(null);
                setIsDraggingTile(false);
              }}
              type="button"
            >
              {tile}
            </button>
          ))}
        </div>
      </section>

      <section className="card row action-row" aria-live="polite">
        <button
          className="btn primary"
          disabled={actionPending || activeState.answerRevealed}
          onClick={(e) => submitAttempt(e.timeStamp)}
          type="button"
        >
          Check answers
        </button>
        <button className="btn secondary" disabled={actionPending || activeState.answerRevealed} onClick={clearPlacements} type="button">
          Clear
        </button>
        <button className="btn secondary" disabled={actionPending || activeState.answerRevealed} onClick={() => void revealAnswer()} type="button">
          Show answer
        </button>
        <button className="btn secondary" disabled={actionPending || activeState.answerRevealed} onClick={skipVerse} type="button">
          Skip verse
        </button>
        {activeState.answerRevealed ? (
          <button className="btn secondary" disabled={actionPending} onClick={moveToNextVerse} type="button">
            Next verse
          </button>
        ) : null}
        {feedback ? (
          <div className={feedback.startsWith("Correct") ? "good" : "bad"} role="status">
            {feedback}
          </div>
        ) : null}
      </section>
    </main>
  );
}
