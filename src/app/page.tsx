export default function Home() {
  return (
    <>
      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
        a { text-decoration: none; color: inherit; }
        .navbar {
          position: fixed; top: 0; left: 0; right: 0; z-index: 100;
          background: #fff; border-bottom: 1px solid #e5e7eb;
          box-shadow: 0 1px 4px rgba(0,0,0,0.08);
        }
        .navbar-inner {
          max-width: 1200px; margin: 0 auto; padding: 0 24px;
          height: 64px; display: flex; align-items: center; justify-content: space-between;
        }
        .logo { display: flex; align-items: center; gap: 10px; }
        .logo-icon {
          width: 36px; height: 36px; background: #2563eb; border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
        }
        .logo-text { font-size: 20px; font-weight: 800; color: #111; }
        .nav-links { display: flex; gap: 32px; }
        .nav-links a { font-size: 14px; font-weight: 500; color: #4b5563; }
        .nav-links a:hover { color: #2563eb; }
        .nav-actions { display: flex; gap: 12px; align-items: center; }
        .btn-signin {
          padding: 8px 18px; border-radius: 8px; font-size: 14px; font-weight: 600;
          color: #374151; border: 1px solid #d1d5db; background: #fff; cursor: pointer;
        }
        .btn-signup {
          padding: 8px 18px; border-radius: 8px; font-size: 14px; font-weight: 600;
          color: #fff; background: #2563eb; border: none; cursor: pointer;
        }
        .hero {
          padding-top: 64px; min-height: 100vh;
          background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 40%, #4f46e5 70%, #7c3aed 100%);
          display: flex; align-items: center;
        }
        .hero-inner {
          max-width: 1200px; margin: 0 auto; padding: 60px 24px;
          display: grid; grid-template-columns: 1fr 340px; gap: 48px; align-items: center;
        }
        .hero-badge {
          display: inline-flex; align-items: center; gap: 8px;
          background: rgba(250,204,21,0.15); border: 1px solid rgba(250,204,21,0.3);
          color: #fde68a; font-size: 13px; font-weight: 600;
          padding: 6px 16px; border-radius: 999px; margin-bottom: 20px;
        }
        .hero-title {
          font-size: 52px; font-weight: 900; color: #fff;
          line-height: 1.1; margin-bottom: 20px;
        }
        .hero-title span { color: #fbbf24; }
        .hero-subtitle {
          font-size: 17px; color: #bfdbfe; line-height: 1.7;
          margin-bottom: 32px; max-width: 520px;
        }
        .hero-buttons { display: flex; gap: 16px; flex-wrap: wrap; margin-bottom: 28px; }
        .btn-primary {
          padding: 14px 28px; border-radius: 12px; font-size: 15px; font-weight: 700;
          background: #fbbf24; color: #111; border: none; cursor: pointer;
          box-shadow: 0 4px 20px rgba(251,191,36,0.4);
        }
        .btn-secondary {
          padding: 14px 28px; border-radius: 12px; font-size: 15px; font-weight: 600;
          background: rgba(255,255,255,0.1); color: #fff;
          border: 1px solid rgba(255,255,255,0.25); cursor: pointer;
        }
        .hero-checks { display: flex; gap: 24px; flex-wrap: wrap; }
        .hero-checks span { font-size: 13px; color: #93c5fd; display: flex; align-items: center; gap: 6px; }
        .news-card {
          background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15);
          border-radius: 16px; padding: 20px; backdrop-filter: blur(8px);
        }
        .news-header {
          background: #fbbf24; border-radius: 8px; padding: 10px 14px;
          font-size: 14px; font-weight: 800; color: #111;
          margin-bottom: 16px; display: flex; align-items: center; gap: 8px;
        }
        .news-item {
          display: flex; align-items: flex-start; gap: 10px;
          padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.1);
        }
        .news-num {
          width: 22px; height: 22px; border-radius: 50%; background: #fbbf24;
          color: #111; font-size: 11px; font-weight: 800;
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .news-text { font-size: 12px; color: #e0e7ff; font-weight: 500; line-height: 1.4; }
        .news-phone { font-size: 13px; color: #fbbf24; font-weight: 700; margin-top: 14px; }
        .features { padding: 80px 24px; background: #f9fafb; }
        .features-inner { max-width: 1200px; margin: 0 auto; }
        .section-title { text-align: center; font-size: 32px; font-weight: 800; color: #111; margin-bottom: 8px; }
        .section-sub { text-align: center; color: #6b7280; font-size: 16px; margin-bottom: 48px; }
        .features-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
        .feature-card {
          background: #fff; border-radius: 16px; padding: 28px;
          border: 1px solid #e5e7eb; box-shadow: 0 1px 4px rgba(0,0,0,0.04);
        }
        .feature-icon {
          width: 48px; height: 48px; border-radius: 12px;
          display: flex; align-items: center; justify-content: center; margin-bottom: 16px; font-size: 22px;
        }
        .feature-title { font-size: 16px; font-weight: 700; color: #111; margin-bottom: 8px; }
        .feature-desc { font-size: 14px; color: #6b7280; line-height: 1.6; }
        .cta { padding: 80px 24px; background: linear-gradient(135deg, #2563eb, #4f46e5); text-align: center; }
        .cta h2 { font-size: 32px; font-weight: 800; color: #fff; margin-bottom: 12px; }
        .cta p { font-size: 16px; color: #bfdbfe; margin-bottom: 32px; }
        .cta-buttons { display: flex; gap: 16px; justify-content: center; flex-wrap: wrap; }
        .footer { background: #111827; padding: 32px 24px; }
        .footer-inner {
          max-width: 1200px; margin: 0 auto;
          display: flex; align-items: center; justify-content: space-between;
          flex-wrap: wrap; gap: 16px;
        }
        .footer-logo { display: flex; align-items: center; gap: 8px; color: #fff; font-weight: 700; font-size: 16px; }
        .footer-copy { color: #9ca3af; font-size: 13px; }
        .footer-phone { color: #9ca3af; font-size: 13px; }
        @media (max-width: 768px) {
          .hero-inner { grid-template-columns: 1fr; }
          .news-card { display: none; }
          .hero-title { font-size: 36px; }
          .features-grid { grid-template-columns: 1fr; }
          .nav-links { display: none; }
        }
      `}</style>

      {/* Navbar */}
      <nav className="navbar">
        <div className="navbar-inner">
          <div className="logo">
            <div className="logo-icon">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="2">
                <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-1.5 6M17 13l1.5 6M9 19a1 1 0 100 2 1 1 0 000-2zm8 0a1 1 0 100 2 1 1 0 000-2z"/>
              </svg>
            </div>
            <span className="logo-text">PhidPOS</span>
          </div>
          <div className="nav-links">
            <a href="#features">Features</a>
            <a href="#pricing">Pricing</a>
            <a href="#contact">Contact</a>
          </div>
          <div className="nav-actions">
            <a href="/login"><button className="btn-signin">Ingia</button></a>
            <a href="/register"><button className="btn-signup">Jisajili</button></a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="hero">
        <div className="hero-inner">
          <div>
            <div className="hero-badge">
              <span>★</span> Mfumo wa Kisasa wa POS Tanzania
            </div>
            <h1 className="hero-title">
              Rahisisha Biashara<br />
              Yako ya <span>Rejareja</span><br />
              na Jumla
            </h1>
            <p className="hero-subtitle">
              Mfumo wa kitaalamu wa POS kwa biashara za rejareja na jumla. Simamia mauzo, bidhaa, wateja, na ripoti — mahali pamoja.
            </p>
            <div className="hero-buttons">
              <a href="/register"><button className="btn-primary">Jisajili Bure →</button></a>
              <a href="/login"><button className="btn-secondary">Ingia Akaunti</button></a>
            </div>
            <div className="hero-checks">
              <span>✓ Bila ada ya usanidi</span>
              <span>✓ Jaribio la siku 14</span>
              <span>✓ Futa wakati wowote</span>
            </div>
          </div>

          {/* News Card */}
          <div className="news-card">
            <div className="news-header">
              <span>📋</span> HUDUMA ZETU
            </div>
            <div className="news-item">
              <div className="news-num">1</div>
              <div className="news-text">MAUZO YA REJAREJA NA JUMLA</div>
            </div>
            <div className="news-item">
              <div className="news-num">2</div>
              <div className="news-text">USIMAMIZI WA BIDHAA NA HIFADHI</div>
            </div>
            <div className="news-item">
              <div className="news-num">3</div>
              <div className="news-text">RIPOTI ZA MAUZO KWA WAKATI HALISI</div>
            </div>
            <div className="news-item" style={{borderBottom: 'none'}}>
              <div className="news-num">4</div>
              <div className="news-text">USIMAMIZI WA WATEJA NA WADAIWA</div>
            </div>
            <div className="news-phone">📞 TUPIGIE +255 682 188 544</div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="features" id="features">
        <div className="features-inner">
          <h2 className="section-title">Vipengele Vyote Unavyohitaji</h2>
          <p className="section-sub">Mfumo kamili kwa biashara za kisasa Tanzania</p>
          <div className="features-grid">
            {[
              { icon: "🛒", title: "Mauzo ya POS", desc: "Kiolesura cha haraka cha mauzo na uchapishaji wa risiti mara moja.", bg: "#eff6ff", },
              { icon: "📦", title: "Usimamizi wa Bidhaa", desc: "Fuatilia hisa, weka tahadhari, simamia bidhaa katika maduka mengi.", bg: "#f5f3ff", },
              { icon: "👥", title: "Usimamizi wa Wateja", desc: "Akaunti za wateja, ufuatiliaji wa madeni, na programu za uaminifu.", bg: "#fdf4ff", },
              { icon: "📊", title: "Ripoti & Uchambuzi", desc: "Ripoti za mauzo za wakati halisi, chati za mapato na maarifa ya biashara.", bg: "#f0fdf4", },
              { icon: "🔐", title: "Majukumu ya Watumiaji", desc: "Msimamizi, msaidizi wa mauzo, meneja — udhibiti kamili wa ufikiaji.", bg: "#fff7ed", },
              { icon: "🏪", title: "Maduka Mengi", desc: "Simamia matawi mengi kutoka dashibodi moja kuu.", bg: "#fef2f2", },
            ].map((f) => (
              <div key={f.title} className="feature-card">
                <div className="feature-icon" style={{background: f.bg}}>{f.icon}</div>
                <div className="feature-title">{f.title}</div>
                <div className="feature-desc">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta" id="pricing">
        <h2>Uko tayari kukuza biashara yako?</h2>
        <p>Jiunge na mamia ya wafanyabiashara wanaotumia PhidPOS Tanzania</p>
        <div className="cta-buttons">
          <a href="/register"><button className="btn-primary">Anza Jaribio Bure</button></a>
          <a href="/login"><button className="btn-secondary">Ingia Akaunti</button></a>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer" id="contact">
        <div className="footer-inner">
          <div className="footer-logo">
            <div className="logo-icon" style={{width:28,height:28}}>
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="2">
                <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-1.5 6M17 13l1.5 6M9 19a1 1 0 100 2 1 1 0 000-2zm8 0a1 1 0 100 2 1 1 0 000-2z"/>
              </svg>
            </div>
            PhidPOS
          </div>
          <div className="footer-copy">© {new Date().getFullYear()} PhidPOS na Phidtech ICT & Business Solutions</div>
          <div className="footer-phone">📞 +255 682 188 544</div>
        </div>
      </footer>
    </>
  );
}
