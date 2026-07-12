"use client";
export const dynamic = "force-dynamic";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";

export default function SuperAdminAccountsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/superadmin/revenue");
      if (!res.ok) throw new Error();
      setData(await res.json());
    } catch { toast.error("Failed to load revenue"); }
    setLoading(false);
  }

  const statusColor: Record<string, [string, string]> = {
    ACTIVE:    ["#f0fdf4", "#16a34a"],
    TRIAL:     ["#fffbeb", "#b45309"],
    SUSPENDED: ["#fef2f2", "#dc2626"],
    EXPIRED:   ["#f3f4f6", "#6b7280"],
    CANCELLED: ["#fef2f2", "#dc2626"],
  };

  const filtered = (data?.subscriptions || []).filter((s: any) =>
    filter === "ALL" ? true : s.status === filter
  );

  const S: Record<string, React.CSSProperties> = {
    page:   { padding: 24, fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" },
    hdr:    { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 },
    h1:     { fontSize: 22, fontWeight: 800, color: "#111", margin: 0 },
    sub:    { fontSize: 13, color: "#6b7280", marginTop: 4 },
    cards:  { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 16, marginBottom: 24 },
    card:   { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: "18px 20px", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" },
    cnum:   { fontSize: 26, fontWeight: 900, color: "#111" },
    clbl:   { fontSize: 12, color: "#6b7280", marginTop: 4 },
    tblW:   { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" },
    th:     { padding: "11px 14px", fontSize: 11, fontWeight: 700, color: "#9ca3af", textAlign: "left" as const, textTransform: "uppercase" as const, borderBottom: "2px solid #e5e7eb", background: "#f9fafb" },
    td:     { padding: "13px 14px", fontSize: 13, color: "#374151", borderBottom: "1px solid #f3f4f6", verticalAlign: "middle" as const },
    filterRow: { display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" as const },
  };

  return (
    <div style={S.page}>
      <div style={S.hdr}>
        <div>
          <h1 style={S.h1}>Accounts & Revenue</h1>
          <p style={S.sub}>All subscription payments and revenue from tenants</p>
        </div>
        <button onClick={load} style={{ padding: "8px 16px", background: "#f3f4f6", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", color: "#374151" }}>
          ↻ Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div style={S.cards}>
        <div style={{ ...S.card, borderLeft: "4px solid #16a34a" }}>
          <div style={{ ...S.cnum, color: "#16a34a" }}>
            TZS {(data?.totalRevenue || 0).toLocaleString()}
          </div>
          <div style={S.clbl}>Total Revenue (Active)</div>
        </div>
        <div style={{ ...S.card, borderLeft: "4px solid #2563eb" }}>
          <div style={{ ...S.cnum, color: "#2563eb" }}>
            TZS {(data?.monthlyRevenue || 0).toLocaleString()}
          </div>
          <div style={S.clbl}>This Month Revenue</div>
        </div>
        <div style={{ ...S.card, borderLeft: "4px solid #7c3aed" }}>
          <div style={{ ...S.cnum, color: "#7c3aed" }}>
            {(data?.subscriptions || []).filter((s: any) => s.status === "ACTIVE").length}
          </div>
          <div style={S.clbl}>Active Subscriptions</div>
        </div>
        <div style={{ ...S.card, borderLeft: "4px solid #f59e0b" }}>
          <div style={{ ...S.cnum, color: "#f59e0b" }}>
            {(data?.subscriptions || []).filter((s: any) => s.status === "TRIAL").length}
          </div>
          <div style={S.clbl}>Trial Subscriptions</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={S.filterRow}>
        {["ALL", "ACTIVE", "TRIAL", "SUSPENDED", "EXPIRED"].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: "6px 16px", borderRadius: 20, border: "1px solid #e5e7eb",
            background: filter === f ? "#2563eb" : "#fff",
            color: filter === f ? "#fff" : "#374151",
            fontSize: 12, fontWeight: 700, cursor: "pointer",
          }}>{f}</button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "#9ca3af" }}>⏳ Loading…</div>
      ) : (
        <div style={S.tblW}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={S.th}>Tenant</th>
                <th style={S.th}>Plan</th>
                <th style={S.th}>Billing</th>
                <th style={S.th}>Amount (TZS)</th>
                <th style={S.th}>Status</th>
                <th style={S.th}>Start Date</th>
                <th style={S.th}>End Date</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s: any) => {
                const [sbg, sclr] = statusColor[s.status] || ["#f3f4f6", "#374151"];
                return (
                  <tr key={s.id}>
                    <td style={S.td}>
                      <div style={{ fontWeight: 700, color: "#111" }}>{s.tenant?.name || "—"}</div>
                      <div style={{ fontSize: 11, color: "#9ca3af" }}>{s.tenant?.email}</div>
                    </td>
                    <td style={S.td}>
                      <span style={{ display: "inline-block", padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: "#eff6ff", color: "#2563eb" }}>
                        {s.plan?.name || "—"}
                      </span>
                    </td>
                    <td style={{ ...S.td, color: "#6b7280" }}>{s.billingCycle}</td>
                    <td style={{ ...S.td, fontWeight: 700, color: "#111" }}>
                      {Number(s.amount).toLocaleString()}
                    </td>
                    <td style={S.td}>
                      <span style={{ display: "inline-block", padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: sbg, color: sclr }}>
                        {s.status}
                      </span>
                    </td>
                    <td style={{ ...S.td, color: "#6b7280", fontSize: 12 }}>
                      {new Date(s.startDate).toLocaleDateString("en-GB")}
                    </td>
                    <td style={{ ...S.td, color: "#6b7280", fontSize: 12 }}>
                      {new Date(s.endDate).toLocaleDateString("en-GB")}
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={7} style={{ ...S.td, textAlign: "center" as const, padding: "40px 0", color: "#9ca3af" }}>No records found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
