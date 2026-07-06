"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { Plus, Search, Edit, Users, Phone, Mail, CreditCard, X, Loader2, Star, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";
import { formatCurrency, formatDate } from "@/lib/utils";

interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  type: string;
  creditLimit: number;
  loyaltyPoints: number;
  totalDebt: number;
  _count?: { sales: number };
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showDebtModal, setShowDebtModal] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [saving, setSaving] = useState(false);
  const [debtCustomer, setDebtCustomer] = useState<Customer | null>(null);
  const [debtAmount, setDebtAmount] = useState("");
  const [debtNote, setDebtNote] = useState("");
  const [form, setForm] = useState({ name: "", phone: "", email: "", address: "", type: "RETAIL", creditLimit: "0" });

  useEffect(() => { loadData(); }, [search, typeFilter]);

  async function loadData() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ search, ...(typeFilter && { type: typeFilter }) });
      const res = await fetch(`/api/customers?${params}`);
      const data = await res.json();
      setCustomers(data.customers || []);
      setTotal(data.total || 0);
    } catch { toast.error("Failed to load customers"); }
    setLoading(false);
  }

  function openModal(customer?: Customer) {
    if (customer) {
      setEditing(customer);
      setForm({ name: customer.name, phone: customer.phone || "", email: customer.email || "", address: customer.address || "", type: customer.type, creditLimit: customer.creditLimit.toString() });
    } else {
      setEditing(null);
      setForm({ name: "", phone: "", email: "", address: "", type: "RETAIL", creditLimit: "0" });
    }
    setShowModal(true);
  }

  async function saveCustomer() {
    if (!form.name) { toast.error("Name is required"); return; }
    setSaving(true);
    try {
      const url = editing ? `/api/customers/${editing.id}` : "/api/customers";
      const method = editing ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      toast.success(editing ? "Customer updated" : "Customer created");
      setShowModal(false);
      loadData();
    } catch (err: any) { toast.error(err.message || "Failed"); }
    setSaving(false);
  }

  async function recordDebtPayment() {
    if (!debtCustomer || !debtAmount) { toast.error("Enter payment amount"); return; }
    setSaving(true);
    try {
      const res = await fetch(`/api/customers/${debtCustomer.id}/debt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: parseFloat(debtAmount), note: debtNote }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      toast.success("Payment recorded");
      setShowDebtModal(false);
      setDebtAmount(""); setDebtNote("");
      loadData();
    } catch (err: any) { toast.error(err.message || "Failed"); }
    setSaving(false);
  }

  const typeColors: Record<string, string> = {
    RETAIL: "bg-blue-100 text-blue-700",
    WHOLESALE: "bg-purple-100 text-purple-700",
    VIP: "bg-amber-100 text-amber-700",
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Customers</h1>
          <p className="text-muted-foreground text-sm">{total} customers registered</p>
        </div>
        <button onClick={() => openModal()} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
          <Plus className="w-4 h-4" /> Add Customer
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search customers…"
            className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
        </div>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
          className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
          <option value="">All Types</option>
          <option value="RETAIL">Retail</option>
          <option value="WHOLESALE">Wholesale</option>
          <option value="VIP">VIP</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-card border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Customer</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Type</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Loyalty Pts</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Debt</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Sales</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b">
                  {Array.from({ length: 6 }).map((_, j) => (
                    <td key={j} className="px-4 py-3"><div className="h-4 bg-muted animate-pulse rounded" /></td>
                  ))}
                </tr>
              )) : customers.map(c => (
                <tr key={c.id} className="border-b hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                        {c.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium">{c.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {c.phone && <span className="text-xs text-muted-foreground flex items-center gap-0.5"><Phone className="w-3 h-3" />{c.phone}</span>}
                          {c.email && <span className="text-xs text-muted-foreground flex items-center gap-0.5"><Mail className="w-3 h-3" />{c.email}</span>}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${typeColors[c.type] || "bg-gray-100 text-gray-700"}`}>{c.type}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="flex items-center justify-end gap-1 text-amber-600 font-medium">
                      <Star className="w-3.5 h-3.5" />{c.loyaltyPoints}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {Number(c.totalDebt) > 0 ? (
                      <button onClick={() => { setDebtCustomer(c); setShowDebtModal(true); }}
                        className="flex items-center justify-end gap-1 text-red-600 font-semibold hover:underline">
                        <AlertCircle className="w-3.5 h-3.5" />{formatCurrency(c.totalDebt, "TZS")}
                      </button>
                    ) : <span className="text-green-600 font-medium">—</span>}
                  </td>
                  <td className="px-4 py-3 text-right text-muted-foreground">{c._count?.sales || 0}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => openModal(c)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600"><Edit className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && customers.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">No customers found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b">
              <h3 className="text-lg font-bold">{editing ? "Edit Customer" : "Add Customer"}</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-4">
              {[
                { label: "Full Name *", key: "name", type: "text", placeholder: "John Mwamba" },
                { label: "Phone Number", key: "phone", type: "tel", placeholder: "+255700000000" },
                { label: "Email", key: "email", type: "email", placeholder: "john@example.com" },
                { label: "Address", key: "address", type: "text", placeholder: "Dar es Salaam" },
              ].map(field => (
                <div key={field.key}>
                  <label className="text-sm font-medium">{field.label}</label>
                  <input type={field.type} value={(form as any)[field.key]}
                    onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                    placeholder={field.placeholder}
                    className="mt-1 w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              ))}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Customer Type</label>
                  <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                    className="mt-1 w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="RETAIL">Retail</option>
                    <option value="WHOLESALE">Wholesale</option>
                    <option value="VIP">VIP</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Credit Limit (TZS)</label>
                  <input type="number" value={form.creditLimit}
                    onChange={e => setForm(f => ({ ...f, creditLimit: e.target.value }))}
                    className="mt-1 w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>
            </div>
            <div className="p-5 border-t flex gap-3">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 border rounded-xl font-medium hover:bg-gray-50">Cancel</button>
              <button onClick={saveCustomer} disabled={saving} className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium flex items-center justify-center gap-2">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {saving ? "Saving…" : (editing ? "Update" : "Create")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Debt Payment Modal */}
      {showDebtModal && debtCustomer && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b">
              <h3 className="text-lg font-bold">Record Debt Payment</h3>
              <button onClick={() => setShowDebtModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <p className="font-semibold text-red-800">{debtCustomer.name}</p>
                <p className="text-sm text-red-600 mt-1">Outstanding: <span className="font-bold">{formatCurrency(debtCustomer.totalDebt, "TZS")}</span></p>
              </div>
              <div>
                <label className="text-sm font-medium">Payment Amount (TZS) *</label>
                <input type="number" value={debtAmount} onChange={e => setDebtAmount(e.target.value)}
                  max={debtCustomer.totalDebt} placeholder="0"
                  className="mt-1 w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none text-right text-lg font-bold" />
                <button onClick={() => setDebtAmount(debtCustomer.totalDebt.toString())}
                  className="mt-1 text-xs text-blue-600 hover:underline">Pay full amount</button>
              </div>
              <div>
                <label className="text-sm font-medium">Note (optional)</label>
                <input type="text" value={debtNote} onChange={e => setDebtNote(e.target.value)}
                  placeholder="e.g. Cash payment"
                  className="mt-1 w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
            </div>
            <div className="p-5 border-t flex gap-3">
              <button onClick={() => setShowDebtModal(false)} className="flex-1 py-2.5 border rounded-xl font-medium hover:bg-gray-50">Cancel</button>
              <button onClick={recordDebtPayment} disabled={saving} className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium flex items-center justify-center gap-2">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {saving ? "Recording…" : "Record Payment"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
