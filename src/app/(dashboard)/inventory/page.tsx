"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { Search, Package, AlertTriangle, RefreshCw, Edit, X, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { formatDate } from "@/lib/utils";

interface InventoryItem {
  id: string;
  quantity: number;
  product: { id: string; name: string; sku?: string; minStockLevel: number; category?: { name: string }; unit?: { abbreviation: string } };
  store: { name: string };
  lastUpdated: string;
}

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [lowOnly, setLowOnly] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState<InventoryItem | null>(null);
  const [adjQty, setAdjQty] = useState("");
  const [adjNote, setAdjNote] = useState("");
  const [adjType, setAdjType] = useState<"SET" | "ADD" | "SUBTRACT">("ADD");
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadData(); }, [search, lowOnly]);

  async function loadData() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ search, ...(lowOnly ? { lowStock: "true" } : {}) });
      const res = await fetch(`/api/inventory?${params}`);
      const data = await res.json();
      setItems(data.inventories || []);
    } catch { toast.error("Failed to load inventory"); }
    setLoading(false);
  }

  function openAdjust(item: InventoryItem) {
    setSelected(item);
    setAdjQty("");
    setAdjNote("");
    setAdjType("ADD");
    setShowModal(true);
  }

  async function saveAdjustment() {
    if (!selected || !adjQty) { toast.error("Enter quantity"); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/inventory", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inventoryId: selected.id,
          type: adjType,
          quantity: parseFloat(adjQty),
          note: adjNote,
        }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      toast.success("Inventory updated");
      setShowModal(false);
      loadData();
    } catch (err: any) { toast.error(err.message || "Failed"); }
    setSaving(false);
  }

  const lowCount = items.filter(i => i.quantity <= i.product.minStockLevel).length;

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Inventory</h1>
          <p className="text-muted-foreground text-sm">{items.length} items · {lowCount} low stock</p>
        </div>
        <button onClick={loadData} className="flex items-center gap-2 border px-3 py-2 rounded-lg text-sm hover:bg-muted">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {lowCount > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
          <span className="text-sm font-medium text-amber-800">{lowCount} product(s) are below minimum stock level</span>
          <button onClick={() => setLowOnly(true)} className="ml-auto text-xs text-amber-700 underline">Show only low stock</button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products…"
            className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
        </div>
        <button onClick={() => setLowOnly(prev => !prev)}
          className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${lowOnly ? "bg-amber-500 text-white border-amber-500" : "hover:bg-muted"}`}>
          {lowOnly ? "Showing Low Stock" : "Low Stock Only"}
        </button>
      </div>

      <div className="bg-card border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Product</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Category</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Store</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Qty</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Min Level</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Last Updated</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} className="border-b">
                  {Array.from({ length: 8 }).map((_, j) => (
                    <td key={j} className="px-4 py-3"><div className="h-4 bg-muted animate-pulse rounded" /></td>
                  ))}
                </tr>
              )) : items.map(item => {
                const isLow = item.quantity <= item.product.minStockLevel;
                return (
                  <tr key={item.id} className={`border-b hover:bg-muted/30 transition-colors ${isLow ? "bg-red-50/50" : ""}`}>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium">{item.product.name}</p>
                        {item.product.sku && <p className="text-xs text-muted-foreground">SKU: {item.product.sku}</p>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{item.product.category?.name || "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{item.store.name}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={`font-bold text-lg ${isLow ? "text-red-600" : "text-gray-800"}`}>
                        {item.quantity}
                      </span>
                      {item.product.unit && <span className="text-xs text-muted-foreground ml-1">{item.product.unit.abbreviation}</span>}
                    </td>
                    <td className="px-4 py-3 text-right text-muted-foreground">{item.product.minStockLevel}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${isLow ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
                        {isLow ? "⚠ Low Stock" : "✓ In Stock"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{formatDate(item.lastUpdated)}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-center">
                        <button onClick={() => openAdjust(item)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600">
                          <Edit className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!loading && items.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-10 text-center text-muted-foreground">No inventory records found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && selected && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b">
              <h3 className="text-lg font-bold">Adjust Inventory</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-blue-50 rounded-xl p-4">
                <p className="font-semibold text-blue-800">{selected.product.name}</p>
                <p className="text-sm text-blue-600 mt-1">Current stock: <span className="font-bold">{selected.quantity}</span></p>
              </div>
              <div>
                <label className="text-sm font-medium">Adjustment Type</label>
                <div className="grid grid-cols-3 gap-2 mt-1">
                  {(["ADD", "SUBTRACT", "SET"] as const).map(type => (
                    <button key={type} onClick={() => setAdjType(type)}
                      className={`py-2 rounded-lg border text-xs font-medium transition-colors ${adjType === type ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200 hover:border-gray-300"}`}>
                      {type === "ADD" ? "+ Add" : type === "SUBTRACT" ? "- Subtract" : "= Set"}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Quantity *</label>
                <input type="number" value={adjQty} onChange={e => setAdjQty(e.target.value)} min="0"
                  className="mt-1 w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none text-right text-lg font-bold" />
              </div>
              <div>
                <label className="text-sm font-medium">Note (optional)</label>
                <input type="text" value={adjNote} onChange={e => setAdjNote(e.target.value)}
                  placeholder="e.g. Stock count adjustment"
                  className="mt-1 w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              {adjQty && (
                <div className="bg-gray-50 rounded-lg p-3 text-sm">
                  <p className="text-muted-foreground">New quantity will be: <span className="font-bold text-gray-900">
                    {adjType === "ADD" ? selected.quantity + parseFloat(adjQty || "0") :
                     adjType === "SUBTRACT" ? Math.max(0, selected.quantity - parseFloat(adjQty || "0")) :
                     parseFloat(adjQty || "0")}
                  </span></p>
                </div>
              )}
            </div>
            <div className="p-5 border-t flex gap-3">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 border rounded-xl font-medium hover:bg-gray-50">Cancel</button>
              <button onClick={saveAdjustment} disabled={saving} className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium flex items-center justify-center gap-2">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {saving ? "Saving…" : "Apply"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
