import Link from "next/link";

export default function HomePage() {
  return (
    <main className="grid" style={{ gap: "1rem" }}>
      <section className="hero">
        <h1 style={{ marginTop: 0 }}>Turned into a full web app</h1>
        <p>
          This project now includes a modern frontend, API routes, Supabase auth/data integration,
          leaderboard and profile flows, admin content management, and CI/testing infrastructure.
        </p>
        <div className="row">
          <Link className="btn primary" href="/play">
            Start Playing
          </Link>
          <Link className="btn secondary" href="/auth">
            Sign In
          </Link>
        </div>
      </section>

      <section className="grid two">
        <article className="card">
          <h3>Phase 1 and 2</h3>
          <p className="muted">Next.js frontend with Supabase-ready auth and APIs.</p>
        </article>
        <article className="card">
          <h3>Phase 3 and 4</h3>
          <p className="muted">Verse catalog moved to database model with profile and leaderboard.</p>
        </article>
        <article className="card">
          <h3>Phase 5</h3>
          <p className="muted">Admin route, tests, CI workflow, and Sentry monitoring setup.</p>
        </article>
      </section>
    </main>
  );
}
