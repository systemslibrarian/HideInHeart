"use client";

import Link from "next/link";
import { useState } from "react";

import { LOCAL_VERSES } from "@/lib/verses-local";
import type { Verse } from "@/types/domain";

const BIBLE_BOOK_ORDER: string[] = [
  "Genesis","Exodus","Leviticus","Numbers","Deuteronomy","Joshua","Judges","Ruth",
  "1 Samuel","2 Samuel","1 Kings","2 Kings","1 Chronicles","2 Chronicles",
  "Ezra","Nehemiah","Esther","Job","Psalm","Proverbs","Ecclesiastes",
  "Song of Songs","Isaiah","Jeremiah","Lamentations","Ezekiel","Daniel",
  "Hosea","Joel","Amos","Obadiah","Jonah","Micah","Nahum","Habakkuk",
  "Zephaniah","Haggai","Zechariah","Malachi",
  "Matthew","Mark","Luke","John","Acts","Romans",
  "1 Corinthians","2 Corinthians","Galatians","Ephesians","Philippians",
  "Colossians","1 Thessalonians","2 Thessalonians","1 Timothy","2 Timothy",
  "Titus","Philemon","Hebrews","James","1 Peter","2 Peter",
  "1 John","2 John","3 John","Jude","Revelation",
];

function parseBibleRef(ref: string): { bookIndex: number; chapter: number; verse: number } {
  const m = ref.match(/^(.+?)\s+(\d+):(\d+)/);
  if (!m) return { bookIndex: 999, chapter: 0, verse: 0 };
  const bookIndex = BIBLE_BOOK_ORDER.indexOf(m[1]);
  return { bookIndex: bookIndex === -1 ? 999 : bookIndex, chapter: Number(m[2]), verse: Number(m[3]) };
}

function sortByBibleOrder(verses: Verse[]): Verse[] {
  return [...verses].sort((a, b) => {
    const pa = parseBibleRef(a.reference);
    const pb = parseBibleRef(b.reference);
    if (pa.bookIndex !== pb.bookIndex) return pa.bookIndex - pb.bookIndex;
    if (pa.chapter !== pb.chapter) return pa.chapter - pb.chapter;
    return pa.verse - pb.verse;
  });
}

const STORAGE_KEY = "sg_memorized_verses";

function loadMemorized(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

function saveMemorized(set: Set<string>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]));
  } catch { /* storage full */ }
}

export default function VersesPage() {
  const [memorized, setMemorized] = useState<Set<string>>(loadMemorized);
  const [mounted] = useState(() => typeof window !== "undefined");

  function toggle(id: string) {
    setMemorized((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      saveMemorized(next);
      return next;
    });
  }

  const memorizedCount = mounted ? memorized.size : 0;

  return (
    <main className="grid" style={{ gap: "1rem" }}>
      <section className="card">
        <h1 style={{ marginTop: 0 }}>Browse Verses</h1>
        <p className="muted" style={{ marginBottom: 0 }}>
          Review the verse catalog on its own page so the play screen stays focused on memorization.
          {mounted && memorizedCount > 0 && (
            <> &nbsp;<span style={{ color: "var(--brand)", fontWeight: 600 }}>✓ {memorizedCount} memorized</span></>
          )}
        </p>
      </section>

      <section aria-label="Verse catalog" className="grid two">
        {sortByBibleOrder(LOCAL_VERSES).map((verse) => {
          const isMemorized = mounted && memorized.has(verse.id);
          return (
            <article
              className="card"
              key={verse.id}
              style={{
                padding: "1.25rem 1.5rem",
                outline: isMemorized ? "2px solid rgba(49,95,114,0.4)" : undefined,
                position: "relative",
              }}
            >
              {isMemorized && (
                <span
                  aria-label="Memorized"
                  style={{
                    position: "absolute",
                    top: "0.75rem",
                    right: "0.75rem",
                    background: "rgba(49,95,114,0.12)",
                    color: "var(--brand)",
                    borderRadius: "999px",
                    padding: "0.15rem 0.6rem",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    letterSpacing: "0.02em",
                  }}
                >
                  ✓ Memorized
                </span>
              )}
              <h2 style={{ marginBottom: "0.5rem", marginTop: "0.25rem", paddingRight: isMemorized ? "7rem" : 0 }}>
                {verse.reference}{" "}
                <span className="muted" style={{ fontSize: "0.85rem", fontWeight: 400 }}>
                  ({verse.translation})
                </span>
              </h2>
              <p className="muted" style={{ marginTop: 0 }}>
                Theme: {verse.themeId} | Blanks: {verse.answers.length}
              </p>
              <p className="verse-preview">{verse.parts.join("_____")}</p>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "0.25rem" }}>
                <Link className="btn secondary" href="/play">
                  Practice this set
                </Link>
                <button
                  onClick={() => toggle(verse.id)}
                  style={{
                    background: isMemorized ? "rgba(49,95,114,0.1)" : "transparent",
                    border: `1px solid ${isMemorized ? "rgba(49,95,114,0.5)" : "rgba(0,0,0,0.2)"}`,
                    borderRadius: "6px",
                    padding: "0.45rem 0.85rem",
                    fontSize: "0.85rem",
                    cursor: "pointer",
                    color: isMemorized ? "var(--brand)" : "var(--muted)",
                    fontWeight: isMemorized ? 600 : 400,
                    transition: "all 0.15s",
                  }}
                >
                  {isMemorized ? "✓ Memorized" : "Mark memorized"}
                </button>
              </div>
            </article>
          );
        })}
      </section>
    </main>
  );
}