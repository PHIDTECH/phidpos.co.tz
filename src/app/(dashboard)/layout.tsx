"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLang, type Lang } from "@/lib/i18n";

const navItems = [
  { href: "/dashboard", key: "dashboard", icon: "📊", roles: ["SUPER_ADMIN","TENANT_ADMIN","STORE_MANAGER","CASHIER","ACCOUNTANT"] },
  { href: "/pos", key: "pos", icon: "🛒", roles: ["TENANT_ADMIN","STORE_MANAGER","CASHIER"] },
  { href: "/products", key: "products", icon: "📦", roles: ["TENANT_ADMIN","STORE_MANAGER","ACCOUNTANT"] },
  { href: "/inventory", key: "inventory", icon: "🏪", roles: ["TENANT_ADMIN","STORE_MANAGER"] },
  { href: "/customers", key: "customers", icon: "👥", roles: ["TENANT_ADMIN","STORE_MANAGER","CASHIER"] },
  { href: "/suppliers", key: "suppliers", icon: "🚚", roles: ["TENANT_ADMIN","STORE_MANAGER"] },
  { href: "/purchases", key: "purchases", icon: "🛍️", roles: ["TENANT_ADMIN","STORE_MANAGER"] },
  { href: "/accounting", key: "accounting", icon: "📒", roles: ["TENANT_ADMIN","ACCOUNTANT"] },
  { href: "/reports", key: "reports", icon: "📈", roles: ["TENANT_ADMIN","STORE_MANAGER","ACCOUNTANT"] },
  { href: "/settings", key: "settings", icon: "⚙️", roles: ["TENANT_ADMIN"] },
];

const styles = `
  .dash-layout { display: flex; height: 100vh; overflow: hidden; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f3f4f6; }
  .sidebar {
    width: 220px; min-width: 220px; background: #2563eb;
    display: flex; flex-direction: column; height: 100vh;
    overflow-y: auto; flex-shrink: 0;
  }
  .sidebar-logo {
    display: flex; align-items: center; gap: 10px;
    padding: 20px 16px 16px; border-bottom: 1px solid rgba(255,255,255,0.15);
  }
  .sidebar-logo-icon {
    width: 36px; height: 36px; background: #fff; border-radius: 8px;
    display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0;
  }
  .sidebar-logo-text { font-size: 16px; font-weight: 800; color: #fff; }
  .sidebar-logo-sub { font-size: 11px; color: rgba(255,255,255,0.7); margin-top: 1px; max-width: 140px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .sidebar-nav { flex: 1; padding: 10px 8px; }
  .nav-item {
    display: flex; align-items: center; gap: 10px;
    padding: 10px 12px; border-radius: 8px; margin-bottom: 2px;
    font-size: 13px; font-weight: 500; color: rgba(255,255,255,0.8);
    text-decoration: none; transition: background 0.15s;
    cursor: pointer;
  }
  .nav-item:hover { background: rgba(255,255,255,0.12); color: #fff; }
  .nav-item.active { background: #fff; color: #2563eb; font-weight: 700; }
  .nav-item-icon { font-size: 16px; width: 20px; text-align: center; flex-shrink: 0; }
  .sidebar-footer { padding: 10px 8px 16px; border-top: 1px solid rgba(255,255,255,0.15); }
  .sidebar-user {
    display: flex; align-items: center; gap: 10px;
    padding: 10px 12px; margin-bottom: 4px;
  }
  .sidebar-avatar {
    width: 34px; height: 34px; border-radius: 50%; background: #fff;
    display: flex; align-items: center; justify-content: center;
    font-size: 14px; font-weight: 800; color: #2563eb; flex-shrink: 0;
  }
  .sidebar-user-info { overflow: hidden; }
  .sidebar-user-name { font-size: 12px; font-weight: 700; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .sidebar-user-email { font-size: 10px; color: rgba(255,255,255,0.6); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .btn-signout {
    display: flex; align-items: center; gap: 10px;
    padding: 10px 12px; border-radius: 8px; width: 100%;
    font-size: 13px; font-weight: 600; color: #fca5a5;
    background: none; border: none; cursor: pointer; text-align: left;
  }
  .btn-signout:hover { background: rgba(255,255,255,0.1); color: #fecaca; }
  .main-area { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
  .topbar {
    height: 56px; background: #fff; border-bottom: 1px solid #e5e7eb;
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 24px; flex-shrink: 0;
    box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  }
  .topbar-left { font-size: 15px; font-weight: 700; color: #111; }
  .topbar-right { display: flex; align-items: center; gap: 12px; }
  .topbar-bell {
    width: 34px; height: 34px; border-radius: 50%; border: 1px solid #e5e7eb;
    display: flex; align-items: center; justify-content: center;
    font-size: 16px; cursor: pointer; background: #f9fafb;
  }
  .topbar-user {
    display: flex; align-items: center; gap: 8px;
    padding: 6px 12px; border-radius: 8px; border: 1px solid #e5e7eb;
    background: #f9fafb; cursor: pointer;
  }
  .topbar-avatar {
    width: 28px; height: 28px; border-radius: 50%; background: #2563eb;
    display: flex; align-items: center; justify-content: center;
    font-size: 12px; font-weight: 800; color: #fff;
  }
  .topbar-name { font-size: 13px; font-weight: 600; color: #111; }
  .topbar-role { font-size: 11px; color: #6b7280; }
  .page-content { flex: 1; overflow-y: auto; padding: 24px; }
  .mobile-menu-btn {
    display: none; position: fixed; bottom: 20px; right: 20px; z-index: 200;
    width: 48px; height: 48px; background: #2563eb; border-radius: 50%;
    border: none; cursor: pointer; color: #fff; font-size: 20px;
    box-shadow: 0 4px 16px rgba(37,99,235,0.4);
  }
  .mobile-overlay { display: none; }
  @media (max-width: 768px) {
    .sidebar { position: fixed; left: -220px; top: 0; bottom: 0; z-index: 300; transition: left 0.25s; }
    .sidebar.open { left: 0; }
    .mobile-overlay { display: block; position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 299; }
    .mobile-menu-btn { display: flex; align-items: center; justify-content: center; }
    .topbar-name { display: none; }
  }
`;

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const sessionData = useSession();
  const session = sessionData?.data;
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { lang, t, setLang } = useLang();
  const role = (session?.user as any)?.role;
  const filteredNav = navItems.filter((item) => !role || item.roles.includes(role));
  const userName = session?.user?.name || "User";
  const userEmail = session?.user?.email || "";
  const tenantName = (session?.user as any)?.tenantSlug || "Portal";
  const initial = userName.charAt(0).toUpperCase();
  const currentKey = filteredNav.find(n => pathname === n.href || pathname.startsWith(n.href + "/"))?.key || "dashboard";
  const currentLabel = t[currentKey as keyof typeof t] || currentKey;

  return (
    <>
      <style>{styles}</style>
      <div className="dash-layout">
        {sidebarOpen && <div className="mobile-overlay" onClick={() => setSidebarOpen(false)} />}

        {/* Sidebar */}
        <aside className={`sidebar${sidebarOpen ? " open" : ""}`}>
          <div className="sidebar-logo">
            <div className="sidebar-logo-icon">🛒</div>
            <div>
              <div className="sidebar-logo-text">PhidPOS</div>
              <div className="sidebar-logo-sub">{tenantName}</div>
            </div>
          </div>

          <nav className="sidebar-nav">
            {filteredNav.map((item) => {
              const active = pathname === item.href || pathname.startsWith(item.href + "/");
              const label = t[item.key as keyof typeof t] || item.key;
              return (
                <Link key={item.href} href={item.href} className={`nav-item${active ? " active" : ""}`} onClick={() => setSidebarOpen(false)}>
                  <span className="nav-item-icon">{item.icon}</span>
                  {label}
                </Link>
              );
            })}
          </nav>

          <div className="sidebar-footer">
            <div className="sidebar-user">
              <div className="sidebar-avatar">{initial}</div>
              <div className="sidebar-user-info">
                <div className="sidebar-user-name">{userName}</div>
                <div className="sidebar-user-email">{userEmail}</div>
              </div>
            </div>
            <button className="btn-signout" onClick={() => signOut({ callbackUrl: "/login" })}>
              🚪 {t.signOut}
            </button>
          </div>
        </aside>

        {/* Main */}
        <div className="main-area">
          {/* Topbar */}
          <header className="topbar">
            <div className="topbar-left">{currentLabel}</div>
            <div className="topbar-right">
              {/* Language Selector */}
              <button
                onClick={() => setLang(lang === "sw" ? "en" : "sw")}
                style={{display:"flex",alignItems:"center",gap:"6px",padding:"6px 12px",borderRadius:"8px",border:"1px solid #e5e7eb",background:"#f9fafb",cursor:"pointer",fontSize:"13px",fontWeight:600,color:"#374151"}}
                title={t.language}
              >
                <span style={{fontSize:"15px"}}>{lang === "sw" ? "🇹🇿" : "🇬🇧"}</span>
                <span>{lang === "sw" ? "Kiswahili" : "English"}</span>
              </button>
              <div className="topbar-bell">🔔</div>
              <div className="topbar-user">
                <div className="topbar-avatar">{initial}</div>
                <div>
                  <div className="topbar-name">{userName}</div>
                  <div className="topbar-role">{role?.replace(/_/g, " ") || "User"}</div>
                </div>
                <span style={{color:"#9ca3af",fontSize:"12px"}}>▼</span>
              </div>
            </div>
          </header>

          <main className="page-content">
            {children}
          </main>
        </div>

        <button className="mobile-menu-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>☰</button>
      </div>
    </>
  );
}
