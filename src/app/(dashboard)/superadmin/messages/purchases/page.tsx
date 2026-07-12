"use client";
export const dynamic = "force-dynamic";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";

interface SmsPurchase {
  id: string;
  tenantId: string;
  tenant?: { name: string; email: string };
  bundle: string;
  smsCount: number;
  amount: number;
  status: string;
  paymentRef: string | null;
  createdAt: string;
}

export default function SASmsPurchasesPage() {
  const [purchases, setPurchases] = useState<SmsPurchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [selcomConfig, setSelcomConfig] = useState<any>(null);

  useEffect(() => {
    load();
    fetch("/api/superadmin/selcom-config").then(r => r.json()).then(d => setSelcomConfig(d.config));
  }, []);

  async function load() {
    setLoading(true);
    try {
      const d = await fetch("/api/superadmin/sms-purchases").then(r => r.json());
      setPurchases(d.purchases || []);
    } catch { }
    setLoading(false);
  }

  const statusColor: Record<string, [string, string]> = {
    PAID:    ["#f0fdf4", "#16a34a"],
    PENDING: ["#fffbeb", "#b45309"],
    FAILED:  ["#fef2f2", "#dc2626"],
  };

  const totalSms = purchases.filter(p => p.status === "PAID").reduce((s, p) => s + p.smsCount, 0);
  const totalRev = purchases.filter(p => p.status === "PAID").reduce((s, p) => s + p.amount, 0);

  const S: Record<string, React.CSSProperties> = {
    page: { padding: 24, fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" },
    h1:   { fontSize: 22, fontWeight: 800, color: "#111", margin: 0 },
    sub:  { fontSize: 13, color: "#6b7280", marginTop: 4, marginBottom: 24 },
    cards:{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 14, marginBottom: 24 },
    card: { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: "16px 20px", boxShadow: "0 1px 4px rgba(0,0,0,.04)" },
    tblW: { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,.04)" },
    th:   { padding: "11px 14px", fontSize: 11, fontWeight: 700, color: "#9ca3af", textAlign: "left" as const, textTransform: "uppercase" as const, borderBottom: "2px solid #e5e7eb", background: "#f9fafb" },
    td:   { padding: "13px 14px", fontSize: 13, color: "#374151", borderBottom: "1px solid #f3f4f6" },
  };

  return (
    <div style={S.page}>
      <h1 style={S.h1}>💳 Manunuzi ya SMS — Tenants</h1>
      <p style={S.sub}>Manunuzi yote ya bundi za SMS kutoka kwa tenants kupitia Selcom</p>

      {/* Selcom config status */}
      {!selcomConfig && (
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 12, padding: "12px 16px", marginBottom: 20, fontSize: 13, color: "#dc2626" }}>
          ⚠️ Selcom API haijawekwa. <a href="/superadmin/settings" style={{ color: "#dc2626", fontWeight: 700 }}>Nenda Settings →</a>
        </div>
      )}
      {selcomConfig && (
        <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 12, padding: "12px 16px", marginBottom: 20, fontSize: 13, color: "#16a34a" }}>
          ✅ Selcom API imewekwa — Vendor ID: <strong>{selcomConfig.vendorId}</strong> ({selcomConfig.environment})
        </div>
      )}

      {/* Summary */}
      <div style={S.cards}>
        <div style={{ ...S.card, borderLeft: "4px solid #16a34a" }}>
          <div style={{ fontSize: 24, fontWeight: 900, color: "#16a34a" }}>{totalSms.toLocaleString()}</div>
          <div style={{ fontSize: 11, color: "#6b7280", marginTop: 4, fontWeight: 600, textTransform: "uppercase" as const }}>SMS Zilizouzwa</div>
        </div>
        <div style={{ ...S.card, borderLeft: "4px solid #2563eb" }}>
          <div style={{ fontSize: 22, fontWeight: 900, color: "#2563eb" }}>TZS {totalRev.toLocaleString()}</div>
          <div style={{ fontSize: 11, color: "#6b7280", marginTop: 4, fontWeight: 600, textTransform: "uppercase" as const }}>Mapato (Malipo)</div>
        </div>
        <div style={{ ...S.card, borderLeft: "4px solid #f59e0b" }}>
          <div style={{ fontSize: 24, fontWeight: 900, color: "#f59e0b" }}>{purchases.filter(p => p.status === "PENDING").length}</div>
          <div style={{ fontSize: 11, color: "#6b7280", marginTop: 4, fontWeight: 600, textTransform: "uppercase" as const }}>Yanayosubiri</div>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 60, color: "#9ca3af" }}>⏳ Inapakia…</div>
      ) : (
        <div style={S.tblW}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr>
              <th style={S.th}>Tenant</th>
              <th style={S.th}>Bundi</th>
              <th style={S.th}>SMS</th>
              <th style={S.th}>Kiasi (TZS)</th>
              <th style={S.th}>Hali</th>
              <th style={S.th}>Ref ya Malipo</th>
              <th style={S.th}>Tarehe</th>
            </tr></thead>
            <tbody>
              {purchases.length === 0 && (
                <tr><td colSpan={7} style={{ ...S.td, textAlign: "center" as const, padding: "40px 0", color: "#9ca3af" }}>Hakuna manunuzi bado</td></tr>
              )}
              {purchases.map(p => {
                const [bg, clr] = statusColor[p.status] || ["#f3f4f6", "#374151"];
                return (
                  <tr key={p.id}>
                    <td style={S.td}>
                      <div style={{ fontWeight: 700 }}>{p.tenant?.name || "—"}</div>
                      <div style={{ fontSize: 11, color: "#9ca3af" }}>{p.tenant?.email}</div>
                    </td>
                    <td style={{ ...S.td, fontWeight: 600, color: "#7c3aed" }}>{p.bundle}</td>
                    <td style={{ ...S.td, fontWeight: 700 }}>{p.smsCount.toLocaleString()}</td>
                    <td style={{ ...S.td, fontWeight: 800, color: "#111" }}>{p.amount.toLocaleString()}</td>
                    <td style={S.td}><span style={{ display: "inline-block", padding: "3px 12px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: bg, color: clr }}>{p.status}</span></td>
                    <td style={{ ...S.td, fontFamily: "monospace", fontSize: 12 }}>{p.paymentRef || "—"}</td>
                    <td style={{ ...S.td, fontSize: 11, color: "#9ca3af" }}>{new Date(p.createdAt).toLocaleDateString("en-GB")}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
