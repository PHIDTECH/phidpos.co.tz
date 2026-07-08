"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      // Fetch CSRF token first (required by NextAuth v5)
      const csrfRes = await fetch("/api/auth/csrf");
      const { csrfToken } = await csrfRes.json();

      const formData = new URLSearchParams();
      formData.append("email", email);
      formData.append("password", password);
      formData.append("csrfToken", csrfToken);
      formData.append("callbackUrl", "/dashboard");
      formData.append("json", "true");

      const res = await fetch("/api/auth/callback/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formData.toString(),
        redirect: "manual",
      });

      // Check if login succeeded by fetching session
      const sessionRes = await fetch("/api/auth/session");
      const session = await sessionRes.json();
      const role = (session?.user as any)?.role;

      if (role) {
        if (role === "SUPER_ADMIN") {
          window.location.href = "/superadmin";
        } else {
          window.location.href = "/dashboard";
        }
      } else {
        // Try with signIn as fallback
        const result = await signIn("credentials", { email, password, redirect: false });
        if (!result || !result.ok) {
          setError("Barua pepe au nywila si sahihi.");
        } else {
          const s2 = await fetch("/api/auth/session");
          const sess2 = await s2.json();
          const r2 = (sess2?.user as any)?.role;
          window.location.href = r2 === "SUPER_ADMIN" ? "/superadmin" : "/dashboard";
        }
      }
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
        .navbar {
          position: fixed; top: 0; left: 0; right: 0; z-index: 100;
          background: #fff; border-bottom: 1px solid #e5e7eb;
          box-shadow: 0 1px 4px rgba(0,0,0,0.08);
        }
        .navbar-inner {
          max-width: 1200px; margin: 0 auto; padding: 0 24px;
          height: 64px; display: flex; align-items: center; justify-content: space-between;
        }
        .logo { display: flex; align-items: center; gap: 10px; text-decoration: none; }
        .logo-icon {
          width: 36px; height: 36px; background: #2563eb; border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
        }
        .logo-text { font-size: 20px; font-weight: 800; color: #111; }
        .nav-links { display: flex; gap: 32px; }
        .nav-links a { font-size: 14px; font-weight: 500; color: #4b5563; text-decoration: none; }
        .nav-actions { display: flex; gap: 12px; align-items: center; }
        .btn-outline {
          padding: 8px 18px; border-radius: 8px; font-size: 14px; font-weight: 600;
          color: #374151; border: 1px solid #d1d5db; background: #fff; cursor: pointer; text-decoration: none;
          display: inline-block;
        }
        .btn-blue {
          padding: 8px 18px; border-radius: 8px; font-size: 14px; font-weight: 600;
          color: #fff; background: #2563eb; border: none; cursor: pointer; text-decoration: none;
          display: inline-block;
        }
        .page {
          min-height: 100vh; padding-top: 64px;
          display: flex; align-items: center; justify-content: center;
          background: #f3f4f6; padding-left: 16px; padding-right: 16px;
        }
        .card {
          background: #fff; border-radius: 16px;
          box-shadow: 0 4px 24px rgba(0,0,0,0.08);
          padding: 48px 40px; width: 100%; max-width: 440px;
        }
        .card-title {
          font-size: 26px; font-weight: 800; color: #111;
          text-align: center; margin-bottom: 6px;
        }
        .card-sub {
          font-size: 14px; color: #6b7280; text-align: center; margin-bottom: 32px;
        }
        .card-sub span { color: #2563eb; font-weight: 600; }
        .field { margin-bottom: 20px; }
        .field label { display: block; font-size: 14px; font-weight: 600; color: #374151; margin-bottom: 6px; }
        .field input {
          width: 100%; padding: 12px 16px; border: 1px solid #d1d5db; border-radius: 8px;
          font-size: 14px; color: #111; outline: none; transition: border 0.2s;
        }
        .field input:focus { border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,0.1); }
        .pw-wrap { position: relative; }
        .pw-toggle {
          position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
          background: none; border: none; cursor: pointer; color: #9ca3af; font-size: 16px;
        }
        .btn-submit {
          width: 100%; padding: 13px; border-radius: 8px; font-size: 15px; font-weight: 700;
          color: #fff; background: #2563eb; border: none; cursor: pointer; margin-top: 8px;
          transition: background 0.2s;
        }
        .btn-submit:hover { background: #1d4ed8; }
        .btn-submit:disabled { background: #93c5fd; cursor: not-allowed; }
        .row-links {
          display: flex; justify-content: space-between; align-items: center;
          margin-top: 16px;
        }
        .row-links label { display: flex; align-items: center; gap: 6px; font-size: 13px; color: #6b7280; cursor: pointer; }
        .row-links a { font-size: 13px; color: #2563eb; font-weight: 600; text-decoration: none; }
        .signup-row { text-align: center; margin-top: 24px; font-size: 13px; color: #6b7280; }
        .signup-row a { color: #2563eb; font-weight: 600; text-decoration: none; }
        .terms-row { text-align: center; margin-top: 10px; }
        .terms-row a { font-size: 12px; color: #2563eb; text-decoration: underline; }
        .error-box {
          background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px;
          padding: 10px 14px; font-size: 13px; color: #dc2626; margin-bottom: 16px;
        }
        @media (max-width: 480px) {
          .card { padding: 32px 20px; }
          .nav-links { display: none; }
        }
      `}</style>

      {/* Navbar */}
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
          <div className="nav-links">
            <a href="/#features">Features</a>
            <a href="/#pricing">Pricing</a>
            <a href="/#contact">Contact</a>
          </div>
          <div className="nav-actions">
            <a href="/" className="btn-outline">Nyumbani</a>
            <a href="/register" className="btn-blue">Jisajili</a>
          </div>
        </div>
      </nav>

      {/* Login Card */}
      <div className="page">
        <div className="card">
          <h1 className="card-title">Ingia kwenye akaunti yako</h1>
          <p className="card-sub">Karibu tena kwenye <span>PhidPOS</span></p>

          {error && <div className="error-box">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="field">
              <label>Barua pepe</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Ingiza barua pepe yako"
              />
            </div>
            <div className="field">
              <label>Nywila</label>
              <div className="pw-wrap">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Ingiza nywila yako"
                  style={{paddingRight: '44px'}}
                />
                <button type="button" className="pw-toggle" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? "🙈" : "👁"}
                </button>
              </div>
            </div>

            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? "Ingia..." : "Ingia"}
            </button>

            <div className="row-links">
              <label>
                <input type="checkbox" /> Nikumbuke
              </label>
              <a href="#">Umesahau nywila?</a>
            </div>
          </form>

          <div className="signup-row">
            Huna akaunti? <a href="/register">Sajili shirika lako</a>
          </div>
          <div className="terms-row">
            <a href="#">Masharti na Vigezo</a>
          </div>
        </div>
      </div>
    </>
  );
}
