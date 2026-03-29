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
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

const LS_KEY = "sg_my_verses";

function loadSaved(): Set<string> {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return new Set(JSON.parse(raw) as string[]);
  } catch { /* ignore */ }
  return new Set();
}

function loadMemorized(): Set<string> {
  try {
    const raw = localStorage.getItem("sg_memorized_verses");
    if (raw) return new Set(JSON.parse(raw) as string[]);
  } catch { /* ignore */ }
  return new Set();
}

function persistSaved(set: Set<string>): void {
  localStorage.setItem(LS_KEY, JSON.stringify([...set]));
}

function versePreview(v: Verse, key: TranslationKey): string {
  const full = buildFullVerseText(v, key);
  const words = full.split(/\s+/);
  return words.length > 14 ? words.slice(0, 14).join(" ") + " …" : full;
}

type Filter = "all" | "memorized" | "not-memorized";

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

export default function MyVersesPage() {
  const { translationKey } = useTranslation();
  const { audienceMode } = useAudience();
  const isKids = audienceMode === "kids";

  const [allVerses, setAllVerses] = useState<Verse[]>([]);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [memorized, setMemorized] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => {
    setSaved(loadSaved());
    setMemorized(loadMemorized());
  }, []);

  useEffect(() => {
    if (isKids) { setAllVerses(KIDS_VERSES); setLoading(false); return; }
    (async () => {
      try { setAllVerses(await fetchVerses()); }
      catch { setAllVerses([]); }
      finally { setLoading(false); }
    })();
  }, [isKids]);

  /* verse map */
  const verseMap = useMemo(() => {
    const m = new Map<string, Verse>();
    for (const v of allVerses) m.set(v.id, v);
    return m;
  }, [allVerses]);

  /* saved verses (resolved + filtered) */
  const filteredVerses = useMemo(() => {
    const list: Verse[] = [];
    for (const id of saved) {
      const v = verseMap.get(id);
      if (v) list.push(v);
    }
    return list.filter((v) => {
      if (filter === "memorized" && !memorized.has(v.id)) return false;
      if (filter === "not-memorized" && memorized.has(v.id)) return false;
      if (search) {
        const q = search.toLowerCase();
        const full = buildFullVerseText(v, translationKey).toLowerCase();
        if (
          !v.reference.toLowerCase().includes(q) &&
          !v.themeLabel.toLowerCase().includes(q) &&
          !full.includes(q)
        ) return false;
      }
      return true;
    });
  }, [saved, verseMap, memorized, filter, search, translationKey]);

  function handleRemove(id: string): void {
    const next = new Set(saved);
    next.delete(id);
    setSaved(next);
    persistSaved(next);
  }

  function handleClearAll(): void {
    if (!confirm("Remove all saved verses from your list?")) return;
    setSaved(new Set());
    persistSaved(new Set());
  }

  if (loading) {
    return (
      <main className="grid spacious">
        <p className="muted" style={{ textAlign: "center", padding: "3rem 0" }}>Loading…</p>
      </main>
    );
  }

  const memCount = [...saved].filter((id) => memorized.has(id)).length;

  return (
    <main className="grid spacious">
      {/* Hero */}
      <section className="hero" style={{ textAlign: "center" }}>
        <h1>My Verses</h1>
        <p className="muted" style={{ maxWidth: 480, margin: "0 auto" }}>
          {saved.size === 0
            ? "You haven't saved any verses yet. Tap the bookmark icon on any verse to add it here."
            : `${saved.size} saved · ${memCount} memorized`}
        </p>
      </section>

      {saved.size > 0 && (
        <>
          {/* Search */}
          <div style={{ maxWidth: 480, margin: "0 auto", width: "100%" }}>
            <input
              type="search"
              className="search-input"
              placeholder="Search your saved verses…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search saved verses"
            />
          </div>

          {/* Filters */}
          <div className="filter-tabs" role="tablist" aria-label="Filter saved verses">
            {([
              ["all", "All"],
              ["memorized", "Memorized"],
              ["not-memorized", "Not yet"],
            ] as const).map(([key, label]) => (
              <button
                key={key}
                role="tab"
                aria-selected={filter === key}
                className={`filter-tab${filter === key ? " active" : ""}`}
                onClick={() => setFilter(key)}
              >
                {label}
              </button>
            ))}
          </div>
        </>
      )}

      {/* Verse cards */}
      {filteredVerses.length > 0 ? (
        <div className="grid two">
          {filteredVerses.map((v) => {
            const isMem = memorized.has(v.id);
            return (
              <article key={v.id} className="card my-verse-card">
                <div className="my-verse-top">
                  <div>
                    <h3 className="my-verse-ref">
                      {v.reference}
                      {isMem && <span className="my-verse-badge" aria-label="Memorized"> ✓</span>}
                    </h3>
                    <p className="my-verse-theme muted">{v.themeLabel}</p>
                  </div>
                  <button
                    className="my-verse-remove"
                    onClick={() => handleRemove(v.id)}
                    aria-label={`Remove ${v.reference} from saved verses`}
                    title="Remove from My Verses"
                  >
                    ✕
                  </button>
                </div>
                <p className="my-verse-preview">{versePreview(v, translationKey)}</p>
                <Link href={`/play?verse=${v.id}&theme=${v.themeId}`} className="btn btn-sm">
                  {isMem ? "Review" : "Practice"}
                </Link>
              </article>
            );
          })}
        </div>
      ) : saved.size > 0 ? (
        <p className="muted" style={{ textAlign: "center", padding: "2rem 0" }}>
          No verses match your search or filter.
        </p>
      ) : (
        <section style={{ textAlign: "center", padding: "2rem 0" }}>
          <p className="muted" style={{ marginBottom: "1rem" }}>
            Browse verses and tap the bookmark icon to build your personal collection.
          </p>
          <Link href="/browse/topic" className="btn">Browse by topic</Link>
        </section>
      )}

      {saved.size > 1 && (
        <div style={{ textAlign: "center", padding: "1rem 0" }}>
          <button className="btn btn-ghost" onClick={handleClearAll}>
            Clear all saved verses
          </button>
        </div>
      )}
    </main>
  );
}
