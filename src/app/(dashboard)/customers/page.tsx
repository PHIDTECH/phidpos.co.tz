"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { formatCurrency } from "@/lib/utils";

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

  const typeColorMap: Record<string, [string,string]> = {
    RETAIL: ["#dbeafe","#1d4ed8"],
    WHOLESALE: ["#ede9fe","#7c3aed"],
    VIP: ["#fef3c7","#b45309"],
  };

  const S: Record<string, React.CSSProperties> = {
    page:    { padding:24, fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" },
    hdr:     { display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 },
    h1:      { fontSize:22, fontWeight:800, color:"#111", margin:0 },
    sub:     { fontSize:13, color:"#6b7280", marginTop:4 },
    addBtn:  { display:"flex", alignItems:"center", gap:6, padding:"9px 18px", background:"#2563eb", color:"#fff", border:"none", borderRadius:10, fontSize:13, fontWeight:700, cursor:"pointer" },
    toolbar: { display:"flex", gap:10, marginBottom:16, flexWrap:"wrap" as const },
    srchWrap:{ flex:1, minWidth:200, position:"relative" as const },
    srchIco: { position:"absolute" as const, left:10, top:"50%", transform:"translateY(-50%)", fontSize:14, color:"#9ca3af" },
    srchI:   { width:"100%", padding:"9px 12px 9px 34px", border:"1px solid #e5e7eb", borderRadius:10, fontSize:13, outline:"none", boxSizing:"border-box" as const },
    sel:     { padding:"9px 12px", border:"1px solid #e5e7eb", borderRadius:10, fontSize:13, outline:"none", background:"#fff" },
    card:    { background:"#fff", border:"1px solid #e5e7eb", borderRadius:14, overflow:"hidden", boxShadow:"0 1px 4px rgba(0,0,0,0.04)" },
    th:      { padding:"11px 14px", fontSize:12, fontWeight:700, color:"#6b7280", textAlign:"left" as const, borderBottom:"1px solid #e5e7eb", background:"#f9fafb", whiteSpace:"nowrap" as const },
    thr:     { padding:"11px 14px", fontSize:12, fontWeight:700, color:"#6b7280", textAlign:"right" as const, borderBottom:"1px solid #e5e7eb", background:"#f9fafb", whiteSpace:"nowrap" as const },
    thc:     { padding:"11px 14px", fontSize:12, fontWeight:700, color:"#6b7280", textAlign:"center" as const, borderBottom:"1px solid #e5e7eb", background:"#f9fafb", whiteSpace:"nowrap" as const },
    td:      { padding:"12px 14px", fontSize:13, color:"#374151", borderBottom:"1px solid #f3f4f6", verticalAlign:"middle" as const },
    tdr:     { padding:"12px 14px", fontSize:13, color:"#374151", borderBottom:"1px solid #f3f4f6", textAlign:"right" as const, verticalAlign:"middle" as const },
    overlay: { position:"fixed" as const, inset:0, background:"rgba(0,0,0,0.55)", zIndex:50, display:"flex", alignItems:"center", justifyContent:"center", padding:16 },
    modal:   { background:"#fff", borderRadius:18, width:"100%", maxWidth:440, boxShadow:"0 20px 60px rgba(0,0,0,0.2)" },
    mhdr:    { display:"flex", alignItems:"center", justifyContent:"space-between", padding:"16px 20px", borderBottom:"1px solid #e5e7eb" },
    mbody:   { padding:20 },
    mftr:    { display:"flex", gap:10, padding:"14px 20px", borderTop:"1px solid #e5e7eb" },
    lbl:     { fontSize:13, fontWeight:700, color:"#374151", display:"block", marginBottom:5 },
    inp:     { width:"100%", padding:"9px 12px", border:"1px solid #e5e7eb", borderRadius:10, fontSize:13, outline:"none", boxSizing:"border-box" as const, marginBottom:12 },
    cancelB: { flex:1, padding:"10px 0", borderRadius:12, border:"1px solid #e5e7eb", background:"#fff", fontSize:14, fontWeight:700, cursor:"pointer", color:"#374151" },
    saveB:   { flex:1, padding:"10px 0", borderRadius:12, border:"none", background:"#2563eb", color:"#fff", fontSize:14, fontWeight:700, cursor:"pointer" },
    saveGrn: { flex:1, padding:"10px 0", borderRadius:12, border:"none", background:"#16a34a", color:"#fff", fontSize:14, fontWeight:700, cursor:"pointer" },
    avatar:  { width:36, height:36, borderRadius:"50%", background:"linear-gradient(135deg,#60a5fa,#6366f1)", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontSize:13, fontWeight:800, flexShrink:0 },
    grid2:   { display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 },
  };

  return (
    <div style={S.page}>
      <div style={S.hdr}>
        <div>
          <h1 style={S.h1}>👥 Wateja</h1>
          <p style={S.sub}>{total} wateja wamesajiliwa</p>
        </div>
        <button onClick={() => openModal()} style={S.addBtn}>＋ Ongeza Mteja</button>
      </div>

      <div style={S.toolbar}>
        <div style={S.srchWrap}>
          <span style={S.srchIco}>🔍</span>
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Tafuta wateja…" style={S.srchI}/>
        </div>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} style={S.sel}>
          <option value="">Aina Zote</option>
          <option value="RETAIL">Rejareja</option>
          <option value="WHOLESALE">Jumla</option>
          <option value="VIP">VIP</option>
        </select>
      </div>

      <div style={S.card}>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%", borderCollapse:"collapse"}}>
            <thead>
              <tr>
                <th style={S.th}>Mteja</th>
                <th style={S.th}>Aina</th>
                <th style={S.thr}>Pointi</th>
                <th style={S.thr}>Deni</th>
                <th style={S.thr}>Mauzo</th>
                <th style={S.thc}>Vitendo</th>
              </tr>
            </thead>
            <tbody>
              {loading ? Array.from({length:5}).map((_,i)=>(
                <tr key={i}>{Array.from({length:6}).map((_,j)=>(
                  <td key={j} style={S.td}><div style={{height:14,background:"#f3f4f6",borderRadius:6}}/></td>
                ))}</tr>
              )) : customers.map(c => {
                const [tbg, tclr] = typeColorMap[c.type] || ["#f3f4f6","#6b7280"];
                return (
                  <tr key={c.id}>
                    <td style={S.td}>
                      <div style={{display:"flex", alignItems:"center", gap:10}}>
                        <div style={S.avatar}>{c.name.charAt(0).toUpperCase()}</div>
                        <div>
                          <div style={{fontWeight:700, color:"#111"}}>{c.name}</div>
                          <div style={{fontSize:11, color:"#9ca3af", marginTop:2}}>
                            {c.phone && <span>📞 {c.phone}</span>}
                            {c.email && <span style={{marginLeft:8}}>✉ {c.email}</span>}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={S.td}><span style={{display:"inline-block", padding:"3px 10px", borderRadius:20, fontSize:11, fontWeight:700, background:tbg, color:tclr}}>{c.type}</span></td>
                    <td style={{...S.tdr, color:"#d97706", fontWeight:700}}>⭐ {c.loyaltyPoints}</td>
                    <td style={S.tdr}>
                      {Number(c.totalDebt) > 0
                        ? <button onClick={() => { setDebtCustomer(c); setShowDebtModal(true); }} style={{background:"none", border:"none", cursor:"pointer", color:"#dc2626", fontWeight:700, fontSize:13}}>⚠ {formatCurrency(c.totalDebt,"TZS")}</button>
                        : <span style={{color:"#16a34a", fontWeight:600}}>—</span>}
                    </td>
                    <td style={{...S.tdr, color:"#6b7280"}}>{c._count?.sales || 0}</td>
                    <td style={{...S.td, textAlign:"center"}}>
                      <button onClick={() => openModal(c)} style={{padding:"5px 12px", borderRadius:8, border:"1px solid #bfdbfe", background:"#eff6ff", color:"#2563eb", fontSize:12, fontWeight:700, cursor:"pointer"}}>✏ Edit</button>
                    </td>
                  </tr>
                );
              })}
              {!loading && customers.length === 0 && (
                <tr><td colSpan={6} style={{...S.td, textAlign:"center", padding:"40px 0", color:"#9ca3af"}}>Hakuna wateja walioopatikana</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div style={S.overlay}>
          <div style={S.modal}>
            <div style={S.mhdr}>
              <span style={{fontSize:15, fontWeight:800, color:"#111"}}>{editing?"✏ Hariri Mteja":"➕ Ongeza Mteja"}</span>
              <button onClick={() => setShowModal(false)} style={{background:"none", border:"none", fontSize:22, cursor:"pointer", color:"#9ca3af", lineHeight:1}}>×</button>
            </div>
            <div style={S.mbody}>
              {[
                {label:"Jina Kamili *", key:"name", type:"text", ph:"John Mwamba"},
                {label:"Simu", key:"phone", type:"tel", ph:"+255700000000"},
                {label:"Barua Pepe", key:"email", type:"email", ph:"john@mfano.com"},
                {label:"Anwani", key:"address", type:"text", ph:"Dar es Salaam"},
              ].map(f=>(
                <div key={f.key}>
                  <label style={S.lbl}>{f.label}</label>
                  <input type={f.type} value={(form as any)[f.key]} onChange={e=>setForm(p=>({...p,[f.key]:e.target.value}))} placeholder={f.ph} style={S.inp}/>
                </div>
              ))}
              <div style={S.grid2}>
                <div>
                  <label style={S.lbl}>Aina ya Mteja</label>
                  <select value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))} style={{...S.inp, marginBottom:0}}>
                    <option value="RETAIL">Rejareja</option>
                    <option value="WHOLESALE">Jumla</option>
                    <option value="VIP">VIP</option>
                  </select>
                </div>
                <div>
                  <label style={S.lbl}>Kikomo cha Mkopo (TZS)</label>
                  <input type="number" value={form.creditLimit} onChange={e=>setForm(f=>({...f,creditLimit:e.target.value}))} style={{...S.inp, marginBottom:0}}/>
                </div>
              </div>
            </div>
            <div style={S.mftr}>
              <button onClick={()=>setShowModal(false)} style={S.cancelB}>Ghairi</button>
              <button onClick={saveCustomer} disabled={saving} style={S.saveB}>{saving?"Inahifadhi…":(editing?"Sasisha":"Unda")}</button>
            </div>
          </div>
        </div>
      )}

      {showDebtModal && debtCustomer && (
        <div style={S.overlay}>
          <div style={{...S.modal, maxWidth:380}}>
            <div style={S.mhdr}>
              <span style={{fontSize:15, fontWeight:800, color:"#111"}}>💳 Rekodi ya Malipo</span>
              <button onClick={()=>setShowDebtModal(false)} style={{background:"none", border:"none", fontSize:22, cursor:"pointer", color:"#9ca3af", lineHeight:1}}>×</button>
            </div>
            <div style={S.mbody}>
              <div style={{background:"#fef2f2", borderRadius:12, padding:"12px 16px", marginBottom:16, border:"1px solid #fecaca"}}>
                <div style={{fontWeight:800, color:"#b91c1c"}}>{debtCustomer.name}</div>
                <div style={{fontSize:13, color:"#dc2626", marginTop:4}}>Deni: <strong>{formatCurrency(debtCustomer.totalDebt,"TZS")}</strong></div>
              </div>
              <label style={S.lbl}>Kiasi cha Malipo (TZS) *</label>
              <input type="number" value={debtAmount} onChange={e=>setDebtAmount(e.target.value)} max={debtCustomer.totalDebt} placeholder="0" style={{...S.inp, textAlign:"right", fontSize:18, fontWeight:900}}/>
              <button onClick={()=>setDebtAmount(debtCustomer.totalDebt.toString())} style={{background:"none", border:"none", cursor:"pointer", fontSize:12, color:"#2563eb", textDecoration:"underline", marginBottom:12, display:"block"}}>Lipa kiasi chote</button>
              <label style={S.lbl}>Maelezo (hiari)</label>
              <input type="text" value={debtNote} onChange={e=>setDebtNote(e.target.value)} placeholder="mfano: Malipo ya pesa taslimu" style={S.inp}/>
            </div>
            <div style={S.mftr}>
              <button onClick={()=>setShowDebtModal(false)} style={S.cancelB}>Ghairi</button>
              <button onClick={recordDebtPayment} disabled={saving} style={S.saveGrn}>{saving?"Inarekodi…":"Rekodi Malipo"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
