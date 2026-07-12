"use client";
export const dynamic = "force-dynamic";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";

export default function SuperAdminSettingsPage() {
  const [config, setConfig] = useState({ vendorId: "", apiKey: "", apiSecret: "", environment: "production" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSecret, setShowSecret] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/superadmin/selcom-config");
      if (res.ok) {
        const d = await res.json();
        if (d.config) setConfig({ ...d.config, apiSecret: "" });
      }
    } catch {}
    setLoading(false);
  }

  async function save() {
    if (!config.vendorId || !config.apiKey || !config.apiSecret) {
      toast.error("All fields required"); return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/superadmin/selcom-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      toast.success("Selcom credentials saved");
      load();
    } catch (e: any) { toast.error(e.message || "Failed to save"); }
    setSaving(false);
  }

  const S: Record<string, React.CSSProperties> = {
    page:  { padding: 24, fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif", maxWidth: 720 },
    h1:    { fontSize: 22, fontWeight: 800, color: "#111", margin: 0 },
    sub:   { fontSize: 13, color: "#6b7280", marginTop: 4, marginBottom: 24 },
    card:  { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: 24, boxShadow: "0 1px 4px rgba(0,0,0,0.04)", marginBottom: 20 },
    sh:    { fontSize: 15, fontWeight: 800, color: "#111", marginBottom: 4 },
    sdesc: { fontSize: 13, color: "#6b7280", marginBottom: 20 },
    lbl:   { fontSize: 13, fontWeight: 700, color: "#374151", display: "block", marginBottom: 5 },
    inp:   { width: "100%", padding: "10px 12px", border: "1px solid #e5e7eb", borderRadius: 10, fontSize: 13, outline: "none", boxSizing: "border-box" as const, marginBottom: 14 },
    sel:   { width: "100%", padding: "10px 12px", border: "1px solid #e5e7eb", borderRadius: 10, fontSize: 13, outline: "none", background: "#fff", boxSizing: "border-box" as const, marginBottom: 14 },
    saveB: { padding: "11px 28px", background: "#2563eb", color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer" },
    info:  { padding: "12px 16px", background: "#f0f9ff", borderRadius: 10, border: "1px solid #bae6fd", fontSize: 13, color: "#0369a1", marginBottom: 20 },
    row:   { position: "relative" as const },
    eye:   { position: "absolute" as const, right: 12, top: 10, cursor: "pointer", color: "#9ca3af", fontSize: 13, fontWeight: 600, background: "none", border: "none" },
  };

  return (
    <div style={S.page}>
      <h1 style={S.h1}>Superadmin Settings</h1>
      <p style={S.sub}>Configure payment gateway and system credentials</p>

      <div style={S.card}>
        <div style={S.sh}>Selcom Payment Gateway</div>
        <div style={S.sdesc}>Configure Selcom API credentials to enable mobile money payments (USSD Push) from tenants.</div>

        <div style={S.info}>
          <strong>How to get credentials:</strong><br />
          1. Register at <a href="https://developer.selcom.co.tz" target="_blank" style={{ color: "#2563eb" }}>developer.selcom.co.tz</a><br />
          2. Create a merchant account and get your Vendor ID, API Key, and API Secret<br />
          3. Use <strong>Sandbox</strong> for testing, <strong>Production</strong> for live payments
        </div>

        {loading ? (
          <div style={{ color: "#9ca3af", fontSize: 13 }}>Loading…</div>
        ) : (
          <>
            <label style={S.lbl}>Vendor ID *</label>
            <input
              value={config.vendorId}
              onChange={e => setConfig(p => ({ ...p, vendorId: e.target.value }))}
              placeholder="e.g. PHIDPOS"
              style={S.inp}
            />

            <label style={S.lbl}>API Key *</label>
            <input
              value={config.apiKey}
              onChange={e => setConfig(p => ({ ...p, apiKey: e.target.value }))}
              placeholder="Your Selcom API Key"
              style={S.inp}
            />

            <label style={S.lbl}>API Secret *</label>
            <div style={S.row}>
              <input
                type={showSecret ? "text" : "password"}
                value={config.apiSecret}
                onChange={e => setConfig(p => ({ ...p, apiSecret: e.target.value }))}
                placeholder="Enter API Secret (leave blank to keep existing)"
                style={{ ...S.inp, paddingRight: 60 }}
              />
              <button onClick={() => setShowSecret(p => !p)} style={S.eye}>
                {showSecret ? "Hide" : "Show"}
              </button>
            </div>

            <label style={S.lbl}>Environment *</label>
            <select value={config.environment} onChange={e => setConfig(p => ({ ...p, environment: e.target.value }))} style={S.sel}>
              <option value="production">Production (Live)</option>
              <option value="sandbox">Sandbox (Test)</option>
            </select>

            <button onClick={save} disabled={saving} style={S.saveB}>
              {saving ? "Saving…" : "Save Credentials"}
            </button>
          </>
        )}
      </div>

      <div style={S.card}>
        <div style={S.sh}>Selcom USSD Push Flow</div>
        <div style={S.sdesc}>How tenant subscription payments work:</div>
        <ol style={{ fontSize: 13, color: "#374151", lineHeight: 2, paddingLeft: 20 }}>
          <li>Tenant selects a plan and billing period in their Subscription page</li>
          <li>Tenant enters their Selcom/M-Pesa phone number</li>
          <li>System sends a USSD push request to Selcom API</li>
          <li>Tenant receives a USSD prompt on their phone and enters PIN</li>
          <li>Selcom confirms payment and subscription is activated</li>
          <li>Revenue is recorded in Superadmin → Accounts</li>
        </ol>
      </div>
    </div>
  );
}
