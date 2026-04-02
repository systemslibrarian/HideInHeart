"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { hasSupabaseClient } from "@/lib/env";

type Profile = {
  userId: string;
  totalPoints: number;
  bestSession: number;
  versesCompleted: number;
  currentStreak: number;
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const userId = localStorage.getItem("sg_user_id") ?? "guest";
        const response = await fetch(`/api/profile?userId=${encodeURIComponent(userId)}`);
        if (!response.ok) {
          throw new Error("Unable to load profile.");
        }
        const payload = (await response.json()) as { profile: Profile };
        setProfile(payload.profile);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Unable to load profile.");
      }
    }

    void load();
  }, []);

  if (error) {
    return (
      <main className="card">
        <h1 style={{ marginTop: 0 }}>Profile</h1>
        <p className="bad" role="alert">
          {error}
        </p>
      </main>
    );
  }

  if (!profile) {
    return (
      <main aria-busy="true" className="card">
        <p aria-live="polite" className="muted" role="status">
          Loading profile...
        </p>
      </main>
    );
  }

  const authMode = localStorage.getItem("sg_auth_mode") ?? "guest";

  return (
    <main className="grid two">
      <section className="card">
        <h1 style={{ marginTop: 0 }}>Profile</h1>
        {hasSupabaseClient && (
          <>
            <p className="muted">User ID: {profile.userId}</p>
            <p className="muted">Mode: {authMode === "account" ? "Signed in account" : "Guest mode"}</p>
          </>
        )}
        {!hasSupabaseClient && (
          <p className="muted">All progress is saved locally on this device.</p>
        )}
      </section>
      <section className="card">
        <h3 style={{ marginTop: 0 }}>Your Walk</h3>
        <dl style={{ margin: 0 }}>
          <dt>Sessions</dt>
          <dd style={{ margin: "0 0 0.4rem" }}>{profile.totalPoints}</dd>
          <dt>Verses memorized</dt>
          <dd style={{ margin: "0 0 0.4rem" }}>{profile.versesCompleted}</dd>
          <dt>Current streak</dt>
          <dd style={{ margin: 0 }}>{profile.currentStreak} days</dd>
        </dl>
      </section>
      <section className="card" style={{ textAlign: "center" }}>
        <Link href="/profile/reflections" style={{ color: "var(--brand)", fontWeight: 600, fontSize: "1.02rem" }}>
          View your reflections →
        </Link>
      </section>
    </main>
  );
}
