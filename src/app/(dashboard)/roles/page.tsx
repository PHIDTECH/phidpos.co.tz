"use client";
export const dynamic = "force-dynamic";
import { useState } from "react";

const BUILT_IN_ROLES = [
  { role: "TENANT_ADMIN",  label: "Msimamizi wa Tenant", color: "#b91c1c", bg: "#fef2f2", icon: "👑",
    perms: ["Dashboard", "Mauzo (POS)", "Bidhaa", "Hifadhi", "Wateja", "Wasambazaji", "Manunuzi", "Uhasibu", "Ripoti", "Mipangilio", "Wafanyakazi", "Ujumbe"] },
  { role: "STORE_MANAGER", label: "Meneja wa Duka",       color: "#1d4ed8", bg: "#eff6ff", icon: "🏪",
    perms: ["Dashboard", "Mauzo (POS)", "Bidhaa", "Hifadhi", "Wateja", "Wasambazaji", "Manunuzi", "Ripoti", "Wafanyakazi"] },
  { role: "CASHIER",       label: "Cashier",               color: "#15803d", bg: "#f0fdf4", icon: "🛒",
    perms: ["Dashboard", "Mauzo (POS)", "Wateja"] },
  { role: "ACCOUNTANT",    label: "Mhasibu",               color: "#6d28d9", bg: "#f5f3ff", icon: "📒",
    perms: ["Dashboard", "Uhasibu", "Ripoti", "Bidhaa"] },
];

export default function RolesPage() {
  const [expanded, setExpanded] = useState<string|null>("TENANT_ADMIN");

  const S: Record<string,React.CSSProperties> = {
    page:  {padding:24,fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"},
    h1:    {fontSize:22,fontWeight:800,color:"#111",margin:0},
    sub:   {fontSize:13,color:"#6b7280",marginTop:4,marginBottom:24},
    grid:  {display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(340px,1fr))",gap:16},
    card:  {background:"#fff",border:"1px solid #e5e7eb",borderRadius:14,overflow:"hidden",boxShadow:"0 1px 4px rgba(0,0,0,0.04)"},
    chdr:  {display:"flex",alignItems:"center",justifyContent:"space-between",padding:"16px 18px",cursor:"pointer"},
    perm:  {display:"inline-flex",alignItems:"center",gap:6,padding:"5px 12px",borderRadius:20,fontSize:12,fontWeight:700,margin:"4px 3px"},
    info:  {padding:"14px 16px",background:"#f8faff",borderRadius:10,border:"1px solid #bfdbfe",marginTop:16},
  };

  return (
    <div style={S.page}>
      <h1 style={S.h1}>🔐 Majukumu na Ruhusa</h1>
      <p style={S.sub}>Majukumu yaliyojengwa ndani ya mfumo na ruhusa zao</p>

      <div style={S.info}>
        <strong style={{fontSize:13,color:"#1d4ed8"}}>ℹ Taarifa:</strong>
        <span style={{fontSize:13,color:"#374151",marginLeft:6}}>
          Majukumu yanasimamia kiotomatiki na mfumo. Unaweza kuongeza wafanyakazi na kuchagua jukumu lao katika sehemu ya "Wafanyakazi".
        </span>
      </div>

      <div style={{...S.grid,marginTop:20}}>
        {BUILT_IN_ROLES.map(r=>(
          <div key={r.role} style={S.card}>
            <div style={S.chdr} onClick={()=>setExpanded(expanded===r.role?null:r.role)}>
              <div style={{display:"flex",alignItems:"center",gap:12}}>
                <div style={{width:40,height:40,borderRadius:10,background:r.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>{r.icon}</div>
                <div>
                  <div style={{fontWeight:800,color:"#111",fontSize:14}}>{r.label}</div>
                  <div style={{fontSize:11,color:"#9ca3af",marginTop:1}}>{r.perms.length} ruhusa</div>
                </div>
              </div>
              <span style={{fontSize:13,color:"#9ca3af",transform:expanded===r.role?"rotate(90deg)":"none",display:"inline-block",transition:"transform 0.2s"}}>›</span>
            </div>
            <div style={{padding:"0 18px",overflow:"hidden",maxHeight:expanded===r.role?500:0,transition:"max-height 0.3s ease"}}>
              <div style={{paddingBottom:16,borderTop:"1px solid #f3f4f6",paddingTop:12}}>
                <div style={{fontSize:12,fontWeight:700,color:"#6b7280",marginBottom:8,textTransform:"uppercase" as const,letterSpacing:"0.04em"}}>Ruhusa za Ufikiaji</div>
                <div>
                  {r.perms.map((p,i)=>(
                    <span key={i} style={{...S.perm,background:r.bg,color:r.color}}>
                      ✓ {p}
                    </span>
                  ))}
                </div>
                <div style={{marginTop:12,padding:"10px 12px",background:"#f9fafb",borderRadius:8,fontSize:12,color:"#6b7280"}}>
                  <span style={{display:"inline-block",padding:"2px 8px",borderRadius:20,background:r.bg,color:r.color,fontWeight:700,marginRight:6}}>{r.role}</span>
                  Jukumu hili linaweza kupewa wafanyakazi wakati wa usajili au uhariri.
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
