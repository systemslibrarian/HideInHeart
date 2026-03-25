"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useTranslation } from "@/lib/translation-context";

const PSALM_119_11: Record<string, string> = {
  niv: "I have hidden your word in my heart, that I might not sin against you.",
  kjv: "Thy word have I hid in mine heart, that I might not sin against thee.",
  nkjv: "Your word I have hidden in my heart, that I might not sin against You.",
  esv: "I have stored up your word in my heart, that I might not sin against you.",
};

const MILESTONES = [100, 30, 7] as const;

function milestoneLabel(streak: number): string | null {
  for (const m of MILESTONES) {
    if (streak >= m) {
      if (m === 100) return "🏆 100-day milestone!";
      if (m === 30) return "🔥 30-day milestone!";
      return "⭐ 7-day milestone!";
    }
  }
  return null;
}

export default function HomePage() {
  const { translationKey } = useTranslation();
  const label = translationKey.toUpperCase();

  const [streak, setStreak] = useState<number | null>(null);
  const [showMilestone, setShowMilestone] = useState(false);

  useEffect(() => {
    const userId = localStorage.getItem("sg_user_id") ?? "guest";
    const token = localStorage.getItem("sb_access_token");
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;

    fetch(`/api/profile?userId=${encodeURIComponent(userId)}`, { headers })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.profile?.currentStreak != null) {
          const s = data.profile.currentStreak as number;
          setStreak(s);

          // Show milestone toast if applicable and not already dismissed this session
          const milestone = milestoneLabel(s);
          if (milestone) {
            const dismissedKey = `streak_milestone_${s >= 100 ? 100 : s >= 30 ? 30 : 7}`;
            if (!sessionStorage.getItem(dismissedKey)) {
              setShowMilestone(true);
              sessionStorage.setItem(dismissedKey, "1");
              setTimeout(() => setShowMilestone(false), 5000);
            }
          }
        }
      })
      .catch(() => { /* streak not available — silently skip */ });
  }, []);

  const milestone = streak != null ? milestoneLabel(streak) : null;

  return (
    <main className="grid spacious">
      <section className="hero hero-journey">
        <p className="hero-rhythm" style={{ textAlign: "center" }}>Read · Reflect · Memorize · Live</p>

        <p className="scripture-inline" style={{ textAlign: "left" }}>&ldquo;{PSALM_119_11[translationKey] ?? PSALM_119_11.niv}&rdquo; <span style={{ whiteSpace: "nowrap" }}>— Psalm 119:11 ({label})</span></p>
      </section>

      {streak != null && streak > 0 && (
        <section className="streak-banner" aria-label="Your streak">
          <span className="streak-flame" aria-hidden="true">🔥</span>
          <div className="streak-info">
            <span className="streak-count">{streak}</span>
            <span className="streak-label">{streak === 1 ? "day" : "days"} in a row</span>
          </div>
        </section>
      )}

      {showMilestone && milestone && (
        <div className="milestone-toast" role="status" aria-live="polite">
          {milestone}
        </div>
      )}

      <section className="grid three home-grid" aria-labelledby="how-it-works">
        <h2 id="how-it-works" className="sr-only">How it works</h2>
        <article className="card pillar-card">
          <div className="soft-label">1. Read it</div>
          <h3><Link href="/browse/topic" className="pillar-link">Start with a verse</Link></h3>
          <p className="muted">Begin with a passage you chose. Read it slowly and let the words settle before you move on.</p>
        </article>
        <article className="card pillar-card">
          <div className="soft-label">2. Reflect on it</div>
          <h3>Pause over what it means</h3>
          <p className="muted">A short devotional helps frame the verse so you are not only reading words, but considering what God is saying.</p>
        </article>
        <article className="card pillar-card">
          <div className="soft-label">3. Memorize it</div>
          <h3>Place the missing words</h3>
          <p className="muted">Hide the verse in your heart through a calm word-tile exercise with no timers and no pressure.</p>
        </article>
        <article className="card pillar-card">
          <div className="soft-label">4. Live it</div>
          <h3>Carry one response forward</h3>
          <p className="muted">Finish with a short application prompt so the passage moves from memory into obedience, trust, or rest.</p>
        </article>
      </section>
    </main>
  );
}
