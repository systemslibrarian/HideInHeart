"use client";

import { useState } from "react";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";

const template = {
  id: "ps11911",
  reference: "Psalm 119:11",
  translation: "NIV",
  parts: ["I have hidden your word in my ", " that I might not sin against you."],
  answers: ["HEART"],
  decoys: ["MIND", "SOUL", "LIFE"],
  themeId: "core",
};

export default function AdminPage() {
  const [token, setToken] = useState("");
  const [json, setJson] = useState(JSON.stringify(template, null, 2));
  const [message, setMessage] = useState("Admin role required when Supabase is enabled.");
  const [pending, setPending] = useState(false);
  const [jsonError, setJsonError] = useState<string | null>(null);

  async function submit() {
    setPending(true);
    setJsonError(null);
    try {
      let body: unknown;
      try {
        body = JSON.parse(json) as unknown;
      } catch {
        setJsonError("Payload must be valid JSON.");
        setMessage("Please correct the verse payload before saving.");
        return;
      }

      let authHeader: string | undefined;
      try {
        const supabase = getSupabaseBrowserClient();
        const { data } = await supabase.auth.getSession();
        const token = data.session?.access_token;
        if (token) {
          authHeader = `Bearer ${token}`;
        }
      } catch {
        // Local fallback mode can still use x-admin-token.
      }

      const response = await fetch("/api/admin/verse", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "x-admin-token": token } : {}),
          ...(authHeader ? { Authorization: authHeader } : {}),
        },
        body: JSON.stringify(body),
      });

      const payload = (await response.json()) as { saved?: boolean; error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Request failed");
      }

      setMessage(payload.saved ? "Verse upserted successfully." : "Saved locally (fallback mode).");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Submit failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <main aria-busy={pending} className="card">
      <h2 style={{ marginTop: 0 }}>Admin Verse CMS</h2>
      <p className="muted">Use this route to add or update verse content in Supabase.</p>

      <form
        aria-describedby="admin-help admin-status"
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        <p className="sr-only" id="admin-help">
          Paste verse JSON and press Save Verse.
        </p>

        <div className="field">
          <label htmlFor="token">Local admin token (fallback mode)</label>
          <input id="token" onChange={(e) => setToken(e.target.value)} type="password" value={token} />
        </div>

        <div className="field">
          <label htmlFor="payload">Verse JSON payload</label>
          <textarea
            aria-describedby={jsonError ? "payload-error" : undefined}
            aria-invalid={jsonError ? true : undefined}
            id="payload"
            onChange={(e) => {
              setJson(e.target.value);
              if (jsonError) setJsonError(null);
            }}
            rows={14}
            value={json}
          />
          {jsonError ? (
            <p className="bad" id="payload-error" role="alert" style={{ margin: 0 }}>
              {jsonError}
            </p>
          ) : null}
        </div>

        <div className="row">
          <button className="btn primary" disabled={pending} type="submit">
            Save Verse
          </button>
        </div>
      </form>

      <p aria-live="polite" className="muted" id="admin-status" role="status">
        {message}
      </p>
    </main>
  );
}
