"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    shopName: "", name: "", email: "", password: "", confirmPassword: "", phone: "", address: "",
  });

  function set(key: string, val: string) { setForm(f => ({ ...f, [key]: val })); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirmPassword) { setError("Nywila hazifanani."); return; }
    if (form.password.length < 8) { setError("Nywila iwe na herufi 8 au zaidi."); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shopName: form.shopName, name: form.name, email: form.email, password: form.password, phone: form.phone, address: form.address }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Hitilafu imetokea."); return; }
      router.push("/login?registered=1");
    } catch {
      setError("Hitilafu imetokea. Jaribu tena.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f3f4f6; }
        .navbar { position: fixed; top: 0; left: 0; right: 0; z-index: 100; background: #fff; border-bottom: 1px solid #e5e7eb; box-shadow: 0 1px 4px rgba(0,0,0,0.08); }
        .navbar-inner { max-width: 1200px; margin: 0 auto; padding: 0 24px; height: 64px; display: flex; align-items: center; justify-content: space-between; }
        .logo { display: flex; align-items: center; gap: 10px; text-decoration: none; }
        .logo-icon { width: 36px; height: 36px; background: #2563eb; border-radius: 8px; display: flex; align-items: center; justify-content: center; }
        .logo-text { font-size: 20px; font-weight: 800; color: #111; }
        .btn-outline { padding: 8px 18px; border-radius: 8px; font-size: 14px; font-weight: 600; color: #374151; border: 1px solid #d1d5db; background: #fff; text-decoration: none; display: inline-block; }
        .btn-blue { padding: 8px 18px; border-radius: 8px; font-size: 14px; font-weight: 600; color: #fff; background: #2563eb; text-decoration: none; display: inline-block; }
        .page { min-height: 100vh; padding: 80px 16px 40px; display: flex; align-items: flex-start; justify-content: center; background: #f3f4f6; }
        .card { background: #fff; border-radius: 16px; box-shadow: 0 4px 24px rgba(0,0,0,0.08); padding: 40px; width: 100%; max-width: 520px; }
        .card-title { font-size: 24px; font-weight: 800; color: #111; text-align: center; margin-bottom: 6px; }
        .card-sub { font-size: 14px; color: #6b7280; text-align: center; margin-bottom: 28px; }
        .card-sub span { color: #2563eb; font-weight: 600; }
        .section-label { font-size: 11px; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 12px; margin-top: 20px; }
        .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        .field { margin-bottom: 14px; }
        .field label { display: block; font-size: 13px; font-weight: 600; color: #374151; margin-bottom: 5px; }
        .field input { width: 100%; padding: 11px 14px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; color: #111; outline: none; }
        .field input:focus { border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,0.1); }
        .btn-submit { width: 100%; padding: 13px; border-radius: 8px; font-size: 15px; font-weight: 700; color: #fff; background: #2563eb; border: none; cursor: pointer; margin-top: 8px; }
        .btn-submit:disabled { background: #93c5fd; cursor: not-allowed; }
        .error-box { background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 10px 14px; font-size: 13px; color: #dc2626; margin-bottom: 16px; }
        .signin-row { text-align: center; margin-top: 20px; font-size: 13px; color: #6b7280; }
        .signin-row a { color: #2563eb; font-weight: 600; text-decoration: none; }
        @media (max-width: 480px) { .card { padding: 28px 16px; } .grid2 { grid-template-columns: 1fr; } }
      `}</style>

      <nav className="navbar">
        <div className="navbar-inner">
          <a href="/" className="logo">
            <div className="logo-icon">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="2">
                <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-1.5 6M17 13l1.5 6M9 19a1 1 0 100 2 1 1 0 000-2zm8 0a1 1 0 100 2 1 1 0 000-2z"/>
              </svg>
            </div>
            <span className="logo-text">PhidPOS</span>
          </a>
          <div style={{display:"flex",gap:"12px"}}>
            <a href="/" className="btn-outline">Nyumbani</a>
            <a href="/login" className="btn-blue">Ingia</a>
          </div>
        </div>
      </nav>

      <div className="page">
        <div className="card">
          <h1 className="card-title">Sajili Biashara Yako</h1>
          <p className="card-sub">Anza jaribio bure la siku 14 na <span>PhidPOS</span></p>

          {error && <div className="error-box">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="section-label">Taarifa za Duka</div>
            <div className="field">
              <label>Jina la Duka / Biashara *</label>
              <input type="text" value={form.shopName} onChange={e => set("shopName", e.target.value)} required placeholder="Mfano: Kilimanjaro Shop" />
            </div>
            <div className="grid2">
              <div className="field">
                <label>Simu</label>
                <input type="tel" value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="+255700000000" />
              </div>
              <div className="field">
                <label>Anwani</label>
                <input type="text" value={form.address} onChange={e => set("address", e.target.value)} placeholder="Dar es Salaam" />
              </div>
            </div>

            <div className="section-label">Taarifa za Msimamizi</div>
            <div className="field">
              <label>Jina Lako Kamili *</label>
              <input type="text" value={form.name} onChange={e => set("name", e.target.value)} required placeholder="Jina la msimamizi" />
            </div>
            <div className="field">
              <label>Barua Pepe *</label>
              <input type="email" value={form.email} onChange={e => set("email", e.target.value)} required placeholder="email@biashara.com" />
            </div>
            <div className="grid2">
              <div className="field">
                <label>Nywila *</label>
                <input type="password" value={form.password} onChange={e => set("password", e.target.value)} required placeholder="Herufi 8 au zaidi" />
              </div>
              <div className="field">
                <label>Thibitisha Nywila *</label>
                <input type="password" value={form.confirmPassword} onChange={e => set("confirmPassword", e.target.value)} required placeholder="Rudia nywila" />
              </div>
            </div>

            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? "Inasajili..." : "Sajili Bure →"}
            </button>
          </form>

          <div className="signin-row">
            Una akaunti tayari? <a href="/login">Ingia hapa</a>
          </div>
        </div>
      </div>
    </>
  );
}
