"use client";

import { useEffect, useState } from "react";

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
        <h2 style={{ marginTop: 0 }}>Profile</h2>
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
        <h2 style={{ marginTop: 0 }}>Profile</h2>
        <p className="muted">User ID: {profile.userId}</p>
        <p className="muted">Mode: {authMode === "account" ? "Signed in account" : "Guest mode"}</p>
      </section>
      <section className="card">
        <h3 style={{ marginTop: 0 }}>Stats</h3>
        <dl style={{ margin: 0 }}>
          <dt>Total points</dt>
          <dd style={{ margin: "0 0 0.4rem" }}>{profile.totalPoints}</dd>
          <dt>Best session</dt>
          <dd style={{ margin: "0 0 0.4rem" }}>{profile.bestSession}</dd>
          <dt>Verses completed</dt>
          <dd style={{ margin: "0 0 0.4rem" }}>{profile.versesCompleted}</dd>
          <dt>Current streak</dt>
          <dd style={{ margin: 0 }}>{profile.currentStreak} days</dd>
        </dl>
      </section>
    </main>
  );
}
