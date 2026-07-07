"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLang, type Lang } from "@/lib/i18n";

type NavItem = { href: string; key: string; icon: string; color: string; bg: string; roles: string[] };

const navItems: NavItem[] = [
  { href: "/dashboard", key: "dashboard", icon: "📊", color: "#2563eb", bg: "#eff6ff", roles: ["SUPER_ADMIN","TENANT_ADMIN","STORE_MANAGER","CASHIER","ACCOUNTANT"] },
  { href: "/pos",       key: "pos",       icon: "🛒", color: "#16a34a", bg: "#f0fdf4", roles: ["TENANT_ADMIN","STORE_MANAGER","CASHIER"] },
  { href: "/products",  key: "products",  icon: "📦", color: "#7c3aed", bg: "#f5f3ff", roles: ["TENANT_ADMIN","STORE_MANAGER","ACCOUNTANT"] },
  { href: "/inventory", key: "inventory", icon: "🏪", color: "#0891b2", bg: "#ecfeff", roles: ["TENANT_ADMIN","STORE_MANAGER"] },
  { href: "/customers", key: "customers", icon: "👥", color: "#db2777", bg: "#fdf2f8", roles: ["TENANT_ADMIN","STORE_MANAGER","CASHIER"] },
  { href: "/suppliers", key: "suppliers", icon: "🚚", color: "#d97706", bg: "#fffbeb", roles: ["TENANT_ADMIN","STORE_MANAGER"] },
  { href: "/purchases", key: "purchases", icon: "🛍️", color: "#ea580c", bg: "#fff7ed", roles: ["TENANT_ADMIN","STORE_MANAGER"] },
  { href: "/accounting",key: "accounting",icon: "📒", color: "#059669", bg: "#ecfdf5", roles: ["TENANT_ADMIN","ACCOUNTANT"] },
  { href: "/reports",   key: "reports",   icon: "📈", color: "#4f46e5", bg: "#eef2ff", roles: ["TENANT_ADMIN","STORE_MANAGER","ACCOUNTANT"] },
  { href: "/settings",  key: "settings",  icon: "⚙️", color: "#374151", bg: "#f9fafb", roles: ["TENANT_ADMIN"] },
];

const styles = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  .dash-layout { display: flex; height: 100vh; overflow: hidden; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f3f4f6; }

  /* ── Sidebar ── */
  .sidebar {
    width: 230px; min-width: 230px; background: #fff;
    display: flex; flex-direction: column; height: 100vh;
    overflow-y: auto; flex-shrink: 0;
    border-right: 1px solid #e5e7eb;
    box-shadow: 2px 0 8px rgba(0,0,0,0.04);
  }
  .sidebar-logo {
    display: flex; align-items: center; gap: 10px;
    padding: 18px 16px 14px;
    border-bottom: 1px solid #f3f4f6;
  }
  .sidebar-logo-icon {
    width: 38px; height: 38px; background: #2563eb; border-radius: 10px;
    display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0;
  }
  .sidebar-logo-text { font-size: 17px; font-weight: 900; color: #111; letter-spacing: -0.3px; }
  .sidebar-logo-sub { font-size: 10px; color: #9ca3af; margin-top: 1px; max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .sidebar-nav { flex: 1; padding: 10px 10px; }
  .nav-item {
    display: flex; align-items: center; gap: 11px;
    padding: 9px 10px; border-radius: 10px; margin-bottom: 3px;
    font-size: 13px; font-weight: 500; color: #374151;
    text-decoration: none; transition: background 0.15s, color 0.15s;
    cursor: pointer; position: relative;
  }
  .nav-item:hover { background: #f3f4f6; color: #111; }
  .nav-item.active { background: #2563eb; color: #fff; font-weight: 700; }
  .nav-item.active .nav-icon-wrap { background: rgba(255,255,255,0.2) !important; }
  .nav-item .nav-chevron { margin-left: auto; font-size: 11px; color: #9ca3af; transition: transform 0.2s; }
  .nav-item.active .nav-chevron { color: rgba(255,255,255,0.7); }
  .nav-item.expanded .nav-chevron { transform: rotate(90deg); }
  .nav-icon-wrap {
    width: 30px; height: 30px; border-radius: 8px; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center; font-size: 15px;
    transition: background 0.15s;
  }
  .submenu { overflow: hidden; margin: 0 0 2px 0; }
  .submenu-inner { padding: 2px 0 4px 41px; }
  .sub-item {
    display: block; padding: 7px 10px 7px 12px;
    font-size: 12.5px; font-weight: 500; color: #6b7280;
    text-decoration: none; border-radius: 8px; margin-bottom: 1px;
    border-left: 2px solid transparent;
    transition: background 0.15s, color 0.15s, border-color 0.15s;
  }
  .sub-item:hover { background: #f3f4f6; color: #111; border-left-color: #d1d5db; }
  .sub-item.active { background: #eff6ff; color: #2563eb; font-weight: 700; border-left-color: #2563eb; }
  .sidebar-footer {
    padding: 10px 10px 14px;
    border-top: 1px solid #f3f4f6;
  }
  .sidebar-user {
    display: flex; align-items: center; gap: 10px;
    padding: 10px; border-radius: 10px; margin-bottom: 4px;
    background: #f9fafb;
  }
  .sidebar-avatar {
    width: 36px; height: 36px; border-radius: 50%; background: #2563eb;
    display: flex; align-items: center; justify-content: center;
    font-size: 14px; font-weight: 800; color: #fff; flex-shrink: 0;
  }
  .sidebar-user-info { overflow: hidden; flex: 1; }
  .sidebar-user-name { font-size: 12px; font-weight: 700; color: #111; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .sidebar-user-role { font-size: 10px; color: #6b7280; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 1px; }
  .btn-signout {
    display: flex; align-items: center; gap: 10px;
    padding: 9px 10px; border-radius: 10px; width: 100%;
    font-size: 13px; font-weight: 600; color: #ef4444;
    background: none; border: none; cursor: pointer; text-align: left;
    transition: background 0.15s;
  }
  .btn-signout:hover { background: #fef2f2; }

  /* ── Main Area ── */
  .main-area { flex: 1; display: flex; flex-direction: column; overflow: hidden; min-width: 0; }
  .topbar {
    height: 60px; background: #fff; border-bottom: 1px solid #e5e7eb;
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 24px; flex-shrink: 0;
    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  }
  .topbar-left { font-size: 15px; font-weight: 700; color: #374151; }
  .topbar-right { display: flex; align-items: center; gap: 10px; }
  .lang-btn {
    display: flex; align-items: center; gap: 6px;
    padding: 6px 12px; border-radius: 8px; border: 1px solid #e5e7eb;
    background: #f9fafb; cursor: pointer; font-size: 13px; font-weight: 600; color: #374151;
    transition: background 0.15s;
  }
  .lang-btn:hover { background: #f3f4f6; }
  .notif-btn {
    width: 36px; height: 36px; border-radius: 50%; border: 1px solid #e5e7eb;
    display: flex; align-items: center; justify-content: center;
    font-size: 16px; cursor: pointer; background: #f9fafb; position: relative;
    transition: background 0.15s;
  }
  .notif-btn:hover { background: #f3f4f6; }
  .topbar-user {
    display: flex; align-items: center; gap: 8px;
    padding: 6px 12px 6px 6px; border-radius: 10px; border: 1px solid #e5e7eb;
    background: #f9fafb; cursor: pointer; transition: background 0.15s;
  }
  .topbar-user:hover { background: #f3f4f6; }
  .topbar-avatar {
    width: 32px; height: 32px; border-radius: 50%; background: #2563eb;
    display: flex; align-items: center; justify-content: center;
    font-size: 13px; font-weight: 800; color: #fff;
  }
  .topbar-name { font-size: 13px; font-weight: 700; color: #111; }
  .topbar-role { font-size: 11px; color: #6b7280; margin-top: 1px; }
  .topbar-chevron { font-size: 10px; color: #9ca3af; margin-left: 2px; }

  .page-content { flex: 1; overflow-y: auto; padding: 24px; background: #f3f4f6; }

  /* ── Mobile ── */
  .mobile-menu-btn {
    display: none; position: fixed; bottom: 20px; right: 20px; z-index: 200;
    width: 50px; height: 50px; background: #2563eb; border-radius: 50%;
    border: none; cursor: pointer; color: #fff; font-size: 22px;
    box-shadow: 0 4px 16px rgba(37,99,235,0.4);
    align-items: center; justify-content: center;
  }
  .mobile-overlay { display: none; }
  @media (max-width: 768px) {
    .sidebar { position: fixed; left: -230px; top: 0; bottom: 0; z-index: 300; transition: left 0.25s; }
    .sidebar.open { left: 0; box-shadow: 4px 0 24px rgba(0,0,0,0.15); }
    .mobile-overlay { display: block; position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 299; }
    .mobile-menu-btn { display: flex; }
    .topbar-name, .topbar-role { display: none; }
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
  const tenantName = (session?.user as any)?.tenantSlug || "PhidPOS";
  const initial = userName.charAt(0).toUpperCase();
  const activeItem = filteredNav.find(n => pathname === n.href || pathname.startsWith(n.href + "/"));
  const currentKey = activeItem?.key || "dashboard";
  const currentLabel = t[currentKey as keyof typeof t] || currentKey;
  const roleLabel = role?.replace(/_/g, " ") || "User";

  return (
    <>
      <style>{styles}</style>
      <div className="dash-layout">
        {sidebarOpen && <div className="mobile-overlay" onClick={() => setSidebarOpen(false)} />}

        {/* ── Sidebar ── */}
        <aside className={`sidebar${sidebarOpen ? " open" : ""}`}>
          {/* Logo */}
          <div className="sidebar-logo">
            <div className="sidebar-logo-icon">🛒</div>
            <div>
              <div className="sidebar-logo-text">PhidPOS</div>
              <div className="sidebar-logo-sub">{tenantName}</div>
            </div>
          </div>

          {/* Nav */}
          <nav className="sidebar-nav">
            {filteredNav.map((item) => {
              const active = pathname === item.href || pathname.startsWith(item.href + "/");
              const label = t[item.key as keyof typeof t] || item.key;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`nav-item${active ? " active" : ""}`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <span className="nav-icon-wrap" style={{ background: active ? "rgba(255,255,255,0.2)" : item.bg }}>{item.icon}</span>
                  {label}
                  <span className="nav-chevron">›</span>
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="sidebar-footer">
            <div className="sidebar-user">
              <div className="sidebar-avatar">{initial}</div>
              <div className="sidebar-user-info">
                <div className="sidebar-user-name">{userName}</div>
                <div className="sidebar-user-role">{roleLabel}</div>
              </div>
            </div>
            <button className="btn-signout" onClick={() => signOut({ callbackUrl: "/login" })}>
              <span style={{fontSize:"16px"}}>🚪</span> {t.signOut}
            </button>
          </div>
        </aside>

        {/* ── Main ── */}
        <div className="main-area">
          {/* Topbar */}
          <header className="topbar">
            <div className="topbar-left">{currentLabel}</div>
            <div className="topbar-right">
              {/* Language toggle */}
              <button className="lang-btn" onClick={() => setLang(lang === "sw" ? "en" : "sw")}>
                <span style={{fontSize:"14px"}}>{lang === "sw" ? "🇹🇿" : "🇬🇧"}</span>
                <span>{lang === "sw" ? "Kiswahili" : "English"}</span>
                <span style={{fontSize:"9px",color:"#9ca3af"}}>▼</span>
              </button>
              {/* Bell */}
              <button className="notif-btn">🔔</button>
              {/* User */}
              <div className="topbar-user">
                <div className="topbar-avatar">{initial}</div>
                <div>
                  <div className="topbar-name">{userName}</div>
                  <div className="topbar-role">{roleLabel}</div>
                </div>
                <span className="topbar-chevron">▼</span>
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
