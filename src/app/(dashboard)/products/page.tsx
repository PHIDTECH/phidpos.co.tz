"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { Plus, Search, Edit, Trash2, Package, Barcode, X, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { formatCurrency } from "@/lib/utils";

interface Product {
  id: string;
  name: string;
  sku?: string;
  barcode?: string;
  retailPrice: number;
  wholesalePrice?: number;
  costPrice?: number;
  minStockLevel: number;
  isActive: boolean;
  category?: { name: string };
  unit?: { name: string; abbreviation: string };
  inventories?: { quantity: number; store: { name: string } }[];
}

interface Category { id: string; name: string; }
interface Unit { id: string; name: string; abbreviation: string; }

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "", categoryId: "", unitId: "", sku: "", barcode: "",
    retailPrice: "", wholesalePrice: "", costPrice: "", minStockLevel: "10", description: "",
  });

  useEffect(() => { loadData(); }, [search, page]);
  useEffect(() => { loadMeta(); }, []);

  async function loadData() {
    setLoading(true);
    try {
      const res = await fetch(`/api/products?search=${encodeURIComponent(search)}&page=${page}&limit=20`);
      const data = await res.json();
      setProducts(data.products || []);
      setTotal(data.total || 0);
    } catch { toast.error("Failed to load products"); }
    setLoading(false);
  }

  async function loadMeta() {
    try {
      const [catRes, unitRes] = await Promise.all([
        fetch("/api/categories"),
        fetch("/api/units"),
      ]);
      const catData = await catRes.json();
      const unitData = await unitRes.json();
      setCategories(catData.categories || []);
      setUnits(unitData.units || []);
    } catch {}
  }

  function openModal(product?: Product) {
    if (product) {
      setEditing(product);
      setForm({
        name: product.name, categoryId: product.category?.name || "",
        unitId: "", sku: product.sku || "", barcode: product.barcode || "",
        retailPrice: product.retailPrice.toString(),
        wholesalePrice: product.wholesalePrice?.toString() || "",
        costPrice: product.costPrice?.toString() || "",
        minStockLevel: product.minStockLevel.toString(),
        description: "",
      });
    } else {
      setEditing(null);
      setForm({ name: "", categoryId: "", unitId: "", sku: "", barcode: "", retailPrice: "", wholesalePrice: "", costPrice: "", minStockLevel: "10", description: "" });
    }
    setShowModal(true);
  }

  async function saveProduct() {
    if (!form.name || !form.retailPrice) { toast.error("Name and retail price are required"); return; }
    setSaving(true);
    try {
      const url = editing ? `/api/products/${editing.id}` : "/api/products";
      const method = editing ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      toast.success(editing ? "Product updated" : "Product created");
      setShowModal(false);
      loadData();
    } catch (err: any) { toast.error(err.message || "Failed to save product"); }
    setSaving(false);
  }

  async function deleteProduct(id: string) {
    if (!confirm("Archive this product?")) return;
    try {
      await fetch(`/api/products/${id}`, { method: "DELETE" });
      toast.success("Product archived");
      loadData();
    } catch { toast.error("Failed to delete"); }
  }

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Products</h1>
          <p className="text-muted-foreground text-sm">{total} products total</p>
        </div>
        <button onClick={() => openModal()} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
          <Plus className="w-4 h-4" /> Add Product
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search by name, SKU or barcode…"
          className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none max-w-md"
        />
      </div>

      {/* Table */}
      <div className="bg-card border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Product</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Category</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Retail Price</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Wholesale</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Cost</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Stock</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b">
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 bg-muted animate-pulse rounded" /></td>
                    ))}
                  </tr>
                ))
              ) : products.map(product => {
                const stock = product.inventories?.reduce((s, i) => s + Number(i.quantity), 0) ?? 0;
                const isLow = stock <= product.minStockLevel;
                return (
                  <tr key={product.id} className="border-b hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                          <Package className="w-4 h-4 text-blue-500" />
                        </div>
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {product.sku && <span className="text-xs text-muted-foreground">SKU: {product.sku}</span>}
                            {product.barcode && <span className="text-xs text-muted-foreground flex items-center gap-0.5"><Barcode className="w-3 h-3" />{product.barcode}</span>}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{product.category?.name || "—"}</td>
                    <td className="px-4 py-3 text-right font-semibold">{formatCurrency(product.retailPrice, "TZS")}</td>
                    <td className="px-4 py-3 text-right text-muted-foreground">{product.wholesalePrice ? formatCurrency(product.wholesalePrice, "TZS") : "—"}</td>
                    <td className="px-4 py-3 text-right text-muted-foreground">{product.costPrice ? formatCurrency(product.costPrice, "TZS") : "—"}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${isLow ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
                        {stock} {isLow && "⚠"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => openModal(product)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => deleteProduct(product.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!loading && products.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">No products found</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <p className="text-sm text-muted-foreground">Page {page} of {totalPages}</p>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                className="px-3 py-1.5 border rounded-lg text-sm disabled:opacity-50 hover:bg-muted">Prev</button>
              <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}
                className="px-3 py-1.5 border rounded-lg text-sm disabled:opacity-50 hover:bg-muted">Next</button>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b">
              <h3 className="text-lg font-bold">{editing ? "Edit Product" : "Add Product"}</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-sm font-medium">Product Name *</label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="mt-1 w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. Coca Cola 500ml" />
                </div>
                <div>
                  <label className="text-sm font-medium">Category</label>
                  <select value={form.categoryId} onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))} className="mt-1 w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="">No Category</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Unit</label>
                  <select value={form.unitId} onChange={e => setForm(f => ({ ...f, unitId: e.target.value }))} className="mt-1 w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="">No Unit</option>
                    {units.map(u => <option key={u.id} value={u.id}>{u.name} ({u.abbreviation})</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">SKU</label>
                  <input value={form.sku} onChange={e => setForm(f => ({ ...f, sku: e.target.value }))} className="mt-1 w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Optional" />
                </div>
                <div>
                  <label className="text-sm font-medium">Barcode</label>
                  <input value={form.barcode} onChange={e => setForm(f => ({ ...f, barcode: e.target.value }))} className="mt-1 w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Optional" />
                </div>
                <div>
                  <label className="text-sm font-medium">Retail Price (TZS) *</label>
                  <input type="number" value={form.retailPrice} onChange={e => setForm(f => ({ ...f, retailPrice: e.target.value }))} className="mt-1 w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="0" />
                </div>
                <div>
                  <label className="text-sm font-medium">Wholesale Price (TZS)</label>
                  <input type="number" value={form.wholesalePrice} onChange={e => setForm(f => ({ ...f, wholesalePrice: e.target.value }))} className="mt-1 w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Optional" />
                </div>
                <div>
                  <label className="text-sm font-medium">Cost Price (TZS)</label>
                  <input type="number" value={form.costPrice} onChange={e => setForm(f => ({ ...f, costPrice: e.target.value }))} className="mt-1 w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Optional" />
                </div>
                <div>
                  <label className="text-sm font-medium">Min Stock Level</label>
                  <input type="number" value={form.minStockLevel} onChange={e => setForm(f => ({ ...f, minStockLevel: e.target.value }))} className="mt-1 w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>
            </div>
            <div className="p-5 border-t flex gap-3">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 border rounded-xl font-medium hover:bg-gray-50">Cancel</button>
              <button onClick={saveProduct} disabled={saving} className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium flex items-center justify-center gap-2">
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
