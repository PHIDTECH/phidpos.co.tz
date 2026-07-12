"use client";
export const dynamic = "force-dynamic";
import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";

export default function SuperAdminTenantsPage() {
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editTenant, setEditTenant] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [plans, setPlans] = useState<any[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [tr, pr] = await Promise.all([
        fetch("/api/superadmin/tenants").then(r => r.json()),
        fetch("/api/superadmin/plans").then(r => r.json()),
      ]);
      setTenants(tr.tenants || []);
      setPlans(pr.plans || []);
    } catch { toast.error("Failed to load"); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function suspendTenant(id: string, status: string) {
    const newStatus = status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    try {
      const res = await fetch(`/api/superadmin/tenants/${id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error();
      toast.success(`Tenant ${newStatus === "ACTIVE" ? "activated" : "suspended"}`);
      load();
    } catch { toast.error("Failed"); }
  }

  async function deleteTenant(id: string) {
    if (!confirm("Delete this tenant and ALL their data permanently?")) return;
    try {
      const res = await fetch(`/api/superadmin/tenants/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Tenant deleted");
      load();
    } catch { toast.error("Failed to delete"); }
  }

  async function saveTenant() {
    if (!editTenant) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/superadmin/tenants/${editTenant.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editTenant.name, email: editTenant.email, phone: editTenant.phone, planId: editTenant.planId, status: editTenant.status }),
      });
      if (!res.ok) throw new Error();
      toast.success("Tenant updated");
      setEditTenant(null);
      load();
    } catch { toast.error("Failed to save"); }
    setSaving(false);
  }

  const S: Record<string, React.CSSProperties> = {
    page:    { padding: 24, fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" },
    h1:      { fontSize: 22, fontWeight: 800, color: "#111", margin: 0 },
    sub:     { fontSize: 13, color: "#6b7280", marginTop: 4, marginBottom: 20 },
    card:    { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" },
    th:      { padding: "11px 16px", fontSize: 12, fontWeight: 700, color: "#6b7280", textAlign: "left" as const, borderBottom: "2px solid #e5e7eb", background: "#f9fafb", textTransform: "uppercase" as const, letterSpacing: "0.04em" },
    td:      { padding: "13px 16px", fontSize: 13, color: "#374151", borderBottom: "1px solid #f3f4f6", verticalAlign: "top" as const },
    overlay: { position: "fixed" as const, inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 },
    modal:   { background: "#fff", borderRadius: 18, width: "100%", maxWidth: 460, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" },
    mhdr:    { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid #e5e7eb" },
    mbody:   { padding: 20 },
    mftr:    { display: "flex", gap: 10, padding: "14px 20px", borderTop: "1px solid #e5e7eb" },
    lbl:     { fontSize: 13, fontWeight: 700, color: "#374151", display: "block", marginBottom: 5 },
    inp:     { width: "100%", padding: "9px 12px", border: "1px solid #e5e7eb", borderRadius: 10, fontSize: 13, outline: "none", boxSizing: "border-box" as const, marginBottom: 12 },
    sel:     { width: "100%", padding: "9px 12px", border: "1px solid #e5e7eb", borderRadius: 10, fontSize: 13, outline: "none", background: "#fff", boxSizing: "border-box" as const, marginBottom: 12 },
    cancelB: { flex: 1, padding: "10px 0", borderRadius: 12, border: "1px solid #e5e7eb", background: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", color: "#374151" },
    saveB:   { flex: 1, padding: "10px 0", borderRadius: 12, border: "none", background: "#2563eb", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer" },
  };

  return (
    <div style={S.page}>
      <h1 style={S.h1}>Tenant Management</h1>
      <p style={S.sub}>Manage all tenants across the system</p>

      {loading ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "#9ca3af" }}>⏳ Inapakia…</div>
      ) : (
        <div style={S.card}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={S.th}>Name</th>
                <th style={S.th}>Slug</th>
                <th style={{ ...S.th, textAlign: "center" as const }}>Users</th>
                <th style={S.th}>Status</th>
                <th style={S.th}>Created</th>
                <th style={S.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tenants.map((t: any) => (
                <tr key={t.id}>
                  <td style={S.td}>
                    <div style={{ fontWeight: 800, color: "#111" }}>{t.name}</div>
                    <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>{t.email}</div>
                    <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 1 }}>{t.phone || ""}</div>
                  </td>
                  <td style={S.td}>
                    <code style={{ fontSize: 12, background: "#f3f4f6", padding: "2px 7px", borderRadius: 5, color: "#374151" }}>{t.slug}</code>
                  </td>
                  <td style={{ ...S.td, textAlign: "center" as const }}>
                    <div style={{ fontWeight: 700 }}>{t._count?.users ?? 0}</div>
                    <div style={{ fontSize: 11, color: "#9ca3af" }}>users</div>
                  </td>
                  <td style={S.td}>
                    <span style={{ display: "inline-block", padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700, background: t.status === "ACTIVE" ? "#dcfce7" : t.status === "TRIAL" ? "#fef9c3" : "#fee2e2", color: t.status === "ACTIVE" ? "#15803d" : t.status === "TRIAL" ? "#854d0e" : "#b91c1c" }}>
                      {t.status}
                    </span>
                  </td>
                  <td style={{ ...S.td, fontSize: 12, color: "#9ca3af" }}>
                    {new Date(t.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                  </td>
                  <td style={S.td}>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" as const }}>
                      <button onClick={() => setEditTenant({ ...t, planId: t.plan?.id || t.planId })} style={{ padding: "4px 10px", borderRadius: 7, border: "1px solid #bfdbfe", background: "#eff6ff", color: "#2563eb", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>View</button>
                      <button onClick={() => setEditTenant({ ...t, planId: t.plan?.id || t.planId })} style={{ padding: "4px 10px", borderRadius: 7, border: "1px solid #bfdbfe", background: "#eff6ff", color: "#2563eb", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Edit</button>
                      <button onClick={() => suspendTenant(t.id, t.status)} style={{ padding: "4px 10px", borderRadius: 7, border: "1px solid #fde68a", background: "#fffbeb", color: "#b45309", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                        {t.status === "ACTIVE" ? "Suspend" : "Activate"}
                      </button>
                      <button onClick={() => deleteTenant(t.id)} style={{ padding: "4px 10px", borderRadius: 7, border: "1px solid #fecaca", background: "#fef2f2", color: "#dc2626", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
              {tenants.length === 0 && (
                <tr><td colSpan={6} style={{ ...S.td, textAlign: "center" as const, padding: "40px 0", color: "#9ca3af" }}>Hakuna tenants bado</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {editTenant && (
        <div style={S.overlay}>
          <div style={S.modal}>
            <div style={S.mhdr}>
              <span style={{ fontSize: 15, fontWeight: 800, color: "#111" }}>✏ Hariri Tenant</span>
              <button onClick={() => setEditTenant(null)} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#9ca3af", lineHeight: 1 }}>×</button>
            </div>
            <div style={S.mbody}>
              <label style={S.lbl}>Jina la Biashara</label>
              <input value={editTenant.name} onChange={e => setEditTenant((p: any) => ({ ...p, name: e.target.value }))} style={S.inp} />
              <label style={S.lbl}>Barua Pepe</label>
              <input value={editTenant.email} onChange={e => setEditTenant((p: any) => ({ ...p, email: e.target.value }))} style={S.inp} />
              <label style={S.lbl}>Simu</label>
              <input value={editTenant.phone || ""} onChange={e => setEditTenant((p: any) => ({ ...p, phone: e.target.value }))} style={S.inp} />
              <label style={S.lbl}>Mpango (Plan)</label>
              <select value={editTenant.planId} onChange={e => setEditTenant((p: any) => ({ ...p, planId: e.target.value }))} style={S.sel}>
                {plans.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <label style={S.lbl}>Hali</label>
              <select value={editTenant.status} onChange={e => setEditTenant((p: any) => ({ ...p, status: e.target.value }))} style={{ ...S.sel, marginBottom: 0 }}>
                <option value="ACTIVE">ACTIVE</option>
                <option value="SUSPENDED">SUSPENDED</option>
                <option value="INACTIVE">INACTIVE</option>
              </select>
            </div>
            <div style={S.mftr}>
              <button onClick={() => setEditTenant(null)} style={S.cancelB}>Ghairi</button>
              <button onClick={saveTenant} disabled={saving} style={S.saveB}>{saving ? "Inahifadhi…" : "Hifadhi"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
