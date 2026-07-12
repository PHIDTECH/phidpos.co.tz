"use client";
export const dynamic = "force-dynamic";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";

const PLANS = [
  {
    key: "STARTER", name: "Starter", price: 30000, billingMonths: 12,
    billingLabel: "Lipa miezi 12 (kwa mwaka)", popular: false,
    color: "#2563eb", bg: "#eff6ff",
    features: ["Duka 1", "Watumiaji 2", "Mauzo ya POS", "Bidhaa", "Ripoti za Msingi", "Wateja 100"],
  },
  {
    key: "BUSINESS", name: "Business", price: 50000, billingMonths: 3,
    billingLabel: "Lipa miezi 3", popular: true,
    color: "#7c3aed", bg: "#f5f3ff",
    features: ["Maduka 2", "Watumiaji 5", "Mauzo ya POS", "Bidhaa", "Ripoti za Kina", "Wasambazaji", "Manunuzi"],
  },
  {
    key: "PROFESSIONAL", name: "Professional", price: 70000, billingMonths: 1,
    billingLabel: "Lipa kila mwezi", popular: false,
    color: "#059669", bg: "#ecfdf5",
    features: ["Maduka yote", "Watumiaji wasio na kikomo", "Ripoti Zote", "Uhasibu Kamili", "SMS & Barua Pepe", "Priority Support"],
  },
];

export default function SubscriptionPage() {
  const sessionData = useSession();
  const [subscription, setSubscription] = useState<any>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [payModal, setPayModal] = useState<any>(null);
  const [phone, setPhone] = useState("");
  const [paying, setPaying] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const [sr, pr] = await Promise.all([
        fetch("/api/subscription").then(r => r.json()),
        fetch("/api/superadmin/plans").then(r => r.json()).catch(() => ({ plans: [] })),
      ]);
      setSubscription(sr.subscription || null);
      setPlans(pr.plans || []);
    } catch {}
    setLoading(false);
  }

  async function payWithSelcom() {
    if (!phone || phone.length < 10) { toast.error("Weka namba ya simu sahihi"); return; }
    if (!payModal) return;
    setPaying(true);
    try {
      const dbPlan = plans.find((p: any) => p.type === payModal.key);
      if (!dbPlan) { toast.error("Plan haipo. Wasiliana na msaada."); setPaying(false); return; }

      const res = await fetch("/api/subscription/selcom-pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: dbPlan.id,
          billingMonths: payModal.billingMonths,
          phone,
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Imeshindwa");
      toast.success("Ombi limetumwa! Angalia simu yako uweke PIN ili kuthibitisha malipo.");
      setPayModal(null);
      setPhone("");
      setTimeout(load, 4000);
    } catch (e: any) { toast.error(e.message || "Imeshindwa kulipa"); }
    setPaying(false);
  }

  const S: Record<string, React.CSSProperties> = {
    page:   { padding: 24, fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" },
    h1:     { fontSize: 22, fontWeight: 800, color: "#111", margin: 0 },
    sub:    { fontSize: 13, color: "#6b7280", marginTop: 4, marginBottom: 24 },
    banner: { background: "linear-gradient(135deg,#2563eb,#4f46e5)", borderRadius: 16, padding: "20px 24px", color: "#fff", marginBottom: 24, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" as const, gap: 12 },
    grid:   { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 20 },
    card:   { background: "#fff", border: "2px solid #e5e7eb", borderRadius: 16, padding: "24px 20px", display: "flex", flexDirection: "column" as const, position: "relative" as const, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" },
    overlay:{ position: "fixed" as const, inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 },
    modal:  { background: "#fff", borderRadius: 18, width: "100%", maxWidth: 420, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" },
    mhdr:   { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid #e5e7eb" },
    mbody:  { padding: 20 },
    mftr:   { display: "flex", gap: 10, padding: "14px 20px", borderTop: "1px solid #e5e7eb" },
    lbl:    { fontSize: 13, fontWeight: 700, color: "#374151", display: "block", marginBottom: 5 },
    inp:    { width: "100%", padding: "10px 12px", border: "1px solid #e5e7eb", borderRadius: 10, fontSize: 13, outline: "none", boxSizing: "border-box" as const, marginBottom: 4 },
    cancelB:{ flex: 1, padding: "10px 0", borderRadius: 12, border: "1px solid #e5e7eb", background: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", color: "#374151" },
    payB:   { flex: 1, padding: "10px 0", borderRadius: 12, border: "none", background: "#16a34a", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer" },
  };

  return (
    <div style={S.page}>
      <h1 style={S.h1}>Subscription & Plans</h1>
      <p style={S.sub}>Manage your subscription and pay via Selcom mobile money</p>

      {/* Current plan banner */}
      {subscription && (
        <div style={S.banner}>
          <div>
            <div style={{ fontSize: 12, opacity: 0.8 }}>Current Plan</div>
            <div style={{ fontSize: 22, fontWeight: 900 }}>{subscription.plan?.name || "—"}</div>
            <div style={{ fontSize: 12, opacity: 0.75, marginTop: 4 }}>
              Expires: {new Date(subscription.endDate).toLocaleDateString("en-GB")}
            </div>
          </div>
          <div style={{ textAlign: "right" as const }}>
            <span style={{ padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 800, background: subscription.status === "ACTIVE" ? "rgba(74,222,128,0.2)" : "rgba(248,113,113,0.2)", color: subscription.status === "ACTIVE" ? "#86efac" : "#fca5a5" }}>
              {subscription.status}
            </span>
            <div style={{ fontSize: 12, opacity: 0.8, marginTop: 8 }}>TZS {Number(subscription.amount).toLocaleString()} paid</div>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "#9ca3af" }}>⏳ Inapakia…</div>
      ) : (
        <div style={S.grid}>
          {PLANS.map(plan => {
            const total = plan.price * plan.billingMonths;
            const isCurrent = subscription?.plan?.name === plan.name || subscription?.plan?.type === plan.key;
            return (
              <div key={plan.key} style={{ ...S.card, borderColor: plan.popular ? plan.color : "#e5e7eb" }}>
                {plan.popular && (
                  <div style={{ position: "absolute", top: -14, left: "50%", transform: "translateX(-50%)", background: plan.color, color: "#fff", fontSize: 11, fontWeight: 800, padding: "4px 14px", borderRadius: 999 }}>
                    Most Popular
                  </div>
                )}
                <div style={{ fontSize: 18, fontWeight: 900, color: "#111", marginBottom: 4 }}>{plan.name}</div>
                <div style={{ fontSize: 12, color: plan.color, fontWeight: 600, marginBottom: 14 }}>{plan.billingLabel}</div>
                <div style={{ marginBottom: 6 }}>
                  <span style={{ fontSize: 30, fontWeight: 900, color: "#111" }}>TZS {plan.price.toLocaleString()}</span>
                  <span style={{ fontSize: 13, color: "#6b7280" }}>/mwezi</span>
                </div>
                <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 18 }}>
                  Jumla: <strong>TZS {total.toLocaleString()}</strong> kwa miezi {plan.billingMonths}
                </div>
                <ul style={{ listStyle: "none", padding: 0, margin: "0 0 20px", flex: 1 }}>
                  {plan.features.map((f, i) => (
                    <li key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#374151", padding: "5px 0", borderBottom: "1px solid #f9fafb" }}>
                      <span style={{ color: "#16a34a", fontWeight: 900 }}>✓</span> {f}
                    </li>
                  ))}
                </ul>
                {isCurrent ? (
                  <div style={{ textAlign: "center" as const, padding: "10px", borderRadius: 10, background: "#f0fdf4", color: "#16a34a", fontWeight: 700, fontSize: 13 }}>
                    ✓ Mpango Wako wa Sasa
                  </div>
                ) : (
                  <button
                    onClick={() => setPayModal(plan)}
                    style={{ padding: "12px", borderRadius: 10, border: "none", background: plan.color, color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer", width: "100%" }}
                  >
                    Lipa na Selcom →
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Payment Modal */}
      {payModal && (
        <div style={S.overlay}>
          <div style={S.modal}>
            <div style={S.mhdr}>
              <span style={{ fontSize: 15, fontWeight: 800, color: "#111" }}>💳 Lipa kwa Selcom</span>
              <button onClick={() => setPayModal(null)} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#9ca3af" }}>×</button>
            </div>
            <div style={S.mbody}>
              <div style={{ background: "#f9fafb", borderRadius: 10, padding: "12px 16px", marginBottom: 16 }}>
                <div style={{ fontSize: 13, color: "#6b7280" }}>Mpango</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: "#111" }}>{payModal.name}</div>
                <div style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}>{payModal.billingLabel}</div>
                <div style={{ fontSize: 18, fontWeight: 900, color: "#2563eb", marginTop: 4 }}>
                  TZS {(payModal.price * payModal.billingMonths).toLocaleString()}
                </div>
              </div>
              <label style={S.lbl}>Namba ya Simu (Selcom/M-Pesa) *</label>
              <input
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+255 7XX XXX XXX"
                style={S.inp}
              />
              <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 16 }}>
                Utapata ombi la USSD kwenye simu yako. Weka PIN yako ili kuthibitisha malipo.
              </div>
              <div style={{ fontSize: 12, color: "#9ca3af", background: "#f9fafb", borderRadius: 8, padding: "8px 12px" }}>
                Inakubaliwa: Selcom, M-Pesa, Tigo Pesa, Airtel Money
              </div>
            </div>
            <div style={S.mftr}>
              <button onClick={() => setPayModal(null)} style={S.cancelB}>Ghairi</button>
              <button onClick={payWithSelcom} disabled={paying} style={S.payB}>
                {paying ? "Inatuma…" : "Tuma Ombi la Malipo"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
