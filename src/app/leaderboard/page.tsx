"use client";

import { useEffect, useState } from "react";

type Row = {
  user_id: string;
  display_name: string;
  total_points: number;
  best_session: number;
};

export default function LeaderboardPage() {
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    async function load() {
      const response = await fetch("/api/leaderboard");
      const payload = (await response.json()) as { rows: Row[] };
      setRows(payload.rows);
    }

    void load();
  }, []);

  return (
    <main className="card">
      <h1 style={{ marginTop: 0, fontFamily: "'Fraunces', Georgia, serif" }}>Leaderboard</h1>
      <p className="muted">Top memorization scores across users.</p>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <caption className="sr-only">User rankings by memorization score</caption>
        <thead>
          <tr>
            <th scope="col" align="left">Rank</th>
            <th scope="col" align="left">Player</th>
            <th scope="col" align="left">Total</th>
            <th scope="col" align="left">Best Session</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={row.user_id}>
              <td>{index + 1}</td>
              <td>{row.display_name}</td>
              <td>{row.total_points}</td>
              <td>{row.best_session}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
