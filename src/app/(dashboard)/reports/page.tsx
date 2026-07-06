"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { BarChart3, TrendingUp, Package, Users, Truck, Download, RefreshCw } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { formatCurrency, formatDate } from "@/lib/utils";

const TABS = ["sales", "inventory", "profit", "customers", "suppliers"] as const;
type ReportTab = typeof TABS[number];

export default function ReportsPage() {
  const [tab, setTab] = useState<ReportTab>("sales");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [from, setFrom] = useState(() => {
    const d = new Date(); d.setDate(1);
    return d.toISOString().split("T")[0];
  });
  const [to, setTo] = useState(() => new Date().toISOString().split("T")[0]);

  useEffect(() => { loadReport(); }, [tab, from, to]);

  async function loadReport() {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports?type=${tab}&from=${from}&to=${to}`);
      const json = await res.json();
      setData(json);
    } catch {}
    setLoading(false);
  }

  const PIE_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

  const tabIcons: Record<ReportTab, any> = {
    sales: BarChart3, inventory: Package, profit: TrendingUp, customers: Users, suppliers: Truck
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Reports & Analytics</h1>
          <p className="text-muted-foreground text-sm">Business performance insights</p>
        </div>
        <button onClick={loadReport} className="flex items-center gap-2 border px-3 py-2 rounded-lg text-sm hover:bg-muted">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Date Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">From:</label>
          <input type="date" value={from} onChange={e => setFrom(e.target.value)}
            className="px-3 py-1.5 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">To:</label>
          <input type="date" value={to} onChange={e => setTo(e.target.value)}
            className="px-3 py-1.5 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
        </div>
        {[
          { label: "Today", fn: () => { const d = new Date().toISOString().split("T")[0]; setFrom(d); setTo(d); } },
          { label: "This Month", fn: () => { const d = new Date(); setFrom(new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split("T")[0]); setTo(d.toISOString().split("T")[0]); } },
          { label: "Last Month", fn: () => { const d = new Date(); const f = new Date(d.getFullYear(), d.getMonth() - 1, 1); const t = new Date(d.getFullYear(), d.getMonth(), 0); setFrom(f.toISOString().split("T")[0]); setTo(t.toISOString().split("T")[0]); } },
        ].map(q => (
          <button key={q.label} onClick={q.fn} className="px-3 py-1.5 border rounded-lg text-sm hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700">{q.label}</button>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted p-1 rounded-xl w-fit flex-wrap">
        {TABS.map(t => {
          const Icon = tabIcons[t];
          return (
            <button key={t} onClick={() => setTab(t)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${tab === t ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
              <Icon className="w-4 h-4" />
              {t}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-32 bg-muted animate-pulse rounded-xl" />)}
        </div>
      ) : (
        <>
          {/* SALES REPORT */}
          {tab === "sales" && data && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Total Sales", value: data.summary?._count || 0, sub: "transactions" },
                  { label: "Total Revenue", value: formatCurrency(data.summary?._sum?.total || 0, "TZS"), sub: "gross revenue" },
                  { label: "Total Discount", value: formatCurrency(data.summary?._sum?.discount || 0, "TZS"), sub: "given" },
                  { label: "Outstanding Debt", value: formatCurrency(data.summary?._sum?.debtAmount || 0, "TZS"), sub: "receivable" },
                ].map((s, i) => (
                  <div key={i} className="bg-card border rounded-xl p-4">
                    <p className="text-sm text-muted-foreground">{s.label}</p>
                    <p className="text-2xl font-bold mt-1">{s.value}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{s.sub}</p>
                  </div>
                ))}
              </div>
              <div className="bg-card border rounded-xl overflow-hidden">
                <div className="px-4 py-3 border-b font-semibold">Sales Transactions</div>
                <div className="overflow-x-auto max-h-96">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 sticky top-0">
                      <tr>
                        <th className="text-left px-4 py-2 font-medium text-muted-foreground">Receipt</th>
                        <th className="text-left px-4 py-2 font-medium text-muted-foreground">Customer</th>
                        <th className="text-left px-4 py-2 font-medium text-muted-foreground">Cashier</th>
                        <th className="text-right px-4 py-2 font-medium text-muted-foreground">Total</th>
                        <th className="text-left px-4 py-2 font-medium text-muted-foreground">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.sales?.map((s: any) => (
                        <tr key={s.id} className="border-b hover:bg-muted/30">
                          <td className="px-4 py-2 font-mono text-xs">{s.receiptNumber}</td>
                          <td className="px-4 py-2">{s.customer?.name || "Walk-in"}</td>
                          <td className="px-4 py-2">{s.user?.name}</td>
                          <td className="px-4 py-2 text-right font-semibold">{formatCurrency(s.total, "TZS")}</td>
                          <td className="px-4 py-2 text-muted-foreground text-xs">{formatDate(s.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* PROFIT REPORT */}
          {tab === "profit" && data && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  { label: "Total Revenue", value: formatCurrency(data.totalRevenue || 0, "TZS"), color: "text-blue-600" },
                  { label: "Cost of Goods Sold", value: formatCurrency(data.totalCOGS || 0, "TZS"), color: "text-orange-600" },
                  { label: "Gross Profit", value: formatCurrency(data.grossProfit || 0, "TZS"), color: "text-green-600" },
                  { label: "Gross Margin", value: `${data.grossMargin || 0}%`, color: "text-purple-600" },
                  { label: "Total Expenses", value: formatCurrency(data.totalExpenses || 0, "TZS"), color: "text-red-600" },
                  { label: "Net Profit", value: formatCurrency(data.netProfit || 0, "TZS"), color: data.netProfit >= 0 ? "text-green-700" : "text-red-700" },
                ].map((s, i) => (
                  <div key={i} className="bg-card border rounded-xl p-4">
                    <p className="text-sm text-muted-foreground">{s.label}</p>
                    <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
                  </div>
                ))}
              </div>
              {/* Profit breakdown chart */}
              <div className="bg-card border rounded-xl p-5">
                <h3 className="font-semibold mb-4">Profit Breakdown</h3>
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie data={[
                      { name: "COGS", value: data.totalCOGS || 0 },
                      { name: "Gross Profit", value: Math.max(0, data.grossProfit || 0) },
                      { name: "Expenses", value: data.totalExpenses || 0 },
                    ]} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {[0, 1, 2].map(i => <Cell key={i} fill={PIE_COLORS[i]} />)}
                    </Pie>
                    <Tooltip formatter={(v: any) => formatCurrency(v, "TZS")} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* INVENTORY REPORT */}
          {tab === "inventory" && data && (
            <div className="space-y-4">
              <div className="bg-card border rounded-xl overflow-hidden">
                <div className="px-4 py-3 border-b font-semibold">Current Stock Levels</div>
                <div className="overflow-x-auto max-h-96">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 sticky top-0">
                      <tr>
                        <th className="text-left px-4 py-2 font-medium text-muted-foreground">Product</th>
                        <th className="text-left px-4 py-2 font-medium text-muted-foreground">Category</th>
                        <th className="text-left px-4 py-2 font-medium text-muted-foreground">Store</th>
                        <th className="text-right px-4 py-2 font-medium text-muted-foreground">Qty</th>
                        <th className="text-right px-4 py-2 font-medium text-muted-foreground">Min Stock</th>
                        <th className="text-left px-4 py-2 font-medium text-muted-foreground">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.inventories?.map((inv: any) => {
                        const isLow = Number(inv.quantity) <= inv.product.minStockLevel;
                        return (
                          <tr key={inv.id} className="border-b hover:bg-muted/30">
                            <td className="px-4 py-2 font-medium">{inv.product.name}</td>
                            <td className="px-4 py-2 text-muted-foreground">{inv.product.category?.name || "—"}</td>
                            <td className="px-4 py-2 text-muted-foreground">{inv.store.name}</td>
                            <td className="px-4 py-2 text-right font-semibold">{Number(inv.quantity)}</td>
                            <td className="px-4 py-2 text-right text-muted-foreground">{inv.product.minStockLevel}</td>
                            <td className="px-4 py-2">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${isLow ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
                                {isLow ? "Low Stock" : "OK"}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* CUSTOMERS REPORT */}
          {tab === "customers" && data && (
            <div className="bg-card border rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b font-semibold">Customer Report</div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left px-4 py-2 font-medium text-muted-foreground">Customer</th>
                      <th className="text-left px-4 py-2 font-medium text-muted-foreground">Type</th>
                      <th className="text-right px-4 py-2 font-medium text-muted-foreground">Total Sales</th>
                      <th className="text-right px-4 py-2 font-medium text-muted-foreground">Purchased</th>
                      <th className="text-right px-4 py-2 font-medium text-muted-foreground">Outstanding Debt</th>
                      <th className="text-right px-4 py-2 font-medium text-muted-foreground">Loyalty Pts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.customers?.map((c: any) => (
                      <tr key={c.id} className="border-b hover:bg-muted/30">
                        <td className="px-4 py-2 font-medium">{c.name}</td>
                        <td className="px-4 py-2"><span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs">{c.type}</span></td>
                        <td className="px-4 py-2 text-right">{c._count?.sales || 0}</td>
                        <td className="px-4 py-2 text-right font-semibold">{formatCurrency(c.totalPurchased || 0, "TZS")}</td>
                        <td className={`px-4 py-2 text-right font-semibold ${Number(c.totalDebt) > 0 ? "text-red-600" : "text-green-600"}`}>
                          {Number(c.totalDebt) > 0 ? formatCurrency(c.totalDebt, "TZS") : "—"}
                        </td>
                        <td className="px-4 py-2 text-right text-amber-600">{c.loyaltyPoints}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SUPPLIERS REPORT */}
          {tab === "suppliers" && data && (
            <div className="bg-card border rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b font-semibold">Supplier Purchase Report</div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left px-4 py-2 font-medium text-muted-foreground">Supplier</th>
                      <th className="text-right px-4 py-2 font-medium text-muted-foreground">Purchases</th>
                      <th className="text-right px-4 py-2 font-medium text-muted-foreground">Total Amount</th>
                      <th className="text-right px-4 py-2 font-medium text-muted-foreground">Amount Paid</th>
                      <th className="text-right px-4 py-2 font-medium text-muted-foreground">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.suppliers?.map((s: any) => {
                      const totalAmt = s.purchases?.reduce((sum: number, p: any) => sum + Number(p.total), 0) || 0;
                      const totalPaid = s.purchases?.reduce((sum: number, p: any) => sum + Number(p.amountPaid), 0) || 0;
                      return (
                        <tr key={s.id} className="border-b hover:bg-muted/30">
                          <td className="px-4 py-2 font-medium">{s.name}</td>
                          <td className="px-4 py-2 text-right">{s._count?.purchases || 0}</td>
                          <td className="px-4 py-2 text-right font-semibold">{formatCurrency(totalAmt, "TZS")}</td>
                          <td className="px-4 py-2 text-right text-green-600">{formatCurrency(totalPaid, "TZS")}</td>
                          <td className={`px-4 py-2 text-right font-semibold ${totalAmt - totalPaid > 0 ? "text-red-600" : "text-green-600"}`}>
                            {formatCurrency(totalAmt - totalPaid, "TZS")}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
