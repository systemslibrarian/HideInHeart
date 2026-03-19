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
      <h2 style={{ marginTop: 0 }}>Leaderboard</h2>
      <p className="muted">Top memorization scores across users.</p>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th align="left">Rank</th>
            <th align="left">Player</th>
            <th align="left">Total</th>
            <th align="left">Best Session</th>
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
