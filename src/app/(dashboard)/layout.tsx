"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLang, type Lang } from "@/lib/i18n";

type SubItem = { href: string; key: string };
type NavItem = { href: string; key: string; icon: string; color: string; bg: string; roles: string[]; sub?: SubItem[] };

const navItems: NavItem[] = [
  { href: "/dashboard",       key: "dashboard",   icon: "📊", color: "#2563eb", bg: "#eff6ff", roles: ["SUPER_ADMIN","TENANT_ADMIN","STORE_MANAGER","CASHIER","ACCOUNTANT"] },
  { href: "/superadmin",  key: "user_mgmt", icon: "👥", color: "#7c3aed", bg: "#f5f3ff", roles: ["SUPER_ADMIN"],
    sub: [
      { href: "/superadmin/users",     key: "sa_users" },
      { href: "/superadmin/tenants",   key: "sa_tenants" },
    ]
  },
  { href: "/superadmin/accounts",  key: "sa_accounts",  icon: "💰", color: "#16a34a", bg: "#f0fdf4", roles: ["SUPER_ADMIN"] },
  { href: "/superadmin/settings",  key: "sa_settings",  icon: "⚙️", color: "#374151", bg: "#f9fafb", roles: ["SUPER_ADMIN"] },
  { href: "/pos",             key: "pos",         icon: "🛒", color: "#16a34a", bg: "#f0fdf4", roles: ["TENANT_ADMIN","STORE_MANAGER","CASHIER"] },
  { href: "/products",        key: "products",    icon: "📦", color: "#7c3aed", bg: "#f5f3ff", roles: ["TENANT_ADMIN","STORE_MANAGER","ACCOUNTANT"] },
  { href: "/inventory",       key: "inventory",   icon: "🏪", color: "#0891b2", bg: "#ecfeff", roles: ["TENANT_ADMIN","STORE_MANAGER"] },
  { href: "/customers",       key: "customers",   icon: "👥", color: "#db2777", bg: "#fdf2f8", roles: ["TENANT_ADMIN","STORE_MANAGER","CASHIER"] },
  { href: "/suppliers",       key: "suppliers",   icon: "🚚", color: "#d97706", bg: "#fffbeb", roles: ["TENANT_ADMIN","STORE_MANAGER"] },
  { href: "/purchases",       key: "purchases",   icon: "🛍️", color: "#ea580c", bg: "#fff7ed", roles: ["TENANT_ADMIN","STORE_MANAGER"] },
  { href: "/accounting",      key: "accounting",  icon: "📒", color: "#059669", bg: "#ecfdf5", roles: ["TENANT_ADMIN","ACCOUNTANT"] },
  { href: "/reports",         key: "reports",     icon: "📈", color: "#4f46e5", bg: "#eef2ff", roles: ["TENANT_ADMIN","STORE_MANAGER","ACCOUNTANT"] },
  { href: "/staff",           key: "staff_roles", icon: "👨‍💼", color: "#0891b2", bg: "#ecfeff", roles: ["TENANT_ADMIN","STORE_MANAGER"],
    sub: [
      { href: "/staff",  key: "all_staff" },
      { href: "/roles",  key: "all_roles" },
    ]
  },
  { href: "/messages",        key: "messages",    icon: "💬", color: "#7c3aed", bg: "#f5f3ff", roles: ["TENANT_ADMIN","STORE_MANAGER"] },
  { href: "/settings",        key: "settings",    icon: "⚙️", color: "#374151", bg: "#f9fafb", roles: ["TENANT_ADMIN"] },
  { href: "/subscription",     key: "subscription", icon: "💳", color: "#0891b2", bg: "#ecfeff", roles: ["TENANT_ADMIN"] },
];

const styles = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
  .dash-layout { display: flex; height: 100vh; overflow: hidden; background: #f0f2f5; }

  /* ══════════════════════════════════
     SIDEBAR — Dark professional style
  ══════════════════════════════════ */
  .sidebar {
    width: 255px; min-width: 255px;
    background: linear-gradient(180deg, #1e2433 0%, #1a1f2e 100%);
    display: flex; flex-direction: column; height: 100vh;
    overflow-y: auto; flex-shrink: 0;
    scrollbar-width: none;
  }
  .sidebar::-webkit-scrollbar { display: none; }

  /* Logo area */
  .sidebar-logo {
    display: flex; align-items: center; gap: 12px;
    padding: 20px 18px 16px;
    border-bottom: 1px solid rgba(255,255,255,0.07);
  }
  .sidebar-logo-icon {
    width: 42px; height: 42px;
    background: linear-gradient(135deg, #3b82f6, #2563eb);
    border-radius: 12px;
    display: flex; align-items: center; justify-content: center;
    font-size: 20px; flex-shrink: 0;
    box-shadow: 0 4px 12px rgba(37,99,235,0.4);
  }
  .sidebar-logo-text {
    font-size: 18px; font-weight: 800; color: #fff;
    letter-spacing: -0.4px;
  }
  .sidebar-logo-sub {
    font-size: 11px; color: rgba(255,255,255,0.4);
    margin-top: 2px; max-width: 160px;
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }

  /* Nav section label */
  .nav-section-label {
    font-size: 10px; font-weight: 700; letter-spacing: 0.1em;
    color: rgba(255,255,255,0.3); text-transform: uppercase;
    padding: 14px 18px 6px;
  }

  /* Nav container */
  .sidebar-nav { flex: 1; padding: 8px 10px; }

  /* Nav item */
  .nav-item {
    display: flex; align-items: center; gap: 10px;
    padding: 10px 12px; border-radius: 10px; margin-bottom: 2px;
    font-size: 13.5px; font-weight: 500; color: rgba(255,255,255,0.6);
    text-decoration: none; transition: all 0.15s ease;
    cursor: pointer; user-select: none;
  }
  .nav-item:hover { background: rgba(255,255,255,0.07); color: rgba(255,255,255,0.9); }
  .nav-item.active {
    background: linear-gradient(135deg, #3b82f6, #2563eb);
    color: #fff; font-weight: 700;
    box-shadow: 0 4px 12px rgba(37,99,235,0.35);
  }
  .nav-item .nav-chevron {
    margin-left: auto; font-size: 12px;
    color: rgba(255,255,255,0.3);
    transition: transform 0.2s ease;
  }
  .nav-item.active .nav-chevron { color: rgba(255,255,255,0.7); }
  .nav-item.expanded .nav-chevron { transform: rotate(90deg); }

  /* Icon wrap */
  .nav-icon-wrap {
    width: 32px; height: 32px; border-radius: 8px; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    font-size: 16px; background: rgba(255,255,255,0.08);
    transition: background 0.15s;
  }
  .nav-item.active .nav-icon-wrap {
    background: rgba(255,255,255,0.2) !important;
  }
  .nav-item:hover .nav-icon-wrap { background: rgba(255,255,255,0.12); }

  /* Submenu */
  .submenu { overflow: hidden; }
  .submenu-inner { padding: 2px 0 4px 52px; }
  .sub-item {
    display: flex; align-items: center; gap: 8px;
    padding: 8px 12px; font-size: 13px; font-weight: 500;
    color: rgba(255,255,255,0.45); text-decoration: none;
    border-radius: 8px; margin-bottom: 1px;
    border-left: 2px solid transparent;
    transition: all 0.15s ease;
  }
  .sub-item::before {
    content: ''; width: 5px; height: 5px; border-radius: 50%;
    background: rgba(255,255,255,0.2); flex-shrink: 0;
    transition: background 0.15s;
  }
  .sub-item:hover { background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.8); }
  .sub-item:hover::before { background: rgba(255,255,255,0.5); }
  .sub-item.active {
    color: #60a5fa; font-weight: 700;
    background: rgba(59,130,246,0.12);
    border-left-color: #3b82f6;
  }
  .sub-item.active::before { background: #3b82f6; }

  /* Divider */
  .sidebar-divider {
    height: 1px; background: rgba(255,255,255,0.06);
    margin: 8px 12px;
  }

  /* Footer / User area */
  .sidebar-footer {
    padding: 10px 10px 14px;
    border-top: 1px solid rgba(255,255,255,0.07);
  }
  .sidebar-user {
    display: flex; align-items: center; gap: 10px;
    padding: 10px 12px; border-radius: 10px; margin-bottom: 6px;
    background: rgba(255,255,255,0.05); cursor: pointer;
    transition: background 0.15s;
  }
  .sidebar-user:hover { background: rgba(255,255,255,0.09); }
  .sidebar-avatar {
    width: 36px; height: 36px; border-radius: 50%;
    background: linear-gradient(135deg, #3b82f6, #6366f1);
    display: flex; align-items: center; justify-content: center;
    font-size: 14px; font-weight: 800; color: #fff; flex-shrink: 0;
    box-shadow: 0 2px 8px rgba(99,102,241,0.4);
  }
  .sidebar-user-info { overflow: hidden; flex: 1; }
  .sidebar-user-name {
    font-size: 13px; font-weight: 700; color: #fff;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .sidebar-user-role {
    font-size: 11px; color: rgba(255,255,255,0.4);
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 1px;
  }
  .sidebar-user-email {
    font-size: 10px; color: rgba(255,255,255,0.28);
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 1px;
  }
  .btn-signout {
    display: flex; align-items: center; gap: 10px;
    padding: 9px 12px; border-radius: 10px; width: 100%;
    font-size: 13px; font-weight: 600; color: rgba(255,100,100,0.8);
    background: none; border: none; cursor: pointer; text-align: left;
    transition: all 0.15s;
  }
  .btn-signout:hover { background: rgba(239,68,68,0.12); color: #f87171; }

  /* ══════════════════════════════════
     TOPBAR
  ══════════════════════════════════ */
  .main-area { flex: 1; display: flex; flex-direction: column; overflow: hidden; min-width: 0; }
  .topbar {
    height: 62px; background: #fff;
    border-bottom: 1px solid #e5e7eb;
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 24px; flex-shrink: 0;
    box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  }
  .topbar-left {
    font-size: 16px; font-weight: 700; color: #111;
    display: flex; align-items: center; gap: 8px;
  }
  .topbar-breadcrumb {
    font-size: 12px; color: #9ca3af; font-weight: 400; margin-left: 4px;
  }
  .topbar-right { display: flex; align-items: center; gap: 10px; }

  .lang-btn {
    display: flex; align-items: center; gap: 6px;
    padding: 7px 12px; border-radius: 8px; border: 1px solid #e5e7eb;
    background: #f9fafb; cursor: pointer; font-size: 13px; font-weight: 600; color: #374151;
    transition: background 0.15s; white-space: nowrap;
  }
  .lang-btn:hover { background: #f3f4f6; }

  .notif-btn {
    width: 38px; height: 38px; border-radius: 10px; border: 1px solid #e5e7eb;
    display: flex; align-items: center; justify-content: center;
    font-size: 16px; cursor: pointer; background: #f9fafb;
    transition: background 0.15s; position: relative;
  }
  .notif-btn:hover { background: #f3f4f6; }

  .topbar-user {
    display: flex; align-items: center; gap: 8px;
    padding: 5px 12px 5px 6px; border-radius: 10px;
    border: 1px solid #e5e7eb; background: #f9fafb;
    cursor: pointer; transition: background 0.15s;
  }
  .topbar-user:hover { background: #f3f4f6; }
  .topbar-avatar {
    width: 32px; height: 32px; border-radius: 50%;
    background: linear-gradient(135deg, #3b82f6, #6366f1);
    display: flex; align-items: center; justify-content: center;
    font-size: 13px; font-weight: 800; color: #fff;
  }
  .topbar-name { font-size: 13px; font-weight: 700; color: #111; line-height: 1.2; }
  .topbar-role { font-size: 11px; color: #6b7280; }
  .topbar-chevron { font-size: 10px; color: #9ca3af; margin-left: 2px; }

  .topbar-logout {
    display: flex; align-items: center; gap: 6px;
    padding: 7px 16px; border-radius: 8px;
    border: 1px solid #fecaca; background: #fef2f2;
    cursor: pointer; font-size: 13px; font-weight: 600; color: #dc2626;
    transition: background 0.15s; white-space: nowrap;
  }
  .topbar-logout:hover { background: #fee2e2; border-color: #fca5a5; }

  /* ══════════════════════════════════
     CONTENT
  ══════════════════════════════════ */
  .page-content {
    flex: 1; overflow-y: auto;
    padding: 24px; background: #f0f2f5;
  }

  /* ══════════════════════════════════
     MOBILE
  ══════════════════════════════════ */
  .mobile-menu-btn {
    display: none; position: fixed; bottom: 20px; right: 20px; z-index: 200;
    width: 52px; height: 52px; background: #2563eb; border-radius: 50%;
    border: none; cursor: pointer; color: #fff; font-size: 22px;
    box-shadow: 0 4px 16px rgba(37,99,235,0.4);
    align-items: center; justify-content: center;
  }
  .mobile-overlay { display: none; }
  @media (max-width: 768px) {
    .sidebar { position: fixed; left: -255px; top: 0; bottom: 0; z-index: 300; transition: left 0.25s; }
    .sidebar.open { left: 0; box-shadow: 8px 0 32px rgba(0,0,0,0.3); }
    .mobile-overlay { display: block; position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 299; }
    .mobile-menu-btn { display: flex; }
    .topbar-name, .topbar-role, .topbar-breadcrumb { display: none; }
  }
`;

const subLabels: Record<string,string> = {
  sa_users:     "Users",
  sa_tenants:   "Tenants",
  all_staff:    "All Staff",
  all_roles:    "All Roles",
};

const mainLabels: Record<string,string> = {
  user_mgmt:   "User Management",
  superadmin:  "Super Admin",
  staff_roles: "Staff & Roles",
  messages:    "Messages",
  dashboard:   "Dashboard",
  pos:         "POS",
  products:    "Products",
  inventory:   "Inventory",
  customers:   "Customers",
  suppliers:   "Suppliers",
  purchases:   "Purchases",
  accounting:  "Accounting",
  reports:     "Reports",
  settings:     "Settings",
  subscription: "Subscription",
  sa_accounts:  "Accounts",
  sa_settings:  "Settings",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const sessionData = useSession();
  const session = sessionData?.data;
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedKeys, setExpandedKeys] = useState<Record<string,boolean>>({user_mgmt:true,staff_roles:true});
  const { lang, t, setLang } = useLang();
  const role = (session?.user as any)?.role;
  const filteredNav = navItems.filter((item) => !role || item.roles.includes(role));
  const userName = session?.user?.name || "User";
  const tenantName = (session?.user as any)?.tenantName || (session?.user as any)?.tenantSlug || "PhidPOS";
  const userEmail = session?.user?.email || "";
  const initial = userName.charAt(0).toUpperCase();

  // Derive page label from pathname
  const activeItem = filteredNav.find(n => pathname === n.href || pathname.startsWith(n.href + "/"));
  let currentLabel = mainLabels[activeItem?.key || ""] || activeItem?.key || "Dashboard";
  // Check if we're on a sub-page
  for (const item of filteredNav) {
    if (item.sub) {
      const activeSub = item.sub.find(s => pathname === s.href || pathname.startsWith(s.href + "/"));
      if (activeSub) { currentLabel = subLabels[activeSub.key] || activeSub.key; break; }
    }
  }

  const roleLabel = role === "SUPER_ADMIN" ? "Super Admin" : role?.replace(/_/g, " ") || "User";
  const displayName = role === "SUPER_ADMIN" ? "Admin" : userName;

  function toggleExpand(key: string) {
    setExpandedKeys(p => ({ ...p, [key]: !p[key] }));
  }

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
            <div className="nav-section-label">Main Menu</div>
            {filteredNav.map((item, idx) => {
              const isExpanded = expandedKeys[item.key];
              const hasSubMenu = item.sub && item.sub.length > 0;
              const isParentActive = pathname === item.href || pathname.startsWith(item.href + "/");
              const label = mainLabels[item.key] || t[item.key as keyof typeof t] || item.key;

              // Divider before settings and messages
              const showDivider = (item.key === "settings" || item.key === "messages") && idx > 0;

              return (
                <div key={item.key}>
                  {showDivider && <div className="sidebar-divider" />}
                  {hasSubMenu ? (
                    <div
                      className={`nav-item${isParentActive ? " active" : ""}${isExpanded ? " expanded" : ""}`}
                      onClick={() => toggleExpand(item.key)}
                    >
                      <span className="nav-icon-wrap">{item.icon}</span>
                      {label}
                      <span className="nav-chevron">›</span>
                    </div>
                  ) : (
                    <Link
                      href={item.href}
                      className={`nav-item${isParentActive && !hasSubMenu ? " active" : ""}`}
                      onClick={() => setSidebarOpen(false)}
                    >
                      <span className="nav-icon-wrap">{item.icon}</span>
                      {label}
                      <span className="nav-chevron">›</span>
                    </Link>
                  )}

                  {hasSubMenu && isExpanded && (
                    <div className="submenu">
                      <div className="submenu-inner">
                        {item.sub!.map(s => {
                          const subActive = pathname === s.href || (s.href !== item.href && pathname.startsWith(s.href + "/"));
                          const subLabel = subLabels[s.key] || s.key;
                          return (
                            <Link key={s.href} href={s.href} className={`sub-item${subActive ? " active" : ""}`}
                              onClick={() => setSidebarOpen(false)}>
                              {subLabel}
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="sidebar-footer">
            <div className="sidebar-user">
              <div className="sidebar-avatar">{initial}</div>
              <div className="sidebar-user-info">
                <div className="sidebar-user-name">{displayName}</div>
                <div className="sidebar-user-role">{roleLabel}</div>
                {userEmail && <div className="sidebar-user-email">{userEmail}</div>}
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
                  <div className="topbar-name">{displayName}</div>
                  <div className="topbar-role">{roleLabel}</div>
                </div>
                <span className="topbar-chevron">▼</span>
              </div>
              {/* Logout */}
              <button className="topbar-logout" onClick={() => signOut({ callbackUrl: "/login" })}>
                🚪 {t.signOut}
              </button>
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
