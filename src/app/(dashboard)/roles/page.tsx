"use client";
export const dynamic = "force-dynamic";
import { useState } from "react";

const ROLES = [
  { role: "TENANT_ADMIN",       label: "Admin",              color: "#b91c1c", bg: "#fef2f2", icon: "👑",
    desc: "Full access to all system features",
    perms: ["Dashboard","POS / Sales","Products","Inventory","Customers","Suppliers","Purchases","Accounting","Reports","Staff & Roles","Messages","Settings"] },
  { role: "GENERAL_MANAGER",    label: "General Manager",    color: "#7e22ce", bg: "#fdf4ff", icon: "🏢",
    desc: "Oversees operations across all departments",
    perms: ["Dashboard","POS / Sales","Products","Inventory","Customers","Suppliers","Purchases","Accounting","Reports","Staff & Roles","Messages"] },
  { role: "STORE_MANAGER",      label: "Store Manager",      color: "#1d4ed8", bg: "#eff6ff", icon: "🏪",
    desc: "Manages daily store operations and staff",
    perms: ["Dashboard","POS / Sales","Products","Inventory","Customers","Suppliers","Purchases","Reports","Staff & Roles"] },
  { role: "PRODUCTION_MANAGER", label: "Production Manager", color: "#c2410c", bg: "#fff7ed", icon: "⚙️",
    desc: "Manages production flow, inventory and procurement",
    perms: ["Dashboard","Products","Inventory","Purchases","Reports"] },
  { role: "HR_MANAGER",         label: "HR Manager",         color: "#0f766e", bg: "#f0fdfa", icon: "�",
    desc: "Manages staff, roles and internal communications",
    perms: ["Dashboard","Staff & Roles","Reports","Messages"] },
  { role: "ACCOUNTANT",         label: "Accountant",         color: "#6d28d9", bg: "#f5f3ff", icon: "📒",
    desc: "Handles accounting, finances and reporting",
    perms: ["Dashboard","Accounting","Reports","Products"] },
  { role: "CASHIER",            label: "Cashier",            color: "#15803d", bg: "#f0fdf4", icon: "🛒",
    desc: "Handles point-of-sale transactions",
    perms: ["Dashboard","POS / Sales","Customers"] },
];

export default function RolesPage() {
  const [expanded, setExpanded] = useState<string|null>("TENANT_ADMIN");

  const S: Record<string,React.CSSProperties> = {
    page:  {padding:24,fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"},
    h1:    {fontSize:22,fontWeight:800,color:"#111",margin:0},
    sub:   {fontSize:13,color:"#6b7280",marginTop:4,marginBottom:20},
    grid:  {display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(360px,1fr))",gap:16},
    card:  {background:"#fff",border:"1px solid #e5e7eb",borderRadius:14,overflow:"hidden",boxShadow:"0 1px 4px rgba(0,0,0,0.04)"},
    chdr:  {display:"flex",alignItems:"center",justifyContent:"space-between",padding:"16px 18px",cursor:"pointer"},
    perm:  {display:"inline-flex",alignItems:"center",gap:5,padding:"4px 10px",borderRadius:20,fontSize:11,fontWeight:700,margin:"3px 3px"},
    info:  {padding:"13px 16px",background:"#f8faff",borderRadius:10,border:"1px solid #bfdbfe",marginBottom:20,fontSize:13,color:"#374151"},
  };

  return (
    <div style={S.page}>
      <h1 style={S.h1}>Roles & Permissions</h1>
      <p style={S.sub}>System roles and their default access permissions</p>

      <div style={S.info}>
        <strong style={{color:"#1d4ed8"}}>ℹ Note: </strong>
        Roles define default permissions. When adding staff you can further customise individual permissions per person.
      </div>

      <div style={S.grid}>
        {ROLES.map(r=>(
          <div key={r.role} style={S.card}>
            <div style={S.chdr} onClick={()=>setExpanded(expanded===r.role?null:r.role)}>
              <div style={{display:"flex",alignItems:"center",gap:12}}>
                <div style={{width:42,height:42,borderRadius:12,background:r.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>{r.icon}</div>
                <div>
                  <div style={{fontWeight:800,color:"#111",fontSize:14}}>{r.label}</div>
                  <div style={{fontSize:11,color:"#9ca3af",marginTop:1}}>{r.perms.length} permissions</div>
                </div>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <span style={{padding:"2px 8px",borderRadius:20,background:r.bg,color:r.color,fontSize:10,fontWeight:700}}>{r.role}</span>
                <span style={{fontSize:16,color:"#9ca3af",transform:expanded===r.role?"rotate(90deg)":"none",display:"inline-block",transition:"transform 0.2s"}}>›</span>
              </div>
            </div>
            <div style={{overflow:"hidden",maxHeight:expanded===r.role?600:0,transition:"max-height 0.3s ease"}}>
              <div style={{padding:"0 18px 16px",borderTop:"1px solid #f3f4f6"}}>
                <p style={{fontSize:12,color:"#6b7280",margin:"10px 0 8px"}}>{r.desc}</p>
                <div style={{fontSize:11,fontWeight:700,color:"#6b7280",marginBottom:6,textTransform:"uppercase" as const,letterSpacing:"0.05em"}}>Access Permissions</div>
                <div>
                  {r.perms.map((p,i)=>(
                    <span key={i} style={{...S.perm,background:r.bg,color:r.color}}>✓ {p}</span>
                  ))}
                </div>
                <div style={{marginTop:12,padding:"9px 12px",background:"#f9fafb",borderRadius:8,fontSize:12,color:"#6b7280"}}>
                  Assign this role when adding staff via <strong>Staff &amp; Roles → All Staff</strong>. You can also override individual permissions per staff member.
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
