export default function TermsPage() {
  return (
    <div style={{ maxWidth: 800, margin: "60px auto", padding: "0 24px", fontFamily: "sans-serif" }}>
      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Masharti na Vigezo</h1>
      <p style={{ color: "#6b7280", marginBottom: 32 }}>Terms and Conditions — PhidPOS</p>
      <p style={{ lineHeight: 1.8, color: "#374151" }}>
        Kwa kutumia PhidPOS, unakubali masharti na vigezo vyetu. Tafadhali wasiliana nasi kwa maelezo zaidi.
      </p>
      <p style={{ marginTop: 24 }}>
        <a href="/login" style={{ color: "#2563eb" }}>← Rudi kwenye ukurasa wa kuingia</a>
      </p>
    </div>
  );
}
