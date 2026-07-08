"use client";
export const dynamic = "force-dynamic";
import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";

export default function SuperAdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editUser, setEditUser] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/superadmin/users?search=${encodeURIComponent(search)}`);
      const d = await res.json();
      setUsers(d.users || []);
    } catch { toast.error("Failed to load users"); }
    setLoading(false);
  }, [search]);

  useEffect(() => { load(); }, [load]);

  async function banUser(id: string, isActive: boolean) {
    try {
      const res = await fetch(`/api/superadmin/users/${id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !isActive }),
      });
      if (!res.ok) throw new Error();
      toast.success(isActive ? "User banned" : "User activated");
      load();
    } catch { toast.error("Failed"); }
  }

  async function deleteUser(id: string) {
    if (!confirm("Delete this user permanently?")) return;
    try {
      const res = await fetch(`/api/superadmin/users/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("User deleted");
      load();
    } catch { toast.error("Failed to delete"); }
  }

  async function saveEdit() {
    if (!editUser) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/superadmin/users/${editUser.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editUser.name, role: editUser.role }),
      });
      if (!res.ok) throw new Error();
      toast.success("User updated");
      setEditUser(null);
      load();
    } catch { toast.error("Failed to save"); }
    setSaving(false);
  }

  // Group users by tenant
  const grouped = users.reduce((acc: Record<string, any[]>, u) => {
    const key = u.tenantId || "__no_tenant__";
    if (!acc[key]) acc[key] = [];
    acc[key].push(u);
    return acc;
  }, {});

  const S: Record<string, React.CSSProperties> = {
    page:    { padding: 24, fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" },
    hdr:     { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 },
    h1:      { fontSize: 22, fontWeight: 800, color: "#111", margin: 0 },
    sub:     { fontSize: 13, color: "#6b7280", marginTop: 4 },
    srchRow: { display: "flex", gap: 10, marginBottom: 20, alignItems: "center" },
    srchWr:  { position: "relative" as const, flex: 1, maxWidth: 400 },
    srchIc:  { position: "absolute" as const, left: 10, top: "50%", transform: "translateY(-50%)", color: "#9ca3af" },
    srchI:   { width: "100%", padding: "9px 12px 9px 34px", border: "1px solid #e5e7eb", borderRadius: 10, fontSize: 13, outline: "none", boxSizing: "border-box" as const },
    srchBtn: { padding: "9px 20px", background: "#2563eb", color: "#fff", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer" },
    tenantG: { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, overflow: "hidden", marginBottom: 20, boxShadow: "0 1px 4px rgba(0,0,0,0.04)" },
    tHead:   { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: "#f8faff", borderBottom: "1px solid #e5e7eb" },
    tIcon:   { width: 34, height: 34, borderRadius: 9, background: "#dbeafe", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 },
    th:      { padding: "9px 14px", fontSize: 11, fontWeight: 700, color: "#9ca3af", textAlign: "left" as const, textTransform: "uppercase" as const, letterSpacing: "0.04em" },
    td:      { padding: "11px 14px", fontSize: 13, color: "#374151", borderBottom: "1px solid #f3f4f6", verticalAlign: "middle" as const },
    avatar:  { width: 32, height: 32, borderRadius: "50%", background: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 12, fontWeight: 800, flexShrink: 0 },
    overlay: { position: "fixed" as const, inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 },
    modal:   { background: "#fff", borderRadius: 18, width: "100%", maxWidth: 420, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" },
    mhdr:    { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid #e5e7eb" },
    mbody:   { padding: 20 },
    mftr:    { display: "flex", gap: 10, padding: "14px 20px", borderTop: "1px solid #e5e7eb" },
    lbl:     { fontSize: 13, fontWeight: 700, color: "#374151", display: "block", marginBottom: 5 },
    inp:     { width: "100%", padding: "9px 12px", border: "1px solid #e5e7eb", borderRadius: 10, fontSize: 13, outline: "none", boxSizing: "border-box" as const, marginBottom: 12 },
    sel:     { width: "100%", padding: "9px 12px", border: "1px solid #e5e7eb", borderRadius: 10, fontSize: 13, outline: "none", background: "#fff", boxSizing: "border-box" as const },
    cancelB: { flex: 1, padding: "10px 0", borderRadius: 12, border: "1px solid #e5e7eb", background: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", color: "#374151" },
    saveB:   { flex: 1, padding: "10px 0", borderRadius: 12, border: "none", background: "#2563eb", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer" },
  };

  const roleColorMap: Record<string, [string, string]> = {
    SUPER_ADMIN:   ["#fef3c7", "#92400e"],
    TENANT_ADMIN:  ["#fef2f2", "#b91c1c"],
    STORE_MANAGER: ["#eff6ff", "#1d4ed8"],
    CASHIER:       ["#f0fdf4", "#15803d"],
    ACCOUNTANT:    ["#f5f3ff", "#6d28d9"],
  };

  return (
    <div style={S.page}>
      <div style={S.hdr}>
        <div>
          <h1 style={S.h1}>👥 Watumiaji Wote</h1>
          <p style={S.sub}>Watumiaji wote katika mfumo — kwa kila tenant</p>
        </div>
      </div>

      <div style={S.srchRow}>
        <div style={S.srchWr}>
          <span style={S.srchIc}>🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === "Enter" && load()}
            placeholder="Tafuta jina au barua pepe…" style={S.srchI} />
        </div>
        <button onClick={load} style={S.srchBtn}>Tafuta</button>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "#9ca3af" }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>⏳</div>Inapakia…
        </div>
      ) : Object.keys(grouped).length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "#9ca3af" }}>Hakuna watumiaji walioopatikana</div>
      ) : Object.entries(grouped).map(([tenantId, tenantUsers]) => {
        const tenant = tenantUsers[0]?.tenant;
        const isNoTenant = tenantId === "__no_tenant__";
        return (
          <div key={tenantId} style={S.tenantG}>
            <div style={S.tHead}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ ...S.tIcon, background: isNoTenant ? "#f3f4f6" : "#dbeafe" }}>
                  {isNoTenant ? "❓" : (tenant?.name?.charAt(0) || "T")}
                </div>
                <div>
                  <div style={{ fontWeight: 800, color: "#111", fontSize: 14 }}>
                    {isNoTenant ? "No Tenant" : tenant?.name || "Unknown Tenant"}
                  </div>
                  <div style={{ fontSize: 11, color: "#9ca3af" }}>
                    Tenant ID: {isNoTenant ? "N/A" : tenantId.slice(0, 8)} · {tenantUsers.length} users
                  </div>
                </div>
              </div>
              {!isNoTenant && (
                <span style={{ display: "inline-block", padding: "3px 12px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: tenant?.status === "ACTIVE" ? "#f0fdf4" : "#fef2f2", color: tenant?.status === "ACTIVE" ? "#16a34a" : "#dc2626" }}>
                  {tenant?.status || "unknown"}
                </span>
              )}
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={S.th}>Jina</th>
                  <th style={S.th}>Barua Pepe</th>
                  <th style={S.th}>Jukumu</th>
                  <th style={S.th}>Hali</th>
                  <th style={S.th}>Aliungana</th>
                  <th style={S.th}>Vitendo</th>
                </tr>
              </thead>
              <tbody>
                {tenantUsers.map((u: any) => {
                  const [rbg, rclr] = roleColorMap[u.role] || ["#f3f4f6", "#374151"];
                  return (
                    <tr key={u.id}>
                      <td style={S.td}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={S.avatar}>{u.name?.charAt(0).toUpperCase()}</div>
                          <span style={{ fontWeight: 700 }}>{u.name?.toUpperCase()}</span>
                        </div>
                      </td>
                      <td style={{ ...S.td, color: "#6b7280" }}>{u.email}</td>
                      <td style={S.td}>
                        <span style={{ display: "inline-block", padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: rbg, color: rclr }}>
                          {u.role.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td style={S.td}>
                        <span style={{ display: "inline-block", padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: u.isActive ? "#f0fdf4" : "#fef2f2", color: u.isActive ? "#16a34a" : "#dc2626" }}>
                          {u.isActive ? "Active" : "Banned"}
                        </span>
                      </td>
                      <td style={{ ...S.td, fontSize: 11, color: "#9ca3af" }}>
                        {new Date(u.createdAt).toLocaleString("sw-TZ", { dateStyle: "short", timeStyle: "short" })}
                      </td>
                      <td style={S.td}>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button onClick={() => setEditUser({ ...u })} style={{ padding: "4px 10px", borderRadius: 7, border: "1px solid #bfdbfe", background: "#eff6ff", color: "#2563eb", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Edit</button>
                          {u.role !== "SUPER_ADMIN" && (
                            <button onClick={() => banUser(u.id, u.isActive)} style={{ padding: "4px 10px", borderRadius: 7, border: "1px solid #fde68a", background: "#fffbeb", color: "#b45309", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                              {u.isActive ? "Ban" : "Unban"}
                            </button>
                          )}
                          {u.role !== "SUPER_ADMIN" && (
                            <button onClick={() => deleteUser(u.id)} style={{ padding: "4px 10px", borderRadius: 7, border: "1px solid #fecaca", background: "#fef2f2", color: "#dc2626", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Delete</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        );
      })}

      {editUser && (
        <div style={S.overlay}>
          <div style={S.modal}>
            <div style={S.mhdr}>
              <span style={{ fontSize: 15, fontWeight: 800, color: "#111" }}>✏ Hariri Mtumiaji</span>
              <button onClick={() => setEditUser(null)} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#9ca3af", lineHeight: 1 }}>×</button>
            </div>
            <div style={S.mbody}>
              <label style={S.lbl}>Jina</label>
              <input value={editUser.name} onChange={e => setEditUser((p: any) => ({ ...p, name: e.target.value }))} style={S.inp} />
              <label style={S.lbl}>Jukumu</label>
              <select value={editUser.role} onChange={e => setEditUser((p: any) => ({ ...p, role: e.target.value }))} style={S.sel}>
                <option value="CASHIER">Cashier</option>
                <option value="STORE_MANAGER">Store Manager</option>
                <option value="ACCOUNTANT">Accountant</option>
                <option value="TENANT_ADMIN">Tenant Admin</option>
                <option value="SUPER_ADMIN">Super Admin</option>
              </select>
            </div>
            <div style={S.mftr}>
              <button onClick={() => setEditUser(null)} style={S.cancelB}>Ghairi</button>
              <button onClick={saveEdit} disabled={saving} style={S.saveB}>{saving ? "Inahifadhi…" : "Hifadhi"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
