"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
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

  const S: Record<string, React.CSSProperties> = {
    page:    { padding:24, fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" },
    hdr:     { display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 },
    h1:      { fontSize:22, fontWeight:800, color:"#111", margin:0 },
    sub:     { fontSize:13, color:"#6b7280", marginTop:4 },
    addBtn:  { display:"flex", alignItems:"center", gap:6, padding:"9px 18px", background:"#2563eb", color:"#fff", border:"none", borderRadius:10, fontSize:13, fontWeight:700, cursor:"pointer" },
    toolbar: { marginBottom:16, position:"relative" as const, maxWidth:420 },
    srchIco: { position:"absolute" as const, left:10, top:"50%", transform:"translateY(-50%)", fontSize:14, color:"#9ca3af" },
    srchI:   { width:"100%", padding:"9px 12px 9px 34px", border:"1px solid #e5e7eb", borderRadius:10, fontSize:13, outline:"none", boxSizing:"border-box" as const },
    card:    { background:"#fff", border:"1px solid #e5e7eb", borderRadius:14, overflow:"hidden", boxShadow:"0 1px 4px rgba(0,0,0,0.04)" },
    th:      { padding:"11px 14px", fontSize:12, fontWeight:700, color:"#6b7280", textAlign:"left" as const, borderBottom:"1px solid #e5e7eb", background:"#f9fafb", whiteSpace:"nowrap" as const },
    thr:     { padding:"11px 14px", fontSize:12, fontWeight:700, color:"#6b7280", textAlign:"right" as const, borderBottom:"1px solid #e5e7eb", background:"#f9fafb", whiteSpace:"nowrap" as const },
    thc:     { padding:"11px 14px", fontSize:12, fontWeight:700, color:"#6b7280", textAlign:"center" as const, borderBottom:"1px solid #e5e7eb", background:"#f9fafb", whiteSpace:"nowrap" as const },
    td:      { padding:"12px 14px", fontSize:13, color:"#374151", borderBottom:"1px solid #f3f4f6", verticalAlign:"middle" as const },
    tdr:     { padding:"12px 14px", fontSize:13, color:"#374151", borderBottom:"1px solid #f3f4f6", textAlign:"right" as const, verticalAlign:"middle" as const },
    tdc:     { padding:"12px 14px", fontSize:13, color:"#374151", borderBottom:"1px solid #f3f4f6", textAlign:"center" as const, verticalAlign:"middle" as const },
    prodIcon:{ width:34, height:34, borderRadius:8, background:"#eff6ff", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, flexShrink:0 },
    pgBar:   { display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 14px", borderTop:"1px solid #e5e7eb", fontSize:12, color:"#6b7280" },
    overlay: { position:"fixed" as const, inset:0, background:"rgba(0,0,0,0.55)", zIndex:50, display:"flex", alignItems:"center", justifyContent:"center", padding:16 },
    modal:   { background:"#fff", borderRadius:18, width:"100%", maxWidth:520, boxShadow:"0 20px 60px rgba(0,0,0,0.2)", display:"flex", flexDirection:"column" as const, maxHeight:"90vh" },
    mhdr:    { display:"flex", alignItems:"center", justifyContent:"space-between", padding:"16px 20px", borderBottom:"1px solid #e5e7eb", flexShrink:0 },
    mbody:   { padding:20, overflowY:"auto" as const, flex:1 },
    mftr:    { display:"flex", gap:10, padding:"14px 20px", borderTop:"1px solid #e5e7eb", flexShrink:0 },
    grid2:   { display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 },
    lbl:     { fontSize:13, fontWeight:700, color:"#374151", display:"block", marginBottom:5 },
    inp:     { width:"100%", padding:"9px 12px", border:"1px solid #e5e7eb", borderRadius:10, fontSize:13, outline:"none", boxSizing:"border-box" as const },
    sel:     { width:"100%", padding:"9px 12px", border:"1px solid #e5e7eb", borderRadius:10, fontSize:13, outline:"none", boxSizing:"border-box" as const, background:"#fff" },
    cancelB: { flex:1, padding:"10px 0", borderRadius:12, border:"1px solid #e5e7eb", background:"#fff", fontSize:14, fontWeight:700, cursor:"pointer", color:"#374151" },
  };

  const dynS = {
    stockBadge: (low: boolean): React.CSSProperties => ({ display:"inline-flex", alignItems:"center", gap:4, padding:"3px 10px", borderRadius:20, fontSize:11, fontWeight:700, background:low?"#fef2f2":"#f0fdf4", color:low?"#dc2626":"#16a34a" }),
    saveB: (dis: boolean): React.CSSProperties => ({ flex:1, padding:"10px 0", borderRadius:12, border:"none", background:dis?"#d1d5db":"#2563eb", color:"#fff", fontSize:14, fontWeight:700, cursor:dis?"not-allowed":"pointer" }),
  };

  return (
    <div style={S.page}>
      <div style={S.hdr}>
        <div>
          <h1 style={S.h1}>📦 Bidhaa</h1>
          <p style={S.sub}>{total} bidhaa jumla</p>
        </div>
        <button onClick={() => openModal()} style={S.addBtn}>＋ Ongeza Bidhaa</button>
      </div>

      <div style={S.toolbar}>
        <span style={S.srchIco}>🔍</span>
        <input type="text" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="Tafuta jina, SKU au barcode…" style={S.srchI} />
      </div>

      <div style={S.card}>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%", borderCollapse:"collapse"}}>
            <thead>
              <tr>
                <th style={S.th}>Bidhaa</th>
                <th style={S.th}>Kategoria</th>
                <th style={S.thr}>Bei ya Rejareja</th>
                <th style={S.thr}>Jumla</th>
                <th style={S.thr}>Gharama</th>
                <th style={S.thr}>Hifadhi</th>
                <th style={S.thc}>Vitendo</th>
              </tr>
            </thead>
            <tbody>
              {loading ? Array.from({length:5}).map((_,i) => (
                <tr key={i}>{Array.from({length:7}).map((_,j) => (
                  <td key={j} style={S.td}><div style={{height:14,background:"#f3f4f6",borderRadius:6}}/></td>
                ))}</tr>
              )) : products.map(product => {
                const stock = product.inventories?.reduce((s,i) => s+Number(i.quantity), 0) ?? 0;
                const isLow = stock <= product.minStockLevel;
                return (
                  <tr key={product.id}>
                    <td style={S.td}>
                      <div style={{display:"flex", alignItems:"center", gap:10}}>
                        <div style={S.prodIcon}>📦</div>
                        <div>
                          <div style={{fontWeight:700, color:"#111"}}>{product.name}</div>
                          <div style={{fontSize:11, color:"#9ca3af", marginTop:2}}>
                            {product.sku && <span>SKU: {product.sku}</span>}
                            {product.barcode && <span style={{marginLeft:8}}>🔲 {product.barcode}</span>}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={S.td}>{product.category?.name || "—"}</td>
                    <td style={{...S.tdr, fontWeight:700, color:"#2563eb"}}>{formatCurrency(product.retailPrice,"TZS")}</td>
                    <td style={S.tdr}>{product.wholesalePrice ? formatCurrency(product.wholesalePrice,"TZS") : "—"}</td>
                    <td style={S.tdr}>{product.costPrice ? formatCurrency(product.costPrice,"TZS") : "—"}</td>
                    <td style={S.tdr}><span style={dynS.stockBadge(isLow)}>{stock}{isLow?" ⚠":""}</span></td>
                    <td style={S.tdc}>
                      <div style={{display:"flex", gap:6, justifyContent:"center"}}>
                        <button onClick={() => openModal(product)} style={{padding:"5px 12px", borderRadius:8, border:"1px solid #bfdbfe", background:"#eff6ff", color:"#2563eb", fontSize:12, fontWeight:700, cursor:"pointer"}}>✏ Edit</button>
                        <button onClick={() => deleteProduct(product.id)} style={{padding:"5px 12px", borderRadius:8, border:"1px solid #fecaca", background:"#fef2f2", color:"#dc2626", fontSize:12, fontWeight:700, cursor:"pointer"}}>🗑</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!loading && products.length === 0 && (
                <tr><td colSpan={7} style={{...S.td, textAlign:"center", padding:"40px 0", color:"#9ca3af"}}>Hakuna bidhaa zilizopatikana</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div style={S.pgBar}>
            <span>Ukurasa {page} kati ya {totalPages}</span>
            <div style={{display:"flex", gap:6}}>
              <button disabled={page===1} onClick={() => setPage(p=>p-1)} style={{padding:"5px 12px", border:"1px solid #e5e7eb", borderRadius:8, fontSize:12, cursor:page===1?"not-allowed":"pointer", opacity:page===1?0.4:1}}>← Nyuma</button>
              <button disabled={page===totalPages} onClick={() => setPage(p=>p+1)} style={{padding:"5px 12px", border:"1px solid #e5e7eb", borderRadius:8, fontSize:12, cursor:page===totalPages?"not-allowed":"pointer", opacity:page===totalPages?0.4:1}}>Mbele →</button>
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <div style={S.overlay}>
          <div style={S.modal}>
            <div style={S.mhdr}>
              <span style={{fontSize:15, fontWeight:800, color:"#111"}}>{editing?"✏ Hariri Bidhaa":"➕ Ongeza Bidhaa"}</span>
              <button onClick={() => setShowModal(false)} style={{background:"none", border:"none", fontSize:22, cursor:"pointer", color:"#9ca3af", lineHeight:1}}>×</button>
            </div>
            <div style={S.mbody}>
              <div style={{...S.grid2, marginBottom:12}}>
                <div style={{gridColumn:"1/-1"}}>
                  <label style={S.lbl}>Jina la Bidhaa *</label>
                  <input value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))} placeholder="mfano: Coca Cola 500ml" style={S.inp}/>
                </div>
                <div>
                  <label style={S.lbl}>Kategoria</label>
                  <select value={form.categoryId} onChange={e => setForm(f=>({...f,categoryId:e.target.value}))} style={S.sel}>
                    <option value="">Bila Kategoria</option>
                    {categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={S.lbl}>Kitengo</label>
                  <select value={form.unitId} onChange={e => setForm(f=>({...f,unitId:e.target.value}))} style={S.sel}>
                    <option value="">Bila Kitengo</option>
                    {units.map(u=><option key={u.id} value={u.id}>{u.name} ({u.abbreviation})</option>)}
                  </select>
                </div>
                <div>
                  <label style={S.lbl}>SKU</label>
                  <input value={form.sku} onChange={e => setForm(f=>({...f,sku:e.target.value}))} placeholder="Hiari" style={S.inp}/>
                </div>
                <div>
                  <label style={S.lbl}>Barcode</label>
                  <input value={form.barcode} onChange={e => setForm(f=>({...f,barcode:e.target.value}))} placeholder="Hiari" style={S.inp}/>
                </div>
                <div>
                  <label style={S.lbl}>Bei Rejareja (TZS) *</label>
                  <input type="number" value={form.retailPrice} onChange={e => setForm(f=>({...f,retailPrice:e.target.value}))} placeholder="0" style={S.inp}/>
                </div>
                <div>
                  <label style={S.lbl}>Bei Jumla (TZS)</label>
                  <input type="number" value={form.wholesalePrice} onChange={e => setForm(f=>({...f,wholesalePrice:e.target.value}))} placeholder="Hiari" style={S.inp}/>
                </div>
                <div>
                  <label style={S.lbl}>Gharama (TZS)</label>
                  <input type="number" value={form.costPrice} onChange={e => setForm(f=>({...f,costPrice:e.target.value}))} placeholder="Hiari" style={S.inp}/>
                </div>
                <div>
                  <label style={S.lbl}>Kiwango cha Chini</label>
                  <input type="number" value={form.minStockLevel} onChange={e => setForm(f=>({...f,minStockLevel:e.target.value}))} style={S.inp}/>
                </div>
              </div>
            </div>
            <div style={S.mftr}>
              <button onClick={() => setShowModal(false)} style={S.cancelB}>Ghairi</button>
              <button onClick={saveProduct} disabled={saving} style={dynS.saveB(saving)}>
                {saving?"Inahifadhi…":(editing?"Sasisha":"Unda")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
