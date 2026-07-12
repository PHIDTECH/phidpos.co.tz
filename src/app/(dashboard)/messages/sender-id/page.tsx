"use client";
export const dynamic = "force-dynamic";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";

export default function TenantSenderIdPage() {
  const [senderStatus, setSenderStatus] = useState<any>(null);
  const [applySenderId, setApplySenderId] = useState("");
  const [applying, setApplying] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/messages/sender-id").then(r => r.json()).then(d => {
      setSenderStatus(d);
      setLoading(false);
    });
  }, []);

  async function applySenderIdFn() {
    if (!applySenderId.trim()) { toast.error("Weka Sender ID"); return; }
    setApplying(true);
    try {
      const res = await fetch("/api/messages/sender-id", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senderId: applySenderId }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      toast.success(d.message || "Ombi limewasilishwa kwa superadmin");
      fetch("/api/messages/sender-id").then(r => r.json()).then(d => setSenderStatus(d));
      setApplySenderId("");
    } catch (e: any) { toast.error(e.message || "Imeshindwa"); }
    setApplying(false);
  }

  const S: Record<string, React.CSSProperties> = {
    page:  { padding: 24, fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" },
    h1:    { fontSize: 22, fontWeight: 800, color: "#111", margin: 0 },
    sub:   { fontSize: 13, color: "#6b7280", marginTop: 4, marginBottom: 24 },
    card:  { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: 24, maxWidth: 540, boxShadow: "0 1px 4px rgba(0,0,0,.04)" },
    lbl:   { fontSize: 13, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6 },
    inp:   { width: "100%", padding: "10px 12px", border: "1px solid #e5e7eb", borderRadius: 10, fontSize: 13, outline: "none", boxSizing: "border-box" as const, marginBottom: 12 },
    btn:   { padding: "10px 28px", background: "#2563eb", color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer" },
  };

  return (
    <div style={S.page}>
      <h1 style={S.h1}>🆔 Sender ID</h1>
      <p style={S.sub}>Omba Sender ID yako — superadmin ataidhinisha ili uweze kutuma SMS kwa wateja</p>

      {loading ? (
        <div style={{ color: "#9ca3af" }}>⏳ Inapakia…</div>
      ) : (
        <div style={S.card}>
          {/* Current status */}
          {senderStatus?.senderId && (
            <div style={{
              padding: "16px 18px", borderRadius: 12, marginBottom: 24,
              background: senderStatus.approved ? "#f0fdf4" : "#fffbeb",
              border: `1px solid ${senderStatus.approved ? "#bbf7d0" : "#fde68a"}`,
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: senderStatus.approved ? "#15803d" : "#92400e" }}>
                {senderStatus.approved ? "✅ Sender ID Imeidhinishwa" : "⏳ Inasubiri Idhini ya Superadmin"}
              </div>
              <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 12 }}>
                <code style={{
                  fontSize: 18, fontWeight: 900, letterSpacing: "0.1em",
                  background: senderStatus.approved ? "#dcfce7" : "#fef9c3",
                  padding: "4px 14px", borderRadius: 8,
                  color: senderStatus.approved ? "#15803d" : "#92400e",
                }}>
                  {senderStatus.senderId}
                </code>
                {senderStatus.approved && (
                  <a href="/messages/send" style={{ fontSize: 13, color: "#2563eb", fontWeight: 700 }}>
                    Tuma SMS sasa →
                  </a>
                )}
              </div>
              {!senderStatus.approved && (
                <p style={{ fontSize: 12, color: "#92400e", marginTop: 10, opacity: 0.8 }}>
                  Ombi lako limepokelewa. Superadmin ataidhinisha hivi karibuni. Utapata arifa ukiwa umeidhinishwa.
                </p>
              )}
            </div>
          )}

          {/* Application form */}
          <div style={{ fontSize: 15, fontWeight: 800, color: "#111", marginBottom: 6 }}>
            {senderStatus?.senderId ? "Badilisha Sender ID" : "Omba Sender ID Mpya"}
          </div>
          <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 16 }}>
            Sender ID ni jina la kampuni yako litakaloonekana kwa wateja unapotuma SMS.
            Ni herufi kubwa tu, urefu wa hadi herufi 11.
          </p>
          <label style={S.lbl}>Sender ID (herufi kubwa, max 11)</label>
          <input
            value={applySenderId}
            onChange={e => setApplySenderId(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 11))}
            placeholder="BIASHARA"
            style={S.inp}
            maxLength={11}
          />
          <p style={{ fontSize: 12, color: "#9ca3af", marginBottom: 18 }}>
            Mfano: BIASHARA, DUKA123, FARAJA — herufi na nambari tu, bila nafasi
          </p>
          <button onClick={applySenderIdFn} disabled={applying || !applySenderId.trim()}
            style={{ ...S.btn, opacity: applySenderId.trim() ? 1 : 0.5 }}>
            {applying ? "Inawasilisha…" : "📤 Wasilisha Ombi"}
          </button>
        </div>
      )}
    </div>
  );
}
