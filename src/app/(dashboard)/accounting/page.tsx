"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { Plus, TrendingUp, TrendingDown, DollarSign, X, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { formatCurrency, formatDate } from "@/lib/utils";

interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  store?: { name: string };
}

export default function AccountingPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [from, setFrom] = useState(() => {
    const d = new Date(); d.setDate(1);
    return d.toISOString().split("T")[0];
  });
  const [to, setTo] = useState(() => new Date().toISOString().split("T")[0]);
  const [form, setForm] = useState({ description: "", amount: "", category: "OPERATING", date: new Date().toISOString().split("T")[0], note: "" });

  const EXPENSE_CATEGORIES = ["OPERATING", "SALARIES", "RENT", "UTILITIES", "TRANSPORT", "MARKETING", "MAINTENANCE", "OTHER"];

  useEffect(() => { loadData(); }, [from, to]);

  async function loadData() {
    setLoading(true);
    try {
      const res = await fetch(`/api/accounting?from=${from}&to=${to}`);
      if (res.ok) {
        const data = await res.json();
        setExpenses(data.expenses || []);
        setSummary(data.summary);
      }
    } catch { toast.error("Failed to load data"); }
    setLoading(false);
  }

  async function saveExpense() {
    if (!form.description || !form.amount) { toast.error("Fill required fields"); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/accounting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, amount: parseFloat(form.amount) }),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success("Expense recorded");
      setShowModal(false);
      setForm({ description: "", amount: "", category: "OPERATING", date: new Date().toISOString().split("T")[0], note: "" });
      loadData();
    } catch { toast.error("Failed to save expense"); }
    setSaving(false);
  }

  const statCards = [
    { label: "Total Revenue", value: formatCurrency(summary?.totalRevenue || 0, "TZS"), icon: TrendingUp, color: "text-green-600", bg: "bg-green-50" },
    { label: "Total Expenses", value: formatCurrency(summary?.totalExpenses || 0, "TZS"), icon: TrendingDown, color: "text-red-600", bg: "bg-red-50" },
    { label: "Net Profit", value: formatCurrency(summary?.netProfit || 0, "TZS"), icon: DollarSign, color: summary?.netProfit >= 0 ? "text-blue-600" : "text-red-600", bg: summary?.netProfit >= 0 ? "bg-blue-50" : "bg-red-50" },
    { label: "Outstanding Receivables", value: formatCurrency(summary?.outstanding || 0, "TZS"), icon: DollarSign, color: "text-amber-600", bg: "bg-amber-50" },
  ];

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Accounting</h1>
          <p className="text-muted-foreground text-sm">Income, expenses & profitability</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
          <Plus className="w-4 h-4" /> Record Expense
        </button>
      </div>

      {/* Date Range */}
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
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((s, i) => (
          <div key={i} className="bg-card border rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-muted-foreground">{s.label}</p>
              <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center`}>
                <s.icon className={`w-5 h-5 ${s.color}`} />
              </div>
            </div>
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Expenses Table */}
      <div className="bg-card border rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <h2 className="font-semibold">Expenses</h2>
          <span className="text-sm text-muted-foreground">{expenses.length} records</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Description</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Category</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Store</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Amount</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date</th>
              </tr>
            </thead>
            <tbody>
              {loading ? Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <td key={j} className="px-4 py-3"><div className="h-4 bg-muted animate-pulse rounded" /></td>
                  ))}
                </tr>
              )) : expenses.map(e => (
                <tr key={e.id} className="border-b hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">{e.description}</td>
                  <td className="px-4 py-3">
                    <span className="px-2.5 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">{e.category}</span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{e.store?.name || "—"}</td>
                  <td className="px-4 py-3 text-right font-semibold text-red-600">{formatCurrency(e.amount, "TZS")}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{formatDate(e.date)}</td>
                </tr>
              ))}
              {!loading && expenses.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">No expenses recorded for this period</td></tr>
              )}
            </tbody>
            {!loading && expenses.length > 0 && (
              <tfoot className="bg-muted/50 border-t">
                <tr>
                  <td colSpan={3} className="px-4 py-3 font-semibold">Total</td>
                  <td className="px-4 py-3 text-right font-bold text-red-600">
                    {formatCurrency(expenses.reduce((s, e) => s + Number(e.amount), 0), "TZS")}
                  </td>
                  <td />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b">
              <h3 className="text-lg font-bold">Record Expense</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-sm font-medium">Description *</label>
                <input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  placeholder="e.g. Monthly rent payment"
                  className="mt-1 w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">Amount (TZS) *</label>
                  <input type="number" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))}
                    placeholder="0"
                    className="mt-1 w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="text-sm font-medium">Date *</label>
                  <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
                    className="mt-1 w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Category</label>
                <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                  className="mt-1 w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                  {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Note</label>
                <input value={form.note} onChange={e => setForm(p => ({ ...p, note: e.target.value }))}
                  placeholder="Optional"
                  className="mt-1 w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
            </div>
            <div className="p-5 border-t flex gap-3">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 border rounded-xl font-medium hover:bg-gray-50">Cancel</button>
              <button onClick={saveExpense} disabled={saving} className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium flex items-center justify-center gap-2">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {saving ? "Saving…" : "Record Expense"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
