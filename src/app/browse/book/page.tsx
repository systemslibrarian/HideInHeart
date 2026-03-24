"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { buildFullVerseText } from "@/lib/journey";
import { KIDS_VERSES } from "@/lib/kids-verses";
import { useAudience } from "@/lib/audience-context";
import { useTranslation } from "@/lib/translation-context";
import type { TranslationKey, Verse } from "@/types/domain";

/* ------------------------------------------------------------------ */
/*  Canonical Bible book order                                        */
/* ------------------------------------------------------------------ */

const OT_BOOKS = [
  "Genesis", "Exodus", "Leviticus", "Numbers", "Deuteronomy",
  "Joshua", "Judges", "Ruth", "1 Samuel", "2 Samuel", "1 Kings", "2 Kings",
  "1 Chronicles", "2 Chronicles", "Ezra", "Nehemiah", "Esther", "Job",
  "Psalm", "Psalms", "Proverbs", "Ecclesiastes", "Song of Songs",
  "Isaiah", "Jeremiah", "Lamentations", "Ezekiel", "Daniel",
  "Hosea", "Joel", "Amos", "Obadiah", "Jonah", "Micah", "Nahum",
  "Habakkuk", "Zephaniah", "Haggai", "Zechariah", "Malachi",
] as const;

const NT_BOOKS = [
  "Matthew", "Mark", "Luke", "John", "Acts",
  "Romans", "1 Corinthians", "2 Corinthians", "Galatians", "Ephesians",
  "Philippians", "Colossians", "1 Thessalonians", "2 Thessalonians",
  "1 Timothy", "2 Timothy", "Titus", "Philemon",
  "Hebrews", "James", "1 Peter", "2 Peter", "1 John", "2 John", "3 John",
  "Jude", "Revelation",
] as const;

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function bookFromReference(ref: string): string {
  return ref.replace(/\s+\d+:\d+.*$/, "").trim();
}

function chapterVerse(ref: string): { chapter: number; verse: number } {
  const m = ref.match(/(\d+):(\d+)/);
  if (!m) return { chapter: 0, verse: 0 };
  return { chapter: Number(m[1]), verse: Number(m[2]) };
}

function versePreview(verse: Verse, translationKey: TranslationKey): string {
  const full = buildFullVerseText(verse, translationKey);
  const words = full.split(/\s+/);
  return words.length > 10 ? words.slice(0, 10).join(" ") + " …" : full;
}

function loadMemorized(): Set<string> {
  try {
    const raw = localStorage.getItem("sg_memorized_verses");
    if (raw) return new Set(JSON.parse(raw) as string[]);
  } catch { /* ignore */ }
  return new Set();
}

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

export default function BrowseByBookPage() {
  const { translationKey } = useTranslation();
  const { audienceMode } = useAudience();
  const isKids = audienceMode === "kids";

  const [verses, setVerses] = useState<Verse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBook, setSelectedBook] = useState<string | null>(null);
  const [memorized, setMemorized] = useState<Set<string>>(new Set());

  /* load memorized set */
  useEffect(() => { setMemorized(loadMemorized()); }, []);

  /* fetch */
  useEffect(() => {
    if (isKids) {
      setVerses(KIDS_VERSES);
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const res = await fetch("/api/verses");
        if (!res.ok) throw new Error("fetch failed");
        const data = await res.json();
        setVerses(Array.isArray(data) ? data : data.verses ?? []);
      } catch {
        setVerses([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [isKids]);

  /* group by book */
  const bookMap = useMemo(() => {
    const map = new Map<string, Verse[]>();
    for (const v of verses) {
      const book = bookFromReference(v.reference);
      if (!map.has(book)) map.set(book, []);
      map.get(book)!.push(v);
    }
    /* sort verses within each book by chapter:verse */
    for (const [, arr] of map) {
      arr.sort((a, b) => {
        const ac = chapterVerse(a.reference);
        const bc = chapterVerse(b.reference);
        return ac.chapter - bc.chapter || ac.verse - bc.verse;
      });
    }
    return map;
  }, [verses]);

  /* split into OT / NT keeping canonical order */
  const otBooks = useMemo(
    () => (OT_BOOKS as readonly string[]).filter((b) => bookMap.has(b)),
    [bookMap],
  );
  const ntBooks = useMemo(
    () => (NT_BOOKS as readonly string[]).filter((b) => bookMap.has(b)),
    [bookMap],
  );

  /* verses for selected book */
  const bookVerses = useMemo(() => {
    if (!selectedBook) return [];
    return bookMap.get(selectedBook) ?? [];
  }, [bookMap, selectedBook]);

  if (loading) {
    return (
      <main className="shell" style={{ textAlign: "center", paddingTop: "4rem" }}>
        <p className="soft-label" role="status">Loading…</p>
      </main>
    );
  }

  /* ------- verse list for selected book ------- */
  if (selectedBook && bookVerses.length > 0) {
    return (
      <main className="shell">
        <div style={{ marginBottom: "1.25rem" }}>
          <button
            type="button"
            onClick={() => setSelectedBook(null)}
            style={{ background: "none", border: "none", color: "var(--muted)", fontSize: "0.9rem", cursor: "pointer", padding: 0 }}
          >
            &larr; Back to books
          </button>
        </div>

        <h1 style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: "clamp(1.25rem, 2.5vw, 1.5rem)", marginBottom: "1.5rem" }}>
          {selectedBook}
        </h1>

        <div className="verse-list" role="list">
          {bookVerses.map((v) => (
            <Link
              key={v.id}
              href={`/play?verse=${v.id}&theme=${v.themeId}`}
              className="verse-list-item"
              role="listitem"
            >
              <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <strong>{v.reference}</strong>
                {memorized.has(v.id) && <span className="memorized-badge">✓ memorized</span>}
              </span>
              <span className="muted" style={{ fontSize: "0.9rem" }}>{versePreview(v, translationKey)}</span>
            </Link>
          ))}
        </div>
      </main>
    );
  }

  /* ------- book grid ------- */
  return (
    <main className="shell">
      <div style={{ marginBottom: "1.25rem" }}>
        <Link href="/" style={{ color: "var(--muted)", fontSize: "0.9rem" }}>&larr; Back to home</Link>
      </div>

      <div style={{ textAlign: "center", marginBottom: "2rem" }}>
        <h1 style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: "clamp(1.25rem, 2.5vw, 1.5rem)", marginBottom: "0.5rem" }}>
          Choose a book of the Bible
        </h1>
        <p style={{ color: "var(--muted)", lineHeight: 1.7, maxWidth: 440, margin: "0 auto" }}>
          Browse verses by where they appear in Scripture.
        </p>
      </div>

      <div className="book-columns">
        {otBooks.length > 0 && (
          <div>
            <h2 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.75rem", color: "var(--muted)" }}>
              Old Testament
            </h2>
            <ul className="book-list">
              {otBooks.map((book) => (
                <li key={book}>
                  <button
                    type="button"
                    className="book-list-item"
                    onClick={() => setSelectedBook(book)}
                  >
                    <span>{book}</span>
                    <span className="muted" style={{ fontSize: "0.85rem" }}>
                      {bookMap.get(book)?.length ?? 0}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {ntBooks.length > 0 && (
          <div>
            <h2 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.75rem", color: "var(--muted)" }}>
              New Testament
            </h2>
            <ul className="book-list">
              {ntBooks.map((book) => (
                <li key={book}>
                  <button
                    type="button"
                    className="book-list-item"
                    onClick={() => setSelectedBook(book)}
                  >
                    <span>{book}</span>
                    <span className="muted" style={{ fontSize: "0.85rem" }}>
                      {bookMap.get(book)?.length ?? 0}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </main>
  );
}
