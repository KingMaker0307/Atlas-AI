"use client";

import { useEffect, useState } from "react";

export default function ExportDataPage() {
  const [status, setStatus] = useState("Click the button to export your local data");
  const [done, setDone] = useState(false);

  async function exportData() {
    setStatus("Reading local database...");
    try {
      const stores = [
        "workouts",
        "workout_plans",
        "nutrition_entries",
        "water_logs",
        "body_metrics",
        "recovery_logs",
        "profiles",
      ];

      const result: Record<string, unknown[]> = {};

      await new Promise<void>((resolve, reject) => {
        const req = indexedDB.open("atlas-ai-db");
        req.onerror = () => reject(new Error("Could not open IndexedDB"));
        req.onsuccess = (e) => {
          const db = (e.target as IDBOpenDBRequest).result;
          let pending = stores.length;

          stores.forEach((store) => {
            try {
              const tx = db.transaction(store, "readonly");
              const r = tx.objectStore(store).getAll();
              r.onsuccess = () => {
                result[store] = r.result ?? [];
                pending--;
                if (pending === 0) resolve();
              };
              r.onerror = () => {
                result[store] = [];
                pending--;
                if (pending === 0) resolve();
              };
            } catch {
              result[store] = [];
              pending--;
              if (pending === 0) resolve();
            }
          });
        };
      });

      const json = JSON.stringify(result, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "atlas-local-data.json";
      a.click();
      URL.revokeObjectURL(url);

      const counts = stores.map((s) => `${s}: ${result[s]?.length ?? 0}`).join(", ");
      setStatus(`✅ Downloaded! Counts — ${counts}`);
      setDone(true);
    } catch (err: unknown) {
      setStatus(`❌ Error: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0f0f11",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "system-ui, sans-serif",
      color: "#fff",
      padding: "2rem",
    }}>
      <div style={{
        background: "#1a1a1f",
        border: "1px solid #333",
        borderRadius: "16px",
        padding: "3rem",
        maxWidth: "480px",
        width: "100%",
        textAlign: "center",
      }}>
        <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📦</div>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.5rem" }}>
          Export Local Data
        </h1>
        <p style={{ color: "#888", marginBottom: "2rem", fontSize: "0.9rem" }}>
          This will download all your locally stored workouts, plans, nutrition,
          and recovery logs as a JSON file.
        </p>

        <button
          onClick={exportData}
          disabled={done}
          style={{
            background: done ? "#333" : "linear-gradient(135deg, #6366f1, #8b5cf6)",
            color: "#fff",
            border: "none",
            borderRadius: "10px",
            padding: "0.85rem 2rem",
            fontSize: "1rem",
            fontWeight: 600,
            cursor: done ? "default" : "pointer",
            width: "100%",
            marginBottom: "1.5rem",
            transition: "opacity 0.2s",
          }}
        >
          {done ? "✅ Exported!" : "Download My Data"}
        </button>

        <p style={{
          color: done ? "#4ade80" : "#aaa",
          fontSize: "0.85rem",
          lineHeight: 1.5,
          wordBreak: "break-word",
        }}>
          {status}
        </p>

        {done && (
          <p style={{ color: "#888", fontSize: "0.8rem", marginTop: "1rem" }}>
            📋 Now paste the downloaded <code>atlas-local-data.json</code> file
            contents back into the chat so your data can be migrated.
          </p>
        )}
      </div>
    </div>
  );
}
