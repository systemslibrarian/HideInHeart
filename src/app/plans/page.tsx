"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import {
  ADULT_PLANS,
  KIDS_PLANS,
  PLAN_CATEGORIES,
  type MemorizationPlan,
  type PlanCategory,
} from "@/lib/plans";
import { buildFullVerseText } from "@/lib/journey";
import { KIDS_VERSES } from "@/lib/kids-verses";
import { fetchVerses } from "@/lib/verses-fetch";
import { useAudience } from "@/lib/audience-context";
import { useTranslation } from "@/lib/translation-context";
import type { TranslationKey, Verse } from "@/types/domain";

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function loadMemorized(): Set<string> {
  try {
    const raw = localStorage.getItem("sg_memorized_verses");
    if (raw) return new Set(JSON.parse(raw) as string[]);
  } catch { /* ignore */ }
  return new Set();
}

function versePreview(v: Verse, key: TranslationKey): string {
  const full = buildFullVerseText(v, key);
  const words = full.split(/\s+/);
  return words.length > 12 ? words.slice(0, 12).join(" ") + " …" : full;
}

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

export default function PlansPage() {
  const { translationKey } = useTranslation();
  const { audienceMode } = useAudience();
  const isKids = audienceMode === "kids";

  const [verses, setVerses] = useState<Verse[]>([]);
  const [loading, setLoading] = useState(true);
  const [memorized, setMemorized] = useState<Set<string>>(new Set());
  const [categoryFilter, setCategoryFilter] = useState<PlanCategory | "all">("all");
  const [expandedPlanId, setExpandedPlanId] = useState<string | null>(null);

  const plans = isKids ? KIDS_PLANS : ADULT_PLANS;

  useEffect(() => { setMemorized(loadMemorized()); }, []);

  useEffect(() => {
    if (isKids) {
      setVerses(KIDS_VERSES);
      setLoading(false);
      return;
    }
    (async () => {
      try { setVerses(await fetchVerses()); }
      catch { setVerses([]); }
      finally { setLoading(false); }
    })();
  }, [isKids]);

  /* verse lookup map */
  const verseMap = useMemo(() => {
    const m = new Map<string, Verse>();
    for (const v of verses) m.set(v.id, v);
    return m;
  }, [verses]);

  /* filtered plans */
  const filteredPlans = useMemo(() => {
    if (categoryFilter === "all") return plans;
    return plans.filter((p) => p.category === categoryFilter);
  }, [plans, categoryFilter]);

  /* progress per plan */
  const planProgress = useMemo(() => {
    const map = new Map<string, { done: number; total: number }>();
    for (const p of plans) {
      const done = p.verseIds.filter((id) => memorized.has(id)).length;
      map.set(p.id, { done, total: p.verseIds.length });
    }
    return map;
  }, [plans, memorized]);

  /* available categories */
  const availableCategories = useMemo(() => {
    const cats = new Set(plans.map((p) => p.category));
    return PLAN_CATEGORIES.filter((c) => c.id === "all" || cats.has(c.id as PlanCategory));
  }, [plans]);

  if (loading) {
    return (
      <main className="grid spacious">
        <p className="muted" style={{ textAlign: "center", padding: "3rem 0" }}>Loading plans…</p>
      </main>
    );
  }

  return (
    <main className="grid spacious">
      {/* Hero */}
      <section className="hero" style={{ textAlign: "center" }}>
        <h1>Memorization Plans</h1>
        <p className="muted" style={{ maxWidth: 520, margin: "0 auto" }}>
          {isKids
            ? "Follow a plan and memorize verses together — one step at a time!"
            : "Curated paths through Scripture. Pick a plan and build your foundation one verse at a time."}
        </p>
      </section>

      {/* Category filter */}
      {availableCategories.length > 2 && (
        <div className="filter-tabs" role="tablist" aria-label="Plan categories">
          {availableCategories.map((c) => (
            <button
              key={c.id}
              role="tab"
              aria-selected={categoryFilter === c.id}
              className={`filter-tab${categoryFilter === c.id ? " active" : ""}`}
              onClick={() => setCategoryFilter(c.id as PlanCategory | "all")}
            >
              {c.label}
            </button>
          ))}
        </div>
      )}

      {/* Plan cards */}
      <div className="plan-grid">
        {filteredPlans.map((plan) => {
          const progress = planProgress.get(plan.id) ?? { done: 0, total: 0 };
          const isExpanded = expandedPlanId === plan.id;
          const pct = progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0;
          const isComplete = progress.done === progress.total;

          return (
            <article key={plan.id} className={`card plan-card${isExpanded ? " expanded" : ""}`}>
              {/* Card header — always visible */}
              <button
                className="plan-card-header"
                onClick={() => setExpandedPlanId(isExpanded ? null : plan.id)}
                aria-expanded={isExpanded}
              >
                <span className="plan-icon" aria-hidden="true">{plan.icon}</span>
                <div className="plan-card-info">
                  <h3 className="plan-title">{plan.title}</h3>
                  <p className="plan-subtitle muted">{plan.subtitle}</p>
                  <div className="plan-meta">
                    <span className="plan-count">{progress.total} verses</span>
                    {progress.done > 0 && (
                      <span className={`plan-progress-badge${isComplete ? " complete" : ""}`}>
                        {isComplete ? "✓ Complete" : `${progress.done}/${progress.total}`}
                      </span>
                    )}
                  </div>
                </div>
                <span className={`plan-chevron${isExpanded ? " open" : ""}`} aria-hidden="true">▾</span>
              </button>

              {/* Progress bar */}
              {progress.done > 0 && (
                <div className="plan-progress-bar" aria-label={`${pct}% complete`}>
                  <div className="plan-progress-fill" style={{ width: `${pct}%` }} />
                </div>
              )}

              {/* Expanded detail */}
              {isExpanded && (
                <div className="plan-detail">
                  <p className="plan-description">{plan.description}</p>

                  <ol className="plan-verse-list">
                    {plan.verseIds.map((id, idx) => {
                      const verse = verseMap.get(id);
                      const isMem = memorized.has(id);
                      return (
                        <li key={id} className={`plan-verse-item${isMem ? " memorized" : ""}`}>
                          <span className="plan-verse-num">{idx + 1}</span>
                          <div className="plan-verse-body">
                            <span className="plan-verse-ref">
                              {verse?.reference ?? id}
                              {isMem && <span className="plan-verse-check" aria-label="Memorized"> ✓</span>}
                            </span>
                            {verse && (
                              <span className="plan-verse-preview muted">
                                {versePreview(verse, translationKey)}
                              </span>
                            )}
                          </div>
                          {verse && (
                            <Link
                              href={`/play?verse=${id}&theme=${verse.themeId}`}
                              className="btn btn-sm plan-verse-action"
                            >
                              {isMem ? "Review" : "Practice"}
                            </Link>
                          )}
                        </li>
                      );
                    })}
                  </ol>

                  {/* Start / continue CTA */}
                  {(() => {
                    const nextId = plan.verseIds.find((id) => !memorized.has(id));
                    const nextVerse = nextId ? verseMap.get(nextId) : undefined;
                    if (!nextVerse) return null;
                    return (
                      <Link
                        href={`/play?verse=${nextId}&theme=${nextVerse.themeId}`}
                        className="btn plan-start-btn"
                      >
                        {progress.done > 0 ? "Continue this plan" : "Start this plan"}
                      </Link>
                    );
                  })()}
                </div>
              )}
            </article>
          );
        })}
      </div>

      {filteredPlans.length === 0 && (
        <p className="muted" style={{ textAlign: "center", padding: "2rem 0" }}>
          No plans in this category yet.
        </p>
      )}
    </main>
  );
}
