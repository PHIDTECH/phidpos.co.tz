"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";

interface InventoryItem {
  id: string;
  quantity: number;
  product: { id: string; name: string; sku?: string; minStockLevel: number; category?: { name: string }; unit?: { abbreviation: string } };
  store: { name: string };
  lastUpdated: string;
}

interface Movement {
  id: string;
  type: string;
  quantityBefore: number;
  quantityAfter: number;
  change: number;
  note?: string;
  createdAt: string;
  product?: { name: string };
  user?: { name: string };
}

export default function InventoryPage() {
  const [tab, setTab] = useState<"stock" | "movements">("stock");
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMov, setLoadingMov] = useState(false);
  const [search, setSearch] = useState("");
  const [lowOnly, setLowOnly] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState<InventoryItem | null>(null);
  const [adjQty, setAdjQty] = useState("");
  const [adjNote, setAdjNote] = useState("");
  const [adjType, setAdjType] = useState<"SET" | "ADD" | "SUBTRACT">("ADD");
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadData(); }, [search, lowOnly]);
  useEffect(() => { if (tab === "movements") loadMovements(); }, [tab]);

  async function loadData() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ search, ...(lowOnly ? { lowStock: "true" } : {}) });
      const res = await fetch(`/api/inventory?${params}`);
      const data = await res.json();
      setItems(data.inventories || []);
    } catch { toast.error("Imeshindwa kupakia hifadhi"); }
    setLoading(false);
  }

  async function loadMovements() {
    setLoadingMov(true);
    try {
      const res = await fetch("/api/inventory/movements");
      const data = await res.json();
      setMovements(data.movements || []);
    } catch { /* silent */ }
    setLoadingMov(false);
  }

  function openAdjust(item: InventoryItem) {
    setSelected(item); setAdjQty(""); setAdjNote(""); setAdjType("ADD"); setShowModal(true);
  }

  async function saveAdjustment() {
    if (!selected || !adjQty) { toast.error("Ingiza idadi"); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/inventory", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inventoryId: selected.id, type: adjType, quantity: parseFloat(adjQty), note: adjNote }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      toast.success("Hifadhi imesasishwa");
      setShowModal(false);
      loadData();
    } catch (err: any) { toast.error(err.message || "Imeshindwa"); }
    setSaving(false);
  }

  const lowCount = items.filter(i => i.quantity <= i.product.minStockLevel).length;

  const dynS = {
    tab:     (active: boolean): React.CSSProperties => ({ padding:"8px 20px", borderRadius:8, border:"none", cursor:"pointer", fontSize:13, fontWeight:700, background:active?"#fff":"transparent", color:active?"#2563eb":"#6b7280", boxShadow:active?"0 1px 4px rgba(0,0,0,0.1)":"none", transition:"all 0.15s" }),
    lowBtn:  (on: boolean): React.CSSProperties => ({ padding:"9px 16px", borderRadius:10, border:`1px solid ${on?"#f59e0b":"#e5e7eb"}`, background:on?"#f59e0b":"#fff", color:on?"#fff":"#374151", fontSize:13, fontWeight:600, cursor:"pointer" }),
    badge:   (low: boolean): React.CSSProperties => ({ display:"inline-flex", alignItems:"center", gap:4, padding:"3px 10px", borderRadius:20, fontSize:11, fontWeight:700, background:low?"#fef2f2":"#f0fdf4", color:low?"#dc2626":"#16a34a" }),
    typeBtn: (active: boolean): React.CSSProperties => ({ padding:"9px 4px", borderRadius:10, border:`2px solid ${active?"#2563eb":"#e5e7eb"}`, background:active?"#eff6ff":"#fff", color:active?"#2563eb":"#374151", fontSize:12, fontWeight:700, cursor:"pointer", textAlign:"center" }),
    saveB:   (dis: boolean): React.CSSProperties => ({ flex:1, padding:"10px 0", borderRadius:12, border:"none", background:dis?"#d1d5db":"#2563eb", color:"#fff", fontSize:14, fontWeight:700, cursor:dis?"not-allowed":"pointer" }),
    movType: (t: string): React.CSSProperties => {
      const map: Record<string, [string,string]> = {
        SALE:["#fef2f2","#dc2626"], PURCHASE:["#f0fdf4","#16a34a"],
        ADJUSTMENT:["#eff6ff","#2563eb"], RETURN:["#fdf4ff","#9333ea"], TRANSFER:["#fff7ed","#c2410c"]
      };
      const [bg,color] = map[t] || ["#f3f4f6","#6b7280"];
      return { display:"inline-flex", alignItems:"center", padding:"2px 10px", borderRadius:20, fontSize:11, fontWeight:700, background:bg, color };
    },
  };

  const S: Record<string, React.CSSProperties> = {
    page:    { padding: 24, fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" },
    hdr:     { display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 },
    h1:      { fontSize:22, fontWeight:800, color:"#111", margin:0 },
    sub:     { fontSize:13, color:"#6b7280", marginTop:4 },
    tabs:    { display:"flex", gap:4, marginBottom:20, background:"#f3f4f6", padding:4, borderRadius:10, width:"fit-content" },
    toolbar: { display:"flex", gap:10, marginBottom:16, flexWrap:"wrap" as const },
    srch:    { flex:1, minWidth:200, position:"relative" as const },
    srchI:   { width:"100%", padding:"9px 12px 9px 34px", border:"1px solid #e5e7eb", borderRadius:10, fontSize:13, outline:"none", boxSizing:"border-box" as const },
    srchIco: { position:"absolute" as const, left:10, top:"50%", transform:"translateY(-50%)", fontSize:14, color:"#9ca3af" },
    refBtn:  { padding:"9px 16px", borderRadius:10, border:"1px solid #e5e7eb", background:"#fff", color:"#374151", fontSize:13, fontWeight:600, cursor:"pointer", display:"flex", alignItems:"center", gap:6 },
    warn:    { display:"flex", alignItems:"center", gap:10, background:"#fffbeb", border:"1px solid #fde68a", borderRadius:10, padding:"10px 16px", marginBottom:16, fontSize:13, color:"#92400e", fontWeight:600 },
    card:    { background:"#fff", border:"1px solid #e5e7eb", borderRadius:14, overflow:"hidden", boxShadow:"0 1px 4px rgba(0,0,0,0.04)" },
    th:      { padding:"11px 14px", fontSize:12, fontWeight:700, color:"#6b7280", textAlign:"left" as const, borderBottom:"1px solid #e5e7eb", background:"#f9fafb", whiteSpace:"nowrap" as const },
    thr:     { padding:"11px 14px", fontSize:12, fontWeight:700, color:"#6b7280", textAlign:"right" as const, borderBottom:"1px solid #e5e7eb", background:"#f9fafb", whiteSpace:"nowrap" as const },
    td:      { padding:"12px 14px", fontSize:13, color:"#374151", borderBottom:"1px solid #f3f4f6", verticalAlign:"middle" as const },
    tdr:     { padding:"12px 14px", fontSize:13, color:"#374151", borderBottom:"1px solid #f3f4f6", textAlign:"right" as const, verticalAlign:"middle" as const },
    adjBtn:  { padding:"6px 14px", borderRadius:8, border:"1px solid #bfdbfe", background:"#eff6ff", color:"#2563eb", fontSize:12, fontWeight:700, cursor:"pointer" },
    overlay: { position:"fixed" as const, inset:0, background:"rgba(0,0,0,0.55)", zIndex:50, display:"flex", alignItems:"center", justifyContent:"center", padding:16 },
    modal:   { background:"#fff", borderRadius:18, width:"100%", maxWidth:400, boxShadow:"0 20px 60px rgba(0,0,0,0.2)" },
    mhdr:    { display:"flex", alignItems:"center", justifyContent:"space-between", padding:"16px 20px", borderBottom:"1px solid #e5e7eb" },
    mbody:   { padding:20 },
    mftr:    { display:"flex", gap:10, padding:"14px 20px", borderTop:"1px solid #e5e7eb" },
    typGrid: { display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8, marginTop:8 },
    fldLbl:  { fontSize:13, fontWeight:700, color:"#374151", display:"block", marginBottom:6 },
    fldInp:  { width:"100%", padding:"9px 12px", border:"1px solid #e5e7eb", borderRadius:10, fontSize:14, outline:"none", boxSizing:"border-box" as const },
    cancelB: { flex:1, padding:"10px 0", borderRadius:12, border:"1px solid #e5e7eb", background:"#fff", fontSize:14, fontWeight:700, cursor:"pointer", color:"#374151" },
  };

  return (
    <div style={S.page}>
      {/* Header */}
      <div style={S.hdr}>
        <div>
          <h1 style={S.h1}>📦 Usimamizi wa Hifadhi</h1>
          <p style={S.sub}>{items.length} bidhaa · {lowCount} hifadhi ndogo</p>
        </div>
        <button onClick={loadData} style={S.refBtn}>🔄 Refresh</button>
      </div>

      {/* Tabs */}
      <div style={S.tabs}>
        <button style={dynS.tab(tab==="stock")} onClick={() => setTab("stock")}>📦 Hali ya Hifadhi</button>
        <button style={dynS.tab(tab==="movements")} onClick={() => setTab("movements")}>📋 Historia ya Mauzo</button>
      </div>

      {tab === "stock" && (
        <>
          {lowCount > 0 && (
            <div style={S.warn}>
              <span style={{fontSize:18}}>⚠️</span>
              <span>{lowCount} bidhaa ziko chini ya kiwango cha chini</span>
              <button onClick={() => setLowOnly(true)} style={{marginLeft:"auto",background:"none",border:"none",cursor:"pointer",fontSize:12,color:"#92400e",textDecoration:"underline",fontWeight:700}}>Onyesha tu</button>
            </div>
          )}
          <div style={S.toolbar}>
            <div style={S.srch}>
              <span style={S.srchIco}>🔍</span>
              <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Tafuta bidhaa…" style={S.srchI} />
            </div>
            <button onClick={() => setLowOnly(p => !p)} style={dynS.lowBtn(lowOnly)}>
              {lowOnly ? "✓ Hifadhi Ndogo" : "🔴 Hifadhi Ndogo"}
            </button>
          </div>
          <div style={S.card}>
            <div style={{overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse"}}>
                <thead>
                  <tr>
                    <th style={S.th}>Bidhaa</th>
                    <th style={S.th}>Kategoria</th>
                    <th style={S.th}>Duka</th>
                    <th style={S.thr}>Idadi</th>
                    <th style={S.thr}>Kiwango cha Chini</th>
                    <th style={S.th}>Hali</th>
                    <th style={S.th}>Imesasishwa</th>
                    <th style={{...S.th,textAlign:"center"}}>Rekebisha</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    Array.from({length:6}).map((_,i) => (
                      <tr key={i}>
                        {Array.from({length:8}).map((_,j) => (
                          <td key={j} style={S.td}><div style={{height:14,background:"#f3f4f6",borderRadius:6}} /></td>
                        ))}
                      </tr>
                    ))
                  ) : items.length === 0 ? (
                    <tr><td colSpan={8} style={{...S.td,textAlign:"center",padding:"40px 0",color:"#9ca3af"}}>Hakuna rekodi za hifadhi</td></tr>
                  ) : items.map(item => {
                    const isLow = item.quantity <= item.product.minStockLevel;
                    return (
                      <tr key={item.id} style={{background:isLow?"#fff9f9":"#fff"}}>
                        <td style={S.td}>
                          <div style={{fontWeight:700,color:"#111"}}>{item.product.name}</div>
                          {item.product.sku && <div style={{fontSize:11,color:"#9ca3af",marginTop:2}}>SKU: {item.product.sku}</div>}
                        </td>
                        <td style={S.td}>{item.product.category?.name || "—"}</td>
                        <td style={S.td}>{item.store.name}</td>
                        <td style={S.tdr}>
                          <span style={{fontSize:18,fontWeight:900,color:isLow?"#dc2626":"#111"}}>{item.quantity}</span>
                          {item.product.unit && <span style={{fontSize:11,color:"#9ca3af",marginLeft:4}}>{item.product.unit.abbreviation}</span>}
                        </td>
                        <td style={S.tdr}>{item.product.minStockLevel}</td>
                        <td style={S.td}><span style={dynS.badge(isLow)}>{isLow ? "⚠ Ndogo" : "✓ Inatosha"}</span></td>
                        <td style={{...S.td,fontSize:11,color:"#9ca3af"}}>{item.lastUpdated ? new Date(item.lastUpdated).toLocaleDateString("sw") : "—"}</td>
                        <td style={{...S.td,textAlign:"center"}}>
                          <button onClick={() => openAdjust(item)} style={S.adjBtn}>✏ Rekebisha</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {tab === "movements" && (
        <div style={S.card}>
          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse"}}>
              <thead>
                <tr>
                  <th style={S.th}>Bidhaa</th>
                  <th style={S.th}>Aina</th>
                  <th style={S.thr}>Kabla</th>
                  <th style={S.thr}>Mabadiliko</th>
                  <th style={S.thr}>Baada</th>
                  <th style={S.th}>Kumbuka</th>
                  <th style={S.th}>Mtumiaji</th>
                  <th style={S.th}>Tarehe</th>
                </tr>
              </thead>
              <tbody>
                {loadingMov ? (
                  Array.from({length:6}).map((_,i)=>(
                    <tr key={i}>{Array.from({length:8}).map((_,j)=>(<td key={j} style={S.td}><div style={{height:14,background:"#f3f4f6",borderRadius:6}}/></td>))}</tr>
                  ))
                ) : movements.length === 0 ? (
                  <tr><td colSpan={8} style={{...S.td,textAlign:"center",padding:"40px 0",color:"#9ca3af"}}>Hakuna historia ya mauzo bado</td></tr>
                ) : movements.map(m => (
                  <tr key={m.id}>
                    <td style={{...S.td,fontWeight:700}}>{m.product?.name || "—"}</td>
                    <td style={S.td}><span style={dynS.movType(m.type)}>{m.type}</span></td>
                    <td style={S.tdr}>{m.quantityBefore}</td>
                    <td style={{...S.tdr,fontWeight:800,color:m.change < 0?"#dc2626":"#16a34a"}}>{m.change > 0 ? `+${m.change}` : m.change}</td>
                    <td style={S.tdr}>{m.quantityAfter}</td>
                    <td style={{...S.td,fontSize:12,color:"#6b7280"}}>{m.note || "—"}</td>
                    <td style={{...S.td,fontSize:12}}>{m.user?.name || "—"}</td>
                    <td style={{...S.td,fontSize:11,color:"#9ca3af"}}>{new Date(m.createdAt).toLocaleString("sw")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && selected && (
        <div style={S.overlay}>
          <div style={S.modal}>
            <div style={S.mhdr}>
              <span style={{fontSize:15,fontWeight:800,color:"#111"}}>✏ Rekebisha Hifadhi</span>
              <button onClick={() => setShowModal(false)} style={{background:"none",border:"none",fontSize:22,cursor:"pointer",color:"#9ca3af",lineHeight:1}}>×</button>
            </div>
            <div style={S.mbody}>
              <div style={{background:"#eff6ff",borderRadius:12,padding:"12px 16px",marginBottom:16}}>
                <div style={{fontWeight:800,color:"#1d4ed8"}}>{selected.product.name}</div>
                <div style={{fontSize:13,color:"#3b82f6",marginTop:4}}>Hifadhi ya sasa: <strong>{selected.quantity}</strong></div>
              </div>
              <label style={S.fldLbl}>Aina ya Mabadiliko</label>
              <div style={S.typGrid}>
                {(["ADD","SUBTRACT","SET"] as const).map(type => (
                  <button key={type} onClick={() => setAdjType(type)} style={dynS.typeBtn(adjType===type)}>
                    {type==="ADD"?"+Ongeza":type==="SUBTRACT"?"-Punguza":"=Weka"}
                  </button>
                ))}
              </div>
              <label style={{...S.fldLbl,marginTop:16}}>Idadi *</label>
              <input type="number" value={adjQty} onChange={e => setAdjQty(e.target.value)} min="0"
                style={{...S.fldInp,textAlign:"right",fontSize:20,fontWeight:900}} />
              <label style={{...S.fldLbl,marginTop:12}}>Maelezo (si lazima)</label>
              <input type="text" value={adjNote} onChange={e => setAdjNote(e.target.value)}
                placeholder="mfano: Hesabu ya hifadhi" style={S.fldInp} />
              {adjQty && (
                <div style={{marginTop:12,background:"#f9fafb",borderRadius:10,padding:"10px 14px",fontSize:13}}>
                  Idadi mpya: <strong style={{fontSize:16,color:"#111"}}>
                    {adjType==="ADD"?selected.quantity+parseFloat(adjQty||"0"):
                     adjType==="SUBTRACT"?Math.max(0,selected.quantity-parseFloat(adjQty||"0")):
                     parseFloat(adjQty||"0")}
                  </strong>
                </div>
              )}
            </div>
            <div style={S.mftr}>
              <button onClick={() => setShowModal(false)} style={S.cancelB}>Ghairi</button>
              <button onClick={saveAdjustment} disabled={saving} style={dynS.saveB(saving)}>
                {saving ? "Inahifadhi…" : "Hifadhi"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
