"use client";

import { useTranslation } from "@/lib/translation-context";

const PSALM_119_11: Record<string, string> = {
  niv: "I have hidden your word in my heart, that I might not sin against you.",
  kjv: "Thy word have I hid in mine heart, that I might not sin against thee.",
  nkjv: "Your word I have hidden in my heart, that I might not sin against You.",
  esv: "I have stored up your word in my heart, that I might not sin against you.",
};

export default function HomePage() {
  const { translationKey } = useTranslation();
  const label = translationKey.toUpperCase();

  return (
    <main className="grid spacious">
      <section className="hero hero-journey">
        <h1 style={{ marginTop: 0, textAlign: "center" }}>Hide in Heart</h1>
        <p className="hero-rhythm" style={{ textAlign: "center" }}>Read · Reflect · Memorize · Live</p>

        <p className="scripture-inline" style={{ textAlign: "left" }}>&ldquo;{PSALM_119_11[translationKey] ?? PSALM_119_11.niv}&rdquo; <span style={{ whiteSpace: "nowrap" }}>— Psalm 119:11 ({label})</span></p>
      </section>

      <section className="grid three home-grid" aria-labelledby="how-it-works">
        <h2 id="how-it-works" className="sr-only">How it works</h2>
        <article className="card pillar-card">
          <div className="soft-label">1. Read it</div>
          <h3>Start with a verse</h3>
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
