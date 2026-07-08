"use client";
export const dynamic = "force-dynamic";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";

export default function TenantMessagesPage() {
  const [tab, setTab] = useState<"send"|"logs"|"senderid"|"buysms">("send");
  const [customers, setCustomers] = useState<any[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);
  const [senderStatus, setSenderStatus] = useState<any>(null);
  const [applySenderId, setApplySenderId] = useState("");
  const [applying, setApplying] = useState(false);
  const [singlePhone, setSinglePhone] = useState("");

  useEffect(() => {
    fetch("/api/customers").then(r=>r.json()).then(d=>setCustomers(d.customers||[]));
    fetch("/api/messages").then(r=>r.json()).then(d=>setLogs(d.logs||[]));
    fetch("/api/messages/sender-id").then(r=>r.json()).then(d=>setSenderStatus(d));
  }, []);

  function toggleCustomer(id: string) {
    setSelected(s=>s.includes(id)?s.filter(x=>x!==id):[...s,id]);
  }

  async function sendSms() {
    if (!message.trim()) { toast.error("Andika ujumbe"); return; }
    if (!senderStatus?.approved) { toast.error("Sender ID haijaidhinishwa bado"); return; }
    setSending(true);
    try {
      const body: any = { message };
      if (singlePhone) body.phone = singlePhone;
      else if (selected.length) body.customerIds = selected;
      else body.customerIds = customers.map((c:any)=>c.id);

      const res = await fetch("/api/messages", {
        method: "POST", headers: {"Content-Type":"application/json"},
        body: JSON.stringify(body),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      toast.success(`Imetumwa: ${d.sent||1}`);
      setMessage(""); setSelected([]); setSinglePhone("");
      fetch("/api/messages").then(r=>r.json()).then(d=>setLogs(d.logs||[]));
    } catch(e:any) { toast.error(e.message||"Imeshindwa kutuma"); }
    setSending(false);
  }

  async function applySenderIdFn() {
    if (!applySenderId.trim()) { toast.error("Weka Sender ID"); return; }
    setApplying(true);
    try {
      const res = await fetch("/api/messages/sender-id", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ senderId: applySenderId }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      toast.success(d.message);
      fetch("/api/messages/sender-id").then(r=>r.json()).then(d=>setSenderStatus(d));
    } catch(e:any) { toast.error(e.message||"Failed"); }
    setApplying(false);
  }

  const S: Record<string,React.CSSProperties> = {
    page:   {padding:24,fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"},
    h1:     {fontSize:22,fontWeight:800,color:"#111",margin:0},
    sub:    {fontSize:13,color:"#6b7280",marginTop:4,marginBottom:20},
    tabBar: {display:"flex",gap:4,background:"#f3f4f6",padding:4,borderRadius:12,marginBottom:24,flexWrap:"wrap" as const},
    card:   {background:"#fff",border:"1px solid #e5e7eb",borderRadius:14,padding:20,marginBottom:16,boxShadow:"0 1px 4px rgba(0,0,0,0.04)"},
    lbl:    {fontSize:13,fontWeight:700,color:"#374151",display:"block",marginBottom:6},
    inp:    {width:"100%",padding:"9px 12px",border:"1px solid #e5e7eb",borderRadius:10,fontSize:13,outline:"none",boxSizing:"border-box" as const,marginBottom:12},
    ta:     {width:"100%",padding:"10px 12px",border:"1px solid #e5e7eb",borderRadius:10,fontSize:13,outline:"none",boxSizing:"border-box" as const,resize:"vertical" as const,minHeight:90},
    btn:    {padding:"10px 24px",background:"#2563eb",color:"#fff",border:"none",borderRadius:10,fontSize:14,fontWeight:700,cursor:"pointer"},
    th:     {padding:"10px 14px",fontSize:11,fontWeight:700,color:"#9ca3af",textAlign:"left" as const,textTransform:"uppercase" as const,borderBottom:"1px solid #e5e7eb",background:"#f9fafb"},
    td:     {padding:"11px 14px",fontSize:13,color:"#374151",borderBottom:"1px solid #f3f4f6"},
    tblW:   {background:"#fff",border:"1px solid #e5e7eb",borderRadius:14,overflow:"hidden",boxShadow:"0 1px 4px rgba(0,0,0,0.04)"},
    alertG: {padding:"14px 16px",borderRadius:12,border:"1px solid #bbf7d0",background:"#f0fdf4",marginBottom:16},
    alertR: {padding:"14px 16px",borderRadius:12,border:"1px solid #fecaca",background:"#fef2f2",marginBottom:16},
    alertY: {padding:"14px 16px",borderRadius:12,border:"1px solid #fde68a",background:"#fffbeb",marginBottom:16},
  };
  const dynS={tab:(a:boolean):React.CSSProperties=>({padding:"8px 16px",borderRadius:9,fontSize:13,fontWeight:700,border:"none",cursor:"pointer",background:a?"#fff":"transparent",color:a?"#2563eb":"#6b7280",boxShadow:a?"0 1px 4px rgba(0,0,0,0.08)":"none"})};

  return (
    <div style={S.page}>
      <h1 style={S.h1}>💬 Ujumbe wa SMS</h1>
      <p style={S.sub}>Tuma ujumbe kwa wateja wako kupitia Beem Africa</p>

      {/* Sender ID status banner */}
      {senderStatus && (
        senderStatus.approved ? (
          <div style={S.alertG}>
            <strong style={{color:"#15803d"}}>✅ Sender ID Imeidhinishwa:</strong>
            <code style={{marginLeft:8,background:"#dcfce7",padding:"2px 8px",borderRadius:5,color:"#15803d",fontWeight:700}}>{senderStatus.senderId}</code>
          </div>
        ) : senderStatus.senderId ? (
          <div style={S.alertY}>
            <strong style={{color:"#92400e"}}>⏳ Inasubiri Idhini:</strong>
            <span style={{marginLeft:8,color:"#92400e"}}>Sender ID "{senderStatus.senderId}" inasubiri idhini ya superadmin</span>
          </div>
        ) : (
          <div style={S.alertR}>
            <strong style={{color:"#b91c1c"}}>⚠ Sender ID Haijawekwa:</strong>
            <span style={{marginLeft:8,color:"#b91c1c"}}>Nenda kwenye kichupo "Sender ID" kuomba sender ID</span>
          </div>
        )
      )}

      <div style={S.tabBar}>
        {([["send","📤 Tuma SMS"],["logs","📋 Historia"],["senderid","🆔 Sender ID"],["buysms","💳 Nunua SMS"]] as const).map(([k,l])=>(
          <button key={k} onClick={()=>setTab(k)} style={dynS.tab(tab===k)}>{l}</button>
        ))}
      </div>

      {tab==="send" && (
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
          <div style={S.card}>
            <label style={S.lbl}>Tuma kwa Nambari Moja (Hiari)</label>
            <input value={singlePhone} onChange={e=>setSinglePhone(e.target.value)} placeholder="+255700000000" style={S.inp}/>
            <label style={S.lbl}>Au Chagua Wateja</label>
            <div style={{maxHeight:300,overflowY:"auto",border:"1px solid #e5e7eb",borderRadius:10,padding:8}}>
              {customers.map((c:any)=>(
                <label key={c.id} style={{display:"flex",alignItems:"center",gap:8,padding:"7px 6px",borderRadius:8,cursor:"pointer",background:selected.includes(c.id)?"#eff6ff":"transparent"}}>
                  <input type="checkbox" checked={selected.includes(c.id)} onChange={()=>toggleCustomer(c.id)} style={{accentColor:"#2563eb"}}/>
                  <div>
                    <div style={{fontSize:13,fontWeight:700,color:"#111"}}>{c.name}</div>
                    <div style={{fontSize:11,color:"#9ca3af"}}>{c.phone||"Hakuna simu"}</div>
                  </div>
                </label>
              ))}
              {customers.length===0 && <div style={{padding:"20px 0",textAlign:"center" as const,color:"#9ca3af",fontSize:13}}>Hakuna wateja</div>}
            </div>
            <div style={{marginTop:8,fontSize:12,color:"#6b7280"}}>
              {singlePhone?"Itatuma kwa nambari moja":selected.length?`${selected.length} wamechaguliwa`:"Wote watachaguliwa"}
            </div>
          </div>

          <div style={S.card}>
            <label style={S.lbl}>Ujumbe *</label>
            <textarea value={message} onChange={e=>setMessage(e.target.value)} placeholder="Andika ujumbe hapa…" style={S.ta}/>
            <div style={{fontSize:12,color:message.length>160?"#dc2626":"#9ca3af",marginTop:4}}>{message.length}/160 chars</div>
            {senderStatus?.approved && (
              <div style={{marginTop:12,padding:"10px 14px",background:"#f0fdf4",borderRadius:10,border:"1px solid #bbf7d0"}}>
                <div style={{fontSize:12,fontWeight:700,color:"#15803d"}}>📡 Sender ID: {senderStatus.senderId}</div>
                <div style={{fontSize:11,color:"#16a34a",marginTop:2}}>Powered by Beem Africa</div>
              </div>
            )}
            <button onClick={sendSms} disabled={sending||!senderStatus?.approved} style={{...S.btn,marginTop:14,opacity:senderStatus?.approved?1:0.5}}>
              {sending?"Inatuma…":"📤 Tuma Ujumbe"}
            </button>
          </div>
        </div>
      )}

      {tab==="logs" && (
        <div style={S.tblW}>
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <thead><tr>
              <th style={S.th}>Simu</th>
              <th style={S.th}>Ujumbe</th>
              <th style={S.th}>Hali</th>
              <th style={S.th}>Tarehe</th>
            </tr></thead>
            <tbody>
              {logs.length===0&&<tr><td colSpan={4} style={{...S.td,textAlign:"center" as const,padding:"40px 0",color:"#9ca3af"}}>Hakuna historia ya ujumbe</td></tr>}
              {logs.map((l:any)=>(
                <tr key={l.id}>
                  <td style={{...S.td,fontFamily:"monospace",fontSize:12}}>{l.to}</td>
                  <td style={{...S.td,maxWidth:320,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as const}}>{l.message}</td>
                  <td style={S.td}><span style={{display:"inline-block",padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:700,background:l.status==="SENT"?"#f0fdf4":"#fef2f2",color:l.status==="SENT"?"#16a34a":"#dc2626"}}>{l.status}</span></td>
                  <td style={{...S.td,fontSize:11,color:"#9ca3af"}}>{new Date(l.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab==="senderid" && (
        <div style={{maxWidth:520}}>
          <div style={S.card}>
            <div style={{fontSize:15,fontWeight:800,color:"#111",marginBottom:12}}>🆔 Omba Sender ID</div>
            <p style={{fontSize:13,color:"#6b7280",marginBottom:16}}>
              Omba Sender ID yako kwa kutuma ombi hapa chini. Superadmin ataidhinisha na kuwezesha utumaji wa SMS.
            </p>
            {senderStatus?.senderId && (
              <div style={{padding:"12px 14px",background:"#f8faff",borderRadius:10,border:"1px solid #bfdbfe",marginBottom:14}}>
                <div style={{fontSize:12,fontWeight:700,color:"#1d4ed8"}}>Sender ID ya Sasa:</div>
                <code style={{fontSize:14,fontWeight:800,color:"#111"}}>{senderStatus.senderId}</code>
                <span style={{marginLeft:10,display:"inline-block",padding:"2px 10px",borderRadius:20,fontSize:11,fontWeight:700,background:senderStatus.approved?"#f0fdf4":"#fef9c3",color:senderStatus.approved?"#16a34a":"#92400e"}}>
                  {senderStatus.approved?"Imeidhinishwa":"Inasubiri"}
                </span>
              </div>
            )}
            <label style={S.lbl}>Sender ID Mpya (herufi kubwa, max 11)</label>
            <input value={applySenderId} onChange={e=>setApplySenderId(e.target.value.toUpperCase().slice(0,11))}
              placeholder="BIASHARA" style={S.inp} maxLength={11}/>
            <p style={{fontSize:12,color:"#9ca3af",marginBottom:14}}>Mfano: BIASHARA, DUKA123, FARAJA</p>
            <button onClick={applySenderIdFn} disabled={applying} style={S.btn}>{applying?"Inawasilisha…":"Wasilisha Ombi"}</button>
          </div>
        </div>
      )}

      {tab==="buysms" && (
        <div style={{maxWidth:560}}>
          <div style={S.card}>
            <div style={{fontSize:15,fontWeight:800,color:"#111",marginBottom:4}}>💳 Nunua Bundi za SMS</div>
            <p style={{fontSize:13,color:"#6b7280",marginBottom:20}}>Nunua bundi za SMS kupitia Selcom ili uendelee kutuma ujumbe kwa wateja wako.</p>
            {[
              {label:"Bundi Ndogo",   sms:500,  price:"TZS 5,000",  clr:"#2563eb",bg:"#eff6ff"},
              {label:"Bundi ya Kati", sms:1000, price:"TZS 9,000",  clr:"#7c3aed",bg:"#f5f3ff"},
              {label:"Bundi Kubwa",   sms:5000, price:"TZS 40,000", clr:"#16a34a",bg:"#f0fdf4"},
            ].map((p,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"16px 18px",border:`1px solid ${p.clr}30`,borderRadius:12,marginBottom:12,background:p.bg}}>
                <div>
                  <div style={{fontSize:14,fontWeight:800,color:p.clr}}>{p.label}</div>
                  <div style={{fontSize:12,color:"#6b7280",marginTop:2}}>{p.sms.toLocaleString()} SMS</div>
                </div>
                <div style={{textAlign:"right" as const}}>
                  <div style={{fontSize:16,fontWeight:900,color:p.clr}}>{p.price}</div>
                  <button onClick={()=>toast("Selcom payment integration coming soon")}
                    style={{marginTop:6,padding:"7px 18px",background:p.clr,color:"#fff",border:"none",borderRadius:8,fontSize:12,fontWeight:700,cursor:"pointer"}}>
                    Nunua
                  </button>
                </div>
              </div>
            ))}
            <div style={{padding:"14px 16px",background:"#f9fafb",borderRadius:10,border:"1px solid #e5e7eb",marginTop:8}}>
              <div style={{fontSize:12,fontWeight:700,color:"#374151"}}>💡 Malipo kupitia Selcom</div>
              <div style={{fontSize:12,color:"#6b7280",marginTop:3}}>Bonyeza "Nunua" itakupeleka kwa Selcom Checkout kwa malipo salama.</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
