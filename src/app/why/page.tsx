"use client";

import Link from "next/link";
import { useAudience } from "@/lib/audience-context";

export default function WhyPage() {
  const { audienceMode } = useAudience();
  const isKids = audienceMode === "kids";

  return (
    <main className="shell why-page">
      <div style={{ marginBottom: "1.25rem" }}>
        <Link href="/" style={{ color: "var(--muted)", fontSize: "0.9rem" }}>&larr; Back to home</Link>
      </div>

      <h1 className="why-heading">
        {isKids
          ? "Why should I memorize Bible verses?"
          : "Why hide God\u2019s Word in your heart?"}
      </h1>

      {/* Section 1 */}
      <section className="why-section">
        <h2>It builds your faith</h2>
        {isKids ? (
          <p>
            When you memorize Bible verses, you learn about all the ways God has been faithful.
            The more you know His Word, the more you can trust Him.
          </p>
        ) : (
          <p>
            As you return to Scripture again and again, the same God who guided Abraham,
            sustained the prophets, and raised Christ from the dead speaks through His Word today.
            Memorizing it makes that voice familiar — and faith is built on a familiar voice.
          </p>
        )}
      </section>

      {/* Section 2 */}
      <section className="why-section">
        <h2>It shapes your character</h2>
        {isKids ? (
          <p>
            The Bible shows us how God wants us to act — how to be kind, honest, brave, and loving.
            When you memorize these verses, they remind you of the right thing to do when it matters.
          </p>
        ) : (
          <p>
            Character is not formed in a single decision — it is built through habits repeated
            over a lifetime. Scripture memorized becomes Scripture available: a standard internalized,
            not merely consulted when convenient.
          </p>
        )}
      </section>

      {/* Section 3 */}
      <section className="why-section">
        <h2>It keeps you connected to God</h2>
        {isKids ? (
          <p>
            When you memorize God&rsquo;s Word, it goes with you everywhere — to school, to practice,
            when you&rsquo;re scared, when you need help. You don&rsquo;t need to open a Bible because
            the verse is already in your heart.
          </p>
        ) : (
          <p>
            God&rsquo;s Word is living and active (Hebrews 4:12). A verse memorized is not stored text —
            it is a living resource available in prayer, in temptation, in grief, in joy.
            It connects you to God when no Bible is open and no one else is near.
          </p>
        )}
      </section>

      {/* Section 4 — anchor verse */}
      <section className="why-verse-block">
        <p className="verse-display">
          &ldquo;I have hidden your word in my heart,<br />
          that I might not sin against you.&rdquo;
        </p>
        <p className="completion-verse-ref">— Psalm 119:11</p>
      </section>

      {/* Section 5 — CTA */}
      <section className="why-section" style={{ textAlign: "center" }}>
        <h2>Ready to begin?</h2>
        <div className="two-paths-grid" style={{ maxWidth: 520, margin: "1.5rem auto 0" }}>
          <Link href="/play" className="path-card path-card-primary">
            <strong>Begin your journey</strong>
            <span className="path-cta">Start &rarr;</span>
          </Link>
          <Link href="/practice" className="path-card path-card-secondary">
            <strong>Just practice</strong>
            <span className="path-cta">Open Practice &rarr;</span>
          </Link>
        </div>
      </section>
    </main>
  );
}
