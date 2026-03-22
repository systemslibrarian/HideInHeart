"use client";

import Link from "next/link";
import { useTranslation } from "@/lib/translation-context";

const PSALM_119_11 = {
  niv: "I have hidden your word in my heart, that I might not sin against you.",
  kjv: "Thy word have I hid in mine heart, that I might not sin against thee.",
} as const;

export default function HomePage() {
  const { translationKey } = useTranslation();
  const label = translationKey.toUpperCase();

  return (
    <main className="grid spacious">
      <section className="hero hero-journey">
        <h1 style={{ marginTop: 0, textAlign: "center" }}>Hide God&apos;s Word in your heart.</h1>
        <p className="hero-rhythm" style={{ textAlign: "center" }}>Read · Reflect · Memorize · Live</p>

        <p className="scripture-inline" style={{ textAlign: "left" }}>&ldquo;{PSALM_119_11[translationKey]}&rdquo; <span style={{ whiteSpace: "nowrap" }}>— Psalm 119:11 ({label})</span></p>

        <div className="row hero-actions" style={{ justifyContent: "center" }}>
          <Link className="btn primary large" href="/play">
            Begin today&apos;s journey
          </Link>
        </div>


      </section>

      <section className="grid three home-grid">
        <article className="card pillar-card">
          <div className="soft-label">1. Read it</div>
          <h3>Start with today&apos;s verse</h3>
          <p className="muted">A featured passage, its theme, and a short devotional frame the day before the practice begins.</p>
        </article>
        <article className="card pillar-card">
          <div className="soft-label">2. Practice it</div>
          <h3>Place the missing words</h3>
          <p className="muted">Hide the verse in your heart through a calm word-tile exercise — no timers, no pressure.</p>
        </article>
        <article className="card pillar-card">
          <div className="soft-label">3. Live it</div>
          <h3>Carry one response forward</h3>
          <p className="muted">Finish with a short application prompt so the passage moves from memory into obedience, trust, or rest.</p>
        </article>
      </section>
    </main>
  );
}
