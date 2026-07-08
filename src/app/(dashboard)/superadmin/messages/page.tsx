"use client";
export const dynamic = "force-dynamic";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";

export default function SuperAdminMessagesPage() {
  const [tab, setTab] = useState<"send"|"logs"|"senderids">("send");
  const [tenants, setTenants] = useState<any[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);
  const [senderIds, setSenderIds] = useState<any[]>([]);
  const [approving, setApproving] = useState<string|null>(null);
  const [apiKeyInput, setApiKeyInput] = useState<Record<string,string>>({});

  useEffect(() => {
    fetch("/api/superadmin/tenants").then(r=>r.json()).then(d=>setTenants(d.tenants||[]));
    fetch("/api/superadmin/messages").then(r=>r.json()).then(d=>setLogs(d.logs||[]));
    fetch("/api/superadmin/sender-ids").then(r=>r.json()).then(d=>setSenderIds(d.senderIds||[]));
  }, []);

  function toggleTenant(id: string) {
    setSelected(s => s.includes(id) ? s.filter(x=>x!==id) : [...s, id]);
  }

  async function sendMessages() {
    if (!message.trim()) { toast.error("Andika ujumbe"); return; }
    setSending(true);
    try {
      const res = await fetch("/api/superadmin/messages", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantIds: selected.length ? selected : [], message }),
      });
      const d = await res.json();
      const sent = d.results?.filter((r:any)=>r.ok).length || 0;
      const failed = d.results?.filter((r:any)=>!r.ok).length || 0;
      toast.success(`Imetumwa: ${sent} | Imeshindwa: ${failed}`);
      setMessage(""); setSelected([]);
      fetch("/api/superadmin/messages").then(r=>r.json()).then(d=>setLogs(d.logs||[]));
    } catch { toast.error("Imeshindwa kutuma"); }
    setSending(false);
  }

  async function approveSenderId(tenantId: string, approve: boolean) {
    setApproving(tenantId);
    try {
      const res = await fetch("/api/superadmin/sender-ids", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId, approve, apiKey: apiKeyInput[tenantId] }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      toast.success(d.message);
      fetch("/api/superadmin/sender-ids").then(r=>r.json()).then(d=>setSenderIds(d.senderIds||[]));
    } catch(e:any) { toast.error(e.message || "Failed"); }
    setApproving(null);
  }

  const S: Record<string,React.CSSProperties> = {
    page:   {padding:24,fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"},
    h1:     {fontSize:22,fontWeight:800,color:"#111",margin:0},
    sub:    {fontSize:13,color:"#6b7280",marginTop:4,marginBottom:20},
    tabBar: {display:"flex",gap:4,background:"#f3f4f6",padding:4,borderRadius:12,marginBottom:24,width:"fit-content"},
    card:   {background:"#fff",border:"1px solid #e5e7eb",borderRadius:14,padding:20,marginBottom:16,boxShadow:"0 1px 4px rgba(0,0,0,0.04)"},
    lbl:    {fontSize:13,fontWeight:700,color:"#374151",display:"block",marginBottom:6},
    inp:    {width:"100%",padding:"9px 12px",border:"1px solid #e5e7eb",borderRadius:10,fontSize:13,outline:"none",boxSizing:"border-box" as const,marginBottom:12},
    ta:     {width:"100%",padding:"10px 12px",border:"1px solid #e5e7eb",borderRadius:10,fontSize:13,outline:"none",boxSizing:"border-box" as const,resize:"vertical" as const,minHeight:90},
    sendBtn:{padding:"10px 28px",background:"#2563eb",color:"#fff",border:"none",borderRadius:10,fontSize:14,fontWeight:700,cursor:"pointer",marginTop:12},
    th:     {padding:"10px 14px",fontSize:11,fontWeight:700,color:"#9ca3af",textAlign:"left" as const,textTransform:"uppercase" as const,borderBottom:"1px solid #e5e7eb",background:"#f9fafb"},
    td:     {padding:"11px 14px",fontSize:13,color:"#374151",borderBottom:"1px solid #f3f4f6"},
    tblW:   {background:"#fff",border:"1px solid #e5e7eb",borderRadius:14,overflow:"hidden",boxShadow:"0 1px 4px rgba(0,0,0,0.04)"},
  };
  const dynS={tab:(a:boolean):React.CSSProperties=>({padding:"8px 18px",borderRadius:9,fontSize:13,fontWeight:700,border:"none",cursor:"pointer",background:a?"#fff":"transparent",color:a?"#2563eb":"#6b7280",boxShadow:a?"0 1px 4px rgba(0,0,0,0.08)":"none"})};

  return (
    <div style={S.page}>
      <h1 style={S.h1}>💬 Ujumbe — Superadmin</h1>
      <p style={S.sub}>Tuma ujumbe kwa tenants kupitia Beem Africa (Sender: PHIDTECH)</p>

      <div style={S.tabBar}>
        {([["send","📤 Tuma"],["logs","📋 Historia"],["senderids","🆔 Sender IDs"]] as const).map(([k,l])=>(
          <button key={k} onClick={()=>setTab(k)} style={dynS.tab(tab===k)}>{l}</button>
        ))}
      </div>

      {tab==="send" && (
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
          <div style={S.card}>
            <label style={S.lbl}>Chagua Tenants (hakuna maana = wote)</label>
            <div style={{maxHeight:340,overflowY:"auto",border:"1px solid #e5e7eb",borderRadius:10,padding:8}}>
              {tenants.map((t:any)=>(
                <label key={t.id} style={{display:"flex",alignItems:"center",gap:8,padding:"7px 6px",borderRadius:8,cursor:"pointer",background:selected.includes(t.id)?"#eff6ff":"transparent"}}>
                  <input type="checkbox" checked={selected.includes(t.id)} onChange={()=>toggleTenant(t.id)} style={{accentColor:"#2563eb"}}/>
                  <div>
                    <div style={{fontSize:13,fontWeight:700,color:"#111"}}>{t.name}</div>
                    <div style={{fontSize:11,color:"#9ca3af"}}>{t.phone||t.email}</div>
                  </div>
                </label>
              ))}
            </div>
            <div style={{marginTop:8,fontSize:12,color:"#6b7280"}}>
              {selected.length ? `${selected.length} wamechaguliwa` : "Wote watachaguliwa"}
            </div>
          </div>

          <div style={S.card}>
            <label style={S.lbl}>Ujumbe *</label>
            <textarea value={message} onChange={e=>setMessage(e.target.value)} placeholder="Andika ujumbe hapa…" style={S.ta}/>
            <div style={{fontSize:12,color:message.length>160?"#dc2626":"#9ca3af",marginTop:4}}>{message.length}/160 chars</div>
            <div style={{marginTop:12,padding:"10px 14px",background:"#f0fdf4",borderRadius:10,border:"1px solid #bbf7d0"}}>
              <div style={{fontSize:12,fontWeight:700,color:"#15803d"}}>📡 Sender ID: PHIDTECH</div>
              <div style={{fontSize:11,color:"#16a34a",marginTop:2}}>Powered by Beem Africa</div>
            </div>
            <button onClick={sendMessages} disabled={sending} style={S.sendBtn}>
              {sending?"Inatuma…":"📤 Tuma Ujumbe"}
            </button>
          </div>
        </div>
      )}

      {tab==="logs" && (
        <div style={S.tblW}>
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <thead><tr>
              <th style={S.th}>Tenant</th>
              <th style={S.th}>Simu</th>
              <th style={S.th}>Ujumbe</th>
              <th style={S.th}>Hali</th>
              <th style={S.th}>Tarehe</th>
            </tr></thead>
            <tbody>
              {logs.length===0 && <tr><td colSpan={5} style={{...S.td,textAlign:"center" as const,padding:"40px 0",color:"#9ca3af"}}>Hakuna historia ya ujumbe</td></tr>}
              {logs.map((l:any)=>(
                <tr key={l.id}>
                  <td style={{...S.td,fontWeight:700}}>{l.tenant?.name||"—"}</td>
                  <td style={{...S.td,fontFamily:"monospace",fontSize:12}}>{l.to}</td>
                  <td style={{...S.td,maxWidth:300,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as const}}>{l.message}</td>
                  <td style={S.td}><span style={{display:"inline-block",padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:700,background:l.status==="SENT"?"#f0fdf4":"#fef2f2",color:l.status==="SENT"?"#16a34a":"#dc2626"}}>{l.status}</span></td>
                  <td style={{...S.td,fontSize:11,color:"#9ca3af"}}>{new Date(l.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab==="senderids" && (
        <div style={S.tblW}>
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <thead><tr>
              <th style={S.th}>Tenant</th>
              <th style={S.th}>Sender ID Iliyoombwa</th>
              <th style={S.th}>Hali</th>
              <th style={S.th}>Beem API Key (kuidhinisha)</th>
              <th style={S.th}>Vitendo</th>
            </tr></thead>
            <tbody>
              {senderIds.length===0 && <tr><td colSpan={5} style={{...S.td,textAlign:"center" as const,padding:"40px 0",color:"#9ca3af"}}>Hakuna maombi ya Sender ID</td></tr>}
              {senderIds.map((s:any)=>(
                <tr key={s.id}>
                  <td style={S.td}>
                    <div style={{fontWeight:700}}>{s.name}</div>
                    <div style={{fontSize:11,color:"#9ca3af"}}>{s.email}</div>
                  </td>
                  <td style={S.td}>
                    {s.senderId ? <code style={{background:"#f3f4f6",padding:"2px 8px",borderRadius:5,fontSize:12}}>{s.senderId}</code> : <span style={{color:"#9ca3af"}}>—</span>}
                  </td>
                  <td style={S.td}>
                    <span style={{display:"inline-block",padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:700,background:s.approved?"#f0fdf4":s.hasApplication?"#fef9c3":"#f3f4f6",color:s.approved?"#16a34a":s.hasApplication?"#92400e":"#9ca3af"}}>
                      {s.approved?"Imeidhinishwa":s.hasApplication?"Inasubiri":"Hakuna ombi"}
                    </span>
                  </td>
                  <td style={S.td}>
                    {s.hasApplication && !s.approved && (
                      <input value={apiKeyInput[s.id]||""} onChange={e=>setApiKeyInput(p=>({...p,[s.id]:e.target.value}))}
                        placeholder="Beem API Key…" style={{padding:"6px 10px",border:"1px solid #e5e7eb",borderRadius:8,fontSize:12,outline:"none",width:200}}/>
                    )}
                  </td>
                  <td style={S.td}>
                    <div style={{display:"flex",gap:6}}>
                      {s.hasApplication && !s.approved && (
                        <button onClick={()=>approveSenderId(s.id,true)} disabled={approving===s.id}
                          style={{padding:"5px 12px",borderRadius:8,border:"none",background:"#2563eb",color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer"}}>
                          {approving===s.id?"…":"Idhinisha"}
                        </button>
                      )}
                      {s.approved && (
                        <button onClick={()=>approveSenderId(s.id,false)} disabled={approving===s.id}
                          style={{padding:"5px 12px",borderRadius:8,border:"1px solid #fecaca",background:"#fef2f2",color:"#dc2626",fontSize:12,fontWeight:700,cursor:"pointer"}}>
                          Batilisha
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
