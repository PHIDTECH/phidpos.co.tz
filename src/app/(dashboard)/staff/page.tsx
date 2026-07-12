"use client";
export const dynamic = "force-dynamic";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";

const ALL_PERMISSIONS = [
  { key:"dashboard",   label:"Dashboard" },
  { key:"pos",         label:"POS / Sales" },
  { key:"products",    label:"Products" },
  { key:"inventory",   label:"Inventory" },
  { key:"customers",   label:"Customers" },
  { key:"suppliers",   label:"Suppliers" },
  { key:"purchases",   label:"Purchases" },
  { key:"accounting",  label:"Accounting" },
  { key:"reports",     label:"Reports" },
  { key:"staff",       label:"Staff & Roles" },
  { key:"messages",    label:"Messages" },
  { key:"settings",    label:"Settings" },
];

const ROLE_DEFAULT_PERMISSIONS: Record<string,string[]> = {
  TENANT_ADMIN:       ALL_PERMISSIONS.map(p=>p.key),
  STORE_MANAGER:      ["dashboard","pos","products","inventory","customers","suppliers","purchases","reports","staff"],
  CASHIER:            ["dashboard","pos","customers"],
  ACCOUNTANT:         ["dashboard","accounting","reports","products"],
  GENERAL_MANAGER:    ["dashboard","pos","products","inventory","customers","suppliers","purchases","accounting","reports","staff","messages"],
  PRODUCTION_MANAGER: ["dashboard","products","inventory","purchases","reports"],
  HR_MANAGER:         ["dashboard","staff","reports","messages"],
};

export default function StaffPage() {
  const [staff, setStaff] = useState<any[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name:"", email:"", password:"", role:"CASHIER", storeId:"", phone:"" });
  const [permissions, setPermissions] = useState<string[]>(ROLE_DEFAULT_PERMISSIONS["CASHIER"]);

  async function load() {
    setLoading(true);
    try {
      const [ur, sr] = await Promise.all([
        fetch("/api/users").then(r=>r.json()),
        fetch("/api/stores").then(r=>r.json()),
      ]);
      setStaff(ur.users||[]);
      setStores(sr.stores||[]);
    } catch { toast.error("Failed to load"); }
    setLoading(false);
  }

  useEffect(()=>{ load(); },[]);

  function openAdd() {
    setEditing(null);
    setForm({name:"",email:"",password:"",role:"CASHIER",storeId:"",phone:""});
    setPermissions(ROLE_DEFAULT_PERMISSIONS["CASHIER"]);
    setShowModal(true);
  }
  function openEdit(u: any) {
    setEditing(u);
    setForm({name:u.name,email:u.email,password:"",role:u.role,storeId:u.storeId||"",phone:u.phone||""});
    setPermissions(Array.isArray(u.permissions) ? u.permissions : (ROLE_DEFAULT_PERMISSIONS[u.role]||[]));
    setShowModal(true);
  }

  function onRoleChange(role: string) {
    setForm(p=>({...p,role}));
    setPermissions(ROLE_DEFAULT_PERMISSIONS[role]||[]);
  }

  function togglePerm(key: string) {
    setPermissions(p => p.includes(key) ? p.filter(x=>x!==key) : [...p, key]);
  }

  async function save() {
    if (!form.name||!form.email) { toast.error("Jaza sehemu zote zinazohitajika"); return; }
    if (!editing && !form.password) { toast.error("Nywila inahitajika"); return; }
    setSaving(true);
    try {
      const method = editing ? "PATCH" : "POST";
      const url = editing ? `/api/staff/${editing.id}` : "/api/users";
      const body: any = { name:form.name, email:form.email, role:form.role, storeId:form.storeId||undefined, phone:form.phone||undefined, permissions };
      if (!editing) body.password = form.password;
      else if (form.password) body.password = form.password;

      const res = await fetch(url, { method, headers:{"Content-Type":"application/json"}, body:JSON.stringify(body) });
      if (!res.ok) { const d=await res.json(); throw new Error(d.error); }
      toast.success(editing?"Imesasishwa":"Mfanyakazi ameongezwa");
      setShowModal(false); load();
    } catch(e:any) { toast.error(e.message||"Imeshindwa"); }
    setSaving(false);
  }

  async function toggleActive(u: any) {
    try {
      const res = await fetch(`/api/staff/${u.id}`, {
        method:"PATCH", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({ isActive: !u.isActive }),
      });
      if (!res.ok) throw new Error();
      toast.success(u.isActive?"Imezimwa":"Imewashwa");
      load();
    } catch { toast.error("Imeshindwa"); }
  }

  async function deleteStaff(id: string) {
    if (!confirm("Futa mfanyakazi huyu?")) return;
    try {
      const res = await fetch(`/api/staff/${id}`, { method:"DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Mfanyakazi amefutwa"); load();
    } catch { toast.error("Imeshindwa"); }
  }

  const roleColorMap: Record<string,[string,string]> = {
    TENANT_ADMIN:       ["#fef2f2","#b91c1c"],
    STORE_MANAGER:      ["#eff6ff","#1d4ed8"],
    CASHIER:            ["#f0fdf4","#15803d"],
    ACCOUNTANT:         ["#f5f3ff","#6d28d9"],
    GENERAL_MANAGER:    ["#fdf4ff","#7e22ce"],
    PRODUCTION_MANAGER: ["#fff7ed","#c2410c"],
    HR_MANAGER:         ["#f0fdfa","#0f766e"],
  };
  const roleLabels: Record<string,string> = {
    TENANT_ADMIN:"Admin", STORE_MANAGER:"Store Manager", CASHIER:"Cashier",
    ACCOUNTANT:"Accountant", GENERAL_MANAGER:"General Manager",
    PRODUCTION_MANAGER:"Production Manager", HR_MANAGER:"HR Manager",
  };

  const S: Record<string,React.CSSProperties> = {
    page:   {padding:24,fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"},
    hdr:    {display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20},
    h1:     {fontSize:22,fontWeight:800,color:"#111",margin:0},
    sub:    {fontSize:13,color:"#6b7280",marginTop:4},
    addBtn: {padding:"9px 18px",background:"#2563eb",color:"#fff",border:"none",borderRadius:10,fontSize:13,fontWeight:700,cursor:"pointer"},
    tblW:   {background:"#fff",border:"1px solid #e5e7eb",borderRadius:14,overflow:"hidden",boxShadow:"0 1px 4px rgba(0,0,0,0.04)"},
    th:     {padding:"11px 14px",fontSize:11,fontWeight:700,color:"#9ca3af",textAlign:"left" as const,textTransform:"uppercase" as const,borderBottom:"2px solid #e5e7eb",background:"#f9fafb"},
    td:     {padding:"13px 14px",fontSize:13,color:"#374151",borderBottom:"1px solid #f3f4f6",verticalAlign:"middle" as const},
    avatar: {width:36,height:36,borderRadius:"50%",background:"#2563eb",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:14,fontWeight:800,flexShrink:0},
    overlay:{position:"fixed" as const,inset:0,background:"rgba(0,0,0,0.55)",zIndex:50,display:"flex",alignItems:"center",justifyContent:"center",padding:16},
    modal:  {background:"#fff",borderRadius:18,width:"100%",maxWidth:460,boxShadow:"0 20px 60px rgba(0,0,0,0.2)",maxHeight:"90vh",overflowY:"auto" as const},
    mhdr:   {display:"flex",alignItems:"center",justifyContent:"space-between",padding:"16px 20px",borderBottom:"1px solid #e5e7eb",position:"sticky" as const,top:0,background:"#fff"},
    mbody:  {padding:20},
    mftr:   {display:"flex",gap:10,padding:"14px 20px",borderTop:"1px solid #e5e7eb",position:"sticky" as const,bottom:0,background:"#fff"},
    lbl:    {fontSize:13,fontWeight:700,color:"#374151",display:"block",marginBottom:5},
    inp:    {width:"100%",padding:"9px 12px",border:"1px solid #e5e7eb",borderRadius:10,fontSize:13,outline:"none",boxSizing:"border-box" as const,marginBottom:12},
    sel:    {width:"100%",padding:"9px 12px",border:"1px solid #e5e7eb",borderRadius:10,fontSize:13,outline:"none",background:"#fff",boxSizing:"border-box" as const,marginBottom:12},
    grid2:  {display:"grid",gridTemplateColumns:"1fr 1fr",gap:12},
    cancelB:{flex:1,padding:"10px 0",borderRadius:12,border:"1px solid #e5e7eb",background:"#fff",fontSize:14,fontWeight:700,cursor:"pointer",color:"#374151"},
    saveB:  {flex:1,padding:"10px 0",borderRadius:12,border:"none",background:"#2563eb",color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer"},
    permBox:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"6px 12px",padding:"12px",background:"#f9fafb",borderRadius:10,border:"1px solid #e5e7eb",marginBottom:12},
    permItem:{display:"flex",alignItems:"center",gap:7,fontSize:13,color:"#374151",cursor:"pointer"},
  };

  return (
    <div style={S.page}>
      <div style={S.hdr}>
        <div>
          <h1 style={S.h1}>👨‍💼 Wafanyakazi Wote</h1>
          <p style={S.sub}>{staff.length} wafanyakazi wamesajiliwa</p>
        </div>
        <button onClick={openAdd} style={S.addBtn}>＋ Ongeza Mfanyakazi</button>
      </div>

      {loading ? (
        <div style={{textAlign:"center",padding:"60px 0",color:"#9ca3af"}}>⏳ Inapakia…</div>
      ) : (
        <div style={S.tblW}>
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <thead><tr>
              <th style={S.th}>Jina</th>
              <th style={S.th}>Barua Pepe</th>
              <th style={S.th}>Jukumu</th>
              <th style={S.th}>Duka</th>
              <th style={S.th}>Hali</th>
              <th style={S.th}>Vitendo</th>
            </tr></thead>
            <tbody>
              {staff.map((u:any)=>{
                const [rbg,rclr]=roleColorMap[u.role]||["#f3f4f6","#374151"];
                const perms: string[] = Array.isArray(u.permissions) ? u.permissions : [];
                return (
                  <tr key={u.id}>
                    <td style={S.td}>
                      <div style={{display:"flex",alignItems:"center",gap:10}}>
                        <div style={{...S.avatar,background:rclr||"#2563eb"}}>{u.name?.charAt(0).toUpperCase()}</div>
                        <div>
                          <div style={{fontWeight:700,color:"#111"}}>{u.name}</div>
                          {u.phone && <div style={{fontSize:11,color:"#9ca3af"}}>{u.phone}</div>}
                        </div>
                      </div>
                    </td>
                    <td style={{...S.td,color:"#6b7280"}}>{u.email}</td>
                    <td style={S.td}>
                      <span style={{display:"inline-block",padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:700,background:rbg,color:rclr}}>
                        {roleLabels[u.role]||u.role.replace(/_/g," ")}
                      </span>
                    </td>
                    <td style={S.td}>
                      <div style={{color:"#6b7280"}}>{u.store?.name||"—"}</div>
                      {perms.length>0 && <div style={{fontSize:10,color:"#9ca3af",marginTop:2}}>{perms.length} permissions</div>}
                    </td>
                    <td style={S.td}><span style={{display:"inline-block",padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:700,background:u.isActive?"#f0fdf4":"#fef2f2",color:u.isActive?"#16a34a":"#dc2626"}}>{u.isActive?"Hai":"Imezimwa"}</span></td>
                    <td style={S.td}>
                      <div style={{display:"flex",gap:6}}>
                        <button onClick={()=>openEdit(u)} style={{padding:"4px 10px",borderRadius:7,border:"1px solid #bfdbfe",background:"#eff6ff",color:"#2563eb",fontSize:12,fontWeight:700,cursor:"pointer"}}>Hariri</button>
                        <button onClick={()=>toggleActive(u)} style={{padding:"4px 10px",borderRadius:7,border:"1px solid #fde68a",background:"#fffbeb",color:"#b45309",fontSize:12,fontWeight:700,cursor:"pointer"}}>{u.isActive?"Zima":"Washa"}</button>
                        <button onClick={()=>deleteStaff(u.id)} style={{padding:"4px 10px",borderRadius:7,border:"1px solid #fecaca",background:"#fef2f2",color:"#dc2626",fontSize:12,fontWeight:700,cursor:"pointer"}}>Futa</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {staff.length===0&&<tr><td colSpan={6} style={{...S.td,textAlign:"center" as const,padding:"40px 0",color:"#9ca3af"}}>Hakuna wafanyakazi walioopatikana</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div style={S.overlay}>
          <div style={S.modal}>
            <div style={S.mhdr}>
              <span style={{fontSize:15,fontWeight:800,color:"#111"}}>{editing?"✏ Hariri Mfanyakazi":"➕ Ongeza Mfanyakazi"}</span>
              <button onClick={()=>setShowModal(false)} style={{background:"none",border:"none",fontSize:22,cursor:"pointer",color:"#9ca3af",lineHeight:1}}>×</button>
            </div>
            <div style={S.mbody}>
              <div style={S.grid2}>
                <div>
                  <label style={S.lbl}>Jina Kamili *</label>
                  <input value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} placeholder="John Doe" style={S.inp}/>
                </div>
                <div>
                  <label style={S.lbl}>Simu</label>
                  <input value={form.phone} onChange={e=>setForm(p=>({...p,phone:e.target.value}))} placeholder="+255700000000" style={S.inp}/>
                </div>
              </div>
              <label style={S.lbl}>Barua Pepe *</label>
              <input value={form.email} onChange={e=>setForm(p=>({...p,email:e.target.value}))} placeholder="john@duka.com" style={S.inp}/>
              <label style={S.lbl}>Nywila {editing?"(acha tupu kubaki ile ile)":"*"}</label>
              <input type="password" value={form.password} onChange={e=>setForm(p=>({...p,password:e.target.value}))} placeholder="••••••••" style={S.inp}/>
              <div style={S.grid2}>
                <div>
                  <label style={S.lbl}>Jukumu *</label>
                  <select value={form.role} onChange={e=>onRoleChange(e.target.value)} style={S.sel}>
                    <option value="CASHIER">Cashier</option>
                    <option value="STORE_MANAGER">Store Manager</option>
                    <option value="ACCOUNTANT">Accountant</option>
                    <option value="GENERAL_MANAGER">General Manager</option>
                    <option value="PRODUCTION_MANAGER">Production Manager</option>
                    <option value="HR_MANAGER">HR Manager</option>
                    <option value="TENANT_ADMIN">Admin</option>
                  </select>
                </div>
                <div>
                  <label style={S.lbl}>Duka</label>
                  <select value={form.storeId} onChange={e=>setForm(p=>({...p,storeId:e.target.value}))} style={S.sel}>
                    <option value="">— Chagua Duka —</option>
                    {stores.map((s:any)=><option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              </div>

              <label style={S.lbl}>Permissions <span style={{fontWeight:400,color:"#9ca3af",fontSize:12}}>(customize access)</span></label>
              <div style={S.permBox}>
                {ALL_PERMISSIONS.map(p=>(
                  <label key={p.key} style={S.permItem}>
                    <input
                      type="checkbox"
                      checked={permissions.includes(p.key)}
                      onChange={()=>togglePerm(p.key)}
                      style={{width:15,height:15,accentColor:"#2563eb",cursor:"pointer"}}
                    />
                    {p.label}
                  </label>
                ))}
              </div>
            </div>
            <div style={S.mftr}>
              <button onClick={()=>setShowModal(false)} style={S.cancelB}>Ghairi</button>
              <button onClick={save} disabled={saving} style={S.saveB}>{saving?"Inahifadhi…":editing?"Hifadhi":"Ongeza"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
