"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { LOCAL_VERSES } from "@/lib/verses-local";

type Reflection = {
  id: number;
  verse_id: string;
  category_id: string;
  response_text: string;
  created_at: string;
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function ReflectionsPage() {
  const [reflections, setReflections] = useState<Reflection[]>([]);
  const [loading, setLoading] = useState(true);

  const verseRefMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const v of LOCAL_VERSES) map.set(v.id, v.reference);
    return map;
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem("sg_access_token");
        const headers: HeadersInit = token
          ? { Authorization: `Bearer ${token}` }
          : {};
        const res = await fetch("/api/reflections", { headers });
        if (res.ok) {
          const data = await res.json();
          setReflections(data.reflections ?? []);
        }
      } catch {
        /* offline or unavailable — show empty state */
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <main className="shell" style={{ paddingTop: "3rem", textAlign: "center" }}>
        <p className="muted" role="status" aria-live="polite">Loading your reflections…</p>
      </main>
    );
  }

  return (
    <main className="shell" style={{ maxWidth: 640, margin: "0 auto" }}>
      <h1 style={{ fontFamily: "'Fraunces', Georgia, serif", marginBottom: "0.5rem" }}>
        Your Reflections
      </h1>
      <p className="muted" style={{ marginBottom: "2rem" }}>
        A private record of how God&apos;s Word has met you.
      </p>

      {reflections.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "2.5rem 1.5rem" }}>
          <p style={{ lineHeight: 1.7, color: "var(--muted)" }}>
            Your reflections will appear here. <br />
            <Link href="/browse/topic" style={{ color: "var(--brand)", fontWeight: 600 }}>
              Pick a verse to memorize
            </Link>{" "}
            to write your first.
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "1rem" }}>
          {reflections.map((r) => (
            <article key={r.id} className="card" style={{ padding: "1.25rem 1.5rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.75rem" }}>
                <strong style={{ fontFamily: "var(--scripture-font)", fontSize: "1.08rem" }}>{verseRefMap.get(r.verse_id) ?? r.verse_id} <span style={{ fontWeight: 400, color: "var(--muted)", fontSize: "0.85rem" }}>(NIV)</span></strong>
                <time dateTime={r.created_at} style={{ fontSize: "0.85rem", color: "var(--muted)" }}>
                  {formatDate(r.created_at)}
                </time>
              </div>
              {r.response_text && (
                <p style={{ lineHeight: 1.7, margin: 0, whiteSpace: "pre-wrap" }}>
                  {r.response_text}
                </p>
              )}
              {r.category_id && r.category_id !== "general" && (
                <span
                  className="soft-label"
                  style={{
                    display: "inline-block",
                    marginTop: "0.75rem",
                    padding: "0.2rem 0.6rem",
                    background: "var(--surface-soft)",
                    borderRadius: "999px",
                    fontSize: "0.78rem",
                  }}
                >
                  {r.category_id}
                </span>
              )}
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
