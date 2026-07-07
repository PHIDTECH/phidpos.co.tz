"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import {
  ShoppingCart, Package, Users, TrendingUp, AlertTriangle,
  ArrowUpRight, DollarSign, CreditCard, RefreshCw
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { formatCurrency, formatDateTime } from "@/lib/utils";

interface DashboardData {
  stats: {
    todaySales: number;
    todayRevenue: number;
    totalProducts: number;
    lowStockProducts: number;
    totalCustomers: number;
    monthlyRevenue: number;
    monthlySales: number;
    pendingDebt: number;
  };
  recentSales: any[];
  topProducts: any[];
  weeklyChart: any[];
}

export default function DashboardPage() {
  const sessionData = useSession(); const session = sessionData?.data;
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/dashboard");
      const json = await res.json();
      setData(json);
    } catch {}
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const currency = "TZS";

  const statCards = data ? [
    { title: "Today's Revenue", value: formatCurrency(data.stats.todayRevenue, currency), sub: `${data.stats.todaySales} transactions`, icon: DollarSign, color: "bg-blue-500", change: "+Today" },
    { title: "Monthly Revenue", value: formatCurrency(data.stats.monthlyRevenue, currency), sub: `${data.stats.monthlySales} sales this month`, icon: TrendingUp, color: "bg-green-500", change: "+Month" },
    { title: "Total Products", value: data.stats.totalProducts.toString(), sub: `${data.stats.lowStockProducts} low stock alerts`, icon: Package, color: "bg-purple-500", change: data.stats.lowStockProducts > 0 ? "⚠ Low stock" : "✓ Stocked" },
    { title: "Total Customers", value: data.stats.totalCustomers.toString(), sub: `${formatCurrency(data.stats.pendingDebt, currency)} outstanding debt`, icon: Users, color: "bg-orange-500", change: "Registered" },
  ] : [];

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 rounded-xl bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-muted-foreground text-sm">Failed to load dashboard data.</p>
          <button onClick={load} className="mt-3 text-sm text-blue-600 hover:underline">Try again</button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground text-sm">Welcome back, {session?.user?.name}</p>
        </div>
        <button onClick={load} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground border rounded-lg px-3 py-2">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Low Stock Banner */}
      {data && data.stats.lowStockProducts > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex items-center gap-3 text-amber-800">
          <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
          <span className="text-sm font-medium">{data.stats.lowStockProducts} product(s) are running low on stock. <a href="/inventory" className="underline">View Inventory →</a></span>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div key={i} className="bg-card border rounded-xl p-5 flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{card.title}</p>
                <p className="text-2xl font-bold mt-1">{card.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{card.sub}</p>
              </div>
              <div className={`w-10 h-10 rounded-lg ${card.color} flex items-center justify-center flex-shrink-0`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Weekly Revenue Chart */}
        <div className="lg:col-span-2 bg-card border rounded-xl p-5">
          <h3 className="font-semibold mb-4">Revenue - Last 7 Days</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={data?.weeklyChart || []}>
              <defs>
                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v) => v.slice(5)} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: any) => formatCurrency(v, currency)} labelFormatter={(l) => `Date: ${l}`} />
              <Area type="monotone" dataKey="revenue" stroke="#3b82f6" fill="url(#colorRev)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Top Products */}
        <div className="bg-card border rounded-xl p-5">
          <h3 className="font-semibold mb-4">Top Products (This Month)</h3>
          <div className="space-y-3">
            {data?.topProducts.map((p, i) => (
              <div key={p.productId} className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{p.name}</p>
                  <p className="text-xs text-muted-foreground">Qty: {p.totalQty}</p>
                </div>
                <p className="text-sm font-semibold text-right flex-shrink-0">{formatCurrency(p.totalRevenue, currency)}</p>
              </div>
            ))}
            {(!data?.topProducts || data.topProducts.length === 0) && (
              <p className="text-sm text-muted-foreground text-center py-4">No sales data yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Sales */}
      <div className="bg-card border rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Recent Sales</h3>
          <a href="/reports" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
            View All <ArrowUpRight className="w-3 h-3" />
          </a>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-muted-foreground">
                <th className="text-left pb-2 font-medium">Receipt</th>
                <th className="text-left pb-2 font-medium">Customer</th>
                <th className="text-left pb-2 font-medium">Cashier</th>
                <th className="text-left pb-2 font-medium">Items</th>
                <th className="text-right pb-2 font-medium">Amount</th>
                <th className="text-left pb-2 font-medium pl-4">Date</th>
              </tr>
            </thead>
            <tbody>
              {data?.recentSales.map((sale) => (
                <tr key={sale.id} className="border-b hover:bg-muted/30 transition-colors">
                  <td className="py-2.5 font-mono text-xs">{sale.receiptNumber}</td>
                  <td className="py-2.5">{sale.customer?.name || <span className="text-muted-foreground">Walk-in</span>}</td>
                  <td className="py-2.5">{sale.user?.name}</td>
                  <td className="py-2.5">{sale.items?.length}</td>
                  <td className="py-2.5 text-right font-semibold">{formatCurrency(sale.total, currency)}</td>
                  <td className="py-2.5 pl-4 text-muted-foreground text-xs">{formatDateTime(sale.createdAt)}</td>
                </tr>
              ))}
              {(!data?.recentSales || data.recentSales.length === 0) && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-muted-foreground">No sales recorded yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
