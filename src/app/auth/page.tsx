"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { hasSupabaseClient } from "@/lib/env";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export default function AuthPage() {
  if (!hasSupabaseClient) {
    return (
      <main className="card" style={{ maxWidth: "560px" }}>
        <h1 style={{ marginTop: 0 }}>Sign In</h1>
        <p className="muted">
          Accounts are not enabled on this instance. All progress is saved locally on your device.
        </p>
        <Link href="/play" className="btn primary">Start memorizing</Link>
      </main>
    );
  }

  return <AuthForm />;
}

function AuthForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("Supabase env vars are required for real auth.");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<"signIn" | "signUp" | null>(null);

  function validateCredentials(): boolean {
    const trimmedEmail = email.trim();
    let valid = true;

    if (!trimmedEmail) {
      setEmailError("Email is required.");
      valid = false;
    } else if (!/^\S+@\S+\.\S+$/.test(trimmedEmail)) {
      setEmailError("Enter a valid email address.");
      valid = false;
    } else {
      setEmailError(null);
    }

    if (!password) {
      setPasswordError("Password is required.");
      valid = false;
    } else if (password.length < 6) {
      setPasswordError("Password must be at least 6 characters.");
      valid = false;
    } else {
      setPasswordError(null);
    }

    if (!valid) {
      setMessage("Please fix the highlighted fields.");
    }
    return valid;
  }

  async function signUp() {
    if (!validateCredentials()) return;
    setPendingAction("signUp");
    try {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      if (data.user?.id) {
        localStorage.setItem("sg_user_id", data.user.id);
        localStorage.setItem("sg_auth_mode", "account");
        if (data.session?.access_token) {
          localStorage.setItem("sg_access_token", data.session.access_token);
        }
      }
      setMessage("Account created. Check your email for confirmation if enabled.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Sign-up failed");
    } finally {
      setPendingAction(null);
    }
  }

  async function signIn() {
    if (!validateCredentials()) return;
    setPendingAction("signIn");
    try {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (data.user?.id) {
        localStorage.setItem("sg_user_id", data.user.id);
        localStorage.setItem("sg_auth_mode", "account");
        if (data.session?.access_token) {
          localStorage.setItem("sg_access_token", data.session.access_token);
        }
      }
      setMessage("Signed in successfully.");
      router.push("/play");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Sign-in failed");
    } finally {
      setPendingAction(null);
    }
  }

  return (
    <main aria-busy={pendingAction !== null} className="card" style={{ maxWidth: "560px" }}>
      <h1 style={{ marginTop: 0 }}>Sign In or Create Account</h1>
      <p className="muted">Create an account to sync progress across devices, or sign in to continue where you left off.</p>

      <form
        aria-describedby="auth-help auth-status"
        onSubmit={(event) => {
          event.preventDefault();
          void signIn();
        }}
      >
        <p className="sr-only" id="auth-help">
          Press Enter to sign in. Use Create Account to register instead.
        </p>

        <div className="field">
          <label htmlFor="email">Email</label>
          <input
            aria-describedby={emailError ? "email-error" : undefined}
            aria-invalid={emailError ? true : undefined}
            autoComplete="email"
            id="email"
            onChange={(e) => {
              setEmail(e.target.value);
              if (emailError) setEmailError(null);
            }}
            required
            type="email"
            value={email}
          />
          {emailError ? (
            <p className="bad" id="email-error" role="alert" style={{ margin: 0 }}>
              {emailError}
            </p>
          ) : null}
        </div>

        <div className="field">
          <label htmlFor="password">Password</label>
          <input
            aria-describedby={passwordError ? "password-error" : undefined}
            aria-invalid={passwordError ? true : undefined}
            autoComplete="current-password"
            id="password"
            onChange={(e) => {
              setPassword(e.target.value);
              if (passwordError) setPasswordError(null);
            }}
            required
            type="password"
            value={password}
          />
          {passwordError ? (
            <p className="bad" id="password-error" role="alert" style={{ margin: 0 }}>
              {passwordError}
            </p>
          ) : null}
        </div>

        <div className="row">
          <button className="btn secondary" disabled={pendingAction !== null} onClick={() => void signUp()} type="button">
            Create Account
          </button>
          <button className="btn primary" disabled={pendingAction !== null} type="submit">
            Sign In
          </button>
        </div>
      </form>

      <p aria-live="polite" className="muted" id="auth-status" role="status" style={{ marginBottom: 0, marginTop: "1rem" }}>
        {message}
      </p>
    </main>
  );
}
