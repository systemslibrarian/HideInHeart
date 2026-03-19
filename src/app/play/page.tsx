"use client";

import { useEffect, useMemo, useState } from "react";

import { scoreAttempt, sessionPercentage, shuffle } from "@/lib/game";
import type { Verse } from "@/types/domain";

type VerseState = {
  placements: string[];
  attemptIndex: number;
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

export default function PlayPage() {
  const [verses, setVerses] = useState<Verse[]>([]);
  const [current, setCurrent] = useState(0);
  const [states, setStates] = useState<Record<string, VerseState>>({});
  const [results, setResults] = useState<AttemptResult[]>([]);
  const [feedback, setFeedback] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function load() {
      const response = await fetch("/api/verses");
      const payload = (await response.json()) as { verses: Verse[] };
      if (!mounted) return;
      setVerses(payload.verses);
      setLoading(false);
    }

    void load();
    return () => {
      mounted = false;
    };
  }, []);

  const verse = verses[current];
  const state = verse
    ? states[verse.id] ?? { placements: Array(verse.answers.length).fill(""), attemptIndex: 1 }
    : undefined;

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

  function placeWord(word: string) {
    setFeedback("");
    setStates((prev) => {
      const next = { ...prev };
      const active = next[verse.id] ?? { placements: Array(verse.answers.length).fill(""), attemptIndex: 1 };
      const target = active.placements.findIndex((item) => item === "");
      if (target === -1) return prev;
      const placements = [...active.placements];
      placements[target] = word;
      next[verse.id] = { ...active, placements };
      return next;
    });
  }

  function clearSlot(index: number) {
    setStates((prev) => {
      const next = { ...prev };
      const active = next[verse.id] ?? { placements: Array(verse.answers.length).fill(""), attemptIndex: 1 };
      const placements = [...active.placements];
      placements[index] = "";
      next[verse.id] = { ...active, placements };
      return next;
    });
  }

  async function submitAttempt() {
    const correctCount = activeState.placements.reduce(
      (acc, value, idx) => acc + (value.toUpperCase() === verse.answers[idx] ? 1 : 0),
      0,
    );
    const points = scoreAttempt(correctCount, verse.answers.length, activeState.attemptIndex);

    await fetch("/api/attempt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: getUserId(),
        verseId: verse.id,
        correctCount,
        totalBlanks: verse.answers.length,
        attemptIndex: activeState.attemptIndex,
        elapsedMs: 0,
        points,
      }),
    });

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
      },
    }));
  }

  const used = new Set(activeState.placements.filter(Boolean));

  return (
    <main className="grid" style={{ gap: "1rem" }}>
      <section className="card">
        <div className="muted">
          Verse {current + 1} / {verses.length}
        </div>
        <h2 style={{ marginTop: "0.2rem" }}>{verse.reference}</h2>
        <p>
          {verse.parts.map((chunk, idx) => (
            <span key={`${verse.id}-${idx}`}>
              {chunk}
              {idx < verse.answers.length ? (
                <button className="blank" onClick={() => clearSlot(idx)} type="button">
                      {activeState.placements[idx] || "_____"}
                </button>
              ) : null}
            </span>
          ))}
        </p>
      </section>

      <section className="card">
        <h3 style={{ marginTop: 0 }}>Word tiles</h3>
        <div className="row">
          {tiles.map((tile, index) => (
            <button
              className="tile"
              disabled={used.has(tile)}
              key={`${tile}-${index}`}
              onClick={() => placeWord(tile)}
              type="button"
            >
              {tile}
            </button>
          ))}
        </div>
      </section>

      <section className="card row">
        <button className="btn primary" onClick={submitAttempt} type="button">
          Check answers
        </button>
        <button
          className="btn secondary"
          onClick={() =>
            setStates((prev) => ({
              ...prev,
              [verse.id]: {
                placements: Array(verse.answers.length).fill(""),
                attemptIndex: activeState.attemptIndex,
              },
            }))
          }
          type="button"
        >
          Clear
        </button>
        {feedback ? <div className={feedback.startsWith("Correct") ? "good" : "bad"}>{feedback}</div> : null}
      </section>
    </main>
  );
}
