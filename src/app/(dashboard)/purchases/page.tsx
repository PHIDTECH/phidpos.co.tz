"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
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

  const S: Record<string, React.CSSProperties> = {
    page:   { padding:24, fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" },
    hdr:    { display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 },
    h1:     { fontSize:22, fontWeight:800, color:"#111", margin:0 },
    sub:    { fontSize:13, color:"#6b7280", marginTop:4 },
    addBtn: { display:"flex", alignItems:"center", gap:6, padding:"9px 18px", background:"#2563eb", color:"#fff", border:"none", borderRadius:10, fontSize:13, fontWeight:700, cursor:"pointer" },
    card:   { background:"#fff", border:"1px solid #e5e7eb", borderRadius:14, overflow:"hidden", boxShadow:"0 1px 4px rgba(0,0,0,0.04)", marginBottom:20 },
    th:     { padding:"11px 14px", fontSize:12, fontWeight:700, color:"#6b7280", textAlign:"left" as const, borderBottom:"1px solid #e5e7eb", background:"#f9fafb", whiteSpace:"nowrap" as const },
    thr:    { padding:"11px 14px", fontSize:12, fontWeight:700, color:"#6b7280", textAlign:"right" as const, borderBottom:"1px solid #e5e7eb", background:"#f9fafb", whiteSpace:"nowrap" as const },
    td:     { padding:"12px 14px", fontSize:13, color:"#374151", borderBottom:"1px solid #f3f4f6", verticalAlign:"middle" as const },
    tdr:    { padding:"12px 14px", fontSize:13, color:"#374151", borderBottom:"1px solid #f3f4f6", textAlign:"right" as const, verticalAlign:"middle" as const },
    overlay:{ position:"fixed" as const, inset:0, background:"rgba(0,0,0,0.55)", zIndex:50, display:"flex", alignItems:"center", justifyContent:"center", padding:16 },
    modal:  { background:"#fff", borderRadius:18, width:"100%", maxWidth:680, boxShadow:"0 20px 60px rgba(0,0,0,0.2)", display:"flex", flexDirection:"column" as const, maxHeight:"90vh" },
    mhdr:   { display:"flex", alignItems:"center", justifyContent:"space-between", padding:"16px 20px", borderBottom:"1px solid #e5e7eb", flexShrink:0 },
    mbody:  { padding:20, overflowY:"auto" as const, flex:1 },
    mftr:   { display:"flex", gap:10, padding:"14px 20px", borderTop:"1px solid #e5e7eb", flexShrink:0 },
    lbl:    { fontSize:13, fontWeight:700, color:"#374151", display:"block", marginBottom:5 },
    inp:    { width:"100%", padding:"9px 12px", border:"1px solid #e5e7eb", borderRadius:10, fontSize:13, outline:"none", boxSizing:"border-box" as const },
    sel:    { width:"100%", padding:"9px 12px", border:"1px solid #e5e7eb", borderRadius:10, fontSize:13, outline:"none", background:"#fff", boxSizing:"border-box" as const },
    grid2:  { display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:14 },
    cancelB:{ flex:1, padding:"10px 0", borderRadius:12, border:"1px solid #e5e7eb", background:"#fff", fontSize:14, fontWeight:700, cursor:"pointer", color:"#374151" },
    saveB:  { flex:1, padding:"10px 0", borderRadius:12, border:"none", background:"#2563eb", color:"#fff", fontSize:14, fontWeight:700, cursor:"pointer" },
  };

  return (
    <div style={S.page}>
      <div style={S.hdr}>
        <div>
          <h1 style={S.h1}>🛍 Manunuzi</h1>
          <p style={S.sub}>{purchases.length} manunuzi ya hivi karibuni</p>
        </div>
        <button onClick={() => setShowModal(true)} style={S.addBtn}>＋ Manunuzi Mapya</button>
      </div>

      <div style={S.card}>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%", borderCollapse:"collapse"}}>
            <thead>
              <tr>
                <th style={S.th}>Ankara</th>
                <th style={S.th}>Msambazaji</th>
                <th style={S.th}>Duka</th>
                <th style={S.thr}>Jumla</th>
                <th style={S.thr}>Kilicholipwa</th>
                <th style={S.thr}>Salio</th>
                <th style={S.th}>Tarehe</th>
              </tr>
            </thead>
            <tbody>
              {loading ? Array.from({length:5}).map((_,i)=>(
                <tr key={i}>{Array.from({length:7}).map((_,j)=>(
                  <td key={j} style={S.td}><div style={{height:14,background:"#f3f4f6",borderRadius:6}}/></td>
                ))}</tr>
              )) : purchases.map(p => (
                <tr key={p.id}>
                  <td style={{...S.td, fontFamily:"monospace", fontSize:11, color:"#6b7280"}}>{p.invoiceNumber || p.id.slice(0,8).toUpperCase()}</td>
                  <td style={{...S.td, fontWeight:700}}>{p.supplier?.name}</td>
                  <td style={{...S.td, color:"#6b7280"}}>{p.store?.name}</td>
                  <td style={{...S.tdr, fontWeight:700, color:"#2563eb"}}>{formatCurrency(p.total,"TZS")}</td>
                  <td style={{...S.tdr, color:"#16a34a", fontWeight:700}}>{formatCurrency(p.amountPaid,"TZS")}</td>
                  <td style={{...S.tdr, color:Number(p.total)-Number(p.amountPaid)>0?"#dc2626":"#16a34a", fontWeight:700}}>{formatCurrency(Number(p.total)-Number(p.amountPaid),"TZS")}</td>
                  <td style={{...S.td, fontSize:12, color:"#9ca3af"}}>{formatDate(p.createdAt)}</td>
                </tr>
              ))}
              {!loading && purchases.length===0 && (
                <tr><td colSpan={7} style={{...S.td, textAlign:"center", padding:"40px 0", color:"#9ca3af"}}>Hakuna manunuzi yaliyorekodiwa</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div style={S.overlay}>
          <div style={S.modal}>
            <div style={S.mhdr}>
              <span style={{fontSize:15,fontWeight:800,color:"#111"}}>🛍 Rekodi Manunuzi</span>
              <button onClick={()=>setShowModal(false)} style={{background:"none",border:"none",fontSize:22,cursor:"pointer",color:"#9ca3af",lineHeight:1}}>×</button>
            </div>
            <div style={S.mbody}>
              <div style={S.grid2}>
                <div>
                  <label style={S.lbl}>Msambazaji *</label>
                  <select value={form.supplierId} onChange={e=>setForm(f=>({...f,supplierId:e.target.value}))} style={S.sel}>
                    <option value="">Chagua msambazaji</option>
                    {suppliers.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={S.lbl}>Nambari ya Ankara</label>
                  <input value={form.invoiceNumber} onChange={e=>setForm(f=>({...f,invoiceNumber:e.target.value}))} placeholder="INV-001" style={S.inp}/>
                </div>
              </div>

              <div style={{marginBottom:14}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
                  <span style={{fontSize:13,fontWeight:700,color:"#374151"}}>Bidhaa</span>
                  <button onClick={addItem} style={{background:"none",border:"none",cursor:"pointer",fontSize:13,color:"#2563eb",fontWeight:700}}>＋ Ongeza Bidhaa</button>
                </div>
                {items.map((item,idx)=>(
                  <div key={idx} style={{display:"grid",gridTemplateColumns:"1fr 80px 110px 90px 32px",gap:8,marginBottom:8,alignItems:"center"}}>
                    <select value={item.productId} onChange={e=>updateItem(idx,"productId",e.target.value)} style={S.sel}>
                      <option value="">Chagua bidhaa</option>
                      {products.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    <input type="number" value={item.quantity} onChange={e=>updateItem(idx,"quantity",e.target.value)} placeholder="Idadi" style={S.inp}/>
                    <input type="number" value={item.unitCost} onChange={e=>updateItem(idx,"unitCost",e.target.value)} placeholder="Gharama" style={S.inp}/>
                    <div style={{textAlign:"right",fontWeight:700,color:"#2563eb",fontSize:13}}>{formatCurrency(item.total,"TZS")}</div>
                    {items.length>1 && <button onClick={()=>removeItem(idx)} style={{background:"none",border:"none",cursor:"pointer",fontSize:16,color:"#dc2626"}}>×</button>}
                  </div>
                ))}
              </div>

              <div style={{borderTop:"1px solid #e5e7eb",paddingTop:12,marginBottom:14,textAlign:"right"}}>
                <div style={{fontSize:12,color:"#6b7280"}}>Jumla Kuu</div>
                <div style={{fontSize:24,fontWeight:900,color:"#2563eb"}}>{formatCurrency(grandTotal,"TZS")}</div>
              </div>

              <div style={S.grid2}>
                <div>
                  <label style={S.lbl}>Kilicholipwa (TZS)</label>
                  <input type="number" value={form.amountPaid} onChange={e=>setForm(f=>({...f,amountPaid:e.target.value}))} placeholder={grandTotal.toString()} style={S.inp}/>
                </div>
                <div>
                  <label style={S.lbl}>Maelezo</label>
                  <input value={form.note} onChange={e=>setForm(f=>({...f,note:e.target.value}))} placeholder="Hiari" style={S.inp}/>
                </div>
              </div>
            </div>
            <div style={S.mftr}>
              <button onClick={()=>setShowModal(false)} style={S.cancelB}>Ghairi</button>
              <button onClick={savePurchase} disabled={saving} style={S.saveB}>{saving?"Inahifadhi…":"Rekodi Manunuzi"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
