"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { buildFullVerseText } from "@/lib/journey";
import { KIDS_VERSES } from "@/lib/kids-verses";
import { fetchVerses } from "@/lib/verses-fetch";
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

type Testament = "all" | "ot" | "nt";

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
  const [search, setSearch] = useState("");
  const [testament, setTestament] = useState<Testament>("all");

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
        const verses = await fetchVerses();
        setVerses(verses);
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
    for (const [, arr] of map) {
      arr.sort((a, b) => {
        const ac = chapterVerse(a.reference);
        const bc = chapterVerse(b.reference);
        return ac.chapter - bc.chapter || ac.verse - bc.verse;
      });
    }
    return map;
  }, [verses]);

  /* canonical OT / NT lists filtered to what exists */
  const otBooks = useMemo(
    () => (OT_BOOKS as readonly string[]).filter((b) => bookMap.has(b)),
    [bookMap],
  );
  const ntBooks = useMemo(
    () => (NT_BOOKS as readonly string[]).filter((b) => bookMap.has(b)),
    [bookMap],
  );

  /* apply search + testament filter */
  const { visibleOt, visibleNt } = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filter = (list: readonly string[]) =>
      list.filter((b) => !q || b.toLowerCase().includes(q));

    const filteredOt = testament === "nt" ? [] : filter(otBooks);
    const filteredNt = testament === "ot" ? [] : filter(ntBooks);
    return { visibleOt: filteredOt, visibleNt: filteredNt };
  }, [otBooks, ntBooks, search, testament]);

  const totalVisible = visibleOt.length + visibleNt.length;

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
            aria-label="Back to books"
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

      <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
        <h1 style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: "clamp(1.25rem, 2.5vw, 1.5rem)", marginBottom: "0.5rem" }}>
          Choose a book of the Bible
        </h1>
        <p style={{ color: "var(--muted)", lineHeight: 1.7, maxWidth: 440, margin: "0 auto" }}>
          Browse verses by where they appear in Scripture.
        </p>
      </div>

      <div className="browse-toolbar">
        <input
          className="browse-search"
          type="search"
          placeholder="Search books…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search books of the Bible"
        />
        <div className="filter-tabs" role="group" aria-label="Filter by testament">
          {(["all", "ot", "nt"] as Testament[]).map((t) => (
            <button
              key={t}
              type="button"
              className={`filter-tab${testament === t ? " active" : ""}`}
              onClick={() => setTestament(t)}
              aria-pressed={testament === t}
            >
              {t === "all" ? "All" : t === "ot" ? "Old" : "New"}
            </button>
          ))}
        </div>
      </div>

      {totalVisible === 0 ? (
        <p className="browse-empty">
          No books match &ldquo;{search}&rdquo;
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              style={{ marginLeft: "0.5rem", background: "none", border: "none", color: "var(--brand)", cursor: "pointer", textDecoration: "underline" }}
            >
              Clear
            </button>
          )}
        </p>
      ) : (
        <div className="book-columns">
          {visibleOt.length > 0 && (
            <div>
              <h2 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.75rem", color: "var(--muted)" }}>
                Old Testament
              </h2>
              <ul className="book-list">
                {visibleOt.map((book) => {
                  const bookVs = bookMap.get(book) ?? [];
                  const memorizedCount = bookVs.filter((v) => memorized.has(v.id)).length;
                  return (
                    <li key={book}>
                      <button
                        type="button"
                        className="book-list-item"
                        onClick={() => setSelectedBook(book)}
                      >
                        <span>{book}</span>
                        <span style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                          {memorizedCount > 0 && (
                            <span style={{ fontSize: "0.75rem", color: "var(--ok)", fontWeight: 700 }}>
                              {memorizedCount}/{bookVs.length} ✓
                            </span>
                          )}
                          <span className="muted" style={{ fontSize: "0.85rem" }}>
                            {bookVs.length}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {visibleNt.length > 0 && (
            <div>
              <h2 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.75rem", color: "var(--muted)" }}>
                New Testament
              </h2>
              <ul className="book-list">
                {visibleNt.map((book) => {
                  const bookVs = bookMap.get(book) ?? [];
                  const memorizedCount = bookVs.filter((v) => memorized.has(v.id)).length;
                  return (
                    <li key={book}>
                      <button
                        type="button"
                        className="book-list-item"
                        onClick={() => setSelectedBook(book)}
                      >
                        <span>{book}</span>
                        <span style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                          {memorizedCount > 0 && (
                            <span style={{ fontSize: "0.75rem", color: "var(--ok)", fontWeight: 700 }}>
                              {memorizedCount}/{bookVs.length} ✓
                            </span>
                          )}
                          <span className="muted" style={{ fontSize: "0.85rem" }}>
                            {bookVs.length}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
