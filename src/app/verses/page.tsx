"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { buildFullVerseText } from "@/lib/journey";
import { useAudience } from "@/lib/audience-context";
import { KIDS_VERSES } from "@/lib/kids-verses";
import { useTranslation } from "@/lib/translation-context";
import { fetchVerses } from "@/lib/verses-fetch";
import type { TranslationKey, Verse } from "@/types/domain";

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

function verseTextForSearch(verse: Verse, translationKey: TranslationKey): string {
  return buildFullVerseText(verse, translationKey).toLowerCase();
}

type MemorizedFilter = "all" | "memorized" | "not-memorized";

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
  const { audienceMode } = useAudience();
  const { translationKey } = useTranslation();
  const isKids = audienceMode === "kids";

  const [verses, setVerses] = useState<Verse[]>([]);
  const [loading, setLoading] = useState(true);
  const [memorized, setMemorized] = useState<Set<string>>(new Set());
  const [mounted, setMounted] = useState(false);
  const [search, setSearch] = useState("");
  const [memorizedFilter, setMemorizedFilter] = useState<MemorizedFilter>("all");

  /* Load memorized set from localStorage after hydration to avoid SSR mismatch */
  useEffect(() => {
    setMounted(true);
    setMemorized(loadMemorized());
  }, []);

  useEffect(() => {
    if (isKids) {
      setVerses(KIDS_VERSES);
      setLoading(false);
      return;
    }

    (async () => {
      try {
        setVerses(await fetchVerses());
      } catch {
        setVerses([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [isKids]);

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
  const normalizedSearch = search.trim().toLowerCase();

  const filteredVerses = useMemo(() => {
    const ordered = sortByBibleOrder(verses);
    return ordered.filter((verse) => {
      const isMemorized = memorized.has(verse.id);
      const matchesMemorizedFilter =
        memorizedFilter === "all" ||
        (memorizedFilter === "memorized" && isMemorized) ||
        (memorizedFilter === "not-memorized" && !isMemorized);

      if (!matchesMemorizedFilter) return false;
      if (!normalizedSearch) return true;

      const reference = verse.reference.toLowerCase();
      const theme = `${verse.themeLabel} ${verse.themeId}`.toLowerCase();
      const verseText = verseTextForSearch(verse, translationKey);

      return (
        reference.includes(normalizedSearch) ||
        theme.includes(normalizedSearch) ||
        verseText.includes(normalizedSearch)
      );
    });
  }, [verses, normalizedSearch, translationKey, memorizedFilter, memorized]);

  if (loading) {
    return (
      <main className="grid" style={{ gap: "1rem" }}>
        <section className="card" style={{ textAlign: "center" }}>
          <p className="muted" role="status" aria-live="polite" style={{ margin: 0 }}>
            Loading verse catalog...
          </p>
        </section>
      </main>
    );
  }

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

      <section className="card" style={{ display: "grid", gap: "0.75rem" }}>
        <label htmlFor="verse-search" style={{ fontWeight: 600 }}>
          Search verses
        </label>
        <input
          id="verse-search"
          className="browse-search"
          type="search"
          placeholder="Search by reference, theme, or verse text..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-describedby="verse-search-results"
        />
        <p id="verse-search-results" className="muted" style={{ margin: 0 }}>
          {filteredVerses.length} {filteredVerses.length === 1 ? "verse" : "verses"}
          {normalizedSearch ? ` matching \"${search.trim()}\"` : " in this catalog"}
        </p>
        <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "0.5rem", justifyContent: "space-between" }}>
          <div className="filter-tabs" role="group" aria-label="Filter verses by memorized status">
            {(["all", "memorized", "not-memorized"] as MemorizedFilter[]).map((filter) => (
              <button
                key={filter}
                type="button"
                className={`filter-tab${memorizedFilter === filter ? " active" : ""}`}
                onClick={() => setMemorizedFilter(filter)}
                aria-pressed={memorizedFilter === filter}
              >
                {filter === "all" ? "All" : filter === "memorized" ? `Memorized (${memorized.size})` : "Not yet memorized"}
              </button>
            ))}
          </div>
          {memorized.size > 0 && (
            <button
              type="button"
              onClick={() => {
                if (!confirm("Remove all memorized marks? This cannot be undone.")) return;
                const empty = new Set<string>();
                saveMemorized(empty);
                setMemorized(empty);
                setMemorizedFilter("all");
              }}
              style={{
                background: "none",
                border: "1px solid rgba(180,60,60,0.4)",
                color: "rgba(180,60,60,0.85)",
                borderRadius: "6px",
                padding: "0.35rem 0.75rem",
                fontSize: "0.82rem",
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              Reset memorized
            </button>
          )}
        </div>
      </section>

      <section aria-label="Verse catalog" className="grid two">
        {filteredVerses.map((verse) => {
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
                  ({translationKey.toUpperCase()})
                </span>
              </h2>
              <p className="muted" style={{ marginTop: 0 }}>
                Theme: {verse.themeLabel} | Blanks: {verse.answers.length}
              </p>
              <p className="verse-preview">{buildFullVerseText(verse, translationKey)}</p>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "0.25rem" }}>
                <Link className="btn secondary" href={`/play?verse=${verse.id}&theme=${verse.themeId}`}>
                  Memorize this verse
                </Link>
                <button
                  onClick={() => toggle(verse.id)}
                  aria-label={isMemorized ? `Remove ${verse.reference} from memorized` : `Mark ${verse.reference} as memorized`}
                  aria-pressed={isMemorized}
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

        {filteredVerses.length === 0 && (
          <article className="card" style={{ gridColumn: "1 / -1", textAlign: "center" }}>
            <p style={{ margin: 0, lineHeight: 1.7, color: "var(--muted)" }}>
              No verses match this filter yet. Try a book name, passage reference, topic, phrase from the verse, or a different memorized setting.
            </p>
          </article>
        )}
      </section>
    </main>
  );
}