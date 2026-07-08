"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { formatCurrency, formatDate } from "@/lib/utils";

const TABS = ["sales", "inventory", "profit", "customers", "suppliers"] as const;
type ReportTab = typeof TABS[number];

export default function ReportsPage() {
  const [tab, setTab] = useState<ReportTab>("sales");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [from, setFrom] = useState(() => {
    const d = new Date(); d.setDate(1);
    return d.toISOString().split("T")[0];
  });
  const [to, setTo] = useState(() => new Date().toISOString().split("T")[0]);

  useEffect(() => { loadReport(); }, [tab, from, to]);

  async function loadReport() {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports?type=${tab}&from=${from}&to=${to}`);
      const json = await res.json();
      setData(json);
    } catch {}
    setLoading(false);
  }

  const PIE_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

  const tabMeta: Record<ReportTab, {icon:string,label:string}> = {
    sales:     {icon:"💰",label:"Mauzo"},
    inventory: {icon:"📦",label:"Hifadhi"},
    profit:    {icon:"📈",label:"Faida"},
    customers: {icon:"👥",label:"Wateja"},
    suppliers: {icon:"🚚",label:"Wasambazaji"},
  };

  const S: Record<string,React.CSSProperties> = {
    page:    {padding:24,fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"},
    hdr:     {display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20},
    h1:      {fontSize:22,fontWeight:800,color:"#111",margin:0},
    sub:     {fontSize:13,color:"#6b7280",marginTop:4},
    rfBtn:   {padding:"8px 16px",border:"1px solid #e5e7eb",borderRadius:10,background:"#fff",fontSize:13,fontWeight:700,cursor:"pointer"},
    dateRow: {display:"flex",gap:10,flexWrap:"wrap" as const,marginBottom:16,alignItems:"center"},
    dateI:   {padding:"7px 12px",border:"1px solid #e5e7eb",borderRadius:9,fontSize:13,outline:"none"},
    qBtn:    {padding:"7px 14px",border:"1px solid #e5e7eb",borderRadius:9,background:"#fff",fontSize:12,fontWeight:700,cursor:"pointer",color:"#374151"},
    tabBar:  {display:"flex",gap:4,background:"#f3f4f6",padding:4,borderRadius:12,marginBottom:20,flexWrap:"wrap" as const},
    statsG:  {display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:12,marginBottom:16},
    statC:   {background:"#fff",border:"1px solid #e5e7eb",borderRadius:12,padding:16,boxShadow:"0 1px 3px rgba(0,0,0,0.04)"},
    card:    {background:"#fff",border:"1px solid #e5e7eb",borderRadius:14,overflow:"hidden",marginBottom:16},
    cardHdr: {padding:"12px 16px",borderBottom:"1px solid #e5e7eb",fontWeight:700,fontSize:14,color:"#111"},
    th:      {padding:"10px 14px",fontSize:11,fontWeight:700,color:"#6b7280",textAlign:"left" as const,borderBottom:"1px solid #e5e7eb",background:"#f9fafb",whiteSpace:"nowrap" as const},
    thr:     {padding:"10px 14px",fontSize:11,fontWeight:700,color:"#6b7280",textAlign:"right" as const,borderBottom:"1px solid #e5e7eb",background:"#f9fafb",whiteSpace:"nowrap" as const},
    td:      {padding:"11px 14px",fontSize:13,color:"#374151",borderBottom:"1px solid #f3f4f6"},
    tdr:     {padding:"11px 14px",fontSize:13,color:"#374151",borderBottom:"1px solid #f3f4f6",textAlign:"right" as const},
  };
  const dynS = {
    tab:(active:boolean):React.CSSProperties=>({padding:"8px 16px",borderRadius:9,fontSize:13,fontWeight:700,border:"none",cursor:"pointer",background:active?"#fff":"transparent",color:active?"#2563eb":"#6b7280",boxShadow:active?"0 1px 4px rgba(0,0,0,0.08)":"none"}),
  };

  return (
    <div style={S.page}>
      <div style={S.hdr}>
        <div>
          <h1 style={S.h1}>📊 Ripoti na Uchambuzi</h1>
          <p style={S.sub}>Uhalisia wa utendaji wa biashara</p>
        </div>
        <button onClick={loadReport} style={S.rfBtn}>🔄 Onyesha Upya</button>
      </div>

      <div style={S.dateRow}>
        <span style={{fontSize:13,fontWeight:700}}>Kutoka:</span>
        <input type="date" value={from} onChange={e=>setFrom(e.target.value)} style={S.dateI}/>
        <span style={{fontSize:13,fontWeight:700}}>Hadi:</span>
        <input type="date" value={to} onChange={e=>setTo(e.target.value)} style={S.dateI}/>
        {[
          {label:"Leo",    fn:()=>{const d=new Date().toISOString().split("T")[0];setFrom(d);setTo(d);}},
          {label:"Mwezi Huu", fn:()=>{const d=new Date();setFrom(new Date(d.getFullYear(),d.getMonth(),1).toISOString().split("T")[0]);setTo(d.toISOString().split("T")[0]);}},
          {label:"Mwezi Uliopita", fn:()=>{const d=new Date();const f=new Date(d.getFullYear(),d.getMonth()-1,1);const t=new Date(d.getFullYear(),d.getMonth(),0);setFrom(f.toISOString().split("T")[0]);setTo(t.toISOString().split("T")[0]);}},
        ].map(q=>(<button key={q.label} onClick={q.fn} style={S.qBtn}>{q.label}</button>))}
      </div>

      <div style={S.tabBar}>
        {TABS.map(t=>(
          <button key={t} onClick={()=>setTab(t)} style={dynS.tab(tab===t)}>
            {tabMeta[t].icon} {tabMeta[t].label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={S.statsG}>
          {Array.from({length:4}).map((_,i)=><div key={i} style={{height:120,background:"#f3f4f6",borderRadius:12}}/>)}
        </div>
      ) : (
        <>
          {tab==="sales" && data && (
            <>
              <div style={S.statsG}>
                {[
                  {label:"Jumla ya Mauzo",  value:data.summary?._count||0,            sub:"miamala",       clr:"#2563eb"},
                  {label:"Mapato Yote",      value:formatCurrency(data.summary?._sum?.total||0,"TZS"),    sub:"jumla ya mapato",  clr:"#16a34a"},
                  {label:"Punguzo Lililotolewa", value:formatCurrency(data.summary?._sum?.discount||0,"TZS"), sub:"punguzo", clr:"#d97706"},
                  {label:"Madeni Yanayodaiwa", value:formatCurrency(data.summary?._sum?.debtAmount||0,"TZS"), sub:"deni",   clr:"#dc2626"},
                ].map((s,i)=>(
                  <div key={i} style={S.statC}>
                    <div style={{fontSize:11,fontWeight:700,color:"#6b7280",textTransform:"uppercase" as const,marginBottom:8}}>{s.label}</div>
                    <div style={{fontSize:22,fontWeight:900,color:s.clr}}>{s.value}</div>
                    <div style={{fontSize:11,color:"#9ca3af",marginTop:4}}>{s.sub}</div>
                  </div>
                ))}
              </div>
              <div style={S.card}>
                <div style={S.cardHdr}>💰 Miamala ya Mauzo</div>
                <div style={{overflowX:"auto",maxHeight:400}}>
                  <table style={{width:"100%",borderCollapse:"collapse"}}>
                    <thead><tr>
                      <th style={S.th}>Risiti</th><th style={S.th}>Mteja</th><th style={S.th}>Cashier</th>
                      <th style={S.thr}>Jumla</th><th style={S.th}>Tarehe</th>
                    </tr></thead>
                    <tbody>{data.sales?.map((s:any)=>(
                      <tr key={s.id}>
                        <td style={{...S.td,fontFamily:"monospace",fontSize:11}}>{s.receiptNumber}</td>
                        <td style={S.td}>{s.customer?.name||"Walk-in"}</td>
                        <td style={{...S.td,color:"#6b7280"}}>{s.user?.name}</td>
                        <td style={{...S.tdr,fontWeight:700,color:"#2563eb"}}>{formatCurrency(s.total,"TZS")}</td>
                        <td style={{...S.td,fontSize:11,color:"#9ca3af"}}>{formatDate(s.createdAt)}</td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {tab==="profit" && data && (
            <>
              <div style={{...S.statsG,gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))"}}>
                {[
                  {label:"Mapato Yote",    value:formatCurrency(data.totalRevenue||0,"TZS"),  clr:"#2563eb"},
                  {label:"Gharama za Bidhaa",value:formatCurrency(data.totalCOGS||0,"TZS"),   clr:"#ea580c"},
                  {label:"Faida ya Jumla", value:formatCurrency(data.grossProfit||0,"TZS"),   clr:"#16a34a"},
                  {label:"Asilimia ya Faida",value:`${data.grossMargin||0}%`,                 clr:"#7c3aed"},
                  {label:"Matumizi Yote",  value:formatCurrency(data.totalExpenses||0,"TZS"), clr:"#dc2626"},
                  {label:"Faida Halisi",   value:formatCurrency(data.netProfit||0,"TZS"),     clr:data.netProfit>=0?"#15803d":"#dc2626"},
                ].map((s,i)=>(
                  <div key={i} style={S.statC}>
                    <div style={{fontSize:11,fontWeight:700,color:"#6b7280",textTransform:"uppercase" as const,marginBottom:8}}>{s.label}</div>
                    <div style={{fontSize:20,fontWeight:900,color:s.clr}}>{s.value}</div>
                  </div>
                ))}
              </div>
              <div style={{...S.card,padding:20}}>
                <div style={{fontWeight:700,marginBottom:16}}>📊 Mgawanyo wa Faida</div>
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie data={[
                      {name:"Gharama",value:data.totalCOGS||0},
                      {name:"Faida ya Jumla",value:Math.max(0,data.grossProfit||0)},
                      {name:"Matumizi",value:data.totalExpenses||0},
                    ]} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`}>
                      {[0,1,2].map(i=><Cell key={i} fill={PIE_COLORS[i]}/>)}
                    </Pie>
                    <Tooltip formatter={(v:any)=>formatCurrency(v,"TZS")}/>
                    <Legend/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </>
          )}

          {tab==="inventory" && data && (
            <div style={S.card}>
              <div style={S.cardHdr}>📦 Viwango vya Hifadhi</div>
              <div style={{overflowX:"auto",maxHeight:400}}>
                <table style={{width:"100%",borderCollapse:"collapse"}}>
                  <thead><tr>
                    <th style={S.th}>Bidhaa</th><th style={S.th}>Kategoria</th><th style={S.th}>Duka</th>
                    <th style={S.thr}>Idadi</th><th style={S.thr}>Kiwango cha Chini</th><th style={S.th}>Hali</th>
                  </tr></thead>
                  <tbody>{data.inventories?.map((inv:any)=>{
                    const isLow=Number(inv.quantity)<=inv.product.minStockLevel;
                    return(<tr key={inv.id}>
                      <td style={{...S.td,fontWeight:700}}>{inv.product.name}</td>
                      <td style={{...S.td,color:"#6b7280"}}>{inv.product.category?.name||"—"}</td>
                      <td style={{...S.td,color:"#6b7280"}}>{inv.store.name}</td>
                      <td style={{...S.tdr,fontWeight:700}}>{Number(inv.quantity)}</td>
                      <td style={{...S.tdr,color:"#9ca3af"}}>{inv.product.minStockLevel}</td>
                      <td style={S.td}><span style={{display:"inline-block",padding:"2px 10px",borderRadius:20,fontSize:11,fontWeight:700,background:isLow?"#fef2f2":"#f0fdf4",color:isLow?"#dc2626":"#16a34a"}}>{isLow?"Hifadhi Chini":"Sawa"}</span></td>
                    </tr>);
                  })}</tbody>
                </table>
              </div>
            </div>
          )}

          {tab==="customers" && data && (
            <div style={S.card}>
              <div style={S.cardHdr}>👥 Ripoti ya Wateja</div>
              <div style={{overflowX:"auto"}}>
                <table style={{width:"100%",borderCollapse:"collapse"}}>
                  <thead><tr>
                    <th style={S.th}>Mteja</th><th style={S.th}>Aina</th>
                    <th style={S.thr}>Mauzo</th><th style={S.thr}>Kilinunuliwa</th>
                    <th style={S.thr}>Deni</th><th style={S.thr}>Pointi</th>
                  </tr></thead>
                  <tbody>{data.customers?.map((c:any)=>(
                    <tr key={c.id}>
                      <td style={{...S.td,fontWeight:700}}>{c.name}</td>
                      <td style={S.td}><span style={{display:"inline-block",padding:"2px 10px",borderRadius:20,fontSize:11,fontWeight:700,background:"#dbeafe",color:"#1d4ed8"}}>{c.type}</span></td>
                      <td style={S.tdr}>{c._count?.sales||0}</td>
                      <td style={{...S.tdr,fontWeight:700}}>{formatCurrency(c.totalPurchased||0,"TZS")}</td>
                      <td style={{...S.tdr,fontWeight:700,color:Number(c.totalDebt)>0?"#dc2626":"#16a34a"}}>{Number(c.totalDebt)>0?formatCurrency(c.totalDebt,"TZS"):"—"}</td>
                      <td style={{...S.tdr,color:"#d97706"}}>⭐ {c.loyaltyPoints}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            </div>
          )}

          {tab==="suppliers" && data && (
            <div style={S.card}>
              <div style={S.cardHdr}>🚚 Ripoti ya Wasambazaji</div>
              <div style={{overflowX:"auto"}}>
                <table style={{width:"100%",borderCollapse:"collapse"}}>
                  <thead><tr>
                    <th style={S.th}>Msambazaji</th><th style={S.thr}>Manunuzi</th>
                    <th style={S.thr}>Jumla</th><th style={S.thr}>Kilicholipwa</th><th style={S.thr}>Salio</th>
                  </tr></thead>
                  <tbody>{data.suppliers?.map((s:any)=>{
                    const tot=s.purchases?.reduce((a:number,p:any)=>a+Number(p.total),0)||0;
                    const paid=s.purchases?.reduce((a:number,p:any)=>a+Number(p.amountPaid),0)||0;
                    return(<tr key={s.id}>
                      <td style={{...S.td,fontWeight:700}}>{s.name}</td>
                      <td style={S.tdr}>{s._count?.purchases||0}</td>
                      <td style={{...S.tdr,fontWeight:700,color:"#2563eb"}}>{formatCurrency(tot,"TZS")}</td>
                      <td style={{...S.tdr,color:"#16a34a",fontWeight:700}}>{formatCurrency(paid,"TZS")}</td>
                      <td style={{...S.tdr,fontWeight:700,color:tot-paid>0?"#dc2626":"#16a34a"}}>{formatCurrency(tot-paid,"TZS")}</td>
                    </tr>);
                  })}</tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
