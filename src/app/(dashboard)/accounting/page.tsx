"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
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
    { label: "Mapato Yote",     value: formatCurrency(summary?.totalRevenue  || 0,"TZS"), icon:"📈", clr:"#16a34a", bg:"#f0fdf4" },
    { label: "Matumizi Yote",   value: formatCurrency(summary?.totalExpenses || 0,"TZS"), icon:"📉", clr:"#dc2626", bg:"#fef2f2" },
    { label: "Faida Halisi",    value: formatCurrency(summary?.netProfit     || 0,"TZS"), icon:"💵", clr:(summary?.netProfit>=0?"#2563eb":"#dc2626"), bg:(summary?.netProfit>=0?"#eff6ff":"#fef2f2") },
    { label: "Madeni Yanayodaiwa", value: formatCurrency(summary?.outstanding || 0,"TZS"), icon:"⏳", clr:"#d97706", bg:"#fffbeb" },
  ];

  const S: Record<string,React.CSSProperties> = {
    page:   { padding:24, fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" },
    hdr:    { display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 },
    h1:     { fontSize:22, fontWeight:800, color:"#111", margin:0 },
    sub:    { fontSize:13, color:"#6b7280", marginTop:4 },
    addBtn: { padding:"9px 18px", background:"#2563eb", color:"#fff", border:"none", borderRadius:10, fontSize:13, fontWeight:700, cursor:"pointer" },
    dateRow:{ display:"flex", gap:12, flexWrap:"wrap" as const, marginBottom:20, alignItems:"center" },
    dateI:  { padding:"8px 12px", border:"1px solid #e5e7eb", borderRadius:10, fontSize:13, outline:"none" },
    statsG: { display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))", gap:14, marginBottom:20 },
    statC:  { background:"#fff", border:"1px solid #e5e7eb", borderRadius:14, padding:18, boxShadow:"0 1px 4px rgba(0,0,0,0.04)" },
    card:   { background:"#fff", border:"1px solid #e5e7eb", borderRadius:14, overflow:"hidden", boxShadow:"0 1px 4px rgba(0,0,0,0.04)", marginBottom:20 },
    cardHdr:{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 16px", borderBottom:"1px solid #e5e7eb" },
    th:     { padding:"11px 14px", fontSize:12, fontWeight:700, color:"#6b7280", textAlign:"left" as const, borderBottom:"1px solid #e5e7eb", background:"#f9fafb" },
    thr:    { padding:"11px 14px", fontSize:12, fontWeight:700, color:"#6b7280", textAlign:"right" as const, borderBottom:"1px solid #e5e7eb", background:"#f9fafb" },
    td:     { padding:"12px 14px", fontSize:13, color:"#374151", borderBottom:"1px solid #f3f4f6" },
    tdr:    { padding:"12px 14px", fontSize:13, color:"#374151", borderBottom:"1px solid #f3f4f6", textAlign:"right" as const },
    overlay:{ position:"fixed" as const, inset:0, background:"rgba(0,0,0,0.55)", zIndex:50, display:"flex", alignItems:"center", justifyContent:"center", padding:16 },
    modal:  { background:"#fff", borderRadius:18, width:"100%", maxWidth:440, boxShadow:"0 20px 60px rgba(0,0,0,0.2)" },
    mhdr:   { display:"flex", alignItems:"center", justifyContent:"space-between", padding:"16px 20px", borderBottom:"1px solid #e5e7eb" },
    mbody:  { padding:20 },
    mftr:   { display:"flex", gap:10, padding:"14px 20px", borderTop:"1px solid #e5e7eb" },
    lbl:    { fontSize:13, fontWeight:700, color:"#374151", display:"block", marginBottom:5 },
    inp:    { width:"100%", padding:"9px 12px", border:"1px solid #e5e7eb", borderRadius:10, fontSize:13, outline:"none", boxSizing:"border-box" as const, marginBottom:12 },
    sel:    { width:"100%", padding:"9px 12px", border:"1px solid #e5e7eb", borderRadius:10, fontSize:13, outline:"none", background:"#fff", boxSizing:"border-box" as const, marginBottom:12 },
    grid2:  { display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 },
    cancelB:{ flex:1, padding:"10px 0", borderRadius:12, border:"1px solid #e5e7eb", background:"#fff", fontSize:14, fontWeight:700, cursor:"pointer", color:"#374151" },
    saveB:  { flex:1, padding:"10px 0", borderRadius:12, border:"none", background:"#2563eb", color:"#fff", fontSize:14, fontWeight:700, cursor:"pointer" },
  };

  return (
    <div style={S.page}>
      <div style={S.hdr}>
        <div>
          <h1 style={S.h1}>💼 Uhasibu</h1>
          <p style={S.sub}>Mapato, matumizi na faida</p>
        </div>
        <button onClick={() => setShowModal(true)} style={S.addBtn}>＋ Rekodi Matumizi</button>
      </div>

      <div style={S.dateRow}>
        <span style={{fontSize:13,fontWeight:700}}>Kutoka:</span>
        <input type="date" value={from} onChange={e=>setFrom(e.target.value)} style={S.dateI}/>
        <span style={{fontSize:13,fontWeight:700}}>Hadi:</span>
        <input type="date" value={to} onChange={e=>setTo(e.target.value)} style={S.dateI}/>
      </div>

      <div style={S.statsG}>
        {statCards.map((s,i)=>(
          <div key={i} style={S.statC}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
              <span style={{fontSize:12,fontWeight:700,color:"#6b7280",textTransform:"uppercase" as const,letterSpacing:"0.04em"}}>{s.label}</span>
              <span style={{fontSize:20,background:s.bg,borderRadius:8,padding:"4px 6px"}}>{s.icon}</span>
            </div>
            <div style={{fontSize:20,fontWeight:900,color:s.clr}}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={S.card}>
        <div style={S.cardHdr}>
          <span style={{fontSize:14,fontWeight:700,color:"#111"}}>📋 Matumizi</span>
          <span style={{fontSize:12,color:"#9ca3af"}}>{expenses.length} rekodi</span>
        </div>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <thead>
              <tr>
                <th style={S.th}>Maelezo</th>
                <th style={S.th}>Kategoria</th>
                <th style={S.th}>Duka</th>
                <th style={S.thr}>Kiasi</th>
                <th style={S.th}>Tarehe</th>
              </tr>
            </thead>
            <tbody>
              {loading ? Array.from({length:5}).map((_,i)=>(
                <tr key={i}>{Array.from({length:5}).map((_,j)=>(
                  <td key={j} style={S.td}><div style={{height:14,background:"#f3f4f6",borderRadius:6}}/></td>
                ))}</tr>
              )) : expenses.map(e=>(
                <tr key={e.id}>
                  <td style={{...S.td,fontWeight:700}}>{e.description}</td>
                  <td style={S.td}><span style={{display:"inline-block",padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:700,background:"#fef2f2",color:"#b91c1c"}}>{e.category}</span></td>
                  <td style={{...S.td,color:"#6b7280"}}>{e.store?.name||"—"}</td>
                  <td style={{...S.tdr,fontWeight:700,color:"#dc2626"}}>{formatCurrency(e.amount,"TZS")}</td>
                  <td style={{...S.td,fontSize:12,color:"#9ca3af"}}>{formatDate(e.date)}</td>
                </tr>
              ))}
              {!loading&&expenses.length===0&&(
                <tr><td colSpan={5} style={{...S.td,textAlign:"center",padding:"40px 0",color:"#9ca3af"}}>Hakuna matumizi yaliyorekodiwa katika kipindi hiki</td></tr>
              )}
            </tbody>
            {!loading&&expenses.length>0&&(
              <tfoot>
                <tr style={{background:"#f9fafb",borderTop:"2px solid #e5e7eb"}}>
                  <td colSpan={3} style={{...S.td,fontWeight:800}}>Jumla</td>
                  <td style={{...S.tdr,fontWeight:900,color:"#dc2626",fontSize:15}}>{formatCurrency(expenses.reduce((s,e)=>s+Number(e.amount),0),"TZS")}</td>
                  <td style={S.td}/>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {showModal&&(
        <div style={S.overlay}>
          <div style={S.modal}>
            <div style={S.mhdr}>
              <span style={{fontSize:15,fontWeight:800,color:"#111"}}>📋 Rekodi Matumizi</span>
              <button onClick={()=>setShowModal(false)} style={{background:"none",border:"none",fontSize:22,cursor:"pointer",color:"#9ca3af",lineHeight:1}}>×</button>
            </div>
            <div style={S.mbody}>
              <label style={S.lbl}>Maelezo *</label>
              <input value={form.description} onChange={e=>setForm(p=>({...p,description:e.target.value}))} placeholder="mfano: Malipo ya kodi ya mwezi" style={S.inp}/>
              <div style={S.grid2}>
                <div>
                  <label style={S.lbl}>Kiasi (TZS) *</label>
                  <input type="number" value={form.amount} onChange={e=>setForm(p=>({...p,amount:e.target.value}))} placeholder="0" style={{...S.inp,marginBottom:0}}/>
                </div>
                <div>
                  <label style={S.lbl}>Tarehe *</label>
                  <input type="date" value={form.date} onChange={e=>setForm(p=>({...p,date:e.target.value}))} style={{...S.inp,marginBottom:0}}/>
                </div>
              </div>
              <div style={{marginTop:12}}>
                <label style={S.lbl}>Kategoria</label>
                <select value={form.category} onChange={e=>setForm(p=>({...p,category:e.target.value}))} style={S.sel}>
                  {EXPENSE_CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <label style={S.lbl}>Maelezo Zaidi</label>
              <input value={form.note} onChange={e=>setForm(p=>({...p,note:e.target.value}))} placeholder="Hiari" style={{...S.inp,marginBottom:0}}/>
            </div>
            <div style={S.mftr}>
              <button onClick={()=>setShowModal(false)} style={S.cancelB}>Ghairi</button>
              <button onClick={saveExpense} disabled={saving} style={S.saveB}>{saving?"Inahifadhi…":"Rekodi Matumizi"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
