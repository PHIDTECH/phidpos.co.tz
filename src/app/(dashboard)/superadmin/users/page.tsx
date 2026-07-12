"use client";
export const dynamic = "force-dynamic";
import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";

export default function SuperAdminUsersPage() {
  const sessionData = useSession();
  const currentUser = sessionData?.data?.user as any;
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
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

  function handleSearch() {
    setSearch(searchInput);
  }

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

  // Group users by tenant — no-tenant group first, then others
  const grouped: Record<string, any[]> = {};
  for (const u of users) {
    const key = u.tenantId || "__no_tenant__";
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(u);
  }
  // Sort: no-tenant first, then by tenant name
  const sortedKeys = Object.keys(grouped).sort((a, b) => {
    if (a === "__no_tenant__") return -1;
    if (b === "__no_tenant__") return 1;
    const na = grouped[a][0]?.tenant?.name || "";
    const nb = grouped[b][0]?.tenant?.name || "";
    return na.localeCompare(nb);
  });

  const roleLabel: Record<string, string> = {
    SUPER_ADMIN:        "Super Admin",
    TENANT_ADMIN:       "Admin",
    STORE_MANAGER:      "Store Manager",
    CASHIER:            "Cashier",
    ACCOUNTANT:         "Accountant",
    GENERAL_MANAGER:    "General Manager",
    PRODUCTION_MANAGER: "Production Manager",
    HR_MANAGER:         "HR Manager",
  };

  const S: Record<string, React.CSSProperties> = {
    page:    { padding: 24, fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" },
    hdr:     { display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap" as const, gap: 12 },
    h1:      { fontSize: 26, fontWeight: 800, color: "#111", margin: 0 },
    sub:     { fontSize: 13, color: "#6b7280", marginTop: 4 },
    srchRow: { display: "flex", gap: 8, alignItems: "center" },
    srchI:   { padding: "9px 14px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 13, outline: "none", width: 240 },
    srchBtn: { padding: "9px 20px", background: "#2563eb", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer" },
    tenantG: { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden", marginBottom: 20, boxShadow: "0 1px 4px rgba(0,0,0,0.04)" },
    tHead:   { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", background: "#f0f6ff", borderBottom: "1px solid #e5e7eb" },
    tIcon:   { width: 38, height: 38, borderRadius: 10, background: "#dbeafe", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 800, flexShrink: 0, color: "#1d4ed8" },
    th:      { padding: "10px 16px", fontSize: 11, fontWeight: 700, color: "#9ca3af", textAlign: "left" as const, textTransform: "uppercase" as const, letterSpacing: "0.06em", background: "#fafafa", borderBottom: "1px solid #f0f0f0" },
    td:      { padding: "12px 16px", fontSize: 13, color: "#374151", borderBottom: "1px solid #f3f4f6", verticalAlign: "middle" as const },
    overlay: { position: "fixed" as const, inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 },
    modal:   { background: "#fff", borderRadius: 16, width: "100%", maxWidth: 420, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" },
    mhdr:    { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid #e5e7eb" },
    mbody:   { padding: 20 },
    mftr:    { display: "flex", gap: 10, padding: "14px 20px", borderTop: "1px solid #e5e7eb" },
    lbl:     { fontSize: 13, fontWeight: 700, color: "#374151", display: "block", marginBottom: 5 },
    inp:     { width: "100%", padding: "9px 12px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 13, outline: "none", boxSizing: "border-box" as const, marginBottom: 12 },
    sel:     { width: "100%", padding: "9px 12px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 13, outline: "none", background: "#fff", boxSizing: "border-box" as const },
    cancelB: { flex: 1, padding: "10px 0", borderRadius: 10, border: "1px solid #e5e7eb", background: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", color: "#374151" },
    saveB:   { flex: 1, padding: "10px 0", borderRadius: 10, border: "none", background: "#2563eb", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer" },
  };

  return (
    <div style={S.page}>
      <div style={S.hdr}>
        <div>
          <h1 style={S.h1}>All Users</h1>
          <p style={S.sub}>System-wide users across all tenants</p>
        </div>
        <div style={S.srchRow}>
          <input
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSearch()}
            placeholder="Search name or email"
            style={S.srchI}
          />
          <button onClick={handleSearch} style={S.srchBtn}>Search</button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "#9ca3af" }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>⏳</div>Loading…
        </div>
      ) : sortedKeys.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "#9ca3af" }}>No users found</div>
      ) : sortedKeys.map((tenantId) => {
        const tenantUsers = grouped[tenantId];
        const tenant = tenantUsers[0]?.tenant;
        const isNoTenant = tenantId === "__no_tenant__";
        const tenantInitial = isNoTenant ? "?" : (tenant?.name?.charAt(0).toUpperCase() || "T");
        const tenantStatus = isNoTenant ? null : (tenant?.status || "unknown");

        return (
          <div key={tenantId} style={S.tenantG}>
            {/* Tenant header row */}
            <div style={S.tHead}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ ...S.tIcon, background: isNoTenant ? "#f3f4f6" : "#dbeafe", color: isNoTenant ? "#6b7280" : "#1d4ed8" }}>
                  {tenantInitial}
                </div>
                <div>
                  <div style={{ fontWeight: 800, color: "#111", fontSize: 15 }}>
                    {isNoTenant ? "No Tenant" : (tenant?.name || "Unknown Tenant")}
                  </div>
                  <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>
                    Tenant ID: {isNoTenant ? "·" : tenantId.slice(0, 8)} · {tenantUsers.length} user{tenantUsers.length !== 1 ? "s" : ""}
                  </div>
                </div>
              </div>
              {isNoTenant ? (
                <span style={{ fontSize: 12, color: "#9ca3af", fontWeight: 600 }}>N/A</span>
              ) : (
                <span style={{ display: "inline-block", padding: "3px 14px", borderRadius: 20, fontSize: 12, fontWeight: 700, background: tenantStatus === "ACTIVE" ? "#f0fdf4" : "#fef2f2", color: tenantStatus === "ACTIVE" ? "#16a34a" : "#dc2626" }}>
                  {tenantStatus?.toLowerCase()}
                </span>
              )}
            </div>

            {/* Users table */}
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={S.th}>Name</th>
                  <th style={S.th}>Email</th>
                  <th style={S.th}>Role</th>
                  <th style={S.th}>Status</th>
                  <th style={S.th}>Joined</th>
                  <th style={S.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tenantUsers.map((u: any) => {
                  const isCurrentUser = currentUser?.email === u.email;
                  const displayRole = roleLabel[u.role] || u.role.replace(/_/g, " ");
                  return (
                    <tr key={u.id} style={{ background: isCurrentUser ? "#fafeff" : undefined }}>
                      <td style={S.td}>
                        <span style={{ fontWeight: 700, color: "#111" }}>{u.name?.toUpperCase()}</span>
                      </td>
                      <td style={{ ...S.td, color: "#2563eb" }}>{u.email}</td>
                      <td style={S.td}>
                        <span style={{ color: "#374151", fontWeight: 500 }}>{displayRole}</span>
                      </td>
                      <td style={S.td}>
                        <span style={{ display: "inline-block", padding: "3px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700, background: u.isActive ? "#dcfce7" : "#fee2e2", color: u.isActive ? "#15803d" : "#dc2626" }}>
                          {u.isActive ? "Active" : "Banned"}
                        </span>
                      </td>
                      <td style={{ ...S.td, fontSize: 12, color: "#6b7280", whiteSpace: "nowrap" as const }}>
                        {new Date(u.createdAt).toLocaleString("en-GB", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false })}
                      </td>
                      <td style={S.td}>
                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                          <button onClick={() => setEditUser({ ...u })} style={{ background: "none", border: "none", color: "#2563eb", fontSize: 13, fontWeight: 700, cursor: "pointer", padding: 0 }}>Edit</button>
                          {isCurrentUser ? (
                            <span style={{ fontSize: 12, color: "#9ca3af" }}>(You)</span>
                          ) : u.role !== "SUPER_ADMIN" ? (
                            <>
                              <button onClick={() => banUser(u.id, u.isActive)} style={{ background: "none", border: "none", color: "#b45309", fontSize: 13, fontWeight: 700, cursor: "pointer", padding: 0 }}>
                                {u.isActive ? "Ban" : "Unban"}
                              </button>
                              <button onClick={() => deleteUser(u.id)} style={{ background: "none", border: "none", color: "#dc2626", fontSize: 13, fontWeight: 700, cursor: "pointer", padding: 0 }}>Delete</button>
                            </>
                          ) : null}
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
              <span style={{ fontSize: 15, fontWeight: 800, color: "#111" }}>Edit User</span>
              <button onClick={() => setEditUser(null)} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#9ca3af", lineHeight: 1 }}>×</button>
            </div>
            <div style={S.mbody}>
              <label style={S.lbl}>Name</label>
              <input value={editUser.name} onChange={e => setEditUser((p: any) => ({ ...p, name: e.target.value }))} style={S.inp} />
              <label style={S.lbl}>Role</label>
              <select value={editUser.role} onChange={e => setEditUser((p: any) => ({ ...p, role: e.target.value }))} style={S.sel}>
                <option value="CASHIER">Cashier</option>
                <option value="STORE_MANAGER">Store Manager</option>
                <option value="ACCOUNTANT">Accountant</option>
                <option value="GENERAL_MANAGER">General Manager</option>
                <option value="PRODUCTION_MANAGER">Production Manager</option>
                <option value="HR_MANAGER">HR Manager</option>
                <option value="TENANT_ADMIN">Admin</option>
                <option value="SUPER_ADMIN">Super Admin</option>
              </select>
            </div>
            <div style={S.mftr}>
              <button onClick={() => setEditUser(null)} style={S.cancelB}>Cancel</button>
              <button onClick={saveEdit} disabled={saving} style={S.saveB}>{saving ? "Saving…" : "Save"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
