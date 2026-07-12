"use client";
export const dynamic = "force-dynamic";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";

const fmt = (n: number) => "TZS " + (n || 0).toLocaleString("en-TZ", { minimumFractionDigits: 0 });

const statusColor: Record<string, [string,string]> = {
  ACTIVE:    ["#f0fdf4","#16a34a"],
  TRIAL:     ["#fffbeb","#b45309"],
  SUSPENDED: ["#fef2f2","#dc2626"],
  EXPIRED:   ["#f3f4f6","#6b7280"],
  CANCELLED: ["#fef2f2","#dc2626"],
};

export default function SuperAdminAccountsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"subscriptions"|"sales">("subscriptions");
  const [subFilter, setSubFilter] = useState("ALL");

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/superadmin/revenue");
      if (!res.ok) throw new Error();
      setData(await res.json());
    } catch { toast.error("Failed to load"); }
    setLoading(false);
  }

  const S: Record<string, React.CSSProperties> = {
    page:  { padding: 24, fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif", maxWidth: 1200 },
    hdr:   { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 },
    h1:    { fontSize: 22, fontWeight: 800, color: "#111", margin: 0 },
    sub:   { fontSize: 13, color: "#6b7280", marginTop: 4 },
    cards: { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(190px,1fr))", gap: 14, marginBottom: 24 },
    card:  { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: "18px 20px", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" },
    cnum:  { fontSize: 22, fontWeight: 900 },
    clbl:  { fontSize: 11, color: "#6b7280", marginTop: 4, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: "0.04em" },
    tabBar:{ display: "flex", gap: 4, background: "#f3f4f6", padding: 4, borderRadius: 12, marginBottom: 16, width: "fit-content" },
    tblW:  { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" },
    th:    { padding: "11px 14px", fontSize: 11, fontWeight: 700, color: "#9ca3af", textAlign: "left" as const, textTransform: "uppercase" as const, borderBottom: "2px solid #e5e7eb", background: "#f9fafb" },
    td:    { padding: "13px 14px", fontSize: 13, color: "#374151", borderBottom: "1px solid #f3f4f6", verticalAlign: "middle" as const },
  };

  const tabBtn = (active: boolean): React.CSSProperties => ({
    padding: "8px 18px", borderRadius: 9, fontSize: 13, fontWeight: 700, border: "none", cursor: "pointer",
    background: active ? "#fff" : "transparent", color: active ? "#2563eb" : "#6b7280",
    boxShadow: active ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
  });

  const filteredSubs = (data?.subscriptions || []).filter((s: any) =>
    subFilter === "ALL" ? true : s.status === subFilter
  );

  const summaryCards = [
    { label: "Total Revenue", val: fmt((data?.totalRevenue || 0)), color: "#16a34a", icon: "💰" },
    { label: "Subscription Revenue", val: fmt(data?.subscriptionRevenue || 0), color: "#7c3aed", icon: "🔄" },
    { label: "Tenant Sales Revenue", val: fmt(data?.totalTenantSalesRevenue || 0), color: "#2563eb", icon: "🛒" },
    { label: "This Month (Subs)", val: fmt(data?.monthlySubscriptionRevenue || 0), color: "#f59e0b", icon: "📅" },
    { label: "This Month (Sales)", val: fmt(data?.monthlyTenantSalesRevenue || 0), color: "#0891b2", icon: "📈" },
    { label: "Active Subscriptions", val: String((data?.subscriptions||[]).filter((s:any)=>s.status==="ACTIVE").length), color: "#16a34a", icon: "✅" },
  ];

  return (
    <div style={S.page}>
      <div style={S.hdr}>
        <div>
          <h1 style={S.h1}>💰 Accounts & Revenue</h1>
          <p style={S.sub}>Subscription payments + tenant sales revenue from all PhidPOS tenants</p>
        </div>
        <button onClick={load} style={{ padding: "8px 16px", background: "#f3f4f6", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
          ↻ Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div style={S.cards}>
        {summaryCards.map((c, i) => (
          <div key={i} style={{ ...S.card, borderLeft: `4px solid ${c.color}` }}>
            <div style={{ fontSize: 20, marginBottom: 6 }}>{c.icon}</div>
            <div style={{ ...S.cnum, color: c.color }}>{c.val}</div>
            <div style={S.clbl}>{c.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={S.tabBar}>
        <button style={tabBtn(tab === "subscriptions")} onClick={() => setTab("subscriptions")}>📋 Subscriptions</button>
        <button style={tabBtn(tab === "sales")} onClick={() => setTab("sales")}>🛒 Tenant Sales</button>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "#9ca3af" }}>⏳ Loading…</div>
      ) : tab === "subscriptions" ? (
        <>
          <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" as const }}>
            {["ALL","ACTIVE","TRIAL","SUSPENDED","EXPIRED"].map(f => (
              <button key={f} onClick={() => setSubFilter(f)} style={{
                padding: "5px 14px", borderRadius: 20, border: "1px solid #e5e7eb", fontSize: 12, fontWeight: 700, cursor: "pointer",
                background: subFilter === f ? "#2563eb" : "#fff", color: subFilter === f ? "#fff" : "#374151",
              }}>{f}</button>
            ))}
          </div>
          <div style={S.tblW}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr>
                <th style={S.th}>Tenant</th>
                <th style={S.th}>Plan</th>
                <th style={S.th}>Amount (TZS)</th>
                <th style={S.th}>Status</th>
                <th style={S.th}>Start</th>
                <th style={S.th}>End</th>
              </tr></thead>
              <tbody>
                {filteredSubs.map((s: any) => {
                  const [sbg,sclr] = statusColor[s.status] || ["#f3f4f6","#374151"];
                  return (
                    <tr key={s.id}>
                      <td style={S.td}>
                        <div style={{ fontWeight: 700, color: "#1d4ed8" }}>{s.tenant?.name||"—"}</div>
                        <div style={{ fontSize: 11, color: "#9ca3af" }}>{s.tenant?.email}</div>
                      </td>
                      <td style={{ ...S.td, color: "#7c3aed", fontWeight: 600 }}>{s.plan?.name||"—"}</td>
                      <td style={{ ...S.td, fontWeight: 800, color: "#111" }}>{Number(s.amount).toLocaleString()}</td>
                      <td style={S.td}><span style={{ display:"inline-block",padding:"3px 12px",borderRadius:20,fontSize:11,fontWeight:700,background:sbg,color:sclr }}>{s.status}</span></td>
                      <td style={{ ...S.td, fontSize: 12, color: "#6b7280" }}>{new Date(s.startDate).toLocaleDateString("en-GB")}</td>
                      <td style={{ ...S.td, fontSize: 12, color: "#6b7280" }}>{new Date(s.endDate).toLocaleDateString("en-GB")}</td>
                    </tr>
                  );
                })}
                {filteredSubs.length === 0 && <tr><td colSpan={6} style={{ ...S.td, textAlign:"center" as const, padding:"40px 0", color:"#9ca3af" }}>No records</td></tr>}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div style={S.tblW}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr>
              <th style={S.th}>Tenant</th>
              <th style={S.th}>Email</th>
              <th style={S.th}>Total Sales</th>
              <th style={S.th}>Total Revenue (TZS)</th>
            </tr></thead>
            <tbody>
              {(data?.tenantSalesRows || []).map((r: any) => (
                <tr key={r.tenantId}>
                  <td style={{ ...S.td, fontWeight: 700, color: "#1d4ed8" }}>{r.tenantName}</td>
                  <td style={{ ...S.td, fontSize: 12, color: "#6b7280" }}>{r.tenantEmail}</td>
                  <td style={{ ...S.td, color: "#374151" }}>{r.totalSales} transactions</td>
                  <td style={{ ...S.td, fontWeight: 800, color: "#16a34a", fontSize: 14 }}>{fmt(r.totalRevenue)}</td>
                </tr>
              ))}
              {(data?.tenantSalesRows || []).length === 0 && (
                <tr><td colSpan={4} style={{ ...S.td, textAlign:"center" as const, padding:"40px 0", color:"#9ca3af" }}>No sales recorded yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
