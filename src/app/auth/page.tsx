"use client";

import { useState } from "react";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("Supabase env vars are required for real auth.");

  async function signUp() {
    try {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      if (data.user?.id) {
        localStorage.setItem("sg_user_id", data.user.id);
      }
      setMessage("Account created. Check your email for confirmation if enabled.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Sign-up failed");
    }
  }

  async function signIn() {
    try {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (data.user?.id) {
        localStorage.setItem("sg_user_id", data.user.id);
      }
      setMessage("Signed in successfully.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Sign-in failed");
    }
  }

  return (
    <main className="card" style={{ maxWidth: "560px" }}>
      <h2 style={{ marginTop: 0 }}>Authentication</h2>
      <p className="muted">Use Supabase Auth for cloud-synced progress across devices.</p>

      <div className="field">
        <label htmlFor="email">Email</label>
        <input id="email" onChange={(e) => setEmail(e.target.value)} type="email" value={email} />
      </div>

      <div className="field">
        <label htmlFor="password">Password</label>
        <input id="password" onChange={(e) => setPassword(e.target.value)} type="password" value={password} />
      </div>

      <div className="row">
        <button className="btn primary" onClick={signIn} type="button">
          Sign In
        </button>
        <button className="btn secondary" onClick={signUp} type="button">
          Sign Up
        </button>
      </div>

      <p className="muted" style={{ marginBottom: 0, marginTop: "1rem" }}>
        {message}
      </p>
    </main>
  );
}
