"use client";
export const dynamic = "force-dynamic";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";

const BUNDLES = [
  { id: "SMALL",  label: "Bundi Ndogo",   sms: 500,  price: 5000,  color: "#2563eb", bg: "#eff6ff", desc: "Bora kwa biashara ndogo" },
  { id: "MEDIUM", label: "Bundi ya Kati", sms: 1000, price: 9000,  color: "#7c3aed", bg: "#f5f3ff", desc: "Chaguo maarufu" },
  { id: "LARGE",  label: "Bundi Kubwa",   sms: 5000, price: 40000, color: "#16a34a", bg: "#f0fdf4", desc: "Bora kwa thamani" },
];

export default function TenantBuySmsBundlePage() {
  const [smsBalance, setSmsBalance] = useState<number | null>(null);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [selcomAvailable, setSelcomAvailable] = useState(false);
  const [phone, setPhone] = useState("");
  const [selectedBundle, setSelectedBundle] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/messages/sms-balance").then(r => r.json()).then(d => {
      setSmsBalance(d.balance ?? null);
      setSelcomAvailable(d.selcomAvailable ?? false);
    }).catch(() => { setSmsBalance(null); setSelcomAvailable(false); });

    fetch("/api/messages/sms-purchases").then(r => r.json()).then(d => {
      setHistory(d.purchases || []);
    }).catch(() => {});
  }, []);

  async function initiatePurchase(bundleId: string) {
    if (!phone.trim()) { toast.error("Weka nambari ya simu ya Selcom/M-Pesa"); return; }
    setPurchasing(bundleId);
    try {
      const res = await fetch("/api/messages/sms-purchases", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bundle: bundleId, phone }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      toast.success(d.message || "Ombi la malipo limetumwa — angalia simu yako");
      // Reload balance and history
      fetch("/api/messages/sms-balance").then(r => r.json()).then(d => setSmsBalance(d.balance ?? null));
      fetch("/api/messages/sms-purchases").then(r => r.json()).then(d => setHistory(d.purchases || []));
      setSelectedBundle(null);
    } catch (e: any) { toast.error(e.message || "Imeshindwa — jaribu tena"); }
    setPurchasing(null);
  }

  const S: Record<string, React.CSSProperties> = {
    page:    { padding: 24, fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" },
    h1:      { fontSize: 22, fontWeight: 800, color: "#111", margin: 0 },
    sub:     { fontSize: 13, color: "#6b7280", marginTop: 4, marginBottom: 24 },
    balance: { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: "18px 24px", marginBottom: 24, display: "flex", alignItems: "center", gap: 16, boxShadow: "0 1px 4px rgba(0,0,0,.04)" },
    bundles: { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 16, marginBottom: 28 },
    bcard:   { borderRadius: 14, padding: "20px 22px", border: "2px solid transparent", cursor: "pointer", transition: "border-color 0.15s" },
    inp:     { width: "100%", padding: "10px 12px", border: "1px solid #e5e7eb", borderRadius: 10, fontSize: 13, outline: "none", boxSizing: "border-box" as const },
    tblW:    { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,.04)" },
    th:      { padding: "10px 14px", fontSize: 11, fontWeight: 700, color: "#9ca3af", textAlign: "left" as const, textTransform: "uppercase" as const, borderBottom: "1px solid #e5e7eb", background: "#f9fafb" },
    td:      { padding: "11px 14px", fontSize: 13, color: "#374151", borderBottom: "1px solid #f3f4f6" },
  };

  const statusClr: Record<string, [string, string]> = {
    PAID: ["#f0fdf4", "#16a34a"], PENDING: ["#fffbeb", "#b45309"], FAILED: ["#fef2f2", "#dc2626"],
  };

  return (
    <div style={S.page}>
      <h1 style={S.h1}>💳 Nunua SMS</h1>
      <p style={S.sub}>Nunua bundi za SMS kupitia Selcom ili uendelee kutuma ujumbe kwa wateja wako</p>

      {/* Balance */}
      <div style={S.balance}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>📱</div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase" as const, letterSpacing: "0.04em" }}>Salio la SMS</div>
          <div style={{ fontSize: 26, fontWeight: 900, color: smsBalance === null ? "#9ca3af" : "#111" }}>
            {smsBalance === null ? "—" : smsBalance.toLocaleString()} <span style={{ fontSize: 14, fontWeight: 600, color: "#6b7280" }}>SMS</span>
          </div>
        </div>
        {!selcomAvailable && (
          <div style={{ marginLeft: "auto", padding: "8px 14px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, fontSize: 12, color: "#dc2626" }}>
            ⚠️ Selcom haijaungwa — wasiliana na msimamizi
          </div>
        )}
      </div>

      {/* Bundle cards */}
      <div style={S.bundles}>
        {BUNDLES.map(b => (
          <div key={b.id} style={{
            ...S.bcard, background: b.bg,
            borderColor: selectedBundle === b.id ? b.color : `${b.color}30`,
            boxShadow: selectedBundle === b.id ? `0 0 0 3px ${b.color}30` : "none",
          }} onClick={() => setSelectedBundle(selectedBundle === b.id ? null : b.id)}>
            <div style={{ fontSize: 16, fontWeight: 800, color: b.color }}>{b.label}</div>
            <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>{b.desc}</div>
            <div style={{ marginTop: 14, display: "flex", alignItems: "baseline", gap: 8 }}>
              <span style={{ fontSize: 28, fontWeight: 900, color: b.color }}>{b.sms.toLocaleString()}</span>
              <span style={{ fontSize: 13, color: "#6b7280" }}>SMS</span>
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#111", marginTop: 4 }}>TZS {b.price.toLocaleString()}</div>
            <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>= TZS {(b.price / b.sms).toFixed(1)} kwa SMS moja</div>
          </div>
        ))}
      </div>

      {/* Purchase form */}
      {selectedBundle && (
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: 24, maxWidth: 480, marginBottom: 28, boxShadow: "0 1px 4px rgba(0,0,0,.04)" }}>
          {(() => {
            const b = BUNDLES.find(x => x.id === selectedBundle)!;
            return (
              <>
                <div style={{ fontSize: 15, fontWeight: 800, color: "#111", marginBottom: 4 }}>
                  Nunua {b.label} — TZS {b.price.toLocaleString()}
                </div>
                <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 16 }}>Weka nambari ya Selcom / M-Pesa ya kulipa. Utapata ujumbe wa kuthibitisha.</p>
                <label style={{ fontSize: 13, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6 }}>Nambari ya Simu (Selcom/M-Pesa) *</label>
                <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+255700000000" style={{ ...S.inp, marginBottom: 16 }} />
                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={() => setSelectedBundle(null)} style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: "1px solid #e5e7eb", background: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", color: "#374151" }}>
                    Ghairi
                  </button>
                  <button onClick={() => initiatePurchase(b.id)} disabled={!!purchasing}
                    style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: "none", background: b.color, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", opacity: purchasing ? 0.6 : 1 }}>
                    {purchasing === b.id ? "Inawasilisha…" : "💳 Lipa Sasa"}
                  </button>
                </div>
              </>
            );
          })()}
        </div>
      )}

      {/* Purchase history */}
      {history.length > 0 && (
        <>
          <div style={{ fontSize: 15, fontWeight: 800, color: "#111", marginBottom: 12 }}>📋 Historia ya Manunuzi</div>
          <div style={S.tblW}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr>
                <th style={S.th}>Bundi</th>
                <th style={S.th}>SMS</th>
                <th style={S.th}>Kiasi</th>
                <th style={S.th}>Hali</th>
                <th style={S.th}>Tarehe</th>
              </tr></thead>
              <tbody>
                {history.map((p: any) => {
                  const [bg, clr] = statusClr[p.status] || ["#f3f4f6", "#374151"];
                  return (
                    <tr key={p.id}>
                      <td style={{ ...S.td, fontWeight: 600 }}>{p.bundle}</td>
                      <td style={S.td}>{p.smsCount?.toLocaleString()}</td>
                      <td style={{ ...S.td, fontWeight: 700 }}>TZS {p.amount?.toLocaleString()}</td>
                      <td style={S.td}><span style={{ display: "inline-block", padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: bg, color: clr }}>{p.status}</span></td>
                      <td style={{ ...S.td, fontSize: 11, color: "#9ca3af" }}>{new Date(p.createdAt).toLocaleDateString("en-GB")}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
