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
          ? "Why memorize Bible verses?"
          : "Why hide God\u2019s Word in your heart?"}
      </h1>

      {/* Section 1 */}
      <section className="why-section">
        <h2>{isKids ? "It helps you trust God more" : "It builds your faith"}</h2>
        {isKids ? (
          <p>
            The Bible is full of stories about how God kept His promises &mdash; to Abraham when he had
            no idea where he was going, to Moses when the way forward seemed impossible, to David
            when he was afraid and alone. Every one of those stories is true, and every one of them
            is about the same God who is with you today. When you memorize His Word, those stories
            and promises stop being something you read once and forget. They become part of how you
            see the world. The more of Scripture you carry in your heart, the easier it becomes to
            trust that God knows what He is doing &mdash; even when life is confusing or hard.
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
        <h2>{isKids ? "It helps you become who God made you to be" : "It shapes your character"}</h2>
        {isKids ? (
          <p>
            God did not give us His Word just so we would know facts about Him. He gave it to us so
            we would know how to live. The Bible shows us how to be kind to people who are unkind
            to us, how to be honest when lying would be easier, how to be brave when we are afraid,
            and how to love people the way God loves us. When you memorize these verses, they do not
            just sit in your memory &mdash; they begin to shape the choices you make and the kind of person
            you are becoming. Not because you have to follow rules, but because God made you for
            something better than you could choose on your own.
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
        <h2>{isKids ? "It goes with you everywhere" : "It keeps you connected to God"}</h2>
        {isKids ? (
          <p>
            You cannot always carry a Bible. But a verse you have memorized is always with you &mdash;
            at school when something hard happens, at night when your mind will not quiet down,
            in a moment when you need to know the right thing to do and there is no time to look
            it up. God&rsquo;s Word hidden in your heart is always close enough to reach. That is exactly
            what Psalm 119:11 means &mdash; not just that memorizing Scripture is a good idea, but that
            when His Word is in your heart, it is working in you even when you are not thinking
            about it.
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
