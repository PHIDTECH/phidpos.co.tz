"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";

const TABS = ["general", "store", "users", "notifications"] as const;
type Tab = typeof TABS[number];

export default function SettingsPage() {
  const sessionData = useSession(); const session = sessionData?.data;
  const [tab, setTab] = useState<Tab>("general");
  const [saving, setSaving] = useState(false);

  const [general, setGeneral] = useState({ businessName: "", currency: "TZS", timezone: "Africa/Dar_es_Salaam", taxRate: "18", phone: "", email: "", address: "" });
  const [users, setUsers] = useState<any[]>([]);
  const [showUserModal, setShowUserModal] = useState(false);
  const [userForm, setUserForm] = useState({ name: "", email: "", password: "", role: "CASHIER" });
  const [savingUser, setSavingUser] = useState(false);

  useEffect(() => { loadSettings(); loadUsers(); }, []);

  async function loadSettings() {
    try {
      const res = await fetch("/api/settings");
      if (res.ok) { const data = await res.json(); if (data.settings) setGeneral(prev => ({ ...prev, ...data.settings })); }
    } catch {}
  }

  async function loadUsers() {
    try {
      const res = await fetch("/api/users");
      if (res.ok) { const data = await res.json(); setUsers(data.users || []); }
    } catch {}
  }

  async function saveGeneral() {
    setSaving(true);
    try {
      await fetch("/api/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(general) });
      toast.success("Settings saved");
    } catch { toast.error("Failed to save"); }
    setSaving(false);
  }

  async function createUser() {
    if (!userForm.name || !userForm.email || !userForm.password) { toast.error("Fill all required fields"); return; }
    setSavingUser(true);
    try {
      const res = await fetch("/api/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(userForm) });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      toast.success("User created");
      setShowUserModal(false);
      setUserForm({ name: "", email: "", password: "", role: "CASHIER" });
      loadUsers();
    } catch (err: any) { toast.error(err.message || "Failed"); }
    setSavingUser(false);
  }

  const roleColorMap: Record<string,[string,string]> = {
    TENANT_ADMIN:  ["#fef2f2","#b91c1c"],
    STORE_MANAGER: ["#eff6ff","#1d4ed8"],
    CASHIER:       ["#f0fdf4","#15803d"],
    ACCOUNTANT:    ["#f5f3ff","#6d28d9"],
  };

  const tabMeta = [
    {key:"general",    icon:"⚙️",  label:"Jumla"},
    {key:"store",      icon:"🏪",  label:"Duka"},
    {key:"users",      icon:"👥",  label:"Watumiaji"},
    {key:"notifications", icon:"🔔", label:"Arifa"},
  ];

  const S: Record<string,React.CSSProperties> = {
    page:    {padding:24,fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"},
    hdr:     {marginBottom:20},
    h1:      {fontSize:22,fontWeight:800,color:"#111",margin:0},
    sub:     {fontSize:13,color:"#6b7280",marginTop:4},
    tabBar:  {display:"flex",gap:4,background:"#f3f4f6",padding:4,borderRadius:12,marginBottom:20,flexWrap:"wrap" as const},
    card:    {background:"#fff",border:"1px solid #e5e7eb",borderRadius:14,padding:24,maxWidth:640,marginBottom:20,boxShadow:"0 1px 4px rgba(0,0,0,0.04)"},
    grid2:   {display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14},
    lbl:     {fontSize:13,fontWeight:700,color:"#374151",display:"block",marginBottom:5},
    inp:     {width:"100%",padding:"9px 12px",border:"1px solid #e5e7eb",borderRadius:10,fontSize:13,outline:"none",boxSizing:"border-box" as const},
    sel:     {width:"100%",padding:"9px 12px",border:"1px solid #e5e7eb",borderRadius:10,fontSize:13,outline:"none",background:"#fff",boxSizing:"border-box" as const},
    saveBtn: {padding:"10px 24px",background:"#2563eb",color:"#fff",border:"none",borderRadius:10,fontSize:14,fontWeight:700,cursor:"pointer"},
    tblCard: {background:"#fff",border:"1px solid #e5e7eb",borderRadius:14,overflow:"hidden",marginBottom:16,boxShadow:"0 1px 4px rgba(0,0,0,0.04)"},
    th:      {padding:"11px 14px",fontSize:12,fontWeight:700,color:"#6b7280",textAlign:"left" as const,borderBottom:"1px solid #e5e7eb",background:"#f9fafb"},
    td:      {padding:"12px 14px",fontSize:13,color:"#374151",borderBottom:"1px solid #f3f4f6",verticalAlign:"middle" as const},
    addBtn:  {padding:"9px 18px",background:"#2563eb",color:"#fff",border:"none",borderRadius:10,fontSize:13,fontWeight:700,cursor:"pointer"},
    overlay: {position:"fixed" as const,inset:0,background:"rgba(0,0,0,0.55)",zIndex:50,display:"flex",alignItems:"center",justifyContent:"center",padding:16},
    modal:   {background:"#fff",borderRadius:18,width:"100%",maxWidth:440,boxShadow:"0 20px 60px rgba(0,0,0,0.2)"},
    mhdr:    {display:"flex",alignItems:"center",justifyContent:"space-between",padding:"16px 20px",borderBottom:"1px solid #e5e7eb"},
    mbody:   {padding:20},
    mftr:    {display:"flex",gap:10,padding:"14px 20px",borderTop:"1px solid #e5e7eb"},
    cancelB: {flex:1,padding:"10px 0",borderRadius:12,border:"1px solid #e5e7eb",background:"#fff",fontSize:14,fontWeight:700,cursor:"pointer",color:"#374151"},
    saveB:   {flex:1,padding:"10px 0",borderRadius:12,border:"none",background:"#2563eb",color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer"},
    avatar:  {width:32,height:32,borderRadius:"50%",background:"#2563eb",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:12,fontWeight:800,flexShrink:0},
  };
  const dynS = {
    tab:(a:boolean):React.CSSProperties=>({padding:"8px 16px",borderRadius:9,fontSize:13,fontWeight:700,border:"none",cursor:"pointer",background:a?"#fff":"transparent",color:a?"#2563eb":"#6b7280",boxShadow:a?"0 1px 4px rgba(0,0,0,0.08)":"none"}),
  };

  return (
    <div style={S.page}>
      <div style={S.hdr}>
        <h1 style={S.h1}>⚙️ Mipangilio</h1>
        <p style={S.sub}>Simamia mipangilio ya biashara yako</p>
      </div>

      <div style={S.tabBar}>
        {tabMeta.map(t=>(
          <button key={t.key} onClick={()=>setTab(t.key as any)} style={dynS.tab(tab===t.key)}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {tab==="general" && (
        <div style={S.card}>
          <div style={{fontSize:15,fontWeight:800,marginBottom:16,color:"#111"}}>⚙️ Mipangilio ya Jumla</div>
          <div style={S.grid2}>
            {[
              {label:"Jina la Biashara", key:"businessName", type:"text",   ph:"Duka Langu"},
              {label:"Simu",             key:"phone",        type:"tel",    ph:"+255700000000"},
              {label:"Barua Pepe",       key:"email",        type:"email",  ph:"info@duka.com"},
              {label:"Kiwango cha Kodi (%)", key:"taxRate",  type:"number", ph:"18"},
            ].map(f=>(
              <div key={f.key}>
                <label style={S.lbl}>{f.label}</label>
                <input type={f.type} value={(general as any)[f.key]} onChange={e=>setGeneral(p=>({...p,[f.key]:e.target.value}))} placeholder={f.ph} style={S.inp}/>
              </div>
            ))}
            <div>
              <label style={S.lbl}>Sarafu</label>
              <select value={general.currency} onChange={e=>setGeneral(p=>({...p,currency:e.target.value}))} style={S.sel}>
                <option value="TZS">TZS - Shilingi ya Tanzania</option>
                <option value="USD">USD - Dola ya Marekani</option>
                <option value="KES">KES - Shilingi ya Kenya</option>
                <option value="UGX">UGX - Shilingi ya Uganda</option>
              </select>
            </div>
            <div>
              <label style={S.lbl}>Eneo la Saa</label>
              <select value={general.timezone} onChange={e=>setGeneral(p=>({...p,timezone:e.target.value}))} style={S.sel}>
                <option value="Africa/Dar_es_Salaam">Africa/Dar es Salaam (UTC+3)</option>
                <option value="Africa/Nairobi">Africa/Nairobi (UTC+3)</option>
                <option value="Africa/Kampala">Africa/Kampala (UTC+3)</option>
              </select>
            </div>
          </div>
          <div style={{marginBottom:14}}>
            <label style={S.lbl}>Anwani ya Biashara</label>
            <textarea value={general.address} onChange={e=>setGeneral(p=>({...p,address:e.target.value}))} rows={2} placeholder="Anwani ya kimwili" style={{...S.inp,resize:"none" as const,height:64}}/>
          </div>
          <button onClick={saveGeneral} disabled={saving} style={S.saveBtn}>{saving?"Inahifadhi…":"Hifadhi Mipangilio"}</button>
        </div>
      )}

      {tab==="users" && (
        <div style={{maxWidth:780}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
            <div style={{fontSize:15,fontWeight:800,color:"#111"}}>👥 Wanachama wa Timu</div>
            <button onClick={()=>setShowUserModal(true)} style={S.addBtn}>＋ Ongeza Mtumiaji</button>
          </div>
          <div style={S.tblCard}>
            <table style={{width:"100%",borderCollapse:"collapse"}}>
              <thead><tr>
                <th style={S.th}>Jina</th>
                <th style={S.th}>Barua Pepe</th>
                <th style={S.th}>Jukumu</th>
                <th style={S.th}>Duka</th>
                <th style={S.th}>Hali</th>
              </tr></thead>
              <tbody>
                {users.map((u:any)=>{
                  const [rbg,rclr]=roleColorMap[u.role]||["#f3f4f6","#374151"];
                  return(
                    <tr key={u.id}>
                      <td style={S.td}>
                        <div style={{display:"flex",alignItems:"center",gap:10}}>
                          <div style={S.avatar}>{u.name?.charAt(0).toUpperCase()}</div>
                          <span style={{fontWeight:700}}>{u.name}</span>
                        </div>
                      </td>
                      <td style={{...S.td,color:"#6b7280"}}>{u.email}</td>
                      <td style={S.td}><span style={{display:"inline-block",padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:700,background:rbg,color:rclr}}>{u.role.replace(/_/g," ")}</span></td>
                      <td style={{...S.td,color:"#6b7280"}}>{u.store?.name||"—"}</td>
                      <td style={S.td}><span style={{display:"inline-block",padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:700,background:u.isActive?"#f0fdf4":"#fef2f2",color:u.isActive?"#16a34a":"#dc2626"}}>{u.isActive?"Hai":"Imezimwa"}</span></td>
                    </tr>
                  );
                })}
                {users.length===0&&<tr><td colSpan={5} style={{...S.td,textAlign:"center",padding:"32px 0",color:"#9ca3af"}}>Hakuna watumiaji</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab==="notifications" && (
        <div style={S.card}>
          <div style={{fontSize:15,fontWeight:800,marginBottom:4,color:"#111"}}>🔔 Arifa za SMS</div>
          <p style={{fontSize:13,color:"#6b7280",marginBottom:16}}>Sanidi wakati wa kutuma arifa za SMS kwa wateja na wafanyakazi.</p>
          {[
            {label:"Onyo la hifadhi chini",   desc:"Arifu meneja wakati hifadhi ya bidhaa inapungua chini ya kiwango cha chini"},
            {label:"Ukumbusho wa deni",        desc:"Tuma ukumbusho kwa wateja wenye deni"},
            {label:"Risiti ya mauzo",          desc:"Tuma SMS ya risiti kwa wateja baada ya ununuzi"},
            {label:"Uthibitisho wa malipo",    desc:"Arifu mteja wakati malipo ya deni yamerekodiwa"},
          ].map((item,i)=>(
            <div key={i} style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",padding:"14px 0",borderBottom:i<3?"1px solid #f3f4f6":"none"}}>
              <div>
                <div style={{fontSize:13,fontWeight:700,color:"#111"}}>{item.label}</div>
                <div style={{fontSize:12,color:"#6b7280",marginTop:3}}>{item.desc}</div>
              </div>
              <label style={{position:"relative" as const,display:"inline-flex",alignItems:"center",cursor:"pointer",marginLeft:16,flexShrink:0}}>
                <input type="checkbox" style={{display:"none"}} defaultChecked/>
                <div style={{width:44,height:24,background:"#2563eb",borderRadius:12,position:"relative" as const}}>
                  <div style={{position:"absolute" as const,top:2,right:2,width:20,height:20,background:"#fff",borderRadius:"50%",boxShadow:"0 1px 3px rgba(0,0,0,0.2)"}}/>
                </div>
              </label>
            </div>
          ))}
        </div>
      )}

      {tab==="store" && (
        <div style={S.card}>
          <div style={{fontSize:15,fontWeight:800,marginBottom:12,color:"#111"}}>🏪 Taarifa za Duka</div>
          <p style={{fontSize:13,color:"#6b7280"}}>Duka: <strong style={{color:"#111"}}>{session?.user?.name}</strong></p>
          <p style={{fontSize:12,color:"#9ca3af",marginTop:8}}>Wasiliana na Msimamizi wa Tenant kuongeza au kusimamia maduka mengi.</p>
        </div>
      )}

      {showUserModal && (
        <div style={S.overlay}>
          <div style={S.modal}>
            <div style={S.mhdr}>
              <span style={{fontSize:15,fontWeight:800,color:"#111"}}>➕ Ongeza Mwanachama</span>
              <button onClick={()=>setShowUserModal(false)} style={{background:"none",border:"none",fontSize:22,cursor:"pointer",color:"#9ca3af",lineHeight:1}}>×</button>
            </div>
            <div style={S.mbody}>
              {[
                {label:"Jina Kamili *",  key:"name",     type:"text",     ph:"John Doe"},
                {label:"Barua Pepe *",   key:"email",    type:"email",    ph:"john@duka.com"},
                {label:"Nywila *",       key:"password", type:"password", ph:"••••••••"},
              ].map(f=>(
                <div key={f.key} style={{marginBottom:12}}>
                  <label style={S.lbl}>{f.label}</label>
                  <input type={f.type} value={(userForm as any)[f.key]} onChange={e=>setUserForm(p=>({...p,[f.key]:e.target.value}))} placeholder={f.ph} style={S.inp}/>
                </div>
              ))}
              <label style={S.lbl}>Jukumu *</label>
              <select value={userForm.role} onChange={e=>setUserForm(p=>({...p,role:e.target.value}))} style={S.sel}>
                <option value="CASHIER">Cashier</option>
                <option value="STORE_MANAGER">Meneja wa Duka</option>
                <option value="ACCOUNTANT">Mhasibu</option>
                <option value="TENANT_ADMIN">Msimamizi wa Tenant</option>
              </select>
            </div>
            <div style={S.mftr}>
              <button onClick={()=>setShowUserModal(false)} style={S.cancelB}>Ghairi</button>
              <button onClick={createUser} disabled={savingUser} style={S.saveB}>{savingUser?"Inaunda…":"Unda Mtumiaji"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
