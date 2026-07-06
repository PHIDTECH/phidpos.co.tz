"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { Plus, Search, ShoppingBag, X, Loader2, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { formatCurrency, formatDate } from "@/lib/utils";

interface Supplier { id: string; name: string; }
interface Product { id: string; name: string; costPrice?: number; }
interface PurchaseItem { productId: string; name: string; quantity: string; unitCost: string; total: number; }

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ supplierId: "", storeId: "", invoiceNumber: "", amountPaid: "", note: "" });
  const [items, setItems] = useState<PurchaseItem[]>([{ productId: "", name: "", quantity: "1", unitCost: "", total: 0 }]);

  useEffect(() => { loadData(); loadMeta(); }, []);

  async function loadData() {
    setLoading(true);
    try {
      const res = await fetch("/api/purchases?limit=50");
      const data = await res.json();
      setPurchases(data.purchases || []);
    } catch { toast.error("Failed to load purchases"); }
    setLoading(false);
  }

  async function loadMeta() {
    try {
      const [supRes, prodRes] = await Promise.all([fetch("/api/suppliers"), fetch("/api/products?limit=500")]);
      const supData = await supRes.json();
      const prodData = await prodRes.json();
      setSuppliers(supData.suppliers || []);
      setProducts(prodData.products || []);
    } catch {}
  }

  function updateItem(idx: number, field: string, value: string) {
    setItems(prev => prev.map((item, i) => {
      if (i !== idx) return item;
      const updated = { ...item, [field]: value };
      if (field === "productId") {
        const prod = products.find(p => p.id === value);
        updated.name = prod?.name || "";
        updated.unitCost = prod?.costPrice?.toString() || "";
      }
      const qty = parseFloat(updated.quantity) || 0;
      const cost = parseFloat(updated.unitCost) || 0;
      updated.total = qty * cost;
      return updated;
    }));
  }

  function addItem() {
    setItems(prev => [...prev, { productId: "", name: "", quantity: "1", unitCost: "", total: 0 }]);
  }

  function removeItem(idx: number) {
    setItems(prev => prev.filter((_, i) => i !== idx));
  }

  const grandTotal = items.reduce((s, i) => s + i.total, 0);

  async function savePurchase() {
    if (!form.supplierId) { toast.error("Select a supplier"); return; }
    if (items.some(i => !i.productId || !i.quantity || !i.unitCost)) { toast.error("Fill all item fields"); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/purchases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          items: items.map(i => ({ productId: i.productId, quantity: i.quantity, unitCost: i.unitCost, total: i.total })),
        }),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success("Purchase recorded");
      setShowModal(false);
      setItems([{ productId: "", name: "", quantity: "1", unitCost: "", total: 0 }]);
      setForm({ supplierId: "", storeId: "", invoiceNumber: "", amountPaid: "", note: "" });
      loadData();
    } catch { toast.error("Failed to save purchase"); }
    setSaving(false);
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Purchases</h1>
          <p className="text-muted-foreground text-sm">{purchases.length} recent purchases</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
          <Plus className="w-4 h-4" /> New Purchase
        </button>
      </div>

      <div className="bg-card border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Invoice</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Supplier</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Store</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Total</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Paid</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Balance</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date</th>
              </tr>
            </thead>
            <tbody>
              {loading ? Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b">
                  {Array.from({ length: 7 }).map((_, j) => (
                    <td key={j} className="px-4 py-3"><div className="h-4 bg-muted animate-pulse rounded" /></td>
                  ))}
                </tr>
              )) : purchases.map(p => (
                <tr key={p.id} className="border-b hover:bg-muted/30">
                  <td className="px-4 py-3 font-mono text-xs">{p.invoiceNumber || p.id.slice(0, 8)}</td>
                  <td className="px-4 py-3">{p.supplier?.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{p.store?.name}</td>
                  <td className="px-4 py-3 text-right font-semibold">{formatCurrency(p.total, "TZS")}</td>
                  <td className="px-4 py-3 text-right text-green-600">{formatCurrency(p.amountPaid, "TZS")}</td>
                  <td className="px-4 py-3 text-right text-red-600">{formatCurrency(Number(p.total) - Number(p.amountPaid), "TZS")}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(p.createdAt)}</td>
                </tr>
              ))}
              {!loading && purchases.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">No purchases recorded</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b">
              <h3 className="text-lg font-bold">Record Purchase</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Supplier *</label>
                  <select value={form.supplierId} onChange={e => setForm(f => ({ ...f, supplierId: e.target.value }))}
                    className="mt-1 w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="">Select supplier</option>
                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Invoice Number</label>
                  <input value={form.invoiceNumber} onChange={e => setForm(f => ({ ...f, invoiceNumber: e.target.value }))}
                    placeholder="INV-001" className="mt-1 w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>

              {/* Items */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium">Items</label>
                  <button onClick={addItem} className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                    <Plus className="w-3.5 h-3.5" /> Add Item
                  </button>
                </div>
                <div className="space-y-2">
                  {items.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-5">
                        <select value={item.productId} onChange={e => updateItem(idx, "productId", e.target.value)}
                          className="w-full px-2 py-1.5 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                          <option value="">Select product</option>
                          {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                      </div>
                      <div className="col-span-2">
                        <input type="number" value={item.quantity} onChange={e => updateItem(idx, "quantity", e.target.value)}
                          placeholder="Qty" className="w-full px-2 py-1.5 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                      </div>
                      <div className="col-span-3">
                        <input type="number" value={item.unitCost} onChange={e => updateItem(idx, "unitCost", e.target.value)}
                          placeholder="Unit Cost" className="w-full px-2 py-1.5 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                      </div>
                      <div className="col-span-1 text-right text-sm font-semibold text-blue-600">
                        {formatCurrency(item.total, "TZS")}
                      </div>
                      <div className="col-span-1 flex justify-end">
                        {items.length > 1 && (
                          <button onClick={() => removeItem(idx)} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end pt-2 border-t">
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Grand Total</p>
                  <p className="text-2xl font-bold text-blue-600">{formatCurrency(grandTotal, "TZS")}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Amount Paid (TZS)</label>
                  <input type="number" value={form.amountPaid} onChange={e => setForm(f => ({ ...f, amountPaid: e.target.value }))}
                    placeholder={grandTotal.toString()} className="mt-1 w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="text-sm font-medium">Note</label>
                  <input value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
                    placeholder="Optional note" className="mt-1 w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>
            </div>
            <div className="p-5 border-t flex gap-3">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 border rounded-xl font-medium hover:bg-gray-50">Cancel</button>
              <button onClick={savePurchase} disabled={saving} className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium flex items-center justify-center gap-2">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {saving ? "Saving…" : "Record Purchase"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
