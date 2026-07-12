"use client";
export const dynamic = "force-dynamic";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";

export default function SASenderIdsPage() {
  const [senderIds, setSenderIds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiKeyInput, setApiKeyInput] = useState<Record<string, string>>({});
  const [approving, setApproving] = useState<string | null>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const d = await fetch("/api/superadmin/sender-ids").then(r => r.json());
      setSenderIds(d.senderIds || []);
    } catch { toast.error("Failed to load"); }
    setLoading(false);
  }

  async function approve(tenantId: string, approve: boolean) {
    setApproving(tenantId);
    try {
      const res = await fetch("/api/superadmin/sender-ids", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId, approve, apiKey: apiKeyInput[tenantId] }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      toast.success(d.message);
      load();
    } catch (e: any) { toast.error(e.message || "Failed"); }
    setApproving(null);
  }

  const S: Record<string, React.CSSProperties> = {
    page: { padding: 24, fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" },
    h1:   { fontSize: 22, fontWeight: 800, color: "#111", margin: 0 },
    sub:  { fontSize: 13, color: "#6b7280", marginTop: 4, marginBottom: 24 },
    tblW: { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,.04)" },
    th:   { padding: "11px 14px", fontSize: 11, fontWeight: 700, color: "#9ca3af", textAlign: "left" as const, textTransform: "uppercase" as const, borderBottom: "2px solid #e5e7eb", background: "#f9fafb" },
    td:   { padding: "13px 14px", fontSize: 13, color: "#374151", borderBottom: "1px solid #f3f4f6", verticalAlign: "middle" as const },
  };

  const pending = senderIds.filter(s => s.hasApplication && !s.approved);
  const approved = senderIds.filter(s => s.approved);
  const none = senderIds.filter(s => !s.hasApplication);

  return (
    <div style={S.page}>
      <h1 style={S.h1}>🆔 Maombi ya Sender ID</h1>
      <p style={S.sub}>Idhinisha au kataa maombi ya Sender ID kutoka kwa tenants</p>

      {/* Pending banner */}
      {pending.length > 0 && (
        <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 12, padding: "12px 16px", marginBottom: 20, fontSize: 13, color: "#92400e" }}>
          ⏳ Kuna <strong>{pending.length}</strong> ombi{pending.length > 1 ? "" : ""} inayosubiri idhini
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: "center", padding: 60, color: "#9ca3af" }}>⏳ Inapakia…</div>
      ) : (
        <div style={S.tblW}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr>
              <th style={S.th}>Tenant</th>
              <th style={S.th}>Sender ID Iliyoombwa</th>
              <th style={S.th}>Hali</th>
              <th style={S.th}>Beem API Key (ya tenant)</th>
              <th style={S.th}>Vitendo</th>
            </tr></thead>
            <tbody>
              {senderIds.length === 0 && (
                <tr><td colSpan={5} style={{ ...S.td, textAlign: "center" as const, padding: "40px 0", color: "#9ca3af" }}>Hakuna maombi ya Sender ID</td></tr>
              )}
              {senderIds.map((s: any) => (
                <tr key={s.id}>
                  <td style={S.td}>
                    <div style={{ fontWeight: 700, color: "#111" }}>{s.name}</div>
                    <div style={{ fontSize: 11, color: "#9ca3af" }}>{s.email}</div>
                  </td>
                  <td style={S.td}>
                    {s.senderId
                      ? <code style={{ background: "#f3f4f6", padding: "3px 10px", borderRadius: 6, fontSize: 13, fontWeight: 700 }}>{s.senderId}</code>
                      : <span style={{ color: "#9ca3af" }}>—</span>}
                  </td>
                  <td style={S.td}>
                    <span style={{
                      display: "inline-block", padding: "3px 12px", borderRadius: 20, fontSize: 11, fontWeight: 700,
                      background: s.approved ? "#f0fdf4" : s.hasApplication ? "#fffbeb" : "#f3f4f6",
                      color: s.approved ? "#16a34a" : s.hasApplication ? "#92400e" : "#9ca3af",
                    }}>
                      {s.approved ? "✅ Imeidhinishwa" : s.hasApplication ? "⏳ Inasubiri" : "—"}
                    </span>
                  </td>
                  <td style={S.td}>
                    {s.hasApplication && !s.approved && (
                      <input
                        value={apiKeyInput[s.id] || ""}
                        onChange={e => setApiKeyInput(p => ({ ...p, [s.id]: e.target.value }))}
                        placeholder="Weka Beem API Key…"
                        style={{ padding: "7px 10px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 12, outline: "none", width: 220 }}
                      />
                    )}
                  </td>
                  <td style={S.td}>
                    <div style={{ display: "flex", gap: 8 }}>
                      {s.hasApplication && !s.approved && (
                        <button onClick={() => approve(s.id, true)} disabled={approving === s.id}
                          style={{ padding: "6px 14px", borderRadius: 8, border: "none", background: "#7c3aed", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                          {approving === s.id ? "…" : "✅ Idhinisha"}
                        </button>
                      )}
                      {s.approved && (
                        <button onClick={() => approve(s.id, false)} disabled={approving === s.id}
                          style={{ padding: "6px 14px", borderRadius: 8, border: "1px solid #fecaca", background: "#fef2f2", color: "#dc2626", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                          {approving === s.id ? "…" : "❌ Batilisha"}
                        </button>
                      )}
                    </div>
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
