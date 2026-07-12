"use client";
export const dynamic = "force-dynamic";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";

export default function SAMessagesSendPage() {
  const [tenants, setTenants] = useState<any[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/superadmin/tenants").then(r => r.json()).then(d => setTenants(d.tenants || []));
  }, []);

  function toggleAll() {
    setSelected(s => s.length === tenants.length ? [] : tenants.map((t: any) => t.id));
  }

  function toggle(id: string) {
    setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  }

  async function send() {
    if (!message.trim()) { toast.error("Andika ujumbe kwanza"); return; }
    setSending(true);
    try {
      const res = await fetch("/api/superadmin/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantIds: selected.length ? selected : [], message }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      const sent = (d.results || []).filter((r: any) => r.ok).length;
      const failed = (d.results || []).filter((r: any) => !r.ok).length;
      toast.success(`Imetumwa: ${sent} | Imeshindwa: ${failed}`);
      setResults(d.results || []);
      setMessage(""); setSelected([]);
    } catch (e: any) { toast.error(e.message || "Imeshindwa"); }
    setSending(false);
  }

  const S: Record<string, React.CSSProperties> = {
    page:  { padding: 24, fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" },
    h1:    { fontSize: 22, fontWeight: 800, color: "#111", margin: 0 },
    sub:   { fontSize: 13, color: "#6b7280", marginTop: 4, marginBottom: 24 },
    grid:  { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 },
    card:  { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: 20, boxShadow: "0 1px 4px rgba(0,0,0,.04)" },
    lbl:   { fontSize: 13, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6 },
    ta:    { width: "100%", padding: "10px 12px", border: "1px solid #e5e7eb", borderRadius: 10, fontSize: 13, outline: "none", resize: "vertical" as const, minHeight: 120, boxSizing: "border-box" as const },
    btn:   { padding: "10px 28px", background: "#7c3aed", color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer", marginTop: 14 },
    chkRow:{ display: "flex", alignItems: "center", gap: 8, padding: "8px 8px", borderRadius: 8, cursor: "pointer" },
    th:    { padding: "9px 12px", fontSize: 11, fontWeight: 700, color: "#9ca3af", textAlign: "left" as const, textTransform: "uppercase" as const, borderBottom: "1px solid #e5e7eb", background: "#f9fafb" },
    td:    { padding: "10px 12px", fontSize: 13, color: "#374151", borderBottom: "1px solid #f3f4f6" },
  };

  return (
    <div style={S.page}>
      <h1 style={S.h1}>📤 Tuma Ujumbe kwa Tenants</h1>
      <p style={S.sub}>Tuma SMS kwa tenants wote au waliochaguliwa kupitia Beem Africa (Sender: PHIDTECH)</p>

      <div style={S.grid}>
        {/* Tenant list */}
        <div style={S.card}>
          <label style={S.lbl}>Chagua Tenants</label>
          <label style={{ ...S.chkRow, borderBottom: "1px solid #f3f4f6", marginBottom: 6 }}>
            <input type="checkbox" checked={selected.length === tenants.length && tenants.length > 0}
              onChange={toggleAll} style={{ accentColor: "#7c3aed" }} />
            <span style={{ fontSize: 13, fontWeight: 700 }}>Wote ({tenants.length})</span>
          </label>
          <div style={{ maxHeight: 360, overflowY: "auto" }}>
            {tenants.map((t: any) => (
              <label key={t.id} style={{ ...S.chkRow, background: selected.includes(t.id) ? "#f5f3ff" : "transparent" }}>
                <input type="checkbox" checked={selected.includes(t.id)} onChange={() => toggle(t.id)}
                  style={{ accentColor: "#7c3aed" }} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#111" }}>{t.name}</div>
                  <div style={{ fontSize: 11, color: "#9ca3af" }}>{t.phone || t.email || "Hakuna mawasiliano"}</div>
                </div>
              </label>
            ))}
            {tenants.length === 0 && <div style={{ padding: "20px 0", textAlign: "center" as const, color: "#9ca3af", fontSize: 13 }}>Hakuna tenants</div>}
          </div>
          <div style={{ marginTop: 10, fontSize: 12, color: "#7c3aed", fontWeight: 600 }}>
            {selected.length ? `${selected.length} wamechaguliwa` : "Wote watachaguliwa"}
          </div>
        </div>

        {/* Message */}
        <div style={S.card}>
          <label style={S.lbl}>Ujumbe *</label>
          <textarea value={message} onChange={e => setMessage(e.target.value)}
            placeholder="Andika ujumbe hapa…" style={S.ta} />
          <div style={{ fontSize: 12, color: message.length > 160 ? "#dc2626" : "#9ca3af", marginTop: 4 }}>
            {message.length}/160 chars
          </div>
          <div style={{ marginTop: 12, padding: "10px 14px", background: "#f5f3ff", borderRadius: 10, border: "1px solid #ddd6fe" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#7c3aed" }}>📡 Sender ID: PHIDTECH</div>
            <div style={{ fontSize: 11, color: "#7c3aed", marginTop: 2, opacity: 0.7 }}>Powered by Beem Africa</div>
          </div>
          <button onClick={send} disabled={sending} style={{ ...S.btn, opacity: sending ? 0.6 : 1 }}>
            {sending ? "Inatuma…" : "📤 Tuma Ujumbe"}
          </button>
        </div>
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div style={{ marginTop: 24, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, overflow: "hidden" }}>
          <div style={{ padding: "12px 16px", borderBottom: "1px solid #e5e7eb", fontWeight: 700, fontSize: 14 }}>📋 Matokeo ya Utumaji</div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr>
              <th style={S.th}>Tenant</th>
              <th style={S.th}>Hali</th>
            </tr></thead>
            <tbody>
              {results.map((r: any, i: number) => (
                <tr key={i}>
                  <td style={{ ...S.td, fontWeight: 600 }}>{r.name}</td>
                  <td style={S.td}>
                    <span style={{ display: "inline-block", padding: "3px 12px", borderRadius: 20, fontSize: 11, fontWeight: 700,
                      background: r.ok ? "#f0fdf4" : "#fef2f2", color: r.ok ? "#16a34a" : "#dc2626" }}>
                      {r.ok ? "✅ Imetumwa" : "❌ Imeshindwa"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
