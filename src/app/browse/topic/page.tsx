"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { HEART_CHECK_OPTIONS, buildFullVerseText } from "@/lib/journey";
import { KIDS_VERSES, KIDS_THEME_OPTIONS } from "@/lib/kids-verses";
import { useAudience } from "@/lib/audience-context";
import { useTranslation } from "@/lib/translation-context";
import type { ThemeOption, TranslationKey, Verse } from "@/types/domain";

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

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

export default function BrowseByTopicPage() {
  const router = useRouter();
  const { translationKey } = useTranslation();
  const { audienceMode } = useAudience();
  const isKids = audienceMode === "kids";

  const [verses, setVerses] = useState<Verse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedThemeId, setSelectedThemeId] = useState<string | null>(null);
  const [memorized, setMemorized] = useState<Set<string>>(new Set());

  const themeOptions: ThemeOption[] = isKids ? KIDS_THEME_OPTIONS : HEART_CHECK_OPTIONS;

  /* load memorized set */
  useEffect(() => { setMemorized(loadMemorized()); }, []);

  /* fetch verses */
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

  /* verse counts per theme */
  const themeCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const v of verses) {
      counts.set(v.themeId, (counts.get(v.themeId) ?? 0) + 1);
    }
    return counts;
  }, [verses]);

  /* verses for selected theme */
  const themeVerses = useMemo(() => {
    if (!selectedThemeId) return [];
    const theme = themeOptions.find((t) => t.id === selectedThemeId);
    const matchIds = theme?.verseThemeIds ?? [selectedThemeId];
    return verses.filter((v) => matchIds.includes(v.themeId));
  }, [verses, selectedThemeId, themeOptions]);

  /* auto-select if theme has only 1 verse */
  useEffect(() => {
    if (themeVerses.length === 1) {
      router.push(`/play?verse=${themeVerses[0].id}&theme=${selectedThemeId}`);
    }
  }, [themeVerses, selectedThemeId, router]);

  if (loading) {
    return (
      <main className="shell" style={{ textAlign: "center", paddingTop: "4rem" }}>
        <p className="soft-label" role="status">Loading…</p>
      </main>
    );
  }

  /* ------- verse list for selected theme ------- */
  if (selectedThemeId && themeVerses.length > 1) {
    const theme = themeOptions.find((t) => t.id === selectedThemeId);
    return (
      <main className="shell">
        <div style={{ marginBottom: "1.25rem" }}>
          <button
            type="button"
            onClick={() => setSelectedThemeId(null)}
            className="btn-back"
            style={{ background: "none", border: "none", color: "var(--muted)", fontSize: "0.9rem", cursor: "pointer", padding: 0 }}
          >
            &larr; Back to topics
          </button>
        </div>

        <h1 style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: "clamp(1.25rem, 2.5vw, 1.5rem)", marginBottom: "0.35rem" }}>
          {theme?.label}
        </h1>
        <p style={{ color: "var(--muted)", marginBottom: "1.5rem", lineHeight: 1.6 }}>
          {theme?.description}
        </p>

        <div className="verse-list" role="list">
          {themeVerses.map((v) => (
            <Link
              key={v.id}
              href={`/play?verse=${v.id}&theme=${selectedThemeId}`}
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

  /* ------- theme grid ------- */
  return (
    <main className="shell">
      <div style={{ marginBottom: "1.25rem" }}>
        <Link href="/" style={{ color: "var(--muted)", fontSize: "0.9rem" }}>&larr; Back to home</Link>
      </div>

      <div style={{ textAlign: "center", marginBottom: "2rem" }}>
        <h1 style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: "clamp(1.25rem, 2.5vw, 1.5rem)", marginBottom: "0.5rem" }}>
          Browse by topic
        </h1>
        <p style={{ color: "var(--muted)", lineHeight: 1.7, maxWidth: 440, margin: "0 auto" }}>
          Select a theme. Let scripture meet you there.
        </p>
      </div>

      <div className="theme-grid" role="group" aria-label="Browse by topic">
        {themeOptions.map((option) => {
          const count = themeCounts.get(option.id) ?? 0;
          return (
            <button
              key={option.id}
              className="theme-card"
              onClick={() => setSelectedThemeId(option.id)}
            >
              <strong>{option.label}</strong>
              <span className="soft-label" style={{ fontSize: "0.85rem" }}>{option.description}</span>
              <span className="muted" style={{ fontSize: "0.8rem" }}>{count} {count === 1 ? "verse" : "verses"}</span>
            </button>
          );
        })}
      </div>
    </main>
  );
}
