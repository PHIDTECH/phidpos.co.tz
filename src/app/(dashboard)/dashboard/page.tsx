"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useLang } from "@/lib/i18n";

interface DashboardData {
  stats: {
    todaySales: number; todayRevenue: number; totalProducts: number;
    lowStockProducts: number; totalCustomers: number; monthlyRevenue: number;
    monthlySales: number; pendingDebt: number;
  };
  recentSales: any[];
  topProducts: any[];
  weeklyChart: any[];
}

function fmt(amount: number | string) {
  const n = typeof amount === "string" ? parseFloat(amount) : (amount || 0);
  return "TZS " + n.toLocaleString("en-TZ", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function fmtDate(d: string) {
  try { return new Date(d).toLocaleDateString("en-TZ", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }); }
  catch { return d; }
}

const css = `
  .db { padding: 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f3f4f6; min-height: 100%; }
  .db-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
  .db-title { font-size: 22px; font-weight: 800; color: #111; }
  .db-sub { font-size: 13px; color: #6b7280; margin-top: 2px; }
  .btn-refresh { padding: 8px 16px; border-radius: 8px; border: 1px solid #d1d5db; background: #fff; font-size: 13px; font-weight: 600; color: #374151; cursor: pointer; }
  .alert-box { background: #fffbeb; border: 1px solid #fcd34d; border-radius: 10px; padding: 12px 16px; font-size: 13px; color: #92400e; margin-bottom: 16px; }
  .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 20px; }
  .stat-card { background: #fff; border-radius: 12px; padding: 20px; border: 1px solid #e5e7eb; display: flex; align-items: flex-start; justify-content: space-between; }
  .stat-val { font-size: 20px; font-weight: 800; color: #111; margin: 4px 0; }
  .stat-label { font-size: 12px; color: #6b7280; font-weight: 600; text-transform: uppercase; letter-spacing: 0.03em; }
  .stat-sub { font-size: 12px; color: #9ca3af; }
  .stat-icon { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0; }
  .row2 { display: grid; grid-template-columns: 2fr 1fr; gap: 14px; margin-bottom: 20px; }
  .card { background: #fff; border-radius: 12px; padding: 20px; border: 1px solid #e5e7eb; }
  .card-title { font-size: 14px; font-weight: 700; color: #111; margin-bottom: 14px; }
  .chart-bars { display: flex; align-items: flex-end; gap: 6px; height: 120px; padding-top: 10px; }
  .chart-bar-wrap { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px; }
  .chart-bar { width: 100%; background: #2563eb; border-radius: 4px 4px 0 0; min-height: 4px; transition: height 0.3s; }
  .chart-label { font-size: 10px; color: #9ca3af; }
  .top-item { display: flex; align-items: center; gap: 10px; padding: 8px 0; border-bottom: 1px solid #f3f4f6; }
  .top-num { width: 22px; height: 22px; border-radius: 50%; background: #dbeafe; color: #2563eb; font-size: 11px; font-weight: 800; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .top-name { flex: 1; font-size: 13px; font-weight: 500; color: #111; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .top-rev { font-size: 12px; font-weight: 700; color: #374151; }
  .table-wrap { overflow-x: auto; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th { text-align: left; padding: 0 0 10px; font-size: 11px; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.04em; border-bottom: 1px solid #e5e7eb; }
  td { padding: 10px 0; border-bottom: 1px solid #f3f4f6; color: #374151; }
  td.mono { font-family: monospace; font-size: 12px; }
  td.right { text-align: right; font-weight: 700; }
  td.muted { color: #9ca3af; font-size: 12px; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 11px; font-weight: 600; }
  .badge-blue { background: #dbeafe; color: #1d4ed8; }
  .badge-gray { background: #f3f4f6; color: #6b7280; }
  .empty { padding: 32px; text-align: center; color: #9ca3af; font-size: 13px; }
  .loading-box { display: flex; align-items: center; justify-content: center; height: 200px; }
  .spinner { width: 36px; height: 36px; border: 3px solid #e5e7eb; border-top-color: #2563eb; border-radius: 50%; animation: spin 0.8s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
  @media (max-width: 900px) { .stats-grid { grid-template-columns: 1fr 1fr; } .row2 { grid-template-columns: 1fr; } }
  @media (max-width: 500px) { .stats-grid { grid-template-columns: 1fr; } }
`;

export default function DashboardPage() {
  const sessionResult = useSession();
  const session = sessionResult?.data;
  const { t, lang } = useLang();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/dashboard");
      if (!res.ok) { setError("API error: " + res.status); setLoading(false); return; }
      const json = await res.json();
      setData(json);
    } catch (e: any) {
      setError(e.message || "Failed to load");
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const userName = session?.user?.name || "User";
  const today = new Date().toLocaleDateString(lang === "sw" ? "sw-TZ" : "en-TZ", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  const statCards = [
    { label: t.todayRevenue, val: fmt(data?.stats.todayRevenue || 0), sub: `${data?.stats.todaySales || 0} ${t.transactions}`, icon: "💰", bg: "#dbeafe", color: "#2563eb" },
    { label: t.monthlyRevenue, val: fmt(data?.stats.monthlyRevenue || 0), sub: `${data?.stats.monthlySales || 0} ${t.sales}`, icon: "📈", bg: "#dcfce7", color: "#16a34a" },
    { label: t.totalProducts, val: String(data?.stats.totalProducts || 0), sub: `${data?.stats.lowStockProducts || 0} ${t.lowStock}`, icon: "📦", bg: "#f3e8ff", color: "#7c3aed" },
    { label: t.totalCustomers, val: String(data?.stats.totalCustomers || 0), sub: `${t.debt}: ${fmt(data?.stats.pendingDebt || 0)}`, icon: "👥", bg: "#ffedd5", color: "#ea580c" },
  ];

  // Simple bar chart from weeklyChart
  const chartData = data?.weeklyChart || [];
  const maxRev = Math.max(...chartData.map((d: any) => d.revenue || 0), 1);

  return (
    <>
      <style>{css}</style>
      <div className="db">
        {/* Header */}
        <div className="db-header">
          <div>
            <div className="db-title">{t.welcome}, {userName} 👋</div>
            <div className="db-sub">{today}</div>
          </div>
          <button className="btn-refresh" onClick={load}>↻ {t.refresh}</button>
        </div>

        {(data?.stats.lowStockProducts || 0) > 0 && (
          <div className="alert-box">
            ⚠️ {data!.stats.lowStockProducts} {t.lowStock}. <a href="/inventory" style={{color:"#b45309",fontWeight:700}}>{t.inventory} →</a>
          </div>
        )}

        {error && (
          <div style={{background:"#fef2f2",border:"1px solid #fecaca",borderRadius:"10px",padding:"12px 16px",fontSize:"13px",color:"#dc2626",marginBottom:"16px"}}>
            ❌ {error} — <button onClick={load} style={{color:"#dc2626",fontWeight:700,background:"none",border:"none",cursor:"pointer"}}>Jaribu tena</button>
          </div>
        )}

        {loading ? (
          <div className="loading-box"><div className="spinner" /></div>
        ) : (
          <>
            {/* Stat Cards */}
            <div className="stats-grid">
              {statCards.map((c, i) => (
                <div key={i} className="stat-card">
                  <div>
                    <div className="stat-label">{c.label}</div>
                    <div className="stat-val">{c.val}</div>
                    <div className="stat-sub">{c.sub}</div>
                  </div>
                  <div className="stat-icon" style={{background: c.bg, color: c.color}}>{c.icon}</div>
                </div>
              ))}
            </div>

            {/* Charts Row */}
            <div className="row2">
              {/* Weekly Chart */}
              <div className="card">
                <div className="card-title">{t.weeklyRevenue}</div>
                {chartData.length > 0 ? (
                  <div className="chart-bars">
                    {chartData.map((d: any, i: number) => (
                      <div key={i} className="chart-bar-wrap">
                        <div className="chart-bar" style={{height: `${Math.max(4, (d.revenue / maxRev) * 100)}px`}} title={fmt(d.revenue)} />
                        <div className="chart-label">{(d.date || "").slice(5)}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty">{t.noData}</div>
                )}
              </div>

              {/* Top Products */}
              <div className="card">
                <div className="card-title">{t.topProducts}</div>
                {(data?.topProducts || []).length > 0 ? (data?.topProducts || []).map((p: any, i: number) => (
                  <div key={i} className="top-item">
                    <div className="top-num">{i + 1}</div>
                    <div className="top-name">{p.name}</div>
                    <div className="top-rev">{fmt(p.totalRevenue)}</div>
                  </div>
                )) : <div className="empty">{t.noData}</div>}
              </div>
            </div>

            {/* Recent Sales */}
            <div className="card">
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"14px"}}>
                <div className="card-title" style={{marginBottom:0}}>{t.recentSales}</div>
                <a href="/reports" style={{fontSize:"13px",color:"#2563eb",fontWeight:600,textDecoration:"none"}}>{t.viewAll} →</a>
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>{t.receipt}</th>
                      <th>{t.customer}</th>
                      <th>{t.cashier}</th>
                      <th>{t.items}</th>
                      <th style={{textAlign:"right"}}>{t.total}</th>
                      <th>{t.date}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data?.recentSales || []).length > 0 ? (data?.recentSales || []).map((sale: any) => (
                      <tr key={sale.id}>
                        <td className="mono">{sale.receiptNumber}</td>
                        <td>{sale.customer?.name || <span style={{color:"#9ca3af"}}>{t.walkin}</span>}</td>
                        <td>{sale.user?.name}</td>
                        <td>{sale.items?.length || 0}</td>
                        <td className="right">{fmt(sale.total)}</td>
                        <td className="muted">{fmtDate(sale.createdAt)}</td>
                      </tr>
                    )) : (
                      <tr><td colSpan={6} className="empty">{t.noData}</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
