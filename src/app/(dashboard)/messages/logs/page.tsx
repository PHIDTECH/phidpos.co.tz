"use client";
export const dynamic = "force-dynamic";
import { useState, useEffect } from "react";

export default function TenantSmsLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/messages").then(r => r.json()).then(d => {
      setLogs(d.logs || []);
      setLoading(false);
    });
  }, []);

  const S: Record<string, React.CSSProperties> = {
    page: { padding: 24, fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" },
    h1:   { fontSize: 22, fontWeight: 800, color: "#111", margin: 0 },
    sub:  { fontSize: 13, color: "#6b7280", marginTop: 4, marginBottom: 24 },
    tblW: { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,.04)" },
    th:   { padding: "10px 14px", fontSize: 11, fontWeight: 700, color: "#9ca3af", textAlign: "left" as const, textTransform: "uppercase" as const, borderBottom: "1px solid #e5e7eb", background: "#f9fafb" },
    td:   { padding: "11px 14px", fontSize: 13, color: "#374151", borderBottom: "1px solid #f3f4f6" },
  };

  return (
    <div style={S.page}>
      <h1 style={S.h1}>📋 Historia ya SMS</h1>
      <p style={S.sub}>SMS zote zilizotumwa kupitia mfumo wako</p>

      {loading ? (
        <div style={{ textAlign: "center", padding: 60, color: "#9ca3af" }}>⏳ Inapakia…</div>
      ) : (
        <div style={S.tblW}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr>
              <th style={S.th}>Simu</th>
              <th style={S.th}>Ujumbe</th>
              <th style={S.th}>Hali</th>
              <th style={S.th}>Tarehe</th>
            </tr></thead>
            <tbody>
              {logs.length === 0 && (
                <tr><td colSpan={4} style={{ ...S.td, textAlign: "center" as const, padding: "40px 0", color: "#9ca3af" }}>Hakuna historia ya ujumbe</td></tr>
              )}
              {logs.map((l: any) => (
                <tr key={l.id}>
                  <td style={{ ...S.td, fontFamily: "monospace", fontSize: 12 }}>{l.to}</td>
                  <td style={{ ...S.td, maxWidth: 320, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{l.message}</td>
                  <td style={S.td}>
                    <span style={{ display: "inline-block", padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700,
                      background: l.status === "SENT" ? "#f0fdf4" : "#fef2f2",
                      color: l.status === "SENT" ? "#16a34a" : "#dc2626" }}>
                      {l.status}
                    </span>
                  </td>
                  <td style={{ ...S.td, fontSize: 11, color: "#9ca3af" }}>{new Date(l.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
