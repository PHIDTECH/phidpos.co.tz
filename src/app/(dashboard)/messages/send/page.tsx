"use client";
export const dynamic = "force-dynamic";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";

export default function TenantSendSmsPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [senderStatus, setSenderStatus] = useState<any>(null);
  const [singlePhone, setSinglePhone] = useState("");

  useEffect(() => {
    fetch("/api/customers").then(r => r.json()).then(d => setCustomers(d.customers || []));
    fetch("/api/messages/sender-id").then(r => r.json()).then(d => setSenderStatus(d));
  }, []);

  function toggleCustomer(id: string) {
    setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  }

  async function sendSms() {
    if (!message.trim()) { toast.error("Andika ujumbe"); return; }
    if (!senderStatus?.approved) { toast.error("Sender ID haijaidhinishwa bado"); return; }
    setSending(true);
    try {
      const body: any = { message };
      if (singlePhone) body.phone = singlePhone;
      else if (selected.length) body.customerIds = selected;
      else body.customerIds = customers.map((c: any) => c.id);
      const res = await fetch("/api/messages", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      toast.success(`Imetumwa: ${d.sent || 1}`);
      setMessage(""); setSelected([]); setSinglePhone("");
    } catch (e: any) { toast.error(e.message || "Imeshindwa kutuma"); }
    setSending(false);
  }

  const S: Record<string, React.CSSProperties> = {
    page:  { padding: 24, fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" },
    h1:    { fontSize: 22, fontWeight: 800, color: "#111", margin: 0 },
    sub:   { fontSize: 13, color: "#6b7280", marginTop: 4, marginBottom: 20 },
    grid:  { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 },
    card:  { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: 20, boxShadow: "0 1px 4px rgba(0,0,0,.04)" },
    lbl:   { fontSize: 13, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6 },
    inp:   { width: "100%", padding: "9px 12px", border: "1px solid #e5e7eb", borderRadius: 10, fontSize: 13, outline: "none", boxSizing: "border-box" as const, marginBottom: 12 },
    ta:    { width: "100%", padding: "10px 12px", border: "1px solid #e5e7eb", borderRadius: 10, fontSize: 13, outline: "none", resize: "vertical" as const, minHeight: 110, boxSizing: "border-box" as const },
    btn:   { padding: "10px 28px", background: "#2563eb", color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer", marginTop: 14 },
    alertG:{ padding: "12px 16px", borderRadius: 12, border: "1px solid #bbf7d0", background: "#f0fdf4", marginBottom: 16 },
    alertR:{ padding: "12px 16px", borderRadius: 12, border: "1px solid #fecaca", background: "#fef2f2", marginBottom: 16 },
    alertY:{ padding: "12px 16px", borderRadius: 12, border: "1px solid #fde68a", background: "#fffbeb", marginBottom: 16 },
  };

  return (
    <div style={S.page}>
      <h1 style={S.h1}>📤 Tuma SMS</h1>
      <p style={S.sub}>Tuma ujumbe kwa wateja wako kupitia Beem Africa</p>

      {senderStatus && (
        senderStatus.approved
          ? <div style={S.alertG}><strong style={{ color: "#15803d" }}>✅ Sender ID:</strong><code style={{ marginLeft: 8, background: "#dcfce7", padding: "2px 8px", borderRadius: 5, color: "#15803d", fontWeight: 700 }}>{senderStatus.senderId}</code></div>
          : senderStatus.senderId
            ? <div style={S.alertY}><strong style={{ color: "#92400e" }}>⏳ Inasubiri Idhini:</strong><span style={{ marginLeft: 8, color: "#92400e" }}>"{senderStatus.senderId}" inasubiri idhini ya superadmin</span></div>
            : <div style={S.alertR}><strong style={{ color: "#b91c1c" }}>⚠ Sender ID Haijawekwa:</strong><a href="/messages/sender-id" style={{ marginLeft: 8, color: "#b91c1c", fontWeight: 700 }}>Omba Sender ID →</a></div>
      )}

      <div style={S.grid}>
        <div style={S.card}>
          <label style={S.lbl}>Tuma kwa Nambari Moja (Hiari)</label>
          <input value={singlePhone} onChange={e => setSinglePhone(e.target.value)} placeholder="+255700000000" style={S.inp} />
          <label style={S.lbl}>Au Chagua Wateja</label>
          <div style={{ maxHeight: 300, overflowY: "auto", border: "1px solid #e5e7eb", borderRadius: 10, padding: 8 }}>
            {customers.map((c: any) => (
              <label key={c.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 6px", borderRadius: 8, cursor: "pointer", background: selected.includes(c.id) ? "#eff6ff" : "transparent" }}>
                <input type="checkbox" checked={selected.includes(c.id)} onChange={() => toggleCustomer(c.id)} style={{ accentColor: "#2563eb" }} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#111" }}>{c.name}</div>
                  <div style={{ fontSize: 11, color: "#9ca3af" }}>{c.phone || "Hakuna simu"}</div>
                </div>
              </label>
            ))}
            {customers.length === 0 && <div style={{ padding: "20px 0", textAlign: "center" as const, color: "#9ca3af", fontSize: 13 }}>Hakuna wateja</div>}
          </div>
          <div style={{ marginTop: 8, fontSize: 12, color: "#6b7280" }}>
            {singlePhone ? "Itatuma kwa nambari moja" : selected.length ? `${selected.length} wamechaguliwa` : "Wote watachaguliwa"}
          </div>
        </div>

        <div style={S.card}>
          <label style={S.lbl}>Ujumbe *</label>
          <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Andika ujumbe hapa…" style={S.ta} />
          <div style={{ fontSize: 12, color: message.length > 160 ? "#dc2626" : "#9ca3af", marginTop: 4 }}>{message.length}/160 chars</div>
          {senderStatus?.approved && (
            <div style={{ marginTop: 12, padding: "10px 14px", background: "#f0fdf4", borderRadius: 10, border: "1px solid #bbf7d0" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#15803d" }}>📡 Sender ID: {senderStatus.senderId}</div>
              <div style={{ fontSize: 11, color: "#16a34a", marginTop: 2 }}>Powered by Beem Africa</div>
            </div>
          )}
          <button onClick={sendSms} disabled={sending || !senderStatus?.approved}
            style={{ ...S.btn, opacity: senderStatus?.approved ? 1 : 0.5 }}>
            {sending ? "Inatuma…" : "📤 Tuma Ujumbe"}
          </button>
        </div>
      </div>
    </div>
  );
}
