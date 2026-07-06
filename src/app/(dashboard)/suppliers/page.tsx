"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { Plus, Search, Edit, Truck, Phone, Mail, X, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { formatCurrency } from "@/lib/utils";

interface Supplier {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  balance: number;
  _count?: { purchases: number };
}

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", email: "", address: "" });

  useEffect(() => { loadData(); }, [search]);

  async function loadData() {
    setLoading(true);
    try {
      const res = await fetch(`/api/suppliers?search=${encodeURIComponent(search)}`);
      const data = await res.json();
      setSuppliers(data.suppliers || []);
    } catch { toast.error("Failed to load suppliers"); }
    setLoading(false);
  }

  function openModal(supplier?: Supplier) {
    if (supplier) {
      setEditing(supplier);
      setForm({ name: supplier.name, phone: supplier.phone || "", email: supplier.email || "", address: supplier.address || "" });
    } else {
      setEditing(null);
      setForm({ name: "", phone: "", email: "", address: "" });
    }
    setShowModal(true);
  }

  async function saveSupplier() {
    if (!form.name) { toast.error("Name is required"); return; }
    setSaving(true);
    try {
      const url = editing ? `/api/suppliers/${editing.id}` : "/api/suppliers";
      const method = editing ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (!res.ok) throw new Error("Failed");
      toast.success(editing ? "Supplier updated" : "Supplier created");
      setShowModal(false);
      loadData();
    } catch { toast.error("Failed to save supplier"); }
    setSaving(false);
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Suppliers</h1>
          <p className="text-muted-foreground text-sm">{suppliers.length} suppliers registered</p>
        </div>
        <button onClick={() => openModal()} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
          <Plus className="w-4 h-4" /> Add Supplier
        </button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search suppliers…"
          className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {loading ? Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-36 bg-muted animate-pulse rounded-xl" />
        )) : suppliers.map(s => (
          <div key={s.id} className="bg-card border rounded-xl p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-indigo-50 flex items-center justify-center">
                  <Truck className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-semibold">{s.name}</h3>
                  <p className="text-xs text-muted-foreground">{s._count?.purchases || 0} purchases</p>
                </div>
              </div>
              <button onClick={() => openModal(s)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600">
                <Edit className="w-4 h-4" />
              </button>
            </div>
            <div className="mt-3 space-y-1">
              {s.phone && <p className="text-xs text-muted-foreground flex items-center gap-1.5"><Phone className="w-3 h-3" />{s.phone}</p>}
              {s.email && <p className="text-xs text-muted-foreground flex items-center gap-1.5"><Mail className="w-3 h-3" />{s.email}</p>}
            </div>
            {Number(s.balance) > 0 && (
              <div className="mt-3 px-3 py-2 bg-amber-50 rounded-lg">
                <p className="text-xs text-amber-700 font-medium">Balance Due: {formatCurrency(s.balance, "TZS")}</p>
              </div>
            )}
          </div>
        ))}
        {!loading && suppliers.length === 0 && (
          <div className="col-span-full text-center py-16 text-muted-foreground">
            <Truck className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No suppliers found</p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b">
              <h3 className="text-lg font-bold">{editing ? "Edit Supplier" : "Add Supplier"}</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-4">
              {[
                { label: "Business Name *", key: "name", type: "text", placeholder: "Azam Beverages Ltd" },
                { label: "Phone", key: "phone", type: "tel", placeholder: "+255700000000" },
                { label: "Email", key: "email", type: "email", placeholder: "info@supplier.com" },
                { label: "Address", key: "address", type: "text", placeholder: "Dar es Salaam" },
              ].map(f => (
                <div key={f.key}>
                  <label className="text-sm font-medium">{f.label}</label>
                  <input type={f.type} value={(form as any)[f.key]}
                    onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    className="mt-1 w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              ))}
            </div>
            <div className="p-5 border-t flex gap-3">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 border rounded-xl font-medium hover:bg-gray-50">Cancel</button>
              <button onClick={saveSupplier} disabled={saving} className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium flex items-center justify-center gap-2">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {saving ? "Saving…" : (editing ? "Update" : "Create")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
