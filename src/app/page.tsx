import Link from "next/link";

export default function HomePage() {
  return (
    <main className="grid spacious">
      <section className="hero hero-journey">
        <div className="soft-label">Daily practice</div>
        <h1 style={{ marginTop: 0 }}>A calm daily Scripture journey for reading, reflecting, memorizing, and living God&apos;s Word.</h1>
        <p className="mission-copy">
          Move through a gentle rhythm each day: read slowly, sit with the passage, practice the words,
          and carry one clear response into the rest of your day.
        </p>
        <div className="row hero-actions">
          <Link className="btn primary" href="/play">
            Begin today&apos;s journey
          </Link>
          <Link className="btn secondary" href="/auth">
            Sign in to keep your rhythm
          </Link>
        </div>
        <p className="muted quiet-note">
          The practice centers on placing word tiles into the verse, but the experience starts with reflection before it asks for recall.
        </p>
      </section>

      <section className="grid two home-grid">
        <article className="card pillar-card">
          <div className="soft-label">1. Read it</div>
          <h3>Start with today&apos;s verse</h3>
          <p className="muted">A featured passage, its theme, and a short devotional frame the day before the practice begins.</p>
        </article>
        <article className="card pillar-card">
          <div className="soft-label">2. Practice it</div>
          <h3>Place the missing words</h3>
          <p className="muted">The core drag-and-drop verse practice remains central, with clearer spacing, calmer cues, and mobile-friendly tiles.</p>
        </article>
        <article className="card pillar-card">
          <div className="soft-label">3. Live it</div>
          <h3>Carry one response forward</h3>
          <p className="muted">Finish with a short application prompt so the passage moves from memory into obedience, trust, or rest.</p>
        </article>
      </section>

      <section className="grid two">
        <article className="card">
          <h3 style={{ marginTop: 0 }}>What this is for</h3>
          <p className="muted">
            This is not built as loud trivia. It is a quiet daily space for Scripture to slow you down, steady your heart,
            and stay with you after the screen is gone.
          </p>
        </article>
        <article className="card">
          <h3 style={{ marginTop: 0 }}>Keep what already works</h3>
          <p className="muted">
            Auth, profile, leaderboard, admin tools, local fallback verses, and Supabase-backed progress remain in place.
            The journey simply gives them a more meaningful center.
          </p>
        </article>
      </section>
    </main>
  );
}
