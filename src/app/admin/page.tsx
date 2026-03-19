"use client";

import { useState } from "react";

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
  const [message, setMessage] = useState("Admin API token required.");

  async function submit() {
    try {
      const body = JSON.parse(json) as unknown;
      const response = await fetch("/api/admin/verse", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": token,
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
    }
  }

  return (
    <main className="card">
      <h2 style={{ marginTop: 0 }}>Admin Verse CMS</h2>
      <p className="muted">Use this route to add or update verse content in Supabase.</p>

      <div className="field">
        <label htmlFor="token">Admin API token</label>
        <input id="token" onChange={(e) => setToken(e.target.value)} type="password" value={token} />
      </div>

      <div className="field">
        <label htmlFor="payload">Verse JSON payload</label>
        <textarea id="payload" onChange={(e) => setJson(e.target.value)} rows={14} value={json} />
      </div>

      <div className="row">
        <button className="btn primary" onClick={submit} type="button">
          Save Verse
        </button>
      </div>
      <p className="muted">{message}</p>
    </main>
  );
}
