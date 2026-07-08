"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
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

  const S: Record<string, React.CSSProperties> = {
    page:   { padding:24, fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" },
    hdr:    { display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 },
    h1:     { fontSize:22, fontWeight:800, color:"#111", margin:0 },
    sub:    { fontSize:13, color:"#6b7280", marginTop:4 },
    addBtn: { display:"flex", alignItems:"center", gap:6, padding:"9px 18px", background:"#2563eb", color:"#fff", border:"none", borderRadius:10, fontSize:13, fontWeight:700, cursor:"pointer" },
    srchWr: { position:"relative" as const, maxWidth:380, marginBottom:20 },
    srchIc: { position:"absolute" as const, left:10, top:"50%", transform:"translateY(-50%)", fontSize:14, color:"#9ca3af" },
    srchI:  { width:"100%", padding:"9px 12px 9px 34px", border:"1px solid #e5e7eb", borderRadius:10, fontSize:13, outline:"none", boxSizing:"border-box" as const },
    grid:   { display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:16, marginBottom:20 },
    scard:  { background:"#fff", border:"1px solid #e5e7eb", borderRadius:14, padding:20, boxShadow:"0 1px 4px rgba(0,0,0,0.04)" },
    sicon:  { width:44, height:44, borderRadius:12, background:"#eef2ff", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, flexShrink:0 },
    overlay:{ position:"fixed" as const, inset:0, background:"rgba(0,0,0,0.55)", zIndex:50, display:"flex", alignItems:"center", justifyContent:"center", padding:16 },
    modal:  { background:"#fff", borderRadius:18, width:"100%", maxWidth:440, boxShadow:"0 20px 60px rgba(0,0,0,0.2)" },
    mhdr:   { display:"flex", alignItems:"center", justifyContent:"space-between", padding:"16px 20px", borderBottom:"1px solid #e5e7eb" },
    mbody:  { padding:20 },
    mftr:   { display:"flex", gap:10, padding:"14px 20px", borderTop:"1px solid #e5e7eb" },
    lbl:    { fontSize:13, fontWeight:700, color:"#374151", display:"block", marginBottom:5 },
    inp:    { width:"100%", padding:"9px 12px", border:"1px solid #e5e7eb", borderRadius:10, fontSize:13, outline:"none", boxSizing:"border-box" as const, marginBottom:12 },
    cancelB:{ flex:1, padding:"10px 0", borderRadius:12, border:"1px solid #e5e7eb", background:"#fff", fontSize:14, fontWeight:700, cursor:"pointer", color:"#374151" },
    saveB:  { flex:1, padding:"10px 0", borderRadius:12, border:"none", background:"#2563eb", color:"#fff", fontSize:14, fontWeight:700, cursor:"pointer" },
  };

  return (
    <div style={S.page}>
      <div style={S.hdr}>
        <div>
          <h1 style={S.h1}>🚚 Wasambazaji</h1>
          <p style={S.sub}>{suppliers.length} wasambazaji wamesajiliwa</p>
        </div>
        <button onClick={() => openModal()} style={S.addBtn}>＋ Ongeza Msambazaji</button>
      </div>

      <div style={S.srchWr}>
        <span style={S.srchIc}>🔍</span>
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Tafuta wasambazaji…" style={S.srchI}/>
      </div>

      <div style={S.grid}>
        {loading ? Array.from({length:6}).map((_,i) => (
          <div key={i} style={{height:140, background:"#f3f4f6", borderRadius:14, animation:"pulse 1.5s infinite"}}/>
        )) : suppliers.map(s => (
          <div key={s.id} style={S.scard}>
            <div style={{display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:12}}>
              <div style={{display:"flex", alignItems:"center", gap:12}}>
                <div style={S.sicon}>🚚</div>
                <div>
                  <div style={{fontWeight:700, color:"#111", fontSize:14}}>{s.name}</div>
                  <div style={{fontSize:12, color:"#9ca3af", marginTop:2}}>{s._count?.purchases || 0} manunuzi</div>
                </div>
              </div>
              <button onClick={() => openModal(s)} style={{padding:"5px 10px", borderRadius:8, border:"1px solid #bfdbfe", background:"#eff6ff", color:"#2563eb", fontSize:12, fontWeight:700, cursor:"pointer"}}>✏</button>
            </div>
            <div style={{fontSize:12, color:"#6b7280"}}>
              {s.phone && <div style={{marginBottom:3}}>📞 {s.phone}</div>}
              {s.email && <div style={{marginBottom:3}}>✉ {s.email}</div>}
            </div>
            {Number(s.balance) > 0 && (
              <div style={{marginTop:10, padding:"6px 12px", background:"#fffbeb", borderRadius:8, fontSize:12, color:"#b45309", fontWeight:700}}>
                💰 Salio: {formatCurrency(s.balance,"TZS")}
              </div>
            )}
          </div>
        ))}
        {!loading && suppliers.length === 0 && (
          <div style={{gridColumn:"1/-1", textAlign:"center", padding:"60px 0", color:"#9ca3af"}}>
            <div style={{fontSize:40, marginBottom:12}}>🚚</div>
            <p style={{fontSize:14}}>Hakuna wasambazaji walioopatikana</p>
          </div>
        )}
      </div>

      {showModal && (
        <div style={S.overlay}>
          <div style={S.modal}>
            <div style={S.mhdr}>
              <span style={{fontSize:15, fontWeight:800, color:"#111"}}>{editing?"✏ Hariri Msambazaji":"➕ Ongeza Msambazaji"}</span>
              <button onClick={() => setShowModal(false)} style={{background:"none", border:"none", fontSize:22, cursor:"pointer", color:"#9ca3af", lineHeight:1}}>×</button>
            </div>
            <div style={S.mbody}>
              {[
                {label:"Jina la Biashara *", key:"name", type:"text", ph:"Azam Beverages Ltd"},
                {label:"Simu", key:"phone", type:"tel", ph:"+255700000000"},
                {label:"Barua Pepe", key:"email", type:"email", ph:"info@msambazaji.com"},
                {label:"Anwani", key:"address", type:"text", ph:"Dar es Salaam"},
              ].map(f=>(
                <div key={f.key}>
                  <label style={S.lbl}>{f.label}</label>
                  <input type={f.type} value={(form as any)[f.key]} onChange={e=>setForm(p=>({...p,[f.key]:e.target.value}))} placeholder={f.ph} style={S.inp}/>
                </div>
              ))}
            </div>
            <div style={S.mftr}>
              <button onClick={()=>setShowModal(false)} style={S.cancelB}>Ghairi</button>
              <button onClick={saveSupplier} disabled={saving} style={S.saveB}>{saving?"Inahifadhi…":(editing?"Sasisha":"Unda")}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
