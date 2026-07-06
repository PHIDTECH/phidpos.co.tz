"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, ShoppingCart, Package, Users, Truck, ShoppingBag,
  BarChart3, Settings, LogOut, Menu, X, ChevronDown, Store,
  BookOpen, Bell, Tag, CreditCard, Wifi, WifiOff
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useOnlineStatus } from "@/hooks/use-online-status";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["SUPER_ADMIN","TENANT_ADMIN","STORE_MANAGER","CASHIER","ACCOUNTANT"] },
  { href: "/pos", label: "POS / Sales", icon: ShoppingCart, roles: ["TENANT_ADMIN","STORE_MANAGER","CASHIER"] },
  { href: "/products", label: "Products", icon: Package, roles: ["TENANT_ADMIN","STORE_MANAGER","ACCOUNTANT"] },
  { href: "/inventory", label: "Inventory", icon: Store, roles: ["TENANT_ADMIN","STORE_MANAGER"] },
  { href: "/customers", label: "Customers", icon: Users, roles: ["TENANT_ADMIN","STORE_MANAGER","CASHIER"] },
  { href: "/suppliers", label: "Suppliers", icon: Truck, roles: ["TENANT_ADMIN","STORE_MANAGER"] },
  { href: "/purchases", label: "Purchases", icon: ShoppingBag, roles: ["TENANT_ADMIN","STORE_MANAGER"] },
  { href: "/accounting", label: "Accounting", icon: BookOpen, roles: ["TENANT_ADMIN","ACCOUNTANT"] },
  { href: "/reports", label: "Reports", icon: BarChart3, roles: ["TENANT_ADMIN","STORE_MANAGER","ACCOUNTANT"] },
  { href: "/settings", label: "Settings", icon: Settings, roles: ["TENANT_ADMIN"] },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const sessionData = useSession(); const session = sessionData?.data;
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isOnline = useOnlineStatus();
  const role = session?.user?.role;

  const filteredNav = navItems.filter((item) => !role || item.roles.includes(role));

  const Sidebar = ({ mobile = false }: { mobile?: boolean }) => (
    <div className={cn("flex flex-col h-full", mobile ? "w-full" : "w-64")}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-sidebar-border">
        <div className="w-9 h-9 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
          <ShoppingCart className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="font-bold text-sidebar-foreground text-sm">PhidPOS</p>
          <p className="text-xs text-sidebar-foreground/60 truncate max-w-[140px]">
            {session?.user?.name}
          </p>
        </div>
      </div>

      {/* Online Status */}
      <div className={cn("mx-4 mt-3 px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5",
        isOnline ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
      )}>
        {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
        {isOnline ? "Online" : "Offline Mode"}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {filteredNav.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-sidebar-border space-y-0.5">
        <Link href="/subscription" onClick={() => setSidebarOpen(false)}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
        >
          <CreditCard className="w-4 h-4" />
          Subscription
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-sidebar flex-shrink-0 border-r border-sidebar-border">
        <Sidebar />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-72 bg-sidebar flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-sidebar-border">
              <span className="text-sidebar-foreground font-bold">Menu</span>
              <button onClick={() => setSidebarOpen(false)} className="text-sidebar-foreground/60 hover:text-sidebar-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            <Sidebar mobile />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="h-14 border-b bg-background flex items-center justify-between px-4 flex-shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-1.5 rounded-lg hover:bg-muted">
            <Menu className="w-5 h-5" />
          </button>
          <div className="hidden lg:block">
            <h2 className="text-sm font-semibold text-muted-foreground">
              {filteredNav.find(n => pathname.startsWith(n.href))?.label || "Dashboard"}
            </h2>
          </div>
          <div className="flex items-center gap-3 ml-auto">
            <div className={cn("hidden sm:flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium",
              isOnline ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
            )}>
              {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
              {isOnline ? "Online" : "Offline"}
            </div>
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
              {session?.user?.name?.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
