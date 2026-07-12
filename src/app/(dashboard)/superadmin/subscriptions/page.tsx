"use client";
export const dynamic = "force-dynamic";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";

const STATUS_OPTIONS = ["ACTIVE", "TRIAL", "SUSPENDED", "EXPIRED", "CANCELLED"];

export default function SuperAdminSubscriptionsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    tenantId: "",
    planId: "",
    status: "ACTIVE",
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    notes: "",
  });

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/superadmin/subscriptions");
      if (res.ok) setData(await res.json());
      else toast.error("Failed to load");
    } catch { toast.error("Error loading data"); }
    setLoading(false);
  }

  async function save() {
    if (!form.tenantId) { toast.error("Select a tenant"); return; }
    if (!form.planId) { toast.error("Select a plan"); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/superadmin/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      toast.success("Subscription updated successfully");
      setForm(p => ({ ...p, tenantId: "", notes: "" }));
      load();
    } catch (e: any) { toast.error(e.message || "Failed to save"); }
    setSaving(false);
  }

  const statusColor: Record<string, [string, string]> = {
    ACTIVE:    ["#f0fdf4", "#16a34a"],
    TRIAL:     ["#fffbeb", "#b45309"],
    SUSPENDED: ["#fef2f2", "#dc2626"],
    EXPIRED:   ["#f3f4f6", "#6b7280"],
    CANCELLED: ["#fef2f2", "#dc2626"],
  };

  const S: Record<string, React.CSSProperties> = {
    page:   { padding: 24, fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif", maxWidth: 1100 },
    h1:     { fontSize: 22, fontWeight: 800, color: "#111", margin: 0 },
    sub:    { fontSize: 13, color: "#6b7280", marginTop: 4, marginBottom: 20 },
    formCard: { background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 14, padding: "18px 20px", marginBottom: 24 },
    fh:     { fontSize: 14, fontWeight: 800, color: "#1d4ed8", marginBottom: 14 },
    row:    { display: "flex", gap: 12, flexWrap: "wrap" as const, alignItems: "flex-end" },
    field:  { display: "flex", flexDirection: "column" as const, gap: 4 },
    lbl:    { fontSize: 11, fontWeight: 700, color: "#374151", textTransform: "uppercase" as const, letterSpacing: "0.05em" },
    sel:    { padding: "9px 12px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 13, background: "#fff", outline: "none", minWidth: 160 },
    inp:    { padding: "9px 12px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 13, background: "#fff", outline: "none" },
    saveB:  { padding: "10px 24px", background: "#2563eb", color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" as const, alignSelf: "flex-end" as const },
    tblW:   { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" },
    th:     { padding: "11px 14px", fontSize: 11, fontWeight: 700, color: "#9ca3af", textAlign: "left" as const, textTransform: "uppercase" as const, borderBottom: "2px solid #e5e7eb", background: "#f9fafb", letterSpacing: "0.05em" },
    td:     { padding: "13px 14px", fontSize: 13, color: "#374151", borderBottom: "1px solid #f3f4f6", verticalAlign: "middle" as const },
  };

  return (
    <div style={S.page}>
      <h1 style={S.h1}>Tenant Subscriptions</h1>
      <p style={S.sub}>Manually update or create subscriptions for tenants (cash payment, Selcom failure recovery, etc.)</p>

      {/* Form */}
      <div style={S.formCard}>
        <div style={S.fh}>Update/Create Tenant Subscription (Manual Payment)</div>
        <div style={S.row}>
          <div style={S.field}>
            <label style={S.lbl}>Tenant</label>
            <select value={form.tenantId} onChange={e => setForm(p => ({ ...p, tenantId: e.target.value }))} style={{ ...S.sel, minWidth: 200 }}>
              <option value="">Select Tenant</option>
              {(data?.tenants || []).map((t: any) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          <div style={S.field}>
            <label style={S.lbl}>Plan</label>
            <select value={form.planId} onChange={e => setForm(p => ({ ...p, planId: e.target.value }))} style={{ ...S.sel, minWidth: 200 }}>
              <option value="">Select Plan</option>
              {(data?.plans || []).map((p: any) => (
                <option key={p.id} value={p.id}>{p.name} (TZS {Number(p.monthlyPrice).toLocaleString()})</option>
              ))}
            </select>
          </div>

          <div style={S.field}>
            <label style={S.lbl}>Status</label>
            <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))} style={S.sel}>
              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div style={S.field}>
            <label style={S.lbl}>Valid Until</label>
            <input
              type="date"
              value={form.endDate}
              onChange={e => setForm(p => ({ ...p, endDate: e.target.value }))}
              style={S.inp}
            />
          </div>

          <div style={{ ...S.field, flex: 1, minWidth: 160 }}>
            <label style={S.lbl}>Notes</label>
            <input
              value={form.notes}
              onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
              placeholder="e.g., Cash payment"
              style={{ ...S.inp, width: "100%" }}
            />
          </div>

          <button onClick={save} disabled={saving} style={S.saveB}>
            {saving ? "Saving…" : "Update Subscription"}
          </button>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "#9ca3af" }}>⏳ Loading…</div>
      ) : (
        <div style={S.tblW}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={S.th}>Tenant</th>
                <th style={S.th}>Plan</th>
                <th style={S.th}>Status</th>
                <th style={S.th}>Start Date</th>
                <th style={S.th}>End Date</th>
                <th style={S.th}>Created</th>
              </tr>
            </thead>
            <tbody>
              {(data?.subscriptions || []).map((s: any) => {
                const [sbg, sclr] = statusColor[s.status] || ["#f3f4f6", "#374151"];
                return (
                  <tr key={s.id} style={{ cursor: "pointer" }} onClick={() => {
                    setForm({
                      tenantId: s.tenantId,
                      planId: s.planId,
                      status: s.status,
                      endDate: new Date(s.endDate).toISOString().slice(0, 10),
                      notes: "",
                    });
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}>
                    <td style={S.td}>
                      <div style={{ fontWeight: 700, color: "#1d4ed8" }}>{s.tenant?.name || "—"}</div>
                      <div style={{ fontSize: 11, color: "#9ca3af" }}>{s.tenant?.email}</div>
                    </td>
                    <td style={{ ...S.td, color: "#7c3aed", fontWeight: 600 }}>{s.plan?.name || "—"}</td>
                    <td style={S.td}>
                      <span style={{ display: "inline-block", padding: "3px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700, background: sbg, color: sclr }}>
                        {s.status}
                      </span>
                    </td>
                    <td style={{ ...S.td, color: "#6b7280", fontSize: 12 }}>
                      {new Date(s.startDate).toLocaleDateString("en-GB")}
                    </td>
                    <td style={{ ...S.td, color: "#6b7280", fontSize: 12 }}>
                      {new Date(s.endDate).toLocaleDateString("en-GB")}
                    </td>
                    <td style={{ ...S.td, color: "#9ca3af", fontSize: 12 }}>
                      {new Date(s.createdAt).toLocaleString("en-GB", { day:"2-digit", month:"2-digit", year:"numeric", hour:"2-digit", minute:"2-digit" })}
                    </td>
                  </tr>
                );
              })}
              {(data?.subscriptions || []).length === 0 && (
                <tr><td colSpan={6} style={{ ...S.td, textAlign: "center" as const, padding: "40px 0", color: "#9ca3af" }}>No subscriptions yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
