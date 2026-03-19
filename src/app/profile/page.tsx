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

  useEffect(() => {
    async function load() {
      const userId = localStorage.getItem("sg_user_id") ?? "guest";
      const response = await fetch(`/api/profile?userId=${encodeURIComponent(userId)}`);
      const payload = (await response.json()) as { profile: Profile };
      setProfile(payload.profile);
    }

    void load();
  }, []);

  if (!profile) {
    return <main className="card">Loading profile...</main>;
  }

  return (
    <main className="grid two">
      <section className="card">
        <h2 style={{ marginTop: 0 }}>Profile</h2>
        <p className="muted">User ID: {profile.userId}</p>
      </section>
      <section className="card">
        <h3 style={{ marginTop: 0 }}>Stats</h3>
        <p>Total points: {profile.totalPoints}</p>
        <p>Best session: {profile.bestSession}</p>
        <p>Verses completed: {profile.versesCompleted}</p>
        <p>Current streak: {profile.currentStreak} days</p>
      </section>
    </main>
  );
}
