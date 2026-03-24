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
  const [usingServer, setUsingServer] = useState(false);
  const [deleting, setDeleting] = useState<number | string | null>(null);

  const verseRefMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const v of LOCAL_VERSES) map.set(v.id, v.reference);
    return map;
  }, []);

  function authHeaders(): HeadersInit {
    const token = localStorage.getItem("sg_access_token");
    return token ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" };
  }

  function exportAsText(): void {
    if (reflections.length === 0) return;
    const lines = reflections.map((r) => {
      const ref = verseRefMap.get(r.verse_id) ?? r.verse_id;
      const date = formatDate(r.created_at);
      return `${ref} — ${date}\n${r.response_text}\n`;
    });
    const text = "My Reflections\n" + "=".repeat(40) + "\n\n" + lines.join("\n");
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "my-reflections.txt";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function deleteOne(id: number) {
    setDeleting(id);
    try {
      if (usingServer) {
        await fetch("/api/reflection", { method: "DELETE", headers: authHeaders(), body: JSON.stringify({ id }) });
      } else {
        const updated = reflections.filter((r) => r.id !== id);
        localStorage.setItem("sg_reflections", JSON.stringify(updated));
      }
      setReflections((prev) => prev.filter((r) => r.id !== id));
    } finally {
      setDeleting(null);
    }
  }

  async function deleteAll() {
    if (!confirm("Remove all reflections? This cannot be undone.")) return;
    setDeleting("all");
    try {
      if (usingServer) {
        await fetch("/api/reflection", { method: "DELETE", headers: authHeaders(), body: JSON.stringify({ id: "all" }) });
      } else {
        localStorage.removeItem("sg_reflections");
      }
      setReflections([]);
    } finally {
      setDeleting(null);
    }
  }

  useEffect(() => {
    (async () => {
      try {
        /* Try server first */
        const token = localStorage.getItem("sg_access_token");
        const headers: HeadersInit = token
          ? { Authorization: `Bearer ${token}` }
          : {};
        const res = await fetch("/api/reflections", { headers });
        if (res.ok) {
          const data = await res.json();
          const server: Reflection[] = data.reflections ?? [];
          if (server.length > 0) {
            setReflections(server);
            setUsingServer(true);
            setLoading(false);
            return;
          }
        }
      } catch {
        /* offline or unavailable — fall through to local */
      }

      /* Fall back to localStorage */
      try {
        const local: Reflection[] = JSON.parse(localStorage.getItem("sg_reflections") ?? "[]");
        setReflections(local);
      } catch {
        /* corrupt data */
      }

      setLoading(false);
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
      <p className="muted" style={{ marginBottom: "1rem" }}>
        A private record of how God&apos;s Word has met you.
      </p>

      {reflections.length > 0 && (
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginBottom: "1rem" }}>
          <button
            onClick={exportAsText}
            style={{
              background: "none",
              border: "1px solid var(--border)",
              color: "var(--ink)",
              borderRadius: "6px",
              padding: "0.4rem 0.85rem",
              fontSize: "0.85rem",
              cursor: "pointer",
            }}
          >
            Export as text
          </button>
          <button
            onClick={deleteAll}
            disabled={deleting === "all"}
            style={{
              background: "none",
              border: "1px solid rgba(180,60,60,0.4)",
              color: "rgba(180,60,60,0.85)",
              borderRadius: "6px",
              padding: "0.4rem 0.85rem",
              fontSize: "0.85rem",
              cursor: "pointer",
              opacity: deleting === "all" ? 0.5 : 1,
            }}
          >
            {deleting === "all" ? "Removing…" : "Clear all reflections"}
          </button>
        </div>
      )}

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
            <article key={r.id} className="card" style={{ padding: "1.25rem 1.5rem", position: "relative" }}>
              <button
                onClick={() => deleteOne(r.id)}
                disabled={deleting === r.id}
                aria-label={`Remove reflection for ${verseRefMap.get(r.verse_id) ?? r.verse_id}`}
                title="Remove this reflection"
                style={{
                  position: "absolute",
                  top: "0.6rem",
                  right: "0.6rem",
                  background: "none",
                  border: "none",
                  color: "var(--muted)",
                  fontSize: "1.1rem",
                  cursor: "pointer",
                  padding: "0.25rem 0.4rem",
                  borderRadius: "4px",
                  lineHeight: 1,
                  opacity: deleting === r.id ? 0.4 : 0.6,
                  transition: "opacity 0.15s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.color = "rgba(180,60,60,0.85)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.opacity = "0.6"; e.currentTarget.style.color = "var(--muted)"; }}
              >
                ✕
              </button>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.75rem", paddingRight: "1.5rem" }}>
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
